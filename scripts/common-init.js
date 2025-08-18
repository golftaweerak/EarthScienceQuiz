import { initializeDarkMode } from './dark-mode.js';
import { initializeDropdown } from './dropdown.js';
import { initializeMenu } from './menu-handler.js';

/**
 * Initializes all components and functionalities that are common across multiple pages.
 * This includes dark mode, the main navigation menu, and the copyright year.
 */
export function initializeCommonComponents() {
    initializeDarkMode();
    // Assumes the main menu button and dropdown have these IDs on all pages where this is called.
    initializeDropdown('main-menu-btn', 'main-menu-dropdown');
    initializeMenu();

    // Set copyright year in the footer
    const yearSpan = document.getElementById("copyright-year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}