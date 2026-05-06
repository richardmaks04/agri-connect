const Content = require('../models/Content');
const User = require('../models/User');
const { getPersonalisedFeed } = require('../services/personalisationService');

// ─── GET /api/content — Personalised feed ────────────────────────────────────
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const items = await getPersonalisedFeed(req.user, parseInt(limit), skip);
    const total = await Content.countDocuments({ status: 'published' });

    res.json({
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/content/:id — Single article ────────────────────────────────────
exports.getOne = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id)
      .populate('author.userId', 'profile.fullName profile.avatar role');

    if (!content || content.status !== 'published') {
      return res.status(404).json({ error: 'Content not found.' });
    }

    // Increment view count
    content.statistics.views += 1;
    await content.save();

    // Log interaction in user history for personalisation
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          'statistics.interactionHistory': {
            contentId: content._id,
            action: 'view',
            $slice: -100, // Keep only last 100 interactions
          },
        },
      });
    }

    res.json({ content });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/content — Create article (experts/admins only) ─────────────────
exports.create = async (req, res, next) => {
  try {
    const { title, content, summary, contentType, metadata, tags } = req.body;

    const newContent = await Content.create({
      title,
      content,
      summary,
      contentType: contentType || 'article',
      author: {
        userId: req.user._id,
        name: req.user.profile.fullName,
        role: req.user.role,
      },
      metadata,
      tags,
      status: req.user.role === 'admin' ? 'published' : 'pending',
    });

    if (req.user.role === 'admin') {
      newContent.publishedAt = new Date();
      await newContent.save();
    }

    res.status(201).json({
      message: req.user.role === 'admin'
        ? 'Content published successfully.'
        : 'Content submitted for review.',
      content: newContent,
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/content/:id/save ───────────────────────────────────────────────
exports.saveContent = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found.' });

    const user = await User.findById(req.user._id);
    const alreadySaved = user.statistics.contentSaved.includes(content._id);

    if (alreadySaved) {
      user.statistics.contentSaved.pull(content._id);
      content.statistics.saves = Math.max(0, content.statistics.saves - 1);
    } else {
      user.statistics.contentSaved.push(content._id);
      content.statistics.saves += 1;
      await User.findByIdAndUpdate(req.user._id, {
        $push: { 'statistics.interactionHistory': { contentId: content._id, action: 'save' } },
      });
    }

    await Promise.all([user.save(), content.save()]);
    res.json({ saved: !alreadySaved, message: alreadySaved ? 'Removed from saved.' : 'Saved for offline reading.' });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/content/:id/like ───────────────────────────────────────────────
exports.likeContent = async (req, res, next) => {
  try {
    const content = await Content.findById(req.params.id);
    if (!content) return res.status(404).json({ error: 'Content not found.' });

    content.statistics.likes += 1;
    await content.save();

    await User.findByIdAndUpdate(req.user._id, {
      $push: { 'statistics.interactionHistory': { contentId: content._id, action: 'like' } },
    });

    res.json({ likes: content.statistics.likes });
  } catch (error) {
    next(error);
  }
};
