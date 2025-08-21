import { subCategoryData } from '../data/sub-category-data.js';
import { categoryDetails } from './data-manager.js';
import { quizzesList } from '../data/quizzes-list.js';

document.addEventListener('DOMContentLoaded', () => {
    let questions = []; // State for added questions
    let editingIndex = null; // State to track which question is being edited
    const STORAGE_KEY = 'quizGeneratorState'; // Key for localStorage
    let history = [];
    let historyIndex = -1;
 
    // --- UI Elements ---
    const quizIdInput = document.getElementById('quiz-id');
    const quizTitleInput = document.getElementById('quiz-title');
    const categorySelect = document.getElementById('quiz-category');
    const quizIdValidationEl = document.getElementById('quiz-id-validation');
    const subCategorySelect = document.getElementById('question-subcategory');

    // Question form elements
    const questionFormToggle = document.getElementById('question-form-toggle');
    const questionFormContent = document.getElementById('question-form-content');
    const questionFormChevron = document.getElementById('question-form-chevron');
    const questionForm = document.getElementById('question-form');
    const questionTextInput = document.getElementById('question-text');
    const optionAInput = document.getElementById('option-a');
    const optionBInput = document.getElementById('option-b');
    const optionCInput = document.getElementById('option-c');
    const optionDInput = document.getElementById('option-d');
    const correctAnswerSelect = document.getElementById('correct-answer');
    const explanationInput = document.getElementById('question-explanation');
    const addQuestionBtn = document.getElementById('add-question-btn');

    // List and count elements
    const addedQuestionsList = document.getElementById('added-questions-list');
    const addedQuestionsCount = document.getElementById('added-questions-count');

    // Generate button and output elements
    const generateBtn = document.getElementById('generate-btn');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const outputDataEl = document.getElementById('output-data');
    const outputListEl = document.getElementById('output-list');

    // AI Generation elements
    const aiGenerateBtn = document.getElementById('ai-generate-btn');
    const geminiApiKeyInput = document.getElementById('gemini-api-key');
    const aiTopicInput = document.getElementById('ai-topic');
    const aiNumQuestionsInput = document.getElementById('ai-num-questions');
    const aiSubCategorySelect = document.getElementById('ai-subcategory');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    // Preview Modal elements
    const previewModal = document.getElementById('preview-modal');
    const previewModalContent = document.getElementById('preview-modal-content');
    const previewModalCloseBtn = document.getElementById('preview-modal-close');

    // Notification Modal elements
    const notificationModal = document.getElementById('notification-modal');
    const notificationModalTitle = document.getElementById('notification-modal-title');
    const notificationModalBody = document.getElementById('notification-modal-body');
    const notificationModalFooter = document.getElementById('notification-modal-footer');
    const notificationModalCloseBtn = document.getElementById('notification-modal-close');
    let confirmCallback = null; // To store the callback for confirm modals

    /**
     * Initializes the generator page.
     */
    function initialize() {
        // Populate the main category dropdown first, so loaded values can be set.
        populateMainCategories();

        // Load any saved state from localStorage.
        loadState();
        saveHistoryState(); // Save the initial state (either loaded or empty)

        // Add event listeners
        quizIdInput.addEventListener('input', () => {
            validateQuizId();
            saveState();
        });
        quizTitleInput.addEventListener('input', saveState);
        categorySelect.addEventListener('change', () => {
            handleCategoryChange();
            saveState();
        });
        addQuestionBtn.addEventListener('click', handleAddOrUpdateQuestionClick);
        generateBtn.addEventListener('click', handleGenerateClick);
        clearFormBtn.addEventListener('click', handleClearFormClick);
        questionFormToggle.addEventListener('click', handleToggleForm);
        addedQuestionsList.addEventListener('click', handleListActions);
        aiGenerateBtn.addEventListener('click', handleAiGenerateClick);
        undoBtn.addEventListener('click', handleUndo);
        redoBtn.addEventListener('click', handleRedo);
        previewModalCloseBtn.addEventListener('click', closePreviewModal);
        notificationModalCloseBtn.addEventListener('click', closeNotificationModal);

        previewModal.addEventListener('click', (event) => {
            // Close if clicking on the background overlay
            if (event.target === previewModal) {
                closePreviewModal();
            }
        });
        document.addEventListener('keydown', handleKeyDown);

        notificationModalFooter.addEventListener('click', (event) => {
            const target = event.target;
            if (target.id === 'notification-ok-btn' || target.id === 'notification-cancel-btn') {
                closeNotificationModal();
            } else if (target.id === 'notification-confirm-btn') {
                if (typeof confirmCallback === 'function') {
                    confirmCallback();
                }
                closeNotificationModal();
            }
        });
        initializeSortable();
    }

    /**
     * Populates the main category dropdown with relevant options.
     */
    function populateMainCategories() {
        const mainCategories = ['Astronomy', 'EarthScience', 'AstronomyReview'];
        let optionsHtml = '<option value="">-- เลือกหมวดหมู่หลัก --</option>';
        
        mainCategories.forEach(key => {
            if (categoryDetails[key]) {
                optionsHtml += `<option value="${key}">${categoryDetails[key].title}</option>`;
            }
        });
        categorySelect.innerHTML = optionsHtml;
    }

    /**
     * Handles the change event of the main category select.
     * It populates the sub-category dropdown based on the selection.
     */
    function handleCategoryChange() {
        const selectedCategory = categorySelect.value;
        populateSubCategories(selectedCategory);
        populateAiSubCategories(selectedCategory);
    }

    /**
     * Populates the sub-category dropdown based on the chosen main category.
     * @param {string} mainCategory - The key of the selected main category (e.g., 'EarthScience').
     */
    function populateSubCategories(mainCategory) {
        subCategorySelect.innerHTML = ''; // Clear existing options
        subCategorySelect.disabled = true;
        if (!mainCategory) {
            subCategorySelect.innerHTML = '<option>กรุณาเลือก Main Category ก่อน</option>';
            return;
        }

        let optionsHtml = '<option value="">-- เลือกหมวดหมู่ย่อย --</option>';

        if (mainCategory === 'EarthScience') {
            // Create optgroups for Geology, Meteorology, etc.
            for (const [groupName, topics] of Object.entries(subCategoryData.EarthAndSpace)) {
                optionsHtml += `<optgroup label="${groupName}">`;
                topics.forEach(topic => {
                    // The value format helps us parse it back later
                    const value = `${groupName}::${topic}`;
                    optionsHtml += `<option value="${value}">${topic}</option>`;
                });
                optionsHtml += `</optgroup>`;
            }
        } else if (mainCategory === 'Astronomy' || mainCategory === 'AstronomyReview') {
            // For Astronomy and Review, we use the same structured list.
            // The generator can decide how to handle the 'level' property.
            subCategoryData.Astronomy.forEach(item => {
                // The value is the topic string itself.
                optionsHtml += `<option value="${item.topic}">${item.topic} (${item.level})</option>`;
            });
        }
        
        subCategorySelect.innerHTML = optionsHtml;
        subCategorySelect.disabled = false;
    }

    /**
     * Populates the AI sub-category dropdown based on the chosen main category.
     * @param {string} mainCategory - The key of the selected main category.
     */
    function populateAiSubCategories(mainCategory) {
        aiSubCategorySelect.innerHTML = getSubCategoryOptionsHtml(mainCategory);
        aiSubCategorySelect.disabled = !mainCategory;
    }

    /**
     * Generates the HTML options for sub-category dropdowns.
     * @param {string} mainCategory - The key of the selected main category.
     * @returns {string} The HTML string for the options.
     */
    function getSubCategoryOptionsHtml(mainCategory) {
        if (!mainCategory) {
            return '<option>กรุณาเลือก Main Category ก่อน</option>';
        }

        let optionsHtml = '<option value="">-- เลือกหมวดหมู่ย่อย --</option>';

        if (mainCategory === 'EarthScience') {
            for (const [groupName, topics] of Object.entries(subCategoryData.EarthAndSpace)) {
                optionsHtml += `<optgroup label="${groupName}">`;
                topics.forEach(topic => {
                    const value = `${groupName}::${topic}`;
                    optionsHtml += `<option value="${value}">${topic}</option>`;
                });
                optionsHtml += `</optgroup>`;
            }
        } else if (mainCategory === 'Astronomy' || mainCategory === 'AstronomyReview') {
            subCategoryData.Astronomy.forEach(item => {
                optionsHtml += `<option value="${item.topic}">${item.topic} (${item.level})</option>`;
            });
        }
        return optionsHtml;
    }

    /**
     * Validates the Quiz ID for format and uniqueness.
     * Provides real-time feedback to the user.
     * @returns {boolean} True if the ID is valid, false otherwise.
     */
    function validateQuizId() {
        const quizId = quizIdInput.value.trim();
        quizIdValidationEl.textContent = '';
        quizIdInput.classList.remove('border-red-500', 'border-green-500', 'dark:border-red-500', 'dark:border-green-500');

        if (!quizId) {
            return false;
        }

        const idFormatRegex = /^[a-z0-9-]+$/;
        if (!idFormatRegex.test(quizId)) {
            quizIdValidationEl.textContent = 'ID ต้องเป็น a-z, 0-9, และขีดกลาง (-) เท่านั้น';
            quizIdValidationEl.classList.add('text-red-500');
            quizIdInput.classList.add('border-red-500', 'dark:border-red-500');
            return false;
        }

        const isDuplicate = quizzesList.some(quiz => quiz.id === quizId);
        if (isDuplicate) {
            quizIdValidationEl.textContent = 'ID นี้มีอยู่แล้วในระบบ';
            quizIdValidationEl.classList.add('text-red-500');
            quizIdInput.classList.add('border-red-500', 'dark:border-red-500');
            return false;
        }

        quizIdValidationEl.textContent = 'ID นี้สามารถใช้งานได้';
        quizIdValidationEl.classList.add('text-green-500');
        quizIdInput.classList.add('border-green-500', 'dark:border-green-500');
        return true;
    }
    /**
     * Renders the list of questions that have been added to the state.
     */
    function renderAddedQuestions() {
        addedQuestionsCount.textContent = questions.length;
        if (questions.length === 0) {
            addedQuestionsList.innerHTML = '<p class="text-gray-500">ยังไม่มีคำถามที่เพิ่ม</p>';
            return;
        }

        addedQuestionsList.innerHTML = questions.map((q, index) => {
            const optionsHtml = Object.entries(q.options).map(([key, value]) => `
                <li class="flex items-start">
                    <span class="font-bold mr-2">${key}.</span>
                    <div class="option-text-container flex-grow" data-question-index="${index}" data-option-key="${key}"></div>
                </li>
            `).join('');

            return `
            <div class="question-item p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                <div class="drag-handle cursor-move text-gray-400 hover:text-gray-600 p-2 self-start" title="ลากเพื่อจัดลำดับ">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zM4 10a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1z" clip-rule="evenodd" transform="rotate(90 10 10)" /></svg>
                </div>
                <div class="flex-grow min-w-0 break-words pr-2">
                    <div class="font-semibold question-text-container" data-question-index="${index}"></div>
                    <ul class="list-none pl-0 mt-2 space-y-1 text-sm">
                        ${optionsHtml}
                    </ul>
                    <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p class="text-sm text-gray-500 dark:text-gray-400">หมวดหมู่ย่อย: ${q.subCategory}</p>
                        <p class="text-sm text-green-600 dark:text-green-400">คำตอบ: ${q.answer}</p>
                    </div>
                    ${q.explanation ? `
                    <div class="mt-2">
                        <button class="js-toggle-explanation-btn text-sm text-blue-600 dark:text-blue-400 hover:underline" data-index="${index}">แสดงคำอธิบาย</button>
                        <div class="explanation-content hidden mt-2 p-3 border-t border-gray-200 dark:border-gray-600 text-sm bg-gray-100 dark:bg-gray-800 rounded-b-md">
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="flex-shrink-0 flex flex-col sm:flex-row gap-2">
                    <button class="js-edit-btn px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition" data-index="${index}">แก้ไข</button>
                    <button class="js-duplicate-btn px-3 py-1 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 transition" data-index="${index}">คัดลอก</button>
                    <button class="js-preview-btn px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition" data-index="${index}">ตัวอย่าง</button>
                    <button class="js-delete-btn px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition" data-index="${index}">ลบ</button>
                </div>
            </div>
        `}).join('');

        // After setting innerHTML, find all containers and render them with Markdown and LaTeX
        // Render Questions
        addedQuestionsList.querySelectorAll('.question-text-container').forEach(container => {
            const index = parseInt(container.dataset.questionIndex, 10);
            if (!isNaN(index) && questions[index]) {
                // Prepend the question number. The markdown parser should handle the space after the number correctly.
                const questionText = `${index + 1}. ${questions[index].question}`;
                renderMarkdownAndLaTeX(container, questionText);
            }
        });

        // Render Options
        addedQuestionsList.querySelectorAll('.option-text-container').forEach(container => {
            const index = parseInt(container.dataset.questionIndex, 10);
            const key = container.dataset.optionKey;
            if (!isNaN(index) && key && questions[index] && questions[index].options[key]) {
                const optionText = questions[index].options[key];
                renderMarkdownAndLaTeX(container, optionText);
            }
        });
    }

    /**
     * Handles clicks on the edit and delete buttons in the question list using event delegation.
     * @param {Event} event The click event.
     */
    function handleListActions(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const index = parseInt(button.dataset.index, 10);
        if (isNaN(index)) return;

        if (button.classList.contains('js-edit-btn')) {
            handleEditClick(index);
        } else if (button.classList.contains('js-delete-btn')) {
            handleDeleteClick(index);
        } else if (button.classList.contains('js-toggle-explanation-btn')) {
            toggleExplanation(button, index);
        } else if (button.classList.contains('js-preview-btn')) {
            handlePreviewClick(index);
        } else if (button.classList.contains('js-duplicate-btn')) {
            handleDuplicateClick(index);
        }
    }

    /**
     * Populates the form with data from the question to be edited.
     * @param {number} index The index of the question to edit.
     */
    function handleEditClick(index) {
        editingIndex = index;
        const questionToEdit = questions[index];

        // Populate form
        questionTextInput.value = questionToEdit.question;
        optionAInput.value = questionToEdit.options.A || '';
        optionBInput.value = questionToEdit.options.B || '';
        optionCInput.value = questionToEdit.options.C || '';
        optionDInput.value = questionToEdit.options.D || '';
        correctAnswerSelect.value = questionToEdit.answer;
        subCategorySelect.value = questionToEdit.subCategory;
        explanationInput.value = questionToEdit.explanation;

        // Update UI to reflect editing state
        addQuestionBtn.textContent = 'Update Question';
        addQuestionBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        addQuestionBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');

        setFormCollapsedUI(false); // Expand the form
        saveState(); // Save the new expanded state
        questionFormToggle.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Duplicates a question and inserts it below the original.
     * @param {number} index The index of the question to duplicate.
     */
    function handleDuplicateClick(index) {
        const questionToDuplicate = questions[index];
        if (!questionToDuplicate) return;

        // Create a deep copy to avoid object reference issues
        const newQuestion = JSON.parse(JSON.stringify(questionToDuplicate));

        // Optionally modify the question text to indicate it's a copy
        newQuestion.question = `${newQuestion.question} (คัดลอก)`;

        // Insert the new question right after the original
        questions.splice(index + 1, 0, newQuestion);

        renderAddedQuestions();
        saveHistoryState();
    }

    /**
     * Deletes a question from the state.
     * @param {number} index The index of the question to delete.
     */
    function handleDeleteClick(index) {
        showNotificationModal({
            title: 'ยืนยันการลบ',
            message: `คุณแน่ใจหรือไม่ว่าต้องการลบคำถามข้อที่ ${index + 1}?`,
            type: 'confirm',
            onConfirm: () => {
                questions.splice(index, 1);
                if (editingIndex === index) {
                    resetForm();
                } else if (editingIndex !== null && index < editingIndex) {
                    editingIndex--;
                }
                renderAddedQuestions();
                saveHistoryState(); // Save state after deleting
            }
        });
    }

    /**
     * Resets the question form and editing state.
     */
    function resetForm() {
        questionForm.querySelectorAll('input[type="text"], textarea').forEach(el => el.value = '');
        editingIndex = null;
        addQuestionBtn.textContent = 'Add Question';
        addQuestionBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
        addQuestionBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
        questionTextInput.focus();
    }

    /**
     * Handles adding a new question or updating an existing one.
     */
    function handleAddOrUpdateQuestionClick() {        
        if (!validateQuestionForm()) {
            return;
        }

        const questionText = questionTextInput.value.trim();
        const options = {
            A: optionAInput.value.trim(),
            B: optionBInput.value.trim(),
            C: optionCInput.value.trim(),
            D: optionDInput.value.trim(),
        };
        const answer = correctAnswerSelect.value;
        const subCategory = subCategorySelect.value;
        const explanation = explanationInput.value.trim();
        
        const questionData = {
            question: questionText,
            options: {},
            answer: answer,
            subCategory: subCategory,
            explanation: explanation,
        };

        // Only add non-empty options
        for (const [key, value] of Object.entries(options)) {
            if (value) {
                questionData.options[key] = value;
            }
        }

        if (editingIndex !== null) {
            // Update existing question
            questions[editingIndex] = questionData;
        } else {
            // Add new question
            questions.push(questionData);
        }

        renderAddedQuestions();
        resetForm();
        saveHistoryState(); // Save state after adding/updating
    }

    /**
     * Validates the required fields in the question form.
     * @returns {boolean} True if the form is valid, false otherwise.
     */
    function validateQuestionForm() {
        const fields = {
            'คำถาม': questionTextInput.value.trim(),
            'ตัวเลือก A': optionAInput.value.trim(),
            'ตัวเลือก B': optionBInput.value.trim(),
            'หมวดหมู่ย่อย': subCategorySelect.value,
        };

        const errors = [];
        for (const [fieldName, value] of Object.entries(fields)) {
            if (!value) {
                errors.push(fieldName);
            }
        }

        if (errors.length > 0) {
            showNotificationModal({
                title: 'ข้อมูลไม่ครบถ้วน',
                message: `กรุณากรอกข้อมูลให้ครบถ้วน:<br><ul class="list-disc list-inside mt-2">${errors.map(e => `<li>${e}</li>`).join('')}</ul>`,
                type: 'alert'
            });
            return false;
        }
        return true;
    }

    /**
     * Generates the final code snippets for the quiz data and list files.
     */
    function handleGenerateClick() {
        const isIdValid = validateQuizId();
        const quizTitle = quizTitleInput.value.trim();
        const quizCategory = categorySelect.value;

        if (!isIdValid || !quizTitle || !quizCategory) {
            showNotificationModal({
                title: 'ข้อมูลไม่ครบถ้วน',
                message: 'กรุณากรอก Quiz ID, Quiz Title, และเลือก Main Category ให้ถูกต้อง',
                type: 'alert'
            });
            return;
        }

        if (questions.length === 0) {
            showNotificationModal({ title: 'ไม่มีคำถาม', message: 'กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ', type: 'alert' });
            return;
        }

        // 1. Generate code for the data file (`[id]-data.js`)
        const quizId = quizIdInput.value.trim();
        const dataFileContent = `export const quizData = ${JSON.stringify({ id: quizId, title: quizTitle, category: quizCategory, questions }, null, 2)};`;
        outputDataEl.textContent = dataFileContent;

        // 2. Generate code for the list file (`quizzes-list.js`)
        const categoryInfo = categoryDetails[quizCategory] || {};
        const listEntry = { id: quizId, title: quizTitle, category: quizCategory, url: `./quiz/index.html?id=${quizId}`, icon: categoryInfo.icon || './assets/icons/study.png', altText: categoryInfo.altText || `ไอคอน${quizTitle}` };
        const listFileContent = `// เพิ่ม object นี้เข้าไปใน array ของ quizzesList\n${JSON.stringify(listEntry, null, 2)},`;
        outputListEl.textContent = listFileContent;

        // Ask to clear state after successful generation
        showNotificationModal({
            title: 'สร้างไฟล์สำเร็จ',
            message: 'สร้างไฟล์สำเร็จแล้ว! คุณต้องการล้างข้อมูลในฟอร์มทั้งหมดหรือไม่?',
            type: 'confirm',
            confirmButtonClass: 'bg-blue-600 hover:bg-blue-700',
            onConfirm: () => {
                resetGeneratorState();
            }
        });
    }

    /**
     * Handles the click event for the "Clear All Data" button.
     */
    function handleClearFormClick() {
        showNotificationModal({
            title: 'ยืนยันการล้างข้อมูล',
            message: 'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลในฟอร์มทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้',
            type: 'confirm',
            onConfirm: resetGeneratorState
        });
    }

    /**
     * Resets the entire generator state, clearing forms and localStorage.
     */
    function resetGeneratorState() {
        localStorage.removeItem(STORAGE_KEY);
        questions = [];
        quizIdInput.value = '';
        quizTitleInput.value = '';
        categorySelect.value = '';
        handleCategoryChange();
        resetForm(); // This will clear the question form and reset editingIndex
        renderAddedQuestions();
        outputDataEl.textContent = '...';
        outputListEl.textContent = '...';
        
        setFormCollapsedUI(false); // Ensure the form is expanded after clearing
        
        history = [];
        historyIndex = -1;
        saveHistoryState();
        saveState(); // Also save the cleared state to localStorage
    }

    /**
     * Saves the current state of the form and questions to localStorage.
     */
    function saveState() {
        try {
            const state = {
                quizId: quizIdInput.value,
                quizTitle: quizTitleInput.value,
                quizCategory: categorySelect.value,
                questions: questions,
                isFormCollapsed: questionFormContent.classList.contains('grid-rows-[0fr]'),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Could not save state to localStorage:", e);
        }
    }

    /**
     * Loads the state from localStorage and populates the form.
     */
    function loadState() {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (!savedState) return;

        try {
            const state = JSON.parse(savedState);
            quizIdInput.value = state.quizId || '';
            quizTitleInput.value = state.quizTitle || '';
            categorySelect.value = state.quizCategory || '';
            questions = state.questions || [];

            if (categorySelect.value) {
                handleCategoryChange();
            }
            validateQuizId(); // Validate the loaded ID

            setFormCollapsedUI(state.isFormCollapsed);
            renderAddedQuestions();
        } catch (e) {
            console.error("Failed to parse saved state from localStorage:", e);
            localStorage.removeItem(STORAGE_KEY); // Clear corrupted data
        }
    }
    
    /**
     * Toggles the visibility of the question form.
     */
    function handleToggleForm() {
        const isCollapsed = questionFormContent.classList.contains('grid-rows-[0fr]');
        setFormCollapsedUI(!isCollapsed);
        saveState(); // Save the new collapsed state
    }

    /**
     * Sets the UI state of the question form accordion without saving.
     * @param {boolean} shouldBeCollapsed - True to collapse the form, false to expand it.
     */
    function setFormCollapsedUI(shouldBeCollapsed) {
        const isCurrentlyCollapsed = questionFormContent.classList.contains('grid-rows-[0fr]');
        
        if (shouldBeCollapsed === isCurrentlyCollapsed) {
            return; // No change needed
        }

        if (shouldBeCollapsed) {
            questionFormContent.classList.replace('grid-rows-[1fr]', 'grid-rows-[0fr]');
            questionFormChevron.classList.add('rotate-180');
        } else {
            questionFormContent.classList.replace('grid-rows-[0fr]', 'grid-rows-[1fr]');
            questionFormChevron.classList.remove('rotate-180');
        }
    }

    /**
     * Initializes SortableJS for drag-and-drop reordering of questions.
     */
    function initializeSortable() {
        if (typeof Sortable === 'undefined') {
            console.error("SortableJS is not loaded.");
            return;
        }
        new Sortable(addedQuestionsList, {
            handle: '.drag-handle', // Use the drag handle to move items
            animation: 150, // Animation speed
            onEnd: (evt) => {
                // Reorder the questions array based on the drag-and-drop action
                const [movedItem] = questions.splice(evt.oldIndex, 1);
                questions.splice(evt.newIndex, 0, movedItem);
                renderAddedQuestions(); // Re-render to update numbering
                saveHistoryState(); // Save the new order
            },
        });
    }

    /**
     * Opens a modal to preview the question as it would appear in the quiz.
     * @param {number} index The index of the question to preview.
     */
    function handlePreviewClick(index) {
        const q = questions[index];
        if (!q) return;

        const optionsHtml = Object.entries(q.options).map(([key, value]) => `
            <div class="flex items-start p-3 my-2 border border-gray-200 dark:border-gray-600 rounded-lg">
                <span class="font-bold mr-4">${key}.</span>
                <div class="option-preview-container flex-grow" data-option-key="${key}"></div>
            </div>
        `).join('');

        previewModalContent.innerHTML = `
            <div class="mb-6">
                <div id="preview-question" class="text-xl leading-relaxed"></div>
            </div>
            <div>
                ${optionsHtml}
            </div>
        `;

        // Render the question
        const questionContainer = previewModalContent.querySelector('#preview-question');
        renderMarkdownAndLaTeX(questionContainer, q.question);

        // Render each option
        previewModalContent.querySelectorAll('.option-preview-container').forEach(container => {
            const key = container.dataset.optionKey;
            if (key && q.options[key]) {
                renderMarkdownAndLaTeX(container, q.options[key]);
            }
        });

        previewModal.classList.remove('hidden');
        previewModal.classList.add('flex');
        // Trigger transition
        setTimeout(() => previewModal.querySelector('div').classList.remove('scale-95'), 10);
    }

    /**
     * Shows a configurable notification/confirmation modal.
     * @param {object} options - The options for the modal.
     * @param {string} options.title - The title of the modal.
     * @param {string} options.message - The message content (can be HTML).
     * @param {string} [options.type='alert'] - The type of modal ('alert' or 'confirm').
     * @param {function} [options.onConfirm] - The callback function to execute on confirmation.
     * @param {string} [options.confirmButtonClass='bg-red-600 hover:bg-red-700'] - Tailwind classes for the confirm button.
     * @param {number} [options.autoClose=0] - Time in ms to auto-close an alert modal. 0 means no auto-close.
     */
    function showNotificationModal({ title, message, type = 'alert', onConfirm = () => {}, confirmButtonClass = 'bg-red-600 hover:bg-red-700', autoClose = 0 }) {
        notificationModalTitle.textContent = title;
        notificationModalBody.innerHTML = message;

        notificationModalFooter.innerHTML = ''; // Clear previous buttons

        if (type === 'confirm') {
            confirmCallback = onConfirm;
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'notification-confirm-btn';
            confirmBtn.className = `px-4 py-2 text-white rounded-md transition ${confirmButtonClass}`;
            confirmBtn.textContent = 'ยืนยัน';

            const cancelBtn = document.createElement('button');
            cancelBtn.id = 'notification-cancel-btn';
            cancelBtn.className = 'px-4 py-2 bg-gray-300 dark:bg-gray-500 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-600 transition';
            cancelBtn.textContent = 'ยกเลิก';

            notificationModalFooter.appendChild(cancelBtn);
            notificationModalFooter.appendChild(confirmBtn);
        } else { // 'alert' type
            const okBtn = document.createElement('button');
            okBtn.id = 'notification-ok-btn';
            okBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition';
            okBtn.textContent = 'ตกลง';
            notificationModalFooter.appendChild(okBtn);
        }

        notificationModal.classList.remove('hidden');
        notificationModal.classList.add('flex');
        setTimeout(() => notificationModal.querySelector('div').classList.remove('scale-95'), 10);

        if (autoClose > 0 && type === 'alert') {
            setTimeout(() => {
                // Only close if this modal is still open
                if (notificationModalTitle.textContent === title && !notificationModal.classList.contains('hidden')) {
                    closeNotificationModal();
                }
            }, autoClose);
        }
    }

    function closeNotificationModal() {
        notificationModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => {
            notificationModal.classList.add('hidden');
            confirmCallback = null; // Clear callback
        }, 300);
    }

    function closePreviewModal() {
        previewModal.querySelector('div').classList.add('scale-95');
        setTimeout(() => previewModal.classList.add('hidden'), 300);
    }

    /**
     * Toggles the visibility of a question's explanation and renders it on first view.
     * @param {HTMLButtonElement} button The button that was clicked.
     * @param {number} index The index of the question.
     */
    function toggleExplanation(button, index) {
        const questionItem = button.closest('.question-item');
        const explanationContent = questionItem.querySelector('.explanation-content');
        if (!explanationContent) return;

        const isHidden = explanationContent.classList.contains('hidden');

        if (isHidden) {
            // Expand: Render content if it hasn't been rendered yet
            if (!explanationContent.dataset.rendered) {
                const explanationText = questions[index].explanation;
                renderMarkdownAndLaTeX(explanationContent, explanationText);
                explanationContent.dataset.rendered = 'true';
            }
            explanationContent.classList.remove('hidden');
            button.textContent = 'ซ่อนคำอธิบาย';
        } else {
            // Collapse
            explanationContent.classList.add('hidden');
            button.textContent = 'แสดงคำอธิบาย';
        }
    }

    /**
     * Renders a string containing Markdown and LaTeX into a given HTML element.
     * @param {HTMLElement} element The target element to render into.
     * @param {string} text The text to render.
     */
    function renderMarkdownAndLaTeX(element, text) {
        if (!text || typeof marked === 'undefined' || typeof renderMathInElement === 'undefined') {
            element.innerHTML = text || '';
            return;
        }
        // 1. Render Markdown
        element.innerHTML = marked.parse(text, { gfm: true, breaks: true });

        // 2. Render LaTeX using KaTeX auto-render extension
        renderMathInElement(element, {
            delimiters: [ { left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true } ],
            throwOnError: false
        });
    }

    /**
     * Updates the enabled/disabled state of the Undo and Redo buttons.
     */
    function updateUndoRedoButtons() {
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = historyIndex >= history.length - 1;
    }

    /**
     * Saves the current application state to the history stack for undo/redo.
     */
    function saveHistoryState() {
        // Deep copy of questions is important
        const currentState = {
            quizId: quizIdInput.value,
            quizTitle: quizTitleInput.value,
            quizCategory: categorySelect.value,
            questions: JSON.parse(JSON.stringify(questions)),
            isFormCollapsed: questionFormContent.classList.contains('grid-rows-[0fr]'),
        };

        // If we've undone, and then make a new change, we want to discard the old "redo" path.
        history = history.slice(0, historyIndex + 1);

        history.push(currentState);
        historyIndex++;
        updateUndoRedoButtons();
    }

    /**
     * Restores the application state from a specific point in the history.
     */
    function restoreStateFromHistory() {
        if (historyIndex < 0 || historyIndex >= history.length) return;

        const stateToRestore = history[historyIndex];

        // Restore state
        quizIdInput.value = stateToRestore.quizId;
        quizTitleInput.value = stateToRestore.quizTitle;
        categorySelect.value = stateToRestore.quizCategory;
        questions = JSON.parse(JSON.stringify(stateToRestore.questions)); // Deep copy back
        setFormCollapsedUI(stateToRestore.isFormCollapsed);

        // Update UI from restored state
        // handleCategoryChange is critical here to update both sub-category dropdowns consistently
        handleCategoryChange();
        validateQuizId();
        renderAddedQuestions();
        resetForm();
        saveState(); // Save the restored state to localStorage
    }

    function handleUndo() {
        if (historyIndex > 0) {
            historyIndex--;
            restoreStateFromHistory();
            updateUndoRedoButtons();
        }
    }

    function handleRedo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            restoreStateFromHistory();
            updateUndoRedoButtons();
        }
    }

    /**
     * Handles global keyboard shortcuts for the generator.
     * @param {KeyboardEvent} event The keyboard event.
     */
    function handleKeyDown(event) {
        const isCtrlOrCmd = event.ctrlKey || event.metaKey;
        const isTyping = ['TEXTAREA', 'INPUT', 'SELECT'].includes(document.activeElement.tagName);

        // Hotkeys that should work even when typing
        if (isCtrlOrCmd) {
            // Undo: Ctrl+Z
            if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
                event.preventDefault();
                if (!undoBtn.disabled) handleUndo();
                return;
            }

            // Redo: Ctrl+Y or Ctrl+Shift+Z
            if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
                event.preventDefault();
                if (!redoBtn.disabled) handleRedo();
                return;
            }

            // Save: Ctrl+S
            if (event.key.toLowerCase() === 's') {
                event.preventDefault();
                saveState();
                showNotificationModal({
                    title: 'บันทึกแล้ว',
                    message: 'บันทึกข้อมูลลงในเบราว์เซอร์เรียบร้อยแล้ว',
                    type: 'alert',
                    autoClose: 1500
                });
                return;
            }

            // Add Question: Ctrl+Enter
            if (event.key === 'Enter' && isTyping && document.activeElement.closest('#question-form')) {
                event.preventDefault();
                addQuestionBtn.click();
                return;
            }
        }
    }

    /**
     * Handles the click event for the "Generate with AI" button.
     */
    async function handleAiGenerateClick() {
        const apiKey = geminiApiKeyInput.value.trim();
        const topic = aiTopicInput.value.trim();
        const numQuestions = parseInt(aiNumQuestionsInput.value, 10);
        const subCategory = aiSubCategorySelect.value;
        const mainCategoryKey = categorySelect.value;
        const mainCategoryName = categoryDetails[mainCategoryKey]?.title || mainCategoryKey;

        if (!apiKey || !topic || !subCategory || !mainCategoryKey) {
            showNotificationModal({
                title: 'ข้อมูลไม่ครบถ้วน',
                message: 'กรุณากรอก API Key, หัวข้อ, และเลือกหมวดหมู่หลัก/ย่อย สำหรับการสร้างคำถามด้วย AI',
                type: 'alert'
            });
            return;
        }

        aiGenerateBtn.disabled = true;
        aiGenerateBtn.querySelector('span').textContent = 'Generating...';

        const prompt = `คุณคือผู้เชี่ยวชาญในการสร้างคำถามปรนัยเพื่อการศึกษาภาษาไทยสำหรับนักเรียนระดับมัธยมปลาย
ภารกิจของคุณคือสร้างคำถามปรนัยคุณภาพสูงจำนวน ${numQuestions} ข้อเกี่ยวกับหัวข้อต่อไปนี้: "${topic}"

คำถามควรเกี่ยวข้องกับหมวดหมู่หลัก "${mainCategoryName}" และหมวดหมู่ย่อยที่เฉพาะเจาะจงคือ "${subCategory}"

**คำแนะนำที่สำคัญ:**
1. ภาษาของคำถาม, ตัวเลือก, และคำอธิบายต้องเป็นภาษาไทยเท่านั้น
2. ผลลัพธ์ต้องเป็น JSON array ที่ถูกต้อง \`[...]\` เท่านั้น
3. แต่ละ object ใน array ต้องเป็นไปตามโครงสร้างนี้อย่างเคร่งครัด:
   {
     "question": "ข้อความคำถาม สามารถมี Markdown และ LaTeX (ใช้ $ สำหรับ inline และ $$ สำหรับ display)",
     "options": {
       "A": "ข้อความตัวเลือก A",
       "B": "ข้อความตัวเลือก B",
       "C": "ข้อความตัวเลือก C",
       "D": "ข้อความตัวเลือก D"
     },
     "answer": "คีย์ของตัวเลือกที่ถูกต้อง (เช่น 'A', 'B', 'C', หรือ 'D')",
     "explanation": "คำอธิบายโดยละเอียดสำหรับคำตอบที่ถูกต้อง สามารถมี Markdown และ LaTeX ได้",
     "subCategory": "${subCategory}"
   }
4. ตรวจสอบให้แน่ใจว่าค่า \`subCategory\` สำหรับทุกคำถามที่สร้างขึ้นคือ: "${subCategory}"
5. ห้ามใส่ข้อความ, ความคิดเห็น, หรือการจัดรูปแบบ Markdown (เช่น \`\`\`json) นอก JSON array หลัก การตอบกลับทั้งหมดต้องเป็นเพียง JSON array เท่านั้น

เริ่มสร้างคำถามได้`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const aiResponseText = data.candidates[0].content.parts[0].text;
            const generatedQuestions = JSON.parse(aiResponseText);

            if (!Array.isArray(generatedQuestions)) throw new Error("AI did not return a valid JSON array.");

            questions.push(...generatedQuestions);
            renderAddedQuestions();
            saveHistoryState();

            showNotificationModal({
                title: 'สร้างคำถามสำเร็จ',
                message: `เพิ่มคำถามที่สร้างโดย AI จำนวน ${generatedQuestions.length} ข้อเรียบร้อยแล้ว`,
                type: 'alert',
                autoClose: 3000
            });
        } catch (error) {
            console.error("AI Generation Error:", error);
            showNotificationModal({ title: 'เกิดข้อผิดพลาด', message: `ไม่สามารถสร้างคำถามได้: ${error.message}. โปรดตรวจสอบ API Key และลองอีกครั้ง`, type: 'alert' });
        } finally {
            aiGenerateBtn.disabled = false;
            aiGenerateBtn.querySelector('span').textContent = 'Generate with AI';
        }
    }
    // --- Run Initialization ---
    initialize();
});