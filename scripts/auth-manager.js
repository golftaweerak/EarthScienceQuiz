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
        this.networkStatusHandler = null; // เก็บฟังก์ชัน handler สำหรับ network status
        this.networkCheckInterval = null; // เก็บ interval ID สำหรับเช็ค network UI
        this.onlineStatusTimeout = null; // เก็บ timeout ID สำหรับซ่อน status
        this.isSyncing = false; // NEW: ป้องกันการ Sync ซ้ำซ้อน
        this.saveTimeout = null; // NEW: สำหรับ Debounce การบันทึกข้อมูล
        
        // Promise เพื่อรอให้ตรวจสอบ Auth เสร็จสิ้นครั้งแรก
        this.authReadyPromise = new Promise((resolve) => {
            this.resolveAuthReady = resolve;
        });
        
        this.init();
        this.handlePostLogout();
        this.setupNetworkListeners();
    }

    init() {
        this.unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            const previousUser = this.currentUser; // เก็บสถานะผู้ใช้ก่อนหน้า
            if (user) {
                console.log("User signed in:", user.uid);
                // NEW: Cache basic user info for faster load next time
                this.cacheUser(user);
                
                // NEW: ตรวจสอบว่ามีการสลับบัญชีหรือไม่ (Switching Account)
                // ถ้ามีผู้ใช้ก่อนหน้า และไม่ตรงกับผู้ใช้ใหม่ ให้ล้างข้อมูลในเครื่องทิ้งเพื่อไม่ให้ข้อมูลปนกัน
                if (previousUser && previousUser.uid !== user.uid) {
                    // NEW: Clear pending save timeout to prevent overwriting new user data
                    if (this.saveTimeout) {
                        clearTimeout(this.saveTimeout);
                        this.saveTimeout = null;
                    }

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

                // NEW: Check if auth state changed during delay (Race Condition Fix)
                // FIX: Check if logged out (null) OR switched user
                if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
                     console.warn("Auth state changed during init delay. Aborting sync for", user.uid);
                     return;
                }

                try {
                    await this.syncLocalToCloud(user);
                    await this.syncHistory(user); // ซิงค์ประวัติการทำข้อสอบ
                } catch (e) {
                    console.warn("Data sync failed:", e);
                }
            } else {
                console.log("User signed out");
                // NEW: Clear cache on logout
                this.clearCachedUser();
            }
            
            // FIX: Update state and notify listeners AFTER sync is complete to prevent race conditions
            this.currentUser = user;
            this.isInitialized = true;
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
        this.networkStatusHandler = () => {
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

        window.addEventListener('online', this.networkStatusHandler);
        window.addEventListener('offline', this.networkStatusHandler);
        
        // Check periodically for header element injection
        let attempts = 0;
        this.networkCheckInterval = setInterval(() => {
            const statusEl = document.getElementById('header-network-status');
            if (statusEl) {
                clearInterval(this.networkCheckInterval);
                this.networkCheckInterval = null;
                if (!navigator.onLine) this.networkStatusHandler();
            }
            // Stop checking after 10 seconds (10 attempts) to save resources
            attempts++;
            if (attempts >= 10) {
                clearInterval(this.networkCheckInterval);
                this.networkCheckInterval = null;
            }
        }, 1000);
    }

    // NEW: Cache methods for instant UI loading
    cacheUser(user) {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
        };
        localStorage.setItem('auth_user_cache', JSON.stringify(userData));
    }

    clearCachedUser() {
        localStorage.removeItem('auth_user_cache');
    }

    getCachedUser() {
        const cached = localStorage.getItem('auth_user_cache');
        return cached ? JSON.parse(cached) : null;
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
            // NEW: Clear pending save timeout immediately
            if (this.saveTimeout) {
                clearTimeout(this.saveTimeout);
                this.saveTimeout = null;
            }

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
        const currentUser = this.currentUser; // Capture current user reference
        if (currentUser) {
            // ถ้าล็อกอิน ให้ดึงจาก Firestore
            const targetUid = currentUser.uid;
            const docRef = doc(db, "users", targetUid);
            
            try {
                const docSnap = await this.retryOperation(() => getDoc(docRef));
                
                // NEW: Race Condition Check - Ensure user hasn't changed during await
                if (!this.currentUser || this.currentUser.uid !== targetUid) {
                    console.warn("User context changed during loadUserData. Discarding result.");
                    return null;
                }

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
        // Clone data to prevent race conditions if the original object is mutated 
        // while async operations are pending.
        const dataToSave = JSON.parse(JSON.stringify(data));
        const currentUser = this.currentUser; // Capture current user reference

        // NEW: บันทึก userId ลงในข้อมูลด้วย เพื่อใช้ตรวจสอบความเป็นเจ้าของตอน Sync
        if (currentUser) {
            dataToSave.userId = currentUser.uid;
        }
        // 1. บันทึกลง LocalStorage เสมอ (เพื่อความเร็วและ Offline เบื้องต้น)
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));

        // 2. ถ้าล็อกอิน ให้บันทึกลง Firestore (Debounced)
        if (currentUser) {
            const targetUid = currentUser.uid; // Capture UID for consistency check

            // ยกเลิก timeout เก่าถ้ามีการเรียกซ้ำภายในเวลาที่กำหนด
            if (this.saveTimeout) clearTimeout(this.saveTimeout);

            // ตั้งเวลาใหม่ (Debounce 2 วินาที)
            this.saveTimeout = setTimeout(async () => {
                // NEW: Race Condition Check inside timeout
                if (!this.currentUser || this.currentUser.uid !== targetUid) {
                    console.warn("User changed or logged out during save debounce. Aborting save.");
                    return;
                }

                try {
                    const userRef = doc(db, "users", targetUid);
                    // ใช้ setDoc แบบ merge: true เพื่อไม่ให้ข้อมูลอื่นหาย
                    await this.retryOperation(() => setDoc(userRef, dataToSave, { merge: true }));
                    this.updateLastSyncTime();
                    
                    // อัปเดต Leaderboard (ถ้ามี)
                    if (dataToSave.xp !== undefined) {
                        const leaderboardRef = doc(db, "leaderboard", targetUid);
                        await this.retryOperation(() => setDoc(leaderboardRef, {
                            displayName: this.currentUser.displayName || "Anonymous",
                            photoURL: this.currentUser.photoURL,
                            xp: dataToSave.xp,
                            level: dataToSave.level || 1,
                            astronomyTrackXP: dataToSave.astronomyTrackXP || 0,
                            earthTrackXP: dataToSave.earthTrackXP || 0,
                            astronomyXP: dataToSave.astronomyXP || 0,
                            geologyXP: dataToSave.geologyXP || 0,
                            meteorologyXP: dataToSave.meteorologyXP || 0,
                            selectedTitle: dataToSave.selectedTitle || null,
                            oceanographyXP: dataToSave.oceanographyXP || 0,
                            avatar: dataToSave.avatar || null,
                            lastUpdated: new Date()
                        }, { merge: true }));
                    }
                } catch (e) {
                    console.error("Error saving to cloud (Debounced):", e);
                }
            }, 2000);
        }
    }

    // ฟังก์ชัน Sync ข้อมูลเก่าขึ้น Cloud เมื่อล็อกอินครั้งแรก
    async syncLocalToCloud(user) {
        // FIX: ตรวจสอบว่าเคย Sync แล้วหรือยัง เพื่อป้องกันข้อมูลเบิ้ล (Double Counting)
        // NEW: เพิ่มการเช็ค isSyncing เพื่อป้องกัน Race Condition
        if (localStorage.getItem('last_cloud_sync') || this.isSyncing) {
            return;
        }

        this.isSyncing = true;
        const localDataString = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (!localDataString) {
            this.isSyncing = false;
            return; // ไม่มีข้อมูลเก่า ไม่ต้องทำอะไร
        }

        const localData = JSON.parse(localDataString);
        const userRef = doc(db, "users", user.uid);
        
        try {
            const docSnap = await this.retryOperation(() => getDoc(userRef));

            // NEW: Check if auth state changed during await (Race Condition Fix)
            if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
                console.warn("Auth state changed during syncLocalToCloud. Aborting.");
                return;
            }

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
                showToast('ซิงค์ข้อมูลสำเร็จ', 'ข้อมูลเก่าของคุณถูกบันทึกขึ้นระบบแล้ว', '☁️');
            } else {
                // กรณี: มีข้อมูลบน Cloud อยู่แล้ว
                console.log("Found cloud data, merging with local...");
                let cloudData = docSnap.data();
                
                // NEW: ตรวจสอบความปลอดภัยก่อนรวมคะแนน (Prevent Inflation)
                const isOwnedByCurrentUser = localData.userId === user.uid;
                const isGuestData = localData.displayName === 'ผู้เรียน (Guest)';
                
                // ถ้าข้อมูลในเครื่องเป็นของผู้ใช้นี้อยู่แล้ว (มี userId ตรงกัน) ไม่ต้องทำอะไร (ถือว่า Cloud เป็น Master หรือเท่ากัน)
                if (isOwnedByCurrentUser) {
                    console.log("Local data belongs to current user. Skipping merge to prevent duplication.");
                    // อัปเดต LocalStorage ให้ตรงกับ Cloud เพื่อความชัวร์
                    if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
                        console.warn("Auth state changed during syncLocalToCloud merge. Aborting local save.");
                        return;
                    }
                    localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
                    this.isSyncing = false;
                    return;
                }

                // จะรวมคะแนนก็ต่อเมื่อมั่นใจว่าเป็น Guest Data จริงๆ หรือข้อมูลมีความคืบหน้า
                if ((localData.xp > 0 || localData.quizzesCompleted > 0)) {
                    console.log("Merging guest data into cloud account...");
                    
                    // ถ้าไม่ใช่ Guest (มีชื่ออื่น) แต่ไม่มี userId (ข้อมูลเก่า) ให้ใช้ค่า MAX แทนการบวก เพื่อป้องกันคะแนนเฟ้อ
                    const mergeStrategy = isGuestData ? 'sum' : 'max';
                    
                    cloudData = {
                        ...cloudData,
                        xp: mergeStrategy === 'sum' 
                            ? (cloudData.xp || 0) + (localData.xp || 0) 
                            : Math.max(cloudData.xp || 0, localData.xp || 0),
                        
                        astronomyTrackXP: mergeStrategy === 'sum'
                            ? (cloudData.astronomyTrackXP || 0) + (localData.astronomyTrackXP || 0)
                            : Math.max(cloudData.astronomyTrackXP || 0, localData.astronomyTrackXP || 0),
                            
                        earthTrackXP: mergeStrategy === 'sum'
                            ? (cloudData.earthTrackXP || 0) + (localData.earthTrackXP || 0)
                            : Math.max(cloudData.earthTrackXP || 0, localData.earthTrackXP || 0),
                            
                        generalXP: mergeStrategy === 'sum'
                            ? (cloudData.generalXP || 0) + (localData.generalXP || 0)
                            : Math.max(cloudData.generalXP || 0, localData.generalXP || 0),
                            
                        quizzesCompleted: mergeStrategy === 'sum'
                            ? (cloudData.quizzesCompleted || 0) + (localData.quizzesCompleted || 0)
                            : Math.max(cloudData.quizzesCompleted || 0, localData.quizzesCompleted || 0),
                            
                        totalCorrectAnswers: mergeStrategy === 'sum'
                            ? (cloudData.totalCorrectAnswers || 0) + (localData.totalCorrectAnswers || 0)
                            : Math.max(cloudData.totalCorrectAnswers || 0, localData.totalCorrectAnswers || 0),
                        
                        // NEW: Merge totalSpentXP to keep track of spending across devices
                        totalSpentXP: mergeStrategy === 'sum'
                            ? (cloudData.totalSpentXP || 0) + (localData.totalSpentXP || 0)
                            : Math.max(cloudData.totalSpentXP || 0, localData.totalSpentXP || 0),
                            
                        // Merge Arrays (Set to unique)
                        badges: [...new Set([...(cloudData.badges || []), ...(localData.badges || [])])],
                        inventory: [...new Set([...(cloudData.inventory || []), ...(localData.inventory || [])])],
                        unlockedAchievements: [...new Set([...(cloudData.unlockedAchievements || []), ...(localData.unlockedAchievements || [])])],
                    };
                    // บันทึกข้อมูลที่รวมแล้วกลับขึ้น Cloud
                    await this.retryOperation(() => setDoc(userRef, cloudData, { merge: true }));
                }

                if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
                    console.warn("Auth state changed during syncLocalToCloud save. Aborting local save.");
                    return;
                }
                localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(cloudData));
            }
        } finally {
            this.isSyncing = false;
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
        // FIX: Validate key to prevent path traversal
        if (!key || typeof key !== 'string' || key.includes('/')) {
            console.warn("Invalid history key:", key);
            return;
        }
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
            
            // NEW: Check if auth state changed during await
            if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
                return;
            }

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
                if (!auth.currentUser || auth.currentUser.uid !== user.uid) return;
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
        // FIX: Validate customId
        if (!quizData.customId || quizData.customId.includes('/')) {
             console.warn("Invalid customId:", quizData.customId);
             return;
        }
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
        // FIX: Validate customId
        if (quizData.customId.includes('/')) {
             console.warn("Invalid customId:", quizData.customId);
             return;
        }
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
        // FIX: Validate customId
        if (customId.includes('/')) {
             console.warn("Invalid customId:", customId);
             return;
        }
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
        const user = this.currentUser;
        if (!user) return localQuizzes;

        try {
            const customQuizzesRef = collection(db, 'users', user.uid, 'custom_quizzes');
            const cloudSnapshot = await this.retryOperation(() => getDocs(customQuizzesRef));
            
            // NEW: Check consistency
            if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
                 throw new Error("Auth state changed during syncCustomQuizzes");
            }
            
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

            // 2. Merge Cloud -> Local
            // Strategy: Cloud wins for conflicts (to enable cross-device updates), 
            // Local wins for new items (not in cloud yet).
            
            const mergedQuizzes = [];
            const processedIds = new Set();

            // 1. Add all Cloud quizzes (Source of Truth)
            cloudQuizzesMap.forEach((cloudQuiz, customId) => {
                mergedQuizzes.push(cloudQuiz);
                processedIds.add(customId);
            });

            // 2. Add Local quizzes that are NOT in Cloud
            for (const localQuiz of localQuizzes) {
                if (!processedIds.has(localQuiz.customId)) {
                    mergedQuizzes.push(localQuiz);
                }
            }

            return mergedQuizzes;
        } catch (e) {
            console.error("Error syncing custom quizzes:", e);
            return localQuizzes; // คืนค่าเดิมถ้ามีปัญหา
        }
    }

    // ฟังก์ชันบันทึกประวัติรายข้อ (เรียกใช้ตอนทำข้อสอบ)
    async saveQuizHistoryItem(key, data) {
        if (!this.currentUser) return;
        // FIX: Validate key
        if (!key || typeof key !== 'string' || key.includes('/')) {
             console.warn("Invalid history key for saving:", key);
             return;
        }
        try {
            // บันทึกลง Subcollection 'quiz_history' โดยใช้ key เป็น ID เอกสาร
            const docRef = doc(db, "users", this.currentUser.uid, "quiz_history", key);
            await this.retryOperation(() => setDoc(docRef, data, { merge: true }));
            this.updateLastSyncTime();
        } catch (e) {
            console.error("Error saving quiz history item:", e);
        }
    }

    // ฟังก์ชันทำลาย instance และเคลียร์ listener ทั้งหมด
    destroy() {
        // 1. Unsubscribe Firebase Auth
        if (this.unsubscribeAuth) {
            this.unsubscribeAuth();
            this.unsubscribeAuth = null;
        }

        // 2. Remove Window Listeners
        if (this.networkStatusHandler) {
            window.removeEventListener('online', this.networkStatusHandler);
            window.removeEventListener('offline', this.networkStatusHandler);
            this.networkStatusHandler = null;
        }

        // 3. Clear Intervals & Timeouts
        if (this.networkCheckInterval) clearInterval(this.networkCheckInterval);
        if (this.onlineStatusTimeout) clearTimeout(this.onlineStatusTimeout);

        this.networkCheckInterval = null;
        this.onlineStatusTimeout = null;

        // 4. Clear Callbacks
        this.onUserChangeCallbacks = [];
        this.isInitialized = false;
        console.log("AuthManager destroyed and listeners cleared.");
    }
}

// Create and export a single, shared instance of the AuthManager.
export const authManager = new AuthManagerInternal();
