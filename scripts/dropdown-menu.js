document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('quiz-menu-btn');
    const menuDropdown = document.getElementById('quiz-menu-dropdown');

    // Only run if the core menu elements exist on the page
    if (!menuButton || !menuDropdown) {
        return;
    }

    // Modal elements might not exist on every page, so we get them but don't fail if they are missing.
    const completedQuizModal = document.getElementById('completed-quiz-modal');
    const viewResultsBtn = document.getElementById('completed-view-results-btn');
    const startOverBtn = document.getElementById('completed-start-over-btn');
    const cancelCompletedBtn = document.getElementById('completed-cancel-btn');

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
        const quizPathPrefix = isQuizPage ? './' : './quiz/';
        const getQuizUrl = (id) => `${quizPathPrefix}index.html?id=${id}`;


        // --- Category and Grouping Logic ---
        const categoryDisplayNames = {
            'AstronomyReview': 'ทบทวน (Review)',
            'Astronomy': 'ดาราศาสตร์ (Astronomy)',
            'EarthScience': 'วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)'
        };
        const categoryOrder = ['AstronomyReview', 'Astronomy', 'EarthScience'];
        
        const groupedQuizzes = quizList.reduce((acc, quiz) => {
            const category = quiz.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(quiz);
            return acc;
        }, {});

        // Clear and populate dropdown with categories
        menuContainer.innerHTML = `
            <a href="${homePath}" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-bold transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg">หน้าหลัก</a>
            <hr class="my-1 border-gray-200 dark:border-gray-600">
        `;

        categoryOrder.forEach(categoryKey => {
            if (groupedQuizzes[categoryKey]) {
                const header = document.createElement('div');
                header.className = 'px-4 pt-2 pb-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider';
                header.textContent = categoryDisplayNames[categoryKey] || categoryKey;
                menuContainer.appendChild(header);

                groupedQuizzes[categoryKey].forEach(quiz => {
                    const quizIdFromUrl = new URLSearchParams(quiz.url.split('?')[1]).get('id');
                    const isCurrentQuiz = quizIdFromUrl === currentQuizId;

                    const link = document.createElement('a');
                    link.href = getQuizUrl(quizIdFromUrl);
                    link.className = 'flex items-center justify-between w-full text-left px-4 py-2 text-sm rounded-md transition-all duration-200 transform';

                    // Apply active/inactive styling
                    if (isCurrentQuiz) {
                        link.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'text-blue-700', 'dark:text-blue-300', 'font-bold', 'hover:shadow-lg', 'hover:-translate-y-0.5');
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.classList.add('text-gray-700', 'dark:text-gray-200', 'hover:bg-gray-100', 'dark:hover:bg-gray-700', 'hover:shadow-lg', 'hover:-translate-y-0.5');
                    }

                    // Create title and status elements
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'truncate pr-2';
                    titleSpan.textContent = quiz.title;
                    link.appendChild(titleSpan);

                    const statusSpan = document.createElement('span');
                    statusSpan.className = 'text-xs ml-2 flex-shrink-0 font-mono flex items-center gap-1';
                    link.appendChild(statusSpan);

                    // --- Progress Status Logic ---
                    let isQuizCompleted = false; // Use a block-scoped variable for each link
                    const savedStateJSON = localStorage.getItem(quiz.storageKey);
                    if (savedStateJSON) {
                        try {
                            const savedState = JSON.parse(savedStateJSON);
                            if (savedState && typeof savedState.currentQuestionIndex === 'number' && Array.isArray(savedState.shuffledQuestions) && savedState.shuffledQuestions.length > 0) {
                                const totalQuestions = savedState.shuffledQuestions.length;
                                const questionsDone = savedState.currentQuestionIndex;
                                isQuizCompleted = questionsDone >= totalQuestions;

                                if (isQuizCompleted && typeof savedState.score === 'number') {
                                    // Completed state
                                    statusSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg> <span>${savedState.score}/${totalQuestions}</span>`;
                                    statusSpan.classList.add('text-green-600', 'dark:text-green-500');
                                } else if (questionsDone > 0) {
                                    // In-progress state
                                    const progress = Math.round((questionsDone / totalQuestions) * 100);
                                    statusSpan.textContent = `${progress}%`;
                                    statusSpan.classList.add('text-blue-600', 'dark:text-blue-400');
                                }
                            }
                        } catch (e) {
                            console.error(`Error parsing saved state for ${quiz.storageKey}:`, e);
                        }
                    }

                    // Add click listener to handle completed quizzes
                    link.addEventListener('click', (event) => {
                        // If a quiz is marked as completed, we intercept the click.
                        if (isQuizCompleted) {
                            event.preventDefault();

                            // If the "Completed Quiz" modal exists on the current page, show it.
                            if (completedQuizModal && window.AppUtils) {
                                activeQuizUrl = link.href;
                                activeStorageKey = quiz.storageKey;
                                window.AppUtils.showModal(completedQuizModal);
                            } else {
                                // If the modal doesn't exist (e.g., we are on a different quiz page),
                                // navigate directly to view the results of the clicked quiz.
                                const separator = link.href.includes('?') ? '&' : '?';
                                window.location.href = `${link.href}${separator}action=view_results`;
                            }
                        }
                    });

                    menuContainer.appendChild(link);
                });
            }
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
            if (window.AppUtils) window.AppUtils.hideModal(completedQuizModal);
        });
    }
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            if (activeStorageKey) localStorage.removeItem(activeStorageKey);
            if (activeQuizUrl) window.location.href = activeQuizUrl;
            if (window.AppUtils) window.AppUtils.hideModal(completedQuizModal);
        });
    }
    if (cancelCompletedBtn) cancelCompletedBtn.addEventListener('click', () => {
        if (window.AppUtils) window.AppUtils.hideModal(completedQuizModal);
    });
});