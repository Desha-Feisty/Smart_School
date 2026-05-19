import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal, ConfirmDialog } from "../Modal";

describe("Modal", () => {
    it("should not render when isOpen is false", () => {
        render(
            <Modal isOpen={false} onClose={() => {}}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.queryByText("Modal Content")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
        render(
            <Modal isOpen={true} onClose={() => {}}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(screen.getByText("Modal Content")).toBeInTheDocument();
    });

    it("should render with title", () => {
        render(
            <Modal isOpen={true} onClose={() => {}} title="Test Modal">
                <div>Content</div>
            </Modal>
        );
        expect(screen.getByText("Test Modal")).toBeInTheDocument();
    });

    it("should call onClose when close button is clicked", () => {
        const handleClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={handleClose} showClose={true}>
                <div>Content</div>
            </Modal>
        );
        fireEvent.click(screen.getByLabelText("Close modal"));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when overlay is clicked", () => {
        const handleClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={true}>
                <div>Content</div>
            </Modal>
        );
        // Click on the overlay by finding the element with bg-black/50 class
        // The overlay is the first child of the dialog's parent
        const dialog = screen.getByRole("dialog");
        const overlay = dialog.parentElement.querySelector('.bg-black\\/50');
        fireEvent.click(overlay);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should not call onClose when overlay is clicked if closeOnOverlayClick is false", () => {
        const handleClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
                <div>Content</div>
            </Modal>
        );
        const dialog = screen.getByRole("dialog");
        const overlay = dialog.parentElement.querySelector('.bg-black\\/50');
        fireEvent.click(overlay);
        expect(handleClose).not.toHaveBeenCalled();
    });

    it("should call onClose when Escape key is pressed", () => {
        const handleClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={handleClose}>
                <div>Content</div>
            </Modal>
        );
        fireEvent.keyDown(document, { key: "Escape" });
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should render with different sizes", () => {
        const { rerender } = render(
            <Modal isOpen={true} onClose={() => {}} size="sm">
                <div>Small</div>
            </Modal>
        );
        expect(screen.getByText("Small")).toBeInTheDocument();

        rerender(
            <Modal isOpen={true} onClose={() => {}} size="lg">
                <div>Large</div>
            </Modal>
        );
        expect(screen.getByText("Large")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
        render(
            <Modal isOpen={true} onClose={() => {}} className="custom-modal">
                <div>Content</div>
            </Modal>
        );
        // The className is applied to the glass-panel div
        // Find it by looking for the glass-panel class
        const glassPanel = screen.getByText("Content").closest('.glass-panel');
        expect(glassPanel).toHaveClass("custom-modal");
    });
});

describe("ConfirmDialog", () => {
    it("should render with default props", () => {
        render(
            <ConfirmDialog isOpen={true} onClose={() => {}} onConfirm={() => {}} />
        );
        expect(screen.getByText("Confirm Action")).toBeInTheDocument();
        expect(screen.getByText("Are you sure you want to proceed?")).toBeInTheDocument();
        expect(screen.getByText("Confirm")).toBeInTheDocument();
        expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should render with custom labels", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                onClose={() => {}}
                onConfirm={() => {}}
                title="Delete Item"
                message="This action cannot be undone"
                confirmLabel="Delete"
                cancelLabel="Keep"
            />
        );
        expect(screen.getByText("Delete Item")).toBeInTheDocument();
        expect(screen.getByText("This action cannot be undone")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
        expect(screen.getByText("Keep")).toBeInTheDocument();
    });

    it("should call onConfirm when confirm button is clicked", () => {
        const handleConfirm = vi.fn();
        render(
            <ConfirmDialog
                isOpen={true}
                onClose={() => {}}
                onConfirm={handleConfirm}
            />
        );
        fireEvent.click(screen.getByText("Confirm"));
        expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when cancel button is clicked", () => {
        const handleClose = vi.fn();
        render(
            <ConfirmDialog
                isOpen={true}
                onClose={handleClose}
                onConfirm={() => {}}
            />
        );
        fireEvent.click(screen.getByText("Cancel"));
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("should show loading state", () => {
        render(
            <ConfirmDialog
                isOpen={true}
                onClose={() => {}}
                onConfirm={() => {}}
                loading={true}
            />
        );
        expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
    });
});