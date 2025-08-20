import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { initializePreviewPage } from './preview.js';

/**
 * Initializes all scripts required for the developer-facing data preview page.
 */
async function main() {
    // Load shared components first
    await Promise.all([
        loadComponent('#main_header-placeholder', './components/main_header.html'),
        loadComponent('#footer-placeholder', './components/footer.html'),
        loadComponent('#modals-placeholder', './components/modals_common.html')
    ]);

    initializeCommonComponents();
    initializePreviewPage();
}

document.addEventListener('DOMContentLoaded', main);