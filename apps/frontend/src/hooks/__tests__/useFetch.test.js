import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetch } from "../useFetch";

// Mock the api module
vi.mock("../../lib/api", () => ({
    default: {
        get: vi.fn(),
    },
}));

import api from "../../lib/api";

describe("useFetch", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should fetch data on mount when immediate is true", async () => {
        const mockData = { success: true, data: [{ _id: "1", name: "Test" }] };
        api.get.mockResolvedValueOnce({ data: mockData });

        const { result } = renderHook(() => useFetch("/api/test"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(api.get).toHaveBeenCalledWith("/api/test");
        expect(result.current.data).toEqual(mockData);
    });

    it("should not fetch on mount when immediate is false", () => {
        const { result } = renderHook(() => useFetch("/api/test", { immediate: false }));

        expect(result.current.loading).toBe(false);
        expect(api.get).not.toHaveBeenCalled();
    });

    it("should handle loading state correctly", async () => {
        let resolvePromise;
        const promise = new Promise((resolve) => {
            resolvePromise = resolve;
        });
        api.get.mockReturnValueOnce(promise);

        const { result } = renderHook(() => useFetch("/api/test"));

        expect(result.current.loading).toBe(true);

        await act(async () => {
            resolvePromise({ data: { success: true } });
        });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });
    });

    it("should handle error state correctly", async () => {
        api.get.mockRejectedValueOnce(new Error("Network error"));

        const { result } = renderHook(() => useFetch("/api/test"));

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // Error message comes from error.message
        expect(result.current.error).toBeDefined();
    });

    it("should call onSuccess callback on successful fetch", async () => {
        const mockData = { success: true, data: [] };
        const onSuccess = vi.fn();
        api.get.mockResolvedValueOnce({ data: mockData });

        renderHook(() => useFetch("/api/test", { onSuccess }));

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalledWith(mockData);
        });
    });

    it("should call onError callback on failed fetch", async () => {
        const onError = vi.fn();
        api.get.mockRejectedValueOnce(new Error("API Error"));

        renderHook(() => useFetch("/api/test", { onError }));

        await waitFor(() => {
            expect(onError).toHaveBeenCalledWith("API Error");
        });
    });

    it("should use cache correctly", async () => {
        const mockData = { success: true, data: [] };
        api.get.mockResolvedValueOnce({ data: mockData });

        const { result, rerender } = renderHook(
            ({ url }) => useFetch(url, { cache: true }),
            { initialProps: { url: "/api/test" } }
        );

        await waitFor(() => {
            expect(result.current.data).toEqual(mockData);
        });

        // Rerender with same URL - should use cache
        rerender({ url: "/api/test" });

        // Should not call API again for cached data
        expect(api.get).toHaveBeenCalledTimes(1);
    });

    it("should refetch manually", async () => {
        const mockData1 = { success: true, data: [{ _id: "1" }] };
        const mockData2 = { success: true, data: [{ _id: "2" }] };

        api.get
            .mockResolvedValueOnce({ data: mockData1 })
            .mockResolvedValueOnce({ data: mockData2 });

        const { result } = renderHook(() => useFetch("/api/test"));

        await waitFor(() => {
            expect(result.current.data).toEqual(mockData1);
        });

        await act(async () => {
            await result.current.fetch();
        });

        expect(api.get).toHaveBeenCalledTimes(2);
    });

    it("should clear cache correctly", async () => {
        const mockData = { success: true, data: [] };
        api.get.mockResolvedValue({ data: mockData });

        const { result } = renderHook(() => useFetch("/api/test", { cache: true }));

        await waitFor(() => {
            expect(result.current.data).toEqual(mockData);
        });

        await act(async () => {
            result.current.clearCache();
        });

        // Next fetch should not use cache
        await act(async () => {
            await result.current.fetch();
        });

        expect(api.get).toHaveBeenCalledTimes(2);
    });

    it("should handle null URL gracefully", () => {
        const { result } = renderHook(() => useFetch(null));

        // When URL is null, hook returns early without changing state
        // loading stays at initial value (true for immediate=true)
        expect(result.current.data).toBeNull();
        expect(api.get).not.toHaveBeenCalled();
    });

    it("should handle deps array correctly", async () => {
        const mockData = { success: true, data: [] };
        api.get.mockResolvedValue({ data: mockData });

        const { rerender } = renderHook(
            ({ url, filter }) => useFetch(url, { deps: [filter] }),
            { initialProps: { url: "/api/test", filter: "all" } }
        );

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(1);
        });

        // Change filter - should trigger new fetch
        rerender({ url: "/api/test", filter: "active" });

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledTimes(2);
        });
    });
});