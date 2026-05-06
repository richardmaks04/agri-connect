const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  titleLocalized: {
    en: String, ha: String, yo: String, ig: String,
  },
  content: { type: String, required: true },
  contentLocalized: {
    en: String, ha: String, yo: String, ig: String,
  },
  summary: { type: String, maxlength: 500 },
  contentType: {
    type: String,
    enum: ['article', 'video', 'guide', 'infographic'],
    default: 'article',
  },
  author: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    role: String,
  },
  // ── Metadata drives the personalisation engine ──────────────────────────────
  metadata: {
    farmingSpecializations: [{
      type: String,
      enum: ['cereal_crops', 'poultry', 'fisheries', 'horticulture', 'legumes', 'general'],
    }],
    crops: [String],
    livestock: [String],
    topics: [String],             // e.g. ['pest_management', 'fertilization']
    regions: [String],            // e.g. ['southwest', 'northwest', 'all']
    seasons: [String],            // e.g. ['dry_season', 'wet_season', 'all']
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    // Tag vector used for content-based collaborative filtering
    tagVector: [Number],
  },
  media: [{
    type: { type: String, enum: ['image', 'video', 'document'] },
    url: String,
    thumbnail: String,
    caption: String,
    duration: Number, // seconds, for video
  }],
  references: [String],
  statistics: {
    views: { type: Number, default: 0 },
    saves: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratings: [{
      userId: mongoose.Schema.Types.ObjectId,
      rating: Number,
    }],
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'published', 'archived'],
    default: 'draft',
  },
  tags: [String],
  publishedAt: Date,
}, {
  timestamps: true,
});

// ─── Text index for MongoDB Atlas Search / full-text search ──────────────────
contentSchema.index({ title: 'text', content: 'text', tags: 'text' });
contentSchema.index({ 'metadata.farmingSpecializations': 1, status: 1 });
contentSchema.index({ status: 1, publishedAt: -1 });

module.exports = mongoose.model('Content', contentSchema);
