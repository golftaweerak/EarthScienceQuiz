/**
 * A collection of shared utility functions for the Quiz App.
 */

/**
 * Shuffles an array in place using the Fisher-Yates (aka Knuth) algorithm.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} text The text to escape.
 * @returns {string} The escaped text.
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Unregisters all service workers and clears all caches, then reloads the page.
 * Useful for forcing an update when a new version is deployed.
 */
export async function clearServiceWorkerCache() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      await caches.delete(key);
    }
  }
  window.location.reload();
}