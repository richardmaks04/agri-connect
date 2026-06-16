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

const RECENCY_LAMBDA = 0.1;

/**
 * S_spec: Specialisation Match Score
 * 1.0 = primary match | 0.6 = secondary match | 0.5 = cold start | 0.0 = no match
 */
function computeSpecScore(content, user) {
  const userSpecs = user.profile?.farmingSpecializations || [];
  if (userSpecs.length === 0) return 0.5;

  const contentSpecs = content.metadata?.farmingSpecializations || [];
  if (contentSpecs.includes('general')) return 0.5;

  for (const userSpec of userSpecs) {
    if (contentSpecs.includes(userSpec.primary)) return 1.0;
    const secondaries = userSpec.secondary || [];
    if (secondaries.some(s => contentSpecs.includes(s))) return 0.6;
  }
  return 0.0;
}

/**
 * S_collab: Collaborative Filtering Score
 * Engagement from users with the same primary specialisation.
 * Falls back to 0 if fewer than 10 similar users exist (cold start).
 */
async function computeCollabScore(content, user) {
  try {
    const userPrimary = user.profile?.farmingSpecializations?.[0]?.primary;
    if (!userPrimary) return 0;

    const similarUserCount = await User.countDocuments({
      'profile.farmingSpecializations.primary': userPrimary,
      _id: { $ne: user._id },
    });

    if (similarUserCount < 10) return 0;

    const engagedCount = await User.countDocuments({
      'profile.farmingSpecializations.primary': userPrimary,
      _id: { $ne: user._id },
      $or: [
        { 'statistics.contentSaved': content._id },
        {
          'statistics.interactionHistory': {
            $elemMatch: { contentId: content._id, action: { $in: ['like', 'save'] } },
          },
        },
      ],
    });

    return Math.min(engagedCount / similarUserCount, 1.0);
  } catch (_) {
    return 0;
  }
}

/**
 * S_content: Content-Based Score
 *
 * FIX: The original implementation tried to access `contentId.metadata` inside
 * interactionHistory, but `contentId` is a plain ObjectId (not populated) when
 * the user document is fetched normally. This meant the tag-frequency map was
 * always empty and the function always returned 0.
 *
 * Solution: Batch-fetch the content documents for the user's recent interactions
 * once, build the tag-frequency map from those documents, then compute the
 * dot-product similarity. This is more accurate and actually works.
 */
async function computeContentScore(content, user) {
  const history = user.statistics?.interactionHistory || [];
  if (history.length === 0) return 0;

  const recentHistory = history.slice(-50);
  const recentIds = recentHistory.map(h => h.contentId).filter(Boolean);

  if (recentIds.length === 0) return 0;

  // Fetch the actual content documents so we can read their metadata/tags
  const historicContent = await Content.find(
    { _id: { $in: recentIds } },
    { 'metadata.farmingSpecializations': 1, 'metadata.crops': 1, 'metadata.topics': 1 }
  ).lean();

  // Build a tag-frequency map from the user's history
  const tagFrequency = {};
  let totalTagCount = 0;

  for (const hc of historicContent) {
    const tags = [
      ...(hc.metadata?.farmingSpecializations || []),
      ...(hc.metadata?.crops || []),
      ...(hc.metadata?.topics || []),
    ];
    for (const tag of tags) {
      tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      totalTagCount++;
    }
  }

  if (totalTagCount === 0) return 0;

  // Tags from the candidate content item
  const contentTags = new Set([
    ...(content.metadata?.farmingSpecializations || []),
    ...(content.metadata?.crops || []),
    ...(content.metadata?.topics || []),
  ]);

  // Dot product (simplified cosine similarity — denominator normalised by totalTagCount)
  let dotProduct = 0;
  for (const tag of contentTags) {
    dotProduct += (tagFrequency[tag] || 0) / totalTagCount;
  }

  return Math.min(dotProduct, 1.0);
}

/**
 * R_recency: Exponential decay — newer content scores higher.
 * exp(-λ × days_since_published)
 */
function computeRecencyScore(content) {
  if (!content.publishedAt) return 0.5;
  const daysSincePublished =
    (Date.now() - new Date(content.publishedAt)) / (1000 * 60 * 60 * 24);
  return Math.exp(-RECENCY_LAMBDA * daysSincePublished);
}

/**
 * isNewUser: Cold-start detection — fewer than 5 interactions.
 */
function isNewUser(user) {
  return (user.statistics?.interactionHistory?.length || 0) < 5;
}

/**
 * scoreContent: Compute final weighted score for one content item.
 */
async function scoreContent(content, user) {
  const specScore = computeSpecScore(content, user);

  if (isNewUser(user)) {
    return specScore; // Cold start: pure specialisation match
  }

  const [collabScore, contentScore, recencyScore] = await Promise.all([
    computeCollabScore(content, user),
    computeContentScore(content, user),
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
 * getPersonalisedFeed: Returns sorted, scored content for a user.
 * @param {Object} user  - The logged-in user document
 * @param {number} limit - Items to return
 * @param {number} skip  - Pagination offset
 */
async function getPersonalisedFeed(user, limit = 20, skip = 0) {
  try {
    const candidatePool = await Content.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(100)
      .lean();

    const scored = await Promise.all(
      candidatePool.map(async (content) => ({
        content,
        score: await scoreContent(content, user),
      }))
    );

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(skip, skip + limit).map(({ content, score }) => ({
      ...content,
      _relevanceScore: Math.round(score * 100) / 100,
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
