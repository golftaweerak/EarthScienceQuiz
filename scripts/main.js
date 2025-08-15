document.addEventListener('DOMContentLoaded', () => {
    // Map category names to their container elements for easier management and scalability
    const quizContainers = {
        Astronomy: document.getElementById('astronomy-quizzes'),
        EarthScience: document.getElementById('earth-science-quizzes'),
        AstronomyReview: document.getElementById('astronomy-review-quizzes'),
    };

    /**
     * Updates the progress bar and text on a quiz card based on localStorage data.
     * @param {HTMLElement} card The card element to update.
     * @param {object} quiz The quiz data object.
     */
    function updateCardProgress(card, quiz) {
        const savedStateJSON = localStorage.getItem(quiz.storageKey);
        if (!savedStateJSON) return; // No saved state, do nothing.

        try {
            const savedState = JSON.parse(savedStateJSON);
            // Validate the saved state structure to prevent errors
            if (!savedState || typeof savedState.currentQuestionIndex !== 'number' || !Array.isArray(savedState.shuffledQuestions)) {
                return;
            }

            const totalQuestions = savedState.shuffledQuestions.length;
            if (totalQuestions === 0) return;

            const questionsDone = savedState.currentQuestionIndex;
            const isCompleted = questionsDone >= totalQuestions;

            const progressText = card.querySelector('.progress-text');
            const progressPercentage = card.querySelector('.progress-percentage');
            const progressBar = card.querySelector('.progress-bar');

            if (!progressText || !progressPercentage || !progressBar) return;

            // Clean up all possible color classes first to ensure a clean slate
            progressBar.classList.remove('bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500');

            if (isCompleted && typeof savedState.score === 'number') {
                progressText.textContent = `ทำเสร็จแล้ว`;
                progressPercentage.textContent = `คะแนน: ${savedState.score}/${totalQuestions}`;
                progressBar.style.width = '100%';
                progressBar.classList.add('bg-green-500'); // Completed
            } else {
                // Progress is based on the number of completed questions
                const progress = Math.round((questionsDone / totalQuestions) * 100);
                const attemptedQuestions = savedState.userAnswers.filter(Boolean).length;
                const currentScore = savedState.score || 0;

                progressText.textContent = attemptedQuestions > 0 ? `คะแนน: ${currentScore}/${attemptedQuestions}` : `กำลังทำข้อที่ ${questionsDone + 1}`;

                progressPercentage.textContent = `${progress}%`;
                progressBar.style.width = `${progress}%`;

                // Add the correct color class based on progress percentage
                if (progress < 40) {
                    progressBar.classList.add('bg-red-500'); // Low progress
                } else if (progress < 70) {
                    progressBar.classList.add('bg-yellow-500'); // Medium progress
                } else {
                    progressBar.classList.add('bg-blue-500'); // High progress
                }
            }
        } catch (e) {
            console.error(`Error parsing saved state for ${quiz.storageKey}:`, e);
        }
    }

    /**
     * Creates the inner HTML for a quiz card.
     * @param {object} quiz The quiz data object.
     * @returns {string} The HTML string for the card.
     */
    function createQuizCardHTML(quiz) {
        return `
            <div class="flex items-start justify-between">
                <div class="flex items-center min-w-0">
                    <div class="bg-white ${quiz.borderColor} border-4 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl mr-4 flex-shrink-0">
                        <img src="${quiz.icon}" alt="${quiz.altText}" class="h-8 w-8 object-contain">
                    </div>
                    <div class="overflow-hidden">
                        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200  font-kanit">${quiz.title}</h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${quiz.description}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">จำนวน ${quiz.amount}</p>
                    </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </div>
            <div class="progress-container mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                <div class="flex justify-between mb-1">
                    <span class="progress-text text-sm font-medium text-gray-500 dark:text-gray-400">ยังไม่ได้เริ่ม</span>
                    <span class="progress-percentage text-sm font-medium text-blue-700 dark:text-blue-500"></span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600">
                    <div class="progress-bar bg-blue-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        `;
    }

    /**
     * Creates a complete quiz card element, including its progress state.
     * @param {object} quiz The quiz data object.
     * @param {number} index The index of the quiz for animation delay.
     * @returns {HTMLElement} The fully constructed card element.
     */
    function createQuizCard(quiz, index) {
        const card = document.createElement('a');
        card.href = quiz.url;
        card.className = 'group block relative overflow-hidden shine-effect bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg dark:hover:shadow-blue-500/20 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 card-animation hover:-translate-y-1';
        card.style.animationDelay = `${index * 50}ms`;
        card.innerHTML = createQuizCardHTML(quiz);

        // Update the card's progress based on saved data
        updateCardProgress(card, quiz);
        return card;
    }

    // --- Main Logic to Populate Quiz Cards ---
    // Clear loading placeholders before populating
    Object.values(quizContainers).forEach(container => {
        if (container) {
            container.innerHTML = ''; // Clear the loading indicator
        }
    });

    if (typeof quizList !== 'undefined') {
        quizList.forEach((quiz, index) => {
            const container = quizContainers[quiz.category];
            if (container) {
                const card = createQuizCard(quiz, index);
                container.appendChild(card);
            }
        });
    } else {
        console.error("quizList is not defined. Make sure data/quizzes-list.js is loaded correctly before main.js.");
    }

    // --- Hide Sections if they are empty ---
    Object.keys(quizContainers).forEach(categoryKey => {
        const container = quizContainers[categoryKey];
        // Construct the section ID from the category key (e.g., AstronomyReview -> astronomy-review-section)
        const sectionId = `${categoryKey.charAt(0).toLowerCase() + categoryKey.slice(1).replace(/([A-Z])/g, '-$1').toLowerCase()}-section`;
        const section = document.getElementById(sectionId);
        if (section && container && container.children.length === 0) {
            section.classList.add('hidden');
        }
    });

    // --- Accordion Logic ---
    const accordions = document.querySelectorAll('.section-accordion');
    accordions.forEach((accordion) => {
        const toggle = accordion.querySelector('.section-toggle');
        const content = accordion.querySelector('.section-content');
        const icon = accordion.querySelector('.chevron-icon');

        if (toggle && content && icon) {
            toggle.addEventListener('click', () => {
                const isOpen = accordion.classList.toggle('open');
                content.classList.toggle('grid-rows-[1fr]', isOpen);
                content.classList.toggle('grid-rows-[0fr]', !isOpen);
                icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
            });
        }
    });

    // --- Set current year in footer ---
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Back to Top Button Logic ---
    const backToTopButton = document.createElement('button');
    backToTopButton.id = 'back-to-top';
    backToTopButton.title = 'กลับไปด้านบน';
    backToTopButton.className = 'fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 opacity-0 translate-y-4 pointer-events-none';
    backToTopButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" /></svg>`;
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopButton.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
        } else {
            backToTopButton.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // --- Random Quiz Button Logic ---
    const randomQuizBtn = document.getElementById('random-quiz-btn');
    if (randomQuizBtn) {
        randomQuizBtn.addEventListener('click', () => {
            if (typeof quizList !== 'undefined' && quizList.length > 0) {
                const randomIndex = Math.floor(Math.random() * quizList.length);
                const randomQuiz = quizList[randomIndex];

                if (randomQuiz && randomQuiz.url) {
                    // Apply fade-out transition before navigating for a smooth experience
                    document.body.classList.add('fade-out');
                    setTimeout(() => {
                        window.location.href = randomQuiz.url;
                    }, 300); // Match CSS animation duration
                }
            }
        });
    }
 });