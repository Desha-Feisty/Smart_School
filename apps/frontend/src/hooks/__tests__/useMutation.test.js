import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useMutation } from "../useFetch";

describe("useMutation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should have loading state initially false", () => {
        const mutationFn = vi.fn();
        const { result } = renderHook(() => useMutation(mutationFn));

        expect(result.current.loading).toBe(false);
    });

    it("should set loading to true during mutation", async () => {
        let resolveMutation;
        const mutationFn = vi.fn(
            () =>
                new Promise((resolve) => {
                    resolveMutation = resolve;
                })
        );

        const { result } = renderHook(() => useMutation(mutationFn));

        act(() => {
            result.current.mutate({ name: "test" });
        });

        expect(result.current.loading).toBe(true);

        await act(async () => {
            resolveMutation({ success: true });
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it("should call mutationFn with data and config", async () => {
        const mutationFn = vi.fn().mockResolvedValue({ success: true });
        const config = { headers: { "Content-Type": "application/json" } };

        const { result } = renderHook(() => useMutation(mutationFn));

        await act(async () => {
            await result.current.mutate({ name: "test" }, config);
        });

        expect(mutationFn).toHaveBeenCalledWith({ name: "test" }, config);
    });

    it("should call onSuccess callback on success", async () => {
        const mockResult = { success: true, data: { id: "1" } };
        const mutationFn = vi.fn().mockResolvedValue(mockResult);
        const onSuccess = vi.fn();

        const { result } = renderHook(() => useMutation(mutationFn, { onSuccess }));

        await act(async () => {
            await result.current.mutate({ name: "test" });
        });

        expect(onSuccess).toHaveBeenCalledWith(mockResult);
    });

    it("should call onError callback on error", async () => {
        const error = new Error("Mutation failed");
        const mutationFn = vi.fn().mockRejectedValue(error);
        const onError = vi.fn();

        const { result } = renderHook(() => useMutation(mutationFn, { onError }));

        await act(async () => {
            try {
                await result.current.mutate({ name: "test" });
            } catch {
                // Expected to throw
            }
        });

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith("Mutation failed");
        });
    });

    it("should set error state on failure", async () => {
        const error = new Error("API Error");
        const mutationFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useMutation(mutationFn));

        await act(async () => {
            try {
                await result.current.mutate({ name: "test" });
            } catch {
                // Expected to throw
            }
        });

        await waitFor(() => {
            expect(result.current.error).toBe("API Error");
        });
    });

    it("should return result from mutationFn", async () => {
        const mockResult = { success: true, data: { id: "123" } };
        const mutationFn = vi.fn().mockResolvedValue(mockResult);

        const { result } = renderHook(() => useMutation(mutationFn));

        let returnedResult;
        await act(async () => {
            returnedResult = await result.current.mutate({ name: "test" });
        });

        expect(returnedResult).toEqual(mockResult);
    });

    it("should throw error for catch blocks", async () => {
        const error = new Error("Network error");
        const mutationFn = vi.fn().mockRejectedValue(error);

        const { result } = renderHook(() => useMutation(mutationFn));

        let thrownError = null;
        await act(async () => {
            try {
                await result.current.mutate({ name: "test" });
            } catch (e) {
                thrownError = e;
            }
        });

        expect(thrownError).toEqual(error);
    });

    it("should reset loading state after multiple mutations", async () => {
        const mutationFn = vi.fn().mockResolvedValue({ success: true });

        const { result } = renderHook(() => useMutation(mutationFn));

        await act(async () => {
            await result.current.mutate({ name: "test1" });
        });

        expect(result.current.loading).toBe(false);

        await act(async () => {
            await result.current.mutate({ name: "test2" });
        });

        expect(result.current.loading).toBe(false);
    });
});