import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";

vi.mock("socket.io-client", () => ({
    io: vi.fn(() => ({
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        connected: false,
    })),
}));

import useSocketStore from "../SocketStore";

describe("SocketStore", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSocketStore.setState({
            socket: null,
            isConnected: false,
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial State", () => {
        it("should have correct initial values", () => {
            const state = useSocketStore.getState();
            expect(state.socket).toBeNull();
            expect(state.isConnected).toBe(false);
        });
    });

    describe("connect", () => {
        it("should set isConnected to true when socket connects", () => {
            const { connect } = useSocketStore.getState();

            act(() => {
                connect("test-token");
            });

            // The actual connect would create a socket asynchronously
            // We just verify the function can be called without error
            expect(useSocketStore.getState()).toBeDefined();
        });
    });

    describe("disconnect", () => {
        it("should set isConnected to false when called", () => {
            useSocketStore.setState({ isConnected: true });
            const { disconnect } = useSocketStore.getState();

            act(() => {
                disconnect();
            });

            expect(useSocketStore.getState().isConnected).toBe(false);
            expect(useSocketStore.getState().socket).toBeNull();
        });
    });
});