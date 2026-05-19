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
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function test() {
    console.log('=== Testing Registration ===');

    // Test Teacher Registration
    console.log('\n1. Register Teacher:');
    const teacher = await makeRequest('/api/auth/register', 'POST', {
        name: 'Teacher User',
        email: 'teacher@test.com',
        password: 'password123',
        role: 'teacher'
    });
    console.log(teacher);

    // Test Student Registration
    console.log('\n2. Register Student:');
    const student = await makeRequest('/api/auth/register', 'POST', {
        name: 'Student User',
        email: 'student@test.com',
        password: 'password123',
        role: 'student'
    });
    console.log(student);

    console.log('\n=== Testing Login ===');

    // Test Teacher Login
    console.log('\n3. Login as Teacher:');
    const teacherLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'teacher@test.com',
        password: 'password123'
    });
    console.log(teacherLogin);

    // Test Student Login
    console.log('\n4. Login as Student:');
    const studentLogin = await makeRequest('/api/auth/login', 'POST', {
        email: 'student@test.com',
        password: 'password123'
    });
    console.log(studentLogin);
}

test().catch(console.error);