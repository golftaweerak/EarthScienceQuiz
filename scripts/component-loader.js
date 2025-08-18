/**
 * Fetches HTML content from a URL and injects it into a specified element.
 * @param {string} selector - The CSS selector for the target element.
 * @param {string} url - The URL of the HTML component to load.
 */
export async function loadComponent(selector, url) {
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