import { ModalHandler } from './modal-handler.js';

/**
 * Initializes the developer tools access functionality.
 * It finds the trigger link and sets up the password modal.
 * This function is designed to run on any page, but will only activate
 * if it finds the necessary trigger element and modal HTML.
 */
export function initializeDevTools() {
    const devToolsLink = document.getElementById('dev-tools-link');
    if (!devToolsLink) return; // Exit if the link isn't on the current page

    const devPasswordModal = new ModalHandler('dev-password-modal');
    const devPasswordForm = document.getElementById('dev-password-form');
    const devPasswordInput = document.getElementById('dev-password-input');
    const devPasswordError = document.getElementById('dev-password-error');

    if (!devPasswordModal.modal || !devPasswordForm || !devPasswordInput) {
        console.warn("Developer password modal elements not found. Cannot initialize dev tools.");
        return;
    }

    // --- Trigger Listener ---
    devToolsLink.addEventListener('click', (event) => {
        event.preventDefault();
        if (devPasswordInput) devPasswordInput.value = '';
        if (devPasswordError) devPasswordError.textContent = '';
        devPasswordModal.open(devToolsLink);
    });

    // --- Form Submission Listener ---
    devPasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = devPasswordInput.value;
        if (password === "promma_dev") {
            devPasswordModal.close();
            window.location.href = './preview-data.html';
        } else {
            if (devPasswordError) devPasswordError.textContent = "รหัสผ่านไม่ถูกต้อง";
            const modalContent = devPasswordModal.modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.add('anim-shake');
                setTimeout(() => modalContent.classList.remove('anim-shake'), 500);
            }
        }
    });
}