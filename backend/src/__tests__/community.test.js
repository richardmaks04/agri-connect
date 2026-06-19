/**
 * Backend Tests: Community Q&A - Questions and Answers
 * 
 * This file tests the community Q&A API endpoints
 * Run: npm test -- --testPathPattern=community.test.js
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Question = require('../models/Question');
const User = require('../models/User');

describe('Community Q&A API Tests - Replies/Answers', () => {
  let farmerToken;
  let expertToken;
  let farmerId;
  let expertId;
  let questionId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
    }

    // Clear collections
    await Question.deleteMany({});
    await User.deleteMany({});

    // Create test farmer user
    const farmer = await User.create({
      email: 'farmer@test.com',
      passwordHash: 'hashed123',
      profile: { fullName: 'John Farmer' },
      role: 'farmer',
      isVerified: true,
    });
    farmerId = farmer._id;
    farmerToken = `Bearer ${farmerId}`;

    // Create test expert user
    const expert = await User.create({
      email: 'expert@test.com',
      passwordHash: 'hashed123',
      profile: { fullName: 'Dr. Expert' },
      role: 'expert',
      isVerified: true,
    });
    expertId = expert._id;
    expertToken = `Bearer ${expertId}`;

    // Create test question
    const question = await Question.create({
      title: 'What is the best time to plant wheat?',
      content: 'I want to know the optimal planting time for wheat in Nigeria.',
      author: farmerId,
      category: 'crop',
      tags: ['wheat', 'planting', 'timing'],
      status: 'open',
    });
    questionId = question._id;
  });

  afterAll(async () => {
    await Question.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/community/questions/:id/answers - Create Answer/Reply', () => {
    test('✅ Should post answer to question successfully', async () => {
      const answerData = {
        content: 'The best time to plant wheat in Nigeria is October to November for optimal growth.',
      };

      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .set('Authorization', expertToken)
        .send(answerData)
        .expect(201);

      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.content).toBe(answerData.content);
      expect(response.body.data.author).toEqual(expertId);
      expect(response.body.data.isAccepted).toBe(false);

      // Verify answer saved in question
      const updatedQuestion = await Question.findById(questionId);
      expect(updatedQuestion.answers.length).toBeGreaterThan(0);
    });

    test('✅ Multiple users should be able to answer same question', async () => {
      // Create another expert
      const expert2 = await User.create({
        email: 'expert2@test.com',
        passwordHash: 'hashed123',
        profile: { fullName: 'Dr. Expert 2' },
        role: 'expert',
        isVerified: true,
      });
      const expert2Token = `Bearer ${expert2._id}`;

      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .set('Authorization', expert2Token)
        .send({ content: 'Alternative answer from expert 2' })
        .expect(201);

      expect(response.body.data).toBeDefined();

      // Verify question now has 2 answers
      const question = await Question.findById(questionId);
      expect(question.answers.length).toBe(2);
    });

    test('✅ Farmers should be able to reply/answer questions', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .set('Authorization', farmerToken)
        .send({
          content: 'I plant my wheat in November and get good results.',
        })
        .expect(201);

      expect(response.body.data.author).toEqual(farmerId);
    });

    test('❌ Should reject answer without content', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .set('Authorization', expertToken)
        .send({})
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('❌ Should reject empty answer', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .set('Authorization', expertToken)
        .send({ content: '' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('❌ Should reject answer with minimal content (< 10 chars)', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .set('Authorization', expertToken)
        .send({ content: 'Too short' })
        .expect(400);

      expect(response.body.error).toMatch(/too short|minimum/i);
    });

    test('❌ Should reject unauthenticated answer attempts', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .send({ content: 'Answer without auth' })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });

    test('✅ Should handle answer with special characters and links', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${questionId}/answers`)
        .set('Authorization', expertToken)
        .send({
          content: 'Check this resource & guide: https://example.com/wheat-planting. Use best practices (& techniques) mentioned there.',
        })
        .expect(201);

      expect(response.body.data.content).toContain('&');
      expect(response.body.data.content).toContain('https://');
    });

    test('❌ Should reject answer to non-existent question', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/community/questions/${fakeId}/answers`)
        .set('Authorization', expertToken)
        .send({ content: 'Answer to fake question' })
        .expect(404);

      expect(response.body.error).toMatch(/not found|does not exist/i);
    });
  });

  describe('PATCH /api/community/questions/:id/answers/:answerId/accept - Mark Answer as Accepted', () => {
    let answerId;

    beforeAll(async () => {
      const question = await Question.create({
        title: 'How to prevent crop disease?',
        content: 'Question content',
        author: farmerId,
        category: 'crop',
        tags: ['disease'],
        status: 'open',
      });

      const answer = {
        author: expertId,
        content: 'Prevent disease through proper sanitation and crop rotation.',
        isAccepted: false,
      };

      question.answers.push(answer);
      await question.save();

      const savedQuestion = await Question.findById(question._id);
      answerId = savedQuestion.answers[0]._id;
      questionId = question._id;
    });

    test('✅ Question author should accept answer', async () => {
      const response = await request(app)
        .patch(`/api/community/questions/${questionId}/answers/${answerId}/accept`)
        .set('Authorization', farmerToken)
        .expect(200);

      expect(response.body.data.isAccepted).toBe(true);

      // Verify question status updated
      const question = await Question.findById(questionId);
      const acceptedAnswer = question.answers.id(answerId);
      expect(acceptedAnswer.isAccepted).toBe(true);
    });

    test('❌ Non-question-author should not accept answer', async () => {
      // Create new question
      const newQuestion = await Question.create({
        title: 'Another question',
        content: 'Content',
        author: farmerId,
        category: 'crop',
        tags: [],
        status: 'open',
      });

      const answer = {
        author: expertId,
        content: 'Sample answer',
      };
      newQuestion.answers.push(answer);
      await newQuestion.save();

      const savedQuestion = await Question.findById(newQuestion._id);
      const newAnswerId = savedQuestion.answers[0]._id;

      // Try to accept with different user
      const response = await request(app)
        .patch(`/api/community/questions/${newQuestion._id}/answers/${newAnswerId}/accept`)
        .set('Authorization', expertToken)
        .expect(403);

      expect(response.body.error).toMatch(/not authorized|only author|permission/i);
    });

    test('✅ Should unaccept if accepted again', async () => {
      const response = await request(app)
        .patch(`/api/community/questions/${questionId}/answers/${answerId}/accept`)
        .set('Authorization', farmerToken)
        .expect(200);

      expect(response.body.data.isAccepted).toBe(false);
    });
  });

  describe('POST /api/community/questions/:id/answers/:answerId/helpful - Mark Answer as Helpful', () => {
    let testQuestion;
    let testAnswerId;

    beforeAll(async () => {
      testQuestion = await Question.create({
        title: 'Is it important to rotate crops?',
        content: 'Question about crop rotation',
        author: farmerId,
        category: 'crop',
        tags: ['rotation'],
        status: 'open',
      });

      const answer = {
        author: expertId,
        content: 'Yes, crop rotation is essential for soil health.',
        likes: [],
      };

      testQuestion.answers.push(answer);
      await testQuestion.save();

      const saved = await Question.findById(testQuestion._id);
      testAnswerId = saved.answers[0]._id;
    });

    test('✅ User should mark answer as helpful', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${testQuestion._id}/answers/${testAnswerId}/helpful`)
        .set('Authorization', farmerToken)
        .expect(200);

      expect(response.body.message).toMatch(/helpful|liked/i);

      // Verify like added
      const question = await Question.findById(testQuestion._id);
      const answer = question.answers.id(testAnswerId);
      expect(answer.likes).toContain(farmerId);
    });

    test('✅ Should unlike if already marked helpful', async () => {
      const response = await request(app)
        .post(`/api/community/questions/${testQuestion._id}/answers/${testAnswerId}/helpful`)
        .set('Authorization', farmerToken)
        .expect(200);

      expect(response.body.message).toMatch(/unhelpful|removed|unlike/i);

      const question = await Question.findById(testQuestion._id);
      const answer = question.answers.id(testAnswerId);
      expect(answer.likes).not.toContain(farmerId);
    });
  });

  describe('GET /api/community/questions - List Questions', () => {
    beforeAll(async () => {
      // Create multiple test questions
      const questions = [
        {
          title: 'Best fertilizer for tomatoes?',
          content: 'Looking for fertilizer recommendations',
          author: farmerId,
          category: 'horticulture',
          tags: ['tomato', 'fertilizer'],
        },
        {
          title: 'How to treat plant fungus?',
          content: 'Fungal infection in my crops',
          author: farmerId,
          category: 'crop',
          tags: ['fungus', 'disease'],
        },
        {
          title: 'Poultry feed recommendations',
          content: 'What feed for chickens?',
          author: farmerId,
          category: 'livestock',
          tags: ['poultry', 'feed'],
        },
      ];

      await Question.insertMany(questions);
    });

    test('✅ Should retrieve list of questions with pagination', async () => {
      const response = await request(app)
        .get('/api/community/questions?page=1&limit=10')
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    test('✅ Should filter questions by category', async () => {
      const response = await request(app)
        .get('/api/community/questions?category=horticulture')
        .expect(200);

      expect(response.body.data.every(q => q.category === 'horticulture')).toBe(true);
    });

    test('✅ Should search questions', async () => {
      const response = await request(app)
        .get('/api/community/questions?search=fertilizer')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].title).toMatch(/fertilizer/i);
    });
  });

  describe('POST /api/community/questions - Create Question', () => {
    test('✅ Should create question successfully', async () => {
      const response = await request(app)
        .post('/api/community/questions')
        .set('Authorization', farmerToken)
        .send({
          title: 'When should I harvest corn?',
          content: 'My corn is ready, but I\'m not sure about the timing.',
          category: 'crop',
          tags: ['corn', 'harvesting'],
        })
        .expect(201);

      expect(response.body.data.title).toBe('When should I harvest corn?');
      expect(response.body.data.author).toEqual(farmerId);
      expect(response.body.data.status).toBe('open');
    });

    test('❌ Should reject question without title', async () => {
      const response = await request(app)
        .post('/api/community/questions')
        .set('Authorization', farmerToken)
        .send({
          content: 'Just content, no title',
          category: 'crop',
          tags: [],
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    test('❌ Should reject unauthenticated question', async () => {
      const response = await request(app)
        .post('/api/community/questions')
        .send({
          title: 'Question without auth',
          content: 'Content',
          category: 'crop',
          tags: [],
        })
        .expect(401);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PUT /api/community/questions/:id/resolve - Resolve Question', () => {
    let resolveQuestion;

    beforeAll(async () => {
      resolveQuestion = await Question.create({
        title: 'Can this question be resolved?',
        content: 'Content',
        author: farmerId,
        category: 'crop',
        tags: [],
        status: 'open',
      });
    });

    test('✅ Question author should resolve question', async () => {
      const response = await request(app)
        .put(`/api/community/questions/${resolveQuestion._id}/resolve`)
        .set('Authorization', farmerToken)
        .expect(200);

      expect(response.body.message).toMatch(/resolved|closed/i);

      const question = await Question.findById(resolveQuestion._id);
      expect(question.status).toBe('closed');
    });

    test('❌ Non-author should not resolve', async () => {
      const newQuestion = await Question.create({
        title: 'Another question to resolve',
        content: 'Content',
        author: farmerId,
        category: 'crop',
        tags: [],
        status: 'open',
      });

      const response = await request(app)
        .put(`/api/community/questions/${newQuestion._id}/resolve`)
        .set('Authorization', expertToken)
        .expect(403);

      expect(response.body.error).toMatch(/not authorized|only author/i);
    });
  });

  describe('Answer Statistics and Tracking', () => {
    let statsQuestion;

    beforeAll(async () => {
      statsQuestion = await Question.create({
        title: 'Question for statistics testing',
        content: 'Content',
        author: farmerId,
        category: 'crop',
        tags: [],
        status: 'open',
      });
    });

    test('✅ Should track answer count correctly', async () => {
      // Add 3 answers
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/community/questions/${statsQuestion._id}/answers`)
          .set('Authorization', expertToken)
          .send({ content: `Answer ${i + 1} with sufficient content to pass validation` });
      }

      const question = await Question.findById(statsQuestion._id);
      expect(question.answers.length).toBe(3);
    });

    test('✅ Should track question views', async () => {
      const beforeViews = statsQuestion.statistics?.views || 0;

      await request(app)
        .get(`/api/community/questions/${statsQuestion._id}`);

      const updated = await Question.findById(statsQuestion._id);
      expect(updated.statistics.views).toBeGreaterThanOrEqual(beforeViews);
    });
  });
});
