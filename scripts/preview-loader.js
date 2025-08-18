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
        loadComponent('#main_header-placeholder', '/components/_main_header.html'),
        loadComponent('#footer-placeholder', '/components/_footer.html')
    ]);

    // Initialize common UI components like header, menu, and footer scripts
    initializeCommonComponents();

    // Initialize the core preview page functionality.
    initializePreviewPage();
}

document.addEventListener('DOMContentLoaded', main);