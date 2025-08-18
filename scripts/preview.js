const CONFIG = {
    SEARCH_DEBOUNCE_MS: 300,
    MIN_SEARCH_LENGTH: 3,
    ZOOM_STEP: 10,
    MIN_ZOOM: 70,
    MAX_ZOOM: 150,
    DEFAULT_ZOOM: 100,
};

// Centralized category display names to match index.html
const categoryDetails = {
    AstronomyReview: {
        title: "ทบทวน (Review)",
    },
    Astronomy: {
        title: "ดาราศาสตร์ (Astronomy)",
    },
    EarthScience: {
        title: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)",
    },
};

let currentQuizData = []; // Store the full data for the selected quiz
let allQuizzesCache = null; // Cache for all quiz data to avoid re-fetching


// Function to fetch, flatten, and cache data from all quiz files
async function fetchAllQuizData() {
    if (allQuizzesCache) {
        return allQuizzesCache;
    }

    console.log("Fetching all quiz data for the first time...");

    const promises = quizList.map(async (quiz) => {
        const scriptPath = `data/${quiz.id}-data.js`;
        try {
            const response = await fetch(scriptPath);
            if (!response.ok) {
                console.warn(`Could not load ${scriptPath}: ${response.statusText}`);
                return []; // Return empty array for failed fetches
            }
            const scriptText = await response.text();
            const data = new Function(`${scriptText}; if (typeof quizData !== 'undefined') return quizData; if (typeof quizItems !== 'undefined') return quizItems; return undefined;`)();

            if (data && Array.isArray(data)) {
                return data.flatMap(item => flattenQuizDataItem(item, quiz.title));
            }
            return [];
        } catch (error) {
            console.error(`Error processing ${scriptPath}:`, error);
            return []; // Return empty array on error
        }
    });

    const results = await Promise.all(promises);
    allQuizzesCache = results.flat();
    return allQuizzesCache;
}

/**
 * Helper function to flatten a single quiz item (question or scenario) into an array of questions.
 * This centralizes the flattening logic.
 * @param {object} item - The quiz item from the data file.
 * @param {string} sourceTitle - The title of the source quiz.
 * @returns {Array} An array of flattened question objects.
 */
function flattenQuizDataItem(item, sourceTitle) {
    if (item.type === 'scenario' && Array.isArray(item.questions)) {
        return item.questions.map(q => ({
            ...q, scenarioTitle: item.title, scenarioDescription: item.description, sourceQuizTitle: sourceTitle
        }));
    } else if (item.type === 'question' || !item.type) {
        return [{ ...item, sourceQuizTitle: sourceTitle }];
    }
    return [];
}

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
    // Add 'question-card' for PDF page breaks
    questionDiv.className = 'bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 border border-gray-200 dark:border-gray-700 question-card';

    const questionHeader = document.createElement('h2');
    // Use flex to align title and button
    questionHeader.className = 'flex justify-between items-center text-xl font-bold text-gray-800 dark:text-gray-200 mb-3';
    
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `ข้อที่ ${displayIndex}`;
    questionHeader.appendChild(titleSpan);

    // Add "View Scenario" button if the question belongs to one
    if (item.scenarioTitle) {
        const viewScenarioBtn = document.createElement('button');
        viewScenarioBtn.className = 'text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none';
        viewScenarioBtn.textContent = 'ดูข้อมูลสถานการณ์';
        viewScenarioBtn.type = 'button';
        viewScenarioBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering other click events on the header
            window.showScenarioModal(item.scenarioTitle, item.scenarioDescription);
        });
        questionHeader.appendChild(viewScenarioBtn);
    }
    questionDiv.appendChild(questionHeader);

    if (questionHtml) {
        const questionText = document.createElement('div');
        questionText.className = 'text-gray-800 dark:text-gray-300';
        questionText.innerHTML = questionHtml;
        questionDiv.appendChild(questionText);
    }

    const choices = item.choices || item.options; // Handle both 'choices' and 'options' property from data files
    if (choices && Array.isArray(choices)) {
        const choicesList = document.createElement('ol');
        choicesList.className = 'list-decimal list-inside mt-4 space-y-2 text-gray-700 dark:text-gray-400';
        choicesList.type = 'ก';
        choices.forEach(choice => {
            const choiceItem = document.createElement('li');
            // Also replace newlines in choices, just in case
            choiceItem.innerHTML = ` ${highlightText(choice.replace(/\n/g, '<br>'), keyword)}`; // Add space for alignment and highlight
            // Highlight the correct answer
            if (showAnswers && choice === item.answer) {
                choiceItem.classList.add('text-green-600', 'dark:text-green-400', 'font-bold');
            }
            choicesList.appendChild(choiceItem);
        });
        questionDiv.appendChild(choicesList);
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
        sourceInfo.innerHTML = `จาก: <span class="font-semibold">${item.sourceQuizTitle}</span>`;
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

    container.innerHTML = '';
    if (countContainer) {
        countContainer.innerHTML = '';
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
        const allData = await fetchAllQuizData();
        if (countContainer) {
            countContainer.innerHTML = `กำลังค้นหาจากข้อสอบทั้งหมด <span class="font-bold">${allData.length}</span> ข้อ...`;
        }
        currentQuizData = allData;
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
document.addEventListener('DOMContentLoaded', () => {
    const scriptNameEl = document.getElementById('script-name');
    const container = document.getElementById('preview-container');
    const quizSelector = document.getElementById('quiz-selector');
    const searchInput = document.getElementById('search-input');
    const showAnswersToggle = document.getElementById('show-answers-toggle');

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
    zoomOutBtn.addEventListener('click', () => { if (currentZoomLevel < CONFIG.MIN_ZOOM) { currentZoomLevel -= CONFIG.ZOOM_STEP; applyZoom(); } });
    zoomResetBtn.addEventListener('click', () => { currentZoomLevel = CONFIG.DEFAULT_ZOOM; applyZoom(); });
    applyZoom(); // Set initial state

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
            // Use the display title from categoryDetails, or the key itself as a fallback
            optgroup.label = categoryDetails[categoryKey]?.title || categoryKey;
            
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

        const scriptPath = `data/${scriptName}`;
        //scriptNameEl.textContent = `กำลังแสดงผลจาก: ${scriptPath}`;
        container.innerHTML = `<div class="text-center p-8 text-gray-500 dark:text-gray-400">
                                    <svg class="animate-spin h-8 w-8 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p>กำลังโหลดข้อมูล...</p>
                                </div>`;

        try {
            const response = await fetch(scriptPath);
            if (!response.ok) {
                throw new Error(`ไม่สามารถโหลดไฟล์ได้ (${response.status})`);
            }
            const scriptText = await response.text();
            
            // Execute script text in a new function scope to avoid global conflicts
            // This is robust enough to handle variables named `quizData` or `quizItems`.
            const data = new Function(`${scriptText}; if (typeof quizData !== 'undefined') return quizData; if (typeof quizItems !== 'undefined') return quizItems; return undefined;`)();

            if (typeof data !== 'undefined' && Array.isArray(data)) {
                const quizTitle = quizSelector.options[quizSelector.selectedIndex].text;
                const flattenedData = data.flatMap(item => flattenQuizDataItem(item, quizTitle));
                currentQuizData = flattenedData;
                renderQuizData();
            } else {
                throw new Error('ไม่พบตัวแปร quizData หรือ quizItems ที่ถูกต้องในไฟล์');
            }
        } catch (error) {
            console.error('Failed to load or parse quiz script:', error);
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

    // --- Modal Functionality ---
    const modal = document.getElementById('scenario-modal');
    const modalTitle = document.getElementById('scenario-modal-title');
    const modalDescription = document.getElementById('scenario-modal-description');
    const modalCloseBtn = document.getElementById('scenario-modal-close');
    const modalBackdrop = document.getElementById('scenario-modal-backdrop');

    function showScenarioModal(title, description) {
        modalTitle.innerHTML = title || 'ข้อมูลสถานการณ์';
        modalDescription.innerHTML = description || 'ไม่มีคำอธิบาย';
        modal.classList.remove('hidden');
    }

    function hideScenarioModal() {
        modal.classList.add('hidden');
    }

    window.showScenarioModal = showScenarioModal; // Make it globally accessible
    modalCloseBtn.addEventListener('click', hideScenarioModal);
    modalBackdrop.addEventListener('click', hideScenarioModal);

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

});