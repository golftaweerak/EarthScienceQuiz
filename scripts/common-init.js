import { initializeDarkMode } from './dark-mode.js';
import { initializeDevTools } from './dev-tools-handler.js';
import { authManager } from './auth-manager.js';
import { challengeManager } from './challenge-manager.js';
// ลบ static import ของ menu-handler ออก เพื่อป้องกัน error ตั้งแต่ต้นไฟล์

/**
 * Initializes all header dropdown menus with robust open/close and outside-click logic.
 */
function initializeHeaderMenus() {
    const setupMenu = (btnId, dropdownId) => {
        const btn = document.getElementById(btnId);
        const dropdown = document.getElementById(dropdownId);
        
        if (!btn || !dropdown) return;

        if (btn.dataset.menuInitialized) return;
        btn.dataset.menuInitialized = 'true';
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = dropdown.classList.contains('hidden');
            
            document.querySelectorAll('[id$="-dropdown"]').forEach(d => {
                if (d.id !== dropdownId && !d.classList.contains('hidden')) {
                    d.classList.remove('opacity-100', 'scale-100');
                    d.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => d.classList.add('hidden'), 200);
                }
            });

            if (isHidden) {
                dropdown.classList.remove('hidden');
                requestAnimationFrame(() => {
                    dropdown.classList.remove('opacity-0', 'scale-95');
                    dropdown.classList.add('opacity-100', 'scale-100');
                });
            } else {
                dropdown.classList.remove('opacity-100', 'scale-100');
                dropdown.classList.add('opacity-0', 'scale-95');
                setTimeout(() => dropdown.classList.add('hidden'), 200);
            }
        });
    };

    setupMenu('main-menu-btn', 'main-menu-dropdown');
    setupMenu('user-hub-btn', 'user-hub-dropdown');

    document.addEventListener('click', (e) => {
        if (!e.target.closest('button[id$="-btn"]') && !e.target.closest('div[id$="-dropdown"]')) {
            document.querySelectorAll('div[id$="-dropdown"]:not(.hidden)').forEach(dropdown => {
                dropdown.classList.remove('opacity-100', 'scale-100');
                dropdown.classList.add('opacity-0', 'scale-95');
                setTimeout(() => dropdown.classList.add('hidden'), 200);
            });
        }
    });
}

/**
 * Initializes all components and functionalities that are common across multiple pages.
 */
export async function initializeCommonComponents() {
    initializeDarkMode();
    initializeHeaderMenus();
    initializeDevTools();

    // Initialize Challenge Manager (Lobby System)
    challengeManager.init();

    // ใช้ Dynamic Import สำหรับ menu-handler
    // ถ้าไฟล์นี้มีปัญหา จะไม่ทำให้ส่วนอื่นของเว็บพังไปด้วย
    try {
        const { initializeMenu } = await import('./menu-handler.js');
        initializeMenu();
    } catch (error) {
        console.warn("Could not initialize menu (menu-handler.js might have errors):", error);
    }

    // Set copyright year
    const yearSpan = document.getElementById("copyright-year");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- User Hub Auth Buttons ---
    const loginBtn = document.getElementById('user-hub-login-btn');
    const logoutBtn = document.getElementById('user-hub-logout-btn');

    if (loginBtn) {
        loginBtn.addEventListener('click', () => authManager.login());
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => authManager.logout());
    }

    // Update UI based on auth state
    authManager.onUserChange(user => {
        const profileLink = document.getElementById('main-header-profile-link');
        const emailDisplay = document.getElementById('user-hub-email');

        if (user) {
            if (profileLink && user.photoURL) {
                profileLink.innerHTML = `<img src="${user.photoURL}" alt="Profile" class="w-full h-full rounded-full object-cover">`;
            }
            
            if (loginBtn) loginBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.remove('hidden');
            
            if (emailDisplay) {
                emailDisplay.textContent = user.email;
                emailDisplay.classList.remove('hidden');
            }
        } else {
            if (profileLink) {
                profileLink.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                `;
            }

            if (loginBtn) loginBtn.classList.remove('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
            
            if (emailDisplay) {
                emailDisplay.classList.add('hidden');
                emailDisplay.textContent = '';
            }
        }
    });
}
