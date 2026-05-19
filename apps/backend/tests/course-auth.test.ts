import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Test auth middleware
const testAuthMiddleware = (req: any, res: any, next: any) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ errMsg: "unauthenticated" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "test-secret") as any;
        req.user = { _id: payload._id, role: payload.role };
        next();
    } catch {
        return res.status(401).json({ errMsg: "unable to verify user" });
    }
};

// Mock course and enrollment data
const mockCourses = new Map();
const mockEnrollments = new Map();

// Helper to create test tokens
const createToken = (userId: string, role: string) => {
    return jwt.sign({ _id: userId, role }, process.env.JWT_SECRET || "test-secret");
};

// Helper to create mock course
const createMockCourse = (id: string, teacherId: string, joinCode: string = "ABC123") => {
    const course = {
        _id: id,
        title: "Test Course",
        description: "Test Description",
        joinCode,
        teacher: { _id: teacherId, toString: () => teacherId },
        toObject: () => ({ _id: id, title: "Test Course", description: "Test Description" }),
    };
    mockCourses.set(id, course);
    return course;
};

// Helper to create mock enrollment
const createMockEnrollment = (courseId: string, userId: string, status: string = "active") => {
    const key = `${courseId}-${userId}`;
    const enrollment = { course: courseId, user: userId, status };
    mockEnrollments.set(key, enrollment);
    return enrollment;
};

// Simulate getCourse logic
const simulateGetCourse = (req: any, res: any) => {
    const { id: courseId } = req.params;

    if (!req.user) {
        return res.status(403).json({ errMsg: "forbidden" });
    }

    const course = mockCourses.get(courseId);
    if (!course) {
        return res.status(404).json({ errMsg: "error finding course" });
    }

    if (req.user.role === "teacher") {
        if (req.user._id !== course.teacher.toString()) {
            return res.status(403).json({ errMsg: "forbidden!" });
        }
    } else {
        const enrollment = mockEnrollments.get(`${courseId}-${req.user._id}`);
        if (!enrollment || enrollment.status !== "active") {
            return res.status(403).json({ errMsg: "forbidden" });
        }
    }

    return res.status(200).json({ course });
};

describe("Course Authorization - getCourse", () => {
    let testApp: express.Express;
    let teacherToken: string;
    let studentToken: string;
    let otherTeacherToken: string;
    const teacherId = "teacher123";
    const otherTeacherId = "teacher456";
    const studentId = "student123";
    const courseId = "course123";

    beforeEach(() => {
        // Clear mocks
        mockCourses.clear();
        mockEnrollments.clear();

        // Create test app
        testApp = express();
        testApp.use(express.json());
        testApp.use(testAuthMiddleware);

        // Add route
        testApp.get("/api/courses/:id", simulateGetCourse);

        // Create tokens
        teacherToken = createToken(teacherId, "teacher");
        otherTeacherToken = createToken(otherTeacherId, "teacher");
        studentToken = createToken(studentId, "student");

        // Create a course owned by teacher123
        createMockCourse(courseId, teacherId);
    });

    describe("Teacher access", () => {
        it("allows teacher to access own course", async () => {
            const res = await request(testApp)
                .get(`/api/courses/${courseId}`)
                .set("Authorization", `Bearer ${teacherToken}`);

            expect(res.status).toBe(200);
            expect(res.body.course).toBeDefined();
        });

        it("denies teacher access to another teacher's course", async () => {
            const res = await request(testApp)
                .get(`/api/courses/${courseId}`)
                .set("Authorization", `Bearer ${otherTeacherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.errMsg).toContain("forbidden");
        });

        it("returns 404 for non-existent course", async () => {
            const res = await request(testApp)
                .get("/api/courses/nonexistent")
                .set("Authorization", `Bearer ${teacherToken}`);

            expect(res.status).toBe(404);
            expect(res.body.errMsg).toContain("error finding course");
        });
    });

    describe("Student access with enrollment", () => {
        beforeEach(() => {
            // Enroll student in the course
            createMockEnrollment(courseId, studentId, "active");
        });

        it("allows student with active enrollment to access course", async () => {
            const res = await request(testApp)
                .get(`/api/courses/${courseId}`)
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.status).toBe(200);
            expect(res.body.course).toBeDefined();
        });

        it("denies student without enrollment", async () => {
            // Create a new student without enrollment
            const unenrolledStudentId = "student456";
            const unenrolledToken = createToken(unenrolledStudentId, "student");

            const res = await request(testApp)
                .get(`/api/courses/${courseId}`)
                .set("Authorization", `Bearer ${unenrolledToken}`);

            expect(res.status).toBe(403);
            expect(res.body.errMsg).toContain("forbidden");
        });

        it("denies student with removed enrollment", async () => {
            // Change enrollment status to removed
            mockEnrollments.set(`${courseId}-${studentId}`, {
                course: courseId,
                user: studentId,
                status: "removed",
            });

            const res = await request(testApp)
                .get(`/api/courses/${courseId}`)
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.status).toBe(403);
            expect(res.body.errMsg).toContain("forbidden");
        });
    });

    describe("Authentication", () => {
        it("returns 401 without auth token", async () => {
            const res = await request(testApp)
                .get(`/api/courses/${courseId}`);

            expect(res.status).toBe(401);
        });

        it("returns 401 with invalid token", async () => {
            const res = await request(testApp)
                .get(`/api/courses/${courseId}`)
                .set("Authorization", "Bearer invalid-token");

            expect(res.status).toBe(401);
        });
    });
});
