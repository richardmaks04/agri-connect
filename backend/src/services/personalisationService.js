/**
 * Agri-Connect Personalisation Engine
 * Implements the scoring formula from Section 3.9 of the project report:
 *
 * Score(c, u) = α × S_spec + β × S_collab + γ × S_content + δ × R_recency
 *
 * Default weights: α=0.40, β=0.25, γ=0.20, δ=0.15
 */

const Content = require('../models/Content');
const User = require('../models/User');

// ─── Default algorithm weights ────────────────────────────────────────────────
const WEIGHTS = {
  alpha: 0.40,  // Specialisation match
  beta:  0.25,  // Collaborative score
  gamma: 0.20,  // Content-based (interaction history)
  delta: 0.15,  // Recency
};

const RECENCY_LAMBDA = 0.1; // Controls how fast recency score decays

/**
 * S_spec: Specialisation Match Score
 * 1.0 = content matches user's primary specialization
 * 0.6 = content matches a secondary specialization
 * 0.0 = no match
 */
function computeSpecScore(content, user) {
  const userSpecs = user.profile?.farmingSpecializations || [];
  if (userSpecs.length === 0) return 0.5; // Cold start: neutral score

  const contentSpecs = content.metadata?.farmingSpecializations || [];
  if (contentSpecs.includes('general')) return 0.5; // General content gets neutral score

  for (const userSpec of userSpecs) {
    if (contentSpecs.includes(userSpec.primary)) return 1.0;
    const secondaries = userSpec.secondary || [];
    if (secondaries.some(s => contentSpecs.includes(s))) return 0.6;
  }
  return 0.0;
}

/**
 * S_collab: Collaborative Filtering Score
 * Measures engagement from users with the same primary specialisation.
 * Falls back to 0 if fewer than 10 similar users exist.
 */
async function computeCollabScore(content, user) {
  try {
    const userPrimary = user.profile?.farmingSpecializations?.[0]?.primary;
    if (!userPrimary) return 0;

    const similarUserCount = await User.countDocuments({
      'profile.farmingSpecializations.primary': userPrimary,
      _id: { $ne: user._id },
    });

    if (similarUserCount < 10) return 0; // Not enough data — cold start fallback

    // Count how many similar users saved or liked this content
    const engagedCount = await User.countDocuments({
      'profile.farmingSpecializations.primary': userPrimary,
      _id: { $ne: user._id },
      $or: [
        { 'statistics.contentSaved': content._id },
        { 'statistics.interactionHistory': { $elemMatch: { contentId: content._id, action: { $in: ['like', 'save'] } } } },
      ],
    });

    return Math.min(engagedCount / similarUserCount, 1.0);
  } catch (_) {
    return 0;
  }
}

/**
 * S_content: Content-Based Score
 * Cosine similarity between content tags and user's historical engagement tags.
 */
function computeContentScore(content, user) {
  const history = user.statistics?.interactionHistory || [];
  if (history.length === 0) return 0;

  const contentTags = new Set([
    ...(content.metadata?.farmingSpecializations || []),
    ...(content.metadata?.crops || []),
    ...(content.metadata?.topics || []),
  ]);

  // Build a tag frequency map from user's history (simplified cosine similarity)
  const recentHistory = history.slice(-50); // Only use last 50 interactions
  const tagFrequency = {};
  let totalTagCount = 0;

  recentHistory.forEach(({ contentId }) => {
    // Note: In production, you'd populate contentId; here we use tags if available
    if (contentId && contentId.metadata) {
      const tags = [
        ...(contentId.metadata.farmingSpecializations || []),
        ...(contentId.metadata.crops || []),
        ...(contentId.metadata.topics || []),
      ];
      tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
        totalTagCount++;
      });
    }
  });

  if (totalTagCount === 0) return 0;

  // Dot product of content tags and user history tags
  let dotProduct = 0;
  contentTags.forEach(tag => {
    dotProduct += (tagFrequency[tag] || 0) / totalTagCount;
  });

  return Math.min(dotProduct, 1.0);
}

/**
 * R_recency: Recency Weight
 * Exponential decay: newer content scores higher.
 * exp(-λ × days_since_published)
 */
function computeRecencyScore(content) {
  if (!content.publishedAt) return 0.5;
  const daysSincePublished = (Date.now() - new Date(content.publishedAt)) / (1000 * 60 * 60 * 24);
  return Math.exp(-RECENCY_LAMBDA * daysSincePublished);
}

/**
 * isNewUser: Returns true if user has fewer than 5 interactions
 * Cold-start users get alpha=1.0 (pure specialization matching)
 */
function isNewUser(user) {
  return (user.statistics?.interactionHistory?.length || 0) < 5;
}

/**
 * scoreContent: Compute final weighted score for one content item
 */
async function scoreContent(content, user) {
  const specScore = computeSpecScore(content, user);

  if (isNewUser(user)) {
    // Cold start: pure specialisation match
    return specScore;
  }

  const [collabScore, contentScore, recencyScore] = await Promise.all([
    computeCollabScore(content, user),
    Promise.resolve(computeContentScore(content, user)),
    Promise.resolve(computeRecencyScore(content)),
  ]);

  return (
    WEIGHTS.alpha * specScore +
    WEIGHTS.beta  * collabScore +
    WEIGHTS.gamma * contentScore +
    WEIGHTS.delta * recencyScore
  );
}

/**
 * getPersonalisedFeed: Main function — returns sorted, scored content for a user
 * @param {Object} user - The logged-in user document
 * @param {number} limit - How many items to return
 * @param {number} skip - Pagination offset
 */
async function getPersonalisedFeed(user, limit = 20, skip = 0) {
  try {
    // Fetch a candidate pool of recent published content
    const candidatePool = await Content.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(100) // Score top 100 candidates, then return best `limit`
      .lean();

    // Score all candidates concurrently
    const scored = await Promise.all(
      candidatePool.map(async (content) => ({
        content,
        score: await scoreContent(content, user),
      }))
    );

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Apply pagination and return
    return scored.slice(skip, skip + limit).map(({ content, score }) => ({
      ...content,
      _relevanceScore: Math.round(score * 100) / 100, // Rounded for readability
    }));
  } catch (error) {
    console.error('Personalisation engine error:', error);
    // Graceful fallback: return recent content unpersonalised
    return Content.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
  }
}

module.exports = { getPersonalisedFeed, scoreContent };
