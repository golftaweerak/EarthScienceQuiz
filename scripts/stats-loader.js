import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { getDetailedProgressForAllQuizzes, categoryDetails } from './data-manager.js';
import { ModalHandler } from './modal-handler.js';

/**
 * Creates an HTML element for a single summary statistic.
 * @param {string} label - The label for the statistic (e.g., "คะแนนเฉลี่ย").
 * @param {string} value - The value of the statistic (e.g., "85%").
 * @param {string} icon - The SVG icon string.
 * @returns {HTMLElement} The created stat card element.
 */
function createSummaryStatCard(label, value, icon) {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-gray-800/50 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4';
    card.innerHTML = `
        <div class="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
            ${icon}
        </div>
        <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">${label}</p>
            <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">${value}</p>
        </div>
    `;
    return card;
}

/**
 * Creates an HTML element for a category statistic, including a progress bar.
 * @param {string} subCategoryName - The name of the sub-category.
 * @param {object} data - The stats data { correct, total }.
 * @returns {HTMLElement} The created category stat element.
 */
function createSubCategoryStatItem(subCategoryName, data) {
    const item = document.createElement('div');
    const percentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
    const colorClass = percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
    item.className = 'p-3 bg-gray-100 dark:bg-gray-800/50 rounded-lg';
    item.innerHTML = `
        <div class="flex justify-between items-center text-sm">
            <span class="font-medium text-gray-700 dark:text-gray-200">${subCategoryName}</span>
            <span class="font-semibold text-gray-800 dark:text-gray-100">${data.correct} / ${data.total} <span class="font-normal text-gray-500 dark:text-gray-400">(${percentage}%)</span></span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
            <div class="${colorClass} h-2 rounded-full" style="width: ${percentage}%"></div>
        </div>
    `;
    return item;
}

/**
 * Renders all statistics on the page.
 * @param {Array<object>} allDetailedProgress - An array of all quiz detailed progress objects.
 */
function renderStats(allDetailedProgress) {
    const container = document.getElementById('stats-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const clearStatsBtn = document.getElementById('clear-stats-btn');

    if (loadingSpinner) loadingSpinner.remove();
    container.innerHTML = ''; // Clear previous content

    const quizzesWithProgress = allDetailedProgress.filter(p => p.userAnswers && p.userAnswers.some(a => a !== null));

    if (quizzesWithProgress.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="text-xl font-bold font-kanit">ยังไม่มีข้อมูลสถิติ</h3>
                <p class="mt-2">ดูเหมือนว่าคุณยังทำแบบทดสอบไม่เสร็จสมบูรณ์เลยสักชุด<br>ลองกลับไปทำแบบทดสอบให้เสร็จเพื่อดูสถิติของคุณที่นี่</p>
                <a href="./index.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 no-transition">กลับไปหน้าหลัก</a>
            </div>
        `;
        clearStatsBtn.disabled = true;
        return;
    }

    // --- 1. Calculate Overall Stats ---
    let totalAnswered = 0;
    let totalCorrect = 0;
    const quizzesAttemptedCount = quizzesWithProgress.length;

    quizzesWithProgress.forEach(quiz => {
        quiz.userAnswers.forEach(answer => {
            if (answer) {
                totalAnswered++;
                if (answer.isCorrect) {
                    totalCorrect++;
                }
            }
        });
    });

    const averagePercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

    // --- 2. Render Summary Section ---
    const summarySection = document.createElement('div');
    summarySection.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
    summarySection.innerHTML = `
        <h2 class="text-2xl font-bold font-kanit text-gray-800 dark:text-gray-100 sm:col-span-2 lg:col-span-3">ภาพรวม</h2>
    `;
    summarySection.appendChild(createSummaryStatCard('ทำไปแล้ว', `${quizzesAttemptedCount} ชุด`, `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>`));
    summarySection.appendChild(createSummaryStatCard('คะแนนเฉลี่ย', `${averagePercentage}%`, `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>`));
    summarySection.appendChild(createSummaryStatCard('ตอบถูกทั้งหมด', `${totalCorrect} ข้อ`, `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`));
    container.appendChild(summarySection);

    // --- 3. Calculate and Render Category Stats ---
    const statsByMainCategory = {};
    const displayCategories = ['Geology', 'Meteorology', 'Astronomy'];

    quizzesWithProgress.forEach(quiz => {
        quiz.userAnswers.forEach(answer => {
            if (!answer) return;

            let mainCategoryKey = null;
            if (typeof answer.subCategory === 'object' && answer.subCategory.specific) {
                mainCategoryKey = answer.subCategory.main;
            } else if (typeof answer.subCategory === 'string' && answer.subCategory) {
                // This handles legacy data where subCategory might be "Geology", "Meteorology", etc.
                if (displayCategories.includes(answer.subCategory)) {
                    mainCategoryKey = answer.subCategory;
                }
            }

            if (mainCategoryKey && displayCategories.includes(mainCategoryKey)) {
                if (!statsByMainCategory[mainCategoryKey]) {
                    statsByMainCategory[mainCategoryKey] = { correct: 0, total: 0 };
                }
                statsByMainCategory[mainCategoryKey].total++;
                if (answer.isCorrect) {
                    statsByMainCategory[mainCategoryKey].correct++;
                }
            }
        });
    });

    const mainCategorySection = document.createElement('div');
    mainCategorySection.className = 'space-y-4';
    mainCategorySection.innerHTML = `<h2 class="text-2xl font-bold font-kanit text-gray-800 dark:text-gray-100">คะแนนตามหมวดหมู่หลัก</h2>`;

    const sortedMainCategories = Object.entries(statsByMainCategory).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    if (sortedMainCategories.length > 0) {
        sortedMainCategories.forEach(([key, data]) => {
            const displayName = categoryDetails[key]?.displayName || key;
            mainCategorySection.appendChild(createSubCategoryStatItem(displayName, data));
        });
        container.appendChild(mainCategorySection);
    }
}

/**
 * Initializes the stats page.
 */
async function main() {
    try {
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#footer-placeholder', './components/footer.html')
        ]);

        initializeCommonComponents();

        const allDetailedProgress = await getDetailedProgressForAllQuizzes();
        renderStats(allDetailedProgress);

        // --- Event Listener for Clear Button ---
        const clearStatsBtn = document.getElementById('clear-stats-btn');
        const confirmModal = new ModalHandler('confirm-action-modal');
        const confirmActionBtn = document.getElementById('confirm-action-btn');
        const confirmModalTitle = document.getElementById('confirm-modal-title');
        const confirmModalDesc = document.getElementById('confirm-modal-description');

        if (clearStatsBtn) {
            clearStatsBtn.addEventListener('click', (e) => {
                if (confirmModalTitle) confirmModalTitle.textContent = 'ยืนยันการล้างข้อมูลทั้งหมด';
                if (confirmModalDesc) confirmModalDesc.innerHTML = 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลความคืบหน้าของแบบทดสอบทั้งหมด? <strong class="text-red-600 dark:text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>';
                confirmModal.open(e.currentTarget);
            });
        }

        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', async () => {
                const allQuizzesWithProgress = await getDetailedProgressForAllQuizzes();
                allQuizzesWithProgress.forEach(quiz => localStorage.removeItem(quiz.storageKey));
                confirmModal.close();
                // Re-render the stats page to show it's empty
                renderStats([]);
            });
        }
    } catch (error) {
        console.error("Failed to initialize stats page:", error);
        const container = document.getElementById('stats-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) loadingSpinner.remove();
        if (container) {
            container.innerHTML = `
                <div class="text-center py-16 text-red-500 dark:text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h3 class="text-xl font-bold font-kanit">เกิดข้อผิดพลาด</h3>
                    <p class="mt-2">ไม่สามารถโหลดข้อมูลสถิติได้ในขณะนี้<br>กรุณาลองใหม่อีกครั้งในภายหลัง</p>
                    <a href="./index.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300 no-transition">กลับไปหน้าหลัก</a>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', main);