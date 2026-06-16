const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  phoneNumber: {
    type: String,
    trim: true,
    sparse: true,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Never returned in queries by default
  },
  role: {
    type: String,
    enum: ['farmer', 'expert', 'extension', 'admin'],
    default: 'farmer',
  },
  profile: {
    fullName: { type: String, required: true, trim: true },
    preferredLanguage: { type: String, enum: ['en', 'yo', 'ha', 'ig'], default: 'en' },
    avatar: { type: String, default: '' },
    bio: { type: String, max_length: 500 }, // ✅
    location: {
      state: String,
      lga: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    // Core to personalization — what the farmer grows/raises
    farmingSpecializations: [{
      primary: {
        type: String,
        enum: ['cereal_crops', 'poultry', 'fisheries', 'horticulture', 'legumes'],
      },
      secondary: [String],
      experience: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
      crops: [String],        // e.g. ['maize', 'rice']
      livestock: [String],    // e.g. ['broiler', 'layer']
      farmSize: Number,
      farmSizeUnit: { type: String, default: 'hectares' },
    }],
    learningPreferences: {
      contentFormats: [{ type: String, enum: ['text', 'video', 'audio', 'infographic'] }],
      notificationPreference: { type: String, enum: ['all', 'important', 'none'], default: 'important' },
      offlineAccess: { type: Boolean, default: true },
    },
  },
  social: {
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reputation: { type: Number, default: 0 },
    badges: [String],
  },
  statistics: {
    contentSaved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Content' }],
    contentShared: { type: Number, default: 0 },
    questionsAsked: { type: Number, default: 0 },
    answersProvided: { type: Number, default: 0 },
    helpfulVotes: { type: Number, default: 0 },
    // Tracks content interactions for collaborative filtering
    interactionHistory: [{
      contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Content' },
      action: { type: String, enum: ['view', 'save', 'like', 'share'] },
      timestamp: { type: Date, default: Date.now },
    }],
  },
  settings: {
    privacyLevel: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
  },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  lastLogin: Date,
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// ─── Hash password before saving ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

// ─── Instance method: compare password ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Instance method: get public profile (no sensitive fields) ───────────────
userSchema.methods.toPublicProfile = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  return obj;
};

// ─── Index for faster queries ─────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ 'profile.location.state': 1 });
userSchema.index({ 'profile.farmingSpecializations.primary': 1 });

module.exports = mongoose.model('User', userSchema);
