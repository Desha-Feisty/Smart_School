import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input, Textarea, Select } from "../Input";

describe("Input", () => {
    it("should render input element", () => {
        render(<Input />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with label", () => {
        render(<Input label="Email" />);
        expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("should show error message", () => {
        render(<Input error="This field is required" />);
        expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should apply error class when error exists", () => {
        render(<Input error="Error" />);
        expect(screen.getByRole("textbox")).toHaveClass("input-error");
    });

    it("should render with icon", () => {
        const Icon = () => <span data-testid="icon">X</span>;
        render(<Input icon={Icon} />);
        expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("should handle value changes", () => {
        const handleChange = vi.fn();
        render(<Input onChange={handleChange} />);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("should apply custom className", () => {
        render(<Input className="custom-class" />);
        expect(screen.getByRole("textbox")).toHaveClass("custom-class");
    });

    it("should forward ref", () => {
        const ref = { current: null };
        render(<Input ref={ref} />);
        expect(ref.current).not.toBeNull();
    });

    it("should handle placeholder", () => {
        render(<Input placeholder="Enter text" />);
        expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("should handle type prop", () => {
        render(<Input type="password" placeholder="password" />);
        expect(screen.getByPlaceholderText("password")).toHaveAttribute("type", "password");
    });
});

describe("Textarea", () => {
    it("should render textarea element", () => {
        render(<Textarea />);
        expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render with label", () => {
        render(<Textarea label="Description" />);
        expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("should show error message", () => {
        render(<Textarea error="Too short" />);
        expect(screen.getByText("Too short")).toBeInTheDocument();
    });

    it("should apply error class when error exists", () => {
        render(<Textarea error="Error" />);
        expect(screen.getByRole("textbox")).toHaveClass("textarea-error");
    });

    it("should handle value changes", () => {
        const handleChange = vi.fn();
        render(<Textarea onChange={handleChange} />);
        fireEvent.change(screen.getByRole("textbox"), { target: { value: "test" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("should forward ref", () => {
        const ref = { current: null };
        render(<Textarea ref={ref} />);
        expect(ref.current).not.toBeNull();
    });
});

describe("Select", () => {
    it("should render select element", () => {
        const options = [
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" },
        ];
        render(<Select options={options} />);
        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should render with label", () => {
        const options = [{ value: "1", label: "Option 1" }];
        render(<Select label="Choose" options={options} />);
        expect(screen.getByText("Choose")).toBeInTheDocument();
    });

    it("should render placeholder", () => {
        const options = [{ value: "1", label: "Option 1" }];
        render(<Select placeholder="Select an option" options={options} />);
        expect(screen.getByText("Select an option")).toBeInTheDocument();
    });

    it("should render options", () => {
        const options = [
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" },
        ];
        render(<Select options={options} />);
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("should show error message", () => {
        const options = [{ value: "1", label: "Option 1" }];
        render(<Select error="Invalid selection" options={options} />);
        expect(screen.getByText("Invalid selection")).toBeInTheDocument();
    });

    it("should handle value changes", () => {
        const handleChange = vi.fn();
        const options = [
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2" },
        ];
        render(<Select options={options} onChange={handleChange} />);
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
        expect(handleChange).toHaveBeenCalled();
    });

    it("should forward ref", () => {
        const ref = { current: null };
        const options = [{ value: "1", label: "Option 1" }];
        render(<Select ref={ref} options={options} />);
        expect(ref.current).not.toBeNull();
    });
});