document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('quiz-menu-btn');
    const menuDropdown = document.getElementById('quiz-menu-dropdown');

    // Only run if the menu elements exist on the page
    if (!menuButton || !menuDropdown) {
        return;
    }

    const menuContainer = menuDropdown.querySelector('.p-2');

    // Check if the quiz list data is available from 'quizzes-list.js'
    if (menuContainer && typeof quizList !== 'undefined') {
        // Get the current quiz ID from the URL
        const currentQuizId = new URLSearchParams(window.location.search).get('id');

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
            <a href="../index.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-bold">หน้าหลัก</a>
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
                    link.href = `index.html?id=${quizIdFromUrl}`;
                    link.className = 'flex items-center justify-between w-full text-left px-4 py-2 text-sm rounded-md transition-colors duration-150';

                    // Apply active/inactive styling
                    if (isCurrentQuiz) {
                        link.classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'text-blue-700', 'dark:text-blue-300', 'font-bold');
                        link.setAttribute('aria-current', 'page');
                    } else {
                        link.classList.add('text-gray-700', 'dark:text-gray-200', 'hover:bg-gray-100', 'dark:hover:bg-gray-700');
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
                    const savedStateJSON = localStorage.getItem(quiz.storageKey);
                    if (savedStateJSON) {
                        try {
                            const savedState = JSON.parse(savedStateJSON);
                            if (savedState && typeof savedState.currentQuestionIndex === 'number' && Array.isArray(savedState.shuffledQuestions) && savedState.shuffledQuestions.length > 0) {
                                const totalQuestions = savedState.shuffledQuestions.length;
                                const questionsDone = savedState.currentQuestionIndex;
                                const isCompleted = questionsDone >= totalQuestions;

                                if (isCompleted && typeof savedState.score === 'number') {
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

                    menuContainer.appendChild(link);
                });
            }
        });
    }

    // --- Menu Toggle Logic ---
    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        menuDropdown.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
        if (!menuDropdown.classList.contains('hidden') && !menuDropdown.contains(event.target) && !menuButton.contains(event.target)) {
            menuDropdown.classList.add('hidden');
        }
    });
});