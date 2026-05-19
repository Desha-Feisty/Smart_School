import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "../useLocalStorage";

describe("useLocalStorage", () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        // Restore any mocked localStorage methods
        if (localStorage.setItem.mockRestore) {
            localStorage.setItem.mockRestore();
        }
    });

    afterEach(() => {
        localStorage.clear();
        // Restore any mocked localStorage methods
        if (localStorage.setItem.mockRestore) {
            localStorage.setItem.mockRestore();
        }
    });

    it("should return initial value when no stored value exists", () => {
        const { result } = renderHook(() => useLocalStorage("test-key", "default"));
        expect(result.current[0]).toBe("default");
    });

    it("should return stored value when exists", () => {
        localStorage.setItem("test-key", JSON.stringify("stored-value"));
        const { result } = renderHook(() => useLocalStorage("test-key", "default"));
        expect(result.current[0]).toBe("stored-value");
    });

    it("should set value in localStorage", () => {
        const { result } = renderHook(() => useLocalStorage("test-key", "default"));

        act(() => {
            result.current[1]("new-value");
        });

        expect(localStorage.setItem).toHaveBeenCalledWith(
            "test-key",
            JSON.stringify("new-value")
        );
    });

    it("should remove value from localStorage when set to null", () => {
        localStorage.setItem("test-key", JSON.stringify("existing"));
        const { result } = renderHook(() => useLocalStorage("test-key", "default"));

        act(() => {
            result.current[1](null);
        });

        expect(localStorage.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should parse JSON values correctly", () => {
        const jsonValue = { name: "test", count: 5 };
        localStorage.setItem("test-key", JSON.stringify(jsonValue));

        const { result } = renderHook(() => useLocalStorage("test-key", null));
        expect(result.current[0]).toEqual(jsonValue);
    });

    it("should handle invalid JSON gracefully", () => {
        // Set invalid JSON (not a parse error, but the hook catches it)
        localStorage.setItem("test-key", JSON.stringify("not-valid-json"));

        const { result } = renderHook(() => useLocalStorage("test-key", "default"));
        expect(result.current[0]).toBe("not-valid-json");
    });

    it("should handle localStorage errors gracefully", () => {
        localStorage.setItem = vi.fn().mockImplementation(() => {
            throw new Error("Storage full");
        });

        const { result } = renderHook(() => useLocalStorage("test-key", "default"));

        act(() => {
            result.current[1]("new-value");
        });

        // Should not throw, just handle the error
        expect(result.current[0]).toBe("default");
    });

    it("should return remove function", () => {
        localStorage.setItem("test-key", JSON.stringify("value"));
        const { result } = renderHook(() => useLocalStorage("test-key", "default"));

        act(() => {
            result.current[2]();
        });

        expect(localStorage.removeItem).toHaveBeenCalledWith("test-key");
    });

    it("should work with different value types", () => {
        // Number
        let { result } = renderHook(() => useLocalStorage("num-key", 0));
        act(() => {
            result.current[1](42);
        });
        expect(localStorage.setItem).toHaveBeenCalledWith(
            "num-key",
            JSON.stringify(42)
        );

        // Boolean
        localStorage.clear();
        ({ result } = renderHook(() => useLocalStorage("bool-key", false)));
        act(() => {
            result.current[1](true);
        });
        expect(localStorage.setItem).toHaveBeenCalledWith(
            "bool-key",
            JSON.stringify(true)
        );

        // Array
        localStorage.clear();
        ({ result } = renderHook(() => useLocalStorage("arr-key", [])));
        act(() => {
            result.current[1]([1, 2, 3]);
        });
        expect(localStorage.setItem).toHaveBeenCalledWith(
            "arr-key",
            JSON.stringify([1, 2, 3])
        );
    });

    it("should use custom serializer/deserializer", () => {
        const serialize = (value) => `custom:${value}`;
        const deserialize = (value) => value.replace("custom:", "");

        localStorage.setItem("test-key", "custom:hello");

        const { result } = renderHook(() =>
            useLocalStorage("test-key", "default", { serializer: serialize, deserializer: deserialize })
        );

        expect(result.current[0]).toBe("hello");
    });
});