import { db } from './firebase-config.js';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp, collection, addDoc, query, orderBy, limit, deleteDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
        this.isStarting = false; // สถานะกำลังเริ่มเกม (นับถอยหลัง)
        this.isTransitioning = false; // สถานะกำลังเปลี่ยนหน้า (เพื่อไม่ให้ลบออกจากห้อง)
        this.lastStatus = null; // NEW: Track previous status to prevent redirect loops
        this.countdownTimer = null; // ตัวเก็บ timer
        this.lobbyModal = null; // Will be initialized after injection
        this.dom = {}; // Object to hold cached DOM elements
        
        const basePath = window.location.pathname.includes('/quiz/') ? '../' : './';
        this.notificationSound = new Audio(`${basePath}assets/audio/notification.mp3`);
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        // Initialize handlers for existing modals
        this.lobbyModal = new ModalHandler('lobby-modal');

        this._cacheDomElements();
        this._attachEventListeners();
        this.checkUrlForLobby();
    }

    /**
     * Caches frequently accessed DOM elements to improve performance.
     * @private
     */
    _cacheDomElements() {
        this.dom.menuBtn = document.getElementById('open-challenge-menu-btn');
        this.dom.createBtn = document.getElementById('challenge-create-btn');
        this.dom.joinBtn = document.getElementById('challenge-join-btn');
        this.dom.startBtn = document.getElementById('lobby-start-btn');
        this.dom.leaveBtn = document.getElementById('lobby-leave-btn');
        this.dom.copyBtn = document.getElementById('lobby-room-id-display') || document.getElementById('copy-lobby-link-btn');
        this.dom.chatInput = document.getElementById('lobby-chat-input');
        this.dom.chatSendBtn = document.getElementById('lobby-chat-send-btn');
        this.dom.kickAckBtn = document.getElementById('kick-ack-btn');
        this.dom.kickConfirmOk = document.getElementById('kick-confirm-ok-btn');
        this.dom.kickConfirmCancel = document.getElementById('kick-confirm-cancel-btn');
        this.dom.joinInput = document.getElementById('join-room-code-input');
        this.dom.confirmJoinBtn = document.getElementById('confirm-join-btn');
        this.dom.modeSelectButtons = document.querySelectorAll('.mode-select-btn');
        this.dom.randomQuizBtn = document.getElementById('quiz-select-random');
        this.dom.quizListContainer = document.getElementById('challenge-quiz-list');
        this.dom.playersListContainer = document.getElementById('lobby-players-list');
        this.dom.playerCount = document.getElementById('lobby-player-count');
        this.dom.roomIdDisplay = document.getElementById('lobby-room-id-display') || document.getElementById('lobby-room-id');
        this.dom.lobbyTitle = document.querySelector('#lobby-modal h3');
        this.dom.quizName = document.getElementById('lobby-quiz-name');
        this.dom.waitingMsg = document.getElementById('lobby-waiting-msg');
        this.dom.chatContainer = document.getElementById('lobby-chat-messages');
        this.dom.kickConfirmDesc = document.getElementById('kick-confirm-desc');

        // Modals
        this.kickModal = new ModalHandler('kick-notification-modal');
        this.kickConfirmModal = new ModalHandler('kick-confirm-modal');
        this.mainMenuModal = new ModalHandler('challenge-menu-modal');
        this.joinModal = new ModalHandler('join-lobby-modal');
        this.modeModal = new ModalHandler('mode-select-modal');
        this.quizModal = new ModalHandler('quiz-select-modal');
    }

    /**
     * Attaches all necessary event listeners for the challenge UI.
     * Uses event delegation for dynamic lists.
     * @private
     */
    _attachEventListeners() {
        this.dom.menuBtn?.addEventListener('click', () => this.openMainMenu());
        this.dom.createBtn?.addEventListener('click', () => {
            this.mainMenuModal.close();
            this.openModeSelection();
        });
        this.dom.joinBtn?.addEventListener('click', () => {
            this.mainMenuModal.close();
            this.openJoinModal();
        });

        this.dom.startBtn?.addEventListener('click', () => this.startGame());
        this.dom.leaveBtn?.addEventListener('click', () => this.leaveLobby());
        this.dom.copyBtn?.addEventListener('click', () => {
                if (this.currentLobbyId) {
                    navigator.clipboard.writeText(this.currentLobbyId).then(() => {
                        showToast('คัดลอกรหัสแล้ว', `รหัสห้อง: ${this.currentLobbyId}`, '📋');
                    });
                }
        });

        if (this.dom.chatInput && this.dom.chatSendBtn) {
            this.dom.chatSendBtn.addEventListener('click', () => this.sendChatMessage());
            this.dom.chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }
        
        this.dom.kickAckBtn?.addEventListener('click', () => this.kickModal.close());
        this.dom.kickConfirmOk?.addEventListener('click', () => {
                if (this.pendingKickUid) {
                    this.kickPlayer(this.pendingKickUid);
                    this.pendingKickUid = null;
                    this.kickConfirmModal.close();
                }
        });
        this.dom.kickConfirmCancel?.addEventListener('click', () => {
                this.pendingKickUid = null;
                this.kickConfirmModal.close();
        });

        if (this.dom.confirmJoinBtn && this.dom.joinInput) {
             this.dom.confirmJoinBtn.addEventListener('click', () => this.handleJoinSubmit());
             this.dom.joinInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleJoinSubmit();
             });
             this.dom.joinInput.addEventListener('input', (e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); });
        }

        this.dom.modeSelectButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                this.modeModal.close();
                this.openQuizSelection(mode);
            });
        });
        
        this.dom.randomQuizBtn?.addEventListener('click', () => {
                this.quizModal.close();
                this.createLobby(this.selectedMode, 'random', 'แบบทดสอบสุ่ม (Random)');
        });

        // Event delegation for the players list to handle kick buttons
        this.dom.playersListContainer?.addEventListener('click', (e) => {
            const kickBtn = e.target.closest('.kick-player-btn');
            if (this.isHost && kickBtn) {
                e.stopPropagation();
                this.pendingKickUid = kickBtn.dataset.uid;
                const playerName = kickBtn.dataset.name;
                if (this.dom.kickConfirmDesc) this.dom.kickConfirmDesc.textContent = `คุณต้องการเชิญ "${playerName}" ออกจากห้องใช่หรือไม่?`;
                this.kickConfirmModal.open();
            }
        });

        window.addEventListener('beforeunload', () => {
            if (this.currentLobbyId && !this.isTransitioning) {
                this.removePlayerFromLobby(this.currentLobbyId, authManager.currentUser?.uid);
            }
        });
    }

    openMainMenu() {
        this.mainMenuModal.open();
    }

    openModeSelection() {
        this.modeModal.open();
    }

    async openQuizSelection(mode) {
        this.selectedMode = mode;
        let quizList = [];
        try {
            const module = await import(`../data/quizzes-list.js`);
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
            const orderA = (categoryDetails && categoryDetails[a]?.order) || 99;
            const orderB = (categoryDetails && categoryDetails[b]?.order) || 99;
            return orderA - orderB;
        });

        const container = document.getElementById('challenge-quiz-list');
        if (container) {
            container.innerHTML = `
                        ${sortedCategories.map(catKey => {
                            const quizzes = groupedQuizzes[catKey];
                            const catDetail = (categoryDetails && categoryDetails[catKey]) || { title: catKey, icon: './assets/icons/study.png' };
                            
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
                        }).join('')}`;

        // Accordion Logic
        container.querySelectorAll('.accordion-header').forEach(header => {
            header.onclick = () => {
                const content = header.nextElementSibling;
                const chevron = header.querySelector('.chevron');
                content.classList.toggle('hidden');
                chevron.classList.toggle('rotate-180');
            };
        });

        container.querySelectorAll('.quiz-select-item').forEach(btn => {
            btn.onclick = () => {
                const quizId = btn.dataset.quizId;
                const quizTitle = btn.dataset.quizTitle;
                this.quizModal.close();
                this.createLobby(this.selectedMode, quizId, quizTitle);
            };
        });
        }
        
        this.quizModal.open();
    }

    openJoinModal() {
        this.joinModal.open();
        setTimeout(() => this.dom.joinInput?.focus(), 100);
    }

    async handleJoinSubmit() {
        const input = document.getElementById('join-room-code-input');
        const code = input.value;
        if (code.length === 6) { 
            const btn = document.getElementById('confirm-join-btn');
            const originalText = btn.innerHTML;
            
            // Set loading state
            btn.disabled = true;
            btn.innerHTML = `<svg class="animate-spin h-5 w-5 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> กำลังเข้า...`;
            btn.classList.add('opacity-75', 'cursor-not-allowed');

            const success = await this.joinLobby(code);
            if (success) {
                this.joinModal.close();
            } 
            
            // Reset button state
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-75', 'cursor-not-allowed');
            if (!success) input.focus();
            
        } else { 
            showToast('รหัสไม่ถูกต้อง', 'กรุณากรอกรหัส 6 หลัก', '⚠️', 'error'); 
        }
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

    /**
     * Joins an existing lobby using a 6-digit code. Uses a Firestore transaction for atomicity.
     * @param {string} lobbyId The 6-digit lobby code.
     * @returns {Promise<boolean>} True if join was successful, false otherwise.
     */
    async joinLobby(lobbyId) {
        if (!navigator.onLine) {
            showToast('ไม่มีสัญญาณเน็ต', 'กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต', '📶', 'error');
            return false;
        }
        const user = authManager.currentUser;
        if (!user) {
            showToast('ไม่ได้เข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนเข้าร่วม', '🔒', 'error');
            return false;
        }
    
        try {
            const lobbyRef = doc(db, 'lobbies', lobbyId);
            let hostId = null;
    
            await runTransaction(db, async (transaction) => {
                const lobbySnap = await transaction.get(lobbyRef);
                if (!lobbySnap.exists()) {
                    throw new Error("Lobby not found");
                }
    
                const data = lobbySnap.data();
                hostId = data.hostId;
                const players = data.players || [];
                const isAlreadyJoined = players.some(p => p.uid === user.uid);
    
                if (data.status !== 'waiting' && !isAlreadyJoined) {
                    throw new Error("Game has already started");
                }
    
                if (!isAlreadyJoined) {
                    const playerData = { uid: user.uid, name: user.displayName || 'Player', avatar: this.getUserAvatar(), ready: true, score: 0, progress: 0 };
                    transaction.update(lobbyRef, { players: arrayUnion(playerData) });
                }
            });
    
            this.currentLobbyId = lobbyId;
            this.isHost = (hostId === user.uid);
            this.openLobbyUI(lobbyId);
            this.listenToLobby(lobbyId);
            return true;
        } catch (error) {
            console.error("Error joining lobby:", error);
            let msg = error.message;
            if (error.code === 'permission-denied') {
                msg = 'ไม่มีสิทธิ์เข้าร่วม (ห้องอาจเต็มหรือถูกปิด)';
            } else if (error.code === 'unavailable') {
                msg = 'เซิร์ฟเวอร์ไม่ตอบสนอง (ลองสลับ WiFi/เน็ตมือถือ)';
            }
            
            if (error.message === "Lobby not found") {
                showToast('ไม่พบห้อง', 'รหัสห้องไม่ถูกต้องหรือห้องถูกปิดไปแล้ว', '❌', 'error');
            } else if (error.message === "Game has already started") {
                showToast('เข้าห้องไม่ได้', 'การแข่งขันได้เริ่มไปแล้ว', '⚠️', 'error');
            } else {
                showToast('ข้อผิดพลาด', `ไม่สามารถเข้าร่วมห้องได้: ${msg}`, '❌', 'error');
            }
            return false;
        }
    }

    async kickPlayer(targetUid) {
        if (!this.currentLobbyId || !this.isHost) return;
        
        await this.removePlayerFromLobby(this.currentLobbyId, targetUid);
        showToast('เตะผู้เล่นสำเร็จ', 'ผู้เล่นถูกลบออกจากห้องแล้ว', '👋');
    }

    /**
     * Removes a player from a lobby. If the host leaves, the lobby is deleted.
     * Uses a Firestore transaction for atomicity.
     * @param {string} lobbyId The ID of the lobby.
     * @param {string} uid The UID of the player to remove.
     */
    async removePlayerFromLobby(lobbyId, uid) {
        if (!lobbyId || !uid) return;
        try {
            const lobbyRef = doc(db, 'lobbies', lobbyId);
            await runTransaction(db, async (transaction) => {
                const lobbySnap = await transaction.get(lobbyRef);
                if (!lobbySnap.exists()) {
                    return;
                }

                const data = lobbySnap.data();
                // If the host is the one being removed, delete the entire lobby.
                if (data.hostId === uid) {
                    transaction.delete(lobbyRef);
                    return;
                }

                const players = data.players || [];
                const updatedPlayers = players.filter(p => p.uid !== uid);

                // If the lobby becomes empty, delete it.
                if (updatedPlayers.length === 0) {
                    transaction.delete(lobbyRef);
                } 
                // Only update if a player was actually removed.
                else if (updatedPlayers.length < players.length) {
                    transaction.update(lobbyRef, { players: updatedPlayers });
                }
            });
        } catch (error) {
            console.error("Error in removePlayerFromLobby transaction:", error);
            // Non-critical error, so no toast is shown to the user.
        }
    }

    async sendChatMessage() {
        if (!this.currentLobbyId) return;
        const user = authManager.currentUser;
        if (!user) return;

        const input = this.dom.chatInput;
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
        const container = this.dom.chatContainer;
        if (!container) return;

        // Check if user is near bottom before updating (to prevent jumping while reading history)
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

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

        // Auto-scroll to bottom only if user was already near bottom
        if (isNearBottom) {
            container.scrollTop = container.scrollHeight;
        }
    }

    listenToLobby(lobbyId) {
        if (this.unsubscribe) this.unsubscribe();

        // Reset status tracker when listening to a new lobby
        this.lastStatus = null;

        this.unsubscribe = onSnapshot(doc(db, 'lobbies', lobbyId), (docSnapshot) => {
            if (!docSnapshot.exists()) {
                this.leaveLobby();
                showToast('ห้องถูกปิด', 'โฮสต์ได้ปิดห้องแล้ว', 'ℹ️');
                return;
            }

            const data = docSnapshot.data();
            
            // ตรวจสอบว่าเราถูกเตะหรือไม่ (ถ้าไม่มีชื่อเราในรายการผู้เล่น)
            const myUid = authManager.currentUser?.uid;
            if (myUid && data.players) {
                const amIInList = data.players.some(p => p.uid === myUid);
                if (!amIInList) {
                    this.leaveLobby();
                    if (this.kickModal) this.kickModal.open();
                    return;
                }
            }

            this.updateLobbyUI(data);

            // FIX: Prevent infinite redirect loop and handle game start transition
            const isInQuiz = window.location.pathname.includes('/quiz/');
            if (data.status === 'started' && !isInQuiz) {
                // Only auto-redirect if we witnessed the transition from 'waiting' to 'started'
                if (this.lastStatus === 'waiting') {
                    this.goToQuiz(data.quizConfig, data.mode);
                }
                // If lastStatus was null (first load) or 'started' (re-load), do NOT auto-redirect.
            }
            this.lastStatus = data.status;
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
        const container = this.dom.playersListContainer;
        const countEl = this.dom.playerCount;
        const roomIdEl = this.dom.roomIdDisplay;
        const titleEl = this.dom.lobbyTitle;
        const quizNameEl = this.dom.quizName;

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
                    kickButtonHtml = /*html*/`
                        <button class="kick-player-btn ml-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" data-uid="${p.uid}" data-name="${p.name}" title="เตะออกจากห้อง">
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

                    statusHtml = /*html*/`
                        <div class="flex flex-col items-end ml-auto min-w-[80px]">
                            <span class="text-lg font-bold text-blue-600 dark:text-blue-400">${scoreDisplay}</span>
                            <span class="text-[10px] text-gray-500 dark:text-gray-400">ข้อที่ ${progress}/${total}</span>
                        </div>
                    `;
                } else {
                    // โหมดรอ
                    statusHtml = p.uid === data.hostId 
                        ? /*html*/'<span class="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full ml-auto font-bold">Host</span>' 
                        : /*html*/'<span class="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded-full ml-auto font-bold">Ready</span>';
                }

                return /*html*/`
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

        }

        // จัดการปุ่ม Start
        const startBtn = this.dom.startBtn;
        const waitingMsg = this.dom.waitingMsg;
        
        if (startBtn && waitingMsg) {
            if (data.status === 'started') {
                startBtn.classList.add('hidden');
                if (!this.isStarting) { // แสดงข้อความนี้เฉพาะตอนที่ยังไม่เริ่มนับถอยหลัง (เช่น เข้ามาทีหลัง)
                    // NEW: Show manual join button for late joiners or re-joiners
                    if (!this.isHost) {
                        waitingMsg.innerHTML = `
                            <div class="flex flex-col items-center gap-2">
                                <span class="text-green-600 dark:text-green-400 font-bold">การแข่งขันเริ่มแล้ว!</span>
                                <button id="manual-join-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-transform transform hover:scale-105">
                                    เข้าสู่การแข่งขัน
                                </button>
                            </div>
                        `;
                        waitingMsg.classList.remove('hidden');
                        document.getElementById('manual-join-btn')?.addEventListener('click', () => this.goToQuiz(data.quizConfig, data.mode));
                    } else {
                        waitingMsg.textContent = 'การแข่งขันกำลังดำเนินอยู่...';
                        waitingMsg.classList.remove('hidden');
                        waitingMsg.classList.add('text-green-600', 'dark:text-green-400', 'font-bold');
                    }
                }
            } else {
                if (this.isHost) {
                    startBtn.classList.remove('hidden');
                    waitingMsg.classList.add('hidden');
                } else {
                    startBtn.classList.add('hidden');
                    waitingMsg.textContent = 'รอหัวหน้าห้องเริ่มเกม...';
                    waitingMsg.classList.remove('hidden', 'text-green-600', 'dark:text-green-400', 'font-bold');
                    waitingMsg.classList.add('text-gray-500', 'dark:text-gray-400');
                }
            }
        }
    }

    startCountdownAndGo(quizConfig, mode) {
        const waitingMsg = this.dom.waitingMsg;
        const startBtn = this.dom.startBtn;
        
        if (startBtn) startBtn.classList.add('hidden');
        
        if (waitingMsg) {
            waitingMsg.classList.remove('hidden');
            waitingMsg.classList.remove('text-gray-500');
            waitingMsg.classList.add('text-green-600', 'dark:text-green-400', 'font-bold', 'text-2xl', 'animate-pulse');
        }

        let count = 3;
        const updateCount = () => {
            if (waitingMsg) waitingMsg.textContent = `เริ่มเกมใน ${count}...`;
        };
        updateCount();

        this.countdownTimer = setInterval(() => {
            count--;
            if (count > 0) {
                updateCount();
            } else {
                clearInterval(this.countdownTimer);
                this.countdownTimer = null;
                if (waitingMsg) waitingMsg.textContent = "ไปลุยกันเลย! 🚀";
                setTimeout(() => {
                    this.goToQuiz(quizConfig, mode);
                }, 500);
            }
        }, 1000);
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

        this.isTransitioning = true;
        this.lobbyModal.close();
        window.location.href = `./quiz/index.html?id=${config.id}&mode=${mode || 'challenge'}&lobbyId=${this.currentLobbyId}&amount=${config.amount}&seed=${config.seed}`;
    }

    async leaveLobby() {
        const lobbyId = this.currentLobbyId;
        const user = authManager.currentUser;

        if (this.unsubscribe) this.unsubscribe();
        if (this.chatUnsubscribe) this.chatUnsubscribe();
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.currentLobbyId = null;
        this.isHost = false;
        this.isStarting = false;
        this.lobbyModal.close();

        // Remove from DB
        if (lobbyId && user) {
            await this.removePlayerFromLobby(lobbyId, user.uid);
        }
    }

    openLobbyUI(lobbyId) {
        this.lobbyModal.open();
    }
}
