import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Learning Management System API",
            version: "1.0.0",
            description: "API for a full-stack Learning Management System with courses, quizzes, and real-time features",
            contact: {
                name: "API Support",
                email: "support@example.com",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT token obtained from /api/auth/login or /api/auth/register",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "507f1f77bcf86cd799439011" },
                        name: { type: "string", example: "John Doe" },
                        email: { type: "string", example: "john@example.com" },
                        role: { type: "string", enum: ["student", "teacher", "admin"], example: "student" },
                    },
                },
                Course: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "507f1f77bcf86cd799439011" },
                        title: { type: "string", example: "Introduction to React" },
                        description: { type: "string", example: "Learn React from scratch" },
                        joinCode: { type: "string", example: "REACT101" },
                        teacher: { type: "string", example: "507f1f77bcf86cd799439011" },
                    },
                },
                Quiz: {
                    type: "object",
                    properties: {
                        _id: { type: "string", example: "507f1f77bcf86cd799439011" },
                        title: { type: "string", example: "React Basics Quiz" },
                        description: { type: "string", example: "Test your React knowledge" },
                        openAt: { type: "string", format: "date-time", example: "2026-05-10T10:00:00Z" },
                        closeAt: { type: "string", format: "date-time", example: "2026-05-10T12:00:00Z" },
                        durationMinutes: { type: "integer", example: 30 },
                        published: { type: "boolean", example: true },
                    },
                },
                Error: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        error: { type: "string", example: "Error message" },
                        message: { type: "string", example: "Detailed error message" },
                    },
                },
            },
            responses: {
                Unauthorized: {
                    description: "Unauthorized - Invalid or missing token",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                            example: {
                                success: false,
                                error: "Unauthorized",
                                message: "Invalid or missing token",
                            },
                        },
                    },
                },
                Forbidden: {
                    description: "Forbidden - Insufficient permissions",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                            example: {
                                success: false,
                                error: "Forbidden",
                                message: "You don't have permission to access this resource",
                            },
                        },
                    },
                },
                NotFound: {
                    description: "Resource not found",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                            example: {
                                success: false,
                                error: "Not Found",
                                message: "Resource not found",
                            },
                        },
                    },
                },
                ValidationError: {
                    description: "Validation error",
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/Error" },
                            example: {
                                success: false,
                                error: "Validation Error",
                                message: "Invalid input data",
                                details: { email: "Invalid email format" },
                            },
                        },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
        tags: [
            {
                name: "Authentication",
                description: "User registration and login endpoints",
            },
            {
                name: "Courses",
                description: "Course management endpoints",
            },
            {
                name: "Quizzes",
                description: "Quiz management endpoints",
            },
            {
                name: "Questions",
                description: "Quiz question endpoints",
            },
            {
                name: "Attempts",
                description: "Quiz attempt endpoints",
            },
            {
                name: "Notes",
                description: "Course note endpoints",
            },
            {
                name: "Comments",
                description: "Note comment endpoints",
            },
            {
                name: "Chat",
                description: "Real-time chat endpoints",
            },
            {
                name: "Analytics",
                description: "Analytics and reporting endpoints",
            },
            {
                name: "Leaderboard",
                description: "Leaderboard endpoints",
            },
            {
                name: "Notifications",
                description: "Notification endpoints",
            },
            {
                name: "Admin",
                description: "Admin-only endpoints",
            },
        ],
    },
    apis: ["./src/routes/*.ts"],
};

export const specs = swaggerJsdoc(options);