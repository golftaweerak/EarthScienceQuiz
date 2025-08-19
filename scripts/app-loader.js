import { initializePage, toggleAccordion, getSectionToggles } from './main.js';
import { initializeCustomQuizHandler } from './custom-quiz-handler.js';
import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';

/**
 * Handles anchor link clicks from the page header to ensure smooth scrolling
 * after accordion animations complete. This fixes issues where collapsing
 * accordions cause a layout shift, making the browser scroll to the wrong position.
 */
function initializeAnchorScrollFix() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    // Use event delegation on the container for the links
    headerPlaceholder.addEventListener('click', (event) => {
        const link = event.target.closest('a[href^="#category-"]');
        if (!link) return;

        event.preventDefault(); // Stop the browser's default immediate jump

        const targetId = link.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            const sectionToggles = getSectionToggles();
            const targetToggle = targetElement.querySelector('.section-toggle');

            if (targetToggle) {
                // Close all other accordions first for a cleaner UX
                sectionToggles.forEach(otherToggle => {
                    if (otherToggle !== targetToggle) {
                        toggleAccordion(otherToggle, 'close');
                    }
                });
                // Then, ensure the target accordion is open.
                toggleAccordion(targetToggle, 'open');
            }

            // We just need to wait for the collapse/expand animation to finish before scrolling.
            setTimeout(() => {
                targetElement.scrollIntoView(); // This respects the `scroll-padding-top` on <html>
            }, 550); // Adjust duration to be slightly longer than the CSS animation.
        }
    });
}

/**
 * Initializes the application by loading shared components and then running page-specific scripts.
 */
async function main() {
    // Load all shared components concurrently for better performance.
    await Promise.all([
        loadComponent('#main_header-placeholder', './components/main_header.html'),
        loadComponent('#header-placeholder', './components/header.html'),
        loadComponent('#footer-placeholder', './components/footer.html')
    ]);

    // Initialize common components like header, menu, etc.
    initializeCommonComponents();

    // Then, initialize scripts specific to the main page
    initializePage();   // For main page logic
    initializeCustomQuizHandler(); // For custom quiz creation logic
    initializeAnchorScrollFix(); // Add the fix for anchor scrolling
}

document.addEventListener('DOMContentLoaded', main);