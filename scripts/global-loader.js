import { initializePage } from './main.js';
import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { quizList } from '../data/quizzes-list.js'; // Import quizList to make it available for the menu

/**
 * Initializes all globally shared components and functionalities.
 */
async function initializeGlobal() {
    // Load shared HTML components into their placeholders
    await Promise.all([
        loadComponent('#main_header-placeholder', './components/main_header.html'),
        loadComponent('#header-placeholder', './components/header.html'), // This might not exist on all pages, but loadComponent handles it gracefully.
        loadComponent('#footer-placeholder', './components/footer.html'),
        loadComponent('#modals-placeholder', './components/modals_common.html')
    ]);

    // Once components are loaded, initialize common scripts
    initializeCommonComponents();

    // --- Page-Specific Initializations ---
    // Only run the main page setup if its container exists to avoid errors on other pages.
    if (document.getElementById('quiz-categories-container')) {
        initializePage();
    }
}

// Run the global initialization when the DOM is ready.
document.addEventListener('DOMContentLoaded', initializeGlobal);