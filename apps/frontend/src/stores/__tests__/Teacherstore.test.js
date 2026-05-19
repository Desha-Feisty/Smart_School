import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";

vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

import axios from "axios";
import useTeacherStore from "../Teacherstore";

describe("TeacherStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useTeacherStore.setState({
            allCourses: [],
            recentChats: [],
            errMsg: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial State", () => {
        it("should have correct initial values", () => {
            const state = useTeacherStore.getState();
            expect(state.allCourses).toEqual([]);
            expect(state.recentChats).toEqual([]);
            expect(state.errMsg).toBeNull();
        });
    });

    describe("setAllCourses", () => {
        it("should set courses", () => {
            const { setAllCourses } = useTeacherStore.getState();
            const courses = [{ _id: "c1", title: "Course 1" }, { _id: "c2", title: "Course 2" }];

            act(() => {
                setAllCourses(courses);
            });

            expect(useTeacherStore.getState().allCourses).toEqual(courses);
        });
    });

    describe("listMyCourses", () => {
        it("should fetch courses successfully", async () => {
            // Set token - required for API call
            useTeacherStore.setState({ errMsg: null });
            
            const mockCourses = [
                { _id: "c1", title: "Course 1", teacher: "t1" },
                { _id: "c2", title: "Course 2", teacher: "t1" },
            ];
            axios.get.mockResolvedValueOnce({ data: { courses: mockCourses } });

            const { listMyCourses } = useTeacherStore.getState();

            await act(async () => {
                await listMyCourses();
            });

            expect(useTeacherStore.getState().allCourses).toEqual(mockCourses);
        });

        it("should handle fetch error", async () => {
            axios.get.mockRejectedValueOnce(new Error("Failed to fetch"));

            const { listMyCourses } = useTeacherStore.getState();

            await act(async () => {
                await listMyCourses();
            });

            expect(useTeacherStore.getState().errMsg).toBeDefined();
        });
    });

    describe("listRecentChats", () => {
        it("should fetch recent chats successfully", async () => {
            // Set token and user - required for API call
            useTeacherStore.setState({ recentChatsLoading: false });
            
            const mockChats = [
                { _id: "chat1", course: "c1", peerName: "Student 1" },
                { _id: "chat2", course: "c2", peerName: "Student 2" },
            ];
            axios.get.mockResolvedValueOnce({ data: { results: mockChats } });

            const { listRecentChats } = useTeacherStore.getState();

            await act(async () => {
                await listRecentChats();
            });

            expect(useTeacherStore.getState().recentChats).toEqual(mockChats);
        });
    });
});