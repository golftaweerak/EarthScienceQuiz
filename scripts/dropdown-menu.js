/**
 * Initializes the main dropdown menu, populates it with quiz data,
 * and sets up all necessary event listeners for interaction.
 */
function initializeDropdownMenu() {
    const menuButton = document.getElementById('quiz-menu-btn');
    const menuDropdown = document.getElementById('quiz-menu-dropdown');
    const menuContainer = document.getElementById('quiz-menu-items');

    if (!menuButton || !menuDropdown || !menuContainer) {
        console.warn('Dropdown menu initialization skipped: a required element is missing.');
        return;
    }

    if (menuButton.dataset.menuInitialized) {
        return;
    }
    menuButton.dataset.menuInitialized = 'true';

    const completedQuizModal = document.getElementById('completed-quiz-modal');
    const startOverBtn = document.getElementById('completed-start-over-btn');
    const viewResultsBtn = document.getElementById('completed-view-results-btn');
    const cancelCompletedBtn = document.getElementById('completed-cancel-btn');

    let activeQuizUrl = '';
    let activeStorageKey = '';

    const currentQuizId = new URLSearchParams(window.location.search).get('id');

    const toggleMenu = (forceHide = false) => {
        const isHidden = menuDropdown.classList.contains('hidden');
        if (forceHide || !isHidden) {
            menuDropdown.classList.remove('opacity-100', 'scale-100');
            menuDropdown.classList.add('opacity-0', 'scale-95');
            // Use `setTimeout` to allow the animation to finish before hiding
            setTimeout(() => {
                menuDropdown.classList.add('hidden');
            }, 200); // Match the duration in CSS
        } else {
            menuDropdown.classList.remove('hidden', 'opacity-0', 'scale-95');
            menuDropdown.classList.add('opacity-100', 'scale-100');
        }
    };

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMenu();
    });

    document.addEventListener('click', (event) => {
        if (!menuDropdown.classList.contains('hidden') && !menuDropdown.contains(event.target) && !menuButton.contains(event.target)) {
            toggleMenu(true);
        }
    });

    if (typeof quizList === 'undefined') {
        menuContainer.innerHTML = '<p class="px-4 py-2 text-sm text-gray-500">Could not load quiz list.</p>';
        return;
    }

    const categoryDisplayNames = {
        seniorHigh: 'ระดับมัธยมปลาย',
        university: 'ระดับมหาวิทยาลัย',
        general: 'ทั่วไป'
    };
    const categoryOrder = ['seniorHigh', 'university', 'general'];

    const groupedQuizzes = quizList.reduce((acc, quiz) => {
        const category = quiz.category || 'general';
        if (!acc[category]) acc[category] = [];
        acc[category].push(quiz);
        return acc;
    }, {});

    menuContainer.innerHTML = '';

    const modalHandler = {
        completedQuizModal,
        setActiveState: (url, key) => {
            activeQuizUrl = url;
            activeStorageKey = key;
        }
    };

    categoryOrder.forEach(categoryKey => {
        if (groupedQuizzes[categoryKey]) {
            const header = document.createElement('div');
            header.className = 'px-4 pt-3 pb-1 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider';
            header.textContent = categoryDisplayNames[categoryKey] || categoryKey;
            menuContainer.appendChild(header);

            groupedQuizzes[categoryKey].forEach(quiz => {
                const quizIdFromUrl = new URLSearchParams(quiz.url.split('?')[1]).get('id');
                const isCurrentQuiz = quizIdFromUrl === currentQuizId;
                const status = getQuizStatus(quiz.storageKey);

                const menuItem = createQuizMenuItem(quiz, isCurrentQuiz, quiz.url, status, modalHandler);
                menuContainer.appendChild(menuItem);
            });
        }
    });

    // --- Modal Logic ---
    const handleModalAction = (action) => {
        if (window.AppUtils) {
            window.AppUtils.hideModal(completedQuizModal);
        }
        if (action === 'startOver' && activeStorageKey) {
            localStorage.removeItem(activeStorageKey);
        }
        if (activeQuizUrl) {
            const finalUrl = action === 'viewResults'
                ? `${activeQuizUrl}${activeQuizUrl.includes('?') ? '&' : '?'}action=view_results`
                : activeQuizUrl;
            window.location.href = finalUrl;
        }
    };

    if (startOverBtn) {
        startOverBtn.addEventListener('click', () => handleModalAction('startOver'));
    }
    if (viewResultsBtn) {
        viewResultsBtn.addEventListener('click', () => handleModalAction('viewResults'));
    }
    if (cancelCompletedBtn) {
        cancelCompletedBtn.addEventListener('click', () => {
            if (window.AppUtils) window.AppUtils.hideModal(completedQuizModal);
        });
    }
}

// Listen for the custom event that signals a component (like the header) has been loaded.
document.addEventListener('componentLoaded', (e) => {
    if (e.detail.name === 'header') {
        initializeDropdownMenu();
    }
});

// Fallback for pages that might not use the dynamic component loader.
document.addEventListener('DOMContentLoaded', () => {
    initializeDropdownMenu();
});