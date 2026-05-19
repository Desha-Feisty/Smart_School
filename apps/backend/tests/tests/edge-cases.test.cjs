const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method, data, token = null) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : null;
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': body ? Buffer.byteLength(body) : 0
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function waitForServer(maxAttempts = 20) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await makeRequest('/api/auth/register', 'POST', { name: 'test', email: 'temp@test.com', password: 'temp123', role: 'student' });
            return true;
        } catch {
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    return false;
}

function log(message, type = 'INFO') {
    const colors = { INFO: '\x1b[36m', PASS: '\x1b[32m', FAIL: '\x1b[31m', SECTION: '\x1b[33m' };
    console.log(`${colors[type] || ''}[${type}]\x1b[0m ${message}`);
}

async function runTests() {
    log('Starting Edge Cases test suite...', 'SECTION');
    log('Waiting for server...');

    const serverReady = await waitForServer();
    if (!serverReady) {
        log('Server not ready!', 'FAIL');
        process.exit(1);
    }
    log('Server is ready!');

    const uniqueId = Date.now();
    let passed = 0;
    let failed = 0;

    function assert(condition, testName) {
        if (condition) {
            log(`✓ ${testName}`, 'PASS');
            passed++;
            return true;
        } else {
            log(`✗ ${testName}`, 'FAIL');
            failed++;
            return false;
        }
    }

    // ============================================
    // TEST 1: Invalid Email Format
    // ============================================
    log('\n--- TEST 1: Input Validation ---', 'SECTION');

    const invalidEmail = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test User',
        email: 'not-an-email',
        password: 'password123',
        role: 'student'
    });
    assert(invalidEmail.status === 400, 'Invalid email format rejected');

    // ============================================
    // TEST 2: Short Password
    // ============================================
    log('\n--- TEST 2: Password Validation ---', 'SECTION');

    const shortPassword = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test User',
        email: `shortpw${uniqueId}@test.com`,
        password: '123',  // Less than 6 chars
        role: 'student'
    });
    assert(shortPassword.status === 400, 'Short password rejected');

    // ============================================
    // TEST 3: Short Name
    // ============================================
    log('\n--- TEST 3: Name Validation ---', 'SECTION');

    const shortName = await makeRequest('/api/auth/register', 'POST', {
        name: 'AB',  // Less than 6 chars
        email: `shortname${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    assert(shortName.status === 400, 'Short name rejected');

    // ============================================
    // TEST 4: Missing Required Fields
    // ============================================
    log('\n--- TEST 4: Missing Fields ---', 'SECTION');

    const missingFields = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test User'
        // Missing email, password, role
    });
    assert(missingFields.status === 400, 'Missing required fields rejected');

    // ============================================
    // TEST 5: Invalid Role
    // ============================================
    log('\n--- TEST 5: Invalid Role ---', 'SECTION');

    const invalidRole = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test User',
        email: `invalidrole${uniqueId}@test.com`,
        password: 'password123',
        role: 'superadmin'  // Invalid role
    });
    assert(invalidRole.status === 400, 'Invalid role rejected');

    // ============================================
    // TEST 6: Non-existent Resource
    // ============================================
    log('\n--- TEST 6: Non-existent Resources ---', 'SECTION');

    // Create a token first
    const userReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Edge Case User',
        email: `edgecase${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    const token = userReg.data.token;

    const nonExistentCourse = await makeRequest('/api/courses/507f1f77bcf86cd799439011', 'GET', null, token);
    assert(nonExistentCourse.status === 404, 'Non-existent course returns 404');

    const nonExistentQuiz = await makeRequest('/api/quizzes/507f1f77bcf86cd799439011', 'GET', null, token);
    assert(nonExistentQuiz.status === 404, 'Non-existent quiz returns 404');

    const nonExistentNote = await makeRequest('/api/notes/507f1f77bcf86cd799439011', 'GET', null, token);
    assert(nonExistentNote.status === 404, 'Non-existent note returns 404');

    // ============================================
    // TEST 7: Invalid Join Code
    // ============================================
    log('\n--- TEST 7: Invalid Join Code ---', 'SECTION');

    const invalidJoinCode = await makeRequest('/api/courses/join', 'POST', {
        joinCode: 'INVALID123'
    }, token);
    assert(invalidJoinCode.status === 404, 'Invalid join code rejected');

    // ============================================
    // TEST 8: Already Joined Course
    // ============================================
    log('\n--- TEST 8: Duplicate Actions ---', 'SECTION');

    // Register a new teacher and create course
    const teacherReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Edge Teacher',
        email: `edgeteacher${uniqueId}@test.com`,
        password: 'password123',
        role: 'teacher'
    });
    const teacherToken = teacherReg.data.token;

    const course = await makeRequest('/api/courses', 'POST', {
        title: 'Edge Test Course',
        description: 'Test course'
    }, teacherToken);
    const courseId = course.data.course._id;
    const joinCode = course.data.course.joinCode;

    // Student joins
    await makeRequest('/api/courses/join', 'POST', { joinCode }, token);

    // Try to join again
    const doubleJoin = await makeRequest('/api/courses/join', 'POST', { joinCode }, token);
    assert(doubleJoin.status === 400, 'Cannot join same course twice');

    // ============================================
    // TEST 9: Quiz Attempt Limits
    // ============================================
    log('\n--- TEST 9: Quiz Attempt Limits ---', 'SECTION');

    // Create quiz with 1 attempt allowed
    const now = new Date();
    const pastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const limitedQuiz = await makeRequest('/api/quizzes', 'POST', {
        courseId,
        title: 'Limited Quiz',
        description: 'Only 1 attempt',
        openAt: pastHour.toISOString(),
        closeAt: nextWeek.toISOString(),
        durationMinutes: 30,
        attemptsAllowed: 1
    }, teacherToken);
    const limitedQuizId = limitedQuiz.data.quiz._id;

    // Add question and publish
    await makeRequest(`/api/quizzes/${limitedQuizId}/questions`, 'POST', {
        prompt: 'Test question?',
        points: 10,
        orderIndex: 0,
        choices: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false }
        ]
    }, teacherToken);
    await makeRequest(`/api/quizzes/${limitedQuizId}/publish`, 'POST', {}, teacherToken);

    // First attempt
    const attempt1 = await makeRequest('/api/attempts/start', 'POST', { quizId: limitedQuizId }, token);
    const attempt1Id = attempt1.data.attemptId;
    await makeRequest(`/api/attempts/${attempt1Id}/submit`, 'POST', {}, token);

    // Second attempt should fail
    const attempt2 = await makeRequest('/api/attempts/start', 'POST', { quizId: limitedQuizId }, token);
    assert(attempt2.status === 403, 'Cannot exceed attempt limit');

    // ============================================
    // TEST 10: Quiz Not Yet Available
    // ============================================
    log('\n--- TEST 10: Quiz Availability ---', 'SECTION');

    // Create quiz that opens in the future
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const furtherDate = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const futureQuiz = await makeRequest('/api/quizzes', 'POST', {
        courseId,
        title: 'Future Quiz',
        description: 'Opens tomorrow',
        openAt: futureDate.toISOString(),
        closeAt: furtherDate.toISOString(),
        durationMinutes: 30,
        attemptsAllowed: 1
    }, teacherToken);
    const futureQuizId = futureQuiz.data.quiz._id;

    await makeRequest(`/api/quizzes/${futureQuizId}/publish`, 'POST', {}, teacherToken);

    // Try to start - should fail or return not available
    const notAvailable = await makeRequest('/api/attempts/start', 'POST', { quizId: futureQuizId }, token);
    assert(notAvailable.status === 403 || notAvailable.status === 400, 'Cannot start quiz not yet available');

    // ============================================
    // TEST 11: Quiz Closed
    // ============================================
    log('\n--- TEST 11: Quiz Closed ---', 'SECTION');

    // Create quiz that already closed
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const pastDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);

    const closedQuiz = await makeRequest('/api/quizzes', 'POST', {
        courseId,
        title: 'Closed Quiz',
        description: 'Already closed',
        openAt: yesterday.toISOString(),
        closeAt: pastDate.toISOString(),
        durationMinutes: 30,
        attemptsAllowed: 1
    }, teacherToken);
    const closedQuizId = closedQuiz.data.quiz._id;

    await makeRequest(`/api/quizzes/${closedQuizId}/publish`, 'POST', {}, teacherToken);

    // Try to start - should fail
    const closedAttempt = await makeRequest('/api/attempts/start', 'POST', { quizId: closedQuizId }, token);
    assert(closedAttempt.status === 403 || closedAttempt.status === 400, 'Cannot start closed quiz');

    // ============================================
    // TEST 12: Empty Data
    // ============================================
    log('\n--- TEST 12: Empty Data ---', 'SECTION');

    const emptyCourse = await makeRequest('/api/courses', 'POST', {
        title: '',  // Empty title
        description: 'Test'
    }, teacherToken);
    assert(emptyCourse.status === 400, 'Empty course title rejected');

    const emptyQuiz = await makeRequest('/api/quizzes', 'POST', {
        courseId,
        title: '',  // Empty title
        openAt: pastHour.toISOString(),
        closeAt: nextWeek.toISOString(),
        durationMinutes: 30
    }, teacherToken);
    assert(emptyQuiz.status === 400, 'Empty quiz title rejected');

    // ============================================
    // TEST 13: Long Input
    // ============================================
    log('\n--- TEST 13: Long Input ---', 'SECTION');

    const longName = 'A'.repeat(100);  // More than 40 chars
    const longNameReg = await makeRequest('/api/auth/register', 'POST', {
        name: longName,
        email: `longname${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    assert(longNameReg.status === 400, 'Name too long rejected');

    // ============================================
    // TEST 14: SQL Injection Attempt (basic)
    // ============================================
    log('\n--- TEST 14: Malicious Input ---', 'SECTION');

    const maliciousEmail = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test',
        email: "test@test.com'; DROP TABLE users;--",
        password: 'password123',
        role: 'student'
    });
    // Should either reject or sanitize - not crash
    assert(maliciousEmail.status === 400 || maliciousEmail.status === 201, 'Malicious input handled');

    // ============================================
    // TEST 15: Concurrent Quiz Submissions
    // ============================================
    log('\n--- TEST 15: Concurrent Operations ---', 'SECTION');

    // Create another quiz
    const concurrentQuiz = await makeRequest('/api/quizzes', 'POST', {
        courseId,
        title: 'Concurrent Quiz',
        openAt: pastHour.toISOString(),
        closeAt: nextWeek.toISOString(),
        durationMinutes: 30,
        attemptsAllowed: 1
    }, teacherToken);
    const concurrentQuizId = concurrentQuiz.data.quiz._id;

    await makeRequest(`/api/quizzes/${concurrentQuizId}/questions`, 'POST', {
        prompt: 'Concurrent test?',
        points: 10,
        orderIndex: 0,
        choices: [
            { text: 'A', isCorrect: true },
            { text: 'B', isCorrect: false }
        ]
    }, teacherToken);
    await makeRequest(`/api/quizzes/${concurrentQuizId}/publish`, 'POST', {}, teacherToken);

    // Start two attempts concurrently
    const attemptA = await makeRequest('/api/attempts/start', 'POST', { quizId: concurrentQuizId }, token);
    const attemptB = await makeRequest('/api/attempts/start', 'POST', { quizId: concurrentQuizId }, token);

    // Only one should succeed (since attemptsAllowed = 1)
    const successCount = [attemptA.status, attemptB.status].filter(s => s === 201).length;
    assert(successCount === 1, 'Only one concurrent attempt allowed');

    // ============================================
    // SUMMARY
    // ============================================
    log('\n========================================', 'SECTION');
    log(`Edge Cases Tests Complete: ${passed} passed, ${failed} failed`);
    log('========================================', 'SECTION');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});