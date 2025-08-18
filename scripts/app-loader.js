import { initializeDarkMode } from './dark-mode.js';
import { initializeMainMenu } from './main-menu.js';
import { initializePage } from './main.js';
import { initializeModals } from './modal-handler.js';

/**
 * Fetches HTML content from a URL and injects it into a specified element.
 * @param {string} selector - The CSS selector for the target element.
 * @param {string} url - The URL of the HTML component to load.
 */
async function loadComponent(selector, url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        const data = await response.text();
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = data;
        }
    } catch (error) {
        console.error(`Error loading component for ${selector}:`, error);
    }
}

/**
 * Initializes the application by loading shared components and then running page-specific scripts.
 */
async function main() {
    // Load shared components first
    await Promise.all([
        loadComponent('#header-placeholder', '/components/_header.html'),
        loadComponent('#footer-placeholder', '/components/_footer.html')
    ]);

    // Now that the DOM for components is loaded, initialize all scripts
    initializeDarkMode();
    initializeMainMenu();
    initializeModals(); // For modals on the index page
    initializePage();   // For main page logic
}

document.addEventListener('DOMContentLoaded', main);