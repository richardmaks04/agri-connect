const Question = require('../models/Question');
const User = require('../models/User');

// ─── GET /api/community/questions ────────────────────────────────────────────
exports.getQuestions = async (req, res, next) => {
  try {
    const { specialization, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (specialization) filter.specialization = specialization;
    if (status) filter.status = status;

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .populate('author', 'profile.fullName profile.avatar role')
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Question.countDocuments(filter),
    ]);

    res.json({ questions, pagination: { page: parseInt(page), total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/community/questions ───────────────────────────────────────────
exports.createQuestion = async (req, res, next) => {
  try {
    const { title, content, specialization, tags } = req.body;

    const question = await Question.create({
      title,
      content,
      specialization: specialization || 'general',
      tags,
      author: req.user._id,
      authorName: req.user.profile.fullName,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'statistics.questionsAsked': 1 },
    });

    res.status(201).json({ message: 'Question posted.', question });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/community/questions/:id/answers ────────────────────────────────
exports.postAnswer = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    const answer = {
      author: req.user._id,
      authorName: req.user.profile.fullName,
      authorRole: req.user.role,
      isExpert: ['expert', 'extension', 'admin'].includes(req.user.role),
      content: req.body.content,
    };

    question.answers.push(answer);
    if (question.status === 'open') question.status = 'answered';
    await question.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'statistics.answersProvided': 1 },
    });

    res.status(201).json({ message: 'Answer posted.', answer });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/community/questions/:id/answers/:answerId/helpful ──────────────
exports.markHelpful = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    const answer = question.answers.id(req.params.answerId);
    if (!answer) return res.status(404).json({ error: 'Answer not found.' });

    const alreadyVoted = answer.helpfulVoters.includes(req.user._id);
    if (alreadyVoted) {
      answer.helpful = Math.max(0, answer.helpful - 1);
      answer.helpfulVoters.pull(req.user._id);
    } else {
      answer.helpful += 1;
      answer.helpfulVoters.push(req.user._id);
      // Reward the answer author
      await User.findByIdAndUpdate(answer.author, {
        $inc: { 'statistics.helpfulVotes': 1, 'social.reputation': 5 },
      });
    }

    await question.save();
    res.json({ helpful: answer.helpful, voted: !alreadyVoted });
  } catch (error) {
    next(error);
  }
};

// ─── PUT /api/community/questions/:id/resolve ─────────────────────────────────
exports.resolveQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found.' });

    if (question.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only the question author can mark it as resolved.' });
    }

    question.status = 'resolved';
    if (req.body.acceptedAnswerId) {
      const answer = question.answers.id(req.body.acceptedAnswerId);
      if (answer) answer.accepted = true;
    }

    await question.save();
    res.json({ message: 'Question resolved.', question });
  } catch (error) {
    next(error);
  }
};
