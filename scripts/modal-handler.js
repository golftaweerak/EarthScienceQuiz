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

        // NEW: Prevent duplicate handlers on the same element to avoid memory leaks
        if (this.modal._modalHandler) {
            // console.warn(`Modal "${modalId}" already has a handler. Destroying the old one.`);
            this.modal._modalHandler.destroy();
        }
        this.modal._modalHandler = this;

        // Find the container that has the transition classes
        this.modalContainer = this.modal.querySelector('.modal-container');
        if (!this.modalContainer) {
            console.warn(`Modal with id "${modalId}" is missing a .modal-container child. Transitions might not work correctly.`);
            this.modalContainer = this.modal; // Fallback to the modal itself
        }

        this._injectStyles();

        this.isAnimating = false;
        this.isOpen = false;
        this.triggerElement = null; // The element that opened the modal
        this.animationTimeout = null; // Store timeout reference
        this.currentTransitionHandler = null; // Store event listener reference

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
     * Injects custom CSS for smoother modal animations.
     * @private
     */
    _injectStyles() {
        if (document.getElementById('modal-smooth-styles')) return;
        const style = document.createElement('style');
        style.id = 'modal-smooth-styles';
        style.textContent = `
            .modal {
                transition: opacity 0.3s ease-out, backdrop-filter 0.3s ease-out;
                opacity: 0;
                pointer-events: none;
            }
            .modal.is-open {
                opacity: 1;
                pointer-events: auto;
            }
            .modal .modal-container {
                transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out;
                transform: scale(0.95) translateY(8px);
                opacity: 0;
            }
            .modal.is-open .modal-container {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Opens the modal with a fade-in and scale-up animation.
     * @param {HTMLElement} [triggerElement] - The element that triggered the modal opening.
     */
    open(triggerElement = null) {
        if (this.isOpen || this.isAnimating) return;

        this.isOpen = true;
        this.isAnimating = true;
        this._cleanupAnimation(); // Clear any pending animations

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
        const handler = () => {
            this._cleanupAnimation();
            this.isAnimating = false;
            this.setFocus();
        };

        this.currentTransitionHandler = handler;
        this.animationTimeout = setTimeout(handler, 400); // 300ms duration + buffer
        // Wait for the animation to finish before setting focus
        this.modalContainer?.addEventListener('transitionend', handler, { once: true });
    }

    /**
     * Closes the modal with a fade-out and scale-down animation.
     */
    close() {
        if (!this.isOpen || this.isAnimating) return;

        this.isAnimating = true;
        this._cleanupAnimation(); // Clear any pending animations
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
            this._cleanupAnimation();
        };

        this.currentTransitionHandler = cleanup;
        this.animationTimeout = setTimeout(cleanup, 400);
        this.modalContainer?.addEventListener('transitionend', cleanup, { once: true });
    }

    /**
     * Cleans up any pending animation timeouts and listeners.
     * @private
     */
    _cleanupAnimation() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        if (this.currentTransitionHandler && this.modalContainer) {
            this.modalContainer.removeEventListener('transitionend', this.currentTransitionHandler);
            this.currentTransitionHandler = null;
        }
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
            
            // NEW: Check for autofocus element
            const autoFocusElement = this.modal.querySelector('[data-modal-autofocus]');
            if (autoFocusElement && !autoFocusElement.disabled && autoFocusElement.offsetParent !== null) {
                autoFocusElement.focus();
            } else {
                this.firstFocusableElement.focus();
            }
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

        // NEW: Handle Enter key for default confirmation
        if (e.key === "Enter") {
            const active = document.activeElement;
            // If focus is on an interactive element that handles Enter, let it be.
            if (active && (active.tagName === 'BUTTON' || active.tagName === 'A' || active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
                return;
            }
            
            const confirmBtn = this.modal.querySelector('[data-modal-confirm]');
            if (confirmBtn && !confirmBtn.disabled && confirmBtn.offsetParent !== null) {
                e.preventDefault();
                confirmBtn.click();
            }
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
        this._cleanupAnimation();
        if (this.closeButtons) {
            this.closeButtons.forEach((btn) => btn.removeEventListener("click", this.boundClose));
        }
        if (this.modal) {
            this.modal.removeEventListener("click", this.boundBackdropClick);
        }
        document.removeEventListener("keydown", this.handleKeyDown);

        // NEW: Clear references to DOM elements to allow Garbage Collection
        if (this.modal) {
            delete this.modal._modalHandler;
            this.modal = null;
        }
        this.closeButtons = null;
        this.modalContainer = null;
        this.triggerElement = null;
    }
}
