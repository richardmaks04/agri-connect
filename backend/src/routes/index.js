// ═══════════════════════════════════════════════════════════════════════════════
// routes/content.js
// ═══════════════════════════════════════════════════════════════════════════════
const express = require('express');
const contentController = require('../controllers/contentController');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');

const contentRouter = express.Router();

contentRouter.get('/', protect, contentController.getFeed);
contentRouter.get('/:id', optionalAuth, contentController.getOne);
contentRouter.post('/', protect, restrictTo('expert', 'extension', 'admin'), contentController.create);
contentRouter.post('/:id/save', protect, contentController.saveContent);
contentRouter.post('/:id/like', protect, contentController.likeContent);

// ═══════════════════════════════════════════════════════════════════════════════
// routes/community.js
// ═══════════════════════════════════════════════════════════════════════════════
const communityRouter = express.Router();
const communityController = require('../controllers/communityController');

communityRouter.get('/questions', communityController.getQuestions);
communityRouter.post('/questions', protect, communityController.createQuestion);
communityRouter.post('/questions/:id/answers', protect, communityController.postAnswer);
communityRouter.post('/questions/:id/answers/:answerId/helpful', protect, communityController.markHelpful);
communityRouter.put('/questions/:id/resolve', protect, communityController.resolveQuestion);

// ═══════════════════════════════════════════════════════════════════════════════
// routes/search.js
// ═══════════════════════════════════════════════════════════════════════════════
const searchRouter = express.Router();
const searchController = require('../controllers/searchController');

searchRouter.get('/', optionalAuth, searchController.search);
searchRouter.get('/suggestions', searchController.suggestions);

// ═══════════════════════════════════════════════════════════════════════════════
// routes/users.js
// ═══════════════════════════════════════════════════════════════════════════════
const usersRouter = express.Router();
const User = require('../models/User');

// GET profile
usersRouter.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('statistics.contentSaved', 'title summary contentType publishedAt');
  res.json({ user: user.toPublicProfile() });
});

// PUT update profile
usersRouter.put('/profile', protect, async (req, res, next) => {
  try {
    const allowedFields = ['profile.fullName', 'profile.preferredLanguage', 'profile.bio',
      'profile.location', 'profile.farmingSpecializations', 'profile.learningPreferences', 'settings'];
    const updates = {};
    allowedFields.forEach(field => {
      const key = field.split('.').pop();
      if (req.body[key] !== undefined) updates[field] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    res.json({ message: 'Profile updated.', user: user.toPublicProfile() });
  } catch (error) {
    next(error);
  }
});

// GET saved content
usersRouter.get('/saved', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('statistics.contentSaved');
    res.json({ saved: user.statistics.contentSaved });
  } catch (error) {
    next(error);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// routes/admin.js
// ═══════════════════════════════════════════════════════════════════════════════
const adminRouter = express.Router();
const Content = require('../models/Content');

// Protect ALL admin routes
adminRouter.use(protect, restrictTo('admin'));

// GET all users
adminRouter.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 50, role } = req.query;
    const filter = role ? { role } : {};
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash -refreshToken').skip((page-1)*limit).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ users, total });
  } catch (error) { next(error); }
});

// PUT approve content
adminRouter.put('/content/:id/approve', async (req, res, next) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishedAt: new Date() },
      { new: true }
    );
    if (!content) return res.status(404).json({ error: 'Content not found.' });
    res.json({ message: 'Content approved and published.', content });
  } catch (error) { next(error); }
});

// GET platform analytics
adminRouter.get('/analytics', async (req, res, next) => {
  try {
    const [totalUsers, totalContent, pendingContent, totalQuestions] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Content.countDocuments({ status: 'published' }),
      Content.countDocuments({ status: 'pending' }),
      require('../models/Question').countDocuments(),
    ]);
    res.json({ totalUsers, totalContent, pendingContent, totalQuestions });
  } catch (error) { next(error); }
});

// DELETE / suspend user
adminRouter.put('/users/:id/suspend', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User suspended.', user: user.toPublicProfile() });
  } catch (error) { next(error); }
});

module.exports = {
  authRoutes: require('./auth'),
  contentRoutes: contentRouter,
  communityRoutes: communityRouter,
  searchRoutes: searchRouter,
  userRoutes: usersRouter,
  adminRoutes: adminRouter,
};
