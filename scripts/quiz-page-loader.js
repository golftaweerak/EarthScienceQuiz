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

    // --- FIX COMPONENT PATHS FOR QUIZ PAGE (which is in a subdirectory) ---
    if (window.location.pathname.includes('/quiz/')) {
        // This function is ONLY for pages inside a subdirectory like /quiz/
        const fixComponentPathsForSubdirectory = (containerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;
    
            // Fix <a> links: changes './' to '../'
            container.querySelectorAll('a[href^="./"]').forEach(link => {
                const currentHref = link.getAttribute('href');
                link.setAttribute('href', `..${currentHref.substring(1)}`);
            });
    
            // Fix <img> sources: changes './' to '../'
            container.querySelectorAll('img[src^="./"]').forEach(img => {
                const currentSrc = img.getAttribute('src');
                img.setAttribute('src', `..${currentSrc.substring(1)}`);
            });
        };
        fixComponentPathsForSubdirectory('main_header-placeholder');
        fixComponentPathsForSubdirectory('footer-placeholder');
    }

    // Initialize the core quiz functionality.
    // This function will handle loading data and setting up the quiz logic.
    initializeQuiz();
}

document.addEventListener('DOMContentLoaded', main);