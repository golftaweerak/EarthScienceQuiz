import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { Gamification } from './gamification.js';
import { initializeDarkMode } from './dark-mode.js';

let isAnchorScrollInitialized = false;

/**
 * Handles anchor link clicks from the page header to ensure smooth scrolling
 * after accordion animations complete. This fixes issues where collapsing
 * accordions cause a layout shift, making the browser scroll to the wrong position.
 */
function initializeAnchorScrollFix(toggleAccordion, getSectionToggles) {
    if (isAnchorScrollInitialized) return;
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
    isAnchorScrollInitialized = true;
}

/**
 * Initializes the application by loading shared components and then running page-specific scripts.
 */
async function main() {
    try {
        // Optimization: Prefetch page-specific scripts in parallel
        const mainScriptPromise = import('./main.js');
        const customQuizHandlerPromise = import('./custom-quiz-handler.js');

        // FIX: Initialize Theme & Gamification early to prevent FOUC (Flash of Unstyled Content)
        // This applies classes to <html> immediately before waiting for network requests.
        initializeDarkMode();
        new Gamification();

        // Load all shared components concurrently for better performance.
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#header-placeholder', './components/header.html'),
            loadComponent('#footer-placeholder', './components/footer.html'),
            loadComponent('#modals-placeholder', './components/modals_common.html'),
        ]);

        // Initialize common components like header, menu, etc.
        await initializeCommonComponents();

        // Then, initialize scripts specific to the page by checking for key elements.
        if (document.getElementById('quiz-categories-container')) {
            try {
                const { initializePage, toggleAccordion, getSectionToggles } = await mainScriptPromise;
                initializePage();
                initializeAnchorScrollFix(toggleAccordion, getSectionToggles);
            } catch (err) {
                console.error("Failed to load main page logic:", err);
            }
        }
        if (document.getElementById('create-custom-quiz-btn')) {
            try {
                const { initializeCustomQuizHandler } = await customQuizHandlerPromise;
                initializeCustomQuizHandler();
            } catch (err) {
                console.error("Failed to load custom quiz handler:", err);
            }
        }
    } catch (error) {
        console.error("Critical error during app initialization:", error);
        // Fallback UI for critical errors
        const container = document.querySelector('main') || document.body;
        if (container) {
             container.innerHTML = `
                <div class="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                    <div class="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">เกิดข้อผิดพลาดในการโหลด</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">ไม่สามารถโหลดส่วนประกอบของหน้าเว็บได้ (${error.message})</p>
                    <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">รีโหลดหน้าเว็บ</button>
                </div>
             `;
        }
    }
}

document.addEventListener('DOMContentLoaded', main);