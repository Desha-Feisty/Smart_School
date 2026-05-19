import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";

import useUIStore from "../uiStore";

describe("UIStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useUIStore.setState({
            isSidebarOpen: true,
            activeModal: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial State", () => {
        it("should have correct initial values", () => {
            const state = useUIStore.getState();
            expect(state.isSidebarOpen).toBe(true);
            expect(state.activeModal).toBeNull();
        });
    });

    describe("toggleSidebar", () => {
        it("should toggle sidebar from open to closed", () => {
            const { toggleSidebar } = useUIStore.getState();

            act(() => {
                toggleSidebar();
            });

            expect(useUIStore.getState().isSidebarOpen).toBe(false);
        });

        it("should toggle sidebar from closed to open", () => {
            useUIStore.setState({ isSidebarOpen: false });
            const { toggleSidebar } = useUIStore.getState();

            act(() => {
                toggleSidebar();
            });

            expect(useUIStore.getState().isSidebarOpen).toBe(true);
        });
    });

    describe("openModal", () => {
        it("should open modal with given name", () => {
            const { openModal } = useUIStore.getState();

            act(() => {
                openModal("createCourse");
            });

            expect(useUIStore.getState().activeModal).toBe("createCourse");
        });
    });

    describe("closeModal", () => {
        it("should close modal", () => {
            useUIStore.setState({ activeModal: "createCourse" });
            const { closeModal } = useUIStore.getState();

            act(() => {
                closeModal();
            });

            expect(useUIStore.getState().activeModal).toBeNull();
        });
    });
});