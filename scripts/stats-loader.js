import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { getAllQuizProgress } from './data-manager.js';
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
 * @param {string} categoryName - The name of the category.
 * @param {number} averageScore - The average score percentage for this category.
 * @param {number} completedCount - The number of quizzes completed in this category.
 * @returns {HTMLElement} The created category stat element.
 */
function createCategoryStatItem(categoryName, averageScore, completedCount) {
    const item = document.createElement('div');
    item.className = 'p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg';
    item.innerHTML = `
        <div class="flex justify-between items-center text-md">
            <span class="font-bold text-gray-800 dark:text-gray-200">${categoryName}</span>
            <span class="font-semibold text-gray-700 dark:text-gray-100">${averageScore}% <span class="font-normal text-sm text-gray-500 dark:text-gray-400">(${completedCount} ชุด)</span></span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full" style="width: ${averageScore}%"></div>
        </div>
    `;
    return item;
}

/**
 * Renders all statistics on the page.
 * @param {Array<object>} allProgress - An array of all quiz progress objects.
 */
function renderStats(allProgress) {
    const container = document.getElementById('stats-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const clearStatsBtn = document.getElementById('clear-stats-btn');

    if (loadingSpinner) loadingSpinner.remove();
    container.innerHTML = ''; // Clear previous content

    const completedQuizzes = allProgress.filter(p => p.isFinished);

    if (completedQuizzes.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 class="text-xl font-bold font-kanit">ยังไม่มีข้อมูลสถิติ</h3>
                <p class="mt-2">ดูเหมือนว่าคุณยังทำแบบทดสอบไม่เสร็จสมบูรณ์เลยสักชุด<br>ลองกลับไปทำแบบทดสอบให้เสร็จเพื่อดูสถิติของคุณที่นี่</p>
                <a href="./index.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300">กลับไปหน้าหลัก</a>
            </div>
        `;
        clearStatsBtn.disabled = true;
        return;
    }

    // --- 1. Calculate Overall Stats ---
    const totalCompleted = completedQuizzes.length;
    const totalScore = completedQuizzes.reduce((sum, p) => sum + p.score, 0);
    const totalQuestions = completedQuizzes.reduce((sum, p) => sum + p.totalQuestions, 0);
    const averagePercentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

    // --- 2. Render Summary Section ---
    const summarySection = document.createElement('div');
    summarySection.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
    summarySection.innerHTML = `
        <h2 class="text-2xl font-bold font-kanit text-gray-800 dark:text-gray-100 sm:col-span-2 lg:col-span-3">ภาพรวม</h2>
    `;
    summarySection.appendChild(createSummaryStatCard('ทำเสร็จแล้ว', `${totalCompleted} ชุด`, `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`));
    summarySection.appendChild(createSummaryStatCard('คะแนนเฉลี่ย', `${averagePercentage}%`, `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>`));
    summarySection.appendChild(createSummaryStatCard('ตอบถูกทั้งหมด', `${totalScore} ข้อ`, `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`));
    container.appendChild(summarySection);

    // --- 3. Calculate and Render Category Stats ---
    const categoryStats = completedQuizzes.reduce((acc, p) => {
        const category = p.category || 'ไม่ระบุหมวดหมู่';
        if (!acc[category]) {
            acc[category] = { totalScore: 0, totalQuestions: 0, count: 0 };
        }
        acc[category].totalScore += p.score;
        acc[category].totalQuestions += p.totalQuestions;
        acc[category].count++;
        return acc;
    }, {});

    const categorySection = document.createElement('div');
    categorySection.className = 'space-y-4';
    categorySection.innerHTML = `<h2 class="text-2xl font-bold font-kanit text-gray-800 dark:text-gray-100">คะแนนเฉลี่ยตามหมวดหมู่</h2>`;

    Object.entries(categoryStats).forEach(([categoryName, data]) => {
        const avgScore = data.totalQuestions > 0 ? Math.round((data.totalScore / data.totalQuestions) * 100) : 0;
        categorySection.appendChild(createCategoryStatItem(categoryName, avgScore, data.count));
    });
    container.appendChild(categorySection);
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

        const allProgress = await getAllQuizProgress();
        renderStats(allProgress);

        // --- Event Listener for Clear Button ---
        const clearStatsBtn = document.getElementById('clear-stats-btn');
        const confirmModal = new ModalHandler('confirm-action-modal');
        const confirmActionBtn = document.getElementById('confirm-action-btn');
        const confirmModalTitle = document.getElementById('confirm-modal-title');
        const confirmModalDesc = document.getElementById('confirm-modal-description');

        if (clearStatsBtn) {
            clearStatsBtn.addEventListener('click', (e) => {
                if (confirmModalTitle) confirmModalTitle.textContent = 'ยืนยันการล้างข้อมูลสถิติ';
                if (confirmModalDesc) confirmModalDesc.innerHTML = 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลความคืบหน้าของแบบทดสอบที่ทำเสร็จแล้วทั้งหมด? <strong class="text-red-600 dark:text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>';
                confirmModal.open(e.currentTarget);
            });
        }

        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', async () => {
                const allQuizzes = await getAllQuizProgress();
                allQuizzes.forEach(quiz => {
                    if (quiz.isFinished) {
                        localStorage.removeItem(quiz.storageKey);
                    }
                });
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
                    <a href="./index.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg transition duration-300">กลับไปหน้าหลัก</a>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', main);