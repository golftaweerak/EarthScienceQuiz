/**
 * Initializes all scripts required for the quiz page.
 * This acts as the main entry point after the DOM is loaded.
 */
async function main() {
    // Create and inject loading spinner immediately
    const spinner = document.createElement('div');
    spinner.id = 'quiz-loading-spinner';
    spinner.className = 'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-gray-900 transition-opacity duration-500';
    spinner.innerHTML = `
        <div class="relative w-20 h-20">
            <div class="absolute top-0 left-0 w-full h-full border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div class="absolute top-0 left-0 w-full h-full border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <div class="absolute inset-0 flex items-center justify-center">
                <span class="text-3xl animate-bounce">🌍</span>
            </div>
        </div>
        <p class="mt-6 text-lg font-bold text-gray-700 dark:text-gray-300 font-kanit animate-pulse">กำลังเตรียมความพร้อม...</p>
    `;
    document.body.appendChild(spinner);

    try {
        // Optimization: Start importing modules in parallel to reduce load time
        const componentLoaderPromise = import('./component-loader.js');
        const commonInitPromise = import('./common-init.js');
        const quizLoaderPromise = import('./quiz-loader.js');
        
        // Custom loader to fix paths BEFORE injection to prevent 404s in the quiz subdirectory
        const loadComponentWithFix = async (selector, path) => {
            try {
                const response = await fetch(path);
                let html = await response.text();
                // Replace ./assets/ with ../assets/ to fix 404s
                html = html.replace(/src="\.\/assets\//g, 'src="../assets/');
                // Replace other ./ links with ../ to fix navigation
                html = html.replace(/href="\.\//g, 'href="../');
                
                const element = document.querySelector(selector);
                if (element) {
                    element.innerHTML = html;
                    // Re-execute scripts since innerHTML doesn't run them
                    Array.from(element.querySelectorAll('script')).forEach(oldScript => {
                        const newScript = document.createElement('script');
                        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    });
                }
            } catch (e) {
                console.error(`Error loading ${path}`, e);
            }
        };

        // Load shared components first
        await Promise.all([
                loadComponentWithFix('#main_header-placeholder', '../components/main_header.html'),
                loadComponentWithFix('#footer-placeholder', '../components/footer.html'),
                loadComponentWithFix('#modals-placeholder', '../components/modals_common.html')
        ]);

        const { initializeCommonComponents } = await import('./common-init.js');
        // Initialize common UI components like header, menu, and footer scripts.
        // This must run BEFORE fixing paths, as it populates the menu with links.
        await initializeCommonComponents();

        // --- FIX COMPONENT PATHS FOR QUIZ PAGE (which is in a subdirectory) ---
        if (window.location.pathname.includes('/quiz/')) {
            // This function is ONLY for pages inside a subdirectory like /quiz/
            const fixComponentPathsForSubdirectory = (containerId) => {
                const container = document.getElementById(containerId);
                if (!container) return;
        
                // Fix <a> links: changes './' to '../'
                container.querySelectorAll('a[href^="./"]').forEach(link => {
                    const currentHref = link.getAttribute('href');
                    link.setAttribute('href', `..${currentHref.substring(1)}`);
                });
        
                // Fix <img> sources: changes './' to '../'
                container.querySelectorAll('img[src^="./"]').forEach(img => {
                    const currentSrc = img.getAttribute('src');
                    img.setAttribute('src', `..${currentSrc.substring(1)}`);
                });
            };
            fixComponentPathsForSubdirectory('main_header-placeholder');
            fixComponentPathsForSubdirectory('footer-placeholder');
        }

        // Initialize the core quiz functionality.
        // This function will handle loading data and setting up the quiz logic.
        const { initializeQuiz } = await quizLoaderPromise;
        await initializeQuiz();
    } catch (error) {
        console.error("A critical error occurred on the quiz page:", error);
        // A simple, dependency-free error message.
        const body = document.body;
        if (body) {
            body.innerHTML = `<div style="text-align: center; padding: 40px; font-family: sans-serif; color: #ef4444;">
                <h1 style="font-size: 24px; font-weight: bold;">เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h1>
                <p style="margin-top: 8px;">ไม่สามารถโหลดแบบทดสอบได้ กรุณาลองใหม่อีกครั้ง หรือกลับไปที่หน้าหลัก</p>
                <a href="../index.html" style="display: inline-block; margin-top: 24px; background-color: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">กลับไปหน้าหลัก</a>
            </div>`;
        }
    } finally {
        // Hide and remove spinner
        spinner.style.opacity = '0';
        setTimeout(() => spinner.remove(), 500);
    }
}

document.addEventListener('DOMContentLoaded', main);