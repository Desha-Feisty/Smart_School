# Test Suite Documentation

This directory contains comprehensive tests for the Learning Management System.

## Test Files

### 1. comprehensive.test.cjs
**Purpose**: Main API test suite covering all core features

**Coverage**:
- Registration & Login (student, teacher, admin)
- Course management (create, join, list)
- Quiz system (create, questions, publish, attempt, submit)
- Notes & Comments
- Chat (REST endpoints)
- Admin features
- Leaderboard
- Notifications
- Authorization & Error handling

**Run**:
```bash
node tests/comprehensive.test.cjs
```

---

### 2. socket.test.cjs
**Purpose**: Socket.io real-time functionality tests

**Coverage**:
- Socket.io connection establishment
- Join course room
- Receive new-quiz notification
- Receive new-note notification
- Chat messages via socket
- Disconnect handling

**Prerequisites**:
- Server must be running
- socket.io-client package installed

**Run**:
```bash
npm install socket.io-client
node tests/socket.test.cjs
```

---

### 3. analytics.test.cjs
**Purpose**: Analytics and reporting API tests

**Coverage**:
- Teacher analytics overview
- Course analytics
- Student analytics
- Quiz analytics
- Authorization (student cannot access)
- Export analytics (CSV, JSON)
- Leaderboard
- Activity analytics

**Run**:
```bash
node tests/analytics.test.cjs
```

---

### 4. edge-cases.test.cjs
**Purpose**: Edge cases and error handling tests

**Coverage**:
- Input validation (email, password, name)
- Missing required fields
- Invalid role
- Non-existent resources
- Invalid join code
- Duplicate actions (join twice)
- Quiz attempt limits
- Quiz availability (future, closed)
- Empty data handling
- Long input handling
- Malicious input handling
- Concurrent operations

**Run**:
```bash
node tests/edge-cases.test.cjs
```

---

## Running All Tests

### Prerequisites
1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Install test dependencies (for socket tests):
   ```bash
   npm install socket.io-client
   ```

### Run Individual Tests
```bash
# Comprehensive API tests
node tests/comprehensive.test.cjs

# Socket.io tests
node tests/socket.test.cjs

# Analytics tests
node tests/analytics.test.cjs

# Edge cases tests
node tests/edge-cases.test.cjs
```

### Run All Tests Sequentially
```bash
# From project root
node tests/comprehensive.test.cjs && \
node tests/analytics.test.cjs && \
node tests/edge-cases.test.cjs
```

---

## Test Structure

Each test file follows this pattern:

1. **Setup**: Create test users, courses, quizzes
2. **Test Cases**: Execute API calls and validate responses
3. **Assertions**: Check status codes, data structure, authorization
4. **Cleanup**: (Automatic via unique IDs)

---

## Expected Results

### comprehensive.test.cjs
- **Tests**: 15 test categories
- **Expected**: All pass

### socket.test.cjs
- **Tests**: 6 test categories
- **Expected**: All pass (requires running server)

### analytics.test.cjs
- **Tests**: 10 test categories
- **Expected**: All pass

### edge-cases.test.cjs
- **Tests**: 15 test categories
- **Expected**: All pass (tests should fail for invalid inputs)

---

## Troubleshooting

### Server Not Ready
If tests fail with "Server not ready":
1. Ensure backend is running: `cd backend && npm run dev`
2. Wait for MongoDB to connect
3. Check port 3000 is available

### Socket Connection Failed
If socket tests fail:
1. Check server has Socket.io initialized
2. Verify CORS settings
3. Check WebSocket transport

### Test Data Conflicts
If tests fail due to unique constraints:
- Each test uses unique IDs (timestamp-based)
- Should not conflict with previous runs

---

## Adding New Tests

1. Create new `.test.cjs` file
2. Use existing helper functions:
   - `makeRequest(path, method, data, token)`
   - `waitForServer()`
   - `log(message, type)`
3. Follow assertion pattern:
   ```javascript
   if (condition) {
       log(`✓ Test name`, 'PASS');
   } else {
       log(`✗ Test name`, 'FAIL');
   }
   ```
4. Add to this documentation

---

## Test Coverage Summary

| Category | Tests | File |
|----------|-------|------|
| Core API | 15 | comprehensive.test.cjs |
| Real-time | 6 | socket.test.cjs |
| Analytics | 10 | analytics.test.cjs |
| Edge Cases | 15 | edge-cases.test.cjs |
| **Total** | **46** | **4 files** |

---

## Notes

- Tests require MongoDB to be running
- Tests create temporary data with unique IDs
- Tests clean up after themselves (unique emails)
- Socket tests require socket.io-client package
- All tests run against localhost:3000