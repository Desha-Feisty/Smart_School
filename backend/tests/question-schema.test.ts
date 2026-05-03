import { describe, it, expect } from "vitest";
import Joi from "joi";

// Question schemas from quiz.controller.ts
const addQuestionSchema = Joi.object({
    prompt: Joi.string().min(3).required(),
    points: Joi.number().integer().default(1).min(0),
    orderIndex: Joi.number().integer().min(0).default(0),
    choices: Joi.array()
        .items(
            Joi.object({
                text: Joi.string().required(),
                isCorrect: Joi.boolean().default(false),
            }),
        )
        .min(2)
        .required(),
});

const addQuestionBodySchema = Joi.object({
    quizId: Joi.string().required(),
    prompt: Joi.string().min(2).required(),
    points: Joi.number().integer().min(0).default(1),
    orderIndex: Joi.number().integer().min(0).default(0),
    choices: Joi.array()
        .items(
            Joi.object({
                text: Joi.string().required(),
                isCorrect: Joi.boolean().default(false),
            }),
        )
        .min(2)
        .required(),
});

const updateQuestionSchema = Joi.object({
    prompt: Joi.string().min(2).optional(),
    points: Joi.number().integer().min(0).optional(),
    orderIndex: Joi.number().integer().min(0).optional(),
    choices: Joi.array()
        .items(
            Joi.object({
                text: Joi.string().required(),
                isCorrect: Joi.boolean().default(false),
            }),
        )
        .min(2)
        .optional(),
}).min(1);

describe("Question Validation - addQuestionSchema", () => {
    const validQuestion = {
        prompt: "What is 2+2?",
        points: 1,
        orderIndex: 0,
        choices: [
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: true },
        ],
    };

    it("passes with valid question", () => {
        const result = addQuestionSchema.validate(validQuestion);
        expect(result.error).toBeUndefined();
    });

    it("passes with minimum prompt length (3)", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            prompt: "ABC",
        });
        expect(result.error).toBeUndefined();
    });

    it("fails if prompt < 3 characters", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            prompt: "AB",
        });
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain("prompt");
    });

    it("fails if prompt is empty", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            prompt: "",
        });
        expect(result.error).toBeDefined();
    });

    it("fails if prompt is missing", () => {
        const result = addQuestionSchema.validate({
            points: 1,
            orderIndex: 0,
            choices: validQuestion.choices,
        });
        expect(result.error).toBeDefined();
    });

    it("passes with points = 0", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            points: 0,
        });
        expect(result.error).toBeUndefined();
        expect(result.value.points).toBe(0);
    });

    it("fails if points < 0", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            points: -1,
        });
        expect(result.error).toBeDefined();
    });

    it("passes with orderIndex = 0", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            orderIndex: 0,
        });
        expect(result.error).toBeUndefined();
    });

    it("fails if orderIndex < 0", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            orderIndex: -1,
        });
        expect(result.error).toBeDefined();
    });

    it("passes with exactly 2 choices", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            choices: [
                { text: "A", isCorrect: false },
                { text: "B", isCorrect: true },
            ],
        });
        expect(result.error).toBeUndefined();
    });

    it("passes with more than 2 choices", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            choices: [
                { text: "A", isCorrect: false },
                { text: "B", isCorrect: false },
                { text: "C", isCorrect: true },
            ],
        });
        expect(result.error).toBeUndefined();
    });

    it("fails with only 1 choice", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            choices: [{ text: "A", isCorrect: true }],
        });
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain("choices");
    });

    it("fails with empty choices", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            choices: [],
        });
        expect(result.error).toBeDefined();
    });

    it("fails if choice text is empty", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            choices: [
                { text: "", isCorrect: false },
                { text: "B", isCorrect: true },
            ],
        });
        expect(result.error).toBeDefined();
    });

    it("fails if choice text is missing", () => {
        const result = addQuestionSchema.validate({
            ...validQuestion,
            choices: [
                { isCorrect: false },
                { text: "B", isCorrect: true },
            ],
        });
        expect(result.error).toBeDefined();
    });

    it("uses default points (1) when not provided", () => {
        const result = addQuestionSchema.validate({
            prompt: "What is 2+2?",
            choices: validQuestion.choices,
        });
        expect(result.error).toBeUndefined();
        expect(result.value.points).toBe(1);
    });

    it("uses default orderIndex (0) when not provided", () => {
        const result = addQuestionSchema.validate({
            prompt: "What is 2+2?",
            choices: validQuestion.choices,
        });
        expect(result.error).toBeUndefined();
        expect(result.value.orderIndex).toBe(0);
    });
});

describe("Question Validation - addQuestionBodySchema", () => {
    const validQuestion = {
        quizId: "quiz123",
        prompt: "What is 2+2?",
        points: 1,
        orderIndex: 0,
        choices: [
            { text: "3", isCorrect: false },
            { text: "4", isCorrect: true },
        ],
    };

    it("passes with valid question body", () => {
        const result = addQuestionBodySchema.validate(validQuestion);
        expect(result.error).toBeUndefined();
    });

    it("fails if quizId is missing", () => {
        const result = addQuestionBodySchema.validate({
            prompt: "What is 2+2?",
            choices: validQuestion.choices,
        });
        expect(result.error).toBeDefined();
        expect(result.error.message).toContain("quizId");
    });

    it("fails if quizId is empty", () => {
        const result = addQuestionBodySchema.validate({
            ...validQuestion,
            quizId: "",
        });
        expect(result.error).toBeDefined();
    });

    it("passes with minimum prompt length (2)", () => {
        const result = addQuestionBodySchema.validate({
            ...validQuestion,
            prompt: "AB",
        });
        expect(result.error).toBeUndefined();
    });

    it("fails if prompt < 2 characters", () => {
        const result = addQuestionBodySchema.validate({
            ...validQuestion,
            prompt: "A",
        });
        expect(result.error).toBeDefined();
    });

    it("fails if prompt is missing", () => {
        const result = addQuestionBodySchema.validate({
            quizId: "quiz123",
            choices: validQuestion.choices,
        });
        expect(result.error).toBeDefined();
    });

    it("passes with points = 0", () => {
        const result = addQuestionBodySchema.validate({
            ...validQuestion,
            points: 0,
        });
        expect(result.error).toBeUndefined();
    });

    it("fails if points < 0", () => {
        const result = addQuestionBodySchema.validate({
            ...validQuestion,
            points: -1,
        });
        expect(result.error).toBeDefined();
    });

    it("passes with valid choices", () => {
        const result = addQuestionBodySchema.validate(validQuestion);
        expect(result.error).toBeUndefined();
    });

    it("fails with less than 2 choices", () => {
        const result = addQuestionBodySchema.validate({
            ...validQuestion,
            choices: [{ text: "A", isCorrect: true }],
        });
        expect(result.error).toBeDefined();
    });
});

describe("Question Validation - updateQuestionSchema", () => {
    const validUpdate = {
        prompt: "Updated question?",
    };

    it("passes with prompt update", () => {
        const result = updateQuestionSchema.validate(validUpdate);
        expect(result.error).toBeUndefined();
    });

    it("passes with points update", () => {
        const result = updateQuestionSchema.validate({
            points: 5,
        });
        expect(result.error).toBeUndefined();
    });

    it("passes with orderIndex update", () => {
        const result = updateQuestionSchema.validate({
            orderIndex: 2,
        });
        expect(result.error).toBeUndefined();
    });

    it("passes with choices update", () => {
        const result = updateQuestionSchema.validate({
            choices: [
                { text: "A", isCorrect: false },
                { text: "B", isCorrect: true },
                { text: "C", isCorrect: false },
            ],
        });
        expect(result.error).toBeUndefined();
    });

    it("passes with multiple field updates", () => {
        const result = updateQuestionSchema.validate({
            prompt: "New prompt?",
            points: 3,
            orderIndex: 1,
        });
        expect(result.error).toBeUndefined();
    });

    it("fails with empty object (at least 1 field required)", () => {
        const result = updateQuestionSchema.validate({});
        expect(result.error).toBeDefined();
    });

    it("fails if prompt < 2 characters", () => {
        const result = updateQuestionSchema.validate({
            prompt: "A",
        });
        expect(result.error).toBeDefined();
    });

    it("fails if points < 0", () => {
        const result = updateQuestionSchema.validate({
            points: -1,
        });
        expect(result.error).toBeDefined();
    });

    it("fails if orderIndex < 0", () => {
        const result = updateQuestionSchema.validate({
            orderIndex: -1,
        });
        expect(result.error).toBeDefined();
    });

    it("fails with only 1 choice", () => {
        const result = updateQuestionSchema.validate({
            choices: [{ text: "A", isCorrect: true }],
        });
        expect(result.error).toBeDefined();
    });
});