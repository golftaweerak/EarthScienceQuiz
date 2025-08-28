import { subCategoryData, combinedAstronomyTopics } from '../data/sub-category-data.js';

/**
 * Creates the HTML string for a single question block, used in the generator.
 * @param {number} questionCount - The display number for the question.
 * @param {boolean} isSubQuestion - True if this is a question within a scenario.
 * @returns {string} The HTML string for the question block.
 */
function createQuestionBlockHTML(questionCount, isSubQuestion = false) {
    const radioName = `correct-choice-${Date.now()}-${Math.random()}`; // Unique name for radio group
    const title = isSubQuestion ? `คำถามย่อยที่ ${questionCount}` : `คำถามที่ ${questionCount}`;
    const removeClass = isSubQuestion ? 'gen-remove-sub-question-btn' : 'gen-remove-question-btn';
    // Modernized remove button with an icon
    const removeButtonHTML = `
        <button type="button" class="${removeClass} p-2 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-full transition-colors" aria-label="ลบรายการนี้">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
        </button>
    `;
    // New sub-category controls using the centralized data
    const subCategoryControlsHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label class="gen-label">ประเภทหมวดหมู่ (ถ้ามี)</label>
                <select class="gen-input gen-main-cat-type">
                    <option value="">-- ไม่ระบุ --</option>
                    <option value="EarthAndSpace">วิทยาศาสตร์โลกและอวกาศ</option>
                    <option value="Astronomy">ดาราศาสตร์ (ม.ต้น/ม.ปลาย)</option>
                </select>
            </div>
            <div class="gen-specific-cat-container">
                <!-- Specific sub-category dropdown will be populated here by JS -->
            </div>
        </div>
    `;
    return `
        <div class="p-4 bg-gray-100/50 dark:bg-gray-900/30 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
            <p class="font-bold text-gray-700 dark:text-gray-300">${title}</p>
            ${removeButtonHTML}
        </div>
        <div class="p-4 space-y-4">
            <div><label class="gen-label">Question Text (รองรับ LaTeX และขึ้นบรรทัดใหม่)</label><textarea rows="2" class="gen-input gen-question" required></textarea></div>
            <div class="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-600">
                <label class="gen-label">Choices (คลิกวงกลมเพื่อเลือกคำตอบที่ถูกต้อง)</label>
                <div class="flex items-center gap-3"><input type="radio" name="${radioName}" value="0" class="gen-radio" required><input type="text" placeholder="ตัวเลือกที่ 1" class="gen-input gen-choice" required></div>
                <div class="flex items-center gap-3"><input type="radio" name="${radioName}" value="1" class="gen-radio"><input type="text" placeholder="ตัวเลือกที่ 2" class="gen-input gen-choice" required></div>
                <div class="flex items-center gap-3"><input type="radio" name="${radioName}" value="2" class="gen-radio"><input type="text" placeholder="ตัวเลือกที่ 3" class="gen-input gen-choice"></div>
                <div class="flex items-center gap-3"><input type="radio" name="${radioName}" value="3" class="gen-radio"><input type="text" placeholder="ตัวเลือกที่ 4" class="gen-input gen-choice"></div>
                <div class="flex items-center gap-3"><input type="radio" name="${radioName}" value="4" class="gen-radio"><input type="text" placeholder="ตัวเลือกที่ 5" class="gen-input gen-choice"></div>
            </div>
            <div><label class="gen-label">Explanation (Optional, รองรับ LaTeX)</label><textarea rows="2" class="gen-input gen-explanation"></textarea></div>
            <div>
                <label class="gen-label">หมวดหมู่ย่อย (Sub-Category)</label>
                ${subCategoryControlsHTML}
            </div>
        </div>
    `;
}

/**
 * Parses raw text from a DOCX file into a structured array of questions and scenarios.
 * @param {string} text The raw text content from the DOCX file.
 * @returns {Array<object>} An array of question and scenario objects.
 */
function parseDocxContent(text) {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const items = [];
    let currentItem = null; // Can be a question object or a scenario object
    let currentSubQuestion = null; // The question object being built inside a scenario
    let readingMode = null; // null, 'description', or 'explanation'

    const choicePrefixes = ['ก.', 'ข.', 'ค.', 'ง.', 'จ.'];

    const finalizeCurrentItem = () => {
        if (currentItem) {
            items.push(currentItem);
            currentItem = null;
            currentSubQuestion = null;
            readingMode = null;
        }
    };

    lines.forEach(line => {
        const trimmedLine = line.trim();

        // --- Block Starters (highest priority) ---
        if (trimmedLine.toLowerCase().startsWith('สถานการณ์:')) {
            finalizeCurrentItem();
            currentItem = { type: 'scenario', title: trimmedLine.substring(9).trim(), description: '', questions: [] };
            readingMode = 'description'; // Start reading description
            return;
        }

        if (/^\d+\.\s/.test(trimmedLine)) {
            // If it's a standalone question, finalize the previous one.
            if (currentItem && currentItem.type === 'question') {
                finalizeCurrentItem();
            }
            readingMode = null; // Stop reading description/explanation
            const newQuestion = { question: trimmedLine.replace(/^\d+\.\s/, ''), options: [], answer: '', explanation: '' };
            if (currentItem && currentItem.type === 'scenario') {
                currentItem.questions.push(newQuestion);
                currentSubQuestion = newQuestion;
            } else {
                // This is a new standalone question
                currentItem = { type: 'question', ...newQuestion };
                currentSubQuestion = null;
            }
            return;
        }
        
        // --- End of Scenario ---
        if (currentItem && currentItem.type === 'scenario' && trimmedLine === '---') {
            finalizeCurrentItem();
            return;
        }

        // --- Line Processors (within a block) ---
        if (!currentItem) return; // Skip lines before any block starts

        const targetQuestion = currentItem.type === 'scenario' ? currentSubQuestion : currentItem;

        // Handle multi-line description or explanation
        if (readingMode === 'description' && currentItem.type === 'scenario' && !targetQuestion) {
            currentItem.description += (currentItem.description ? '\n' : '') + line;
            return;
        }
        if (readingMode === 'explanation' && targetQuestion) {
            targetQuestion.explanation += '\n' + line;
            return;
        }

        // If we are not in a multi-line reading mode, check for prefixes
        if (targetQuestion) {
            const choicePrefix = choicePrefixes.find(p => trimmedLine.startsWith(p));
            if (choicePrefix) {
                readingMode = null; // A choice line stops any multi-line reading
                targetQuestion.options.push(trimmedLine.substring(choicePrefix.length).trim());
                return;
            }
            if (trimmedLine.toLowerCase().startsWith('เฉลย:')) {
                readingMode = null;
                const answerText = trimmedLine.substring(5).trim();
                const answerPrefix = answerText.endsWith('.') ? answerText : answerText + '.';
                const answerIndex = choicePrefixes.indexOf(answerPrefix);
                if (answerIndex > -1 && targetQuestion.options[answerIndex]) {
                    targetQuestion.answer = targetQuestion.options[answerIndex];
                }
                return;
            }
            if (trimmedLine.toLowerCase().startsWith('คำอธิบาย:')) {
                targetQuestion.explanation = trimmedLine.substring(9).trim();
                readingMode = 'explanation'; // Start reading explanation
                return;
            }
        }
    });

    finalizeCurrentItem(); // Push the last item
    return items;
}

function populateQuestionBlock(blockElement, questionData) {
    if (!blockElement || !questionData) return;

    const questionInput = blockElement.querySelector('.gen-question');
    const explanationInput = blockElement.querySelector('.gen-explanation');
    // The subcategory dropdowns will NOT be populated by this function for DOCX import.
    // User will need to set them manually after import.
    const choiceInputs = blockElement.querySelectorAll('.gen-choice');
    const radioInputs = blockElement.querySelectorAll('.gen-radio');

    if (questionInput) questionInput.value = questionData.question || '';
    if (explanationInput) explanationInput.value = questionData.explanation || '';

    if (questionData.options && Array.isArray(questionData.options)) {
        questionData.options.forEach((optionText, index) => {
            if (choiceInputs[index]) {
                choiceInputs[index].value = optionText;
                if (optionText.trim() === (questionData.answer || '').trim()) {
                    if (radioInputs[index]) {
                        radioInputs[index].checked = true;
                    }
                }
            }
        });
    }
}

function populateGenerator(itemsContainer, addQuestionBtn, items) {
    itemsContainer.innerHTML = ''; // Clear existing questions
    let questionCounter = 0;

    items.forEach((itemData) => {
        if (itemData.type === 'scenario') {
            // Create a scenario block
           const newScenarioBlock = document.createElement('div');
           newScenarioBlock.className = 'gen-scenario-block bg-blue-50 dark:bg-blue-900/40 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden shadow-md';
           newScenarioBlock.innerHTML = `
               <div class="p-4 bg-blue-100/50 dark:bg-blue-900/30 flex justify-between items-center border-b border-blue-200 dark:border-blue-800">
                   <h4 class="font-bold text-lg font-kanit text-blue-800 dark:text-blue-300">สถานการณ์ (Scenario)</h4>
                   <button type="button" class="gen-remove-scenario-btn p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-full transition-colors" aria-label="ลบสถานการณ์">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                   </button>
               </div>
               <div class="p-4 space-y-4">
                   <div class="grid grid-cols-1 gap-4">
                       <div><label class="gen-label">Scenario Title</label><input type="text" class="gen-input gen-scenario-title" required></div>
                       <div><label class="gen-label">Scenario Description (รองรับ LaTeX และขึ้นบรรทัดใหม่)</label><textarea rows="3" class="gen-input gen-scenario-desc"></textarea></div>
                   </div>
                   <div class="gen-sub-questions-container pt-3 space-y-5">
                       <!-- Sub-questions will be added here -->
                   </div>
                   <div class="pt-3 border-t border-blue-200 dark:border-blue-700">
                       <button type="button" class="gen-add-sub-question-btn px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-xs font-bold inline-flex items-center gap-1.5 shadow-sm hover:shadow-md">
                           <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                           เพิ่มคำถามย่อย
                       </button>
                   </div>
               </div>
           `;

            // Populate scenario fields
            newScenarioBlock.querySelector('.gen-scenario-title').value = itemData.title || '';
            newScenarioBlock.querySelector('.gen-scenario-desc').value = itemData.description || '';
            
            const subQuestionsContainer = newScenarioBlock.querySelector('.gen-sub-questions-container');
            if (itemData.questions && Array.isArray(itemData.questions)) {
                itemData.questions.forEach((subQuestionData, index) => {
                    const newSubQuestionBlock = document.createElement('div');
                    newSubQuestionBlock.className = 'gen-sub-question-block bg-white dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden';
                    newSubQuestionBlock.innerHTML = createQuestionBlockHTML(index + 1, true);
                    populateQuestionBlock(newSubQuestionBlock, subQuestionData);
                    subQuestionsContainer.appendChild(newSubQuestionBlock);
                });
            }
            itemsContainer.appendChild(newScenarioBlock);

        } else if (itemData.type === 'question') {
            // Create a standalone question block
            questionCounter++;
            const newQuestionBlock = document.createElement('div');
            newQuestionBlock.className = 'gen-question-block bg-white dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden';
            newQuestionBlock.innerHTML = createQuestionBlockHTML(questionCounter, false);
            populateQuestionBlock(newQuestionBlock, itemData);
            itemsContainer.appendChild(newQuestionBlock);
        }
    });
    // Add one empty question block if the container is empty after populating
    if (itemsContainer.children.length === 0) addQuestionBtn.click();
}

function generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename) {
    if (!generatorForm) return;

    const id = document.getElementById('gen-id').value.trim();
    const title = document.getElementById('gen-title').value.trim();
    const description = document.getElementById('gen-desc').value.trim();
    const category = document.getElementById('gen-category').value;
    const icon = document.getElementById('gen-icon').value.trim();

    const itemsForDataFile = [];
    let totalQuestionCount = 0;

    function parseQuestionBlock(block) {
        const questionText = block.querySelector('.gen-question').value;
        const choiceInputs = Array.from(block.querySelectorAll('.gen-choice'));
        const choices = choiceInputs.map(c => c.value).filter(Boolean);
        const checkedRadio = block.querySelector('.gen-radio:checked');
        let answer = '';
        if (checkedRadio) {
            const correctIndex = parseInt(checkedRadio.value, 10);
            answer = choiceInputs[correctIndex]?.value || '';
        }
        const explanation = block.querySelector('.gen-explanation').value;
        
        // New logic for subCategory
        const mainCatTypeSelect = block.querySelector('.gen-main-cat-type');
        let subCategory = null; // Use null for no subcategory

        if (mainCatTypeSelect && mainCatTypeSelect.value) {
            const mainCatType = mainCatTypeSelect.value;
            if (mainCatType === 'EarthAndSpace') {
                const specificSelect = block.querySelector('.gen-specific-cat-object');
                if (specificSelect && specificSelect.value) {
                    const [main, specific] = specificSelect.value.split('__SEP__');
                    subCategory = { main, specific };
                }
            } else if (mainCatType === 'Astronomy') {
                const specificSelect = block.querySelector('.gen-specific-cat-astro');
                if (specificSelect && specificSelect.value) {
                    subCategory = { main: "Astronomy", specific: specificSelect.value };
                }
            }
        }
        return { question: questionText, options: choices, answer, explanation, subCategory };
    }

    itemsContainer.childNodes.forEach(itemBlock => {
        if (itemBlock.nodeType !== Node.ELEMENT_NODE) return;

        if (itemBlock.classList.contains('gen-question-block')) {
            const questionData = parseQuestionBlock(itemBlock);
            if (questionData.question && questionData.options.length > 0 && questionData.answer) {
                itemsForDataFile.push({ type: "question", ...questionData });
                totalQuestionCount++;
            }
        } else if (itemBlock.classList.contains('gen-scenario-block')) {
            const scenarioTitle = itemBlock.querySelector('.gen-scenario-title').value;
            const scenarioDesc = itemBlock.querySelector('.gen-scenario-desc').value;
            const subQuestionBlocks = itemBlock.querySelectorAll('.gen-sub-question-block');
            const subQuestions = Array.from(subQuestionBlocks).map(parseQuestionBlock).filter(q => q.question && q.options.length > 0 && q.answer);

            if (scenarioTitle && subQuestions.length > 0) {
                itemsForDataFile.push({ type: "scenario", title: scenarioTitle, description: scenarioDesc, questions: subQuestions });
                totalQuestionCount += subQuestions.length;
            }
        }
    });

    // Update UI and generate code strings
    if (outputFilename) outputFilename.textContent = id ? `data/${id}-data.js` : 'data/your-id-data.js';

    const listEntry = { id, title, description, url: `./quiz/index.html?id=${id}`, storageKey: `quizState-${id}`, amount: totalQuestionCount, category, icon, altText: `ไอคอน ${title}` };
    outputList.value = `,\n${JSON.stringify(listEntry, null, 4)}`;

    const dataFileContent = `const quizItems = ${JSON.stringify(itemsForDataFile, (key, value) => {
        // Clean up empty optional fields before stringifying for cleaner data files
        if (key === 'subCategory' && !value) {
            return undefined;
        }
        return value;
    }, 4)};`;
    outputData.value = dataFileContent;
}

export function initializeGenerator() {
    // --- Generator Panel Logic ---
    const generatorForm = document.getElementById('generator-form');
    const itemsContainer = document.getElementById('gen-items-container');
    const addQuestionBtn = document.getElementById('gen-add-question-btn');
    const addScenarioBtn = document.getElementById('gen-add-scenario-btn');
    const outputList = document.getElementById('gen-output-list');
    const importDocxBtn = document.getElementById('gen-import-docx-btn');
    const docxInput = document.getElementById('gen-docx-input');
    const outputData = document.getElementById('gen-output-data');
    const outputFilename = document.getElementById('gen-output-filename');

    // Tab switching
    const tabPreview = document.getElementById('tab-preview');
    const tabGenerator = document.getElementById('tab-generator');
    const panelPreview = document.getElementById('panel-preview');
    const panelGenerator = document.getElementById('panel-generator');

    function switchTab(selectedTab) {
        [tabPreview, tabGenerator].forEach(tab => {
            if (!tab) return;
            const isSelected = tab === selectedTab;
            tab.setAttribute('aria-selected', isSelected);
            tab.classList.toggle('border-blue-500', isSelected);
            tab.classList.toggle('text-blue-600', isSelected);
            tab.classList.toggle('dark:border-blue-400', isSelected);
            tab.classList.toggle('dark:text-blue-400', isSelected);
            tab.classList.toggle('border-transparent', !isSelected);
            tab.classList.toggle('text-gray-500', !isSelected);
            tab.classList.toggle('hover:text-gray-700', !isSelected);
            tab.classList.toggle('hover:border-gray-300', !isSelected);
        });
        if (panelPreview) panelPreview.classList.toggle('hidden', selectedTab !== tabPreview);
        if (panelGenerator) panelGenerator.classList.toggle('hidden', selectedTab !== tabGenerator);
    }

    if (tabPreview && tabGenerator) {
        tabPreview.addEventListener('click', () => switchTab(tabPreview));
        tabGenerator.addEventListener('click', () => switchTab(tabGenerator));
    }

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const questionCount = document.querySelectorAll('.gen-question-block:not(.gen-sub-question-block .gen-question-block)').length + 1;
            const newQuestionBlock = document.createElement('div');
            newQuestionBlock.className = 'gen-question-block bg-white dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden';
            newQuestionBlock.innerHTML = createQuestionBlockHTML(questionCount, false);
            itemsContainer.appendChild(newQuestionBlock);
            generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename);
        });
    }

    if (addScenarioBtn) {
        addScenarioBtn.addEventListener('click', () => {
            const newScenarioBlock = document.createElement('div');
            newScenarioBlock.className = 'gen-scenario-block bg-blue-50 dark:bg-blue-900/40 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden shadow-md';
            newScenarioBlock.innerHTML = `
                <div class="p-4 bg-blue-100/50 dark:bg-blue-900/30 flex justify-between items-center border-b border-blue-200 dark:border-blue-800">
                    <h4 class="font-bold text-lg font-kanit text-blue-800 dark:text-blue-300">สถานการณ์ (Scenario)</h4>
                    <button type="button" class="gen-remove-scenario-btn p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-full transition-colors" aria-label="ลบสถานการณ์">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    </button>
                </div>
                <div class="p-4 space-y-4">
                    <div class="grid grid-cols-1 gap-4">
                        <div><label class="gen-label">Scenario Title</label><input type="text" class="gen-input gen-scenario-title" required></div>
                        <div><label class="gen-label">Scenario Description (รองรับ LaTeX และขึ้นบรรทัดใหม่)</label><textarea rows="3" class="gen-input gen-scenario-desc"></textarea></div>
                    </div>
                    <div class="gen-sub-questions-container pt-3 space-y-5">
                        <!-- Sub-questions will be added here -->
                    </div>
                    <div class="pt-3 border-t border-blue-200 dark:border-blue-700">
                        <button type="button" class="gen-add-sub-question-btn px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-xs font-bold inline-flex items-center gap-1.5 shadow-sm hover:shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" /></svg>
                            เพิ่มคำถามย่อย
                        </button>
                    </div>
                </div>
            `;
            itemsContainer.appendChild(newScenarioBlock);
            generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename);
        });
    }

    if (itemsContainer) {
        itemsContainer.addEventListener('click', (e) => {
            const target = e.target;
            let changed = false;

            if (target.classList.contains('gen-remove-question-btn')) {
                target.closest('.gen-question-block').remove();
                changed = true;
            } else if (target.classList.contains('gen-remove-scenario-btn')) {
                target.closest('.gen-scenario-block').remove();
                changed = true;
            } else if (target.classList.contains('gen-remove-sub-question-btn')) {
                const subQuestionBlock = target.closest('.gen-sub-question-block');
                const scenarioContainer = subQuestionBlock.parentElement;
                subQuestionBlock.remove();
                // Re-number sub-questions within this scenario
                scenarioContainer.querySelectorAll('.gen-sub-question-block').forEach((block, index) => {
                    block.querySelector('p.font-bold').textContent = `คำถามย่อยที่ ${index + 1}`;
                });
                changed = true;
            } else if (target.classList.contains('gen-add-sub-question-btn')) {
                const scenarioBlock = target.closest('.gen-scenario-block');
                const subQuestionsContainer = scenarioBlock.querySelector('.gen-sub-questions-container');
                const subQuestionCount = subQuestionsContainer.children.length + 1;
                const newSubQuestionBlock = document.createElement('div');
                newSubQuestionBlock.className = 'gen-sub-question-block bg-white dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden';
                newSubQuestionBlock.innerHTML = createQuestionBlockHTML(subQuestionCount, true);
                subQuestionsContainer.appendChild(newSubQuestionBlock);
                changed = true;
            }

            if (changed) {
                // Re-number standalone questions if any were added/removed
                let questionCounter = 1;
                document.querySelectorAll('.gen-question-block:not(.gen-sub-question-block .gen-question-block)').forEach(block => {
                    block.querySelector('p.font-bold').textContent = `คำถามที่ ${questionCounter++}`;
                });
                generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename); // Re-generate code after any change
            }
        });
    }

    // Add a new 'change' listener for the dropdowns
    if (itemsContainer) {
        itemsContainer.addEventListener('change', (e) => {
            if (e.target.classList.contains('gen-main-cat-type')) {
                const mainCatType = e.target.value;
                const questionBlock = e.target.closest('.gen-question-block, .gen-sub-question-block');
                if (!questionBlock) return;

                const specificContainer = questionBlock.querySelector('.gen-specific-cat-container');
                if (!specificContainer) return;

                if (!mainCatType) {
                    specificContainer.innerHTML = '';
                    generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename);
                    return;
                }

                let specificSelectHTML = '';

                if (mainCatType === 'EarthAndSpace') {
                    const categories = subCategoryData[mainCatType];
                    const mainTopics = Object.keys(categories);
                    const optgroups = mainTopics.map(topic => {
                        const topicOptions = categories[topic].map(specific => `<option value="${topic}__SEP__${specific}">${specific}</option>`).join('');
                        return `<optgroup label="${topic}">${topicOptions}</optgroup>`;
                    }).join('');
                    specificSelectHTML = `<label class="gen-label">หัวข้อย่อย</label><select class="gen-input gen-specific-cat-object">${optgroups}</select>`;
                } else if (mainCatType === 'Astronomy') {
                    const options = combinedAstronomyTopics.map(item => 
                        `<option value="${item.topic}">${item.topic} (${item.level})</option>`
                    ).join('');
                    specificSelectHTML = `<label class="gen-label">หัวข้อย่อยดาราศาสตร์</label><select class="gen-input gen-specific-cat-astro">${options}</select>`;
                }
                specificContainer.innerHTML = specificSelectHTML;
            }
            generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename); // Re-generate code on any change
        });
    }

    if (importDocxBtn && docxInput) {
        importDocxBtn.addEventListener('click', () => {
            docxInput.click(); // Trigger the hidden file input
        });

        docxInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const arrayBuffer = e.target.result;
                // mammoth must be globally available from a <script> tag
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(result => { 
                        const parsedQuestions = parseDocxContent(result.value || '');
                        if (parsedQuestions.length > 0) {
                            populateGenerator(itemsContainer, addQuestionBtn, parsedQuestions); 
                        } else {
                            alert("ไม่สามารถแยกแยะข้อมูลคำถามจากไฟล์ได้ โปรดตรวจสอบรูปแบบของไฟล์ .docx");
                        }
                    })
                    .catch(err => {
                        console.error("Error processing DOCX file:", err);
                        alert("เกิดข้อผิดพลาดในการประมวลผลไฟล์ .docx");
                    });
            };
            reader.readAsArrayBuffer(file);
            event.target.value = ''; // Reset input so the same file can be selected again
        });
    }

    let generatorDebounceTimer;
    if (generatorForm) {
        generatorForm.addEventListener('input', () => {
            clearTimeout(generatorDebounceTimer);
            // Use a slightly longer debounce time for the generator as it's a heavier operation
            generatorDebounceTimer = setTimeout(() => generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename), 500);
        });
        // Generate code initially to populate fields if there's any default content
        generateCode(generatorForm, itemsContainer, outputList, outputData, outputFilename);
    }

    // Copy to clipboard functionality
    document.querySelectorAll('.gen-copy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.copyTarget;
            const textarea = document.getElementById(targetId);
            if (textarea) {
                navigator.clipboard.writeText(textarea.value).then(() => {
                    const originalText = e.currentTarget.textContent;
                    e.currentTarget.textContent = 'คัดลอกแล้ว!';
                    setTimeout(() => { e.currentTarget.textContent = originalText; }, 2000);
                }).catch(err => { console.error('Failed to copy:', err); alert('ไม่สามารถคัดลอกได้'); });
            }
        });
    });
}