import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { buildStatsPage } from './stats.js';
import { ModalHandler } from './modal-handler.js';
import { quizList } from '../data/quizzes-list.js';

/**
 * Initializes the stats page.
 */
async function main() {
    try {
        // Load shared HTML components like header, footer, and modals
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#footer-placeholder', './components/footer.html'),
            loadComponent('#modals-placeholder', './components/modals_common.html')
        ]);

        // Initialize common functionalities like theme toggling
        initializeCommonComponents();

        // Build the stats dashboard using the new logic from stats.js
        buildStatsPage();

        // --- Event Listener for Clear Button ---
        const clearStatsBtn = document.getElementById('clear-stats-btn');
        const confirmModal = new ModalHandler('confirm-action-modal');
        const confirmActionBtn = document.getElementById('confirm-action-btn');
        const confirmModalTitle = document.getElementById('confirm-modal-title');
        const confirmModalDesc = document.getElementById('confirm-modal-description');

        if (clearStatsBtn) {
            clearStatsBtn.addEventListener('click', (e) => {
                // Don't open modal if the button is disabled
                if (e.currentTarget.disabled) return;

                if (confirmModalTitle) confirmModalTitle.textContent = 'ยืนยันการล้างข้อมูลทั้งหมด';
                if (confirmModalDesc) confirmModalDesc.innerHTML = 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลความคืบหน้าของแบบทดสอบทั้งหมด? <strong class="text-red-600 dark:text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>';
                confirmModal.open(e.currentTarget);
            });
        }

        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', () => {
                // Iterate through the master quiz list and remove each storage key for a thorough clean-up
                quizList.forEach(quiz => {
                    if (quiz.storageKey) localStorage.removeItem(quiz.storageKey);
                });
                confirmModal.close();
                // Reload the page to reflect the cleared stats
                window.location.reload();
            });
        }
    } catch (error) {
        console.error("Failed to initialize stats page:", error);
        const container = document.getElementById('stats-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) loadingSpinner.remove();
        if (container) { // Fallback error display
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