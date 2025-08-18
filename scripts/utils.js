/**
 * A collection of shared utility functions for the Quiz App.
 */

// --- Modal Utilities ---
const AppUtils = {
  /**
   * Shows a modal with consistent animations.
   * @param {HTMLElement} modalElement The modal element to show.
   */
  showModal(modalElement) {
    if (!modalElement) return;
    const content = modalElement.querySelector(".modal-content");
    modalElement.classList.remove("hidden");
    modalElement.classList.add("anim-backdrop-fade-in");
    if (content) content.classList.add("anim-modal-pop-in");
  },

  /**
   * Hides a modal with consistent animations using the 'animationend' event.
   * @param {HTMLElement} modalElement The modal element to hide.
   * @param {Function} [onHiddenCallback] Optional callback to run after the hide animation completes.
   */
  hideModal(modalElement, onHiddenCallback) {
    if (!modalElement || modalElement.classList.contains("hidden")) return;
    const content = modalElement.querySelector(".modal-content");

    const onAnimationEnd = () => {
      modalElement.classList.add("hidden");
      modalElement.classList.remove("anim-backdrop-fade-out");
      if (content) content.classList.remove("anim-modal-pop-out");
      modalElement.removeEventListener('animationend', onAnimationEnd);
      if (typeof onHiddenCallback === "function") onHiddenCallback();
    };

    modalElement.addEventListener('animationend', onAnimationEnd);
    modalElement.classList.remove("anim-backdrop-fade-in");
    modalElement.classList.add("anim-backdrop-fade-out");
    if (content) {
      content.classList.remove("anim-modal-pop-in");
      content.classList.add("anim-modal-pop-out");
    }
  }
};

// Make functions globally accessible under a namespace.
window.AppUtils = AppUtils;

// --- Initialization Functions for UI Components ---

function initializeDarkModeToggle() {
  console.log('Attempting to initialize dark mode toggle...');
  const themeToggleBtn = document.getElementById('theme-toggle');
  // Prevent adding the same listener multiple times if the component is reloaded.
  if (!themeToggleBtn || themeToggleBtn.dataset.listenerAttached) {
    console.log('Toggle button not found or listener already attached. Aborting initialization.');
    return;
  }
  console.log('Toggle button found! Attaching listener.');
  themeToggleBtn.dataset.listenerAttached = 'true';

  const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
  const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

  const updateIcons = (isDark) => {
    if (themeToggleDarkIcon) themeToggleDarkIcon.classList.toggle('hidden', isDark);
    if (themeToggleLightIcon) themeToggleLightIcon.classList.toggle('hidden', !isDark);
  };

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('color-theme', isDark ? 'dark' : 'light');
      updateIcons(isDark);
    });
  }
  // Set initial icon state
  updateIcons(document.documentElement.classList.contains('dark'));
}

function initializeCopyrightYear() {
  const copyrightYear = document.getElementById('copyright-year');
  if (copyrightYear) {
    copyrightYear.textContent = new Date().getFullYear();
  }
}

// --- Main Execution Block ---

document.addEventListener('DOMContentLoaded', () => {
  // Apply theme on initial page load
  const isDarkMode = localStorage.getItem('color-theme') === 'dark' ||
    (!('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  }

  // Initialize UI elements that are present in the static HTML on load
  initializeDarkModeToggle();
  initializeCopyrightYear();

  // Listen for custom event when components are loaded dynamically
  console.log('Adding componentLoaded event listener.');
  document.addEventListener('componentLoaded', (e) => {
    console.log(`Component loaded: ${e.detail.name}`);
    if (e.detail.name === 'header') {
      initializeDarkModeToggle();
    }
    if (e.detail.name === 'footer') {
      initializeCopyrightYear();
    }
  });
});