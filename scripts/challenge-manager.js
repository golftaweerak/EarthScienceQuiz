import { db } from './firebase-config.js';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp, collection, addDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { authManager } from './auth-manager.js';
import { showToast } from './toast.js';
import { ModalHandler } from './modal-handler.js';
import { categoryDetails } from './data-manager.js';

export class ChallengeManager {
    constructor() {
        this.currentLobbyId = null;
        this.unsubscribe = null;
        this.chatUnsubscribe = null;
        this.isHost = false;
        this.lobbyModal = null; // Will be initialized after injection
        
        const basePath = window.location.pathname.includes('/quiz/') ? '../' : './';
        this.notificationSound = new Audio(`${basePath}assets/audio/notification.mp3`);
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.injectLobbyModal(); // Inject HTML first
        this.lobbyModal = new ModalHandler('lobby-modal'); // Then initialize handler
        this.setupUI();
        this.checkUrlForLobby();
    }

    injectLobbyModal() {
        if (document.getElementById('lobby-modal')) return;
        
        const modalHtml = `
            <div id="lobby-modal" class="modal hidden fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75" role="dialog" aria-modal="true">
                <div class="modal-container bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 transform transition-all scale-100 relative">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-gray-900 dark:text-white font-kanit mb-2">ห้องเตรียมตัว</h3>
                        <p id="lobby-quiz-name" class="text-sm text-gray-500 dark:text-gray-400 mb-4">กำลังโหลด...</p>
                        <div class="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">
                            <span class="text-sm text-gray-500 dark:text-gray-400">รหัสห้อง:</span>
                            <span id="lobby-room-id" class="text-xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">------</span>
                            <button id="copy-lobby-link-btn" class="ml-2 text-gray-400 hover:text-blue-500 transition-colors" title="คัดลอกรหัส">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>

                    <div class="mb-6">
                        <div class="flex justify-between items-end mb-2">
                            <span class="text-sm font-bold text-gray-700 dark:text-gray-300">ผู้เล่น (<span id="lobby-player-count">0</span>)</span>
                            <span id="lobby-waiting-msg" class="text-xs text-green-600 font-bold animate-pulse hidden">รอหัวหน้าห้องเริ่มเกม...</span>
                        </div>
                        <div id="lobby-players-list" class="space-y-2 max-h-40 overflow-y-auto modern-scrollbar p-1">
                            <!-- Players injected here -->
                        </div>
                    </div>

                    <!-- Chat Section -->
                    <div class="mb-6">
                        <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">แชทในห้อง</h4>
                        <div id="lobby-chat-messages" class="h-32 overflow-y-auto modern-scrollbar bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 text-sm">
                            <!-- Messages will be injected here -->
                        </div>
                        <div class="mt-2 flex gap-2">
                            <input type="text" id="lobby-chat-input" class="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm" placeholder="พิมพ์ข้อความ...">
                            <button id="lobby-chat-send-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition">ส่ง</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button id="lobby-leave-btn" class="py-3 rounded-xl text-gray-600 dark:text-gray-300 font-bold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">ออกจากห้อง</button>
                        <button id="lobby-start-btn" class="py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors shadow-md hidden">เริ่มเกม 🚀</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    setupUI() {
        // Main Entry Point: Open Menu
        const menuBtn = document.getElementById('open-challenge-menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.openMainMenu());
        }

        const startBtn = document.getElementById('lobby-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startGame());
        }

        const leaveBtn = document.getElementById('lobby-leave-btn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.leaveLobby());
        }
        
        const copyBtn = document.getElementById('copy-lobby-link-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                if (this.currentLobbyId) {
                    navigator.clipboard.writeText(this.currentLobbyId).then(() => {
                        showToast('คัดลอกรหัสแล้ว', `รหัสห้อง: ${this.currentLobbyId}`, '📋');
                    });
                }
            });
        }

        const chatInput = document.getElementById('lobby-chat-input');
        const chatSendBtn = document.getElementById('lobby-chat-send-btn');

        if (chatInput && chatSendBtn) {
            chatSendBtn.addEventListener('click', () => this.sendChatMessage());
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }
    }

    openMainMenu() {
        const modalHtml = `
            <div id="challenge-menu-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 anim-fade-in">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-kanit text-center">โหมดท้าดวล ⚔️</h3>
                    
                    <div class="space-y-4">
                        <button id="menu-create-btn" class="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group">
                            <div class="bg-white/20 p-2 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg></div>
                            <div class="text-left">
                                <div class="font-bold text-lg">สร้างห้องใหม่</div>
                                <div class="text-xs text-white/80">เป็นหัวหน้าห้องและชวนเพื่อน</div>
                            </div>
                        </button>

                        <button id="menu-join-btn" class="w-full flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all group">
                            <div class="bg-gray-100 dark:bg-gray-600 p-2 rounded-full text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg></div>
                            <div class="text-left">
                                <div class="font-bold text-gray-800 dark:text-white">เข้าร่วมห้อง</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">ใส่รหัสเพื่อเข้าร่วม</div>
                            </div>
                        </button>
                    </div>

                    <button id="menu-close-btn" class="mt-6 w-full py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-medium transition-colors">ปิดเมนู</button>
                </div>
            </div>
        `;

        const existing = document.getElementById('challenge-menu-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('menu-create-btn').onclick = () => {
            document.getElementById('challenge-menu-modal').remove();
            this.openModeSelection();
        };
        document.getElementById('menu-join-btn').onclick = () => {
            document.getElementById('challenge-menu-modal').remove();
            this.openJoinModal();
        };
        document.getElementById('menu-close-btn').onclick = () => {
            document.getElementById('challenge-menu-modal').remove();
        };
    }

    openModeSelection() {
        const modalHtml = `
            <div id="mode-select-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 anim-fade-in">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 font-kanit text-center">เลือกโหมดการแข่งขัน</h3>
                    <div class="grid grid-cols-1 gap-4">
                        <button id="mode-challenge-btn" class="flex items-center gap-4 p-4 rounded-xl border-2 border-red-100 hover:border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all group text-left">
                            <div class="text-3xl bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">⚔️</div>
                            <div>
                                <div class="font-bold text-red-600 dark:text-red-400">โหมดท้าดวล (Challenge)</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">แข่งกันทำคะแนนให้ได้มากที่สุด ใครดีใครได้!</div>
                            </div>
                        </button>
                        <button id="mode-coop-btn" class="flex items-center gap-4 p-4 rounded-xl border-2 border-blue-100 hover:border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all group text-left">
                            <div class="text-3xl bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm group-hover:scale-110 transition-transform">🤝</div>
                            <div>
                                <div class="font-bold text-blue-600 dark:text-blue-400">โหมดร่วมมือ (Co-op)</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">ช่วยกันทำโจทย์ชุดเดียวกัน คะแนนรวมกันเป็นทีม</div>
                            </div>
                        </button>
                    </div>
                    <button id="mode-cancel-btn" class="mt-6 w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold text-sm">ยกเลิก</button>
                </div>
            </div>
        `;
        
        const existing = document.getElementById('mode-select-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('mode-challenge-btn').onclick = () => { 
            document.getElementById('mode-select-modal').remove(); 
            this.openQuizSelection('challenge'); 
        };
        document.getElementById('mode-coop-btn').onclick = () => { 
            document.getElementById('mode-select-modal').remove(); 
            this.openQuizSelection('coop'); 
        };
        document.getElementById('mode-cancel-btn').onclick = () => { document.getElementById('mode-select-modal').remove(); };
    }

    async openQuizSelection(mode) {
        let quizList = [];
        try {
            const module = await import(`../data/quizzes-list.js?v=${Date.now()}`);
            quizList = module.quizList || [];
        } catch (e) {
            console.error("Failed to load quiz list", e);
            this.createLobby(mode, 'random', 'แบบทดสอบสุ่ม');
            return;
        }

        // Group quizzes by category
        const groupedQuizzes = quizList.reduce((acc, quiz) => {
            const category = quiz.category || "Uncategorized";
            if (!acc[category]) acc[category] = [];
            acc[category].push(quiz);
            return acc;
        }, {});

        // Sort categories
        const sortedCategories = Object.keys(groupedQuizzes).sort((a, b) => {
            const orderA = categoryDetails[a]?.order || 99;
            const orderB = categoryDetails[b]?.order || 99;
            return orderA - orderB;
        });

        const modalHtml = `
            <div id="quiz-select-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 anim-fade-in">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all flex flex-col max-h-[80vh]">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 font-kanit text-center">เลือกชุดข้อสอบ</h3>
                    
                    <div class="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-2">
                        <button id="quiz-select-random" class="w-full flex items-center gap-3 p-3 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-all text-left group mb-4">
                            <div class="w-10 h-10 rounded-full bg-purple-500 text-white flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform">🎲</div>
                            <div>
                                <div class="font-bold text-gray-800 dark:text-gray-100">สุ่มคำถาม (Random)</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400">สุ่มจากทุกวิชา 20 ข้อ</div>
                            </div>
                        </button>

                        <div class="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
                        
                        ${sortedCategories.map(catKey => {
                            const quizzes = groupedQuizzes[catKey];
                            const catDetail = categoryDetails[catKey] || { title: catKey, icon: './assets/icons/study.png' };
                            
                            // Sort quizzes by title
                            quizzes.sort((a, b) => a.title.localeCompare(b.title, 'th'));

                            const quizzesHtml = quizzes.map(q => {
                                const iconSrc = q.icon || './assets/icons/study.png';
                                const isImage = iconSrc.includes('/') || iconSrc.includes('.');
                                const iconDisplay = isImage 
                                    ? `<img src="${iconSrc}" class="w-full h-full object-contain">` 
                                    : `<span class="text-xl">${iconSrc}</span>`;

                                return `
                                    <button data-quiz-id="${q.id}" data-quiz-title="${q.title}" class="quiz-select-item w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all text-left group bg-white dark:bg-gray-800">
                                        <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors overflow-hidden p-1">
                                            ${iconDisplay}
                                        </div>
                                        <div class="min-w-0">
                                            <div class="font-bold text-gray-800 dark:text-gray-100 truncate text-sm">${q.title}</div>
                                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">${q.description || q.category}</div>
                                        </div>
                                    </button>
                                `;
                            }).join('');

                            return `
                                <div class="accordion-item border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-2">
                                    <button class="accordion-header w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center shadow-sm p-1">
                                                <img src="${catDetail.icon}" class="w-full h-full object-contain">
                                            </div>
                                            <div>
                                                <div class="font-bold text-gray-700 dark:text-gray-200 text-sm">${catDetail.title}</div>
                                                <div class="text-[10px] text-gray-500 dark:text-gray-400">${quizzes.length} ชุด</div>
                                            </div>
                                        </div>
                                        <svg class="chevron w-5 h-5 text-gray-400 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                    <div class="accordion-content hidden p-2 space-y-2 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                                        ${quizzesHtml}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <button id="quiz-select-cancel" class="mt-4 w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-bold text-sm">ย้อนกลับ</button>
                </div>
            </div>
        `;

        const existing = document.getElementById('quiz-select-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Accordion Logic
        document.querySelectorAll('.accordion-header').forEach(header => {
            header.onclick = () => {
                const content = header.nextElementSibling;
                const chevron = header.querySelector('.chevron');
                content.classList.toggle('hidden');
                chevron.classList.toggle('rotate-180');
            };
        });

        document.getElementById('quiz-select-random').onclick = () => {
            document.getElementById('quiz-select-modal').remove();
            this.createLobby(mode, 'random', 'แบบทดสอบสุ่ม (Random)');
        };

        document.querySelectorAll('.quiz-select-item').forEach(btn => {
            btn.onclick = () => {
                const quizId = btn.dataset.quizId;
                const quizTitle = btn.dataset.quizTitle;
                document.getElementById('quiz-select-modal').remove();
                this.createLobby(mode, quizId, quizTitle);
            };
        });

        document.getElementById('quiz-select-cancel').onclick = () => {
            document.getElementById('quiz-select-modal').remove();
            this.openModeSelection();
        };
    }

    openJoinModal() {
        const modalHtml = `
            <div id="join-lobby-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 anim-fade-in">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-4 font-kanit text-center">เข้าร่วมการแข่งขัน</h3>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">รหัสห้อง (6 หลัก)</label>
                        <input type="text" id="join-room-input" class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-center text-2xl font-bold tracking-widest focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" placeholder="000000" maxlength="6">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <button id="cancel-join-btn" class="py-2.5 rounded-xl text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">ยกเลิก</button>
                        <button id="confirm-join-btn" class="py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-md">เข้าร่วม</button>
                    </div>
                </div>
            </div>
        `;
        
        const existing = document.getElementById('join-lobby-modal');
        if (existing) existing.remove();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        const input = document.getElementById('join-room-input');
        input.focus();
        
        input.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('confirm-join-btn').click(); });

        document.getElementById('confirm-join-btn').onclick = () => {
            const code = input.value;
            if (code.length === 6) { this.joinLobby(code); document.getElementById('join-lobby-modal').remove(); }
            else { showToast('รหัสไม่ถูกต้อง', 'กรุณากรอกรหัส 6 หลัก', '⚠️', 'error'); }
        };
        document.getElementById('cancel-join-btn').onclick = () => { document.getElementById('join-lobby-modal').remove(); };
    }

    async checkUrlForLobby() {
        const urlParams = new URLSearchParams(window.location.search);
        const lobbyId = urlParams.get('lobby');
        if (lobbyId) {
            const user = await authManager.waitForAuthReady();
            if (user) {
                this.joinLobby(lobbyId);
            } else {
                showToast('กรุณาเข้าสู่ระบบ', 'เพื่อเข้าร่วมการแข่งขัน', '🔒');
            }
            // ล้าง URL เพื่อความสะอาด
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
        }
    }

    generateRoomId() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    getUserAvatar() {
        try {
            const data = JSON.parse(localStorage.getItem('app_gamification_data') || '{}');
            return data.avatar || '🧑‍🎓';
        } catch (e) {
            return '🧑‍🎓';
        }
    }

    async createLobby(mode = 'challenge', quizId = 'random', quizTitle = 'แบบทดสอบสุ่ม') {
        const user = authManager.currentUser;
        if (!user) {
            showToast('ต้องเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนสร้างห้อง', '🔒', 'error');
            return;
        }

        const lobbyId = this.generateRoomId();
        this.currentLobbyId = lobbyId;
        this.isHost = true;

        const lobbyData = {
            hostId: user.uid,
            hostName: user.displayName || 'Host',
            status: 'waiting',
            mode: mode,
            createdAt: serverTimestamp(),
            players: [{
                uid: user.uid,
                name: user.displayName || 'Player',
                avatar: this.getUserAvatar(),
                ready: true,
                score: 0,
                progress: 0
            }],
            quizConfig: {
                id: quizId,
                title: quizTitle,
                amount: quizId === 'random' ? 20 : null,
                seed: Date.now()
            }
        };

        try {
            await setDoc(doc(db, 'lobbies', lobbyId), lobbyData);
            this.openLobbyUI(lobbyId);
            this.listenToLobby(lobbyId);
            showToast('สร้างห้องสำเร็จ', `รหัสห้อง: ${lobbyId}`, '🎮');
        } catch (error) {
            console.error("Error creating lobby:", error);
            showToast('ข้อผิดพลาด', `ไม่สามารถสร้างห้องได้: ${error.message}`, '❌', 'error');
        }
    }

    async joinLobby(lobbyId) {
        if (!navigator.onLine) {
            showToast('ไม่มีสัญญาณเน็ต', 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต', '📶', 'error');
            return;
        }

        const user = authManager.currentUser;
        if (!user) {
            showToast('ไม่ได้เข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนเข้าร่วม', '🔒', 'error');
            return;
        }

        try {
            const lobbyRef = doc(db, 'lobbies', lobbyId);
            const lobbySnap = await getDoc(lobbyRef);

            if (!lobbySnap.exists()) {
                showToast('ไม่พบห้อง', 'รหัสห้องไม่ถูกต้องหรือห้องถูกปิดไปแล้ว', '❌', 'error');
                return;
            }

            // ตรวจสอบว่ามีชื่ออยู่แล้วหรือไม่
            const players = lobbySnap.data().players || [];
            const isAlreadyJoined = players.some(p => p.uid === user.uid);

            // ถ้าเกมเริ่มแล้วและยังไม่ได้จอย จะเข้าไม่ได้
            if (lobbySnap.data().status !== 'waiting' && !isAlreadyJoined) {
                showToast('เข้าห้องไม่ได้', 'การแข่งขันได้เริ่มไปแล้ว', '⚠️', 'error');
                return;
            }

            if (!isAlreadyJoined) {
                const playerData = {
                    uid: user.uid,
                    name: user.displayName || 'Player',
                    avatar: this.getUserAvatar() || '🧑‍🎓',
                    ready: true,
                    score: 0,
                    progress: 0
                };
                await updateDoc(lobbyRef, {
                    players: arrayUnion(playerData)
                });
            }

            this.currentLobbyId = lobbyId;
            this.isHost = (lobbySnap.data().hostId === user.uid);
            this.openLobbyUI(lobbyId);
            this.listenToLobby(lobbyId);
        } catch (error) {
            console.error("Error joining lobby:", error);
            
            let msg = error.message;
            if (error.code === 'permission-denied') {
                msg = 'ไม่มีสิทธิ์เข้าร่วม (ห้องอาจเต็มหรือถูกปิด)';
            } else if (error.code === 'unavailable') {
                msg = 'เซิร์ฟเวอร์ไม่ตอบสนอง (ลองสลับ WiFi/เน็ตมือถือ)';
            }
            
            showToast('ข้อผิดพลาด', `ไม่สามารถเข้าร่วมห้องได้: ${msg}`, '❌', 'error');
        }
    }

    async kickPlayer(targetUid) {
        if (!this.currentLobbyId || !this.isHost) return;
        
        try {
            const lobbyRef = doc(db, 'lobbies', this.currentLobbyId);
            const lobbySnap = await getDoc(lobbyRef);
            if (!lobbySnap.exists()) return;

            const players = lobbySnap.data().players || [];
            const updatedPlayers = players.filter(p => p.uid !== targetUid);

            await updateDoc(lobbyRef, { players: updatedPlayers });
            showToast('เตะผู้เล่นสำเร็จ', 'ผู้เล่นถูกลบออกจากห้องแล้ว', '👋');
        } catch (error) {
            console.error("Error kicking player:", error);
            showToast('เกิดข้อผิดพลาด', 'ไม่สามารถเตะผู้เล่นได้', '❌', 'error');
        }
    }

    async sendChatMessage() {
        if (!this.currentLobbyId) return;
        const user = authManager.currentUser;
        if (!user) return;

        const input = document.getElementById('lobby-chat-input');
        const messageText = input.value.trim();

        if (messageText === '') return;

        input.value = ''; // Clear input immediately

        try {
            const messagesCol = collection(db, 'lobbies', this.currentLobbyId, 'messages');
            await addDoc(messagesCol, {
                uid: user.uid,
                name: user.displayName || 'Player',
                avatar: this.getUserAvatar(),
                text: messageText,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending chat message:", error);
            showToast('ส่งข้อความไม่สำเร็จ', 'เกิดข้อผิดพลาดในการส่งข้อความ', '❌', 'error');
            input.value = messageText; // Restore text on failure
        }
    }

    listenToChat(lobbyId) {
        if (this.chatUnsubscribe) this.chatUnsubscribe();

        const messagesCol = collection(db, 'lobbies', lobbyId, 'messages');
        const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(50));

        let isFirstLoad = true;

        this.chatUnsubscribe = onSnapshot(q, (snapshot) => {
            const messages = [];
            
            if (!isFirstLoad) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data();
                        const myUid = authManager.currentUser?.uid;
                        if (data.uid !== myUid) {
                            this.playNotificationSound();
                        }
                    }
                });
            }

            snapshot.forEach(doc => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            this.updateChatUI(messages.reverse()); // reverse to show oldest first
            isFirstLoad = false;
        }, (error) => {
            console.warn("Chat listener error (Permission/Network):", error);
        });
    }

    playNotificationSound() {
        try {
            this.notificationSound.currentTime = 0;
            this.notificationSound.play().catch(() => {});
        } catch (e) {
            console.warn("Could not play notification sound", e);
        }
    }

    updateChatUI(messages) {
        const container = document.getElementById('lobby-chat-messages');
        if (!container) return;

        const myUid = authManager.currentUser?.uid;

        container.innerHTML = messages.map(msg => {
            const isMe = msg.uid === myUid;
            const timestamp = msg.timestamp?.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) || '';

            const isImage = msg.avatar && (msg.avatar.includes('/') || msg.avatar.includes('.'));
            const avatarHtml = isImage 
                ? `<img src="${msg.avatar}" class="w-full h-full object-cover rounded-full">`
                : `<span class="text-sm">${msg.avatar || '🧑‍🎓'}</span>`;

            const avatarElement = `<div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 shadow-sm">${avatarHtml}</div>`;
            const messageBubble = `
                <div class="flex flex-col gap-1 w-full max-w-[80%]">
                    <div class="flex items-center space-x-2 ${isMe ? 'justify-end' : 'rtl:space-x-reverse'}">
                        <span class="text-xs font-semibold text-gray-900 dark:text-white">${isMe ? 'คุณ' : msg.name}</span>
                        <span class="text-xs font-normal text-gray-500 dark:text-gray-400">${timestamp}</span>
                    </div>
                    <div class="leading-snug p-2.5 rounded-lg ${isMe ? 'rounded-br-none bg-blue-600 text-white' : 'rounded-bl-none bg-gray-200 dark:bg-gray-700'}">
                        <p class="text-sm font-normal break-words">${msg.text}</p>
                    </div>
                </div>`;

            return isMe ? `<div class="flex items-end justify-end gap-2.5 anim-fade-in">${messageBubble}${avatarElement}</div>` : `<div class="flex items-start gap-2.5 anim-fade-in">${avatarElement}${messageBubble}</div>`;
        }).join('');

        // Auto-scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    listenToLobby(lobbyId) {
        if (this.unsubscribe) this.unsubscribe();

        this.unsubscribe = onSnapshot(doc(db, 'lobbies', lobbyId), (doc) => {
            if (!doc.exists()) {
                this.leaveLobby();
                showToast('ห้องถูกปิด', 'โฮสต์ได้ปิดห้องแล้ว', 'ℹ️');
                return;
            }

            const data = doc.data();
            
            // ตรวจสอบว่าเราถูกเตะหรือไม่ (ถ้าไม่มีชื่อเราในรายการผู้เล่น)
            const myUid = authManager.currentUser?.uid;
            if (myUid && data.players) {
                const amIInList = data.players.some(p => p.uid === myUid);
                if (!amIInList) {
                    this.leaveLobby();
                    showToast('คุณถูกเตะ', 'คุณถูกเชิญออกจากห้องโดยหัวหน้าห้อง', '👢', 'error');
                    return;
                }
            }

            this.updateLobbyUI(data);

            // ถ้าสถานะเป็น started และเรายังไม่ได้อยู่ในหน้า Quiz ให้เด้งไป
            const isInQuiz = window.location.pathname.includes('/quiz/');
            if (data.status === 'started' && !isInQuiz) {
                // เพิ่มเงื่อนไข: ถ้าเราเป็น Host และอยากดู Scoreboard เฉยๆ อาจจะไม่ต้องเด้งก็ได้
                // แต่เพื่อความง่าย ให้ทุกคนเด้งไปทำข้อสอบก่อน
                this.goToQuiz(data.quizConfig, data.mode);
            }
        }, (error) => {
            console.error("Lobby listener error:", error);
            if (error.code === 'permission-denied') {
                showToast('ไม่สามารถเข้าถึงห้องได้', 'คุณอาจไม่มีสิทธิ์หรือห้องถูกจำกัดการเข้าถึง', '⚠️', 'error');
                // Optional: this.leaveLobby(); // อาจจะเด้งออกถ้าจำเป็น
            }
        });

        this.listenToChat(lobbyId);
    }

    updateLobbyUI(data) {
        const container = document.getElementById('lobby-players-list');
        const countEl = document.getElementById('lobby-player-count');
        const roomIdEl = document.getElementById('lobby-room-id');
        const titleEl = document.querySelector('#lobby-modal h3');
        const quizNameEl = document.getElementById('lobby-quiz-name');
        
        if (roomIdEl) roomIdEl.textContent = this.currentLobbyId;
        if (countEl) countEl.textContent = data.players.length;
        if (quizNameEl) quizNameEl.textContent = data.quizConfig?.title || 'แบบทดสอบ';

        // จัดเรียงผู้เล่น: ถ้าเริ่มเกมแล้ว เรียงตามคะแนน, ถ้ายังไม่เริ่ม เรียงตามเวลาเข้า
        let players = [...data.players];
        if (data.status === 'started') {
            players.sort((a, b) => (b.score || 0) - (a.score || 0));
            if (data.mode === 'coop') {
                const totalScore = players.reduce((sum, p) => sum + (p.score || 0), 0);
                if (titleEl) titleEl.textContent = `🤝 คะแนนทีม: ${totalScore}`;
            } else {
                if (titleEl) titleEl.textContent = "🏆 กระดานคะแนนสด";
            }
        } else {
            if (titleEl) titleEl.textContent = "ห้องเตรียมตัว";
        }

        if (container) {
            container.innerHTML = players.map((p, index) => {
                const isMe = p.uid === authManager.currentUser?.uid;
                const score = p.score || 0;
                const progress = p.progress || 0;
                const total = p.totalQuestions || 20; 
                const percent = Math.round((progress / total) * 100) || 0;
                
                let kickButtonHtml = '';
                if (this.isHost && !isMe && data.status === 'waiting') {
                    kickButtonHtml = `
                        <button class="kick-player-btn ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" data-uid="${p.uid}" title="เตะออกจากห้อง">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                        </button>
                    `;
                }
                
                let statusHtml = '';
                if (data.status === 'started') {
                    // โหมดแสดงคะแนน Real-time
                    let scoreDisplay = '';
                    if (data.mode === 'coop') {
                        // ในโหมด Co-op แสดงคะแนนที่ช่วยทีมได้
                        scoreDisplay = `+${score}`;
                    } else {
                        scoreDisplay = `${score} <span class="text-xs text-gray-400">pts</span>`;
                    }

                    statusHtml = `
                        <div class="flex flex-col items-end ml-auto min-w-[80px]">
                            <span class="text-lg font-bold text-blue-600 dark:text-blue-400">${scoreDisplay}</span>
                            <span class="text-[10px] text-gray-500">ข้อที่ ${progress}/${total}</span>
                        </div>
                    `;
                } else {
                    // โหมดรอ
                    statusHtml = p.uid === data.hostId 
                        ? '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full ml-auto font-bold">Host</span>' 
                        : '<span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full ml-auto font-bold">Ready</span>';
                }

                return `
                <div class="flex items-center gap-3 p-3 ${isMe ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'} rounded-xl border anim-fade-in relative overflow-hidden transition-all duration-300">
                    ${data.status === 'started' ? `<div class="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-500" style="width: ${percent}%"></div>` : ''}
                    
                    ${data.status === 'started' && data.mode !== 'coop' ? `<div class="font-bold text-gray-400 w-6 text-center">${index + 1}</div>` : ''}
                    
                    <div class="text-3xl bg-white dark:bg-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-sm flex-shrink-0 animate-wiggle" style="animation-delay: ${index * 0.2}s">
                        ${(() => {
                            const isImage = p.avatar && (p.avatar.includes('/') || p.avatar.includes('.'));
                            return isImage 
                                ? `<img src="${p.avatar}" class="w-full h-full rounded-full object-cover">`
                                : (p.avatar || '🧑‍🎓');
                        })()}
                    </div>
                    
                    <div class="flex flex-col min-w-0">
                        <div class="font-bold text-gray-700 dark:text-gray-200 text-sm truncate">${p.name} ${isMe ? '(คุณ)' : ''}</div>
                    </div>
                    ${statusHtml}
                    ${kickButtonHtml}
                </div>
            `}).join('');

            // Bind kick button events
            if (this.isHost) {
                container.querySelectorAll('.kick-player-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('ต้องการเตะผู้เล่นคนนี้ออกจากห้องหรือไม่?')) {
                            this.kickPlayer(btn.dataset.uid);
                        }
                    });
                });
            }
        }

        // จัดการปุ่ม Start
        const startBtn = document.getElementById('lobby-start-btn');
        const waitingMsg = document.getElementById('lobby-waiting-msg');
        
        if (startBtn && waitingMsg) {
            if (data.status === 'started') {
                startBtn.classList.add('hidden');
                waitingMsg.textContent = 'การแข่งขันกำลังดำเนินอยู่...';
                waitingMsg.classList.remove('hidden');
                waitingMsg.classList.add('text-green-600', 'font-bold');
            } else {
                if (this.isHost) {
                    startBtn.classList.remove('hidden');
                    waitingMsg.classList.add('hidden');
                } else {
                    startBtn.classList.add('hidden');
                    waitingMsg.textContent = 'รอหัวหน้าห้องเริ่มเกม...';
                    waitingMsg.classList.remove('hidden');
                    waitingMsg.classList.remove('text-green-600', 'font-bold');
                }
            }
        }
    }

    async startGame() {
        if (!this.isHost || !this.currentLobbyId) return;
        await updateDoc(doc(db, 'lobbies', this.currentLobbyId), {
            status: 'started'
        });
    }

    goToQuiz(config, mode) {
        // ถ้าอยู่ในหน้า Quiz อยู่แล้ว ไม่ต้อง Redirect ซ้ำ
        if (window.location.pathname.includes('/quiz/')) return;

        this.lobbyModal.close();
        window.location.href = `./quiz/index.html?id=${config.id}&mode=${mode || 'challenge'}&lobbyId=${this.currentLobbyId}&amount=${config.amount}&seed=${config.seed}`;
    }

    leaveLobby() {
        if (this.unsubscribe) this.unsubscribe();
        if (this.chatUnsubscribe) this.chatUnsubscribe();
        this.currentLobbyId = null;
        this.isHost = false;
        this.lobbyModal.close();
    }

    openLobbyUI(lobbyId) {
        this.lobbyModal.open();
    }
}
