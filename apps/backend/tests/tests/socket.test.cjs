const http = require('http');
const { spawn } = require('child_process');
const io = require('socket.io-client');

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
    log('Starting Socket.io test suite...', 'SECTION');
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
    // Setup: Create users and course
    // ============================================
    log('\n--- SETUP ---', 'SECTION');

    const studentReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Socket Student',
        email: `socketstudent${uniqueId}@test.com`,
        password: 'password123',
        role: 'student'
    });
    const studentToken = studentReg.data.token;

    const teacherReg = await makeRequest('/api/auth/register', 'POST', {
        name: 'Socket Teacher',
        email: `socketteacher${uniqueId}@test.com`,
        password: 'password123',
        role: 'teacher'
    });
    const teacherToken = teacherReg.data.token;

    const createCourse = await makeRequest('/api/courses', 'POST', {
        title: 'Socket Test Course',
        description: 'Course for socket testing'
    }, teacherToken);
    const courseId = createCourse.data.course._id;

    const joinCourse = await makeRequest('/api/courses/join', 'POST', {
        joinCode: createCourse.data.course.joinCode
    }, studentToken);

    // ============================================
    // TEST 1: Socket.io Connection
    // ============================================
    log('\n--- TEST 1: Socket.io Connection ---', 'SECTION');

    let socket;
    try {
        socket = io(BASE_URL, {
            auth: { token: studentToken },
            transports: ['websocket'],
            timeout: 5000
        });

        const connected = await new Promise((resolve, reject) => {
            socket.on('connect', () => resolve(true));
            socket.on('connect_error', (err) => resolve(false));
            setTimeout(() => resolve(false), 5000);
        });

        assert(connected, 'Socket.io connection established');
    } catch (err) {
        assert(false, 'Socket.io connection: ' + err.message);
    }

    // ============================================
    // TEST 2: Join Course Room
    // ============================================
    log('\n--- TEST 2: Join Course Room ---', 'SECTION');

    if (socket && socket.connected) {
        const roomJoined = await new Promise((resolve) => {
            socket.emit('join-course', { courseId }, (response) => {
                resolve(response.success === true);
            });
            setTimeout(() => resolve(false), 3000);
        });
        assert(roomJoined, 'Join course room');
    } else {
        assert(false, 'Join course room (socket not connected)');
    }

    // ============================================
    // TEST 3: Receive New Quiz Notification
    // ============================================
    log('\n--- TEST 3: New Quiz Notification ---', 'SECTION');

    let quizNotificationReceived = false;
    if (socket && socket.connected) {
        socket.on('new-quiz', (data) => {
            quizNotificationReceived = true;
        });

        // Teacher creates and publishes a quiz
        const now = new Date();
        const pastHour = new Date(now.getTime() - 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const createQuiz = await makeRequest('/api/quizzes', 'POST', {
            courseId,
            title: 'Socket Quiz',
            description: 'Quiz for socket test',
            openAt: pastHour.toISOString(),
            closeAt: nextWeek.toISOString(),
            durationMinutes: 30,
            attemptsAllowed: 1
        }, teacherToken);
        const quizId = createQuiz.data.quiz._id;

        await makeRequest(`/api/quizzes/${quizId}/publish`, 'POST', {}, teacherToken);

        // Wait for notification
        await new Promise(r => setTimeout(r, 2000));
        assert(quizNotificationReceived, 'Receive new-quiz notification');
    } else {
        assert(false, 'Receive new-quiz notification (socket not connected)');
    }

    // ============================================
    // TEST 4: Receive New Note Notification
    // ============================================
    log('\n--- TEST 4: New Note Notification ---', 'SECTION');

    let noteNotificationReceived = false;
    if (socket && socket.connected) {
        socket.on('new-note', (data) => {
            noteNotificationReceived = true;
        });

        // Teacher creates a note
        await makeRequest(`/api/notes/courses/${courseId}/notes`, 'POST', {
            title: 'Socket Note',
            content: 'Note for socket testing'
        }, teacherToken);

        // Wait for notification
        await new Promise(r => setTimeout(r, 2000));
        assert(noteNotificationReceived, 'Receive new-note notification');
    } else {
        assert(false, 'Receive new-note notification (socket not connected)');
    }

    // ============================================
    // TEST 5: Chat Message via Socket
    // ============================================
    log('\n--- TEST 5: Chat via Socket.io ---', 'SECTION');

    let chatMessageReceived = false;
    if (socket && socket.connected) {
        socket.on('chat-message', (data) => {
            chatMessageReceived = true;
        });

        // Student joins course room first
        await new Promise((resolve) => {
            socket.emit('join-course', { courseId }, (response) => resolve(response));
        });

        // Teacher sends message via REST (which should emit via socket)
        await makeRequest('/api/chats', 'POST', {
            courseId,
            message: 'Hello from socket test'
        }, teacherToken);

        // Wait for message
        await new Promise(r => setTimeout(r, 2000));
        assert(chatMessageReceived, 'Receive chat message via socket');
    } else {
        assert(false, 'Receive chat message (socket not connected)');
    }

    // ============================================
    // TEST 6: Disconnect Handling
    // ============================================
    log('\n--- TEST 6: Disconnect Handling ---', 'SECTION');

    if (socket && socket.connected) {
        socket.disconnect();
        await new Promise(r => setTimeout(r, 500));
        assert(!socket.connected, 'Socket disconnected properly');
    } else {
        assert(true, 'Socket disconnect (not connected)');
    }

    // ============================================
    // SUMMARY
    // ============================================
    log('\n========================================', 'SECTION');
    log(`Socket Tests Complete: ${passed} passed, ${failed} failed`);
    log('========================================', 'SECTION');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
});