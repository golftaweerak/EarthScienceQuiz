import { initializeMenu } from './menu-handler.js';
import { ModalHandler } from './modal-handler.js';
import { initializeDarkMode } from './dark-mode.js';
import { initializeDropdown } from './dropdown.js';
import { quizList } from '../data/quizzes-list.js';
import { fetchAllQuizData, categoryDetails as allCategoryDetails } from './data-manager.js';
import { subCategoryData,} from '../data/sub-category-data.js';

const CONFIG = {
    SEARCH_DEBOUNCE_MS: 300,
    MIN_SEARCH_LENGTH: 3,
    ZOOM_STEP: 10,
    MIN_ZOOM: 70,
    MAX_ZOOM: 150,
    DEFAULT_ZOOM: 100,
};

let currentQuizData = []; // Store the full data for the selected quiz to be rendered

// Helper function to highlight keywords in a text
function highlightText(text, keyword) {
    if (!keyword || !text) {
        return text;
    }
    // Escape special characters in the keyword for use in a regular expression
    const escapedKeyword = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedKeyword, 'gi');
    return text.replace(regex, (match) => `<mark class="bg-yellow-200 dark:bg-yellow-700 rounded">${match}</mark>`);
}

// Helper function to create a single question element. This promotes reusability.
function createQuestionElement(item, displayIndex, keyword) {
    // Check the state of the "Show Answers" toggle
    const showAnswers = document.getElementById('show-answers-toggle')?.checked;

    // Replace newline characters with <br> tags for proper HTML rendering
    const questionHtml = item.question ? highlightText(item.question.replace(/\n/g, '<br>'), keyword) : '';
    const explanationHtml = item.explanation ? highlightText(item.explanation.replace(/\n/g, '<br>'), keyword) : '';

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
            numeralSpan.className = 'font-semibold';
            numeralSpan.textContent = `${thaiNumerals[index] || (index + 1)}.`;

            const choiceTextDiv = document.createElement('div');
            choiceTextDiv.innerHTML = highlightText(choice.replace(/\n/g, '<br>'), keyword);

            // Highlight the correct answer
            if (showAnswers && choice === item.answer) {
                choiceWrapper.classList.add('text-green-600', 'dark:text-green-400', 'font-bold');
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
            // Handle both string and object structures for display
            const subCat = item.subCategory;
            const subCatDisplay = (typeof subCat === 'object' && subCat.main) 
                ? (subCat.specific || subCat.main) 
                : (typeof subCat === 'string' ? subCat : '');
            if (subCatDisplay) {
                // Use a line break for better readability instead of a pipe separator.
                subCategoryText = `หมวดหมู่: <span class="font-semibold">${highlightText(subCatDisplay, keyword)}</span><br>`;
            }
        }
        sourceInfo.innerHTML = `${subCategoryText}จาก: <span class="font-semibold">${highlightText(item.sourceQuizTitle, keyword)}</span>`;
        questionDiv.appendChild(sourceInfo);
    }

    return questionDiv;
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
        const filteredData = filterKeyword ? currentQuizData.filter(item => {
            const questionText = item.question?.toLowerCase() || '';
            const choicesText = (item.choices || item.options)?.join(' ').toLowerCase() || '';
            const explanationText = item.explanation?.toLowerCase() || '';
            // Also search in scenario title and description
            const scenarioTitleText = item.scenarioTitle?.toLowerCase() || '';
            const scenarioDescriptionText = item.scenarioDescription?.toLowerCase() || '';
            const sourceQuizTitleText = item.sourceQuizTitle?.toLowerCase() || '';

            return questionText.includes(filterKeyword) ||
                   choicesText.includes(filterKeyword) ||
                   explanationText.includes(filterKeyword) ||
                   scenarioTitleText.includes(filterKeyword) ||
                   scenarioDescriptionText.includes(filterKeyword) ||
                   sourceQuizTitleText.includes(filterKeyword);
        }) : currentQuizData;

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
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        } else {
            console.warn("KaTeX auto-render script not loaded yet.");
        }

    } else if (document.getElementById('quiz-selector').value) {
        // This case handles when a script was selected but it was empty or invalid
        container.innerHTML = `<div class="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-700 dark:text-yellow-300 p-4 rounded-r-lg" role="alert">
                                   <p class="font-bold">ไม่พบข้อมูล</p>
                                   <p>ไม่พบตัวแปร <strong>quizData</strong> หรือ <strong>quizItems</strong> ในไฟล์สคริปต์ที่ระบุ. โปรดตรวจสอบว่าไฟล์มีตัวแปรนี้อยู่</p>
                               </div>`;
    }
}

// Handler for global search across all quizzes
async function handleGlobalSearch() {
    const searchInput = document.getElementById('search-input');
    const container = document.getElementById('preview-container');
    const keyword = searchInput.value.trim();
    const countContainer = document.getElementById('question-count-container');

    if (countContainer) {
        countContainer.innerHTML = '';
    }

    if (keyword.length < CONFIG.MIN_SEARCH_LENGTH) {
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
        // Use the centralized data manager to fetch all questions
        const { allQuestions, scenarios } = await fetchAllQuizData();
        if (countContainer) {
            countContainer.innerHTML = `กำลังค้นหาจากข้อสอบทั้งหมด <span class="font-bold">${allQuestions.length}</span> ข้อ...`;
        }

        // Add scenario info back to each question item for easier rendering
        const allDataWithScenarios = allQuestions.map(item => {
            if (item.scenarioId && scenarios.has(item.scenarioId)) {
                const scenario = scenarios.get(item.scenarioId);
                return { ...item, scenarioTitle: scenario.title, scenarioDescription: scenario.description };
            }
            return item;
        });

        // Use the data with scenarios directly. Path correction will happen after rendering.
        currentQuizData = allDataWithScenarios;
        renderQuizData(); // renderQuizData will use the keyword from the input to filter
    } catch (error) {
        console.error("Global search failed:", error);
        container.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-r-lg" role="alert">
                                   <p class="font-bold">เกิดข้อผิดพลาด</p>
                                   <p>ไม่สามารถทำการค้นหาจากข้อสอบทั้งหมดได้ในขณะนี้</p>
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

    const scriptNameEl = document.getElementById('script-name');
    const container = document.getElementById('preview-container');
    const quizSelector = document.getElementById('quiz-selector');
    const searchInput = document.getElementById('search-input');
    const showAnswersToggle = document.getElementById('show-answers-toggle');
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

    let currentlyInspectedItem = null; // To hold a reference to the object being edited

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

        // Sort quizzes within each group alphabetically by title
        Object.keys(groupedQuizzes).forEach(categoryKey => {
            groupedQuizzes[categoryKey].sort((a, b) => a.title.localeCompare(b.title, 'th'));
        });

        // Create optgroups and options, ensuring a consistent order by sorting category keys
        const categoryOrder = ['AstronomyReview']; // Define which category should come first.

        Object.keys(groupedQuizzes).sort((a, b) => {
            const aIsFirst = categoryOrder.includes(a);
            const bIsFirst = categoryOrder.includes(b);

            if (aIsFirst && !bIsFirst) {
                return -1; // a comes before b
            }
            if (!aIsFirst && bIsFirst) {
                return 1; // b comes before a
            }
            return a.localeCompare(b); // Otherwise, sort alphabetically
        }).forEach(categoryKey => {
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
            return;
        }

        const scriptPath = `../data/${scriptName}`;
        //scriptNameEl.textContent = `กำลังแสดงผลจาก: ${scriptPath}`;
        container.innerHTML = `<div class="text-center p-8 text-gray-500 dark:text-gray-400">
                                    <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            container.innerHTML = `<div class="bg-red-100 dark:bg-red-900/50 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-r-lg" role="alert">
                                       <p class="font-bold">เกิดข้อผิดพลาด</p>
                                       <p>ไม่สามารถโหลดหรือประมวลผลไฟล์ <strong>${scriptPath}</strong> ได้. โปรดตรวจสอบว่าไฟล์ถูกต้องและไม่มีข้อผิดพลาด. (${error.message})</p>
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

    quizSelector.addEventListener('change', (event) => {
        const selectedScript = event.target.value;
        const url = new URL(window.location);
        if (selectedScript) {
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
        panelPreview.classList.toggle('hidden', selectedTab !== tabPreview);
        panelGenerator.classList.toggle('hidden', selectedTab !== tabGenerator);
    }

    if (tabPreview && tabGenerator) {
        tabPreview.addEventListener('click', () => switchTab(tabPreview));
        tabGenerator.addEventListener('click', () => switchTab(tabGenerator));
    }

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

    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', () => {
            const questionCount = document.querySelectorAll('.gen-question-block:not(.gen-sub-question-block .gen-question-block)').length + 1;
            const newQuestionBlock = document.createElement('div');
            newQuestionBlock.className = 'gen-question-block bg-white dark:bg-gray-800/70 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden';
            newQuestionBlock.innerHTML = createQuestionBlockHTML(questionCount, false);
            itemsContainer.appendChild(newQuestionBlock);
            generateCode();
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
            generateCode();
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
                generateCode(); // Re-generate code after any change
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
                    generateCode();
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
            generateCode(); // Re-generate code on any change
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
                mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                    .then(result => { 
                        const parsedQuestions = parseDocxContent(result.value || '');
                        if (parsedQuestions.length > 0) {
                            populateGenerator(parsedQuestions); 
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
 
     function populateGenerator(items) {
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
         generateCode(); // Update the output code
     }

    // Generate code on form input
    function generateCode() {
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

    let generatorDebounceTimer;
    if (generatorForm) {
        generatorForm.addEventListener('input', () => {
            clearTimeout(generatorDebounceTimer);
            // Use a slightly longer debounce time for the generator as it's a heavier operation
            generatorDebounceTimer = setTimeout(generateCode, 500);
        });
        // Generate code initially to populate fields if there's any default content
        generateCode();
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