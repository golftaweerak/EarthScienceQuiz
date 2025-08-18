document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('quiz-menu-btn');
    const menuDropdown = document.getElementById('quiz-menu-dropdown');
    
    // Only run if the core menu elements exist on the page
    if (!menuButton || !menuDropdown) {
        return;
    }

    /**
     * Retrieves the progress state of a quiz from localStorage.
     * This function is aligned with the one in main.js for consistency.
     * @param {string} storageKey - The key for the quiz in localStorage.
     * @param {number} totalQuestions - The total number of questions in the quiz.
     * @returns {object} An object containing progress details.
     */
    function getQuizProgress(storageKey, totalQuestions) {
        const defaultState = {
            score: 0,
            percentage: 0,
            progressTextColor: "text-gray-500 dark:text-gray-400",
            isFinished: false,
            hasProgress: false,
        };

        if (totalQuestions <= 0) return defaultState;

        try {
            const savedStateJSON = localStorage.getItem(storageKey);
            if (!savedStateJSON) return defaultState;

            const savedState = JSON.parse(savedStateJSON);
            if (!savedState || typeof savedState.currentQuestionIndex !== "number") return defaultState;

            const answeredCount = savedState.currentQuestionIndex;
            const score = savedState.score || 0;
            const isFinished = answeredCount >= totalQuestions;
            const percentage = Math.round((answeredCount / totalQuestions) * 100);

            if (isFinished) {
                return {
                    score,
                    percentage,
                    progressTextColor: "text-green-600 dark:text-green-400",
                    isFinished: true,
                    hasProgress: true,
                };
            } else {
                return {
                    score,
                    percentage,
                    progressTextColor: "text-blue-600 dark:text-blue-400",
                    isFinished: false,
                    hasProgress: true,
                };
            }
        } catch (e) {
            console.error(`Could not parse saved state for ${storageKey}:`, e);
            return defaultState;
        }
    }

    // Define Category Details for consistent display (aligned with main.js)
    const categoryDetails = {
        AstronomyReview: { title: "ทบทวน (Review)", order: 1 },
        Astronomy: { title: "ดาราศาสตร์ (Astronomy)", order: 2 },
        EarthScience: { title: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)", order: 3 },
    };

    // --- Modal Setup ---
    // Use the new ModalHandler for the "Completed Quiz" modal.
    const completedModal = new ModalHandler('completed-quiz-modal');
    const viewResultsBtn = document.getElementById('completed-view-results-btn');
    const startOverBtn = document.getElementById('completed-start-over-btn');

    let activeQuizUrl = ''; // To store the URL for the modal actions
    let activeStorageKey = ''; // To store the storage key for the modal actions

    const menuContainer = menuDropdown.querySelector('.p-2');

    // Check if the quiz list data is available from 'quizzes-list.js'
    if (menuContainer && typeof quizList !== 'undefined') {
        // Get the current quiz ID from the URL
        const currentQuizId = new URLSearchParams(window.location.search).get('id');
        
        // --- Dynamic Pathing Logic ---
        // Determine correct paths based on the current page location
        const isQuizPage = window.location.pathname.includes('/quiz/');
        const homePath = isQuizPage ? '../index.html' : './index.html';
        const aboutPath = isQuizPage ? '../about.html' : './about.html';
        const previewPath = isQuizPage ? '../preview.html' : './preview.html';
        const assetPathPrefix = isQuizPage ? '../' : './';
        const quizPathPrefix = isQuizPage ? './' : './quiz/';
        const getQuizUrl = (id) => `${quizPathPrefix}index.html?id=${id}`;

        // --- Category and Grouping Logic ---
        const groupedQuizzes = quizList.reduce((acc, quiz) => {
            const category = quiz.category || "Uncategorized";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(quiz);
            return acc;
        }, {});
        
        const sortedCategories = Object.keys(groupedQuizzes).sort((a, b) => {
            const orderA = categoryDetails[a]?.order || 99;
            const orderB = categoryDetails[b]?.order || 99;
            return orderA - orderB;
        });

        // --- Build Menu HTML ---
        let menuHTML = `
            <a href="${homePath}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">หน้าหลัก</a>
            <a href="${previewPath}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">แสดงตัวอย่างข้อสอบ</a>
            <a href="${aboutPath}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">เกี่ยวกับผู้จัดทำ</a>
            <hr class="my-2 border-gray-200 dark:border-gray-600">
            <div id="menu-quiz-list" class="space-y-px">
        `;

        sortedCategories.forEach(categoryKey => {
            const quizzes = groupedQuizzes[categoryKey];
            const details = categoryDetails[categoryKey];
            if (!details || !quizzes || quizzes.length === 0) return;

            menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${details.title}</h4>`;

            quizzes.forEach(quiz => {
                const quizIdFromUrl = new URLSearchParams(quiz.url.split('?')[1]).get('id');
                const isCurrentQuiz = quizIdFromUrl === currentQuizId;
                const linkUrl = getQuizUrl(quizIdFromUrl);

                const totalQuestions = parseInt(quiz.amount, 10) || 0;
                const progress = getQuizProgress(quiz.storageKey, totalQuestions);

                // Determine vertical alignment: center if finished, top-align otherwise.
                const alignmentClass = progress.hasProgress ? 'items-center' : 'items-start';

                const progressDetailsHTML = progress.hasProgress
                    ? `<div>
                           <span class="text-xs font-medium ${progress.progressTextColor}">คะแนน: ${progress.score}/${totalQuestions} (${progress.percentage}%)</span>
                       </div>`
                    : "";

                const activeClasses = isCurrentQuiz ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700';

                menuHTML += `
                    <a href="${linkUrl}" data-storage-key="${quiz.storageKey}" data-total-questions="${totalQuestions}" class="quiz-menu-item block px-4 py-2 text-sm rounded-md ${activeClasses}">
                        <div class="flex ${alignmentClass} gap-3">
                            <div class="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-white">
                                <img src="${assetPathPrefix}${quiz.icon}" alt="${quiz.title} icon" class="h-4 w-4">
                            </div>
                            <div class="min-w-0">
                                <span>${quiz.title}</span>
                                ${progressDetailsHTML}
                            </div>
                        </div>
                    </a>
                `;
            });
        });

        // Add Custom Quizzes
        const savedQuizzesJSON = localStorage.getItem("customQuizzesList");
        const savedQuizzes = savedQuizzesJSON ? JSON.parse(savedQuizzesJSON) : [];

        if (savedQuizzes.length > 0) {
            menuHTML += `<hr class="my-2 border-gray-200 dark:border-gray-600">`;
            menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">แบบทดสอบที่สร้างเอง</h4>`;

            savedQuizzes.forEach((quiz) => {
                const totalQuestions = quiz.questions.length;
                const progress = getQuizProgress(quiz.storageKey, totalQuestions);
                const linkUrl = getQuizUrl(quiz.customId);
                const isCurrentQuiz = quiz.customId === currentQuizId;

                // Determine vertical alignment: center if finished, top-align otherwise.
                const alignmentClass = progress.hasProgress ? 'items-center' : 'items-start';

                const progressDetailsHTML = progress.hasProgress
                    ? `<div><span class="text-xs font-medium ${progress.progressTextColor}">คะแนน: ${progress.score}/${totalQuestions} (${progress.percentage}%)</span></div>`
                    : "";
                
                const activeClasses = isCurrentQuiz ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700';

                menuHTML += `
                    <a href="${linkUrl}" data-storage-key="${quiz.storageKey}" data-total-questions="${quiz.questions.length}" class="quiz-menu-item block px-4 py-2 text-sm rounded-md ${activeClasses}">
                        <div class="flex ${alignmentClass} gap-3">
                            <div class="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-white">
                                <img src="${assetPathPrefix}assets/icons/study.png" alt="ไอคอนแบบทดสอบที่สร้างเอง" class="h-4 w-4">
                            </div>
                            <div class="min-w-0">
                                <span>${quiz.title}</span>
                                ${progressDetailsHTML}
                            </div>
                        </div>
                    </a>
                `;
            });
        }

        menuHTML += `</div>`; // Close menu-quiz-list
        menuContainer.innerHTML = menuHTML;

        // Add a single event listener to the container for all quiz items (Event Delegation).
        // This is more efficient than adding a listener to every single link and works
        // correctly with dynamically generated HTML.
        menuContainer.addEventListener('click', (event) => {
            // Find the main link element, even if a child (like the icon or title) was clicked.
            const quizLink = event.target.closest('.quiz-menu-item');

            // If the click was not on a quiz item, do nothing.
            if (!quizLink) {
                return;
            }

            const storageKey = quizLink.dataset.storageKey;
            const totalQuestions = parseInt(quizLink.dataset.totalQuestions, 10) || 0;

            // If the link doesn't have the necessary data, let it navigate normally.
            if (!storageKey || totalQuestions === 0) {
                return;
            }

            const progress = getQuizProgress(storageKey, totalQuestions);

            // If the quiz is completed, prevent navigation and show the modal instead.
            if (progress.isFinished) {
                event.preventDefault();
                activeQuizUrl = quizLink.href;
                activeStorageKey = storageKey;
                completedModal.open(quizLink); // Pass the link as the trigger for focus restoration.
            }
            // If the quiz is not finished, the default 'a' tag behavior (navigation) will proceed.
        });
    }

    // --- Menu Toggle Logic ---
    // Add transform-origin for better animation
    if (menuDropdown) {
        menuDropdown.style.transformOrigin = 'top left';
    }

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const isHidden = menuDropdown.classList.contains('hidden');
        if (isHidden) {
            menuDropdown.classList.remove('hidden');
            menuDropdown.classList.remove('anim-dropdown-out');
            menuDropdown.classList.add('anim-dropdown-in');
        } else {
            menuDropdown.classList.remove('anim-dropdown-in');
            menuDropdown.classList.add('anim-dropdown-out');
            setTimeout(() => menuDropdown.classList.add('hidden'), 150); // Match animation duration
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!menuDropdown.classList.contains('hidden') && !menuDropdown.contains(event.target) && !menuButton.contains(event.target)) {
            menuDropdown.classList.remove('anim-dropdown-in');
            menuDropdown.classList.add('anim-dropdown-out');
            setTimeout(() => menuDropdown.classList.add('hidden'), 150);
        }
    });

    // --- Completed Quiz Modal Logic ---
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
    // The cancel button is now handled automatically by ModalHandler via the `data-modal-close` attribute.
});