import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

import ErrorBoundary from "../ErrorBoundary";
import React from "react";

// Wrapper component to provide Router context
const Wrapper = ({ children }) => (
    <BrowserRouter>{children}</BrowserRouter>
);

// Test component that throws an error
const ThrowError = ({ shouldThrow }) => {
    if (shouldThrow) {
        throw new Error("Test error");
    }
    return <div>Normal content</div>;
};

describe("ErrorBoundary", () => {
    it("should render children when no error", () => {
        render(
            <Wrapper>
                <ErrorBoundary>
                    <div>Normal content</div>
                </ErrorBoundary>
            </Wrapper>
        );
        expect(screen.getByText("Normal content")).toBeInTheDocument();
    });

    it("should render default fallback when error occurs", () => {
        render(
            <Wrapper>
                <ErrorBoundary>
                  <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            </Wrapper>
        );
        
        // ErrorBoundary shows default error UI
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
        expect(screen.getByText("Test error")).toBeInTheDocument();
    });

    it("should have Try Again and Go Home buttons", () => {
        render(
            <Wrapper>
                <ErrorBoundary>
                  <ThrowError shouldThrow={true} />
                </ErrorBoundary>
            </Wrapper>
        );
        
        expect(screen.getByText("Try Again")).toBeInTheDocument();
        expect(screen.getByText("Go Home")).toBeInTheDocument();
    });
});