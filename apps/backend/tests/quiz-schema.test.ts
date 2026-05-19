import { describe, it, expect } from "vitest";
import Joi from "joi";

// Re-create the exact schemas from quiz.controller.ts for testing
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
        } catch (err: any) {
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
    if (
        value.openAt &&
        value.closeAt &&
        new Date(value.openAt) >= new Date(value.closeAt)
    ) {
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

describe("Quiz Validation - Create Schema", () => {
    describe("Duration Validation", () => {
        it("should pass with valid duration (10 minutes)", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z", // 2 hour window
                durationMinutes: 10,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });

        it("should pass with duration at max allowed (within time window)", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z", // 120 minutes
                durationMinutes: 119,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });

        it("should fail if duration is less than 10 minutes", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z",
                durationMinutes: 5,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain("durationMinutes");
        });

        it("should fail if duration equals 9 minutes", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z",
                durationMinutes: 9,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
        });

        it("should fail if duration exceeds time window", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T11:00:00Z", // 60 min window
                durationMinutes: 61, // exceeds window
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain("cannot exceed");
        });

        it("should fail if duration equals time window + 1", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T10:30:00Z", // 30 min window
                durationMinutes: 31,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
        });
    });

    describe("Date Validation", () => {
        it("should fail if openAt equals closeAt", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T10:00:00Z",
                durationMinutes: 30,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain("openAt must be before closeAt");
        });

        it("should fail if openAt is after closeAt", () => {
            const data = {
                title: "Test Quiz",
                openAt: "2026-05-10T12:00:00Z",
                closeAt: "2026-05-10T10:00:00Z",
                durationMinutes: 30,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
        });
    });

    describe("Title Validation", () => {
        it("should pass with valid title (2+ characters)", () => {
            const data = {
                title: "AB",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z",
                durationMinutes: 30,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });

        it("should fail if title is empty", () => {
            const data = {
                title: "",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z",
                durationMinutes: 30,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
        });

        it("should fail if title is only 1 character", () => {
            const data = {
                title: "A",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z",
                durationMinutes: 30,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeDefined();
        });
    });

    describe("Valid Full Scenarios", () => {
        it("should pass with all valid fields", () => {
            const data = {
                title: "Chapter 1 Quiz",
                description: "Test your knowledge",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T12:00:00Z",
                durationMinutes: 60,
                attemptsAllowed: 3,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
            expect(result.value.durationMinutes).toBe(60);
        });

        it("should pass with minimum valid duration on edge", () => {
            const data = {
                title: "Edge Quiz",
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T10:15:00Z", // 15 min window
                durationMinutes: 10,
            };
            const result = createQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });
    });
});

describe("Quiz Validation - Update Schema", () => {
    describe("Duration Validation", () => {
        it("should pass with valid duration (10 minutes)", () => {
            const data = {
                durationMinutes: 10,
            };
            const result = updateQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });

        it("should fail if duration is less than 10 minutes", () => {
            const data = {
                durationMinutes: 5,
            };
            const result = updateQuizSchema.validate(data);
            expect(result.error).toBeDefined();
        });

        it("should fail if only duration updated but exceeds time window", () => {
            const data = {
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T11:00:00Z", // 60 min window
                durationMinutes: 61,
            };
            const result = updateQuizSchema.validate(data);
            expect(result.error).toBeDefined();
            expect(result.error.message).toContain("cannot exceed");
        });
    });

    describe("Date Validation", () => {
        it("should fail if openAt equals closeAt in update", () => {
            const data = {
                openAt: "2026-05-10T10:00:00Z",
                closeAt: "2026-05-10T10:00:00Z",
            };
            const result = updateQuizSchema.validate(data);
            expect(result.error).toBeDefined();
        });
    });

    describe("Optional Fields", () => {
        it("should pass with only title provided", () => {
            const data = {
                title: "Updated Quiz",
            };
            const result = updateQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });

        it("should pass with only description provided", () => {
            const data = {
                description: "New description",
            };
            const result = updateQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });

        it("should pass with only published provided", () => {
            const data = {
                published: true,
            };
            const result = updateQuizSchema.validate(data);
            expect(result.error).toBeUndefined();
        });
    });
});