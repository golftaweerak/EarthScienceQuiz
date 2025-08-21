/**
 * Fetches HTML content from a file and injects it into a specified element.
 * Includes robust error handling for network issues or missing elements.
 * @param {string} selector - The CSS selector for the target placeholder element.
 * @param {string} filePath - The path to the HTML component file.
 * @returns {Promise<void>} A promise that resolves when the component is loaded or fails.
 */
export async function loadComponent(selector, filePath) {
    const element = document.querySelector(selector);
    if (!element) {
        console.warn(`Component loader: Target element with selector '${selector}' not found.`);
        return;
    }

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
        }
        element.innerHTML = await response.text();
    } catch (error) {
        console.error(`Error loading component into '${selector}':`, error);
        // Provide user-facing feedback directly in the placeholder
        element.innerHTML = `<p class="text-center text-red-500 dark:text-red-400 p-4">เกิดข้อผิดพลาดในการโหลดส่วนนี้</p>`;
    }
}