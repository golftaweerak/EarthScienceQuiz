/**
 * Initializes the theme toggle button functionality.
 * It finds the necessary elements, sets the initial state based on localStorage,
 * and adds a click event listener to toggle the theme.
 */
function initializeThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

    // Exit if essential elements are not found
    if (!themeToggleBtn || !themeToggleDarkIcon || !themeToggleLightIcon) {
        console.warn('Theme toggle initialization skipped: button or icon elements not found.');
        return;
    }

    // Prevent re-initialization if the script is called multiple times
    if (themeToggleBtn.dataset.themeInitialized) {
        return;
    }
    themeToggleBtn.dataset.themeInitialized = 'true';

    // Function to update the button's icon based on the current theme
    const updateThemeUI = () => {
        const isDark = document.documentElement.classList.contains('dark');
        themeToggleDarkIcon.classList.toggle('hidden', !isDark);
        themeToggleLightIcon.classList.toggle('hidden', isDark);
    };

    // Set the initial state of the toggle button on page load
    updateThemeUI();

    themeToggleBtn.addEventListener('click', () => {
        // Check and toggle the 'dark' class on the <html> element
        const isDark = document.documentElement.classList.toggle('dark');
        // Update localStorage with the new theme preference
        localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
        // Update the button icon to reflect the change
        updateThemeUI();
    });
}

// Listen for the custom event that signals a component (like the header) has been loaded.
// This ensures the theme toggle button exists in the DOM before we try to add listeners to it.
document.addEventListener('componentLoaded', (e) => {
    if (e.detail.name === 'header') {
        initializeThemeToggle();
    }
});

// Fallback for pages that might not use the dynamic component loader.
// It attempts to initialize the theme toggle as soon as the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    initializeThemeToggle();
});