document.addEventListener('DOMContentLoaded', () => {
    const loadComponent = async (element) => {
        const componentName = element.dataset.component;
        if (!componentName) return;

        // Using an absolute path from the site root ('/') is often more reliable
        // than a relative path ('./') because it doesn't depend on the current page's
        // location in the directory structure. This helps prevent 404 errors.
        const url = `/components/${componentName}.html`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch component at ${response.url} (Status: ${response.status})`);
            }
            const html = await response.text();
            element.outerHTML = html;

            // ส่งสัญญาณ (event) บอกว่าโหลด component เสร็จแล้ว
            // เพื่อให้สคริปต์อื่นรู้ว่าตอนนี้มี element ใหม่เพิ่มเข้ามาในหน้าเว็บ
            document.dispatchEvent(new CustomEvent('componentLoaded', {
                detail: { name: componentName }
            }));

        } catch (error) {
            console.error(`Could not load component: ${componentName}`, error);
            element.innerHTML = `<p class="text-red-500">Error loading ${componentName}.</p>`;
        }
    };

    // ค้นหาตัวยึดตำแหน่งทั้งหมดในหน้าเว็บแล้วสั่งให้โหลด component
    const componentPlaceholders = document.querySelectorAll('[data-component]');
    componentPlaceholders.forEach(loadComponent);
});