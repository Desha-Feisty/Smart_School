import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "../Button";

describe("Button", () => {
    it("should render with children", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("should render with different variants", () => {
        const { rerender } = render(<Button variant="primary">Primary</Button>);
        expect(screen.getByText("Primary")).toHaveClass("btn-primary");

        rerender(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByText("Secondary")).toHaveClass("btn-secondary");

        rerender(<Button variant="success">Success</Button>);
        expect(screen.getByText("Success")).toHaveClass("btn-success");

        rerender(<Button variant="error">Error</Button>);
        expect(screen.getByText("Error")).toHaveClass("btn-error");
    });

    it("should render with different sizes", () => {
        const { rerender } = render(<Button size="xs">XS</Button>);
        expect(screen.getByText("XS")).toHaveClass("btn-xs");

        rerender(<Button size="sm">SM</Button>);
        expect(screen.getByText("SM")).toHaveClass("btn-sm");

        rerender(<Button size="md">MD</Button>);
        expect(screen.getByText("MD")).toHaveClass("btn");

        rerender(<Button size="lg">LG</Button>);
        expect(screen.getByText("LG")).toHaveClass("btn-lg");
    });

    it("should show loading state", () => {
        render(<Button loading>Loading</Button>);
        expect(screen.queryByText("Loading")).not.toBeInTheDocument();
        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should be disabled when loading", () => {
        render(<Button loading>Loading</Button>);
        expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should render with icon on left", () => {
        const Icon = () => <span data-testid="icon">X</span>;
        render(<Button icon={Icon} iconPosition="left">With Icon</Button>);
        expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("should render with icon on right", () => {
        const Icon = () => <span data-testid="icon">X</span>;
        render(<Button icon={Icon} iconPosition="right">With Icon</Button>);
        expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("should handle click events", () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click me</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should not handle click when disabled", () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Disabled</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it("should not handle click when loading", () => {
        const handleClick = vi.fn();
        render(<Button loading onClick={handleClick}>Loading</Button>);
        fireEvent.click(screen.getByRole("button"));
        expect(handleClick).not.toHaveBeenCalled();
    });

    it("should apply custom className", () => {
        render(<Button className="custom-class">Custom</Button>);
        expect(screen.getByRole("button")).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
        const ref = { current: null };
        render(<Button ref={ref}>Ref Button</Button>);
        expect(ref.current).not.toBeNull();
    });
});