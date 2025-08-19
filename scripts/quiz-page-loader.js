import { initializeQuiz } from './quiz-loader.js';
import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';

/**
 * Initializes all scripts required for the quiz page.
 * This acts as the main entry point after the DOM is loaded.
 */
async function main() {
    // Load shared components first
    await Promise.all([
            loadComponent('#main_header-placeholder', '../components/main_header.html'),
            loadComponent('#footer-placeholder', '../components/footer.html')
    ]);

    // Initialize common UI components like header, menu, and footer scripts.
    // This must run BEFORE fixing paths, as it populates the menu with links.
    initializeCommonComponents();

    // --- FIX COMPONENT PATHS FOR QUIZ PAGE ---
    // Shared components use relative paths like './index.html' which work from the root.
    // Since this page is in a subdirectory ('/quiz'), we must prepend '../' to make them work here.
    const fixComponentPaths = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Fix <a> links
        container.querySelectorAll('a[href^="./"]').forEach(link => {
            const currentHref = link.getAttribute('href');
            link.setAttribute('href', `..${currentHref.substring(1)}`); // Changes './' to '../'
        });

        // Fix <img> sources
        container.querySelectorAll('img[src^="./"]').forEach(img => {
            const currentSrc = img.getAttribute('src');
            img.setAttribute('src', `..${currentSrc.substring(1)}`); // Changes './' to '../'
        });
    };
    fixComponentPaths('main_header-placeholder');
    fixComponentPaths('footer-placeholder');

    // Initialize the core quiz functionality.
    // This function will handle loading data and setting up the quiz logic.
    initializeQuiz();
}

document.addEventListener('DOMContentLoaded', main);