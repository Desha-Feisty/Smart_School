import { vi } from "vitest";

export const mockAuthStore = {
    user: null,
    token: null,
    role: null,
    isLoggingIn: false,
    isExplicitLogout: false,
    errMsg: null,
    calendarEvents: [],
    setUser: vi.fn(),
    setRole: vi.fn(),
    clearUser: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
    setIsLoggingIn: vi.fn(),
    setErrMsg: vi.fn(),
    clearErrMsg: vi.fn(),
    setCalendarEvents: vi.fn(),
    login: vi.fn().mockResolvedValue({ success: true }),
    register: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue(undefined),
    listCourseCalendarEvents: vi.fn().mockResolvedValue([]),
    listEnrolledCalendarEvents: vi.fn().mockResolvedValue([]),
};

export const mockQuizStore = {
    availableQuizzes: [],
    currentQuiz: null,
    currentAttempt: null,
    loading: false,
    error: null,
    fetchAvailableQuizzes: vi.fn().mockResolvedValue([]),
    fetchQuiz: vi.fn().mockResolvedValue(null),
    submitQuiz: vi.fn().mockResolvedValue({ success: true }),
    setCurrentQuiz: vi.fn(),
    setCurrentAttempt: vi.fn(),
    clearError: vi.fn(),
};

export const mockSocketStore = {
    socket: null,
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    setSocket: vi.fn(),
    setConnected: vi.fn(),
};

export const mockNotificationStore = {
    notifications: [],
    unreadCount: 0,
    loading: false,
    fetchNotifications: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn().mockResolvedValue({ success: true }),
    markAllAsRead: vi.fn().mockResolvedValue({ success: true }),
    setNotifications: vi.fn(),
    setUnreadCount: vi.fn(),
};

export const mockChatStore = {
    messages: [],
    activeChat: null,
    loading: false,
    fetchMessages: vi.fn().mockResolvedValue([]),
    sendMessage: vi.fn().mockResolvedValue({ success: true }),
    setActiveChat: vi.fn(),
    closeChat: vi.fn(),
    clearMessages: vi.fn(),
};

export const mockTeacherStore = {
    courses: [],
    selectedCourse: null,
    recentChats: [],
    loading: false,
    fetchCourses: vi.fn().mockResolvedValue([]),
    selectCourse: vi.fn(),
    listRecentChats: vi.fn().mockResolvedValue([]),
    setCourses: vi.fn(),
    setSelectedCourse: vi.fn(),
};

export const mockThemeStore = {
    theme: "light",
    initTheme: vi.fn(),
    setTheme: vi.fn(),
    toggleTheme: vi.fn(),
};

export const mockUIStore = {
    sidebarOpen: true,
    modalOpen: null,
    toggleSidebar: vi.fn(),
    openModal: vi.fn(),
    closeModal: vi.fn(),
};

// Factory function to create fresh mocks for each test
export function createMockAuthStore(overrides = {}) {
    return {
        ...mockAuthStore,
        ...overrides,
    };
}

export function createMockQuizStore(overrides = {}) {
    return {
        ...mockQuizStore,
        ...overrides,
    };
}

export function createMockSocketStore(overrides = {}) {
    return {
        ...mockSocketStore,
        ...overrides,
    };
}

export function createMockNotificationStore(overrides = {}) {
    return {
        ...mockNotificationStore,
        ...overrides,
    };
}