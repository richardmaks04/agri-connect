const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String,
  authorRole: String,
  isExpert: { type: Boolean, default: false },
  content: { type: String, required: true },
  attachments: [String],
  helpful: { type: Number, default: 0 },
  helpfulVoters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  accepted: { type: Boolean, default: false },
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: String,
  specialization: {
    type: String,
    enum: ['cereal_crops', 'poultry', 'fisheries', 'horticulture', 'legumes', 'general'],
    default: 'general',
  },
  tags: [String],
  attachments: [String],
  answers: [answerSchema],
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: {
    type: String,
    enum: ['open', 'answered', 'resolved'],
    default: 'open',
  },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

questionSchema.index({ specialization: 1, status: 1 });
questionSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Question', questionSchema);
