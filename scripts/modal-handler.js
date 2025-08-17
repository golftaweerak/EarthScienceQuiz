/**
 * A reusable class to manage accessible modal dialogs.
 *
 * Features:
 * - Toggles visibility.
 * - Traps focus within the modal.
 * - Closes on 'Escape' key press.
 * - Closes on backdrop click.
 * - Disables body scroll when open.
 * - Restores focus to the trigger element on close.
 */
class ModalHandler {
    /**
     * @param {string} modalId The ID of the modal element.
     */
    constructor(modalId) {
        this.modal = document.getElementById(modalId);
        if (!this.modal) {
            console.error(`Modal with id "${modalId}" not found.`);
            return;
        }

        this.focusableElements = [];
        this.firstFocusableElement = null;
        this.lastFocusableElement = null;
        this.triggerElement = null; // The element that opened the modal

        // Bind methods to ensure 'this' context is correct
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.close = this.close.bind(this);

        // Find close buttons and backdrop
        const closeButtons = this.modal.querySelectorAll('[data-modal-close]');
        closeButtons.forEach(btn => btn.addEventListener('click', this.close));

        // Close on backdrop click by default
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    /**
     * Opens the modal.
     * @param {HTMLElement} [triggerElement] - The element that triggered the modal opening.
     */
    open(triggerElement = null) {
        if (!this.modal) return;

        this.triggerElement = triggerElement;
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Get all focusable elements inside the modal
        const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        this.focusableElements = Array.from(this.modal.querySelectorAll(focusableSelector));
        this.firstFocusableElement = this.focusableElements[0];
        this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];

        document.addEventListener('keydown', this.handleKeyDown);

        // Set focus to the first focusable element or the modal itself
        if (this.firstFocusableElement) {
            this.firstFocusableElement.focus();
        } else {
            this.modal.setAttribute('tabindex', '-1'); // Make modal focusable if it has no focusable children
            this.modal.focus();
        }
    }

    /**
     * Closes the modal.
     */
    close() {
        if (!this.modal) return;

        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.handleKeyDown);

        if (this.triggerElement) {
            this.triggerElement.focus();
        }
    }

    /**
     * Handles keydown events for accessibility (Escape key and focus trapping).
     * @param {KeyboardEvent} e
     */
    handleKeyDown(e) {
        if (e.key === 'Escape') this.close();
        if (e.key !== 'Tab' || !this.firstFocusableElement) return;

        if (e.shiftKey && document.activeElement === this.firstFocusableElement) {
            this.lastFocusableElement.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === this.lastFocusableElement) {
            this.firstFocusableElement.focus();
            e.preventDefault();
        }
    }
}