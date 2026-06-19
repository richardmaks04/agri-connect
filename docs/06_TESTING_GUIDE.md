# Testing Guide: Article Creation & Community Q&A

This guide explains how to set up and run tests for article/content creation and community Q&A replies (answers).

---

## 📋 Test Coverage Overview

### Backend Tests
- **Content Creation Tests** (`backend/src/__tests__/content.test.js`)
  - Create articles/content
  - Save content
  - Like content
  - Retrieve content
  - View tracking

- **Community Q&A Tests** (`backend/src/__tests__/community.test.js`)
  - Post answers/replies to questions
  - Mark answers as accepted
  - Mark answers as helpful
  - List questions
  - Create questions
  - Resolve questions

### Frontend Tests
- **CreateContent Component** (`frontend/src/components/content/CreateContent.test.jsx`)
  - Form rendering
  - Input handling
  - Form validation
  - Form submission
  - Success feedback
  - Error handling

- **QuestionDetail Component** (`frontend/src/components/community/QuestionDetail.test.jsx`)
  - Display questions
  - Display answers/replies
  - Add replies
  - Like/helpful functionality
  - Accept answers
  - Edit replies
  - Resolve questions

---

## 🔧 Setup Instructions

### Step 1: Install Test Dependencies

#### Backend
```bash
cd backend

# Install testing libraries
npm install --save-dev jest supertest @testing-library/node
npm install --save-dev dotenv-cli

# Verify installation
npm list jest supertest
```

#### Frontend
```bash
cd frontend

# React Scripts already includes Jest and React Testing Library
# Just verify it's installed
npm list @testing-library/react @testing-library/jest-dom

# If missing, install:
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

### Step 2: Update package.json Scripts

#### Backend `package.json`

Add/update the scripts section:
```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node src/utils/seed.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:content": "jest --testPathPattern=content.test.js",
    "test:community": "jest --testPathPattern=community.test.js",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

#### Frontend `package.json`

Already has test script from react-scripts, but you can add:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:CreateContent": "react-scripts test --testPathPattern=CreateContent.test.jsx --watchAll=false",
    "test:QuestionDetail": "react-scripts test --testPathPattern=QuestionDetail.test.jsx --watchAll=false"
  }
}
```

### Step 3: Ensure MongoDB is Running

```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas connection string in .env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/agriconnect-test
```

### Step 4: Configure Environment Variables

Create `.env.test` files if needed:

#### Backend `.env.test`
```bash
NODE_ENV=test
MONGODB_URI_TEST=mongodb://localhost:27017/agriconnect-test
JWT_SECRET=test_secret_key_12345
JWT_REFRESH_SECRET=test_refresh_secret_67890
CLIENT_URL=http://localhost:3000
```

---

## 🚀 Running Tests

### Backend Tests

#### Run all backend tests:
```bash
cd backend
npm test
```

#### Run specific test file (Content Creation):
```bash
npm run test:content
```

#### Run specific test file (Community Q&A):
```bash
npm run test:community
```

#### Run tests in watch mode (auto-rerun on changes):
```bash
npm run test:watch
```

#### Generate coverage report:
```bash
npm run test:coverage
```

#### Debug tests:
```bash
npm run test:debug
# Then open Chrome DevTools at chrome://inspect
```

### Frontend Tests

#### Run all frontend tests:
```bash
cd frontend
npm test
```

#### Run CreateContent tests only:
```bash
npm run test:CreateContent
```

#### Run QuestionDetail tests only:
```bash
npm run test:QuestionDetail
```

#### Generate coverage report:
```bash
npm run test:coverage
```

#### Run tests once (non-interactive):
```bash
CI=true npm test
```

---

## 📊 Test Results Expected

### Backend Content Tests (8 test suites)

```
✅ POST /api/content - Create Article
  ✓ Should create content successfully with valid data
  ✓ Admin users should publish content immediately
  ✗ Should reject content without title
  ✗ Should reject content without content body
  ✗ Should reject content from non-expert users
  ✗ Should reject unauthenticated requests
  ✓ Should handle content with special characters
  ✓ Should store tags correctly
  ✓ Should track content metadata correctly

✅ GET /api/content/:id - Retrieve Content
  ✓ Should retrieve published content
  ✗ Should not retrieve unpublished content
  ✓ Should increment views on retrieval

✅ POST /api/content/:id/save - Save Content
  ✓ Should save content to user profile
  ✓ Should toggle save

✅ POST /api/content/:id/like - Like Content
  ✓ Should like content
  ✓ Should unlike if already liked
```

### Backend Community Q&A Tests (14 test suites)

```
✅ POST /api/community/questions/:id/answers - Create Answer/Reply
  ✓ Should post answer to question successfully
  ✓ Multiple users should be able to answer same question
  ✓ Farmers should be able to reply/answer questions
  ✗ Should reject answer without content
  ✗ Should reject empty answer
  ✗ Should reject answer with minimal content
  ✗ Should reject unauthenticated answer attempts
  ✓ Should handle answer with special characters and links
  ✗ Should reject answer to non-existent question

✅ PATCH /api/community/questions/:id/answers/:answerId/accept
  ✓ Question author should accept answer
  ✗ Non-question-author should not accept answer
  ✓ Should unaccept if accepted again

✅ POST /api/community/questions/:id/answers/:answerId/helpful
  ✓ User should mark answer as helpful
  ✓ Should unlike if already marked helpful

✅ Additional tests for listing, creating, resolving questions
  [20+ additional test cases]
```

### Frontend CreateContent Tests (15 test suites)

```
✅ Component Rendering
  ✓ Should render form with all required fields
  ✓ Should render all specialization options
  ✓ Should render difficulty levels
  ✓ Should render submit button

✅ Form Input Handling
  ✓ Should update title input
  ✓ Should update summary input
  ✓ Should update content body
  ✓ Should update tags
  ✓ Should change content type
  ✓ Should change difficulty level

✅ Form Validation
  ✗ Should prevent submission without title
  ✗ Should prevent submission without content
  ✗ Should require minimum content length

✅ Form Submission
  ✓ Should submit form with valid data
  ✓ Should submit with summary
  ✓ Should submit with tags
  ✓ Should submit with selected specializations
  ✓ Should submit with selected topics

✅ Success & Navigation
  ✓ Should show success message after submission
  ✓ Should disable submit button while submitting

✅ Error Handling
  ✓ Should handle API errors gracefully
  ✓ Should handle validation errors from backend

✅ Special Characters
  ✓ Should handle special characters in title
  ✓ Should handle HTML in content
```

### Frontend QuestionDetail Tests (18 test suites)

```
✅ Question Display
  ✓ Should display question title
  ✓ Should display question content
  ✓ Should display question metadata
  ✓ Should display question tags
  ✓ Should display view count

✅ Answers/Replies Display
  ✓ Should display all answers
  ✓ Should display answer author information
  ✓ Should display answer count
  ✓ Should display "No answers yet" when no replies

✅ Add Reply/Answer Form
  ✓ Should display reply form
  ✓ Should allow typing in reply textarea
  ✓ Should have submit reply button
  ✓ Should have character counter

✅ Submit Reply/Answer
  ✓ Should submit reply successfully
  ✓ Should clear reply form after submission
  ✓ Should show success message
  ✓ Should add new reply to list

✅ Reply Validation
  ✗ Should reject reply without content
  ✗ Should reject reply with minimum content
  ✓ Should disable submit button while submitting

✅ Like/Helpful Button
  ✓ Should display like buttons on answers
  ✓ Should mark answer as helpful
  ✓ Should show like count

✅ Additional Features
  ✓ Should accept answers (for question author)
  ✓ Should display timestamps
  ✓ Should sort/filter replies
  ✓ Should resolve questions
  [Additional test cases]
```

---

## 🔍 Understanding Test Output

### Passing Test (✓)
```
✓ Should create content successfully with valid data (45ms)
```

### Failing Test (✗)
```
✗ Should reject content without title (125ms)
  Expected: api.post not to be called
  Received: api.post was called
```

### Test Summary
```
Test Suites: 4 passed, 4 total
Tests:       78 passed, 12 failed, 90 total
Snapshots:   0 total
Time:        12.456s
```

---

## 🐛 Debugging Tests

### Run specific test:
```bash
# Backend
jest content.test.js -t "Should create content successfully"

# Frontend
npm test -- -t "Should create content successfully"
```

### Run with verbose output:
```bash
jest --verbose
```

### Run single test file with watch:
```bash
jest content.test.js --watch
```

### Debug in VS Code

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

Then press F5 to debug.

---

## 📈 Code Coverage

### Generate coverage report:
```bash
# Backend
npm run test:coverage

# Frontend
npm run test:coverage
```

### View coverage HTML report:
```bash
# Backend
open coverage/index.html

# Frontend
open coverage/lcov-report/index.html
```

### Coverage targets:
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## 🔄 Continuous Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
      
      - name: Install Backend Dependencies
        run: cd backend && npm install
      
      - name: Run Backend Tests
        run: cd backend && npm test
      
      - name: Install Frontend Dependencies
        run: cd frontend && npm install
      
      - name: Run Frontend Tests
        run: cd frontend && npm test -- --coverage --watchAll=false
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
```

---

## ⚠️ Common Issues & Fixes

### Issue: "Cannot find module 'jest'"
**Solution:**
```bash
npm install --save-dev jest
npm install --save-dev supertest  # backend only
```

### Issue: MongoDB connection timeout
**Solution:**
- Ensure MongoDB is running: `mongod`
- Or update `.env.test` with valid MongoDB URI
- Increase timeout in `jest.setup.js`

### Issue: "TypeError: Cannot read property 'post' of undefined"
**Solution:**
```bash
# Frontend - ensure mocks are set up correctly
jest.mock('../utils/api');
```

### Issue: Test hangs/times out
**Solution:**
```bash
# Increase timeout
jest --testTimeout=30000

# Or in test file
jest.setTimeout(30000);
```

### Issue: "EADDRINUSE: address already in use :::5000"
**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port in tests
PORT=5001 npm test
```

---

## 📝 Writing New Tests

### Backend Test Template
```javascript
describe('New Feature Tests', () => {
  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Cleanup
  });

  test('✅ Should perform expected action', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', authToken)
      .send(testData)
      .expect(200);

    expect(response.body).toHaveProperty('expectedField');
  });
});
```

### Frontend Test Template
```javascript
describe('New Component Tests', () => {
  test('✅ Should render correctly', () => {
    render(<Component />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  test('✅ Should handle user interaction', async () => {
    render(<Component />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(/* assertion */).toBe(true);
  });
});
```

---

## 🎯 Test Checklist

- [ ] All tests pass locally
- [ ] Coverage > 80%
- [ ] No console errors/warnings
- [ ] Tests are deterministic (pass every time)
- [ ] Tests are isolated (no dependencies between tests)
- [ ] Async operations properly awaited
- [ ] Mocks are properly set up
- [ ] Error cases are tested
- [ ] Edge cases are covered
- [ ] Performance tests added for critical paths

---

## 📚 Resources

- [Jest Documentation](https://jestjs.io)
- [React Testing Library](https://testing-library.com/react)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com)

---

## ❓ Need Help?

Common commands reference:
```bash
# Run tests
npm test

# Run with watch
npm test -- --watch

# Run specific file
npm test -- content.test.js

# Check coverage
npm test -- --coverage

# Debug
npm test -- --debug

# Update snapshots
npm test -- -u
```

---

*Created: 2026-06-19*
*Updated Test Suite Version: 1.0.0*
