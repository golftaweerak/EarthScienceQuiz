document.addEventListener('DOMContentLoaded', () => {
    // --- 0. Cache Modal Elements ---
    const resetConfirmModal = document.getElementById('reset-confirm-modal');
    const modalContent = resetConfirmModal ? resetConfirmModal.querySelector('.modal-content') : null;
    const resetConfirmBtn = document.getElementById('reset-confirm-btn');
    const resetCancelBtn = document.getElementById('reset-cancel-btn');

    // NEW: Cache completed quiz modal elements
    const completedQuizModal = document.getElementById('completed-quiz-modal');
    const completedModalContent = completedQuizModal ? completedQuizModal.querySelector('.modal-content') : null;
    const viewResultsBtn = document.getElementById('completed-view-results-btn');
    const startOverBtn = document.getElementById('completed-start-over-btn');
    const cancelCompletedBtn = document.getElementById('completed-cancel-btn');
    let activeQuizUrl = ''; // To store the URL for the modal actions
    let activeStorageKey = ''; // To store the storage key for the modal actions
    let confirmCallback = null; // To store the action to perform on confirmation

    // --- 1. Define Category Details for display ---
    const categoryDetails = {
        AstronomyReview: {
            title: "ทบทวน (Review)",
            icon: "./assets/icons/study.png",
            order: 1,
            color: 'border-sky-500', // A bright, academic blue
        },
        Astronomy: {
            title: "ดาราศาสตร์ (Astronomy)",
            icon: "./assets/icons/astronomy.png",
            order: 2,
            color: 'border-indigo-500', // A deep, space-like indigo
        },
        EarthScience: {
            title: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)",
            icon: "./assets/icons/earth.png",
            order: 3,
            color: 'border-teal-500', // A rich, natural teal
        },
        // You can add more categories here in the future
    };

    // Map border colors to their corresponding shadow colors for the hover effect
    const shadowColorMap = {
        'border-sky-500': 'hover:shadow-sky-500/40',
        'border-indigo-500': 'hover:shadow-indigo-500/40',
        'border-teal-500': 'hover:shadow-teal-500/40',
    };

    // --- 2. Group Quizzes by Category ---
    const groupedQuizzes = quizList.reduce((acc, quiz) => {
        const category = quiz.category || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(quiz);
        return acc;
    }, {});

    // --- 3. Get Container and Generate HTML ---
    const container = document.getElementById('quiz-categories-container');
    if (!container) {
        console.error('Category container not found!');
        return;
    }
    container.innerHTML = ''; // Clear any existing content or placeholders

    // Sort categories based on the 'order' property for consistent display
    const sortedCategories = Object.keys(groupedQuizzes).sort((a, b) => {
        const orderA = categoryDetails[a]?.order || 99;
        const orderB = categoryDetails[b]?.order || 99;
        return orderA - orderB;
    });

    // --- 4. Create and Append Category Sections ---
    sortedCategories.forEach(categoryKey => {
        const quizzes = groupedQuizzes[categoryKey];
        const details = categoryDetails[categoryKey];

        if (!details) {
            console.warn(`Details for category "${categoryKey}" not found. Skipping.`);
            return;
        }

        const section = document.createElement('section');
        section.className = 'section-accordion bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden';
        
        const toggleHeader = document.createElement('div');
        toggleHeader.className = 'section-toggle flex justify-between items-center cursor-pointer p-4';
        const sectionBorderColor = details.color || 'border-blue-600'; // Use category color
        toggleHeader.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center font-kanit">
                <div class="section-icon-container flex-shrink-0 h-12 w-12 mr-3 rounded-full flex items-center justify-center border-4 ${sectionBorderColor} bg-white dark:bg-white transition-all duration-300">
                    <img src="${details.icon}" alt="${details.title} Icon" class="h-8 w-8">
                </div>
                ${details.title}
            </h2>
            <svg class="chevron-icon h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        `;

        const contentDiv = document.createElement('div');
        // This is the collapsible part
        contentDiv.className = 'section-content grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out';
        
        const innerContentWrapper = document.createElement('div');
        innerContentWrapper.className = 'overflow-hidden';

        const quizGrid = document.createElement('div');
        quizGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 p-4';

        // --- 5. Create and Append Quiz Cards ---
        quizzes.forEach((quiz, index) => {
            const card = document.createElement('a');
            card.href = quiz.url;
            // Use the color from the category for consistency, with a fallback.
            const borderColorClass = categoryDetails[quiz.category]?.color || 'border-gray-400';
            // Get the corresponding colored shadow class for the hover effect
            const shadowClass = shadowColorMap[borderColorClass] || 'hover:shadow-gray-400/30';

            // Restore the essential class definitions for the card's appearance and effects.
            // Added a subtle background color (bg-gray-50) and a border in light mode to make cards stand out from the background.
            card.className = `quiz-card group flex flex-col h-full bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700/50 transition-all duration-300 transform hover:-translate-y-1 fade-in-up ${shadowClass}`;

            card.style.animationDelay = `${index * 75}ms`; // Staggered animation delay
            
            // --- Progress Bar Logic ---
            // This section determines the quiz state (Not Started, In Progress, Completed)
            // and prepares variables to generate a unified progress bar for all cards.

            const totalQuestions = parseInt(quiz.amount, 10) || 0;
            let percentage = 0;
            let progressText = 'ยังไม่เริ่ม';
            let progressTextColor = 'text-gray-500 dark:text-gray-400';
            let progressBarColor = 'bg-gray-300 dark:bg-gray-600'; // Neutral color for 0% or "Not Started"
            let progressDetails = `0/${totalQuestions} ข้อ`; // Default detail text
            let resetButtonHTML = '';
            let isFinished = false; // Flag to track if the quiz is completed
            let progressHTML = '';

            if (totalQuestions > 0) {
                try {
                    const savedStateJSON = localStorage.getItem(quiz.storageKey);
                    if (savedStateJSON) {
                        const savedState = JSON.parse(savedStateJSON);

                        if (savedState && typeof savedState.currentQuestionIndex === 'number') {
                            const answeredCount = savedState.currentQuestionIndex;
                            const score = savedState.score || 0;
                            isFinished = answeredCount >= totalQuestions; // Update the flag

                            percentage = Math.round((answeredCount / totalQuestions) * 100);

                            // Generate the reset button since there is progress
                            resetButtonHTML = `
                                <button data-storage-key="${quiz.storageKey}" class="reset-progress-btn text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200 inline-flex items-center font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                    ล้างข้อมูล
                                </button>
                            `;

                            if (isFinished) {
                                // State: Completed
                                progressText = 'ทำเสร็จแล้ว!';
                                progressTextColor = 'text-green-600 dark:text-green-400';
                                progressBarColor = 'bg-green-500';
                                progressDetails = `คะแนน: ${score}/${totalQuestions}`;
                            } else {
                                // State: In Progress
                                progressText = 'ความคืบหน้า';
                                progressTextColor = 'text-blue-600 dark:text-blue-400';
                                progressBarColor = 'bg-blue-500';
                                progressDetails = `คะแนน: ${score} | ${answeredCount}/${totalQuestions} ข้อ`;
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Could not parse saved state for ${quiz.id}:`, e);
                    // Reset to default "Not Started" state in case of parsing error
                    percentage = 0;
                    progressText = 'ยังไม่เริ่ม';
                    progressTextColor = 'text-gray-500 dark:text-gray-400';
                    progressBarColor = 'bg-gray-300 dark:bg-gray-600';
                    progressDetails = `0/${totalQuestions} ข้อ`;
                    resetButtonHTML = '';
                }

                // Generate the final HTML for the progress section
                progressHTML = `
                    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/80">
                        <div class="flex justify-between items-center mb-1 font-medium">
                            <span class="text-sm ${progressTextColor}">${progressText}</span>
                            <span class="text-sm text-gray-500 dark:text-gray-400">${percentage}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                            <div class="${progressBarColor} h-2.5 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                        </div>
                        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>${progressDetails}</span>
                            ${resetButtonHTML}
                        </div>
                    </div>
                `;
            }

            // Polished Layout: Added group-hover effects for icon and title, and a colored shadow.
            card.innerHTML = `
                <!-- Main content area (grows to fill space) -->
                <div class="flex-grow flex items-start gap-4">
                    <!-- Left side: Icon container -->
                    <div class="flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center border-4 ${borderColorClass} transition-colors duration-300 dark:bg-white">
                        <img src="${quiz.icon}" alt="${quiz.altText}" class="h-9 w-9 transition-transform duration-300 group-hover:scale-110">
                    </div>

                    <!-- Right side: Text content -->
                    <div class="flex-grow">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white font-kanit leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">${quiz.title}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${quiz.amount}</p>
                        <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-2">${quiz.description}</p>
                    </div>
                </div>

                <!-- Footer with progress bar (spans full width) -->
                <div class="progress-footer-wrapper">
                    ${progressHTML}
                </div>
            `;
            quizGrid.appendChild(card);

            // --- NEW: Add event listener to the card itself ---
            card.addEventListener('click', (event) => {
                if (isFinished) {
                    // If the quiz is completed, prevent default navigation and show the modal
                    event.preventDefault();
                    activeQuizUrl = quiz.url;
                    activeStorageKey = quiz.storageKey;
                    showCompletedQuizModal();
                }
                // Otherwise, the default 'a' tag behavior (navigation) will proceed.
            });

            // --- New: Add event listener for the reset button ---
            const resetButton = card.querySelector('.reset-progress-btn');
            if (resetButton) {
                resetButton.addEventListener('click', (event) => {
                    // Prevent the card's link from being followed
                    event.preventDefault();
                    event.stopPropagation();

                    const key = event.currentTarget.dataset.storageKey;
                    
                    // Define what happens on confirmation
                    const onConfirm = () => {
                        localStorage.removeItem(key);

                        // Instead of removing the progress section, we'll update it to the "Not Started" state.
                        const progressWrapper = card.querySelector('.progress-footer-wrapper');
                        if (!progressWrapper) return;

                        const totalQuestions = parseInt(quiz.amount, 10) || 0;

                        // Re-create the HTML for the "Not Started" state.
                        const notStartedProgressHTML = `
                            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/80">
                                <div class="flex justify-between items-center mb-1 font-medium">
                                    <span class="text-sm text-gray-500 dark:text-gray-400">ยังไม่เริ่ม</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">0%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                                    <div class="bg-gray-300 dark:bg-gray-600 h-2.5 rounded-full transition-all duration-500" style="width: 0%"></div>
                                </div>
                                <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>0/${totalQuestions} ข้อ</span>
                                    <span></span>
                                </div>
                            </div>
                        `;

                        // Animate out, update content, and animate in for a smooth transition.
                        progressWrapper.style.transition = 'opacity 0.2s ease-out';
                        progressWrapper.style.opacity = '0';

                        setTimeout(() => {
                            progressWrapper.innerHTML = notStartedProgressHTML;
                            progressWrapper.style.transition = 'opacity 0.3s ease-in';
                            progressWrapper.style.opacity = '1';
                        }, 200); // Wait for the fade-out to complete.
                    };

                    // Show the custom modal instead of the native confirm dialog
                    showResetModal(onConfirm);
                });
            }
        });

        innerContentWrapper.appendChild(quizGrid);
        contentDiv.appendChild(innerContentWrapper);
        section.appendChild(toggleHeader);
        section.appendChild(contentDiv);
        container.appendChild(section);
    });

    // --- 6. Accordion Functionality ---
    document.querySelectorAll('.section-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const content = toggle.nextElementSibling;
            const icon = toggle.querySelector('.chevron-icon');
            const iconContainer = toggle.querySelector('.section-icon-container');
            
            // Check if the content is currently collapsed
            const isCollapsed = content.classList.contains('grid-rows-[0fr]');
            
            // Toggle classes to expand/collapse
            content.classList.toggle('grid-rows-[1fr]', isCollapsed);
            content.classList.toggle('grid-rows-[0fr]', !isCollapsed);
            
            // Rotate icon
            icon.classList.toggle('rotate-180', isCollapsed);

            // Add a "lift" effect to the main icon when the section is opened
            if (iconContainer) {
                iconContainer.classList.toggle('scale-105', isCollapsed);
                iconContainer.classList.toggle('shadow-lg', isCollapsed);
            }
        });
    });

    // --- 7. Random Quiz Button Functionality ---
    const randomQuizBtn = document.getElementById('random-quiz-btn');
    if (randomQuizBtn) {
        randomQuizBtn.addEventListener('click', () => {
            if (quizList && quizList.length > 0) {
                const randomIndex = Math.floor(Math.random() * quizList.length);
                const randomQuizUrl = quizList[randomIndex].url;
                window.location.href = randomQuizUrl;
            }
        });
    }

    // --- 8. Dynamic Copyright Year ---
    const yearSpan = document.getElementById('copyright-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- NEW: Completed Quiz Modal Functionality ---
    function showCompletedQuizModal() {
        if (!completedQuizModal || !completedModalContent) return;
        completedQuizModal.classList.remove('hidden');
        completedQuizModal.classList.add('anim-backdrop-fade-in');
        completedModalContent.classList.add('anim-modal-pop-in');
    }

    function hideCompletedQuizModal() {
        if (!completedQuizModal || !completedModalContent) return;
        completedQuizModal.classList.remove('anim-backdrop-fade-in');
        completedQuizModal.classList.add('anim-backdrop-fade-out');
        completedModalContent.classList.remove('anim-modal-pop-in');
        completedModalContent.classList.add('anim-modal-pop-out');
        
        setTimeout(() => {
            completedQuizModal.classList.add('hidden');
            completedQuizModal.classList.remove('anim-backdrop-fade-out');
            completedModalContent.classList.remove('anim-modal-pop-out');
            // Reset active quiz info
            activeQuizUrl = '';
            activeStorageKey = '';
        }, 300);
    }

    if (viewResultsBtn) {
        viewResultsBtn.addEventListener('click', () => {
            if (activeQuizUrl) {
                // BUG FIX: Correctly append the 'action' parameter.
                // The original URL already contains a '?', so subsequent parameters must use '&'.
                const separator = activeQuizUrl.includes('?') ? '&' : '?';
                window.location.href = `${activeQuizUrl}${separator}action=view_results`;
            }
            hideCompletedQuizModal();
        });
    }
    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => {
            if (activeStorageKey) localStorage.removeItem(activeStorageKey);
            if (activeQuizUrl) window.location.href = activeQuizUrl;
            hideCompletedQuizModal();
        });
    }
    if (cancelCompletedBtn) {
        cancelCompletedBtn.addEventListener('click', hideCompletedQuizModal);
    }

    // --- 9. Modal Functionality ---
    function showResetModal(onConfirm) {
        if (!resetConfirmModal || !modalContent) return;

        // Store the callback function to be executed on confirmation
        confirmCallback = onConfirm;

        resetConfirmModal.classList.remove('hidden');
        resetConfirmModal.classList.add('anim-backdrop-fade-in');
        modalContent.classList.add('anim-modal-pop-in');
    }

    function hideResetModal() {
        if (!resetConfirmModal || !modalContent) return;

        resetConfirmModal.classList.remove('anim-backdrop-fade-in');
        resetConfirmModal.classList.add('anim-backdrop-fade-out');
        modalContent.classList.remove('anim-modal-pop-in');
        modalContent.classList.add('anim-modal-pop-out');
        
        setTimeout(() => {
            resetConfirmModal.classList.add('hidden');
            resetConfirmModal.classList.remove('anim-backdrop-fade-out');
            modalContent.classList.remove('anim-modal-pop-out');
            // Clean up the callback to prevent it from being called accidentally later
            confirmCallback = null;
        }, 300); // Match animation duration from animations.css
    }

    // Add event listeners for modal buttons once, when the script loads
    if (resetConfirmBtn && resetCancelBtn) {
        resetConfirmBtn.addEventListener('click', () => {
            if (typeof confirmCallback === 'function') {
                confirmCallback();
            }
            hideResetModal();
        });

        resetCancelBtn.addEventListener('click', hideResetModal);
    }
});