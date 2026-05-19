import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce, useDebouncedCallback } from "../useDebounce";

describe("useDebounce", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should return initial value immediately", () => {
        const { result } = renderHook(() => useDebounce("initial", 500));
        expect(result.current).toBe("initial");
    });

    it("should update debounced value after delay", async () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "initial", delay: 500 } }
        );

        expect(result.current).toBe("initial");

        rerender({ value: "updated", delay: 500 });

        // Before delay
        expect(result.current).toBe("initial");

        // After delay
        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe("updated");
    });

    it("should reset timer on value change", async () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "initial", delay: 500 } }
        );

        rerender({ value: "first", delay: 500 });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        // Value changed again before timer completes
        rerender({ value: "second", delay: 500 });
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        // Should still be initial because timer was reset
        expect(result.current).toBe("initial");

        // Now advance past original delay
        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        expect(result.current).toBe("second");
    });

    it("should clean up on unmount", () => {
        const { unmount } = renderHook(() => useDebounce("test", 500));
        expect(() => unmount()).not.toThrow();
    });

    it("should use custom delay", async () => {
        const { result, rerender } = renderHook(
            ({ value, delay }) => useDebounce(value, delay),
            { initialProps: { value: "initial", delay: 1000 } }
        );

        rerender({ value: "updated", delay: 1000 });

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe("initial");

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(result.current).toBe("updated");
    });
});

describe("useDebouncedCallback", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should call callback after delay", async () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 500));

        act(() => {
            result.current("arg1", "arg2");
        });

        expect(callback).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should debounce multiple calls", async () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 500));

        act(() => {
            result.current("call1");
        });
        act(() => {
            result.current("call2");
        });
        act(() => {
            result.current("call3");
        });

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        // Should only be called once with the last arguments
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith("call3");
    });

    it("should clean up previous timeout on new call", async () => {
        const callback = vi.fn();
        const { result } = renderHook(() => useDebouncedCallback(callback, 500));

        act(() => {
            result.current("first");
        });

        await act(async () => {
            vi.advanceTimersByTime(300);
        });

        // Call again before first timer completes
        act(() => {
            result.current("second");
        });

        // First call should not have happened yet
        expect(callback).not.toHaveBeenCalled();

        // Advance past second timer
        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith("second");
    });

    it("should clean up on unmount", () => {
        const callback = vi.fn();
        const { result, unmount } = renderHook(() =>
            useDebouncedCallback(callback, 500)
        );

        act(() => {
            result.current("test");
        });

        expect(() => unmount()).not.toThrow();
    });

    it("should use custom delay", async () => {
        const callback = vi.fn();
        const { result } = renderHook(() =>
            useDebouncedCallback(callback, 1000)
        );

        act(() => {
            result.current();
        });

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(500);
        });

        expect(callback).toHaveBeenCalled();
    });
});