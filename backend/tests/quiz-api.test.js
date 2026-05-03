import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import Joi from "joi";
// Create validation schemas (same as in quiz.controller.ts)
const createQuizSchema = Joi.object({
    title: Joi.string().min(2).required(),
    description: Joi.string().allow("").optional(),
    openAt: Joi.alternatives()
        .try(Joi.date().iso(), Joi.string().isoDate())
        .required(),
    closeAt: Joi.alternatives()
        .try(Joi.date().iso(), Joi.string().isoDate())
        .required(),
    attemptsAllowed: Joi.number().min(1).default(1),
    durationMinutes: Joi.number().min(10).required(),
})
    .unknown(true)
    .custom((value, helpers) => {
    try {
        const openDate = new Date(value.openAt);
        const closeDate = new Date(value.closeAt);
        if (openDate >= closeDate) {
            throw new Error("openAt must be before closeAt");
        }
        const timeWindowMinutes = (closeDate.getTime() - openDate.getTime()) / (1000 * 60);
        if (value.durationMinutes > timeWindowMinutes) {
            throw new Error(`durationMinutes cannot exceed the time window between openAt and closeAt (${Math.floor(timeWindowMinutes)} minutes)`);
        }
        return value;
    }
    catch (err) {
        throw new Error(err.message || "Invalid date format");
    }
});
const updateQuizSchema = Joi.object({
    title: Joi.string().min(2).optional(),
    description: Joi.string().allow("").optional(),
    openAt: Joi.date().optional(),
    closeAt: Joi.date().optional(),
    attemptsAllowed: Joi.number().min(1).optional(),
    durationMinutes: Joi.number().min(10).optional(),
    published: Joi.boolean().optional(),
}).custom((value, helpers) => {
    if (value.openAt &&
        value.closeAt &&
        new Date(value.openAt) >= new Date(value.closeAt)) {
        throw new Error("openAt must be before closeAt");
    }
    if (value.openAt && value.closeAt && value.durationMinutes) {
        const openDate = new Date(value.openAt);
        const closeDate = new Date(value.closeAt);
        const timeWindowMinutes = (closeDate.getTime() - openDate.getTime()) / (1000 * 60);
        if (value.durationMinutes > timeWindowMinutes) {
            throw new Error(`durationMinutes cannot exceed the time window between openAt and closeAt (${Math.floor(timeWindowMinutes)} minutes)`);
        }
    }
    return value;
});
// Create test app
const testApp = express();
testApp.use(express.json());
// Test auth middleware
const testAuthMiddleware = (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ errMsg: "unauthenticated" });
    }
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "test-secret");
        req.user = { _id: payload._id, role: payload.role };
        next();
    }
    catch {
        return res.status(401).json({ errMsg: "unable to verify user" });
    }
};
const testRequireRole = (role) => {
    return (req, res, next) => {
        if (req.user?.role !== role) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        next();
    };
};
// Test routes
const testRouter = express.Router();
// POST /:id/quizzes
testRouter.post("/:id/quizzes", testAuthMiddleware, testRequireRole("teacher"), async (req, res) => {
    const { error, value } = createQuizSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ errMsg: error.message });
    }
    res.status(201).json({ message: "Quiz created", quiz: value });
});
// POST / (from body)
testRouter.post("/", testAuthMiddleware, testRequireRole("teacher"), async (req, res) => {
    const { error, value } = createQuizSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ errMsg: error.message });
    }
    res.status(201).json({ message: "Quiz created", quiz: value });
});
// PUT /:id
testRouter.put("/:id", testAuthMiddleware, testRequireRole("teacher"), async (req, res) => {
    const { error, value } = updateQuizSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ errMsg: error.message });
    }
    res.status(200).json({ message: "Quiz updated", quiz: value });
});
testApp.use("/api/quizzes", testRouter);
describe("Quiz API - POST /:id/quizzes", () => {
    const validToken = jwt.sign({ _id: "teacher123", role: "teacher" }, process.env.JWT_SECRET || "test-secret");
    const validQuiz = {
        title: "Test Quiz",
        openAt: "2026-05-10T10:00:00Z",
        closeAt: "2026-05-10T12:00:00Z",
        durationMinutes: 60,
    };
    it("returns 201 with valid quiz data", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send(validQuiz);
        expect(res.status).toBe(201);
        expect(res.body.message).toBe("Quiz created");
    });
    it("returns 401 without auth token", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .send(validQuiz);
        expect(res.status).toBe(401);
    });
    it("returns 401 with invalid token", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", "Bearer invalid-token")
            .send(validQuiz);
        expect(res.status).toBe(401);
    });
    it("returns 400 if duration < 10 minutes", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ ...validQuiz, durationMinutes: 5 });
        expect(res.status).toBe(400);
        expect(res.body.errMsg).toContain("durationMinutes");
    });
    it("returns 400 if duration exceeds time window", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            ...validQuiz,
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T10:30:00Z",
            durationMinutes: 31,
        });
        expect(res.status).toBe(400);
        expect(res.body.errMsg).toContain("cannot exceed");
    });
    it("returns 400 if openAt equals closeAt", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            ...validQuiz,
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T10:00:00Z",
        });
        expect(res.status).toBe(400);
    });
    it("returns 400 with empty title", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ ...validQuiz, title: "" });
        expect(res.status).toBe(400);
    });
    it("returns 400 with title < 2 characters", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ ...validQuiz, title: "A" });
        expect(res.status).toBe(400);
    });
    it("passes with minimum valid duration (10 min)", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            ...validQuiz,
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T10:15:00Z",
            durationMinutes: 10,
        });
        expect(res.status).toBe(201);
    });
    it("passes with all optional fields", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            title: "Full Quiz",
            description: "Description",
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T12:00:00Z",
            durationMinutes: 60,
            attemptsAllowed: 3,
        });
        expect(res.status).toBe(201);
    });
});
describe("Quiz API - PUT /:id", () => {
    const validToken = jwt.sign({ _id: "teacher123", role: "teacher" }, process.env.JWT_SECRET || "test-secret");
    it("returns 200 with valid update", async () => {
        const res = await request(testApp)
            .put("/api/quizzes/quiz123")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ title: "Updated Quiz", durationMinutes: 30 });
        expect(res.status).toBe(200);
    });
    it("returns 400 if duration < 10 minutes", async () => {
        const res = await request(testApp)
            .put("/api/quizzes/quiz123")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ durationMinutes: 5 });
        expect(res.status).toBe(400);
    });
    it("returns 400 if duration exceeds time window", async () => {
        const res = await request(testApp)
            .put("/api/quizzes/quiz123")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T11:00:00Z",
            durationMinutes: 61,
        });
        expect(res.status).toBe(400);
    });
    it("returns 400 if openAt after closeAt", async () => {
        const res = await request(testApp)
            .put("/api/quizzes/quiz123")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            openAt: "2026-05-10T12:00:00Z",
            closeAt: "2026-05-10T10:00:00Z",
        });
        expect(res.status).toBe(400);
    });
    it("passes with only title update", async () => {
        const res = await request(testApp)
            .put("/api/quizzes/quiz123")
            .set("Authorization", `Bearer ${validToken}`)
            .send({ title: "New Title" });
        expect(res.status).toBe(200);
    });
});
describe("Quiz API - Validation Edge Cases", () => {
    const validToken = jwt.sign({ _id: "teacher123", role: "teacher" }, process.env.JWT_SECRET || "test-secret");
    it("rejects duration = 9 minutes", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            title: "Test Quiz",
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T12:00:00Z",
            durationMinutes: 9,
        });
        expect(res.status).toBe(400);
    });
    it("rejects duration = time window + 1", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            title: "Test Quiz",
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T10:30:00Z",
            durationMinutes: 31,
        });
        expect(res.status).toBe(400);
    });
    it("accepts duration at exact time window", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            title: "Test Quiz",
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T10:30:00Z",
            durationMinutes: 30,
        });
        expect(res.status).toBe(201);
    });
    it("rejects missing title", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T12:00:00Z",
            durationMinutes: 60,
        });
        expect(res.status).toBe(400);
    });
    it("rejects missing openAt", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            title: "Test Quiz",
            closeAt: "2026-05-10T12:00:00Z",
            durationMinutes: 60,
        });
        expect(res.status).toBe(400);
    });
    it("rejects missing closeAt", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            title: "Test Quiz",
            openAt: "2026-05-10T10:00:00Z",
            durationMinutes: 60,
        });
        expect(res.status).toBe(400);
    });
    it("rejects missing durationMinutes", async () => {
        const res = await request(testApp)
            .post("/api/quizzes/course123/quizzes")
            .set("Authorization", `Bearer ${validToken}`)
            .send({
            title: "Test Quiz",
            openAt: "2026-05-10T10:00:00Z",
            closeAt: "2026-05-10T12:00:00Z",
        });
        expect(res.status).toBe(400);
    });
});
//# sourceMappingURL=quiz-api.test.js.map