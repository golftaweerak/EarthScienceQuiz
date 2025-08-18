/**
 * A collection of shared utility functions for the Quiz App.
 */

/**
 * Shows a modal with consistent animations.
 * @param {HTMLElement} modalElement The modal element to show.
 */
export function showModal(modalElement) {
  if (!modalElement) return;
  const content = modalElement.querySelector(".modal-content");
  modalElement.classList.remove("hidden");
  modalElement.classList.add("anim-backdrop-fade-in");
  if (content) content.classList.add("anim-modal-pop-in");
}

/**
 * Hides a modal with consistent animations.
 * @param {HTMLElement} modalElement The modal element to hide.
 * @param {Function} [onHiddenCallback] Optional callback to run after the hide animation completes.
 */
export function hideModal(modalElement, onHiddenCallback) {
  if (!modalElement) return;
  const content = modalElement.querySelector(".modal-content");
  modalElement.classList.remove("anim-backdrop-fade-in");
  modalElement.classList.add("anim-backdrop-fade-out");
  if (content) {
    content.classList.remove("anim-modal-pop-in");
    content.classList.add("anim-modal-pop-out");
  }

  setTimeout(() => {
    modalElement.classList.add("hidden");
    modalElement.classList.remove("anim-backdrop-fade-out");
    if (content) content.classList.remove("anim-modal-pop-out");

    if (typeof onHiddenCallback === "function") {
      onHiddenCallback();
    }
  }, 300); // This duration should match the CSS animation duration.
}

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