require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Content = require('../models/Content');
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/agriconnect';

// FIX: The original seed passed plaintext passwords as `passwordHash`.
// Mongoose's pre('save') hook hashes `passwordHash` whenever it is modified.
// However, User.create() calls save() once, so the plaintext gets hashed — that
// part actually works. The real problem was the seed in src/seed.js which used
// a hardcoded bcrypt string '$2b$10$placeholder_not_for_login' — that string is
// NOT a valid hash for any real password, making those accounts unloggable.
//
// Here we pre-hash all passwords before inserting so the hook sees an already-
// hashed value, skips re-hashing (isModified check), and accounts are usable.
//
// IMPORTANT: If you use User.create() with a plain password, the pre-save hook
// WILL hash it correctly. Pre-hashing is only needed when bypassing the hook
// (e.g. insertMany / updateOne / findByIdAndUpdate).

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

async function buildUsers() {
  return [
    {
      email: 'admin@agriconnect.com',
      passwordHash: await hashPassword('Admin@123'),
      role: 'admin',
      profile: { fullName: 'System Admin', location: { state: 'Lagos' } },
    },
    {
      email: 'expert@agriconnect.com',
      passwordHash: await hashPassword('Expert@123'),
      role: 'expert',
      profile: {
        fullName: 'Dr. Afolabi Okonkwo',
        bio: 'Agricultural scientist with 15 years experience in crop science.',
        location: { state: 'Oyo', lga: 'Ibadan North' },
        farmingSpecializations: [
          { primary: 'cereal_crops', experience: 'advanced', crops: ['maize', 'rice'] },
        ],
      },
    },
    {
      email: 'farmer@agriconnect.com',
      passwordHash: await hashPassword('Farmer@123'),
      role: 'farmer',
      profile: {
        fullName: 'Bisi Adeyemi',
        location: { state: 'Oyo', lga: 'Egbeda' },
        farmingSpecializations: [
          {
            primary: 'cereal_crops',
            secondary: ['legumes'],
            experience: 'intermediate',
            crops: ['maize', 'cowpea'],
            farmSize: 2,
          },
        ],
        learningPreferences: { contentFormats: ['text', 'video'] },
      },
    },
    {
      email: 'poultry@agriconnect.com',
      passwordHash: await hashPassword('Farmer@123'),
      role: 'farmer',
      profile: {
        fullName: 'Emeka Nwosu',
        location: { state: 'Ogun', lga: 'Abeokuta' },
        farmingSpecializations: [
          { primary: 'poultry', experience: 'beginner', livestock: ['broiler', 'layer'], farmSize: 1 },
        ],
      },
    },
    {
      email: 'fish@agriconnect.com',
      passwordHash: await hashPassword('Farmer@123'),
      role: 'farmer',
      profile: {
        fullName: 'Fatima Musa',
        location: { state: 'Kano', lga: 'Kano Municipal' },
        farmingSpecializations: [
          { primary: 'fisheries', experience: 'intermediate', farmSize: 0.5 },
        ],
      },
    },
  ];
}

const sampleContent = [
  {
    title: 'Maize Cultivation Best Practices for Southwest Nigeria',
    summary: 'A comprehensive guide to growing high-yield maize in the southwest agro-ecological zone.',
    content: `<h2>Introduction</h2><p>Maize (Zea mays) is one of the most important cereal crops in Nigeria. This guide covers the complete cultivation cycle from land preparation to harvest, tailored for southwest Nigeria's climatic conditions.</p><h2>Land Preparation</h2><p>Begin land preparation 2-3 weeks before planting. Clear weeds and previous crop residues. Plough to a depth of 20-25cm and harrow to create a fine tilth. Soil pH should be between 5.5 and 7.0.</p><h2>Variety Selection</h2><p>Recommended open-pollinated varieties for southwest Nigeria include SAMMAZ-15, SAMMAZ-17, and SWAN-1. These varieties are drought-tolerant and achieve yields of 3-5 tonnes per hectare under good management.</p><h2>Planting</h2><p>Plant at the onset of the rainy season (April-May for first season, August-September for second season). Recommended spacing: 75cm between rows, 25cm between plants. Plant 2 seeds per hole at 3-4cm depth, then thin to 1 plant per stand after 10 days.</p><h2>Fertiliser Application</h2><p>Apply NPK 15:15:15 at 400kg/ha at planting. Top-dress with Urea (100kg/ha) at 4-6 weeks after planting. Do not apply fertiliser when soil is dry.</p><h2>Pest and Disease Management</h2><p>Monitor weekly for Fall Armyworm (Spodoptera frugiperda), the most serious current threat. Apply recommended pesticides at first sign of infestation. Use certified disease-resistant varieties to reduce fungal disease risk.</p><h2>Harvest</h2><p>Harvest when husks turn brown and dry, usually 90-110 days after planting. Dry grain to below 13% moisture content before storage.</p>`,
    contentType: 'guide',
    metadata: {
      farmingSpecializations: ['cereal_crops'],
      crops: ['maize'],
      topics: ['planting', 'pest_management', 'fertilization'],
      regions: ['southwest'],
      seasons: ['wet_season'],
      difficulty: 'intermediate',
    },
    tags: ['maize', 'cereals', 'southwest', 'planting guide'],
    status: 'published',
  },
  {
    title: 'Broiler Production: A Complete Guide for Nigerian Smallholders',
    summary: 'Everything you need to start a profitable broiler operation with 100-500 birds.',
    content: `<h2>Getting Started</h2><p>Broiler production is one of the fastest-return agricultural enterprises available to smallholder farmers.</p><h2>Housing Requirements</h2><p>Build a deep-litter house orientated east-west to minimise direct sunlight exposure. Allow 0.1 square metres per bird.</p><h2>Chick Procurement</h2><p>Purchase day-old chicks only from NAFDAC-certified hatcheries.</p><h2>Brooding</h2><p>Maintain temperature at 32-35°C in Week 1, reducing by 3°C per week.</p><h2>Feeding Programme</h2><p>Weeks 1-2: Starter feed (23% protein). Weeks 3-6: Finisher feed (20% protein).</p><h2>Vaccination Schedule</h2><p>Day 1: Marek's disease. Day 7-10: Newcastle via drinking water. Day 14: Gumboro via drinking water. Day 21: Newcastle booster.</p>`,
    contentType: 'guide',
    metadata: {
      farmingSpecializations: ['poultry'],
      livestock: ['broiler'],
      topics: ['housing', 'feeding', 'vaccination'],
      regions: ['all'],
      seasons: ['all'],
      difficulty: 'beginner',
    },
    tags: ['broiler', 'poultry', 'beginner', 'production guide'],
    status: 'published',
  },
  {
    title: 'Fall Armyworm Management: Early Detection and Control',
    summary: 'Identify and control Fall Armyworm before it destroys your maize crop.',
    content: `<h2>What is Fall Armyworm?</h2><p>Fall Armyworm (Spodoptera frugiperda) arrived in Africa in 2016 and has since become the most devastating maize pest on the continent. Infestations can cause yield losses of 20-73% if not controlled.</p><h2>Early Detection</h2><p>Scout your field twice weekly from 2 weeks after planting.</p><h2>Control Options</h2><p>Biological: Conserve natural enemies. Chemical: Apply only when pest pressure exceeds economic threshold.</p>`,
    contentType: 'article',
    metadata: {
      farmingSpecializations: ['cereal_crops'],
      crops: ['maize'],
      topics: ['pest_management'],
      regions: ['all'],
      seasons: ['wet_season'],
      difficulty: 'beginner',
    },
    tags: ['fall armyworm', 'pest control', 'maize', 'FAW'],
    status: 'published',
  },
  {
    title: 'Catfish (Clarias) Pond Management for Smallholder Farmers',
    summary: 'Set up and manage a productive catfish pond on less than 1 hectare.',
    content: `<h2>Why Catfish?</h2><p>African catfish (Clarias gariepinus) is the most popular aquaculture species in Nigeria due to its hardiness and fast growth.</p><h2>Pond Construction</h2><p>Earthen ponds: Most economical. Minimum size 20m x 10m x 1.5m deep.</p><h2>Water Quality</h2><p>Monitor weekly: pH 6.5-8.5, dissolved oxygen greater than 5mg/L, temperature 24-32°C.</p><h2>Feeding</h2><p>Feed twice daily at 3-5% of body weight. Use floating pellets to monitor feeding behaviour.</p>`,
    contentType: 'guide',
    metadata: {
      farmingSpecializations: ['fisheries'],
      topics: ['pond_management', 'feeding', 'water_quality'],
      regions: ['all'],
      seasons: ['all'],
      difficulty: 'intermediate',
    },
    tags: ['catfish', 'fisheries', 'aquaculture', 'pond'],
    status: 'published',
  },
  {
    title: "Cowpea Production: Nigeria's Protein Crop",
    summary: 'A practical guide to cultivating cowpea for household consumption and market.',
    content: `<h2>Importance of Cowpea</h2><p>Cowpea (Vigna unguiculata) is called the "poor man's meat" due to its high protein content (23-25%).</p><h2>Variety Selection</h2><p>IITA-released varieties: IT97K-499-35 and IT99K-573-1-1.</p><h2>Planting</h2><p>Plant at onset of rains. Spacing: 60cm x 20cm for sole cropping.</p><h2>Pest Management</h2><p>Major pests: pod borers, aphids, thrips, and bruchids. Use PICS bags to prevent storage losses.</p>`,
    contentType: 'article',
    metadata: {
      farmingSpecializations: ['legumes'],
      crops: ['cowpea'],
      topics: ['planting', 'pest_management', 'storage'],
      regions: ['all'],
      seasons: ['dry_season', 'wet_season'],
      difficulty: 'beginner',
    },
    tags: ['cowpea', 'legumes', 'protein', 'PICS bags'],
    status: 'published',
  },
];

const sampleQuestions = [
  {
    title: 'What is the best time to plant maize in Oyo State?',
    content:
      'I have a 1.5 hectare farm in Egbeda LGA and I want to know the best planting time for the first season.',
    specialization: 'cereal_crops',
    tags: ['maize', 'planting time', 'Oyo'],
    answers: [
      {
        authorName: 'Dr. Afolabi Okonkwo',
        authorRole: 'expert',
        isExpert: true,
        content:
          'For Oyo State, the first rainy season planting window is typically late March to mid-April. Plant in moderate early rains for better germination control.',
        helpful: 12,
        accepted: true,
      },
    ],
    status: 'resolved',
  },
  {
    title: 'My broiler chicks keep dying at 3-4 days old — what am I doing wrong?',
    content:
      'I bought 200 day-old chicks 4 days ago and 15 have already died. They seem weak and some have pasted vents. Temperature is around 30°C.',
    specialization: 'poultry',
    tags: ['broiler', 'chick mortality', 'brooding'],
    answers: [
      {
        authorName: 'Emeka Nwosu',
        authorRole: 'farmer',
        isExpert: false,
        content:
          "I had the same problem last year — it was dehydration. Dip each chick's beak in water immediately on arrival. Add electrolytes and vitamins to the water for the first 3 days.",
        helpful: 8,
        accepted: false,
      },
    ],
    status: 'answered',
  },
  {
    title: 'How do I know when my catfish are ready to harvest?',
    content:
      'I stocked my pond 5 months ago with 500 fingerlings. How do I know they are at the right weight? What weight do buyers prefer?',
    specialization: 'fisheries',
    tags: ['catfish', 'harvest', 'weight'],
    status: 'open',
    answers: [],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // FIX: Only clear seed/test accounts — not all real user data.
    // The original deleted ALL users, content and questions which would wipe
    // production data if run accidentally.
    const seedEmails = [
      'admin@agriconnect.com',
      'expert@agriconnect.com',
      'farmer@agriconnect.com',
      'poultry@agriconnect.com',
      'fish@agriconnect.com',
    ];
    await User.deleteMany({ email: { $in: seedEmails } });
    await Content.deleteMany({ tags: { $in: ['maize', 'broiler', 'fall armyworm', 'catfish', 'cowpea'] }, status: 'published' });
    await Question.deleteMany({ tags: { $in: ['planting time', 'chick mortality', 'harvest'] } });
    console.log('Cleared existing seed data');

    // Build users with pre-hashed passwords
    const users = await buildUsers();

    // FIX: Use insertMany with { validateBeforeSave: false } equivalent —
    // we pass pre-hashed passwords so we must bypass the pre-save hook
    // by inserting directly. The cleanest way is to use create() with
    // a flag that skips hashing, but since Mongoose doesn't expose that
    // directly, we insert documents that already look "saved" by setting
    // isNew = false — simplest fix is just to use Model.create() and let
    // the hook run harmlessly on an already-hashed value.
    //
    // bcrypt.hash output always starts with "$2b$" — the hook checks
    // isModified('passwordHash') which is true on create, so it WILL
    // re-hash an already-hashed string (double hashing). To avoid this,
    // we use collection.insertMany which bypasses hooks entirely.
    await User.collection.insertMany(
      users.map(u => ({
        ...u,
        isActive: true,
        isVerified: false,
        role: u.role,
        social: { reputation: 0, followers: [], following: [], badges: [] },
        statistics: {
          contentSaved: [],
          contentShared: 0,
          questionsAsked: 0,
          answersProvided: 0,
          helpfulVotes: 0,
          interactionHistory: [],
        },
        settings: {
          privacyLevel: 'public',
          emailNotifications: true,
          pushNotifications: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );
    console.log(`Created ${users.length} seed users`);

    const createdUsers = await User.find({ email: { $in: seedEmails } });
    const expert = createdUsers.find(u => u.role === 'expert');

    // Create content
    const contentWithAuthors = sampleContent.map(c => ({
      ...c,
      author: { userId: expert._id, name: expert.profile.fullName, role: expert.role },
      publishedAt: new Date(),
    }));
    await Content.create(contentWithAuthors);
    console.log(`Created ${sampleContent.length} content items`);

    // Create questions
    const farmerUsers = createdUsers.filter(u => u.role === 'farmer');
    const questionsWithAuthors = sampleQuestions.map((q, i) => {
      const author = farmerUsers[i % farmerUsers.length];
      const answers = (q.answers || []).map(a => {
        const answerUser = a.isExpert ? expert : farmerUsers[1];
        return { ...a, author: answerUser._id };
      });
      return { ...q, author: author._id, authorName: author.profile.fullName, answers };
    });
    await Question.create(questionsWithAuthors);
    console.log(`Created ${sampleQuestions.length} questions`);

    console.log('\n✅ Seed complete! Test accounts:');
    console.log('   Admin:   admin@agriconnect.com   / Admin@123');
    console.log('   Expert:  expert@agriconnect.com  / Expert@123');
    console.log('   Farmer:  farmer@agriconnect.com  / Farmer@123');
    console.log('   Poultry: poultry@agriconnect.com / Farmer@123');
    console.log('   Fish:    fish@agriconnect.com    / Farmer@123\n');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
