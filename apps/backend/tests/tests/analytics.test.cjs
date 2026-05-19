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
    log('Starting Analytics test suite...', 'SECTION');
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

    // Setup
    log('\n--- SETUP ---', 'SECTION');

    const teacherReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Analytics Teacher',
        email: `analyticsteacher${uniqueId}@test.com`,
        password: 'password123',
        role: 'teacher'
    });
    const teacherToken = teacherReg.data.token;

    const student1Reg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Analytics Student 1',
        email: `analyticsstudent1${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    const student1Token = student1Reg.data.token;
    const student1Id = student1Reg.data.user.id;

    const student2Reg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Analytics Student 2',
        email: `analyticsstudent2${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    const student2Token = student2Reg.data.token;

    const createCourse = await makeRequest('/api/courses', 'POST', {
        title: 'Analytics Test Course',
        description: 'Course for analytics testing'
    }, teacherToken);
    const courseId = createCourse.data.course._id;
    const joinCode = createCourse.data.course.joinCode;

    await makeRequest('/api/courses/join', 'POST', { joinCode }, student1Token);
    await makeRequest('/api/courses/join', 'POST', { joinCode }, student2Token);

    const now = new Date();
    const pastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const createQuiz = await makeRequest('/api/quizzes', 'POST', {
        courseId,
        title: 'Analytics Quiz',
        description: 'Quiz for analytics',
        openAt: pastHour.toISOString(),
        closeAt: nextWeek.toISOString(),
        durationMinutes: 30,
        attemptsAllowed: 3
    }, teacherToken);
    const quizId = createQuiz.data.quiz._id;

    await makeRequest(`/api/quizzes/${quizId}/questions`, 'POST', {
        prompt: 'What is 2+2?',
        points: 10,
        orderIndex: 0,
        choices: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false }
        ]
    }, teacherToken);

    await makeRequest(`/api/quizzes/${quizId}/publish`, 'POST', {}, teacherToken);

    // Student 1 takes quiz
    const startAttempt1 = await makeRequest('/api/attempts/start', 'POST', { quizId }, student1Token);
    const attempt1Id = startAttempt1.data.attemptId;
    const quizDetails1 = await makeRequest(`/api/quizzes/${quizId}`, 'GET', null, student1Token);
    const q1 = quizDetails1.data.questions[0];
    await makeRequest(`/api/attempts/${attempt1Id}/answers`, 'PATCH', { questionId: q1._id, selectedChoiceIds: [q1.choices[1]._id] }, student1Token);
    await makeRequest(`/api/attempts/${attempt1Id}/submit`, 'POST', {}, student1Token);

    // ============================================
    // TEST 1: Teacher Analytics Overview
    // ============================================
    log('\n--- TEST 1: Teacher Analytics Overview ---', 'SECTION');

    const analyticsOverview = await makeRequest('/api/analytics/overview', 'GET', null, teacherToken);
    assert(analyticsOverview.status === 200, 'Teacher: Get analytics overview');
    if (analyticsOverview.status === 200) {
        const data = analyticsOverview.data;
        assert(data.totalStudents !== undefined, 'Overview: totalStudents present');
        assert(data.totalCourses !== undefined, 'Overview: totalCourses present');
        assert(data.totalQuizzes !== undefined, 'Overview: totalQuizzes present');
    }

    // ============================================
    // TEST 2: Course Analytics
    // ============================================
    log('\n--- TEST 2: Course Analytics ---', 'SECTION');

    const courseAnalytics = await makeRequest(`/api/analytics/course/${courseId}`, 'GET', null, teacherToken);
    assert(courseAnalytics.status === 200, 'Teacher: Get course analytics');
    if (courseAnalytics.status === 200) {
        const data = courseAnalytics.data;
        assert(data.course !== undefined, 'Course analytics: course info present');
        assert(data.enrollmentCount !== undefined, 'Course analytics: enrollment count');
        assert(data.quizStats !== undefined, 'Course analytics: quiz stats');
    }

    // ============================================
    // TEST 3: Student Analytics
    // ============================================
    log('\n--- TEST 3: Student Analytics ---', 'SECTION');

    const studentAnalytics = await makeRequest(`/api/analytics/student/${student1Id}`, 'GET', null, teacherToken);
    assert(studentAnalytics.status === 200, 'Teacher: Get student analytics');
    if (studentAnalytics.status === 200) {
        const data = studentAnalytics.data;
        assert(data.student !== undefined, 'Student analytics: student info');
        assert(data.enrolledCourses !== undefined, 'Student analytics: enrolled courses');
        assert(data.quizHistory !== undefined, 'Student analytics: quiz history');
    }

    // ============================================
    // TEST 4: Quiz Analytics
    // ============================================
    log('\n--- TEST 4: Quiz Analytics ---', 'SECTION');

    const quizAnalytics = await makeRequest(`/api/analytics/quiz/${quizId}`, 'GET', null, teacherToken);
    assert(quizAnalytics.status === 200, 'Teacher: Get quiz analytics');
    if (quizAnalytics.status === 200) {
        const data = quizAnalytics.data;
        assert(data.quiz !== undefined, 'Quiz analytics: quiz info');
        assert(data.attemptCount !== undefined, 'Quiz analytics: attempt count');
        assert(data.averageScore !== undefined, 'Quiz analytics: average score');
        assert(data.passRate !== undefined, 'Quiz analytics: pass rate');
    }

    // ============================================
    // TEST 5: Authorization
    // ============================================
    log('\n--- TEST 5: Authorization ---', 'SECTION');

    const studentOverview = await makeRequest('/api/analytics/overview', 'GET', null, student1Token);
    assert(studentOverview.status === 403, 'Student cannot access analytics overview');

    const studentCourseAnalytics = await makeRequest(`/api/analytics/course/${courseId}`, 'GET', null, student1Token);
    assert(studentCourseAnalytics.status === 403, 'Student cannot access course analytics');

    // ============================================
    // TEST 6: Quiz Performance Details
    // ============================================
    log('\n--- TEST 6: Quiz Performance Details ---', 'SECTION');

    const quizPerformance = await makeRequest(`/api/analytics/quiz/${quizId}/performance`, 'GET', null, teacherToken);
    assert(quizPerformance.status === 200, 'Teacher: Get quiz performance details');

    // ============================================
    // TEST 7: Export Analytics
    // ============================================
    log('\n--- TEST 7: Export Analytics ---', 'SECTION');

    const exportCsv = await makeRequest(`/api/analytics/export?format=csv&type=course&courseId=${courseId}`, 'GET', null, teacherToken);
    assert(exportCsv.status === 200, 'Export analytics as CSV');

    const exportJson = await makeRequest(`/api/analytics/export?format=json&type=quiz&quizId=${quizId}`, 'GET', null, teacherToken);
    assert(exportJson.status === 200, 'Export analytics as JSON');

    // ============================================
    // TEST 8: Leaderboard Analytics
    // ============================================
    log('\n--- TEST 8: Leaderboard Analytics ---', 'SECTION');

    const leaderboard = await makeRequest(`/api/leaderboard/course/${courseId}`, 'GET', null, teacherToken);
    assert(leaderboard.status === 200, 'Get course leaderboard');

    // ============================================
    // TEST 9: Global Leaderboard
    // ============================================
    log('\n--- TEST 9: Global Leaderboard ---', 'SECTION');

    const globalLeaderboard = await makeRequest('/api/leaderboard', 'GET', null, teacherToken);
    assert(globalLeaderboard.status === 200, 'Get global leaderboard');

    // ============================================
    // TEST 10: Activity Analytics
    // ============================================
    log('\n--- TEST 10: Activity Analytics ---', 'SECTION');

    const activityAnalytics = await makeRequest(`/api/analytics/activity?courseId=${courseId}`, 'GET', null, teacherToken);
    assert(activityAnalytics.status === 200, 'Get activity analytics');

    // ============================================
    // SUMMARY
    // ============================================
    log('\n========================================', 'SECTION');
    log(`Analytics Tests Complete: ${passed} passed, ${failed} failed`);
    log('========================================', 'SECTION');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});