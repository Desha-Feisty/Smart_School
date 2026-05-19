import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";

import useChatStore from "../ChatStore";

describe("ChatStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useChatStore.setState({
            activeChat: null,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial State", () => {
        it("should have correct initial values", () => {
            const state = useChatStore.getState();
            expect(state.activeChat).toBeNull();
        });
    });

    describe("openChat", () => {
        it("should open chat with peer info", () => {
            const { openChat } = useChatStore.getState();

            act(() => {
                openChat("peer-123", "John Doe", "course-456");
            });

            expect(useChatStore.getState().activeChat).toEqual({
                peerId: "peer-123",
                peerName: "John Doe",
                courseId: "course-456",
            });
        });
    });

    describe("closeChat", () => {
        it("should close active chat", () => {
            useChatStore.setState({ activeChat: { peerId: "p1", peerName: "Test", courseId: "c1" } });
            const { closeChat } = useChatStore.getState();

            act(() => {
                closeChat();
            });

            expect(useChatStore.getState().activeChat).toBeNull();
        });
    });
});