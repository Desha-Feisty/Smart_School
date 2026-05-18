// Timeouts (in milliseconds)
export const TIMEOUTS = {
    REQUEST: 30000,
    AUTH_WAIT: 5000,
} as const;

// Rate limits (requests per window)
export const RATE_LIMITS = {
    DEFAULT: 1000,
    AUTOSAVE: 60,
    READ: 500,
} as const;

// Pagination
export const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

// Password validation
export const PASSWORD_VALIDATION = {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
} as const;

// Quiz scheduler
export const SCHEDULER = {
    CRON_INTERVAL: "* * * * *",
    NOTIFICATION_TTL_HOURS: 24,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 100,
} as const;

// Token wait loop
export const AUTH_WAIT = {
    MAX_WAIT_MS: 5000,
    RETRY_DELAY_MS: 100,
    MAX_RETRIES: 3,
} as const;

// Autosave delay (ms)
export const AUTOSAVE_DELAY = 500 as const;

// API endpoints (for reference)
export const API_ENDPOINTS = {
    AUTH: "/api/auth",
    COURSES: "/api/courses",
    QUIZZES: "/api/quizzes",
    ATTEMPTS: "/api/attempts",
    ADMIN: "/api/admin",
} as const;
