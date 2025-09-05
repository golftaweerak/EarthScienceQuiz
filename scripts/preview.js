import { initializeMenu } from './menu-handler.js';
import { ModalHandler } from './modal-handler.js';
import { quizList } from '../data/quizzes-list.js';
import { fetchAllQuizData, categoryDetails as allCategoryDetails } from './data-manager.js';
import { subCategoryData, } from '../data/sub-category-data.js';
import { initializeGenerator } from './generator.js';

import { exportQuizToTxt } from './txt-exporter.js';


const CONFIG = {
    SEARCH_DEBOUNCE_MS: 300,
    MIN_SEARCH_LENGTH: 3,
    ZOOM_STEP: 10,
    MIN_ZOOM: 70,
    MAX_ZOOM: 150,
    DEFAULT_ZOOM: 100,
};

let currentQuizData = []; // Store the full data for the selected quiz to be rendered

/**
 * Populates the category filter dropdown with all unique sub-categories from all quizzes.
 */
async function populateCategoryFilter() {
    const categorySelector = document.getElementById('category-selector');
    if (!categorySelector) return;

    // Add a placeholder while loading
    categorySelector.innerHTML = '<option>กำลังโหลดหมวดหมู่...</option>';
    categorySelector.disabled = true;

    try {
        const { allQuestions } = await fetchAllQuizData();
        const categories = new Set();
 
        allQuestions.forEach(q => {
            if (q.subCategory) {
                const subCat = q.subCategory;
                if (typeof subCat === 'object' && subCat.main) {
                    // Handle both string and array for 'specific'
                    const specifics = Array.isArray(subCat.specific) ? subCat.specific : [subCat.specific];
                    specifics.forEach(specificCat => {
                        if (specificCat && typeof specificCat === 'string') {
                            categories.add(specificCat.trim());
                        }
                    });
                } else if (typeof subCat === 'string') {
                    // Handle legacy string format.
                    categories.add(subCat.trim());
                }
            }
        });
 
        const sortedCategories = Array.from(categories).sort((a, b) => a.localeCompare(b, 'th'));
 
        categorySelector.innerHTML = '<option value="">-- ค้นหาจากทุกหมวดหมู่ --</option>'; // Reset and add default
        sortedCategories.forEach(cat => categorySelector.add(new Option(cat, cat)));
        categorySelector.disabled = false;
    } catch (error) {
        console.error("Failed to populate category filter:", error);
        categorySelector.innerHTML = `<option value="">เกิดข้อผิดพลาด: ${error.message}</option>`;
    }
}

// Helper function to highlight keywords in a text
function highlightText(text, keyword) {
    // Coerce text to string to prevent errors if it's null, undefined, or a number.
    const textAsString = String(text || '');
    if (!keyword || !textAsString) {
        return textAsString;
    }    
    // Escape special characters in the keyword for use in a regular expression
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    return textAsString.replace(regex, (match) => `<mark class="bg-yellow-200 dark:bg-yellow-700 rounded">${match}</mark>`);
}

// Helper function to create a single question element. This promotes reusability.
function createQuestionElement(item, displayIndex, keyword) {
    // Check the state of the "Show Answers" toggle
    const showAnswers = document.getElementById('show-answers-toggle')?.checked;

    // Replace newline characters with <br> tags for proper HTML rendering
    const questionHtml = item.question ? highlightText(String(item.question).replace(/\n/g, '<br>'), keyword) : '';
    const explanationHtml = item.explanation ? highlightText(String(item.explanation).replace(/\n/g, '<br>'), keyword) : '';

    const questionDiv = document.createElement('div');
    // Add a unique ID for the jump-to-question feature
    questionDiv.id = `question-${displayIndex}`;
    // Add 'question-card' for PDF page breaks
    questionDiv.className = 'bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700 question-card';

    const questionHeader = document.createElement('h2');
    // Use flex to align title and button
    questionHeader.className = 'flex justify-between items-center text-xl font-bold text-gray-800 dark:text-gray-200 mb-3';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = `ข้อที่ ${displayIndex}`;
    questionHeader.appendChild(titleSpan);

    // Create a container for buttons on the right
    const headerButtonsContainer = document.createElement('div');
    headerButtonsContainer.className = 'flex items-center gap-4';

    // Add "View Scenario" button if the question belongs to one.
    if (item.scenarioTitle) {
        const viewScenarioBtn = document.createElement('button');
        viewScenarioBtn.className = 'text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none';
        viewScenarioBtn.textContent = 'ดูข้อมูลสถานการณ์';
        viewScenarioBtn.type = 'button';
        viewScenarioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.showScenarioModal(item.scenarioTitle, item.scenarioDescription, e.currentTarget);
        });
        headerButtonsContainer.appendChild(viewScenarioBtn);
    }

    // Add "Inspect Data" button only on preview-data.html.
    const isDataPreviewPage = window.location.pathname.endsWith('/preview-data.html');
    if (isDataPreviewPage) {
        const inspectBtn = document.createElement('button');
        inspectBtn.className = 'text-xs font-mono text-purple-600 dark:text-purple-400 hover:underline focus:outline-none';
        inspectBtn.textContent = '[Inspect Data]';
        inspectBtn.type = 'button';
        inspectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // The 'item' here is the full question object passed to createQuestionElement
            window.showDataInspectorModal(item, e.currentTarget);
        });
        headerButtonsContainer.appendChild(inspectBtn);
    }
    questionHeader.appendChild(headerButtonsContainer);

    questionDiv.appendChild(questionHeader);

    if (questionHtml) {
        const questionText = document.createElement('div');
        questionText.className = 'text-gray-800 dark:text-gray-300';
        questionText.innerHTML = questionHtml;
        questionDiv.appendChild(questionText);
    }

    const choices = item.choices || item.options; // Handle both 'choices' and 'options' property from data files
    if (choices && Array.isArray(choices)) {
        const choicesContainer = document.createElement('div');
        choicesContainer.className = 'pl-4 mt-4 space-y-2 text-gray-700 dark:text-gray-400';
        const thaiNumerals = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ'];

        choices.forEach((choice, index) => {
            const choiceWrapper = document.createElement('div');
            choiceWrapper.className = 'flex items-start gap-2';

            const numeralSpan = document.createElement('span');
            numeralSpan.className = 'font-semibold flex-shrink-0';
            numeralSpan.textContent = `${thaiNumerals[index] || (index + 1)}.`

            const choiceTextDiv = document.createElement('div');
            choiceTextDiv.innerHTML = highlightText(String(choice).replace(/\n/g, '<br>'), keyword);

            // Highlight the correct answer(s)
            if (showAnswers) {
                // Handle both single answer (string) and multiple answers (array)
                const isCorrect = Array.isArray(item.answer)
                    ? item.answer.includes(choice)
                    : choice === item.answer;

                if (isCorrect) {
                    choiceWrapper.classList.add('text-green-600', 'dark:text-green-400', 'font-bold');
                }
            }
            choiceWrapper.appendChild(numeralSpan);
            choiceWrapper.appendChild(choiceTextDiv);
            choicesContainer.appendChild(choiceWrapper);
        });
        questionDiv.appendChild(choicesContainer);
    }
    // Add explanation section
    if (showAnswers && explanationHtml) {
        const explanationDiv = document.createElement('div');
        // Restore the visually appealing Flexbox layout.
        explanationDiv.className = 'mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm leading-relaxed flex flex-row items-baseline';

        const header = document.createElement('strong');
        header.className = 'font-bold text-md text-blue-600 dark:text-blue-400 mr-2 flex-shrink-0'; // flex-shrink-0 prevents the header from shrinking
        header.textContent = 'คำอธิบาย:';
        explanationDiv.appendChild(header);

        const content = document.createElement('span');
        content.innerHTML = explanationHtml;
        explanationDiv.appendChild(content);
        questionDiv.appendChild(explanationDiv);
    }

    // If the item has a source (from a global search), display it.
    if (item.sourceQuizTitle) {
        const sourceInfo = document.createElement('div');
        sourceInfo.className = 'mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 text-right text-xs text-gray-500 dark:text-gray-400';

        let subCategoryText = '';
        if (item.subCategory) {
            const subCat = item.subCategory;
            let subCatDisplay;
            if (typeof subCat === 'object' && subCat.main) {
                // If 'specific' is an array, join it. Otherwise, use it or fallback to main.
                subCatDisplay = Array.isArray(subCat.specific) ? subCat.specific.join(', ') : (subCat.specific || subCat.main);
            } else if (typeof subCat === 'string') {
                subCatDisplay = subCat;
            }

            if (subCatDisplay) {
                subCategoryText = `หมวดหมู่: <span class="font-semibold">${highlightText(subCatDisplay, keyword)}</span><br>`;
            }
        }
        sourceInfo.innerHTML = `${subCategoryText}จาก: <span class="font-semibold">${highlightText(String(item.sourceQuizTitle || ''), keyword)}</span>`;
        questionDiv.appendChild(sourceInfo);
    }

    return questionDiv;
}

/**
 * Finds all images within a given container element, applies modern styling,
 * and wraps them in a link to view the full-size image.
 * @param {HTMLElement} container The container to search for images within.
 */
function styleContainedImages(container) {
    container.querySelectorAll('img').forEach(img => {
        // Skip if the image is already wrapped/styled to prevent re-processing
        if (img.closest('.image-wrapper')) {
            return;
        }

        // Create a wrapper for centering, spacing, and adding a caption.
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper my-4 text-center';

        // Create a link to open the image in a new tab for a larger view.
        const link = document.createElement('a');
        link.href = img.src;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = 'คลิกเพื่อดูภาพขยาย';
        // The 'group' class allows the image to scale on link hover.
        link.className = 'inline-block group';

        // Apply Tailwind classes for styling the image.
        img.classList.add(
            'max-w-full', 'h-auto', 'rounded-lg', 'shadow-md', 'border',
            'border-gray-200', 'dark:border-gray-700',
            'transition-transform', 'duration-300', 'group-hover:scale-105', 'cursor-pointer'
        );

        // Replace the original image with the new structure: wrapper > link > img
        if (img.parentNode) {
            img.parentNode.replaceChild(wrapper, img);
        }
        link.appendChild(img);
        wrapper.appendChild(link);
    });
}

// Function to render quiz data
function renderQuizData() {
    const container = document.getElementById('preview-container');
    const searchInput = document.getElementById('search-input');
    const filterKeyword = searchInput.value.toLowerCase().trim();
    const countContainer = document.getElementById('question-count-container');
    const jumpContainer = document.getElementById('jump-to-question-container');
    const questionJumper = document.getElementById('question-jumper');

    container.innerHTML = '';
    if (countContainer) {
        countContainer.innerHTML = '';
    }
    if (jumpContainer) {
        jumpContainer.classList.add('hidden');
        questionJumper.innerHTML = '';
    }

    if (currentQuizData.length > 0) {
        // Use the pre-processed `searchableText` for much faster filtering.
        const filteredData = filterKeyword
            ? currentQuizData.filter(item => item.searchableText && item.searchableText.includes(filterKeyword))
            : currentQuizData;

        // Update the question count display
        if (countContainer) {
            const totalCount = currentQuizData.length;
            const foundCount = filteredData.length;

            if (filterKeyword) {
                countContainer.innerHTML = `พบ <span class="font-bold text-blue-600 dark:text-blue-400">${foundCount}</span> ข้อ จากทั้งหมด <span class="font-bold">${totalCount}</span> ข้อ`;
            } else {
                countContainer.innerHTML = `แสดงทั้งหมด <span class="font-bold">${totalCount}</span> ข้อ`;
            }
        }

        if (filteredData.length === 0) {
            container.innerHTML = `<div class="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-r-lg" role="alert">
                                       <p class="font-bold">ไม่พบผลลัพธ์</p>
                                       <p>ไม่พบคำถามที่ตรงกับคีย์เวิร์ด: <strong>"${searchInput.value}"</strong></p>
                                   </div>`;
            return;
        }

        // --- Group questions by scenario to wrap them in a single card ---
        const renderGroups = [];
        let currentScenarioGroup = null;

        filteredData.forEach(item => {
            if (item.scenarioTitle) {
                // This item belongs to a scenario.
                if (currentScenarioGroup && currentScenarioGroup.title === item.scenarioTitle) {
                    // It's the same scenario as the previous item, add the question to the current group.
                    currentScenarioGroup.questions.push(item);
                } else {
                    // It's a new scenario. Create a new group.
                    currentScenarioGroup = {
                        isScenario: true,
                        title: item.scenarioTitle,
                        description: item.scenarioDescription,
                        questions: [item]
                    };
                    renderGroups.push(currentScenarioGroup);
                }
            } else {
                // This is a standalone question.
                currentScenarioGroup = null; // Reset scenario tracking
                renderGroups.push({
                    isScenario: false,
                    questions: [item]
                });
            }
        });

        // --- Render the grouped data ---
        let questionDisplayCounter = 0;
        renderGroups.forEach(group => {
            if (group.isScenario) {
                // Create the main scenario card/wrapper
                const scenarioCard = document.createElement('div');
                // Add 'question-card' for PDF page breaks
                scenarioCard.className = 'mb-6 bg-blue-50 dark:bg-gray-800/60 rounded-xl border border-blue-200 dark:border-gray-700 shadow-md overflow-hidden question-card';

                // Create the clickable header for toggling
                const scenarioHeader = document.createElement('div');
                scenarioHeader.className = 'p-4 sm:p-6 flex justify-between items-start gap-4 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-gray-700/50 transition-colors';

                const headerTextContainer = document.createElement('div');

                const scenarioTitleEl = document.createElement('h2');
                scenarioTitleEl.className = 'text-2xl font-bold text-blue-800 dark:text-blue-300 mb-3 font-kanit';
                scenarioTitleEl.innerHTML = highlightText(group.title, filterKeyword);
                headerTextContainer.appendChild(scenarioTitleEl);

                if (group.description) {
                    const scenarioDescEl = document.createElement('div');
                    // Using prose class for better text formatting from HTML content
                    scenarioDescEl.className = 'prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed';
                    scenarioDescEl.innerHTML = highlightText(group.description, filterKeyword);
                    headerTextContainer.appendChild(scenarioDescEl);
                }

                // Add source quiz title if available
                if (group.questions[0]?.sourceQuizTitle) {
                    const sourceTitleEl = document.createElement('p');
                    sourceTitleEl.className = 'text-sm text-gray-500 dark:text-gray-400 mt-2 italic';
                    sourceTitleEl.textContent = `(จากชุดข้อสอบ: ${group.questions[0].sourceQuizTitle})`;
                    headerTextContainer.appendChild(sourceTitleEl);
                }
                scenarioHeader.appendChild(headerTextContainer);

                // Add toggle icon
                const iconContainer = document.createElement('div');
                iconContainer.className = 'flex-shrink-0 pt-1';
                iconContainer.innerHTML = `<svg class="chevron-icon h-6 w-6 text-blue-600 dark:text-blue-400 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>`; // Chevron-down icon
                scenarioHeader.appendChild(iconContainer);
                scenarioCard.appendChild(scenarioHeader);

                // Create a collapsible container for the questions
                const questionsContainer = document.createElement('div');
                questionsContainer.className = 'grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out'; // Start collapsed
                const questionsInnerDiv = document.createElement('div');
                questionsInnerDiv.className = 'overflow-hidden space-y-6 px-4 sm:px-6 pb-6';
                group.questions.forEach(questionItem => {
                    questionDisplayCounter++;
                    const questionElement = createQuestionElement(questionItem, questionDisplayCounter, filterKeyword);
                    questionsInnerDiv.appendChild(questionElement);
                });
                questionsContainer.appendChild(questionsInnerDiv);
                scenarioCard.appendChild(questionsContainer);

                // Add toggle functionality
                scenarioHeader.addEventListener('click', () => {
                    const icon = scenarioHeader.querySelector('.chevron-icon');
                    // Check if the container is currently collapsed
                    const isCollapsed = questionsContainer.classList.contains('grid-rows-[0fr]');

                    // Toggle classes to expand/collapse the container with a smooth animation
                    questionsContainer.classList.toggle('grid-rows-[1fr]', isCollapsed);
                    questionsContainer.classList.toggle('grid-rows-[0fr]', !isCollapsed);

                    // Toggle the icon rotation to indicate state (points up when expanded)
                    icon.classList.toggle('rotate-180', isCollapsed);
                });

                container.appendChild(scenarioCard);
            } else {
                // It's a standalone question, just create and append it.
                const questionItem = group.questions[0];
                questionDisplayCounter++;
                const questionElement = createQuestionElement(questionItem, questionDisplayCounter, filterKeyword);
                container.appendChild(questionElement);
            }
        });

        // --- Final DOM adjustments ---
        // Correct image paths by iterating through the newly added DOM elements.
        // This is more robust than string replacement on raw HTML, ensuring all images
        // from questions, explanations, and scenarios are handled correctly.
        container.querySelectorAll('img[src^="../"]').forEach(img => {
            const currentSrc = img.getAttribute('src');
            // Change '../' to './' to make it relative to the root for preview.html
            img.src = currentSrc.replace('../', './');
        });

        // Apply consistent styling to all images within the rendered content.
        styleContainedImages(container);

        // --- Populate the jump-to-question dropdown AFTER rendering ---
        if (questionJumper && filteredData.length > 0) {
            questionJumper.innerHTML = '<option value="">-- ไปที่ข้อ --</option>'; // Add a default option

            filteredData.forEach((item, index) => {
                const displayIndex = index + 1;
                const option = document.createElement('option');
                option.value = `#question-${displayIndex}`;
                const questionText = (item.question || '').replace(/<[^>]*>?/gm, ''); // Strip HTML tags
                const truncatedText = questionText.length > 70 ? questionText.substring(0, 70) + '...' : questionText;
                option.textContent = `ข้อ ${displayIndex}: ${truncatedText}`;
                questionJumper.appendChild(option);
            });

            jumpContainer.classList.remove('hidden');
        }
        // Now that all HTML is in the DOM, render the math using KaTeX
        if (window.renderMathInElement) {
            renderMathInElement(container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\(', right: '\)', display: false },
                    { left: '\\\\[', right: '\\\\\]', display: true }
                ],
                throwOnError: false
            });
        } else {
            console.warn("KaTeX auto-render script not loaded yet.");
        }

    } else if (document.getElementById('quiz-selector').value) {
        // This case handles when a script was selected but it was empty or invalid
        const quizSelector = document.getElementById('quiz-selector');
        const selectedQuizTitle = quizSelector.options[quizSelector.selectedIndex].text;
        container.innerHTML = `<div class="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-r-lg" role="alert">
                                   <p class="font-bold">ไม่พบข้อมูลคำถาม</p>
                                   <p>ไม่พบคำถามสำหรับชุดข้อสอบ: <strong>"${selectedQuizTitle}"</strong>. อาจเป็นเพราะข้อมูลยังไม่ถูกเพิ่มหรือมีข้อผิดพลาดในการจับคู่ชื่อชุดข้อสอบ</p>
                               </div>`;
    }
}

// Handler for global search across all quizzes
async function handleGlobalSearch() {
    const searchInput = document.getElementById('search-input');
    const container = document.getElementById('preview-container');
    const keyword = searchInput.value.trim();
    const categorySelector = document.getElementById('category-selector');
    const selectedCategory = categorySelector ? categorySelector.value : '';
    const countContainer = document.getElementById('question-count-container');

    if (countContainer) {
        countContainer.innerHTML = '';
    }

    if (keyword.length < CONFIG.MIN_SEARCH_LENGTH && !selectedCategory) {
        currentQuizData = []; // Clear previous results when search term is too short
        container.innerHTML = `<div class="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded-r-lg" role="alert">
                                   <p class="font-bold">ค้นหาในทุกชุดข้อสอบ</p>
                                   <p>กรุณาพิมพ์อย่างน้อย ${CONFIG.MIN_SEARCH_LENGTH} ตัวอักษรเพื่อเริ่มการค้นหา</p>
                               </div>`;
        return;
    }

    container.innerHTML = `<div class="text-center p-8 text-gray-500 dark:text-gray-400">
                                <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/
svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <p>กำลังค้นหาจากข้อสอบทั้งหมด...</p>
                            </div>`;
    try {
        const { allQuestions, scenarios } = await fetchAllQuizData();
        if (countContainer) {
            countContainer.innerHTML = `กำลังค้นหาจากข้อสอบทั้งหมด <span class="font-bold">${allQuestions.length}</span> ข้อ...`;
        }

        let dataToProcess = allQuestions;

        // Filter by category FIRST, if one is selected
        if (selectedCategory) {
            dataToProcess = dataToProcess.filter(item => {
                if (!item.subCategory) return false;
                const subCat = item.subCategory;
                const subCatDisplay = (typeof subCat === 'object' && subCat.main)
                    ? (subCat.specific || subCat.main)
                    : (typeof subCat === 'string' ? subCat : '');
                return subCatDisplay === selectedCategory;
            });
        }

        // Add scenario info back to each question item for easier rendering
        const allDataWithScenarios = dataToProcess.map(item => {
            if (item.scenarioId && scenarios.has(item.scenarioId)) {
                const scenario = scenarios.get(item.scenarioId);
                return { ...item, scenarioTitle: scenario.title, scenarioDescription: scenario.description };
            }
            return item;
        });

        currentQuizData = allDataWithScenarios;
        renderQuizData();
    } catch (error) {
        console.error("Global search failed:", error);
        container.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-800 dark:text-red-200 p-4 rounded-r-lg" role="alert">
                                   <p class="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                                   <p>ไม่สามารถทำการค้นหาจากข้อสอบทั้งหมดได้ในขณะนี้</p>
                                   <p class="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded border"><strong>Developer Info:</strong> ${error.message}</p>
                               </div>`;
    }
}

// Main execution
export function initializePreviewPage() {
    // Defensively initialize shared components that might rely on elements
    // not present on every page. This prevents an error in one component
    // from breaking the entire page's script execution.
    try {
        initializeMenu();
    } catch (error) {
        // Log the error for debugging but allow the rest of the page to load.
        console.error("Failed to initialize menu, but continuing with page load:", error);
    }

    // Initialize the generator panel logic from its own module
    initializeGenerator();

    const scriptNameEl = document.getElementById('script-name');
    const container = document.getElementById('preview-container');
    const quizSelector = document.getElementById('quiz-selector');
    const searchInput = document.getElementById('search-input');
    const showAnswersToggle = document.getElementById('show-answers-toggle');
    const categorySelector = document.getElementById('category-selector');
    const questionJumper = document.getElementById('question-jumper');

    // --- Modal Setup ---
    const scenarioModal = new ModalHandler('scenario-modal');
    const modalTitle = document.getElementById('scenario-modal-title');
    const modalDescription = document.getElementById('scenario-modal-description');
    const dataInspectorModal = new ModalHandler('data-inspector-modal');
    const dataInspectorTextarea = document.getElementById('data-inspector-content');
    const dataInspectorSaveBtn = document.getElementById('data-inspector-save-btn');
    const dataInspectorCopyBtn = document.getElementById('data-inspector-copy-btn');
    const dataInspectorFeedback = document.getElementById('data-inspector-feedback');
    const exportTxtBtn = document.getElementById('export-txt-btn');
    const exportTxtKeyBtn = document.getElementById('export-txt-key-btn');   // New
    const loadingModal = new ModalHandler('loading-modal');

    let currentlyInspectedItem = null; // To hold a reference to the object being edited

    // --- TXT Export ---
    if (exportTxtBtn) {
        exportTxtBtn.addEventListener('click', () => {
            const selectedOption = quizSelector.options[quizSelector.selectedIndex];
            const quizTitle = selectedOption ? selectedOption.text : 'Exported Quiz';
            const quizId = selectedOption ? selectedOption.value.replace('-data.js', '') : 'custom-quiz';

            if (currentQuizData.length === 0) {
                alert('ไม่มีข้อมูลคำถามให้ส่งออก');
                return;
            }

            loadingModal.open();

            setTimeout(() => {
                try {
                    exportQuizToTxt({
                        id: quizId,
                        title: quizTitle,
                        questions: currentQuizData
                    });
                } catch (error) {
                    console.error("Error during TXT export:", error);
                    alert('เกิดข้อผิดพลาดระหว่างการส่งออกไฟล์ TXT');
                } finally {
                    loadingModal.close();
                }
            }, 50);
        });
    }

    if (exportTxtKeyBtn) {
        exportTxtKeyBtn.addEventListener('click', () => {
            const selectedOption = quizSelector.options[quizSelector.selectedIndex];
            const quizTitle = selectedOption ? selectedOption.text : 'Exported Quiz';
            const quizId = selectedOption ? selectedOption.value.replace('-data.js', '') : 'custom-quiz';

            if (currentQuizData.length === 0) {
                alert('ไม่มีข้อมูลคำถามให้ส่งออก');
                return;
            }

            loadingModal.open();

            setTimeout(() => {
                try {
                    exportQuizToTxt({
                        id: quizId,
                        title: quizTitle,
                        questions: currentQuizData
                    }, true); // Pass true for includeKeyInFilename
                } catch (error) {
                    console.error("Error during TXT export:", error);
                    alert('เกิดข้อผิดพลาดระหว่างการส่งออกไฟล์ TXT');
                } finally {
                    loadingModal.close();
                }
            }, 50);
        });
    }

    // Zoom functionality
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    const zoomLevelDisplay = document.getElementById('zoom-level-display');
    let currentZoomLevel = CONFIG.DEFAULT_ZOOM; // in percent

    function applyZoom() {
        // 100% zoom corresponds to 1rem font size for the container.
        container.style.fontSize = `${currentZoomLevel / 100}rem`;
        zoomLevelDisplay.textContent = `${currentZoomLevel}%`;
        zoomInBtn.disabled = currentZoomLevel >= CONFIG.MAX_ZOOM;
        zoomOutBtn.disabled = currentZoomLevel <= CONFIG.MIN_ZOOM;
    }

    zoomInBtn.addEventListener('click', () => { if (currentZoomLevel < CONFIG.MAX_ZOOM) { currentZoomLevel += CONFIG.ZOOM_STEP; applyZoom(); } });
    zoomOutBtn.addEventListener('click', () => { if (currentZoomLevel > CONFIG.MIN_ZOOM) { currentZoomLevel -= CONFIG.ZOOM_STEP; applyZoom(); } });
    zoomResetBtn.addEventListener('click', () => { currentZoomLevel = CONFIG.DEFAULT_ZOOM; applyZoom(); });
    applyZoom(); // Set initial state

    // --- Jump to Question Functionality ---
    if (questionJumper) {
        questionJumper.addEventListener('change', (event) => {
            const targetId = event.target.value;
            if (!targetId) return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Add a temporary highlight effect for better user feedback
                targetElement.classList.add('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-offset-gray-800', 'transition-all', 'duration-300');
                setTimeout(() => {
                    targetElement.classList.remove('ring-2', 'ring-offset-2', 'ring-blue-500', 'dark:ring-offset-gray-800');
                }, 2500);
            }
        });
    }

    // --- Show/Hide Answers Toggle Functionality ---
    if (showAnswersToggle) {
        // Set default state: ON for preview-data.html, OFF for preview.html
        const isReviewerView = window.location.pathname.endsWith('/preview-data.html');
        showAnswersToggle.checked = isReviewerView;

        // Add event listener to re-render the quiz when the toggle state changes
        showAnswersToggle.addEventListener('change', () => {
            // Re-render the currently displayed data with the new answer visibility
            renderQuizData();
        });
    }

    // Populate the new category filter dropdown
    populateCategoryFilter();

    // Populate dropdown from quizList with categories
    if (typeof quizList !== 'undefined' && Array.isArray(quizList)) {
        // Group quizzes by category
        const groupedQuizzes = quizList.reduce((acc, quiz) => {
            const category = quiz.category || 'อื่น ๆ'; // Use a default category if none is specified
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(quiz);
            return acc;
        }, {});

        // Sort quizzes within each group using natural sort for proper numbering
        Object.keys(groupedQuizzes).forEach(categoryKey => {
            // 'numeric: true' enables natural sorting (e.g., "2" before "10")
            groupedQuizzes[categoryKey].sort((a, b) => a.title.localeCompare(b.title, 'th', { numeric: true, sensitivity: 'base' }));
        });

        // Create optgroups and options, ensuring a consistent order that matches main.js
        const sortedCategoryKeys = Object.keys(groupedQuizzes).sort((a, b) => {
            // --- Custom Sort Logic: Force 'AstronomyReview' to be first ---
            if (a === 'AstronomyReview' && b !== 'AstronomyReview') return -1;
            if (a !== 'AstronomyReview' && b === 'AstronomyReview') return 1;

            // --- Default Sort Logic: Use the 'order' property from data-manager ---
            const orderA = allCategoryDetails[a]?.order || 99;
            const orderB = allCategoryDetails[b]?.order || 99;
            return orderA - orderB;
        });

        sortedCategoryKeys.forEach(categoryKey => {
            const optgroup = document.createElement('optgroup');
            // Use the display title from the imported allCategoryDetails, or the key itself as a fallback
            optgroup.label = allCategoryDetails[categoryKey]?.title || categoryKey;

            groupedQuizzes[categoryKey].forEach(quiz => {
                const option = document.createElement('option');
                option.value = `${quiz.id}-data.js`;
                option.textContent = quiz.title;
                optgroup.appendChild(option);
            });

            quizSelector.appendChild(optgroup);
        });
    }

    async function loadAndRenderQuiz(scriptName) {
        searchInput.value = ''; // Clear search on new quiz selection
        currentQuizData = []; // Clear old data
        const countContainer = document.getElementById('question-count-container');
        if (countContainer) countContainer.innerHTML = '';

        if (!scriptName) {
            scriptNameEl.textContent = 'ไม่ได้ระบุไฟล์สคริปต์';
            container.innerHTML = `<div class="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-700 dark:text-blue-300 p-4 rounded-r-lg" role="alert">
                                   <p class="font-bold">คำแนะนำ</p>
                                   <p>โปรดเลือกชุดข้อสอบจากเมนูด้านบน หรือใช้ช่องค้นหาเพื่อค้นจากข้อสอบทั้งหมด</p>
                               </div>`;
            exportDocxBtn.disabled = true;
            return;
        }

        const scriptPath = `../data/${scriptName}`;
        //scriptNameEl.textContent = `กำลังแสดงผลจาก: ${scriptPath}`;
        container.innerHTML = `<div class="text-center p-8 text-gray-500 dark:text-gray-400">
                                    <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/
svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p>กำลังโหลดข้อมูล...</p>
                                </div>`;

        try {
            // Use the centralized data manager to fetch all questions
            const { allQuestions, scenarios } = await fetchAllQuizData();
            const quizId = scriptName.replace('-data.js', '');
            const quizInfo = quizList.find(q => q.id === quizId);
            const quizTitle = quizInfo?.title; // Use optional chaining for safety

            if (!quizTitle) {
                throw new Error(`Quiz info not found for ID: ${quizId}`);
            }

            // Filter the questions for the selected quiz
            const flattenedData = allQuestions.filter(q => q.sourceQuizTitle === quizTitle);

            // Add scenario info back to each question item for easier rendering
            const dataWithScenarios = flattenedData.map(item => {
                if (item.scenarioId && scenarios.has(item.scenarioId)) {
                    const scenario = scenarios.get(item.scenarioId);
                    return { ...item, scenarioTitle: scenario.title, scenarioDescription: scenario.description };
                }
                return item;
            });

            // Use the data with scenarios directly. Path correction will happen after rendering.
            currentQuizData = dataWithScenarios;
            renderQuizData();
        } catch (error) {
            console.error(`Failed to load or render quiz ${scriptName}:`, error);
            container.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4" role="alert">
                                       <p class="font-bold">เกิดข้อผิดพลาด</p>
                                       <p>ไม่สามารถโหลดข้อมูลสำหรับชุดข้อสอบ <strong>${scriptName}</strong> ได้. (${error.message})</p>
                                   </div>`;
        }
    }

    // --- New Event Listener & Initial Load Logic ---
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (quizSelector.value) {
                // A quiz is selected, filter within it
                renderQuizData();
            } else {
                // No quiz selected, perform global search
                handleGlobalSearch();
            }
        }, CONFIG.SEARCH_DEBOUNCE_MS);
    });

    if (categorySelector) {
        categorySelector.addEventListener('change', () => {
            // Selecting a category implies a global search.
            if (quizSelector.value) {
                quizSelector.value = ''; // Clear the specific quiz selection
            }
            // We don't need to clear the search input, they can be combined.
            handleGlobalSearch(); // Trigger a new global search with the category filter
        });
    }

    quizSelector.addEventListener('change', (event) => {
        const selectedScript = event.target.value;
        const url = new URL(window.location);
        if (selectedScript) {
            if (categorySelector) categorySelector.value = ''; // Reset category dropdown
            url.searchParams.set('script', selectedScript);
            window.history.pushState({}, '', url);
            loadAndRenderQuiz(selectedScript);
        } else {
            url.searchParams.delete('script');
            window.history.pushState({}, '', url);
            currentQuizData = [];
            searchInput.value = '';
            handleGlobalSearch();
        }
    });

    const params = new URLSearchParams(window.location.search);
    const scriptNameFromUrl = params.get('script');

    if (scriptNameFromUrl) {
        quizSelector.value = scriptNameFromUrl;
        loadAndRenderQuiz(scriptNameFromUrl);
    } else {
        quizSelector.value = '';
        handleGlobalSearch();
    }

    // --- Global Scenario Modal Function ---
    // Make it globally accessible for createQuestionElement to use.
    window.showScenarioModal = (title, description, triggerElement) => {
        modalTitle.innerHTML = title || 'ข้อมูลสถานการณ์';
        modalDescription.innerHTML = description || 'ไม่มีคำอธิบาย';
        scenarioModal.open(triggerElement);
    };

    // Make the data inspector modal function globally accessible.
    window.showDataInspectorModal = (data, triggerElement) => {
        if (dataInspectorTextarea) {
            currentlyInspectedItem = data; // Store reference to the original object
            // Pretty-print the JSON data for readability.
            dataInspectorTextarea.value = JSON.stringify(data, null, 2);
            if (dataInspectorFeedback) dataInspectorFeedback.innerHTML = ''; // Clear old feedback
        }
        // We don't need to check for a syntax highlighter, just display the text.
        dataInspectorModal.open(triggerElement);
    };

    // --- Data Inspector Modal Listeners ---
    if (dataInspectorSaveBtn) {
        dataInspectorSaveBtn.addEventListener('click', () => {
            if (!currentlyInspectedItem || !dataInspectorTextarea) return;

            try {
                const newQuestionData = JSON.parse(dataInspectorTextarea.value);

                // Find the index of the original object in the main data array
                const index = currentQuizData.findIndex(q => q === currentlyInspectedItem);

                if (index > -1) {
                    currentQuizData[index] = newQuestionData; // Replace the old object with the new one
                    currentlyInspectedItem = newQuestionData; // Update the reference

                    if (dataInspectorFeedback) {
                        dataInspectorFeedback.innerHTML = `<span class="text-green-500">บันทึกข้อมูลสำเร็จ! กำลังรีเฟรช...</span>`;
                    }

                    setTimeout(() => {
                        dataInspectorModal.close();
                        renderQuizData(); // Re-render the entire list to reflect changes
                    }, 800);

                } else {
                    throw new Error("ไม่พบข้อมูลคำถามเดิมในชุดข้อมูลปัจจุบัน");
                }
            } catch (error) {
                console.error("JSON Parse Error:", error);
                if (dataInspectorFeedback) {
                    dataInspectorFeedback.innerHTML = `<span class="text-red-500">ข้อผิดพลาด: รูปแบบ JSON ไม่ถูกต้อง. (${error.message})</span>`;
                }
            }
        });
    }

    if (dataInspectorCopyBtn) {
        dataInspectorCopyBtn.addEventListener('click', () => {
            if (!dataInspectorTextarea) return;
            navigator.clipboard.writeText(dataInspectorTextarea.value).then(() => {
                if (dataInspectorFeedback) {
                    dataInspectorFeedback.innerHTML = `<span class="text-blue-500">คัดลอกข้อมูลไปยังคลิปบอร์ดแล้ว!</span>`;
                    setTimeout(() => {
                        if (dataInspectorFeedback.innerHTML.includes('คัดลอก')) {
                            dataInspectorFeedback.innerHTML = '';
                        }
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                if (dataInspectorFeedback) {
                    dataInspectorFeedback.innerHTML = `<span class="text-red-500">ไม่สามารถคัดลอกได้</span>`;
                }
            });
        });
    }

    // --- Scroll to Top Button Functionality ---
    const scrollToTopBtn = document.getElementById('scroll-to-top-btn');

    window.addEventListener('scroll', () => {
        // Show button if user has scrolled down 300px
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            scrollToTopBtn.classList.add('opacity-0', 'pointer-events-none');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

}
