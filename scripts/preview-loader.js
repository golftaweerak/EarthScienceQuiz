import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { initializePreviewPage } from './preview.js';

/**
 * Initializes all scripts required for the quiz preview page.
 * This acts as the main entry point after the DOM is loaded.
 */
async function main() {
    // Load shared components first
    await Promise.all([
        loadComponent('#main_header-placeholder', './components/main_header.html'),
        loadComponent('#footer-placeholder', './components/footer.html'),
        loadComponent('#modals-placeholder', './components/modals_common.html')
    ]);

    // Initialize common UI components like header, menu, and footer scripts
    // This is wrapped in a try-catch because common components might try to
    // access elements (e.g., from the main page) that don't exist here.
    // This prevents an error in a shared script from breaking this specific page.
    try {
        initializeCommonComponents();
    } catch (error) {
        console.error("Error during common component initialization on preview page (safe to ignore if page works):", error);
    }

    // Initialize the core preview page functionality.
    initializePreviewPage();
}

document.addEventListener('DOMContentLoaded', main);