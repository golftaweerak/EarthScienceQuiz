import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { initializePreviewPage } from './preview.js';

/**
 * Initializes all scripts required for the quiz preview page.
 * This acts as the main entry point after the DOM is loaded.
 */
async function main() {
    // Load shared components first to ensure they are in the DOM.
    await Promise.all([
        loadComponent('#main_header-placeholder', './components/main_header.html'),
        loadComponent('#footer-placeholder', './components/footer.html'),
        loadComponent('#modals-placeholder', './components/modals_common.html')
    ]);

    // Initialize common UI components like header, menu, and dark mode.
    // This is wrapped in a try-catch as a defensive measure. The preview page
    // might not have all the HTML elements that other pages do (e.g., specific menu buttons),
    // and this prevents an error in a shared script from breaking the entire page.
    try {
        initializeCommonComponents();
    } catch (error) {
        console.warn("A non-critical error occurred during common component initialization on the preview page. This is often expected if the page has a unique layout.", error);
    }

    // Initialize the core functionality specific to the preview page.
    // If the page is not loading correctly, the issue is likely within this function or the scripts it calls.
    try {
        initializePreviewPage();
    } catch (error) {
        console.error("A critical error occurred while initializing the preview page:", error);
    }
}

document.addEventListener('DOMContentLoaded', main);