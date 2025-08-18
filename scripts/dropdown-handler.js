/**
 * Initializes a generic, accessible dropdown menu.
 *
 * @param {string} containerSelector - The CSS selector for the parent element containing the button and dropdown.
 * @param {string} buttonSelector - The CSS selector for the button that toggles the menu.
 * @param {string} dropdownSelector - The CSS selector for the dropdown element.
 */
export function initializeDropdown(containerSelector, buttonSelector, dropdownSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const menuButton = container.querySelector(buttonSelector);
    const dropdownMenu = container.querySelector(dropdownSelector);

    if (!menuButton || !dropdownMenu) {
        return;
    }

    let isMenuOpen = false;
    const transitionDuration = 200; // Should match Tailwind's duration-200

    function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;
        dropdownMenu.classList.remove('hidden');
        // Use a tiny timeout to allow the 'display' change to apply before starting the transition.
        setTimeout(() => {
            dropdownMenu.classList.remove('opacity-0', 'scale-95');
        }, 10);
    }

    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        dropdownMenu.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            dropdownMenu.classList.add('hidden');
        }, transitionDuration);
    }

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the window click listener from closing it immediately.
        isMenuOpen ? closeMenu() : openMenu();
    });

    // Close the menu if the user clicks outside of it or presses the Escape key.
    window.addEventListener('click', (event) => {
        if (isMenuOpen && !container.contains(event.target)) {
            closeMenu();
        }
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
}