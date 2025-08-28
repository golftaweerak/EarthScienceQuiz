/**
 * Displays a user-friendly critical error message on the page.
 * @param {string} errorMessage - The error message to display for developers.
 */
function displayCriticalErrorToUser(errorMessage) {
    const container = document.querySelector('#preview-container') || document.body;
    container.innerHTML = `
        <div class="mt-8 mx-auto max-w-2xl text-center p-6 bg-red-50 border-l-4 border-red-400 text-red-800 rounded-r-lg shadow-md">
            <h2 class="text-2xl font-bold mb-3">เกิดข้อผิดพลาดร้ายแรง</h2>
            <p class="mb-4">ไม่สามารถแสดงผลหน้าพรีวิวได้ โปรดลองรีเฟรชหน้าอีกครั้ง หรือติดต่อผู้ดูแลระบบ</p>
            <p class="text-xs text-gray-600 bg-gray-100 p-2 rounded border"><strong>Developer Info:</strong> ${errorMessage}</p>
        </div>
    `;
}

/**
 * Initializes all scripts required for the quiz preview page.
 * This acts as the main entry point after the DOM is loaded.
 */
async function main() {
    // Dynamically load components and modules to gracefully handle loading/parsing errors.
    try {
        const { loadComponent } = await import('./component-loader.js');
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#footer-placeholder', './components/footer.html'),
            loadComponent('#modals-placeholder', './components/modals_common.html')
        ]);
    } catch (error) {
        console.error("Failed to load core HTML components:", error);
        displayCriticalErrorToUser(`Error loading HTML components (component-loader.js): ${error.message}`);
        return; // Stop if basic components fail to load.
    }

    // Initialize common UI components (header, menu, dark mode).
    try {
        const { initializeCommonComponents } = await import('./common-init.js');
        initializeCommonComponents();
    } catch (error) {
        // This is considered non-critical for the preview page's core function.
        console.warn("A non-critical error occurred during common component initialization.", error);
    }

    // Initialize the core functionality specific to the preview page.
    // This block will now catch errors from parsing/loading preview.js itself.
    try {
        const { initializePreviewPage } = await import('./preview.js');
        initializePreviewPage();
    } catch (error) {
        console.error("A critical error occurred while initializing the preview page:", error);
        // Display a user-friendly message, which helps debug issues in imported modules.
        displayCriticalErrorToUser(`Error initializing preview page (preview.js): ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', main);