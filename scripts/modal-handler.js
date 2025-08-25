/**
 * A reusable class to manage accessible modal dialogs with smooth animations.
 *
 * Features:
 * - Toggles visibility with CSS transitions.
 * - Traps focus within the modal.
 * - Closes on 'Escape' key press.
 * - Closes on backdrop click.
 * - Disables body scroll when open.
 * - Restores focus to the trigger element on close.
 * - Prevents state issues from rapid clicks.
 */
export class ModalHandler {
    /** @param {string} modalId The ID of the modal element. */
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) {
            console.error(`Modal with id "${modalId}" not found.`);
            return;
        }

        this.isAnimating = false;
        this.isOpen = false;
        this.triggerElement = null; // The element that opened the modal

        // Bind methods to ensure 'this' context is correct
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);

        // Add event listeners
        const closeButtons = this.modal.querySelectorAll("[data-modal-close]");
        closeButtons.forEach((btn) => btn.addEventListener("click", this.close));
        this.modal.addEventListener("click", (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    /**
     * Opens the modal with a fade-in and scale-up animation.
     * @param {HTMLElement} [triggerElement] - The element that triggered the modal opening.
     */
    open(triggerElement = null) {
        if (this.isOpen || this.isAnimating) return;

        this.isOpen = true;
        this.isAnimating = true;
        this.triggerElement = triggerElement || document.activeElement;

        document.body.style.overflow = "hidden";
        this.modal.classList.remove("hidden");

        // Use requestAnimationFrame to ensure the browser has applied the display change
        // before adding the class that triggers the animation.
        requestAnimationFrame(() => {
            this.modal.classList.add("is-open");
        });

        document.addEventListener("keydown", this.handleKeyDown);

        // Wait for the animation to finish before setting focus
        this.modal.addEventListener('transitionend', () => {
            this.isAnimating = false;
            this.setFocus();
        }, { once: true });
    }

    /**
     * Closes the modal with a fade-out and scale-down animation.
     */
    close() {
        if (!this.isOpen || this.isAnimating) return;

        this.isAnimating = true;
        this.modal.classList.remove("is-open");

        // Wait for the animation to finish before hiding the modal completely
        this.modal.addEventListener('transitionend', () => {
            this.modal.classList.add("hidden");
            document.body.style.overflow = "";
            document.removeEventListener("keydown", this.handleKeyDown);

            if (this.triggerElement) {
                this.triggerElement.focus();
            }

            this.isAnimating = false;
            this.isOpen = false;
        }, { once: true });
    }

    /**
     * Sets up and moves focus into the modal.
     */
    setFocus() {
        const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(this.modal.querySelectorAll(focusableSelector))
            .filter(el => el.offsetParent !== null); // Ensure elements are visible

        this.firstFocusableElement = focusableElements[0];
        this.lastFocusableElement = focusableElements[focusableElements.length - 1];

        if (this.firstFocusableElement) {
            this.firstFocusableElement.focus();
        } else {
            // Make modal focusable if it has no focusable children
            this.modal.setAttribute("tabindex", "-1");
            this.modal.focus();
        }
    }

    /**
     * Handles keydown events for accessibility (Escape key and focus trapping).
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        if (e.key === "Escape") {
            this.close();
            return;
        }

        if (e.key !== "Tab" || !this.firstFocusableElement) return;

        if (e.shiftKey) {
            if (document.activeElement === this.firstFocusableElement) {
                this.lastFocusableElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === this.lastFocusableElement) {
                this.firstFocusableElement.focus();
                e.preventDefault();
            }
        }
    }
}
