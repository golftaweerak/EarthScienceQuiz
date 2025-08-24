import { loadComponent } from './component-loader.js';
import { initializeCommonComponents } from './common-init.js';
import { initializePreviewPage } from './preview.js';

/**
 * Initializes all scripts required for the developer-facing data preview page.
 */
async function main() {
    try {
        // Load shared components first
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#footer-placeholder', './components/footer.html'),
            loadComponent('#modals-placeholder', './components/modals_common.html')
        ]);

        initializeCommonComponents();
        initializePreviewPage();
    } catch (error) {
        console.error("Error initializing the preview page:", error);
        // Display a user-friendly error message on the page
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = `<div class="text-center py-20 text-red-600 dark:text-red-400">
                <h1 class="text-2xl font-bold">เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h1>
                <p class="mt-2">ไม่สามารถโหลดส่วนประกอบที่จำเป็นได้ กรุณาลองรีเฟรชหน้าอีกครั้ง</p>
            </div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', main);