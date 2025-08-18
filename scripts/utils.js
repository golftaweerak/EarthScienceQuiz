/**
 * A collection of shared utility functions for the Quiz App.
 * These functions are made globally accessible via the `window.AppUtils` object.
 */
(function() {
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
     * Hides a modal with consistent animations.
     * @param {HTMLElement} modalElement The modal element to hide.
     * @param {Function} [onHiddenCallback] Optional callback to run after the hide animation completes.
     */
    hideModal(modalElement, onHiddenCallback) {
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
  };

  // Make functions globally accessible under a namespace to avoid polluting the global scope.
  window.AppUtils = AppUtils;
})();