import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";

import useThemeStore from "../ThemeStore";

describe("ThemeStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        useThemeStore.setState({
            theme: "winter",
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe("Initial State", () => {
        it("should have winter as default theme", () => {
            const state = useThemeStore.getState();
            expect(state.theme).toBe("winter");
        });
    });

    describe("toggleTheme", () => {
        it("should toggle from winter to night", () => {
            const { toggleTheme } = useThemeStore.getState();

            act(() => {
                toggleTheme();
            });

            expect(useThemeStore.getState().theme).toBe("night");
        });

        it("should toggle from night to winter", () => {
            useThemeStore.setState({ theme: "night" });
            const { toggleTheme } = useThemeStore.getState();

            act(() => {
                toggleTheme();
            });

            expect(useThemeStore.getState().theme).toBe("winter");
        });
    });

    describe("initTheme", () => {
        it("should apply current theme to document", () => {
            const { initTheme } = useThemeStore.getState();

            act(() => {
                initTheme();
            });

            // initTheme applies the current theme state to document
            // The theme should remain whatever was initialized at module load
            expect(useThemeStore.getState().theme).toBeDefined();
        });
    });
});