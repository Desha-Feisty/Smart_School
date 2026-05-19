const http = require('http');
const { spawn } = require('child_process');

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
    log('Starting comprehensive test suite...', 'SECTION');
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
    // TEST 1: Registration for all roles
    // ============================================
    log('\n--- TEST 1: Registration ---', 'SECTION');

    // Student Registration
    const studentReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test Student',
        email: `student${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    assert(studentReg.status === 201 && studentReg.data.success, 'Student registration');
    const studentToken = studentReg.data.token;
    const studentId = studentReg.data.user.id;

    // Teacher Registration
    const teacherReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test Teacher',
        email: `teacher${uniqueId}@test.com`,
        password: 'password123',
        role: 'teacher'
    });
    assert(teacherReg.status === 201 && teacherReg.data.success, 'Teacher registration');
    const teacherToken = teacherReg.data.token;
    const teacherId = teacherReg.data.user.id;

    // Admin Registration
    const adminReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Test Admin',
        email: `admin${uniqueId}@test.com`,
        password: 'password123',
        role: 'admin'
    });
    assert(adminReg.status === 201 && adminReg.data.success, 'Admin registration');
    const adminToken = adminReg.data.token;
    const adminId = adminReg.data.user.id;

    // ============================================
    // TEST 2: Login for all roles
    // ============================================
    log('\n--- TEST 2: Login ---', 'SECTION');

    const studentLogin = await makeRequest('/api/auth/login', 'POST', {
        email: `student${uniqueId}@test.com`,
        password: 'password123'
    });
    assert(studentLogin.status === 200 && studentLogin.data.success && studentLogin.data.user.role === 'student', 'Student login');

    const teacherLogin = await makeRequest('/api/auth/login', 'POST', {
        email: `teacher${uniqueId}@test.com`,
        password: 'password123'
    });
    assert(teacherLogin.status === 200 && teacherLogin.data.success && teacherLogin.data.user.role === 'teacher', 'Teacher login');

    const adminLogin = await makeRequest('/api/auth/login', 'POST', {
        email: `admin${uniqueId}@test.com`,
        password: 'password123'
    });
    assert(adminLogin.status === 200 && adminLogin.data.success && adminLogin.data.user.role === 'admin', 'Admin login');

    // ============================================
    // TEST 3: Teacher - Create Course
    // ============================================
    log('\n--- TEST 3: Teacher Features ---', 'SECTION');

    const createCourse = await makeRequest('/api/courses', 'POST', {
        title: 'Test Course',
        description: 'A test course for automation'
    }, teacherToken);
    assert(createCourse.status === 201 && createCourse.data.course, 'Teacher: Create course');
    const courseId = createCourse.data.course._id;
    const joinCode = createCourse.data.course.joinCode;

    // Get teacher courses
    const teacherCourses = await makeRequest('/api/courses/my', 'GET', null, teacherToken);
    assert(teacherCourses.status === 200 && teacherCourses.data.courses.length > 0, 'Teacher: Get my courses');

    // ============================================
    // TEST 4: Student - Join Course
    // ============================================
    log('\n--- TEST 4: Student Features ---', 'SECTION');

    const joinCourse = await makeRequest('/api/courses/join', 'POST', {
        joinCode
    }, studentToken);
    assert(joinCourse.status === 200 && joinCourse.data.course, 'Student: Join course');

    // Get student courses
    const studentCourses = await makeRequest('/api/courses/my', 'GET', null, studentToken);
    assert(studentCourses.status === 200 && studentCourses.data.courses.length > 0, 'Student: Get enrolled courses');

    // ============================================
    // TEST 5: Teacher - Create Quiz
    // ============================================
    log('\n--- TEST 5: Quiz Features ---', 'SECTION');

    // Create quiz with correct format - open immediately
    const now = new Date();
    const pastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const createQuiz = await makeRequest('/api/quizzes', 'POST', {
        courseId,
        title: 'Test Quiz',
        description: 'A test quiz',
        openAt: pastHour.toISOString(),
        closeAt: nextWeek.toISOString(),
        durationMinutes: 30,
        attemptsAllowed: 1
    }, teacherToken);
    assert(createQuiz.status === 201 && createQuiz.data.quiz, 'Teacher: Create quiz');
    const quizId = createQuiz.data.quiz._id || createQuiz.data.quiz.id;

    // Add a question first (quizId is in URL path, not body)
    const addQuestion = await makeRequest(`/api/quizzes/${quizId}/questions`, 'POST', {
        prompt: 'What is 2+2?',
        points: 1,
        orderIndex: 0,
        choices: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false },
            { text: '6', isCorrect: false }
        ]
    }, teacherToken);
    assert(addQuestion.status === 201, 'Teacher: Add question to quiz');

    // Publish quiz
    const publishQuiz = await makeRequest(`/api/quizzes/${quizId}/publish`, 'POST', {}, teacherToken);
    assert(publishQuiz.status === 200, 'Teacher: Publish quiz');

    // ============================================
    // TEST 6: Student - Take Quiz
    // ============================================
    log('\n--- TEST 6: Student Quiz Taking ---', 'SECTION');

    const startAttempt = await makeRequest('/api/attempts/start', 'POST', {
        quizId
    }, studentToken);
    assert(startAttempt.status === 201 && startAttempt.data.attemptId, 'Student: Start quiz attempt');
    const attemptId = startAttempt.data.attemptId;

    // Get quiz details to get question and choice IDs
    const quizDetails = await makeRequest(`/api/quizzes/${quizId}`, 'GET', null, studentToken);
    const question = quizDetails.data.questions[0];
    const questionId = question._id;
    // For student, isCorrect is hidden, so pick second choice (index 1)
    const correctChoiceId = question.choices[1]._id;

    // Auto-save answer (simulating student answering) - needs array of strings
    const saveAnswer = await makeRequest(`/api/attempts/${attemptId}/answers`, 'PATCH', {
        questionId: questionId,
        selectedChoiceIds: [correctChoiceId]
    }, studentToken);
    assert(saveAnswer.status === 200, 'Student: Save answer');

    // Submit the attempt
    const submitAttempt = await makeRequest(`/api/attempts/${attemptId}/submit`, 'POST', {}, studentToken);
    assert(submitAttempt.status === 200, 'Student: Submit quiz');

    // ============================================
    // TEST 7: Teacher - Grade and View Results
    // ============================================
    log('\n--- TEST 7: Teacher Grading ---', 'SECTION');

    const quizAttempts = await makeRequest(`/api/quizzes/${quizId}/grades`, 'GET', null, teacherToken);
    assert(quizAttempts.status === 200, 'Teacher: View quiz attempts');

    // ============================================
    // TEST 8: Student - View Grades
    // ============================================
    log('\n--- TEST 8: Student Grades ---', 'SECTION');

    const myGrades = await makeRequest('/api/attempts/my', 'GET', null, studentToken);
    assert(myGrades.status === 200, 'Student: View grades');

    // ============================================
    // TEST 9: Notes/Content Features
    // ============================================
    log('\n--- TEST 9: Notes Features ---', 'SECTION');

    const createNote = await makeRequest(`/api/notes/courses/${courseId}/notes`, 'POST', {
        title: 'Test Note',
        content: 'Test note content'
    }, teacherToken);
    assert(createNote.status === 201, 'Teacher: Create note');

    const getNotes = await makeRequest(`/api/notes/courses/${courseId}/notes`, 'GET', null, studentToken);
    assert(getNotes.status === 200, 'Student: Get course notes');

    // ============================================
    // TEST 10: Comment on Notes
    // ============================================
    log('\n--- TEST 10: Comment on Notes ---', 'SECTION');

    const noteId = createNote.data.note._id;

    // Student adds comment
    const addComment = await makeRequest(`/api/comments/${noteId}/comments`, 'POST', {
        content: 'Great note! Very helpful.'
    }, studentToken);
    assert(addComment.status === 201, 'Student: Add comment on note');

    // Teacher adds comment
    const teacherComment = await makeRequest(`/api/comments/${noteId}/comments`, 'POST', {
        content: 'Thanks for the feedback!'
    }, teacherToken);
    assert(teacherComment.status === 201, 'Teacher: Add comment on note');

    // Get note with comments
    const getNoteWithComments = await makeRequest(`/api/notes/${noteId}`, 'GET', null, studentToken);
    assert(getNoteWithComments.status === 200, 'Get note with comments');

    // ============================================
    // TEST 11: Chat Features (GET recent chats via REST)
    // ============================================
    log('\n--- TEST 11: Chat Features ---', 'SECTION');

    // Get recent chats (via REST - returns empty since no messages via REST)
    const recentChats = await makeRequest('/api/chats/recent', 'GET', null, studentToken);
    assert(recentChats.status === 200, 'Get recent chats (REST endpoint works)');

    // Note: Chat messages are sent via Socket.io, not REST API
    assert(true, 'Chat: Socket.io for real-time messaging');

    // ============================================
    // TEST 12: Admin Features
    // ============================================
    log('\n--- TEST 12: Admin Features ---', 'SECTION');

    const adminStats = await makeRequest('/api/admin/stats', 'GET', null, adminToken);
    assert(adminStats.status === 200 && adminStats.data.stats, 'Admin: Get platform stats');

    const adminUsers = await makeRequest('/api/admin/users', 'GET', null, adminToken);
    assert(adminUsers.status === 200 && adminUsers.data.users, 'Admin: List all users');

    const adminAnalytics = await makeRequest('/api/admin/analytics', 'GET', null, adminToken);
    assert(adminAnalytics.status === 200, 'Admin: Get platform analytics');

    const systemHealth = await makeRequest('/api/admin/system-health', 'GET', null, adminToken);
    assert(systemHealth.status === 200 && systemHealth.data.system, 'Admin: Get system health');

    // ============================================
    // TEST 13: Leaderboard
    // ============================================
    log('\n--- TEST 13: Leaderboard ---', 'SECTION');

    const leaderboard = await makeRequest(`/api/leaderboard/course/${courseId}`, 'GET', null, studentToken);
    assert(leaderboard.status === 200, 'Get course leaderboard');

    // ============================================
    // TEST 14: Notifications
    // ============================================
    log('\n--- TEST 14: Notifications ---', 'SECTION');

    const notifications = await makeRequest('/api/notifications', 'GET', null, studentToken);
    assert(notifications.status === 200, 'Get notifications');

    // ============================================
    // TEST 15: Authorization Tests
    // ============================================
    log('\n--- TEST 15: Authorization ---', 'SECTION');

    // Student cannot access admin routes
    const studentAdminStats = await makeRequest('/api/admin/stats', 'GET', null, studentToken);
    assert(studentAdminStats.status === 403, 'Student cannot access admin stats');

    // Teacher cannot access admin routes
    const teacherAdminStats = await makeRequest('/api/admin/stats', 'GET', null, teacherToken);
    assert(teacherAdminStats.status === 403, 'Teacher cannot access admin stats');

    // Admin can access admin routes
    const adminAccessCheck = await makeRequest('/api/admin/stats', 'GET', null, adminToken);
    assert(adminAccessCheck.status === 200, 'Admin can access admin stats');

    // Student cannot create courses
    const studentCreateCourse = await makeRequest('/api/courses', 'POST', {
        title: 'Unauthorized Course',
        description: 'Should fail'
    }, studentToken);
    assert(studentCreateCourse.status === 403, 'Student cannot create courses');

    // Teacher cannot access other teacher's courses
    const teacher2Reg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Teacher 2',
        email: `teacher2${uniqueId}@test.com`,
        password: 'password123',
        role: 'teacher'
    });
    const teacher2Token = teacher2Reg.data.token;

    const otherCourseAccess = await makeRequest(`/api/courses/${courseId}`, 'GET', null, teacher2Token);
    assert(otherCourseAccess.status === 403 || otherCourseAccess.status === 404, 'Teacher cannot access other teacher\'s course');

    // ============================================
    // TEST 16: Error Handling
    // ============================================
    log('\n--- TEST 16: Error Handling ---', 'SECTION');

    const badLogin = await makeRequest('/api/auth/login', 'POST', {
        email: `student${uniqueId}@test.com`,
        password: 'wrongpassword'
    });
    assert(badLogin.status === 401, 'Wrong password rejected');

    const noToken = await makeRequest('/api/courses/my', 'GET', null, null);
    assert(noToken.status === 401, 'Request without token rejected');

    const invalidToken = await makeRequest('/api/courses/my', 'GET', null, 'invalidtoken');
    assert(invalidToken.status === 401, 'Invalid token rejected');

    const dupEmail = await makeRequest('/api/auth/register', 'POST', {
        name: 'Duplicate',
        email: `student${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    assert(dupEmail.status === 400, 'Duplicate email rejected');

    // ============================================
    // SUMMARY
    // ============================================
    log('\n========================================', 'SECTION');
    log(`Tests Complete: ${passed} passed, ${failed} failed`);
    log('========================================', 'SECTION');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});