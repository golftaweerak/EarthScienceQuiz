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

    // --- SETUP AUTOMATIC MATH RENDERING FOR DYNAMIC CONTENT ---
    // The quiz question and feedback explanation are loaded dynamically. We use
    // MutationObservers to automatically render KaTeX whenever new content is added,
    // ensuring that math equations display correctly even when shown after a timeout.
    const setupMathObserver = (elementId) => {
        const targetNode = document.getElementById(elementId);
        // Exit if the target element or the KaTeX renderer isn't available.
        if (!targetNode || !window.renderMathInElement) return;

        const renderMath = () => {
            try {
                // Call the KaTeX auto-render function on the target element.
                window.renderMathInElement(targetNode, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    // Don't throw an error on parsing failure, just log it.
                    throwOnError: false
                });
            } catch (error) {
                console.error(`KaTeX rendering failed for #${elementId}:`, error);
            }
        };

        // Create an observer that calls renderMath whenever the element's content changes.
        const observer = new MutationObserver(renderMath);

        // Start observing the target node for additions/removals of child nodes.
        observer.observe(targetNode, { childList: true, subtree: true });
    };

    setupMathObserver('question'); // For the question text itself
    setupMathObserver('feedback'); // For the explanation text in the feedback box

    // Initialize the core quiz functionality.
    // This function will handle loading data and setting up the quiz logic.
    initializeQuiz();
}

document.addEventListener('DOMContentLoaded', main);