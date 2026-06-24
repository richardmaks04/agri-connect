/**
 * Backend Tests: Content Creation
 * 
 * This file tests the content creation API endpoints and database operations
 * Run: npm test -- --testPathPattern=content.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Content = require('../models/Content');
const User = require('../models/User');

describe('Content Creation API Tests', () => {
  let authToken;
  let userId;
  let testUser;

  // Setup: Create test user before tests
  beforeAll(async () => {
    // Connect to test database if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    }

    // Clear collections
    await Content.deleteMany({});
    await User.deleteMany({});

    // Create test expert user
    testUser = await User.create({
      email: 'expert@test.com',
      passwordHash: 'hashedpassword123',
      profile: {
        fullName: 'Dr. Agriculture Expert',
      },
      role: 'expert',
      isVerified: true,
    });

    userId = testUser._id;

    // Mock auth token (in real scenario, you'd use JWT)
    authToken = `Bearer ${userId}`;
  });

  // Cleanup: Delete test data after tests
  afterAll(async () => {
    await Content.deleteMany({});
    await User.deleteMany({});
    // Uncomment if closing DB connection:
    // await mongoose.connection.close();
  });

  describe('POST /api/content - Create Article', () => {
    test('✅ Should create content successfully with valid data', async () => {
      const contentData = {
        title: 'Best Practices for Maize Cultivation',
        summary: 'Learn optimal maize growing techniques',
        content: '<h1>Maize Cultivation Guide</h1><p>Growing maize requires proper soil preparation...</p>',
        contentType: 'article',
        tags: ['maize', 'agriculture', 'best-practices'],
        metadata: {
          farmingSpecializations: ['cereal_crops'],
          topics: ['planting', 'soil_health'],
          difficulty: 'beginner',
          regions: ['all'],
          seasons: ['all'],
        },
      };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authToken)
        .send(contentData)
        .expect(201);

      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.title).toBe(contentData.title);
      expect(response.body.data.status).toBe('published');
      expect(response.body.data.publishedAt).toBeDefined();
      expect(response.body.data.author.userId).toEqual(userId);

      // Verify content saved to database
      const savedContent = await Content.findById(response.body.data._id);
      expect(savedContent).toBeDefined();
      expect(savedContent.title).toBe(contentData.title);
    });

    test('✅ Admin users should publish content immediately', async () => {
      // Create admin user
      const adminUser = await User.create({
        email: 'admin@test.com',
        passwordHash: 'hashedpassword123',
        profile: { fullName: 'Admin User' },
        role: 'admin',
        isVerified: true,
      });

      const adminToken = `Bearer ${adminUser._id}`;

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', adminToken)
        .send({
          title: 'Admin Content',
          summary: 'Content from admin',
          content: '<p>Admin content</p>',
          contentType: 'article',
          tags: [],
          metadata: {},
        })
        .expect(201);

      expect(response.body.data.status).toBe('published');
      expect(response.body.data.publishedAt).toBeDefined();
    });

    test('❌ Should reject content without title', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authToken)
        .send({
          summary: 'No title provided',
          content: '<p>Content</p>',
          contentType: 'article',
          tags: [],
          metadata: {},
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('❌ Should reject content without content body', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authToken)
        .send({
          title: 'Title Only',
          summary: 'Summary',
          contentType: 'article',
          tags: [],
          metadata: {},
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('❌ Should reject content from non-expert users (farmers)', async () => {
      // Create farmer user
      const farmerUser = await User.create({
        email: 'farmer@test.com',
        passwordHash: 'hashedpassword123',
        profile: { fullName: 'John Farmer' },
        role: 'farmer',
        isVerified: true,
      });

      const farmerToken = `Bearer ${farmerUser._id}`;

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', farmerToken)
        .send({
          title: 'Farmer Content',
          content: '<p>Content</p>',
          contentType: 'article',
          tags: [],
          metadata: {},
        })
        .expect(403);

      expect(response.body.error).toMatch(/not authorized|permission/i);
    });

    test('❌ Should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/content')
        .send({
          title: 'Unauthorized Content',
          content: '<p>Content</p>',
          contentType: 'article',
          tags: [],
          metadata: {},
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('✅ Should handle content with special characters and formatting', async () => {
      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authToken)
        .send({
          title: 'Advanced Techniques & Best Practices (2026)',
          summary: 'Learn about modern farming: AI, IoT, & sustainability',
          content: '<h1>Advanced Farming</h1><p>Use cutting-edge tools & techniques...</p>',
          contentType: 'article',
          tags: ['advanced', 'sustainable', 'ai-farming', '2026'],
          metadata: {
            farmingSpecializations: ['cereal_crops', 'horticulture'],
            topics: ['fertilization', 'pest_management'],
            difficulty: 'advanced',
            regions: ['West Africa', 'East Africa'],
            seasons: ['rainy', 'dry'],
          },
        })
        .expect(201);

      expect(response.body.data.title).toContain('&');
      expect(response.body.data.tags).toContain('ai-farming');
    });

    test('✅ Should store tags correctly', async () => {
      const tags = ['organic', 'sustainable', 'nitrogen-fixation', 'legumes'];

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authToken)
        .send({
          title: 'Organic Farming Methods',
          content: '<p>Organic farming content</p>',
          contentType: 'article',
          tags,
          metadata: {},
        })
        .expect(201);

      expect(response.body.data.tags).toEqual(tags);
      expect(response.body.data.tags.length).toBe(4);
    });

    test('✅ Should track content metadata correctly', async () => {
      const metadata = {
        farmingSpecializations: ['poultry', 'fisheries'],
        topics: ['feeding', 'vaccination'],
        difficulty: 'intermediate',
        regions: ['all'],
        seasons: ['all'],
      };

      const response = await request(app)
        .post('/api/content')
        .set('Authorization', authToken)
        .send({
          title: 'Poultry Farming Guide',
          content: '<p>Poultry care guide</p>',
          contentType: 'article',
          tags: [],
          metadata,
        })
        .expect(201);

      expect(response.body.data.metadata).toEqual(metadata);
    });
  });

  describe('GET /api/content/:id - Retrieve Content', () => {
    let contentId;

    beforeAll(async () => {
      // Create test content
      const content = await Content.create({
        title: 'Test Article',
        content: '<p>Test content</p>',
        author: {
          userId: userId,
          name: 'Dr. Expert',
          role: 'expert',
        },
        status: 'published',
        publishedAt: new Date(),
        tags: [],
        metadata: {},
      });
      contentId = content._id;
    });

    test('✅ Should retrieve published content', async () => {
      const response = await request(app)
        .get(`/api/content/${contentId}`)
        .expect(200);

      expect(response.body.content).toBeDefined();
      expect(response.body.content.title).toBe('Test Article');
      expect(response.body.content.statistics.views).toBeGreaterThanOrEqual(1);
    });

    test('❌ Should not retrieve unpublished content', async () => {
      const unpublishedContent = await Content.create({
        title: 'Unpublished',
        content: '<p>Draft content</p>',
        author: { userId, name: 'Expert', role: 'expert' },
        status: 'pending',
        tags: [],
        metadata: {},
      });

      const response = await request(app)
        .get(`/api/content/${unpublishedContent._id}`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    test('✅ Should increment views on retrieval', async () => {
      const beforeResponse = await request(app)
        .get(`/api/content/${contentId}`)
        .expect(200);

      const viewsBefore = beforeResponse.body.content.statistics.views;

      const afterResponse = await request(app)
        .get(`/api/content/${contentId}`)
        .expect(200);

      const viewsAfter = afterResponse.body.content.statistics.views;
      expect(viewsAfter).toBeGreaterThan(viewsBefore);
    });
  });

  describe('POST /api/content/:id/save - Save Content', () => {
    let contentId;

    beforeAll(async () => {
      const content = await Content.create({
        title: 'Saveable Article',
        content: '<p>Content to save</p>',
        author: { userId, name: 'Expert', role: 'expert' },
        status: 'published',
        publishedAt: new Date(),
        tags: [],
        metadata: {},
      });
      contentId = content._id;
    });

    test('✅ Should save content to user profile', async () => {
      const response = await request(app)
        .post(`/api/content/${contentId}/save`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.message).toMatch(/saved|added/i);

      // Verify in user profile
      const updatedUser = await User.findById(userId);
      expect(updatedUser.statistics.contentSaved).toContain(contentId);
    });

    test('✅ Should toggle save (remove if already saved)', async () => {
      // Save first time
      await request(app)
        .post(`/api/content/${contentId}/save`)
        .set('Authorization', authToken);

      // Save second time (should remove)
      const response = await request(app)
        .post(`/api/content/${contentId}/save`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.message).toMatch(/removed|unsaved/i);
    });
  });

  describe('POST /api/content/:id/like - Like Content', () => {
    let contentId;

    beforeAll(async () => {
      const content = await Content.create({
        title: 'Likeable Article',
        content: '<p>Article to like</p>',
        author: { userId, name: 'Expert', role: 'expert' },
        status: 'published',
        publishedAt: new Date(),
        tags: [],
        metadata: {},
      });
      contentId = content._id;
    });

    test('✅ Should like content', async () => {
      const response = await request(app)
        .post(`/api/content/${contentId}/like`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.message).toMatch(/liked|like/i);

      // Verify like count increased
      const content = await Content.findById(contentId);
      expect(content.statistics.likes).toBeGreaterThan(0);
    });

    test('✅ Should unlike if already liked', async () => {
      // Like first
      await request(app)
        .post(`/api/content/${contentId}/like`)
        .set('Authorization', authToken);

      // Like again (toggle)
      const response = await request(app)
        .post(`/api/content/${contentId}/like`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.message).toMatch(/unlike|removed/i);
    });
  });
});
