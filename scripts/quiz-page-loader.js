/**
 * Initializes all scripts required for the quiz page.
 * This acts as the main entry point after the DOM is loaded.
 */
async function main() {
    try {
        const { loadComponent } = await import('./component-loader.js');
        
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

        // --- SETUP AUTOMATIC MATH RENDERING FOR DYNAMIC CONTENT ---
        // The quiz question and feedback explanation are loaded dynamically. We use
        // MutationObservers to automatically render KaTeX whenever new content is added,
        // ensuring that math equations display correctly even when shown after a timeout.
        const setupMathObserver = (elementId) => {
            const targetNode = document.getElementById(elementId);
            // Exit if the target element or the KaTeX renderer isn't available.
            if (!targetNode || !window.renderMathInElement) return;

            const renderMath = () => {
                try {
                    // Call the KaTeX auto-render function on the target element.
                    window.renderMathInElement(targetNode, {
                        delimiters: [
                            {left: '$$', right: '$$', display: true},
                            {left: '$', right: '$', display: false},
                            {left: '\\(', right: '\\)', display: false},
                            {left: '\\[', right: '\\]', display: true}
                        ],
                        // Don't throw an error on parsing failure, just log it.
                        throwOnError: false
                    });
                } catch (error) {
                    console.error(`KaTeX rendering failed for #${elementId}:`, error);
                }
            };

            // Create an observer that calls renderMath whenever the element's content changes.
            const observer = new MutationObserver(renderMath);

            // Start observing the target node for additions/removals of child nodes.
            observer.observe(targetNode, { childList: true, subtree: true });
        };

        setupMathObserver('question'); // For the question text itself
        setupMathObserver('feedback'); // For the explanation text in the feedback box

        const { initializeQuiz } = await import('./quiz-loader.js');
        // Initialize the core quiz functionality.
        // This function will handle loading data and setting up the quiz logic.
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
    }
}

document.addEventListener('DOMContentLoaded', main);