import { vi } from "vitest";

const mockAxios = {
    create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
            request: {
                use: vi.fn((successHandler) => {
                    // Store the success handler for later use in tests
                    mockAxios._requestSuccessHandler = successHandler;
                    return { eject: vi.fn() };
                }),
            },
            response: {
                use: vi.fn((successHandler, errorHandler) => {
                    mockAxios._responseSuccessHandler = successHandler;
                    mockAxios._responseErrorHandler = errorHandler;
                    return { eject: vi.fn() };
                }),
            },
        },
    })),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    // Internal handlers for testing
    _requestSuccessHandler: null,
    _responseSuccessHandler: null,
    _responseErrorHandler: null,
};

// Helper to simulate successful request
mockAxios.simulateRequestSuccess = (config) => {
    if (mockAxios._requestSuccessHandler) {
        return mockAxios._requestSuccessHandler(config);
    }
    return config;
};

// Helper to simulate successful response
mockAxios.simulateResponseSuccess = (response) => {
    if (mockAxios._responseSuccessHandler) {
        return mockAxios._responseSuccessHandler(response);
    }
    return response;
};

// Helper to simulate error response
mockAxios.simulateResponseError = (error) => {
    if (mockAxios._responseErrorHandler) {
        return mockAxios._responseErrorHandler(error);
    }
    return Promise.reject(error);
};

export default mockAxios;