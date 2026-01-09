/**
 * Initializes the stats page.
 */
async function main() {
    try {
        // Optimization: Start importing all modules in parallel
        const componentLoaderPromise = import('./component-loader.js');
        const commonInitPromiseModule = import('./common-init.js');
        const modalHandlerPromise = import('./modal-handler.js');
        const authManagerPromise = import('./auth-manager.js');
        const quizListPromise = import('../data/quizzes-list.js');
        const customQuizHandlerPromise = import('./custom-quiz-handler.js');
        const statsPromise = import('./stats.js');

        const { loadComponent } = await componentLoaderPromise;
        // Load shared HTML components like header, footer, and modals
        const loadPromises = [];
        // โหลดเฉพาะถ้ามี placeholder อยู่จริง (stats.html อาจใช้ hardcoded header)
        if (document.getElementById('main_header-placeholder')) loadPromises.push(loadComponent('#main_header-placeholder', './components/main_header.html'));
        if (document.getElementById('footer-placeholder')) loadPromises.push(loadComponent('#footer-placeholder', './components/footer.html'));
        if (document.getElementById('modals-placeholder')) loadPromises.push(loadComponent('#modals-placeholder', './components/modals_common.html'));
        
        await Promise.all(loadPromises);

        // Initialize common components like header, menu, etc.
        const { initializeCommonComponents } = await commonInitPromiseModule;
        console.log("Initializing common components...");
        
        // Add a timeout to prevent hanging on menu initialization
        const commonInitPromise = initializeCommonComponents();
        const initTimeoutPromise = new Promise(resolve => setTimeout(resolve, 5000));
        
        await Promise.race([commonInitPromise, initTimeoutPromise]);
        console.log("Common components initialized (or timed out).");

        // --- Initialize Clear Button First ---
        // This ensures the user can always clear their data, even if the main stats page fails to render.
        const { ModalHandler } = await modalHandlerPromise;
        // Import authManager but we don't await its internal init here, just the module load.
        const { authManager } = await authManagerPromise; 
        const { quizList } = await quizListPromise;
        const { getSavedCustomQuizzes } = await customQuizHandlerPromise;

        const clearStatsBtn = document.getElementById('clear-stats-btn');
        const confirmModal = new ModalHandler('confirm-action-modal');
        const confirmActionBtn = document.getElementById('confirm-action-btn');
        const confirmModalTitle = document.getElementById('confirm-modal-title');
        const confirmModalDesc = document.getElementById('confirm-modal-description');

        if (clearStatsBtn) {
            clearStatsBtn.addEventListener('click', (e) => {
                if (e.currentTarget.disabled) return;

                if (confirmModalTitle) confirmModalTitle.textContent = 'ยืนยันการล้างข้อมูลทั้งหมด';
                if (confirmModalDesc) confirmModalDesc.innerHTML = 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลความคืบหน้าของแบบทดสอบทั้งหมด? <strong class="text-red-600 dark:text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>';
                confirmModal.open(e.currentTarget);
            });
        }

        if (confirmActionBtn) {
            confirmActionBtn.addEventListener('click', async () => {
                // Clear local storage first for immediate UI feedback
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.startsWith('quizState-') || key === 'customQuizzesList')) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));

                // Then, clear cloud data if logged in
                await authManager.clearAllCloudHistory();

                confirmModal.close();
                window.location.reload();
            });
        }

        // --- Build the main stats page content ---
        console.log("Building stats page...");
        const { buildStatsPage, initializeTabs } = await statsPromise;
        
        try {
            await buildStatsPage();
            console.log("Stats page built successfully.");
        } catch (buildError) {
            console.error("Error inside buildStatsPage:", buildError);
            // Even if build fails, try to init tabs so user sees something
            initializeTabs();
            const statsContent = document.getElementById("stats-content");
            if (statsContent) {
                statsContent.classList.add("anim-fade-in");
                statsContent.style.opacity = 1;
            }
        }

        // NEW: Re-build stats page when auth sync completes (e.g. history downloaded)
        window.addEventListener('auth-synced', async () => {
            console.log("Auth synced, rebuilding stats page...");
            await buildStatsPage().catch(e => console.error("Rebuild failed:", e));
        });

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}