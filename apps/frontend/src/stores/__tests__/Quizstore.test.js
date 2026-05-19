import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";

vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

import axios from "axios";
import useQuizStore from "../Quizstore";

describe("Quizstore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useQuizStore.setState({
            availableQuizzes: [],
            currentAttempt: null,
            errMsg: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial State", () => {
        it("should have correct initial values", () => {
            const state = useQuizStore.getState();
            expect(state.availableQuizzes).toEqual([]);
            expect(state.currentAttempt).toBeNull();
            expect(state.errMsg).toBeNull();
        });
    });

    describe("fetchAvailableQuizzes", () => {
        it("should fetch quizzes successfully", async () => {
            const mockQuizzes = [
                { _id: "q1", title: "Quiz 1", course: "c1" },
                { _id: "q2", title: "Quiz 2", course: "c1" },
            ];
            axios.get.mockResolvedValueOnce({ data: { quizzes: mockQuizzes } });

            const { fetchAvailableQuizzes } = useQuizStore.getState();

            await act(async () => {
                await fetchAvailableQuizzes();
            });

            expect(useQuizStore.getState().availableQuizzes).toEqual(mockQuizzes);
        });

        it("should handle fetch error", async () => {
            axios.get.mockRejectedValueOnce(new Error("Failed to fetch"));

            const { fetchAvailableQuizzes } = useQuizStore.getState();

            await act(async () => {
                await fetchAvailableQuizzes();
            });

            // On error, availableQuizzes is set to empty array
            expect(useQuizStore.getState().availableQuizzes).toEqual([]);
        });
    });

    describe("listMyGrades", () => {
        it("should fetch grades successfully", async () => {
            const mockGrades = [
                { _id: "g1", score: 80, totalPoints: 100 },
                { _id: "g2", score: 90, totalPoints: 100 },
            ];
            axios.get.mockResolvedValueOnce({ data: { results: mockGrades } });

            const { listMyGrades } = useQuizStore.getState();

            await act(async () => {
                await listMyGrades();
            });

            expect(useQuizStore.getState().myGrades).toEqual(mockGrades);
        });

        it("should handle 404 as empty grades", async () => {
            axios.get.mockRejectedValueOnce({ response: { status: 404 } });

            const { listMyGrades } = useQuizStore.getState();

            await act(async () => {
                await listMyGrades();
            });

            expect(useQuizStore.getState().myGrades).toEqual([]);
        });
    });

    describe("startAttempt", () => {
        it("should start attempt successfully", async () => {
            const mockResponse = {
                data: {
                    attemptId: "a1",
                    endAt: "2024-12-31",
                    questions: [{ _id: "q1", prompt: "Question 1" }],
                },
            };
            axios.post.mockResolvedValueOnce(mockResponse);

            const { startAttempt } = useQuizStore.getState();

            let result;
            await act(async () => {
                result = await startAttempt("q1");
            });

            expect(result).toBeDefined();
            expect(result.attempt).toBeDefined();
            expect(useQuizStore.getState().currentAttempt).toBeDefined();
        });

        it("should handle start attempt error", async () => {
            axios.post.mockRejectedValueOnce(new Error("Failed to start"));

            const { startAttempt } = useQuizStore.getState();

            let result;
            await act(async () => {
                result = await startAttempt("q1");
            });

            expect(result).toBeNull();
            expect(useQuizStore.getState().attemptError).toBeDefined();
        });
    });
});