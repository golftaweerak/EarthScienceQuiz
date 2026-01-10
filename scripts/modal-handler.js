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

        // Find the container that has the transition classes
        this.modalContainer = this.modal.querySelector('.modal-container');
        if (!this.modalContainer) {
            console.warn(`Modal with id "${modalId}" is missing a .modal-container child. Transitions might not work correctly.`);
            this.modalContainer = this.modal; // Fallback to the modal itself
        }

        this.isAnimating = false;
        this.isOpen = false;
        this.triggerElement = null; // The element that opened the modal

        // Bind methods to ensure 'this' context is correct
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.open = this.open.bind(this);
        this.close = this.close.bind(this);

        // Store bound functions for removal
        this.boundClose = this.close.bind(this);
        this.boundBackdropClick = (e) => {
            if (e.target === this.modal || e.target.hasAttribute('data-modal-overlay')) {
                this.close();
            }
        };

        // Add event listeners
        this.closeButtons = this.modal.querySelectorAll("[data-modal-close]");
        this.closeButtons.forEach((btn) => btn.addEventListener("click", this.boundClose));
        // Updated to handle a separate overlay div for backdrop clicks
        this.modal.addEventListener("click", this.boundBackdropClick);
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
            requestAnimationFrame(() => {
                this.modal.classList.add("is-open");
            });
        });

        document.addEventListener("keydown", this.handleKeyDown);

        // Safety timeout in case transitionend doesn't fire
        const transitionTimeout = setTimeout(() => {
            this.isAnimating = false;
            this.setFocus();
        }, 400); // 300ms duration + buffer

        // Wait for the animation to finish before setting focus
        this.modalContainer?.addEventListener('transitionend', () => {
            clearTimeout(transitionTimeout);
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

        const cleanup = () => {
            this.modal.classList.add("hidden");
            document.body.style.overflow = "";
            document.removeEventListener("keydown", this.handleKeyDown);

            if (this.triggerElement) {
                this.triggerElement.focus();
            }

            this.isAnimating = false;
            this.isOpen = false;
        };

        // Safety timeout
        const transitionTimeout = setTimeout(cleanup, 400);

        // Wait for the animation to finish before hiding the modal completely
        this.modalContainer?.addEventListener('transitionend', () => {
            clearTimeout(transitionTimeout);
            cleanup();
        }, { once: true });
    }

    /**
     * Sets up and moves focus into the modal.
     */
    setFocus() {
        const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusableElements = Array.from(this.modal.querySelectorAll(focusableSelector))
            .filter(el => el.offsetParent !== null); // Ensure elements are visible

        if (focusableElements.length > 0) {
            this.firstFocusableElement = focusableElements[0];
            this.lastFocusableElement = focusableElements[focusableElements.length - 1];
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

        if (e.key === "Tab") {
            // Refresh focusable elements list in case DOM changed
            this.setFocus();
            
            if (!this.firstFocusableElement) return;

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

    /**
     * Removes all event listeners attached by this handler.
     */
    destroy() {
        if (this.closeButtons) {
            this.closeButtons.forEach((btn) => btn.removeEventListener("click", this.boundClose));
        }
        if (this.modal) {
            this.modal.removeEventListener("click", this.boundBackdropClick);
        }
    }
}
