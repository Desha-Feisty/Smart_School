import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingPage, LoadingSpinner, LoadingOverlay } from "../Loading";

describe("LoadingPage", () => {
    it("should render loading page", () => {
        render(<LoadingPage />);
        expect(screen.getByTestId("loading-page")).toBeInTheDocument();
    });

    it("should render with custom message", () => {
        render(<LoadingPage message="Loading data..." />);
        expect(screen.getByText("Loading data...")).toBeInTheDocument();
    });
});

describe("LoadingSpinner", () => {
    it("should render spinner", () => {
        render(<LoadingSpinner />);
        expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("should render with size prop", () => {
        const { rerender } = render(<LoadingSpinner size="sm" />);
        expect(screen.getByTestId("loading-spinner")).toHaveClass("w-4");
        expect(screen.getByTestId("loading-spinner")).toHaveClass("h-4");

        rerender(<LoadingSpinner size="lg" />);
        expect(screen.getByTestId("loading-spinner")).toHaveClass("w-12");
        expect(screen.getByTestId("loading-spinner")).toHaveClass("h-12");
    });

    it("should render with custom className", () => {
        render(<LoadingSpinner className="custom-spinner" />);
        expect(screen.getByTestId("loading-spinner")).toHaveClass("custom-spinner");
    });
});

describe("LoadingOverlay", () => {
    it("should render overlay", () => {
        render(<LoadingOverlay />);
        expect(screen.getByTestId("loading-overlay")).toBeInTheDocument();
    });

    it("should render with message", () => {
        render(<LoadingOverlay message="Saving..." />);
        expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
});