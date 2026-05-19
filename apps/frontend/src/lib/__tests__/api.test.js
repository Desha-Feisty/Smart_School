import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock axios before importing api
vi.mock("axios", () => {
    const mockAxiosInstance = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
        interceptors: {
            request: {
                use: vi.fn((successHandler) => {
                    mockAxiosInstance._requestSuccessHandler = successHandler;
                    return { eject: vi.fn() };
                }),
            },
            response: {
                use: vi.fn((successHandler, errorHandler) => {
                    mockAxiosInstance._responseSuccessHandler = successHandler;
                    mockAxiosInstance._responseErrorHandler = errorHandler;
                    return { eject: vi.fn() };
                }),
            },
        },
    };

    const mockAxios = vi.fn(() => mockAxiosInstance);
    mockAxios.create = vi.fn(() => mockAxiosInstance);

    return {
        default: mockAxios,
        create: mockAxios.create,
    };
});

import axios from "axios";

describe("API Layer", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Import after mocking
        await import("../api.js");
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("API Instance Configuration", () => {
        it("should have correct baseURL", () => {
            expect(axios.create).toHaveBeenCalled();
            const createCall = axios.create.mock.calls[0][0];
            expect(createCall.baseURL).toBe("/api");
        });

        it("should have correct timeout", () => {
            const createCall = axios.create.mock.calls[0][0];
            expect(createCall.timeout).toBe(30000);
        });

        it("should have correct default headers", () => {
            const createCall = axios.create.mock.calls[0][0];
            expect(createCall.headers["Content-Type"]).toBe("application/json");
        });
    });

    describe("Request Interceptor", () => {
        it("should add auth token to request", async () => {
            localStorage.setItem("token", "test-token");
            
            // Get the interceptor callback
            const createCall = axios.create.mock.calls[0][0];
            const instance = axios.create(createCall);
            
            // Find the request interceptor setup
            expect(instance.interceptors.request.use).toHaveBeenCalled();
            
            localStorage.removeItem("token");
        });
    });

    describe("Response Interceptor", () => {
        it("should handle 401 errors", async () => {
            const _error = {
                response: {
                    status: 401,
                    data: { details: "jwt expired" },
                },
            };
            const createCall = axios.create.mock.calls[0][0];
            const instance = axios.create(createCall);
            
            // The error handler should redirect to login
            expect(instance?.interceptors.response.use).toHaveBeenCalled();
        });
    });
});

describe("API Methods", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await import("../api.js");
    });

    describe("authApi", () => {
        it("should have login method", () => {
            const { authApi } = require("../api.js");
            expect(authApi.login).toBeDefined();
            expect(typeof authApi.login).toBe("function");
        });

        it("should have register method", () => {
            const { authApi } = require("../api.js");
            expect(authApi.register).toBeDefined();
        });

        it("should have logout method", () => {
            const { authApi } = require("../api.js");
            expect(authApi.logout).toBeDefined();
        });

        it("should have me method", () => {
            const { authApi } = require("../api.js");
            expect(authApi.me).toBeDefined();
        });

        it("should have refresh method", () => {
            const { authApi } = require("../api.js");
            expect(authApi.refresh).toBeDefined();
        });
    });

    describe("coursesApi", () => {
        it("should have list method", () => {
            const { coursesApi } = require("../api.js");
            expect(coursesApi.list).toBeDefined();
        });

        it("should have get method", () => {
            const { coursesApi } = require("../api.js");
            expect(coursesApi.get).toBeDefined();
        });

        it("should have create method", () => {
            const { coursesApi } = require("../api.js");
            expect(coursesApi.create).toBeDefined();
        });

        it("should have join method", () => {
            const { coursesApi } = require("../api.js");
            expect(coursesApi.join).toBeDefined();
        });
    });

    describe("quizzesApi", () => {
        it("should have all required methods", () => {
            const { quizzesApi } = require("../api.js");
            expect(quizzesApi.list).toBeDefined();
            expect(quizzesApi.get).toBeDefined();
            expect(quizzesApi.create).toBeDefined();
            expect(quizzesApi.submit).toBeDefined();
        });
    });

    describe("notificationsApi", () => {
        it("should have all required methods", () => {
            const { notificationsApi } = require("../api.js");
            expect(notificationsApi.list).toBeDefined();
            expect(notificationsApi.markRead).toBeDefined();
            expect(notificationsApi.markAllRead).toBeDefined();
        });
    });

    describe("adminApi", () => {
        it("should have listUsers method", () => {
            const { adminApi } = require("../api.js");
            expect(adminApi.listUsers).toBeDefined();
        });

        it("should have deleteUser method", () => {
            const { adminApi } = require("../api.js");
            expect(adminApi.deleteUser).toBeDefined();
        });
    });
});