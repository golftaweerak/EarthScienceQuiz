/**
 * แสดง Notification เล็กๆ มุมขวาล่างของหน้าจอ (Toast)
 * @param {string} title - หัวข้อของแจ้งเตือน
 * @param {string} message - ข้อความรายละเอียด
 * @param {string} icon - ไอคอน (Emoji หรือ HTML string)
 * @param {string} type - ประเภท ('success', 'gold', 'info') เพื่อกำหนดสีขอบ
 * @param {object} action - (Optional) ออบเจกต์ปุ่มแอคชั่น { label: string, url: string }
 */
export function showToast(title, message, icon = '🔔', type = 'success', action = null) {
    let container = document.getElementById('toast-container');
    
    // ถ้ายังไม่มี Container ให้สร้างใหม่
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        // Fixed position ขวาล่าง, z-index สูงเพื่อให้ลอยอยู่บนสุด
        container.className = 'fixed bottom-4 right-4 z-[100000] flex flex-col gap-3 pointer-events-none'; 
        container.style.zIndex = '100000'; // Ensure it stays on top of everything
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    
    let borderClass = 'border-blue-500';
    if (type === 'success') borderClass = 'border-green-500';
    else if (type === 'gold') borderClass = 'border-yellow-500';
    else if (type === 'error') borderClass = 'border-red-500';

    // ใช้ Tailwind CSS สำหรับ Animation และ Styling
    toast.className = `pointer-events-auto bg-white dark:bg-gray-800 border-l-4 ${borderClass} shadow-lg rounded-r-lg p-4 flex items-start gap-3 transform transition-all duration-500 translate-x-full opacity-0 max-w-sm w-80 max-w-[90vw]`;
    
    let actionHtml = '';
    if (action && action.label && action.url) {
        actionHtml = `
            <a href="${action.url}" class="mt-2 inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition-colors shadow-sm no-underline">
                ${action.label}
            </a>
        `;
    }

    toast.innerHTML = `
        <div class="text-2xl flex-shrink-0">${icon}</div>
        <div class="flex-grow">
            <h4 class="font-bold text-gray-800 dark:text-gray-100 text-sm font-kanit">${title}</h4>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-snug">${message}</p>
            ${actionHtml}
        </div>
    `;

    container.appendChild(toast);

    // Animation เลื่อนเข้ามา (Slide In)
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // ตั้งเวลาลบออกอัตโนมัติ (4 วินาที)
    setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0'); // Slide Out
        toast.addEventListener('transitionend', () => {
            toast.remove();
            // ถ้าไม่มี Toast เหลือแล้ว ให้ลบ Container ทิ้ง
            if (container.children.length === 0) {
                container.remove();
            }
        });
    }, 4000);
}