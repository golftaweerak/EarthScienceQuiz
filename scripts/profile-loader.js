import { Gamification } from './gamification.js';
import { showToast } from './toast.js';

async function main() {
    try {
        // Optimization: Start importing modules in parallel
        const componentLoaderPromise = import('./component-loader.js');
        const commonInitPromise = import('./common-init.js');
        const profilePromise = import('./profile.js');

        const { loadComponent } = await componentLoaderPromise;
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#footer-placeholder', './components/footer.html'),
            loadComponent('#modals-placeholder', './components/modals_common.html')
        ]);

        const { initializeCommonComponents } = await commonInitPromise;
        await initializeCommonComponents();

        // 1. Initialize Gamification & Pet System FIRST (Critical UI)
        const game = new Gamification();

        // 2. Load main profile logic (Charts, Stats, etc.)
        try {
            const { initializeProfile } = await profilePromise;
            await initializeProfile(game); // Pass the existing game instance
        } catch (profileError) {
            console.error("Failed to load profile logic:", profileError);
            showToast('ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลสถิติได้', '⚠️', 'error');
        }

    } catch (error) {
        console.error("Critical initialization error:", error);
    }
}

document.addEventListener('DOMContentLoaded', main);