const http = require('http');

function makeRequest(path, method, data) {
    return new Promise((resolve, reject) => {
        const body = data ? JSON.stringify(data) : null;
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': body ? Buffer.byteLength(body) : 0
            },
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Check for HTTP errors
                if (res.statusCode >= 400) {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch (parseErr) {
                    reject(new Error(`JSON parse error: ${data}`));
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        if (body) req.write(body);
        req.end();
    });
}

async function test() {
    console.log('=== Testing Registration ===');

    // Test Teacher Registration (with idempotency check)
    console.log('\n1. Register Teacher:');
    let teacher;
    try {
        // Try login first to check if user exists
        const loginCheck = await makeRequest('/api/auth/login', 'POST', {
            email: 'teacher@test.com',
            password: 'password123'
        });
        if (loginCheck.success && loginCheck.token) {
            console.log('Teacher already exists, using existing login');
            teacher = loginCheck;
        }
    } catch (err) {
        // User doesn't exist, register them
        teacher = await makeRequest('/api/auth/register', 'POST', {
            name: 'Teacher User',
            email: 'teacher@test.com',
            password: 'password123',
            role: 'teacher'
        });
    }
    console.log(teacher);

    // Test Student Registration (with idempotency check)
    console.log('\n2. Register Student:');
    let student;
    try {
        // Try login first to check if user exists
        const loginCheck = await makeRequest('/api/auth/login', 'POST', {
            email: 'student@test.com',
            password: 'password123'
        });
        if (loginCheck.success && loginCheck.token) {
            console.log('Student already exists, using existing login');
            student = loginCheck;
        }
    } catch (err) {
        // User doesn't exist, register them
        student = await makeRequest('/api/auth/register', 'POST', {
            name: 'Student User',
            email: 'student@test.com',
            password: 'password123',
            role: 'student'
        });
    }
    console.log(student);

    // Test Teacher Registration (admin fallback - same as teacher role)
    console.log('\n3. Register Teacher (admin fallback):');
    let admin;
    try {
        // Try login first to check if user exists
        const loginCheck = await makeRequest('/api/auth/login', 'POST', {
            email: 'admin@test.com',
            password: 'password123'
        });
        if (loginCheck.success && loginCheck.token) {
            console.log('Admin already exists, using existing login');
            admin = loginCheck;
        }
    } catch (err) {
        // User doesn't exist, register them
        admin = await makeRequest('/api/auth/register', 'POST', {
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'password123',
            role: 'teacher'
        });
    }
    console.log(admin);

    console.log('\n=== Testing Login ===');

    // Test Teacher Login
    console.log('\n4. Login as Teacher:');
    const teacherLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'teacher@test.com',
        password: 'password123'
    });
    console.log(teacherLogin);

    // Test Student Login
    console.log('\n5. Login as Student:');
    const studentLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'student@test.com',
        password: 'password123'
    });
    console.log(studentLogin);
}

test().catch(console.error);