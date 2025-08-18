import { initializeQuiz } from './quiz-loader.js';
import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { quizList } from '../data/quizzes-list.js'; // Import quizList to make it available for the menu

/**
 * Initializes all scripts required for the quiz page.
 * This acts as the main entry point after the DOM is loaded.
 */
async function main() {
    // Load shared components first
    await Promise.all([
            loadComponent('#main_header-placeholder', '../components/_main_header.html'),
            loadComponent('#footer-placeholder', '../components/_footer.html')
    ]);

    // Initialize common UI components like header, menu, and footer scripts
    initializeCommonComponents();

    // Initialize the core quiz functionality.
    // This function will handle loading data and setting up the quiz logic.
    initializeQuiz();
}

document.addEventListener('DOMContentLoaded', main);