// App constants

export const ROLES = {
    STUDENT: "student",
    TEACHER: "teacher",
    ADMIN: "admin",
};

export const QUIZ_STATUS = {
    IN_PROGRESS: "inProgress",
    GRADED: "graded",
    EXPIRED: "expired",
    LATE: "late",
    SUBMITTED: "submitted",
};

export const NOTIFICATION_TYPES = {
    QUIZ: "quiz",
    QUIZ_GRADED: "quiz-graded",
    QUIZ_MISSED: "quiz-missed",
    NOTE: "note",
    CHAT: "chat",
    SYSTEM: "system",
};

export const GRADING_MODES = {
    ON_SUBMIT: "onSubmit",
    ON_CLOSE: "onClose",
};

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
};

// Timeouts
export const TIMEOUTS = {
    API: 30000,
    DEBOUNCE: 500,
    TOAST_DURATION: 4000,
};

// Storage keys
export const STORAGE_KEYS = {
    AUTH: "auth-storage",
    TOKEN: "token",
    REFRESH_TOKEN: "refreshToken",
    THEME: "theme",
};

// Routes
export const ROUTES = {
    LOGIN: "/login",
    STUDENT: "/student",
    TEACHER: "/teacher",
    ADMIN: "/admin",
    STUDENT_QUIZ: (attemptId) => `/student/quiz/${attemptId}`,
    TEACHER_COURSE: (id) => `/teacher/course/${id}`,
    TEACHER_QUIZ: (id) => `/teacher/quiz/${id}/questions`,
    NOTE: (noteId) => `/note/${noteId}`,
};

// Quiz time limits (in minutes)
export const QUIZ_LIMITS = {
    MIN_DURATION: 1,
    MAX_DURATION: 180,
    DEFAULT_DURATION: 30,
};

// Validation
export const VALIDATION = {
    NAME_MIN: 6,
    NAME_MAX: 40,
    PASSWORD_MIN: 6,
    PASSWORD_MAX: 20,
    EMAIL_REGEX: /^[\w.-]+@([\w-]+\.)+[\w-]{2,}$/,
};

// UI breakpoints (for reference)
export const BREAKPOINTS = {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
};