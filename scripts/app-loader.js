import { initializePage } from './main.js';
import { initializeCustomQuizHandler } from './custom-quiz-handler.js';
import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';

/**
 * Initializes the application by loading shared components and then running page-specific scripts.
 */
async function main() {
    // Load all shared components concurrently for better performance.
    await Promise.all([
        loadComponent('#main_header-placeholder', '/components/_main_header.html'),
        loadComponent('#header-placeholder', '/components/_header.html'),
        loadComponent('#footer-placeholder', '/components/_footer.html')
    ]);

    // Initialize common components like header, menu, etc.
    initializeCommonComponents();

    // Then, initialize scripts specific to the main page
    initializePage();   // For main page logic
    initializeCustomQuizHandler(); // For custom quiz creation logic
}

document.addEventListener('DOMContentLoaded', main);