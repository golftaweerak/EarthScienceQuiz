// scripts/firebase-config.js
// ใช้ CDN URL เพื่อให้ทำงานได้บน Browser โดยไม่ต้องตั้งค่า Bundler เพิ่มเติม
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDHgJe4fo441DdLMVPw3uzkJ20T-xl8kXQ",
  authDomain: "pre-posn-es.firebaseapp.com",
  projectId: "pre-posn-es",
  storageBucket: "pre-posn-es.firebasestorage.app",
  messagingSenderId: "783098892022",
  appId: "1:783098892022:web:cf40d392fc2c8eeaffa6d7",
  measurementId: "G-JLGX26PB24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

let db;
try {
  // ใช้ API ใหม่ในการเปิดใช้งาน Offline Persistence
  db = initializeFirestore(app, {
    localCache: persistentLocalCache()
  });
} catch (err) {
  console.warn(`Could not enable Firestore persistence: ${err.message}. Falling back to in-memory persistence.`);
  // หากเปิดใช้งานไม่ได้ (เช่น เปิดหลายแท็บ) ให้ใช้ in-memory persistence แทน
  db = initializeFirestore(app, {});
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

export { app, analytics, auth, db, googleProvider };
