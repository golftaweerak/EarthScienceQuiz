/**
 * Initializes a generic, accessible dropdown menu using its button and dropdown IDs.
 * This is the primary handler for all dropdown menus in the application.
 *
 * @param {string} buttonId - The ID of the button that toggles the menu.
 * @param {string} dropdownId - The ID of the dropdown element.
 */
export function initializeDropdown(buttonId, dropdownId) {
    const menuButton = document.getElementById(buttonId);
    const dropdownMenu = document.getElementById(dropdownId);

    if (!menuButton || !dropdownMenu) {
        // Silently return if elements are not found on the current page.
        return;
    }

    // Set initial accessibility attributes
    menuButton.setAttribute('aria-haspopup', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    // The container is the parent of the button. This is a reasonable assumption for "click outside" logic.
    const container = menuButton.parentElement;

    let isMenuOpen = false;
    const transitionDuration = 200; // Should match the duration in Tailwind classes

    function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;
        menuButton.setAttribute('aria-expanded', 'true');
        dropdownMenu.classList.remove('hidden');
        // Use a tiny timeout to allow the browser to apply 'display: block' before starting the transition
        setTimeout(() => {
            dropdownMenu.classList.remove('opacity-0', 'scale-95');
        }, 10);
    }

    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        menuButton.setAttribute('aria-expanded', 'false');
        dropdownMenu.classList.add('opacity-0', 'scale-95');
        // Wait for the transition to finish before hiding the element completely
        setTimeout(() => {
            dropdownMenu.classList.add('hidden');
        }, transitionDuration);
    }

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        isMenuOpen ? closeMenu() : openMenu();
    });

    window.addEventListener('click', (event) => {
        // Use the container for a more robust "click outside" check
        if (isMenuOpen && container && !container.contains(event.target)) {
            closeMenu();
        }
    });

    // Also close with the Escape key for accessibility
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
}