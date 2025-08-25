import { ModalHandler } from "./modal-handler.js";
import { fetchAllQuizData, getQuizProgress, categoryDetails as allCategoryDetails } from "./data-manager.js";
import { shuffleArray } from "./utils.js";


/**
 * Safely retrieves and parses the list of custom quizzes from localStorage.
 * @returns {Array} An array of custom quiz objects, or an empty array if none exist or data is corrupt.
 */
export function getSavedCustomQuizzes() {
    const savedQuizzesJSON = localStorage.getItem("customQuizzesList");
    if (!savedQuizzesJSON) return [];
    try {
        const parsed = JSON.parse(savedQuizzesJSON);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not parse customQuizzesList from localStorage. The data might be corrupted.", error);
        
        // Attempt to back up the corrupted data for recovery.
        try {
            const backupKey = `customQuizzesList_corrupted_backup_${Date.now()}`;
            localStorage.setItem(backupKey, savedQuizzesJSON);
            console.warn(`Backed up corrupted quiz list to localStorage with key: ${backupKey}`);
        } catch (backupError) {
            console.error("Failed to back up corrupted quiz list.", backupError);
        }
        
        // Remove the corrupted item to prevent future errors.
        localStorage.removeItem("customQuizzesList");
        return [];
    }
}
/**
 * Creates the HTML for a general category control block (icon, title, slider, quick-select buttons).
 * This is used for the "All" category and as the header for main category accordions.
 * @param {string} category - The category key (e.g., 'General', 'Geology').
 * @param {string} displayName - The display name for the category.
 * @param {string} iconSrc - The path to the icon.
 * @param {number} maxCount - The total number of questions available.
 * @param {boolean} [isMainCategory=false] - Flag to determine if this is for an accordion header.
 * @returns {string} The HTML string for the control block.
 */
function createGeneralCategoryControlHTML(category, displayName, iconSrc, maxCount, isMainCategory = false) {
    const disabled = maxCount === 0;
    const finalIconSrc = iconSrc || './assets/icons/study.png';
    const dataAttr = isMainCategory ? 'data-main-input' : 'data-input';
    const sliderDataAttr = isMainCategory ? 'data-main-slider' : 'data-slider';

    // Helper to generate quick-select buttons
    const createQuickSelectButton = (value, text) => {
        if (maxCount < value) return ''; // Don't show button if max is less than the value
        return `<button type="button" data-quick-select="${category}" data-value="${value}" class="px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">${text || value}</button>`;
    };

    return `
        <div class="transition-all duration-300 ${disabled ? "opacity-50" : ""}">
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="flex-shrink-0 h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-1.5 shadow-sm">
                        <img src="${finalIconSrc}" alt="ไอคอน${displayName}" class="h-full w-full object-contain">
                    </div>
                    <div class="min-w-0">
                        <label for="count-slider-${category}" class="block font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">${displayName}</label>
                        <span class="block text-sm text-gray-500 dark:text-gray-400">(${category})</span>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">มีทั้งหมด ${maxCount} ข้อ</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <input ${dataAttr}="${category}" id="count-input-${category}" type="number" min="0" max="${maxCount}" value="0" class="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-center font-bold text-base text-blue-600 dark:text-blue-400 focus:ring-blue-500 focus:border-blue-500" ${disabled ? "disabled" : ""}>
                </div>
            </div>

            <div class="mt-3 space-y-3 ${disabled ? 'pointer-events-none' : ''}">
                <input ${sliderDataAttr}="${category}" id="count-slider-${category}" type="range" min="0" max="${maxCount}" value="0" class="w-full h-2 rounded-lg appearance-none cursor-pointer">
                <div class="flex flex-wrap items-center justify-end gap-2">
                    <span class="text-xs font-medium text-gray-500 dark:text-gray-400 mr-2">เลือกด่วน:</span>
                    ${createQuickSelectButton(5)}
                    ${createQuickSelectButton(10)}
                    ${createQuickSelectButton(15)}
                    ${createQuickSelectButton(20)}
                    ${createQuickSelectButton(25)}
                    ${createQuickSelectButton(30)}
                    ${createQuickSelectButton(50)}
                    ${createQuickSelectButton(maxCount, 'ทั้งหมด')}
                    <button type="button" data-quick-select="${category}" data-value="0" class="px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-full hover:bg-red-200 dark:hover:bg-red-900 transition-colors">ล้าง</button>
                </div>
            </div>
        </div>`;
}
/**
 * Initializes all functionality related to creating and managing custom quizzes.
 */
export function initializeCustomQuizHandler() {    
    /**
     * Injects CSS into the document's head to style scrollbars for a modern look.
     * This function ensures the styles are only added once.
     */
    function injectModernScrollbarStyles() {
        if (document.getElementById('modern-scrollbar-styles')) return;

        const style = document.createElement('style');
        style.id = 'modern-scrollbar-styles';
        // These styles target elements with the .modern-scrollbar class.
        // They are compatible with Webkit (Chrome, Safari, Edge) and Firefox.
        // The colors are chosen to match the existing Tailwind CSS theme.
        style.textContent = `
            .modern-scrollbar::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }
            .modern-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .modern-scrollbar::-webkit-scrollbar-thumb {
                background-color: #d1d5db; /* Tailwind gray-300 */
                border-radius: 20px;
                border: 2px solid transparent;
                background-clip: content-box;
            }
            .modern-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #9ca3af; /* Tailwind gray-400 */
            }
            .dark .modern-scrollbar::-webkit-scrollbar-thumb {
                background-color: #4b5563; /* Tailwind gray-600 */
            }
            .dark .modern-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #374151; /* Tailwind gray-700 */
            }
            .modern-scrollbar {
                scrollbar-width: thin;
                scrollbar-color: #d1d5db transparent; /* thumb track */
            }
            .dark .modern-scrollbar {
                scrollbar-color: #4b5563 transparent; /* thumb track */
            }

            /* Animation for quiz cards appearing in the hub */
            @keyframes card-appear {
                from {
                    opacity: 0;
                    transform: translateY(20px) scale(0.98);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            .quiz-card-appear {
                animation: card-appear 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                opacity: 0; /* Start transparent, animation will make it visible */
            }

            /* Modal Animation Styles */
            .modal {
                transition: opacity 0.3s ease-in-out;
            }
            .modal:not(.is-open) {
                opacity: 0;
                pointer-events: none;
            }
            .modal.is-open {
                opacity: 1;
            }
            .modal .modal-content {
                opacity: 0;
                transform: scale(0.95) translateY(1rem);
                transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
            }
            .modal.is-open .modal-content {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        `;
        document.head.appendChild(style);
    }
    let quizDataCache = null; // Cache for fetched quiz data

    // --- 1. Cache Elements & Initialize Modals ---
    const customQuizModal = new ModalHandler("custom-quiz-modal");
    const customQuizHubModal = new ModalHandler("custom-quiz-hub-modal");
    const completedModal = new ModalHandler('completed-quiz-modal');
    const confirmModal = new ModalHandler("confirm-action-modal");
    const confirmModalTitle = document.getElementById("confirm-modal-title");
    const confirmModalDescription = document.getElementById("confirm-modal-description");
    const confirmActionBtn = document.getElementById("confirm-action-btn");
    const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
    const confirmModalEl = document.getElementById("confirm-action-modal");

    const createCustomQuizBtn = document.getElementById("create-custom-quiz-btn");
    const customQuizStartBtn = document.getElementById("custom-quiz-start-btn");
    const customQuizClearBtn = document.getElementById("custom-quiz-clear-btn");
    const categorySelectionContainer = document.getElementById("custom-quiz-category-selection");
    const totalQuestionCountDisplay = document.getElementById("total-question-count");
    const openCreateQuizModalBtn = document.getElementById("open-create-quiz-modal-btn");
    const customQuizListContainer = document.getElementById("custom-quiz-list-container");
    const noCustomQuizzesMsg = document.getElementById("no-custom-quizzes-msg");
    const viewResultsBtn = document.getElementById('completed-view-results-btn');
    const startOverBtn = document.getElementById('completed-start-over-btn');

    // Create and inject the loader for the custom quiz list
    let listLoader = null;
    if (customQuizListContainer) {
        listLoader = document.createElement('div');
        listLoader.id = 'custom-quiz-list-loader';
        listLoader.className = 'hidden w-full py-10 flex flex-col items-center justify-center text-center';
        listLoader.innerHTML = `
            <svg class="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">กำลังโหลดรายการแบบทดสอบ...</p>
        `;
        customQuizListContainer.parentNode.insertBefore(listLoader, customQuizListContainer);
    }

    // --- State Management ---
    let activeQuizUrl = '';
    let activeStorageKey = '';
    let onConfirmAction = null;

    /**
     * Manages focus trapping within a modal to improve accessibility.
     * - Sets initial focus on the first focusable element.
     * - Traps Tab and Shift+Tab navigation within the modal.
     * - Allows closing the modal with the Escape key.
     */
    const focusTrap = {
        activeTrapElement: null,
        closeCallback: null,

        activate(modalElement, closeCallback) {
            if (this.activeTrapElement) this.deactivate(); // Deactivate any existing trap

            this.activeTrapElement = modalElement;
            this.closeCallback = closeCallback;

            this.handleKeyDown = this.handleKeyDown.bind(this);
            document.addEventListener('keydown', this.handleKeyDown, true); // Use capture phase

            // Defer focusing to allow for modal transitions and rendering.
            setTimeout(() => {
                if (!this.activeTrapElement) return;
                const focusableElements = this.getFocusableElements(this.activeTrapElement);
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            }, 100);
        },

        deactivate() {
            if (!this.activeTrapElement) return;
            document.removeEventListener('keydown', this.handleKeyDown, true);
            this.activeTrapElement = null;
            this.closeCallback = null;
        },

        handleKeyDown(e) {
            if (!this.activeTrapElement) return;

            // If Escape key is pressed, call the close callback.
            if (e.key === 'Escape') {
                e.stopPropagation();
                if (this.closeCallback) this.closeCallback();
                return;
            }

            // If Tab key is not pressed, do nothing.
            if (e.key !== 'Tab') return;

            const focusableElements = this.getFocusableElements(this.activeTrapElement);
            if (focusableElements.length === 0) {
                e.preventDefault(); // Prevent tabbing out if no elements are focusable
                return;
            }

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        },

        getFocusableElements(element) {
            const selector = 'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
            return Array.from(element.querySelectorAll(selector))
                .filter(el => el.offsetParent !== null); // Check for visibility
        }
    };

    /**
     * Sets up a MutationObserver to automatically manage the focus trap for a given modal.
     * @param {ModalHandler} modalHandler The modal handler instance.
     */
    function setupFocusTrapForModal(modalHandler) {
        if (!modalHandler || !modalHandler.modal) return;
        const modalElement = modalHandler.modal;

        const observer = new MutationObserver(() => {
            const isHidden = modalElement.classList.contains('hidden') || modalElement.getAttribute('aria-hidden') === 'true';
            isHidden ? focusTrap.activeTrapElement === modalElement && focusTrap.deactivate() : focusTrap.activate(modalElement, () => modalHandler.close());
        });

        observer.observe(modalElement, { attributes: true, attributeFilter: ['class', 'aria-hidden'] });
    }

    // Inject the custom scrollbar styles and apply the class to the modal bodies.
    // This is a dynamic way to achieve the styling without modifying CSS/HTML files directly.
    injectModernScrollbarStyles();
    try {
        // We assume the scrollable container within the modal has a class like 'overflow-y-auto'.
        // This is a common pattern with Tailwind CSS modal components.
        document.querySelectorAll('#custom-quiz-modal .overflow-y-auto, #custom-quiz-hub-modal .overflow-y-auto')
            .forEach(el => el.classList.add('modern-scrollbar'));
    } catch (error) {
        console.error("Could not apply modern scrollbar class to modals:", error);
    }

    // Automatically apply focus trap logic to all modals managed by ModalHandler.
    [customQuizModal, customQuizHubModal, completedModal, confirmModal].forEach(setupFocusTrapForModal);

    /**
     * Updates a range slider's track to show a fill color up to the current value.
     * This provides a better visual feedback than the default browser styling.
     * @param {HTMLInputElement} slider The range input element to update.
     */
    function updateSliderTrack(slider) {
        if (!slider) return;
        const min = +slider.min || 0;
        const max = +slider.max || 100;
        const value = +slider.value || 0;
        // Calculate the percentage of the fill
        const percentage = max > min ? ((value - min) / (max - min)) * 100 : 0;

        // Define colors for light and dark mode from the Tailwind palette.
        const trackColorLight = '#e5e7eb'; // Corresponds to gray-200
        const fillColorLight = '#3b82f6';   // Corresponds to blue-500
        const trackColorDark = '#4b5563';  // Corresponds to gray-600
        const fillColorDark = '#60a5fa';   // Corresponds to blue-400

        const isDarkMode = document.documentElement.classList.contains('dark');
        const trackColor = isDarkMode ? trackColorDark : trackColorLight;
        const fillColor = isDarkMode ? fillColorDark : fillColorLight;

        slider.style.background = `linear-gradient(to right, ${fillColor} ${percentage}%, ${trackColor} ${percentage}%)`;
    }

    if (!createCustomQuizBtn || !customQuizModal.modal || !customQuizHubModal.modal) {
        return; // Exit if essential elements are missing
    }

    // --- 2. Core Logic Functions ---

    function deleteCustomQuiz(customId) {
        let savedQuizzes = getSavedCustomQuizzes();
        const quizToDelete = savedQuizzes.find((q) => q.customId === customId);
        if (quizToDelete?.storageKey) {
            localStorage.removeItem(quizToDelete.storageKey);
        }
        const updatedQuizzes = savedQuizzes.filter((q) => q.customId !== customId);
        localStorage.setItem("customQuizzesList", JSON.stringify(updatedQuizzes));
        renderCustomQuizList();
    }

    function updateCustomQuizTitle(customId, newTitle) {
        let savedQuizzes = getSavedCustomQuizzes();
        const quizIndex = savedQuizzes.findIndex((q) => q.customId === customId);
        if (quizIndex > -1) {
            savedQuizzes[quizIndex].title = newTitle.trim();
            localStorage.setItem("customQuizzesList", JSON.stringify(savedQuizzes));
        }
    }

    function toggleEditMode(quizItemEl, isEditing) {
        const titleDisplay = quizItemEl.querySelector("[data-title-display]");
        const editContainer = quizItemEl.querySelector("[data-edit-container]");
        const viewControls = quizItemEl.querySelector("[data-view-controls]");
        const editControls = quizItemEl.querySelector("[data-edit-controls]");
        if (!titleDisplay || !editContainer || !viewControls || !editControls) return;

        const shouldBeEditing = isEditing === undefined ? editContainer.classList.contains("hidden") : isEditing;

        titleDisplay.classList.toggle("hidden", shouldBeEditing);
        editContainer.classList.toggle("hidden", !shouldBeEditing);
        viewControls.classList.toggle("hidden", shouldBeEditing);
        editControls.classList.toggle("hidden", !shouldBeEditing);

        if (shouldBeEditing) {
            const currentTitle = titleDisplay.querySelector("p.font-bold").textContent;
            // Create and inject the input field for editing the title, using consistent styling
            editContainer.innerHTML = `<input type="text" value="${currentTitle}" class="w-full p-2 border border-gray-300 dark:border-gray-800 rounded-md bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">`;
            const input = editContainer.querySelector("input");
            input.focus();
            input.select();
        } else {
            editContainer.innerHTML = "";
        }
    }

    /**
     * Creates a user-friendly string for the quiz's timer settings.
     * @param {string} timerMode - The timer mode ('none', 'overall', 'perQuestion').
     * @param {number} customTime - The time value in seconds.
     * @returns {string} A descriptive string.
     */
    function getTimerDescription(timerMode, customTime) {
        if (timerMode === 'none' || !timerMode) {
            return 'ไม่จับเวลา';
        }
        if (timerMode === 'overall') {
            const minutes = Math.floor(customTime / 60);
            return `จับเวลารวม ${minutes} นาที`;
        }
        if (timerMode === 'perQuestion') {
            return `จับเวลาข้อละ ${customTime} วินาที`;
        }
        return 'ไม่ระบุ';
    }

    /**
     * Creates the HTML for the progress bar section of a custom quiz card.
     * @param {object} progress - The progress object from getQuizProgress.
     * @returns {string} The HTML string for the progress section, or an empty string if no progress.
     */
    function createCustomQuizProgressHTML(progress) {
        if (!progress.hasProgress) return '';

        const progressText = progress.isFinished 
            ? `ทำเสร็จแล้ว (${progress.score}/${progress.totalQuestions})` 
            : `ทำต่อ (${progress.answeredCount}/${progress.totalQuestions})`;
        
        const progressBarColor = progress.isFinished ? 'bg-green-500' : 'bg-blue-500';

        return `
            <div>
                <div class="flex justify-between items-center text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    <span>${progressText}</span>
                    <span>${progress.percentage}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div class="${progressBarColor} h-2 rounded-full" style="width: ${progress.percentage}%"></div>
                </div>
            </div>
        `;
    }

    function renderCustomQuizList() {
        const savedQuizzes = getSavedCustomQuizzes();

        // Sort quizzes by creation date (newest first)
        savedQuizzes.sort((a, b) => {
            const timestampA = parseInt((a.customId || 'custom_0').split('_')[1], 10) || 0;
            const timestampB = parseInt((b.customId || 'custom_0').split('_')[1], 10) || 0;
            return timestampB - timestampA;
        });


        // Ensure the container is a grid for proper alignment and equal-height cards.
        if (customQuizListContainer) {
            customQuizListContainer.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6";
        }

        noCustomQuizzesMsg.classList.toggle("hidden", savedQuizzes.length > 0);
        customQuizListContainer.innerHTML = "";

        savedQuizzes.forEach((quiz, index) => {
            const totalQuestions = quiz.questions.length;
            const progress = getQuizProgress(quiz.storageKey, totalQuestions);
            const buttonText = progress.hasProgress ? "ทำต่อ" : "เริ่มทำ";
            const quizUrl = `./quiz/index.html?id=${quiz.customId}`;

            const timerDescription = getTimerDescription(quiz.timerMode, quiz.customTime);
            const timestamp = parseInt(quiz.customId.split('_')[1], 10);
            const creationDate = !isNaN(timestamp) 
                ? new Date(timestamp).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric' })
                : 'ไม่ระบุวันที่';
            
            const detailsHtml = `
                <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div class="flex items-start" title="หมวดหมู่">
                        <svg class="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
                        <span class="truncate">${quiz.categoryDisplay || 'ทั่วไป'}</span>
                    </div>
                    <div class="flex items-center" title="รูปแบบการจับเวลา">
                        <svg class="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>${timerDescription}</span>
                    </div>
                    <div class="flex items-center" title="จำนวนคำถามทั้งหมด">
                        <svg class="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        <span>${totalQuestions} ข้อ</span>
                    </div>
                    <div class="flex items-center" title="วันที่สร้าง">
                        <svg class="h-3.5 w-3.5 mr-1.5 flex-shrink-0 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span>${creationDate}</span>
                    </div>
                </div>
                ${quiz.description ? `<p class="mt-2 text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2">"${quiz.description}"</p>` : ''}
            `;

            let footerHtml;
            if (progress.hasProgress) {
                const progressHtml = createCustomQuizProgressHTML(progress);
                footerHtml = `
                <div class="mt-auto pt-4 flex items-center gap-4">
                    <a href="${quizUrl}" class="start-custom-quiz-btn flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold transition shadow-sm hover:shadow-md">${buttonText}</a>
                    <div class="flex-grow min-w-0">
                        ${progressHtml}
                    </div>
                </div>`;
            } else {
                footerHtml = `
                <div class="mt-auto pt-4">
                    <a href="${quizUrl}" class="start-custom-quiz-btn w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold transition shadow-sm hover:shadow-md">${buttonText}</a>
                </div>`;
            }

            const quizItemEl = document.createElement("div");
            quizItemEl.dataset.quizId = quiz.customId;
            // Add the animation class and a staggered delay for a nice effect.
            quizItemEl.className = "custom-quiz-item flex flex-col h-full min-h-72 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 quiz-card-appear";
            quizItemEl.style.animationDelay = `${index * 75}ms`;
            
            const iconUrl = quiz.icon || './assets/icons/dices.png';
            const iconAlt = quiz.altText || 'ไอคอนแบบทดสอบที่สร้างเอง';

            quizItemEl.innerHTML = `
                <div class="flex-grow">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-2">
                            <img src="${iconUrl}" alt="${iconAlt}" class="h-full w-full object-contain">
                        </div>
                        <div class="flex-grow min-w-0">
                            <div data-title-display class="flex justify-between items-start gap-2">
                                <div class="flex-grow min-w-0">
                                    <p class="font-bold text-gray-800 dark:text-gray-100 truncate">${quiz.title}</p>
                                </div>
                                <div data-view-controls class="flex items-center gap-1 flex-shrink-0">
                                    <button data-action="edit" aria-label="แก้ไขชื่อ" class="p-2 text-gray-500 hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-900/50 dark:hover:text-yellow-400 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                                    <button data-action="delete" aria-label="ลบแบบทดสอบ" class="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                                </div>
                            </div>
                            <div data-edit-controls class="hidden flex items-center gap-2 mt-1">
                                 <button data-action="save" aria-label="บันทึก" class="p-2 text-gray-500 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/50 dark:hover:text-green-400 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></button>
                                 <button data-action="cancel" aria-label="ยกเลิก" class="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-200 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>
                            </div>
                            <div data-edit-container class="hidden mt-1"></div>
                            ${detailsHtml}
                        </div>
                    </div>
                </div>
                ${footerHtml}
            `;
            customQuizListContainer.appendChild(quizItemEl);
        });

        // Hide the loader after the list has been rendered.
        if (listLoader) listLoader.classList.add('hidden');
    }

    /**
     * Creates the HTML for a single specific sub-category control (label, input, slider).
     * @param {string} mainCategory - The parent category key (e.g., 'Geology').
     * @param {string} specificCategory - The specific sub-category name.
     * @param {number} maxCount - The number of questions available in this specific sub-category.
     * @returns {string} The HTML string for the control.
     */
    function createSpecificCategoryControlHTML(mainCategory, specificCategory, maxCount) {
        const disabled = maxCount === 0;
        // Create a safe ID for HTML elements by removing special characters.
        const uniqueId = `${mainCategory}-${specificCategory}`.replace(/[^a-zA-Z0-9-_]/g, '');
        // Create a data attribute value that's easy to parse later.
        const dataId = `${mainCategory}__SEP__${specificCategory}`;

        return `
            <div class="specific-category-control pl-4 py-3 border-t border-gray-200 dark:border-gray-700/50 ${disabled ? 'opacity-50 pointer-events-none' : ''}">
                <div class="flex items-center justify-between gap-4">
                    <div class="min-w-0">
                        <label for="count-slider-${uniqueId}" class="font-medium text-gray-700 dark:text-gray-200 text-sm">${specificCategory}</label>
                        <p class="text-xs text-gray-500 dark:text-gray-400">มี ${maxCount} ข้อ</p>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <input data-input="${dataId}" id="count-input-${uniqueId}" type="number" min="0" max="${maxCount}" value="0" class="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-center font-semibold text-blue-600 dark:text-blue-400 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                </div>
                <div class="mt-3">
                    <input data-slider="${dataId}" id="count-slider-${uniqueId}" type="range" min="0" max="${maxCount}" value="0" class="w-full h-2 rounded-lg appearance-none cursor-pointer" ${disabled ? "disabled" : ""}>
                </div>
            </div>`;
    }

    /**
     * Creates the HTML for a main category accordion, containing all its specific sub-category controls.
     * @param {string} mainCategory - The key of the main category.
     * @param {object} specificData - The nested object of specific categories and their questions.
     * @param {string} iconSrc - The path to the icon for this category.
     * @returns {string} The HTML string for the accordion section.
     */
    function createMainCategoryAccordionHTML(mainCategory, specificData, iconSrc) {
        const totalQuestionsInMainCategory = Object.values(specificData).reduce((sum, questions) => sum + (questions?.length || 0), 0);
        const finalIconSrc = iconSrc || './assets/icons/study.png';
        const mainCategoryDetails = allCategoryDetails[mainCategory] || { displayName: mainCategory };

        const specificControlsHTML = Object.entries(specificData)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, 'th-TH-u-nu-thai')) // Sort specific categories alphabetically
            .map(([specificCategory, questions]) => createSpecificCategoryControlHTML(mainCategory, specificCategory, questions.length))
            .join('');

        return `
            <div class="custom-quiz-control-group bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700" data-main-category-group="${mainCategory}">
                <div class="p-4">
                ${createGeneralCategoryControlHTML(mainCategory, mainCategoryDetails.displayName, finalIconSrc, totalQuestionsInMainCategory, true)}
                </div>
                ${specificControlsHTML ? `
                <div class="main-category-toggle flex items-center justify-between gap-4 px-4 py-2 cursor-pointer bg-gray-50 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-3 min-w-0">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">หรือเลือกตามหัวข้อย่อย...</span>
                    </div>
                    <svg class="chevron-icon h-5 w-5 text-gray-400 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div class="specific-categories-container grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out">
                    <div class="overflow-hidden">
                        ${specificControlsHTML}
                    </div>
                </div>
                ` : ''}
            </div>`;
    }

    function updateTotalCount() {
        let total = 0;
        document.querySelectorAll('#custom-quiz-category-selection input[type="number"]').forEach(input => {
            total += parseInt(input.value, 10) || 0;
        });
        if (totalQuestionCountDisplay) totalQuestionCountDisplay.textContent = total;
    }

    /**
     * Resets the value of a number input and its corresponding range slider to 0.
     * @param {HTMLInputElement} input The number input element.
     * @param {HTMLInputElement} slider The range slider element.
     */
    function resetControl(input, slider) {
        if (input && input.value !== '0') input.value = 0;
        if (slider && slider.value !== '0') {
            slider.value = 0;
            updateSliderTrack(slider);
        }
    }

    /**
     * Handles the mutual exclusion logic when a user interacts with a category control.
     * @param {HTMLElement} target The element that triggered the event.
     * @param {HTMLElement} container The main container for all category controls.
     */
    function handleMutualExclusion(target, container) {
        const generalInput = container.querySelector('[data-input="General"]');
        const generalSlider = container.querySelector('[data-slider="General"]');

        // Case 1: User interacts with a Main or Specific category.
        if (target.matches('[data-main-input], [data-main-slider], [data-input*="__SEP__"]')) {
            resetControl(generalInput, generalSlider);

            // If it's a Main category, reset its specific sub-categories.
            if (target.matches('[data-main-input], [data-main-slider]')) {
                const mainCategory = target.dataset.mainInput || target.dataset.mainSlider;
                const group = container.querySelector(`[data-main-category-group="${mainCategory}"]`);
                if (group) {
                    group.querySelectorAll(`[data-input^="${mainCategory}__SEP__"]`).forEach(specificInput => {
                        const specificSlider = group.querySelector(`[data-slider="${specificInput.dataset.input}"]`);
                        resetControl(specificInput, specificSlider);
                    });
                }
            }
            // If it's a Specific sub-category, reset its Main category.
            else if (target.matches('[data-input*="__SEP__"]')) {
                const dataId = target.dataset.input || target.dataset.slider;
                if (dataId) {
                    const mainCategory = dataId.split('__SEP__')[0];
                    const mainInput = container.querySelector(`[data-main-input="${mainCategory}"]`);
                    const mainSlider = container.querySelector(`[data-main-slider="${mainCategory}"]`);
                    resetControl(mainInput, mainSlider);
                }
            }
        }
        // Case 2: User interacts with the "General" category.
        else if (target.matches('[data-input="General"], [data-slider="General"]')) {
            // Reset all other categories.
            container.querySelectorAll('input[type="number"]').forEach(input => {
                if (input !== generalInput) resetControl(input, container.querySelector(`[data-slider="${input.dataset.input}"], [data-main-slider="${input.dataset.mainInput}"]`));
            });
        }
    }

    function setupCustomQuizInputListeners() {
        const container = document.getElementById('custom-quiz-category-selection');
        if (!container) return;

        // Initialize all sliders with the correct track fill on load
        container.querySelectorAll('input[type="range"]').forEach(updateSliderTrack);

        // Use event delegation for better performance
        container.addEventListener('input', (e) => {
            const target = e.target;

            // Handle mutual exclusion first
            handleMutualExclusion(target, container);

            // Then, handle the value synchronization for the interacted control
            if (target.matches('input[type="range"]') || target.matches('input[type="number"]')) {
                const dataId = target.dataset.slider || target.dataset.input || target.dataset.mainSlider || target.dataset.mainInput;
                let value = target.value;
                const slider = document.querySelector(`[data-slider="${dataId}"], [data-main-slider="${dataId}"]`);
                const input = document.querySelector(`[data-input="${dataId}"], [data-main-input="${dataId}"]`);

                // Clamp value for number inputs
                if (target.type === 'number') {
                    const max = parseInt(target.max, 10);
                    const currentValue = parseInt(value, 10);
                    if (currentValue > max) {
                        value = max;
                        target.value = max;
                    }
                }

                const finalValue = value === "" ? 0 : value;
                if (slider) slider.value = finalValue;
                if (input) input.value = finalValue;

                // Update the visual track of the slider
                if (slider) updateSliderTrack(slider);

                updateTotalCount();
            }
        });

        container.addEventListener('click', (e) => {
            const target = e.target;

            // Handle quick select buttons
            if (target.matches('button[data-quick-select]')) {
                const category = target.dataset.quickSelect;
                const value = target.dataset.value;
                const slider = document.querySelector(`[data-slider="${category}"], [data-main-slider="${category}"]`);
                const input = document.querySelector(`[data-input="${category}"], [data-main-input="${category}"]`);

                if (slider) slider.value = value;
                if (input) input.value = value;

                // After setting the value, trigger the same exclusion logic and update the slider track
                handleMutualExclusion(input || slider, container);
                if (slider) updateSliderTrack(slider);
                updateTotalCount();
            }

            // Handle accordion toggling
            const toggle = target.closest('.main-category-toggle');
            if (toggle) {
                const content = toggle.nextElementSibling;
                const icon = toggle.querySelector('.chevron-icon');
                const isOpen = content.classList.contains('grid-rows-[1fr]');
                content.classList.toggle('grid-rows-[1fr]', !isOpen);
                content.classList.toggle('grid-rows-[0fr]', isOpen);
                icon.classList.toggle('rotate-180', !isOpen);
            }
        });

        // Add listeners for timer mode radio buttons to show/hide custom time inputs
        const timerRadios = document.querySelectorAll('input[name="custom-timer-mode"]');
        const overallTimeInputContainer = document.getElementById('overall-time-input-container');
        const perQuestionTimeInputContainer = document.getElementById('per-question-time-input-container');

        function handleTimerModeChange() {
            const selectedMode = document.querySelector('input[name="custom-timer-mode"]:checked').value;
            if (overallTimeInputContainer) {
                overallTimeInputContainer.classList.toggle('hidden', selectedMode !== 'overall');
            }
            if (perQuestionTimeInputContainer) {
                perQuestionTimeInputContainer.classList.toggle('hidden', selectedMode !== 'perQuestion');
            }
        }

        timerRadios.forEach(radio => {
            radio.addEventListener('change', handleTimerModeChange);
        });

        // Set initial visibility based on the default checked radio
        handleTimerModeChange();
    }

    // --- 3. Event Listeners Setup ---

    // Main button on the index page to open the custom quiz hub
    createCustomQuizBtn.addEventListener("click", (e) => {
        // Show loader and clear previous content immediately
        if (listLoader) listLoader.classList.remove('hidden');
        if (customQuizListContainer) customQuizListContainer.innerHTML = '';
        if (noCustomQuizzesMsg) noCustomQuizzesMsg.classList.add('hidden');

        customQuizHubModal.open(e.currentTarget);

        // Use a small timeout to ensure the loader is rendered before the synchronous,
        // potentially blocking renderCustomQuizList() call. This improves UX.
        setTimeout(() => {
            renderCustomQuizList();
        }, 50);
    });

    // Button inside the hub to open the creation modal
    openCreateQuizModalBtn.addEventListener("click", async (e) => {
        const originalText = openCreateQuizModalBtn.innerHTML;
        openCreateQuizModalBtn.innerHTML = `
            <svg class="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            กำลังโหลดข้อมูล...`;
        openCreateQuizModalBtn.disabled = true;

        try {
            if (!quizDataCache) {
                quizDataCache = await fetchAllQuizData(); // Fetch and cache the data only if it's not already loaded
            }

            // Re-process all questions to build a reliable `byCategory` map.
            // This ensures that both the question counts for the UI and the question selection
            // logic use a consistent data source that respects the new `subCategory` object format.
            const rebuiltByCategory = quizDataCache.allQuestions.reduce((acc, question) => {
                if (!question.subCategory) {
                    return acc;
                }

                let mainCat, specificCat;

                // Handle new format: { main: 'Geology', specific: 'Topic 1' }
                if (typeof question.subCategory === 'object' && question.subCategory.main) {
                    mainCat = question.subCategory.main;
                    specificCat = question.subCategory.specific || 'ภาพรวม';
                }
                // Handle legacy format: 'Geology'
                else if (typeof question.subCategory === 'string') {
                    mainCat = question.subCategory;
                    specificCat = 'ภาพรวม';
                }
                // If format is unhandled, skip this question
                else {
                    return acc;
                }

                // Ensure mainCat is a non-empty string before proceeding
                if (mainCat && typeof mainCat === 'string' && mainCat.trim() !== '') {
                    if (!acc[mainCat]) acc[mainCat] = {};
                    if (!acc[mainCat][specificCat]) acc[mainCat][specificCat] = [];
                    acc[mainCat][specificCat].push(question);
                }
                
                return acc;
            }, {});
            quizDataCache.byCategory = rebuiltByCategory;

            const {
                byCategory,
                allQuestions
            } = quizDataCache;

            // Sort main categories based on the order defined in data-manager.js
            const sortedMainCategories = Object.keys(byCategory).sort((a, b) => {
                const orderA = allCategoryDetails[a]?.order || 99;
                const orderB = allCategoryDetails[b]?.order || 99;
                return orderA - orderB;
            });

            // Create accordion controls for each main category and its sub-categories
            let categoryHTML = sortedMainCategories.map(mainCatKey => {
                const specificData = byCategory[mainCatKey];
                const iconSrc = allCategoryDetails[mainCatKey]?.icon;
                return createMainCategoryAccordionHTML(mainCatKey, specificData, iconSrc);
            }).join('');

            // Handle the 'General' category separately, which draws from all questions
            const generalDetails = allCategoryDetails['General'];
            if (generalDetails) {
                const generalMaxCount = allQuestions.length;
                categoryHTML += `<hr class="my-6 border-gray-300 dark:border-gray-600"><div class="p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">${createGeneralCategoryControlHTML('General', generalDetails.displayName, generalDetails.icon, generalMaxCount)}</div>`;
            }
            
            if (categorySelectionContainer) {
                categorySelectionContainer.innerHTML = categoryHTML;
                // จัดเรียงหมวดหมู่เป็น Grid เหมือนหน้า Hub
                categorySelectionContainer.className = "grid grid-cols-1 lg:grid-cols-2 gap-6";
                setupCustomQuizInputListeners(); // Re-bind listeners to new elements
                updateTotalCount(); // Reset total count display
            }

            customQuizHubModal.close();
            customQuizModal.open(e.currentTarget);

        } catch (error) {
            console.error("Failed to fetch data for custom quiz creation:", error);
            // Optionally, show an error message to the user
        } finally {
            openCreateQuizModalBtn.innerHTML = originalText;
            openCreateQuizModalBtn.disabled = false;
        }
    });

    // The final "Start" button in the creation modal
    customQuizStartBtn.addEventListener("click", async () => {
        const counts = {};
        document.querySelectorAll('#custom-quiz-category-selection input[type="number"]').forEach(input => {
            const count = parseInt(input.value, 10) || 0;
            if (count > 0) {
                // Fix: Correctly get the key from either data-input or data-main-input
                const key = input.dataset.input || input.dataset.mainInput;
                if (key) counts[key] = count; 
            }
        });

        if (!quizDataCache) {
            console.error("Quiz data has not been loaded. Cannot start quiz.");
            return;
        }

        const timerMode = document.querySelector('input[name="custom-timer-mode"]:checked')?.value || 'none';
        let customTime = null;

        if (timerMode === 'overall') {
            const minutes = document.getElementById('custom-timer-overall-minutes').value;
            customTime = parseInt(minutes, 10) * 60; // Convert minutes to seconds
        } else if (timerMode === 'perQuestion') {
            const seconds = document.getElementById('custom-timer-per-question-seconds').value;
            customTime = parseInt(seconds, 10);
        }

        const { allQuestions, byCategory, scenarios } = quizDataCache; // Use cached data
        let selectedQuestions = [];

        // Fix: Correctly select questions from General, Main, and Specific categories
        Object.entries(counts).forEach(([dataId, count]) => {
            if (count <= 0) return;

            let sourcePool = [];
            if (dataId === 'General') {
                sourcePool = allQuestions;
            } else if (dataId.includes('__SEP__')) {
                // Handle specific sub-category, e.g., "Geology__SEP__Topic 1"
                const [mainCat, specificCat] = dataId.split('__SEP__');
                if (byCategory[mainCat] && byCategory[mainCat][specificCat]) {
                    sourcePool = byCategory[mainCat][specificCat];
                }
            } else if (byCategory[dataId]) {
                // Handle main category, e.g., "Geology"
                sourcePool = Object.values(byCategory[dataId]).flat();
            }

            if (sourcePool.length > 0) {
                let chosenQuestions = shuffleArray([...sourcePool]).slice(0, count);
                // Reconstruct scenario questions if they are part of a scenario
                chosenQuestions = chosenQuestions.map(q => {
                    if (q.scenarioId && scenarios.has(q.scenarioId)) {
                        const scenario = scenarios.get(q.scenarioId);
                        const description = (scenario.description || '').replace(/\n/g, '<br>');
                        return {
                            ...q,
                            question: `<div class="p-4 mb-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg"><p class="font-bold text-lg">${scenario.title}</p><div class="mt-2 text-gray-700 dark:text-gray-300">${description}</div></div>${q.question}`,
                        };
                    }
                    return q;
                });
                selectedQuestions.push(...chosenQuestions);
            }
        });

        // Remove duplicates if a question exists in both a specific category and 'General'
        selectedQuestions = Array.from(new Set(selectedQuestions.map(q => JSON.stringify(q)))).map(s => JSON.parse(s));

        if (selectedQuestions.length === 0) {
            return;
        }

        // Fix: Create a user-friendly, summarized description by grouping counts by main category.
        const descriptionParts = Object.entries(counts).reduce((acc, [key, count]) => {
            const mainCategoryKey = key.split('__SEP__')[0]; // "Geology__SEP__Topic 1" -> "Geology"
            const details = allCategoryDetails[mainCategoryKey];
            const title = details?.displayName || mainCategoryKey;
            acc[title] = (acc[title] || 0) + count;
            return acc;
        }, {});

        const detailedDescription = Object.entries(descriptionParts).map(([title, count]) => {
            return `${title}: ${count} ข้อ`;
        }).join(' | ');

        const timestamp = Date.now();
        const customQuiz = {
            customId: `custom_${timestamp}`,
            storageKey: `quizState-custom_${timestamp}`,
            title: `แบบทดสอบ (${new Date(timestamp).toLocaleString('th-TH')})`,
            description: detailedDescription,
            questions: selectedQuestions,
            timerMode: timerMode,
            customTime: customTime, // Add custom time to the quiz object
            icon: "./assets/icons/dices.png", // Add a default icon
        };

        const savedQuizzes = getSavedCustomQuizzes();
        savedQuizzes.unshift(customQuiz); // Add new quiz to the top
        localStorage.setItem("customQuizzesList", JSON.stringify(savedQuizzes));
        window.location.href = `./quiz/index.html?id=${customQuiz.customId}`;
        
    });

    // Event delegation for the list of custom quizzes (edit, delete, etc.)
    if (customQuizListContainer) {
        customQuizListContainer.addEventListener("click", (event) => {
            const target = event.target;
            const quizItemEl = target.closest(".custom-quiz-item");
            if (!quizItemEl) return;

            const customId = quizItemEl.dataset.quizId;

            // Case 1: Clicked on an action button (edit, delete, save, cancel)
            const actionButton = target.closest("button[data-action]");
            if (actionButton) {
                event.stopPropagation(); // Prevent other events like link navigation
                const action = actionButton.dataset.action;

                switch (action) {
                    case "delete": {
                        // Use the styled confirmation modal instead of the native browser confirm.
                        if (confirmModalTitle) confirmModalTitle.textContent = 'ยืนยันการลบแบบทดสอบ';
                        if (confirmModalDescription) confirmModalDescription.textContent = 'คุณแน่ใจหรือไม่ว่าต้องการลบแบบทดสอบนี้? ข้อมูลความคืบหน้าทั้งหมดที่เกี่ยวข้องจะถูกลบไปด้วยและไม่สามารถย้อนกลับได้';
                        
                        onConfirmAction = () => deleteCustomQuiz(customId);
                        // Use inline style for z-index to ensure it's applied over other modals.
                        if (confirmModalEl) confirmModalEl.style.zIndex = '99';

                        confirmModal.open(actionButton);
                        break;
                    }
                    case "edit":
                        toggleEditMode(quizItemEl, true);
                        break;
                    case "cancel":
                        toggleEditMode(quizItemEl, false);
                        break;
                    case "save": {
                        const input = quizItemEl.querySelector("input[type='text']");
                        if (input && input.value.trim()) {
                            const newTitle = input.value.trim();
                            updateCustomQuizTitle(customId, newTitle);
                            const titleDisplayP = quizItemEl.querySelector("[data-title-display] p.font-bold");
                            if (titleDisplayP) titleDisplayP.textContent = newTitle;
                            toggleEditMode(quizItemEl, false);
                        }
                        break;
                    }
                }
                return; // Action handled, no need to proceed.
            }

            // Case 2: Clicked on the start/continue link
            const startLink = target.closest("a.start-custom-quiz-btn");
            if (startLink) {
                const savedQuizzes = getSavedCustomQuizzes();
                const quiz = savedQuizzes.find(q => q.customId === customId);
                if (!quiz) return;

                const progress = getQuizProgress(quiz.storageKey, quiz.questions.length);

                if (progress.isFinished) {
                    event.preventDefault();
                    activeQuizUrl = startLink.href;
                    activeStorageKey = quiz.storageKey;
                    completedModal.open(startLink);
                }
                // If not finished, the default 'a' tag behavior will handle navigation.
            }
        });
    }

    // Listener for the "Clear All" button
    if (customQuizClearBtn) {
        customQuizClearBtn.addEventListener('click', () => {
            const inputs = document.querySelectorAll('#custom-quiz-category-selection input[type="number"]');
            const sliders = document.querySelectorAll('#custom-quiz-category-selection input[type="range"]');
            inputs.forEach(input => { input.value = 0; });
            sliders.forEach(slider => {
                slider.value = 0;
                updateSliderTrack(slider);
            });
            updateTotalCount();
        });
    }

    // --- Completed Quiz Modal Button Listeners ---
    if (viewResultsBtn) {
        viewResultsBtn.addEventListener('click', () => {
            if (activeQuizUrl) {
                const separator = activeQuizUrl.includes('?') ? '&' : '?';
                window.location.href = `${activeQuizUrl}${separator}action=view_results`;
            }
            completedModal.close();
        });
    }
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            if (activeStorageKey) localStorage.removeItem(activeStorageKey);
            if (activeQuizUrl) window.location.href = activeQuizUrl;
            completedModal.close();
        });
    }

    // --- Confirmation Modal Action Listener ---
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', () => {
            if (typeof onConfirmAction === 'function') {
                onConfirmAction();
            }
            onConfirmAction = null; // Reset after use
            confirmModal.close();
        });
    }
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => {
            onConfirmAction = null; // Clear action if user cancels
        });
    }

    // Robustly handle z-index for the confirmation modal.
    // This ensures it appears above the hub modal, even when closed via backdrop/ESC.
    if (confirmModalEl) {
        const observer = new MutationObserver(() => {
            // When the modal is hidden (closed), remove the inline z-index.
            if (confirmModalEl.classList.contains('hidden')) {
                confirmModalEl.style.zIndex = '';
            }
        });
        observer.observe(confirmModalEl, { attributes: true, attributeFilter: ['class'] });
    }
}