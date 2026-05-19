import { http, HttpResponse, delay } from "msw";

// Mock data
const mockUsers = [
    { _id: "1", name: "Test Student", email: "student@test.com", role: "student", points: 100 },
    { _id: "2", name: "Test Teacher", email: "teacher@test.com", role: "teacher", points: 0 },
    { _id: "3", name: "Test Admin", email: "admin@test.com", role: "admin", points: 0 },
];

const mockCourses = [
    { _id: "c1", title: "Introduction to React", description: "Learn React basics", joinCode: "REACT1", teacher: "2", students: ["1"] },
    { _id: "c2", title: "Advanced JavaScript", description: "Deep dive into JS", joinCode: "JSADV", teacher: "2", students: [] },
];

const mockQuizzes = [
    { _id: "q1", course: "c1", title: "React Basics Quiz", description: "Test your React knowledge", openAt: new Date().toISOString(), closeAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 30, attemptsAllowed: 3, published: true, gradingMode: "onSubmit" },
    { _id: "q2", course: "c1", title: "React Hooks Quiz", description: "Test hooks knowledge", openAt: new Date().toISOString(), closeAt: new Date(Date.now() + 172800000).toISOString(), durationMinutes: 20, attemptsAllowed: 2, published: true, gradingMode: "onClose" },
];

const mockQuestions = [
    { _id: "ques1", quiz: "q1", text: "What is React?", options: ["Library", "Framework", "Language", "Database"], correctOption: 0, points: 10 },
    { _id: "ques2", quiz: "q1", text: "What is JSX?", options: ["Syntax", "Language", "Database", "Framework"], correctOption: 0, points: 10 },
];

const mockAttempts = [
    { _id: "a1", quiz: "q1", student: "1", answers: [{ questionId: "ques1", selectedOption: 0 }], score: 10, startedAt: new Date().toISOString(), submittedAt: new Date().toISOString() },
];

const mockNotes = [
    { _id: "n1", course: "c1", title: "React Introduction", content: "React is a JavaScript library...", teacher: "2", createdAt: new Date().toISOString() },
];

const mockNotifications = [
    { _id: "notif1", user: "1", type: "quiz", title: "New Quiz", message: "React Basics Quiz is now available", read: false, createdAt: new Date().toISOString() },
];

const mockEvents = [
    { _id: "e1", course: "c1", title: "Exam", description: "Final exam", start: new Date(Date.now() + 86400000).toISOString(), end: new Date(Date.now() + 90000000).toISOString() },
];

const mockTickets = [
    { _id: "t1", user: "1", subject: "Login Issue", description: "Cannot login to my account", status: "open", priority: "high", createdAt: new Date().toISOString() },
];

const handlers = [
    // Auth endpoints
    http.post("/api/auth/login", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        const user = mockUsers.find(u => u.email === body.email);
        if (user) {
            return HttpResponse.json({
                success: true,
                data: {
                    user,
                    token: "mock-token-" + Date.now(),
                    refreshToken: "mock-refresh-" + Date.now(),
                },
            });
        }
        return HttpResponse.json({ success: false, errMsg: "Invalid credentials" }, { status: 401 });
    }),

    http.post("/api/auth/register", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        const newUser = {
            _id: "new-" + Date.now(),
            name: body.name,
            email: body.email,
            role: body.role,
            points: 0,
        };
        return HttpResponse.json({ success: true, data: { user: newUser } });
    }),

    http.get("/api/auth/me", async () => {
        await delay(50);
        return HttpResponse.json({
            success: true,
            data: mockUsers[0],
        });
    }),

    http.post("/api/auth/refresh", async () => {
        await delay(50);
        return HttpResponse.json({
            success: true,
            data: {
                token: "new-mock-token-" + Date.now(),
                refreshToken: "new-mock-refresh-" + Date.now(),
            },
        });
    }),

    http.post("/api/auth/logout", async () => {
        await delay(50);
        return HttpResponse.json({ success: true });
    }),

    // Courses endpoints
    http.get("/api/courses", async ({ request }) => {
        await delay(100);
        const url = new URL(request.url);
        const teacherId = url.searchParams.get("teacher");
        let courses = [...mockCourses];
        if (teacherId) {
            courses = courses.filter(c => c.teacher === teacherId);
        }
        return HttpResponse.json({ success: true, data: courses });
    }),

    http.get("/api/courses/:id", async ({ params }) => {
        await delay(50);
        const course = mockCourses.find(c => c._id === params.id);
        if (course) {
            return HttpResponse.json({ success: true, data: course });
        }
        return HttpResponse.json({ success: false, errMsg: "Course not found" }, { status: 404 });
    }),

    http.post("/api/courses", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        const newCourse = {
            _id: "c" + Date.now(),
            ...body,
            joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
            students: [],
        };
        return HttpResponse.json({ success: true, data: newCourse });
    }),

    http.put("/api/courses/:id", async ({ params, request }) => {
        await delay(100);
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { _id: params.id, ...body } });
    }),

    http.delete("/api/courses/:id", async () => {
        await delay(100);
        return HttpResponse.json({ success: true });
    }),

    http.post("/api/courses/join", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        const course = mockCourses.find(c => c.joinCode === body.joinCode);
        if (course) {
            return HttpResponse.json({ success: true, data: course });
        }
        return HttpResponse.json({ success: false, errMsg: "Invalid join code" }, { status: 400 });
    }),

    // Quizzes endpoints
    http.get("/api/quizzes", async ({ request }) => {
        await delay(100);
        const url = new URL(request.url);
        const courseId = url.searchParams.get("course");
        let quizzes = [...mockQuizzes];
        if (courseId) {
            quizzes = quizzes.filter(q => q.course === courseId);
        }
        return HttpResponse.json({ success: true, data: quizzes });
    }),

    http.get("/api/quizzes/:id", async ({ params }) => {
        await delay(50);
        const quiz = mockQuizzes.find(q => q._id === params.id);
        if (quiz) {
            return HttpResponse.json({ success: true, data: quiz });
        }
        return HttpResponse.json({ success: false, errMsg: "Quiz not found" }, { status: 404 });
    }),

    http.post("/api/quizzes", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        const newQuiz = { _id: "q" + Date.now(), ...body, published: false };
        return HttpResponse.json({ success: true, data: newQuiz });
    }),

    http.put("/api/quizzes/:id", async ({ params, request }) => {
        await delay(100);
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { _id: params.id, ...body } });
    }),

    http.delete("/api/quizzes/:id", async () => {
        await delay(100);
        return HttpResponse.json({ success: true });
    }),

    http.post("/api/quizzes/:id/submit", async ({ request }) => {
        await delay(200);
        const body = await request.json();
        const score = Math.floor(Math.random() * 100);
        return HttpResponse.json({
            success: true,
            data: {
                attemptId: "a" + Date.now(),
                score,
                totalPoints: body.answers.length * 10,
            },
        });
    }),

    // Questions endpoints
    http.get("/api/questions", async ({ request }) => {
        await delay(100);
        const url = new URL(request.url);
        const quizId = url.searchParams.get("quizId");
        let questions = [...mockQuestions];
        if (quizId) {
            questions = questions.filter(q => q.quiz === quizId);
        }
        return HttpResponse.json({ success: true, data: questions });
    }),

    http.post("/api/questions", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        const newQuestion = { _id: "ques" + Date.now(), ...body };
        return HttpResponse.json({ success: true, data: newQuestion });
    }),

    http.put("/api/questions/:id", async ({ params, request }) => {
        await delay(100);
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { _id: params.id, ...body } });
    }),

    http.delete("/api/questions/:id", async () => {
        await delay(100);
        return HttpResponse.json({ success: true });
    }),

    // Attempts endpoints
    http.get("/api/attempts", async () => {
        await delay(100);
        return HttpResponse.json({ success: true, data: mockAttempts });
    }),

    http.get("/api/attempts/:id", async ({ params }) => {
        await delay(50);
        const attempt = mockAttempts.find(a => a._id === params.id);
        if (attempt) {
            return HttpResponse.json({ success: true, data: attempt });
        }
        return HttpResponse.json({ success: false, errMsg: "Attempt not found" }, { status: 404 });
    }),

    // Notes endpoints
    http.get("/api/notes", async ({ request }) => {
        await delay(100);
        const url = new URL(request.url);
        const courseId = url.searchParams.get("courseId");
        let notes = [...mockNotes];
        if (courseId) {
            notes = notes.filter(n => n.course === courseId);
        }
        return HttpResponse.json({ success: true, data: notes });
    }),

    http.get("/api/notes/:id", async ({ params }) => {
        await delay(50);
        const note = mockNotes.find(n => n._id === params.id);
        if (note) {
            return HttpResponse.json({ success: true, data: note });
        }
        return HttpResponse.json({ success: false, errMsg: "Note not found" }, { status: 404 });
    }),

    http.post("/api/notes", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        const newNote = { _id: "n" + Date.now(), ...body, createdAt: new Date().toISOString() };
        return HttpResponse.json({ success: true, data: newNote });
    }),

    // Comments endpoints
    http.get("/api/comments", async () => {
        await delay(100);
        return HttpResponse.json({ success: true, data: [] });
    }),

    http.post("/api/comments", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { _id: "c" + Date.now(), ...body } });
    }),

    // Chat endpoints
    http.get("/api/chats", async () => {
        await delay(100);
        return HttpResponse.json({ success: true, data: [] });
    }),

    http.post("/api/chats", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { _id: "chat" + Date.now(), ...body } });
    }),

    // Analytics endpoints
    http.get("/api/analytics/overview", async () => {
        await delay(100);
        return HttpResponse.json({
            success: true,
            data: {
                totalUsers: 100,
                totalCourses: 20,
                totalQuizzes: 50,
                activeUsers: 80,
            },
        });
    }),

    http.get("/api/analytics/course/:id", async () => {
        await delay(100);
        return HttpResponse.json({
            success: true,
            data: {
                enrolledStudents: 25,
                averageGrade: 75,
                quizCompletionRate: 80,
            },
        });
    }),

    // Leaderboard endpoint
    http.get("/api/leaderboard", async () => {
        await delay(100);
        return HttpResponse.json({
            success: true,
            data: [
                { rank: 1, user: mockUsers[0], points: 100, coursesCompleted: 5, quizzesTaken: 10 },
                { rank: 2, user: mockUsers[1], points: 80, coursesCompleted: 3, quizzesTaken: 8 },
            ],
        });
    }),

    // Notifications endpoints
    http.get("/api/notifications", async () => {
        await delay(100);
        return HttpResponse.json({ success: true, data: mockNotifications });
    }),

    http.put("/api/notifications/:id/read", async () => {
        await delay(50);
        return HttpResponse.json({ success: true });
    }),

    http.put("/api/notifications/read-all", async () => {
        await delay(50);
        return HttpResponse.json({ success: true });
    }),

    // Admin endpoints
    http.get("/api/admin/users", async () => {
        await delay(100);
        return HttpResponse.json({ success: true, data: mockUsers });
    }),

    http.delete("/api/admin/users/:id", async () => {
        await delay(100);
        return HttpResponse.json({ success: true });
    }),

    // Calendar events endpoints
    http.get("/api/events", async ({ request }) => {
        await delay(100);
        const url = new URL(request.url);
        const courseId = url.searchParams.get("courseId");
        let events = [...mockEvents];
        if (courseId) {
            events = events.filter(e => e.course === courseId);
        }
        return HttpResponse.json({ success: true, data: events });
    }),

    http.post("/api/events", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { _id: "e" + Date.now(), ...body } });
    }),

    // Tickets endpoints
    http.get("/api/tickets", async () => {
        await delay(100);
        return HttpResponse.json({ success: true, data: mockTickets });
    }),

    http.post("/api/tickets", async ({ request }) => {
        await delay(100);
        const body = await request.json();
        return HttpResponse.json({ success: true, data: { _id: "t" + Date.now(), ...body, status: "open" } });
    }),
];

export default handlers;