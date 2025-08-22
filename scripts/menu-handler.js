import { ModalHandler } from './modal-handler.js';
import { getQuizProgress, categoryDetails as allCategoryDetails } from './data-manager.js';
import { quizList } from '../data/quizzes-list.js';
import { getSavedCustomQuizzes } from './custom-quiz-handler.js';


/**
 * Creates the HTML string for a single quiz menu item, including progress.
 * @param {object} quiz - The quiz data object (standard or custom).
 * @param {function} getQuizUrl - Function to generate the correct URL for the quiz.
 * @param {string|null} currentQuizId - The ID of the quiz currently being viewed, if any.
 * @returns {string} The HTML string for the menu item.
 */
function createMenuItemHTML(quiz, getQuizUrl, currentQuizId) {
    const totalQuestions = quiz.amount || quiz.questions?.length || 0;
    if (totalQuestions === 0) return ''; // Don't render items with no questions

    const storageKey = quiz.storageKey || `quizState-${quiz.id || quiz.customId}`;
    const quizId = quiz.id || quiz.customId;
    const linkUrl = getQuizUrl(quizId); // This will be relative
    const iconUrl = quiz.icon || './assets/icons/dices.png';
    const iconAlt = quiz.altText || 'ไอคอนแบบทดสอบ';

    const progress = getQuizProgress(storageKey, totalQuestions);
    let progressHtml = '';
    let activeClass = '';
    let titlePrefix = '';
    let titleFontClass = 'font-medium';
    let iconContainerExtraClass = ''; // New variable for extra classes

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

    // Check if this is the currently active quiz
    if (quizId === currentQuizId) {
        activeClass = 'bg-blue-100 dark:bg-blue-900/50';
        titlePrefix = '<span class="inline-block h-2 w-2 mr-2 bg-blue-500 rounded-full" aria-hidden="true"></span>';
        titleFontClass = 'font-bold';
        // Add classes for glow and scale
        iconContainerExtraClass = 'scale-110 shadow-lg shadow-blue-500/40';
    }

    return `
        <a href="${linkUrl}" data-storage-key="${storageKey}" data-total-questions="${totalQuestions}" class="quiz-menu-item group block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md ${activeClass}">
            <div class="flex items-start gap-3">
                <div class="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white dark:bg-gray-200 p-1 mt-0.5 transition-all duration-300 ${iconContainerExtraClass}">
                    <img src="${iconUrl}" alt="${iconAlt}" class="h-full w-full object-contain">
                </div>
                <div class="flex-grow min-w-0">
                    <span class="${titleFontClass} whitespace-normal group-hover:text-blue-600 dark:group-hover:text-blue-400">${titlePrefix}${quiz.title}</span>
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
 * - Highlights the currently active quiz.
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

    // --- JS Patch for Modal Styling ---
    // This ensures the modal is always centered and looks correct. The ideal fix
    // is to add these classes directly to the modal's HTML in components/modals_common.html,
    // but this guarantees correct behavior on all pages.
    if (completedModal.modal) {
        completedModal.modal.classList.add('flex', 'items-center', 'justify-center', 'p-4');
    }

    let activeQuizUrl = '';
    let activeStorageKey = '';

    // Get current quiz ID from URL to highlight it
    const urlParams = new URLSearchParams(window.location.search);
    const currentQuizId = urlParams.get('id');

    // --- Get all quizzes and their progress ---
    const allQuizzes = [...quizList, ...getSavedCustomQuizzes()];
    const quizzesWithProgress = allQuizzes.map(quiz => {
        const totalQuestions = quiz.amount || quiz.questions?.length || 0;
        if (totalQuestions === 0) return null;
        const storageKey = quiz.storageKey || `quizState-${quiz.id || quiz.customId}`;
        const progress = getQuizProgress(storageKey, totalQuestions);
        return { ...quiz, ...progress };
    }).filter(Boolean); // Filter out nulls

    // --- Identify and sort recent quizzes ---
    const recentQuizzes = quizzesWithProgress
        .filter(q => q.hasProgress) // Only consider quizzes that have been started
        .sort((a, b) => b.lastAttemptTimestamp - a.lastAttemptTimestamp) // Most recent first
        .slice(0, 3); // Get top 3

    const recentQuizIds = new Set(recentQuizzes.map(q => q.id || q.customId));

    // --- Pathing Logic: Use root-relative paths for consistency ---
    const getQuizUrl = (id) => `./quiz/index.html?id=${id}`;

    // --- Grouping and Sorting Logic ---
    // Filter out recent quizzes from the main list to avoid duplication
    const remainingQuizzes = quizzesWithProgress.filter(q => !recentQuizIds.has(q.id || q.customId));

    const groupedQuizzes = remainingQuizzes
        .filter(q => q.id) // Filter for standard quizzes only
        .reduce((acc, quiz) => {
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

    // Sort quizzes within each category alphabetically by title
    Object.keys(groupedQuizzes).forEach(categoryKey => {
        groupedQuizzes[categoryKey].sort((a, b) => a.title.localeCompare(b.title, 'th'));
    });

    // --- Build Menu HTML ---
    let menuHTML = '';

    // 1. Recent Quizzes Section
    if (recentQuizzes.length > 0) {
        menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ทำล่าสุด</h4>`;
        recentQuizzes.forEach(quiz => {
            menuHTML += createMenuItemHTML(quiz, getQuizUrl, currentQuizId);
        });
        menuHTML += `<hr class="my-2 border-gray-200 dark:border-gray-600">`;
    }

    // 2. Standard Quizzes
    sortedCategories.forEach(categoryKey => {
        const quizzes = groupedQuizzes[categoryKey];
        const details = allCategoryDetails[categoryKey];
        if (!details || !quizzes || quizzes.length === 0) return;

        menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${details.title}</h4>`;

        quizzes.forEach(quiz => {
            menuHTML += createMenuItemHTML(quiz, getQuizUrl, currentQuizId);
        });
    });

    // 3. Custom Quizzes
    const savedQuizzes = remainingQuizzes
        .filter(q => q.customId) // Filter for custom quizzes only
        .sort((a, b) => a.title.localeCompare(b.title, 'th')); // Sort custom quizzes alphabetically
    if (savedQuizzes.length > 0) {
        menuHTML += `<hr class="my-2 border-gray-200 dark:border-gray-600">`;
        menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">แบบทดสอบที่สร้างเอง</h4>`;

        savedQuizzes.forEach((quiz) => {
            menuHTML += createMenuItemHTML(quiz, getQuizUrl, currentQuizId);
        });
    }

  // 4. Always add the stats link at the end
 // menuHTML += `<hr class="my-2 border-gray-200 dark:border-gray-600">`;
  //menuHTML += `
  //    <a href="./stats.html" class="group block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
  //        <div class="font-medium whitespace-normal group-hover:text-blue-600 dark:group-hover:text-blue-400">📊 ดูสถิติทั้งหมด</div>
   //   </a>`; 

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