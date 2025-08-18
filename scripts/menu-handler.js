import { ModalHandler } from './modal-handler.js';
import { getQuizProgress, categoryDetails as allCategoryDetails } from './data-manager.js';
import { quizList } from '../data/quizzes-list.js';
import { getSavedCustomQuizzes } from './custom-quiz-handler.js';


/**
 * Creates the HTML string for a single quiz menu item, including progress.
 * @param {object} quiz - The quiz data object (standard or custom).
 * @param {function} getQuizUrl - Function to generate the correct URL for the quiz.
 * @returns {string} The HTML string for the menu item.
 */
function createMenuItemHTML(quiz, getQuizUrl) {
    const totalQuestions = quiz.amount || quiz.questions?.length || 0;
    if (totalQuestions === 0) return ''; // Don't render items with no questions

    const storageKey = quiz.storageKey || `quizState-${quiz.id}`;
    const quizId = quiz.id || quiz.customId;
    const linkUrl = getQuizUrl(quizId); // This will be relative
    const iconUrl = quiz.icon || './assets/icons/study.png';
    const iconAlt = quiz.altText || 'ไอคอนแบบทดสอบ';

    const progress = getQuizProgress(storageKey, totalQuestions);
    let progressHtml = '';

    if (progress.isFinished) {
        progressHtml = `
            <div class="text-xs font-normal text-green-600 dark:text-green-400">
                ทำเสร็จแล้ว (คะแนน: ${progress.score}/${progress.totalQuestions} - ${progress.percentage}%)
            </div>`;
    } else if (progress.hasProgress && progress.answeredCount > 0) {
        progressHtml = `
            <div class="text-xs font-normal text-blue-600 dark:text-blue-400">
                ทำต่อ (${progress.answeredCount}/${progress.totalQuestions} ข้อ - ${progress.percentage}%)
            </div>`;
    }

    return `
        <a href="${linkUrl}" data-storage-key="${storageKey}" data-total-questions="${totalQuestions}" class="quiz-menu-item group block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <div class="flex items-start gap-3">
                <div class="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-200 p-1 mt-0.5">
                    <img src="${iconUrl}" alt="${iconAlt}" class="h-full w-full object-contain">
                </div>
                <div class="flex-grow min-w-0">
                    <span class="font-medium whitespace-normal group-hover:text-blue-600 dark:group-hover:text-blue-400">${quiz.title}</span>
                    ${progressHtml}
                </div>
            </div>
        </a>
    `;
}
/**
 * Initializes the main navigation menu.
 * - Populates it with standard and custom quizzes.
 * - Shows progress for each quiz.
 * - Handles clicks on completed quizzes to show a modal.
 */
export function initializeMenu() {
    const menuDropdown = document.getElementById('main-menu-dropdown');
    const menuQuizListContainer = document.getElementById('menu-quiz-list');

    if (!menuDropdown || !menuQuizListContainer || typeof quizList === 'undefined') {
        return;
    }

    // --- Modal Setup for Completed Quizzes ---
    const completedModal = new ModalHandler('completed-quiz-modal');
    const viewResultsBtn = document.getElementById('completed-view-results-btn');
    const startOverBtn = document.getElementById('completed-start-over-btn');

    let activeQuizUrl = '';
    let activeStorageKey = '';

    // --- Pathing Logic: Use root-relative paths for consistency ---
    const getQuizUrl = (id) => `./quiz/index.html?id=${id}`;

    // --- Grouping and Sorting Logic ---
    const groupedQuizzes = quizList.reduce((acc, quiz) => {
        const category = quiz.category || "Uncategorized";
        if (!acc[category]) acc[category] = [];
        acc[category].push(quiz);
        return acc;
    }, {});

    const sortedCategories = Object.keys(groupedQuizzes).sort((a, b) => {
        const orderA = allCategoryDetails[a]?.order || 99;
        const orderB = allCategoryDetails[b]?.order || 99;
        return orderA - orderB;
    });

    // --- Build Menu HTML ---
    let menuHTML = '';

    // 1. Standard Quizzes
    sortedCategories.forEach(categoryKey => {
        const quizzes = groupedQuizzes[categoryKey];
        const details = allCategoryDetails[categoryKey];
        if (!details || !quizzes || quizzes.length === 0) return;

        menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${details.title}</h4>`;

        quizzes.forEach(quiz => {
            menuHTML += createMenuItemHTML(quiz, getQuizUrl);
        });
    });

    // 2. Custom Quizzes
    const savedQuizzes = getSavedCustomQuizzes(); // Use the safe, shared function
    if (savedQuizzes.length > 0) {
        menuHTML += `<hr class="my-2 border-gray-200 dark:border-gray-600">`;
        menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">แบบทดสอบที่สร้างเอง</h4>`;

        savedQuizzes.forEach((quiz) => {
            menuHTML += createMenuItemHTML(quiz, getQuizUrl);
        });
    }

    menuQuizListContainer.innerHTML = menuHTML;

    // --- Event Delegation for Menu Items ---
    menuDropdown.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        // Case 2: Quiz Item Link
        if (link.classList.contains('quiz-menu-item')) {
            const storageKey = link.dataset.storageKey;
            const totalQuestions = parseInt(link.dataset.totalQuestions, 10) || 0;
            if (!storageKey || totalQuestions === 0) return;

            const progress = getQuizProgress(storageKey, totalQuestions);

            if (progress.isFinished) {
                event.preventDefault();
                activeQuizUrl = link.href;
                activeStorageKey = storageKey;
                completedModal.open(link);
            }
            // If not finished, the default link behavior proceeds.
        }
    });

             

    // --- Modal Button Listeners ---
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
}