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
    } catch (e) {
        console.error("Could not parse customQuizzesList from localStorage:", e);
        // Optionally, clear the corrupted data: localStorage.removeItem("customQuizzesList");
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
        return `<button type="button" data-quick-select="${category}" data-value="${value}" class="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors">${text || value}</button>`;
    };

    return `
        <div class="transition-all duration-300 ${disabled ? "opacity-50" : ""}">
            <div class="flex items-center justify-between gap-4">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-1.5 shadow-sm">
                        <img src="${finalIconSrc}" alt="ไอคอน${displayName}" class="h-full w-full object-contain">
                    </div>
                    <div>
                        <label for="count-slider-${category}" class="font-bold text-gray-800 dark:text-gray-200 truncate">${displayName}</label>
                        <p class="text-sm text-gray-500 dark:text-gray-400">มีทั้งหมด ${maxCount} ข้อ</p>
                    </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                    <input ${dataAttr}="${category}" id="count-input-${category}" type="number" min="0" max="${maxCount}" value="0" class="w-20 p-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-center font-bold text-lg text-blue-600 dark:text-blue-400 focus:ring-blue-500 focus:border-blue-500" ${disabled ? "disabled" : ""}>
                </div>
            </div>

            <div class="mt-4 space-y-3 ${disabled ? 'pointer-events-none' : ''}">
                <input ${sliderDataAttr}="${category}" id="count-slider-${category}" type="range" min="0" max="${maxCount}" value="0" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-blue-600 dark:accent-blue-500">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="text-xs font-medium text-gray-500 dark:text-gray-400">เลือกด่วน:</span>
                    ${createQuickSelectButton(10)}
                    ${createQuickSelectButton(25)}
                    ${createQuickSelectButton(50)}
                    ${createQuickSelectButton(maxCount, 'ทั้งหมด')}
                    <button type="button" data-quick-select="${category}" data-value="0" class="px-3 py-1 text-xs font-semibold text-red-800 bg-red-100 dark:text-red-200 dark:bg-red-900/50 rounded-full hover:bg-red-200 dark:hover:bg-red-900 transition-colors">ล้าง</button>
                </div>
            </div>
        </div>`;
}
/**
 * Initializes all functionality related to creating and managing custom quizzes.
 */
export function initializeCustomQuizHandler() {
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
    const customQuizListContainer = document.getElementById("custom-quiz-list");
    const noCustomQuizzesMsg = document.getElementById("no-custom-quizzes-msg");
    const viewResultsBtn = document.getElementById('completed-view-results-btn');
    const startOverBtn = document.getElementById('completed-start-over-btn');

    let activeQuizUrl = '';
    let activeStorageKey = '';
    let onConfirmAction = null;

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

        // Ensure the container is a grid for proper alignment and equal-height cards.
        if (customQuizListContainer) {
            customQuizListContainer.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
        }

        noCustomQuizzesMsg.classList.toggle("hidden", savedQuizzes.length > 0);
        customQuizListContainer.innerHTML = "";

        savedQuizzes.forEach((quiz) => {
            const progress = getQuizProgress(quiz.storageKey, quiz.questions.length);            
            const buttonText = progress.hasProgress ? "ทำต่อ" : "เริ่มทำ";
            const quizUrl = `./quiz/index.html?id=${quiz.customId}`;

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
            quizItemEl.className = "custom-quiz-item flex flex-col h-full p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors duration-200";
            
            const iconUrl = quiz.icon || './assets/icons/dices.png';
            const iconAlt = quiz.altText || 'ไอคอนแบบทดสอบที่สร้างเอง';

            quizItemEl.innerHTML = `
                <div class="flex-grow">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-2">
                            <img src="${iconUrl}" alt="${iconAlt}" class="h-full w-full object-contain">
                        </div>
                        <div class="flex-grow min-w-0">
                            <div data-title-display class="flex justify-between items-start">
                                <p class="font-bold text-gray-800 dark:text-gray-100 truncate pr-2">${quiz.title}</p>
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
                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">${quiz.description}</p>
                        </div>
                    </div>
                </div>
                ${footerHtml}
            `;
            customQuizListContainer.appendChild(quizItemEl);
        });
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
                    <input data-slider="${dataId}" id="count-slider-${uniqueId}" type="range" min="0" max="${maxCount}" value="0" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-blue-600 dark:accent-blue-500" ${disabled ? "disabled" : ""}>
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
        const disabled = totalQuestionsInMainCategory === 0;

        const specificControlsHTML = Object.entries(specificData)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB, 'th-TH-u-nu-thai')) // Sort specific categories alphabetically
            .map(([specificCategory, questions]) => createSpecificCategoryControlHTML(mainCategory, specificCategory, questions.length))
            .join('');

        return `
            <div class="custom-quiz-control-group bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" data-main-category-group="${mainCategory}">
                <div class="p-4">
                ${createGeneralCategoryControlHTML(mainCategory, mainCategoryDetails.displayName, finalIconSrc, totalQuestionsInMainCategory, true)}
                </div>
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
            </div>`;
    }

    function updateTotalCount() {
        let total = 0;
        document.querySelectorAll('#custom-quiz-category-selection input[type="number"]').forEach(input => {
            total += parseInt(input.value, 10) || 0;
        });
        if (totalQuestionCountDisplay) totalQuestionCountDisplay.textContent = total;
    }

    function setupCustomQuizInputListeners() {
        const container = document.getElementById('custom-quiz-category-selection');
        if (!container) return;

        const allInputs = Array.from(container.querySelectorAll('input[type="number"]'));
        const allSliders = Array.from(container.querySelectorAll('input[type="range"]'));
        const generalInput = container.querySelector('[data-input="General"]');
        const generalSlider = container.querySelector('[data-slider="General"]');
        const categoryInputs = allInputs.filter(el => el !== generalInput);
        const categorySliders = allSliders.filter(el => el !== generalSlider);

        // Use event delegation for better performance
        container.addEventListener('input', (e) => {
            const target = e.target;

            // --- Mutual Exclusion Logic ---
            if (target.matches('[data-main-input], [data-main-slider], [data-input*="__SEP__"]')) {
                // User is adjusting a specific or main category. Reset "General".
                if (generalInput && generalInput.value !== '0') generalInput.value = 0;
                if (generalSlider && generalSlider.value !== '0') generalSlider.value = 0;

                if (target.matches('[data-main-input], [data-main-slider]')) {
                    // User is adjusting a MAIN category control. Reset its specific sub-categories.
                    const mainCategory = target.dataset.mainInput || target.dataset.mainSlider;
                    const group = container.querySelector(`[data-main-category-group="${mainCategory}"]`);
                    if (group) {
                        group.querySelectorAll(`[data-input^="${mainCategory}__SEP__"]`).forEach(input => {
                            const specificSlider = group.querySelector(`[data-slider="${input.dataset.input}"]`);
                            if (input.value !== '0') input.value = 0;
                            if (specificSlider && specificSlider.value !== '0') specificSlider.value = 0;
                        });
                    }
                } else if (target.matches('[data-input*="__SEP__"]')) {
                    // User is adjusting a SPECIFIC sub-category control. Reset its main category.
                    const dataId = target.dataset.input;
                    if (dataId) {
                        const mainCategory = dataId.split('__SEP__')[0];
                        const mainInput = container.querySelector(`[data-main-input="${mainCategory}"]`);
                        const mainSlider = container.querySelector(`[data-main-slider="${mainCategory}"]`);
                        if (mainInput && mainInput.value !== '0') mainInput.value = 0;
                        if (mainSlider && mainSlider.value !== '0') mainSlider.value = 0;
                    }
                }
            } else if (target.matches('[data-input="General"], [data-slider="General"]')) {
                // User is adjusting "General". Reset all other categories.
                categoryInputs.forEach(input => { if (input.value !== '0') input.value = 0; });
                categorySliders.forEach(slider => { if (slider.value !== '0') slider.value = 0; });
            }

            if (target.matches('input[type="range"]') || target.matches('input[type="number"]')) {
                const dataId = target.dataset.slider || target.dataset.input || target.dataset.mainSlider || target.dataset.mainInput;
                let value = target.value;
                const slider = document.querySelector(`[data-slider="${dataId}"], [data-main-slider="${dataId}"]`);
                const input = document.querySelector(`[data-input="${dataId}"], [data-main-input="${dataId}"]`);

                if (target.type === 'number') {
                    const max = parseInt(target.max, 10);
                    if (parseInt(value, 10) > max) {
                        value = max;
                        target.value = max;
                    }
                }

                const finalValue = value === "" ? 0 : value;
                if (slider) slider.value = finalValue;
                if (input) input.value = finalValue;

                updateTotalCount();
            }
        });

        container.addEventListener('click', (e) => {
            const target = e.target;
            // Handle quick select buttons (only for general category now)
            if (target.matches('button[data-quick-select]')) {
                const category = target.dataset.quickSelect;
                const value = target.dataset.value;
                const slider = document.querySelector(`[data-slider="${category}"], [data-main-slider="${category}"]`);
                const input = document.querySelector(`[data-input="${category}"], [data-main-input="${category}"]`);
                if (slider) slider.value = value;
                if (input) input.value = value;

                // Trigger mutual exclusion logic after quick select
                if (category === 'General') {
                    categoryInputs.forEach(inp => { if (inp.value !== '0') inp.value = 0; });
                    categorySliders.forEach(sl => { if (sl.value !== '0') sl.value = 0; });
                } else {
                    if (generalInput && generalInput.value !== '0') generalInput.value = 0;
                    if (generalSlider && generalSlider.value !== '0') generalSlider.value = 0;
                    // If it's a main category quick select, also reset its sub-categories
                    const group = container.querySelector(`[data-main-category-group="${category}"]`);
                    if (group) {
                        group.querySelectorAll(`[data-input^="${category}__SEP__"]`).forEach(specificInput => {
                            const specificSlider = group.querySelector(`[data-slider="${specificInput.dataset.input}"]`);
                            if (specificInput.value !== '0') specificInput.value = 0;
                            if (specificSlider && specificSlider.value !== '0') specificSlider.value = 0;
                        });
                    }
                }
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
        renderCustomQuizList();
        customQuizHubModal.open(e.currentTarget);
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
            const { byCategory, allQuestions } = quizDataCache;

            let categoryHTML = Object.keys(allCategoryDetails)
                .filter(key => ['Geology', 'Meteorology', 'Astronomy'].includes(key))
                .map(key => {
                    const details = allCategoryDetails[key];
                    const maxCount = byCategory[key] ? Object.values(byCategory[key]).flat().length : 0;
                    return createGeneralCategoryControlHTML(key, details.displayName, details.icon, maxCount);
                }).join('');

            // Handle the 'General' category separately, which draws from all questions
            const generalDetails = allCategoryDetails['General']; // This is the key for the "All" category
            if (generalDetails) {
                const generalMaxCount = allQuestions.length;
                categoryHTML += createGeneralCategoryControlHTML('General', generalDetails.displayName, generalDetails.icon, generalMaxCount);
            } else {
                console.warn('Details for "General" category not found. Skipping.');
            }
            
            if (categorySelectionContainer) {
                categorySelectionContainer.innerHTML = categoryHTML;
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
                const key = input.dataset.input;
                if (key) counts[key] = count;
            }
        });

        if (!quizDataCache) {
            console.error("Quiz data has not been loaded. Cannot start quiz.");
            // Optionally, show an error to the user.
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

        Object.entries(counts).forEach(([dataId, count]) => {
            if (count <= 0) return;

            let sourcePool = [];
            if (dataId === 'General') {
                sourcePool = allQuestions;
            } else if (byCategory[dataId]) {
                sourcePool = Object.values(byCategory[dataId]).flat();
            }

            if (sourcePool.length > 0) {
                let chosenQuestions = shuffleArray([...sourcePool]).slice(0, count);
                // Reconstruct scenario questions for ALL chosen questions.
                chosenQuestions = chosenQuestions.map(q => {
                    // If the question has a scenarioId, it means it was part of a scenario.
                    if (q.scenarioId && scenarios.has(q.scenarioId)) {
                        const scenario = scenarios.get(q.scenarioId);
                        const description = (scenario.description || '').replace(/\n/g, '<br>');
                        // Re-create the full question text with the scenario context.
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
            // Optionally, show an error message
            return;
        }

        // Create a summarized description by grouping counts by main category.
        const descriptionParts = Object.entries(counts).map(([key, count]) => {
            const details = allCategoryDetails[key];
            const title = details?.displayName || details?.title || key;
            return `${title}: ${count} ข้อ`;
        });

        const detailedDescription = descriptionParts.join(' | ');

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
            sliders.forEach(slider => { slider.value = 0; });
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