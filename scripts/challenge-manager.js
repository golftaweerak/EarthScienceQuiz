import { db } from './firebase-config.js';
import { doc, setDoc, getDoc, updateDoc, onSnapshot, arrayUnion, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { authManager } from './auth-manager.js';
import { showToast } from './toast.js';
import { ModalHandler } from './modal-handler.js';

export class ChallengeManager {
    constructor() {
        this.lobbyModal = new ModalHandler('lobby-modal');
        this.currentLobbyId = null;
        this.unsubscribe = null;
        this.isHost = false;
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.setupUI();
        this.checkUrlForLobby();
    }

    setupUI() {
        const createBtn = document.getElementById('create-challenge-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openModeSelection());
        }

        const joinBtn = document.getElementById('join-challenge-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.openJoinModal());
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
                navigator.clipboard.writeText(this.currentLobbyId).then(() => {
                    showToast('คัดลอกรหัสแล้ว', `รหัสห้อง: ${this.currentLobbyId}`, '📋');
                });
            });
        }
    }

    openModeSelection() {
        const modalHtml = `
            <div id="mode-select-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
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
        
        document.getElementById('mode-challenge-btn').onclick = () => { this.createLobby('challenge'); document.getElementById('mode-select-modal').remove(); };
        document.getElementById('mode-coop-btn').onclick = () => { this.createLobby('coop'); document.getElementById('mode-select-modal').remove(); };
        document.getElementById('mode-cancel-btn').onclick = () => { document.getElementById('mode-select-modal').remove(); };
    }

    openJoinModal() {
        const modalHtml = `
            <div id="join-lobby-modal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
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

    async createLobby(mode = 'challenge') {
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
                id: 'random', 
                amount: 20,
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
        const user = authManager.currentUser;
        if (!user) return;

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
                    avatar: this.getUserAvatar(),
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
            showToast('ข้อผิดพลาด', `ไม่สามารถเข้าร่วมห้องได้: ${error.message}`, '❌', 'error');
        }
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
            this.updateLobbyUI(data);

            // ถ้าสถานะเป็น started และเรายังไม่ได้อยู่ในหน้า Quiz ให้เด้งไป
            const isInQuiz = window.location.pathname.includes('/quiz/');
            if (data.status === 'started' && !isInQuiz) {
                // เพิ่มเงื่อนไข: ถ้าเราเป็น Host และอยากดู Scoreboard เฉยๆ อาจจะไม่ต้องเด้งก็ได้
                // แต่เพื่อความง่าย ให้ทุกคนเด้งไปทำข้อสอบก่อน
                this.goToQuiz(data.quizConfig, data.mode);
            }
        });
    }

    updateLobbyUI(data) {
        const container = document.getElementById('lobby-players-list');
        const countEl = document.getElementById('lobby-player-count');
        const roomIdEl = document.getElementById('lobby-room-id');
        const titleEl = document.querySelector('#lobby-modal h3');
        
        if (roomIdEl) roomIdEl.textContent = this.currentLobbyId;
        if (countEl) countEl.textContent = data.players.length;

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
                <div class="flex items-center gap-3 p-3 ${isMe ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'} rounded-xl border animate-fade-in relative overflow-hidden transition-all duration-300">
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
                </div>
            `}).join('');
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
        window.location.href = `./quiz/index.html?mode=${mode || 'challenge'}&lobbyId=${this.currentLobbyId}&amount=${config.amount}&seed=${config.seed}`;
    }

    leaveLobby() {
        if (this.unsubscribe) this.unsubscribe();
        this.currentLobbyId = null;
        this.isHost = false;
        this.lobbyModal.close();
    }

    openLobbyUI(lobbyId) {
        this.lobbyModal.open();
    }
}
