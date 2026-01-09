// scripts/auth-manager.js
import { auth, db, googleProvider } from './firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch, deleteDoc, terminate } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast } from './toast.js';

class AuthManagerInternal {
    constructor() {
        this.currentUser = null;
        this.onUserChangeCallbacks = [];
        this.isInitialized = false;
        this.isLoggingIn = false;
        this.LOCAL_STORAGE_KEY = 'app_gamification_data'; // คีย์หลักที่คุณใช้เก็บข้อมูลใน LocalStorage
        this.unsubscribeAuth = null; // เก็บฟังก์ชันยกเลิก listener ของ Firebase Auth
        
        // Promise เพื่อรอให้ตรวจสอบ Auth เสร็จสิ้นครั้งแรก
        this.authReadyPromise = new Promise((resolve) => {
            this.resolveAuthReady = resolve;
        });
        
        this.init();
        this.handlePostLogout();
        this.setupNetworkListeners();
        this.setupHeaderUI();
    }

    init() {
        this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            const previousUser = this.currentUser; // เก็บสถานะผู้ใช้ก่อนหน้า
            this.isInitialized = true;
            this.currentUser = user;
            if (user) {
                console.log("User signed in:", user.uid);
                
                // NEW: ตรวจสอบว่ามีการสลับบัญชีหรือไม่ (Switching Account)
                // ถ้ามีผู้ใช้ก่อนหน้า และไม่ตรงกับผู้ใช้ใหม่ ให้ล้างข้อมูลในเครื่องทิ้งเพื่อไม่ให้ข้อมูลปนกัน
                if (previousUser && previousUser.uid !== user.uid) {
                    console.log("Account switched. Clearing local data to prevent merge.");
                    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
                    localStorage.removeItem('last_cloud_sync');
                    localStorage.removeItem('customQuizzesList');
                    
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('quizState-')) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(k => localStorage.removeItem(k));
                }
                
                // Add delay to allow connection to stabilize
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    await this.syncLocalToCloud(user);
                    await this.syncHistory(user); // ซิงค์ประวัติการทำข้อสอบ
                } catch (e) {
                    console.warn("Data sync failed:", e);
                }
            } else {
                console.log("User signed out");
            }
            this.notifyUserChange(user);
            
            // แจ้งว่า Auth ตรวจสอบเสร็จแล้ว (ไม่ว่าจะล็อกอินหรือไม่)
            if (this.resolveAuthReady) {
                this.resolveAuthReady(user);
                this.resolveAuthReady = null; // เรียกแค่ครั้งเดียว
            }
        });
    }

    handlePostLogout() {
        if (sessionStorage.getItem('logout_toast')) {
            sessionStorage.removeItem('logout_toast');
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    showToast('ออกจากระบบสำเร็จ', 'คุณได้ออกจากระบบเรียบร้อยแล้ว', '👋');
                });
            } else {
                showToast('ออกจากระบบสำเร็จ', 'คุณได้ออกจากระบบเรียบร้อยแล้ว', '👋');
            }
        }

        if (sessionStorage.getItem('login_toast')) {
            sessionStorage.removeItem('login_toast');
            
            // ตรวจสอบว่าอยู่หน้า Profile แล้วหรือยัง และกำหนด URL ให้ถูกต้องตามโฟลเดอร์ที่อยู่
            const isProfilePage = window.location.pathname.includes('profile.html');
            const isInQuizFolder = window.location.pathname.includes('/quiz/');
            const profileUrl = isInQuizFolder ? '../profile.html' : './profile.html';
            const action = isProfilePage ? null : { label: 'ไปที่หน้า Profile', url: profileUrl };

            const showLoginToast = () => showToast('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับกลับมา!', '🎉', 'success', action);
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', showLoginToast);
            } else {
                showLoginToast();
            }
        }
    }

    setupNetworkListeners() {
        const updateStatus = () => {
            const statusEl = document.getElementById('header-network-status');
            if (!statusEl) return;

            if (navigator.onLine) {
                // Online: Show briefly
                statusEl.innerHTML = `
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 shadow-sm">
                        <span class="relative flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span class="text-[10px] font-bold text-green-700 dark:text-green-300">ONLINE</span>
                    </div>
                `;
                statusEl.classList.remove('hidden');
                
                if (this.onlineStatusTimeout) clearTimeout(this.onlineStatusTimeout);
                this.onlineStatusTimeout = setTimeout(() => {
                    statusEl.classList.add('hidden');
                }, 3000);
            } else {
                // Offline: Show permanently
                if (this.onlineStatusTimeout) clearTimeout(this.onlineStatusTimeout);
                statusEl.innerHTML = `
                    <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l1.414 1.414a4 4 0 005.656 5.656l1.298 1.297zm-7.98 1.122a1 1 0 001.414 1.415l11.314-11.315a1 1 0 00-1.414-1.414L5.497 16.012z" clip-rule="evenodd" />
                        </svg>
                        <span class="text-[10px] font-bold text-red-700 dark:text-red-300">OFFLINE</span>
                    </div>
                `;
                statusEl.classList.remove('hidden');
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        
        // Check periodically for header element injection
        let attempts = 0;
        const checkHeader = setInterval(() => {
            const statusEl = document.getElementById('header-network-status');
            if (statusEl) {
                clearInterval(checkHeader);
                if (!navigator.onLine) updateStatus();
            }
            // Stop checking after 10 seconds (10 attempts) to save resources
            attempts++;
            if (attempts >= 10) clearInterval(checkHeader);
        }, 1000);
    }

    // จัดการ UI ของ Header (ปุ่ม Login/Logout)
    setupHeaderUI() {
        let attempts = 0;
        const checkHeader = setInterval(() => {
            const loginBtn = document.getElementById('user-hub-login-btn');
            const logoutBtn = document.getElementById('user-hub-logout-btn');
            const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
            const userEmailEl = document.getElementById('user-hub-email');

            // ถ้าเจอ Element อย่างน้อยหนึ่งตัว แสดงว่า Header โหลดมาแล้ว
            if (loginBtn || logoutBtn) {
                clearInterval(checkHeader);

                // ผูก Event Click
                if (loginBtn) loginBtn.addEventListener('click', () => this.login());
                if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());
                if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', () => this.logout());

                // ฟังก์ชันอัปเดตการแสดงผลปุ่ม
                const updateUI = (user) => {
                    if (user) {
                        if (loginBtn) loginBtn.classList.add('hidden');
                        if (logoutBtn) logoutBtn.classList.remove('hidden');
                        if (mobileLogoutBtn) mobileLogoutBtn.classList.remove('hidden');
                        if (userEmailEl) {
                            userEmailEl.textContent = user.email;
                            userEmailEl.classList.remove('hidden');
                        }
                    } else {
                        if (loginBtn) loginBtn.classList.remove('hidden');
                        if (logoutBtn) logoutBtn.classList.add('hidden');
                        if (mobileLogoutBtn) mobileLogoutBtn.classList.add('hidden');
                        if (userEmailEl) userEmailEl.classList.add('hidden');
                    }
                };

                // ลงทะเบียนเพื่อรอรับการเปลี่ยนแปลงสถานะ User
                this.onUserChange(updateUI);
            }
            
            attempts++;
            if (attempts >= 20) clearInterval(checkHeader); // หยุดหาหลังจาก 10 วินาที
        }, 500);
    }

    // ฟังก์ชัน Login
    async login() {
        if (this.isLoggingIn) return;
        this.isLoggingIn = true;

        try {
            const result = await signInWithPopup(auth, googleProvider);
            sessionStorage.setItem('login_toast', 'true');
            
            // Redirect to profile if on homepage (and not in a quiz subfolder), otherwise reload to preserve context
            const path = window.location.pathname;
            const isHomePage = (path.endsWith('/') || path.endsWith('index.html')) && !path.includes('/quiz/');
            
            if (isHomePage) {
                window.location.href = './profile.html';
            } else {
                window.location.reload();
            }
            
            return result.user;
        } catch (error) {
            console.error("Login failed:", error);
            
            if (error.code === 'auth/cancelled-popup-request') {
                return;
            }
            
            let errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
            if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'ระบบล็อกอิน (Google) ยังไม่เปิดใช้งานใน Firebase Console';
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = 'คุณปิดหน้าต่างล็อกอินก่อนทำรายการสำเร็จ';
            } else if (error.code === 'auth/popup-blocked') {
                errorMessage = 'เบราว์เซอร์บล็อกหน้าต่างป๊อปอัป กรุณาอนุญาตป๊อปอัป';
            }

            showToast('เข้าสู่ระบบไม่สำเร็จ', errorMessage, '❌', 'error');
            throw error;
        } finally {
            this.isLoggingIn = false;
        }
    }

    // ฟังก์ชัน Logout
    async logout() {
        try {
            await signOut(auth);
            
            // Clear main gamification data to prevent data leakage
            localStorage.removeItem(this.LOCAL_STORAGE_KEY);
            localStorage.removeItem('last_cloud_sync');
            // NEW: Also clear the custom quizzes list on logout
            localStorage.removeItem('customQuizzesList');

            // Clear quiz history items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('quizState-')) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear SessionStorage to remove any temporary session data
            sessionStorage.clear();

            // Set flag to show toast after reload
            sessionStorage.setItem('logout_toast', 'true');

            // Optional: ล้างหน้าจอหรือรีโหลด
            window.location.reload();
        } catch (error) {
            console.error("Logout failed:", error);
            showToast('ออกจากระบบไม่สำเร็จ', 'เกิดข้อผิดพลาดในการออกจากระบบ', '❌', 'error');
        }
    }

    // ลงทะเบียน Callback เพื่ออัปเดต UI เมื่อสถานะล็อกอินเปลี่ยน
    onUserChange(callback) {
        this.onUserChangeCallbacks.push(callback);
        if (this.isInitialized) {
            callback(this.currentUser);
        }
        // Return unsubscribe function to prevent memory leaks in consuming components
        return () => {
            this.onUserChangeCallbacks = this.onUserChangeCallbacks.filter(cb => cb !== callback);
        };
    }

    notifyUserChange(user) {
        this.onUserChangeCallbacks.forEach(cb => cb(user));
    }

    // ฟังก์ชันสำหรับรอให้ Auth พร้อมใช้งาน
    async waitForAuthReady() {
        await this.authReadyPromise;
        return this.currentUser;
    }

    /**
     * Helper function to retry Firestore operations on failure
     * @param {Function} operation - Async function to execute
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} baseDelay - Initial delay in ms
     */
    async retryOperation(operation, maxRetries = 3, baseDelay = 2000) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                // Retry on network errors or unavailable service
                const isRetryable = error.code === 'unavailable' || 
                                    error.message?.includes('offline') || 
                                    error.message?.includes('transport') ||
                                    error.message?.includes('network');
                
                if (!isRetryable) throw error;
                
                const delay = baseDelay * Math.pow(2, i);
                console.warn(`Firestore operation failed (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`, error);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }

    // --- ส่วนจัดการข้อมูล (Data Sync) ---

    // ฟังก์ชันหลักสำหรับโหลดข้อมูล (ใช้แทนการดึง localStorage โดยตรง)
    async loadUserData() {
        if (this.currentUser) {
            // ถ้าล็อกอิน ให้ดึงจาก Firestore
            const docRef = doc(db, "users", this.currentUser.uid);
            
            try {
                const docSnap = await this.retryOperation(() => getDoc(docRef));
                
                if (docSnap.exists()) {
                    const cloudData = docSnap.data();
                    // อัปเดตลง LocalStorage ด้วยเพื่อให้โค้ดเดิมทำงานต่อได้ (Hybrid)
                    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
                    this.updateLastSyncTime();
                    return cloudData;
                }
            } catch (error) {
                console.warn("Failed to load cloud data after retries, falling back to local:", error);
            }
        }
        
        // ถ้าไม่ล็อกอิน หรือไม่มีข้อมูลบน Cloud ให้ดึงจาก LocalStorage
        const localData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        return localData ? JSON.parse(localData) : null;
    }

    // ฟังก์ชันหลักสำหรับบันทึกข้อมูล (ใช้แทนการ setItem)
    async saveUserData(data) {
        // 1. บันทึกลง LocalStorage เสมอ (เพื่อความเร็วและ Offline เบื้องต้น)
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data));

        // 2. ถ้าล็อกอิน ให้บันทึกลง Firestore ด้วย
        if (this.currentUser) {
            try {
                const userRef = doc(db, "users", this.currentUser.uid);
                // ใช้ setDoc แบบ merge: true เพื่อไม่ให้ข้อมูลอื่นหาย
                await this.retryOperation(() => setDoc(userRef, data, { merge: true }));
                this.updateLastSyncTime();
                
                // อัปเดต Leaderboard (ถ้ามี)
                if (data.xp !== undefined) {
                    const leaderboardRef = doc(db, "leaderboard", this.currentUser.uid);
                    await this.retryOperation(() => setDoc(leaderboardRef, {
                        displayName: this.currentUser.displayName || "Anonymous",
                        photoURL: this.currentUser.photoURL,
                        xp: data.xp,
                        level: data.level || 1,
                        astronomyTrackXP: data.astronomyTrackXP || 0,
                        earthTrackXP: data.earthTrackXP || 0,
                        astronomyXP: data.astronomyXP || 0,
                        geologyXP: data.geologyXP || 0,
                        meteorologyXP: data.meteorologyXP || 0,
                        selectedTitle: data.selectedTitle || null,
                        oceanographyXP: data.oceanographyXP || 0,
                        avatar: data.avatar || null,
                        lastUpdated: new Date()
                    }, { merge: true }));
                }
            } catch (e) {
                console.error("Error saving to cloud:", e);
            }
        }
    }

    // ฟังก์ชัน Sync ข้อมูลเก่าขึ้น Cloud เมื่อล็อกอินครั้งแรก
    async syncLocalToCloud(user) {
        const localDataString = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (!localDataString) return; // ไม่มีข้อมูลเก่า ไม่ต้องทำอะไร

        const localData = JSON.parse(localDataString);
        const userRef = doc(db, "users", user.uid);
        const docSnap = await this.retryOperation(() => getDoc(userRef));

        if (!docSnap.exists()) {
            // กรณี: ผู้ใช้ใหม่บน Cloud แต่มีข้อมูลในเครื่อง (ผู้เรียนเก่าเพิ่งล็อกอิน)
            // ให้อัปโหลดข้อมูลในเครื่องขึ้น Cloud ทันที
            console.log("Migrating local data to cloud...");
            await this.retryOperation(() => setDoc(userRef, localData));
            
            // สร้าง Leaderboard entry ด้วย
            if (localData.xp !== undefined || localData.totalXP) {
                await this.retryOperation(() => setDoc(doc(db, "leaderboard", user.uid), {
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    xp: localData.xp || localData.totalXP || 0,
                    level: localData.level || 1,
                    astronomyTrackXP: localData.astronomyTrackXP || 0,
                    earthTrackXP: localData.earthTrackXP || 0,
                    astronomyXP: localData.astronomyXP || 0,
                    geologyXP: localData.geologyXP || 0,
                    meteorologyXP: localData.meteorologyXP || 0,
                    oceanographyXP: localData.oceanographyXP || 0,
                    selectedTitle: localData.selectedTitle || null,
                    avatar: localData.avatar || null,
                    lastUpdated: new Date()
                }, { merge: true }));
            }
            alert("ซิงค์ข้อมูลเก่าของคุณขึ้นระบบเรียบร้อยแล้ว!");
        } else {
            // กรณี: มีข้อมูลบน Cloud อยู่แล้ว (อาจจะเล่นเครื่องอื่นมา)
            // กลยุทธ์: ใช้ข้อมูลบน Cloud เป็นหลัก (Overwrite Local)
            // หรือถ้าคุณต้องการ Logic ที่ซับซ้อนกว่านี้ (เช่น เอา XP ที่มากกว่า) ก็แก้ตรงนี้ได้
            console.log("Found cloud data, syncing to local...");
            const cloudData = docSnap.data();
            localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
        }
    }

    // บันทึกเวลาซิงค์ล่าสุดและแจ้งเตือน UI
    updateLastSyncTime() {
        const now = new Date().toISOString();
        localStorage.setItem('last_cloud_sync', now);
        // ส่ง Event ให้หน้าจออื่นรับรู้
        window.dispatchEvent(new CustomEvent('auth-synced', { detail: { time: now } }));
    }

    getLastSyncTime() {
        return localStorage.getItem('last_cloud_sync');
    }

    // --- ส่วนจัดการการลบข้อมูล (Deletion Management) ---

    /**
     * ลบประวัติการทำแบบทดสอบ 1 รายการ ทั้งใน LocalStorage และ Firestore
     * @param {string} key - The storage key of the quiz history to delete (e.g., 'quizState-...')
     */
    async deleteQuizHistoryItem(key) {
        localStorage.removeItem(key); // Remove from local
        if (this.currentUser) {
            try {
                const docRef = doc(db, "users", this.currentUser.uid, "quiz_history", key);
                await deleteDoc(docRef);
                console.log(`Deleted history item ${key} from cloud.`);
            } catch (e) {
                console.error("Error deleting quiz history item from cloud:", e);
            }
        }
    }

    /**
     * รีเซ็ตข้อมูล Gamification ทั้งหมด (XP, Level, Badges)
     */
    async resetGamificationData() {
        localStorage.removeItem(this.LOCAL_STORAGE_KEY); // Remove from local
        if (this.currentUser) {
            try {
                const batch = writeBatch(db);
                const userDocRef = doc(db, "users", this.currentUser.uid);
                const leaderboardDocRef = doc(db, "leaderboard", this.currentUser.uid);
                
                // ลบข้อมูลผู้ใช้และข้อมูลบน Leaderboard
                batch.delete(userDocRef);
                batch.delete(leaderboardDocRef);
                
                await batch.commit();
                console.log("Deleted user gamification and leaderboard data from cloud.");
            } catch (e) {
                console.error("Error resetting gamification data on cloud:", e);
            }
        }
    }

    /**
     * ลบประวัติการทำข้อสอบและแบบทดสอบที่สร้างเองทั้งหมดจาก Cloud
     */
    async clearAllCloudHistory() {
        if (!this.currentUser) return;

        const batch = writeBatch(db);
        let deletedCount = 0;

        try {
            // ลบ quiz_history ทั้งหมด
            const historyRef = collection(db, "users", this.currentUser.uid, "quiz_history");
            const historySnapshot = await getDocs(historyRef);
            historySnapshot.forEach(doc => { batch.delete(doc.ref); deletedCount++; });

            // ลบ custom_quizzes ทั้งหมด
            const customQuizzesRef = collection(db, "users", this.currentUser.uid, "custom_quizzes");
            const customQuizzesSnapshot = await getDocs(customQuizzesRef);
            customQuizzesSnapshot.forEach(doc => { batch.delete(doc.ref); deletedCount++; });

            if (deletedCount > 0) await batch.commit();
            console.log(`Successfully deleted ${deletedCount} history/custom quiz documents from cloud.`);
        } catch (e) {
            console.error("Error clearing all cloud history:", e);
        }
    }

    // --- ส่วนจัดการประวัติการทำข้อสอบ (Quiz History Sync) ---

    // ฟังก์ชันซิงค์ประวัติทั้งหมด (ทำงานตอนล็อกอิน)
    async syncHistory(user) {
        if (!user) return;
        
        const historyRef = collection(db, "users", user.uid, "quiz_history");
        
        try {
            // 1. ดึงข้อมูลจาก Cloud มาเทียบ
            const cloudSnapshot = await this.retryOperation(() => getDocs(historyRef));
            const cloudMap = new Map();
            cloudSnapshot.forEach(doc => {
                cloudMap.set(doc.id, doc.data());
            });

            const batch = writeBatch(db);
            let batchCount = 0;
            let hasChanges = false;

            // 2. วนลูปดูข้อมูลในเครื่อง (LocalStorage)
            // Snapshot keys first to avoid index shifting issues during iteration
            const localKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('quizState-')) {
                    localKeys.push(key);
                }
            }

            for (const key of localKeys) {
                    try {
                        const localData = JSON.parse(localStorage.getItem(key));
                        const cloudData = cloudMap.get(key);
                        
                        const localTime = localData.lastAttemptTimestamp || 0;
                        const cloudTime = cloudData ? (cloudData.lastAttemptTimestamp || 0) : -1;

                        if (localTime > cloudTime) {
                            // ถ้าข้อมูลในเครื่องใหม่กว่า -> อัปขึ้น Cloud
                            const docRef = doc(historyRef, key);
                            batch.set(docRef, localData);
                            batchCount++;
                            hasChanges = true;
                        } else if (cloudTime > localTime) {
                            // ถ้าข้อมูลบน Cloud ใหม่กว่า -> ดึงลงเครื่อง
                            localStorage.setItem(key, JSON.stringify(cloudData));
                            hasChanges = true;
                        }
                    } catch (e) {
                        console.warn("Error syncing key:", key, e);
                    }
            }

            // 3. เช็คข้อมูลที่มีบน Cloud แต่ไม่มีในเครื่อง (กรณีเครื่องใหม่)
            cloudMap.forEach((data, key) => {
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, JSON.stringify(data));
                    hasChanges = true;
                }
            });

            if (batchCount > 0) {
                await this.retryOperation(() => batch.commit());
                console.log(`Uploaded ${batchCount} quiz history items.`);
            }
            
            if (hasChanges) {
                this.updateLastSyncTime();
            }
        } catch (e) {
            console.error("Error syncing history:", e);
        }
    }

    // --- ส่วนจัดการแบบทดสอบที่สร้างเอง (Custom Quiz Sync) ---

    async saveCustomQuiz(quizData) {
        if (!this.currentUser) return;
        try {
            const docRef = doc(db, "users", this.currentUser.uid, "custom_quizzes", quizData.customId);
            await this.retryOperation(() => setDoc(docRef, quizData));
            this.updateLastSyncTime();
            console.log(`Synced custom quiz ${quizData.customId} to cloud.`);
        } catch (e) {
            console.error("Error saving custom quiz to cloud:", e);
            throw e;
        }
    }

    async deleteCustomQuiz(quizData) {
        if (!this.currentUser || !quizData || !quizData.customId) return;
        try {
            const batch = writeBatch(db);
            const quizDefRef = doc(db, "users", this.currentUser.uid, "custom_quizzes", quizData.customId);
            batch.delete(quizDefRef);

            // Also delete associated progress if it exists
            if (quizData.storageKey) {
                const progressRef = doc(db, "users", this.currentUser.uid, "quiz_history", quizData.storageKey);
                batch.delete(progressRef);
            }
            
            await this.retryOperation(() => batch.commit());
            console.log(`Deleted custom quiz ${quizData.customId} and its history from cloud.`);
        } catch (e) {
            console.error("Error deleting custom quiz from cloud:", e);
            throw e;
        }
    }

    async updateCustomQuiz(customId, dataToUpdate) {
        if (!this.currentUser || !customId) return;
        try {
            const docRef = doc(db, "users", this.currentUser.uid, "custom_quizzes", customId);
            await this.retryOperation(() => updateDoc(docRef, dataToUpdate));
            this.updateLastSyncTime();
        } catch (e) {
            console.error(`Error updating custom quiz ${customId} in cloud:`, e);
            throw e;
        }
    }

    // ฟังก์ชันซิงค์รายการ Custom Quiz (เรียกจาก custom-quiz-handler.js)
    async syncCustomQuizzes(localQuizzes) {
        if (!this.currentUser) return localQuizzes;

        try {
            const customQuizzesRef = collection(db, 'users', this.currentUser.uid, 'custom_quizzes');
            const cloudSnapshot = await this.retryOperation(() => getDocs(customQuizzesRef));
            
            const cloudQuizzesMap = new Map();
            cloudSnapshot.forEach(doc => cloudQuizzesMap.set(doc.id, doc.data()));

            const localQuizzesMap = new Map(localQuizzes.map(q => [q.customId, q]));
            const batch = writeBatch(db);
            let hasCloudUploads = false;

            // 1. Upload Local -> Cloud (ถ้า Cloud ไม่มี)
            for (const localQuiz of localQuizzes) {
                if (!cloudQuizzesMap.has(localQuiz.customId)) {
                    const docRef = doc(customQuizzesRef, localQuiz.customId);
                    batch.set(docRef, localQuiz);
                    hasCloudUploads = true;
                }
            }
            if (hasCloudUploads) await this.retryOperation(() => batch.commit());

            // 2. Merge Cloud -> Local (เอาของ Cloud มาเติมใส่ Local)
            const mergedQuizzes = [...localQuizzes];
            cloudQuizzesMap.forEach((cloudQuiz, customId) => {
                if (!localQuizzesMap.has(customId)) {
                    mergedQuizzes.push(cloudQuiz);
                }
            });

            return mergedQuizzes;
        } catch (e) {
            console.error("Error syncing custom quizzes:", e);
            return localQuizzes; // คืนค่าเดิมถ้ามีปัญหา
        }
    }

    // ฟังก์ชันบันทึกประวัติรายข้อ (เรียกใช้ตอนทำข้อสอบ)
    async saveQuizHistoryItem(key, data) {
        if (!this.currentUser) return;
        try {
            // บันทึกลง Subcollection 'quiz_history' โดยใช้ key เป็น ID เอกสาร
            const docRef = doc(db, "users", this.currentUser.uid, "quiz_history", key);
            await this.retryOperation(() => setDoc(docRef, data, { merge: true }));
            this.updateLastSyncTime();
        } catch (e) {
            console.error("Error saving quiz history item:", e);
        }
    }
}

// Create and export a single, shared instance of the AuthManager.
export const authManager = new AuthManagerInternal();
