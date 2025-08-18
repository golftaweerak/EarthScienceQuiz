document.addEventListener('DOMContentLoaded', () => {
    const mainMenuBtn = document.getElementById('main-menu-btn');
    const mainMenuDropdown = document.getElementById('main-menu-dropdown');
    
    if (!mainMenuBtn || !mainMenuDropdown) {
        return;
    }

    let isMenuOpen = false;
    const transitionDuration = 200; // Should match the duration in Tailwind classes

    function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;
        mainMenuDropdown.classList.remove('hidden');
        // Use a tiny timeout to allow the browser to apply 'display: block' before starting the transition
        setTimeout(() => {
            mainMenuDropdown.classList.remove('opacity-0', 'scale-95');
        }, 10);
    }

    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        mainMenuDropdown.classList.add('opacity-0', 'scale-95');
        // Wait for the transition to finish before hiding the element completely
        setTimeout(() => {
            mainMenuDropdown.classList.add('hidden');
        }, transitionDuration);
    }

    mainMenuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        if (isMenuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    window.addEventListener('click', (event) => {
        if (isMenuOpen && !mainMenuDropdown.contains(event.target) && !mainMenuBtn.contains(event.target)) {
            closeMenu();
        }
    });

    // Also close with the Escape key for accessibility
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });
});