/**
 * seedPlaceholderArticles.js
 *
 * Seeds 25 placeholder articles (5 per Agri-Connect specialisation) into the
 * Content collection in MongoDB Atlas, so the article/content page has
 * something to render while real content is being written.
 *
 * SCHEMA NOTE:
 * This script targets the Content collection fields as documented in
 * Final Year Project, Chapter 3, Section 3.10.2:
 *   _id, title, titleLocalised, content, contentLocalised, contentType,
 *   author, metadata, media, statistics, status, publishedAt, createdAt, updatedAt
 *
 * If your actual backend/models/Content.js uses slightly different field
 * names, update either this script's `buildDoc()` function below, or your
 * Mongoose model, so the two agree. The fields most likely to need
 * adjustment are flagged with "ADJUST IF NEEDED" comments.
 *
 * USAGE:
 *   1. Place this file in your backend project (e.g. backend/scripts/).
 *   2. Place placeholderArticles.json in the same folder.
 *   3. Make sure MONGODB_URI is set in your backend's .env file
 *      (the same connection string your Express app already uses).
 *   4. Run from the backend project root:
 *        node scripts/seedPlaceholderArticles.js
 *
 *      Optional flags:
 *        --clear   Deletes existing placeholder articles (isPlaceholder: true)
 *                  before inserting new ones. Safe to re-run.
 *
 *   Example:
 *        node scripts/seedPlaceholderArticles.js --clear
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error(
    '❌ No MongoDB connection string found. Set MONGODB_URI (or MONGO_URI) in your .env file.'
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Content schema (inline fallback)
//
// ADJUST IF NEEDED: If you already have a Content model at
// backend/models/Content.js, you can delete this inline schema and instead
// do: const Content = require('../models/Content');
// Keeping it inline here means this script works standalone even before
// your real model file is wired up.
// ---------------------------------------------------------------------------
const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    titleLocalised: {
      en: String,
      ha: String,
      yo: String,
      ig: String,
    },
    content: { type: String, required: true },
    contentLocalised: {
      en: String,
      ha: String,
      yo: String,
      ig: String,
    },
    contentType: {
      type: String,
      enum: ['article', 'video', 'guide', 'infographic'],
      default: 'article',
    },
    author: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'Agri-Connect Team' },
      role: { type: String, default: 'Content Expert' },
    },
    metadata: {
      farmingSpecialisations: [String], // cereal_crops | poultry | fisheries | vegetables | legumes
      crops: [String],
      topics: [String],
      regions: [String],
      seasons: [String],
      difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
      },
    },
    media: [
      {
        type: { type: String },
        url: String,
        thumbnail: String,
        caption: String,
      },
    ],
    statistics: {
      views: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'archived'],
      default: 'published',
    },
    isPlaceholder: { type: Boolean, default: true }, // lets you find/remove these later
    publishedAt: Date,
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

// Avoid OverwriteModelError if a Content model is already registered elsewhere
const Content =
  mongoose.models.Content || mongoose.model('Content', contentSchema);

// ---------------------------------------------------------------------------
// Build a Mongoose-ready document from a raw JSON article entry
// ---------------------------------------------------------------------------
function buildDoc(article) {
  return {
    title: article.title,
    titleLocalised: { en: article.title },
    content: article.content,
    contentLocalised: { en: article.content },
    contentType: article.contentType || 'article',
    author: {
      name: 'Agri-Connect Team',
      role: 'Content Expert',
    },
    metadata: {
      farmingSpecialisations: article.metadata.farmingSpecialisations || [],
      crops: article.metadata.crops || [],
      topics: article.metadata.topics || [],
      regions: article.metadata.regions || [],
      seasons: article.metadata.seasons || [],
      difficulty: article.metadata.difficulty || 'beginner',
    },
    media: article.media || [],
    statistics: {
      views: 0,
      saves: 0,
      shares: 0,
      likes: 0,
      averageRating: 0,
    },
    status: article.status || 'published',
    isPlaceholder: true,
    publishedAt: new Date(),
  };
}

async function seed() {
  const shouldClear = process.argv.includes('--clear');

  const jsonPath = path.join(__dirname, 'placeholderArticles.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Could not find placeholderArticles.json at ${jsonPath}`);
    console.error('   Make sure it sits in the same folder as this script.');
    process.exit(1);
  }

  const rawArticles = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`🔌 Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.');

  if (shouldClear) {
    const { deletedCount } = await Content.deleteMany({ isPlaceholder: true });
    console.log(`🧹 Cleared ${deletedCount} existing placeholder article(s).`);
  }

  const docs = rawArticles.map(buildDoc);

  const inserted = await Content.insertMany(docs);
  console.log(`🌱 Inserted ${inserted.length} placeholder articles:`);

  const bySpec = {};
  inserted.forEach((doc) => {
    const spec = doc.metadata.farmingSpecialisations[0] || 'unspecified';
    bySpec[spec] = (bySpec[spec] || 0) + 1;
  });
  Object.entries(bySpec).forEach(([spec, count]) => {
    console.log(`   - ${spec}: ${count} article(s)`);
  });

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
