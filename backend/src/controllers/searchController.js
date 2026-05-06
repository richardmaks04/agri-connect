const Content = require('../models/Content');
const Question = require('../models/Question');
const User = require('../models/User');

// ─── GET /api/search?q=maize&type=content&specialization=cereal_crops ─────────
exports.search = async (req, res, next) => {
  try {
    const { q, type = 'all', specialization, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters.' });
    }

    const skip = (page - 1) * limit;
    const results = {};

    // MongoDB text search (requires text index on the collection)
    const textSearchFilter = { $text: { $search: q }, status: 'published' };
    if (specialization) textSearchFilter['metadata.farmingSpecializations'] = specialization;

    if (type === 'all' || type === 'content') {
      results.content = await Content.find(textSearchFilter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();
    }

    if (type === 'all' || type === 'questions') {
      const qFilter = { $text: { $search: q } };
      if (specialization) qFilter.specialization = specialization;
      results.questions = await Question.find(qFilter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();
    }

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [
          { 'profile.fullName': { $regex: q, $options: 'i' } },
          { 'profile.farmingSpecializations.primary': { $regex: q, $options: 'i' } },
        ],
        isActive: true,
      })
        .select('profile.fullName profile.avatar profile.location role social.reputation')
        .limit(10)
        .lean();
    }

    res.json({ query: q, results });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/search/suggestions?q=ma ────────────────────────────────────────
exports.suggestions = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 1) return res.json({ suggestions: [] });

    const suggestions = await Content.find(
      { title: { $regex: q, $options: 'i' }, status: 'published' },
      { title: 1 }
    ).limit(5).lean();

    res.json({ suggestions: suggestions.map(s => ({ id: s._id, title: s.title })) });
  } catch (error) {
    next(error);
  }
};
