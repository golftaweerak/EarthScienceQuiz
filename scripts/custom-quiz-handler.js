import { ModalHandler } from "./modal-handler.js";
import { fetchAllQuizData, getQuizProgress, categoryDetails as allCategoryDetails } from "./data-manager.js";
import { shuffleArray } from "./utils.js";


/**
 * Safely retrieves and parses the list of custom quizzes from localStorage.
 * @returns {Array} An array of custom quiz objects, or an empty array if none exist or data is corrupt.
 */
function getSavedCustomQuizzes() {
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
 * Initializes all functionality related to creating and managing custom quizzes.
 */
export function initializeCustomQuizHandler() {
    // --- 1. Cache Elements & Initialize Modals ---
    const customQuizModal = new ModalHandler("custom-quiz-modal");
    const customQuizHubModal = new ModalHandler("custom-quiz-hub-modal");
    const completedModal = new ModalHandler('completed-quiz-modal');
    const confirmModal = new ModalHandler("confirm-action-modal");
    const confirmModalTitle = document.getElementById("confirm-modal-title");
    const confirmModalDescription = document.getElementById("confirm-modal-description");
    const confirmActionBtn = document.getElementById("confirm-action-btn");
    const confirmCancelBtn = document.getElementById("confirm-cancel-btn");

    const createCustomQuizBtn = document.getElementById("create-custom-quiz-btn");
    const customQuizStartBtn = document.getElementById("custom-quiz-start-btn");
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
            editContainer.innerHTML = `<input type="text" value="${currentTitle}" class="w-full p-1 border border-blue-400 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500">`;
            const input = editContainer.querySelector("input");
            input.focus();
            input.select();
        } else {
            editContainer.innerHTML = "";
        }
    }

    function renderCustomQuizList() {
        const savedQuizzes = getSavedCustomQuizzes();

        noCustomQuizzesMsg.classList.toggle("hidden", savedQuizzes.length > 0);
        customQuizListContainer.innerHTML = "";

        savedQuizzes.forEach((quiz) => {
            const progress = getQuizProgress(quiz.storageKey, quiz.questions.length);
            let progressText = "";
            if (progress.isFinished) {
                progressText = `<span class="text-xs font-medium text-green-600 dark:text-green-400">ทำเสร็จแล้ว (${progress.score}/${progress.totalQuestions})</span>`;
            } else if (progress.hasProgress) {
                progressText = `<span class="text-xs font-medium text-blue-600 dark:text-blue-400">ทำต่อ (${progress.answeredCount}/${progress.totalQuestions})</span>`;
            }
            const buttonText = progress.hasProgress ? "ทำต่อ" : "เริ่มทำ";
            const quizUrl = `/quiz/index.html?id=${quiz.customId}`;

            const quizItemEl = document.createElement("div");
            quizItemEl.dataset.quizId = quiz.customId;
            quizItemEl.className = "custom-quiz-item flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600";
            quizItemEl.innerHTML = `
                <div class="flex-grow min-w-0">
                    <div data-title-display>
                        <p class="font-bold text-gray-800 dark:text-gray-100 truncate">${quiz.title}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${quiz.description}</p>
                    </div>
                    <div data-edit-container class="hidden"></div>
                    ${progressText ? `<div class="mt-1">${progressText}</div>` : ""}
                </div>
                <div class="flex-shrink-0 flex items-center gap-2">
                    <div data-view-controls class="flex items-center gap-2">
                        <a href="${quizUrl}" class="start-custom-quiz-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold transition">${buttonText}</a>
                        <button data-action="edit" aria-label="แก้ไขชื่อ" class="p-2 text-gray-500 hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-900/50 dark:hover:text-yellow-400 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg></button>
                        <button data-action="delete" aria-label="ลบแบบทดสอบ" class="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg></button>
                    </div>
                    <div data-edit-controls class="hidden flex items-center gap-2">
                        <button data-action="save" aria-label="บันทึก" class="p-2 text-gray-500 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/50 dark:hover:text-green-400 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></button>
                        <button data-action="cancel" aria-label="ยกเลิก" class="p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-200 rounded-full transition"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></button>
                    </div>
                </div>`;
            customQuizListContainer.appendChild(quizItemEl);
        });
    }

    function createCategoryControlHTML(category, displayName, iconSrc, maxCount) {
        const disabled = maxCount === 0;
        const finalIconSrc = iconSrc || '/assets/icons/study.png';
        return `
            <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 ${disabled ? "opacity-50" : ""}">
                <label for="count-slider-${category}" class="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-3 ${disabled ? "cursor-not-allowed" : ""}">
                    <div class="flex-shrink-0 h-8 w-8 rounded-full bg-white dark:bg-gray-200 flex items-center justify-center p-1">
                        <img src="${finalIconSrc}" alt="ไอคอน${displayName}" class="h-full w-full object-contain">
                    </div>
                    <span>${displayName}: <span data-value-display="${category}" class="font-sarabun text-blue-600 dark:text-blue-400">0</span> / <span class="font-sarabun">${maxCount}</span> ข้อ</span>
                </label>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-2">
                    <input data-slider="${category}" id="count-slider-${category}" type="range" min="0" max="${maxCount}" value="0" class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" ${disabled ? "disabled" : ""}>
                    <input data-input="${category}" id="count-input-${category}" type="number" min="0" max="${maxCount}" value="0" class="w-full sm:w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-center text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500" ${disabled ? "disabled" : ""}>
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
        document.querySelectorAll('#custom-quiz-category-selection input[type="range"], #custom-quiz-category-selection input[type="number"]').forEach(el => {
            el.addEventListener('input', (e) => {
                const category = e.target.dataset.slider || e.target.dataset.input;
                const value = e.target.value;
                const slider = document.querySelector(`[data-slider="${category}"]`);
                const input = document.querySelector(`[data-input="${category}"]`);
                const display = document.querySelector(`[data-value-display="${category}"]`);

                if (e.target.type === 'number') {
                    const max = parseInt(e.target.max, 10);
                    if (parseInt(value) > max) e.target.value = max;
                }

                const finalValue = e.target.value === "" ? 0 : e.target.value;
                if (slider) slider.value = finalValue;
                if (input) input.value = finalValue;
                if (display) display.textContent = finalValue;

                updateTotalCount();
            });
        });
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
            const { byCategory, allQuestions } = await fetchAllQuizData();

            // Define which sub-categories are available for custom quizzes
            const customQuizCategories = ['Astronomy', 'Geology', 'Meteorology'];

            let categoryHTML = customQuizCategories.map(categoryKey => {
                const details = allCategoryDetails[categoryKey];
                const maxCount = byCategory[categoryKey]?.length || 0;
                return createCategoryControlHTML(categoryKey, details.displayName, details.icon, maxCount);
            }).join('');

            // Handle the 'General' category separately, which draws from all questions
            const generalDetails = allCategoryDetails['General'];
            const generalMaxCount = allQuestions.length;
            categoryHTML += createCategoryControlHTML('General', generalDetails.displayName, generalDetails.icon, generalMaxCount);

            if (categorySelectionContainer) {
                categorySelectionContainer.innerHTML = categoryHTML;
                setupCustomQuizInputListeners();
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
            counts[input.dataset.input] = parseInt(input.value, 10) || 0;
        });

        const timerMode = document.querySelector('input[name="custom-timer-mode"]:checked')?.value || "none";

        const { byCategory, allQuestions } = await fetchAllQuizData();
        let selectedQuestions = [];

        Object.keys(counts).forEach(category => {
            const count = counts[category];
            if (count > 0) {
                const source = (category === 'General') ? allQuestions : (byCategory[category] || []);
                selectedQuestions.push(...shuffleArray([...source]).slice(0, count));
            }
        });

        // Remove duplicates if a question exists in both a specific category and 'General'
        selectedQuestions = Array.from(new Set(selectedQuestions.map(q => JSON.stringify(q)))).map(s => JSON.parse(s));

        if (selectedQuestions.length === 0) {
            // Optionally, show an error message
            return;
        }

        const timestamp = Date.now();
        const customQuiz = {
            customId: `custom_${timestamp}`,
            storageKey: `quizState-custom_${timestamp}`,
            title: `แบบทดสอบแบบกำหนดเอง (${new Date(timestamp).toLocaleString('th-TH')})`,
            description: `แบบทดสอบที่สร้างขึ้นโดยมี ${selectedQuestions.length} ข้อ`,
            questions: selectedQuestions,
            timerMode: timerMode,
        };

        const savedQuizzes = getSavedCustomQuizzes();
        savedQuizzes.unshift(customQuiz); // Add new quiz to the top
        localStorage.setItem("customQuizzesList", JSON.stringify(savedQuizzes));
        window.location.href = `/quiz/index.html?id=${customQuiz.customId}`;
        
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
}