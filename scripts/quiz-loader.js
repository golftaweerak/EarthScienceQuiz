
import { init as initQuizApp } from './quiz-logic.js';
import { getSavedCustomQuizzes } from './custom-quiz-handler.js';
import { db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/**
 * Populates the common elements of the quiz page (titles, descriptions).
 * @param {string} title The main title for the quiz.
 * @param {string} description The description for the quiz.
 */
function populatePage(title, description) {
    document.title = title;
    const startScreenTitle = document.getElementById('start-screen-title');
    const startScreenDesc = document.getElementById('start-screen-description');
    if (startScreenTitle) startScreenTitle.textContent = title;
    if (startScreenDesc) startScreenDesc.textContent = description;
}

/**
 * Helper function to process raw quiz data (handling scenarios, etc.)
 * @param {Array} data Raw data from the module
 * @param {object} quizInfo Info about the source quiz (title, category)
 * @returns {Array} Processed questions array
 */
function processQuizData(data, quizInfo) {
    const processed = [];
    for (const item of data) {
        if (!item) continue;
    
        if (item.type === 'scenario' && Array.isArray(item.questions)) {
            // It's a scenario, prepend its title and description to each of its questions.
            const title = item.title || '';
            const rawDescription = item.description || '';
            const description = rawDescription.replace(/(src\s*=\s*["'])\/?assets\//g, '$1../assets/').replace(/\n/g, '<br>');
    
            for (const question of item.questions) {
                if (question) { // Ensure question is not null/undefined
                    processed.push({
                        ...question,
                        type: question.type || 'question',
                        question: `<div class="p-4 mb-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg"><p class="font-bold text-lg">${title}</p><div class="mt-2 text-gray-700 dark:text-gray-300">${description}</div></div>${question.question}`,
                        sourceQuizTitle: quizInfo.title,
                        sourceQuizCategory: quizInfo.category
                    });
                }
            }
        } else {
            // Standalone question
            processed.push({
                ...item,
                type: item.type || 'question',
                sourceQuizTitle: quizInfo.title,
                sourceQuizCategory: quizInfo.category
            });
        }
    }
    return processed;
}

// Simple seeded random number generator
function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

export async function initializeQuiz() {
    const { quizList } = await import(`../data/quizzes-list.js?v=${Date.now()}`);

    const urlParams = new URLSearchParams(window.location.search);
    const seedParam = urlParams.get('seed');
    const quizId = urlParams.get('id');
    const lobbyId = urlParams.get('lobbyId');
    const action = urlParams.get('action'); // Get the action from URL, e.g., 'view_results'

    // If the action is to view results, immediately hide the start screen
    // to prevent the "Start Quiz" button from flashing or appearing incorrectly.
    if (action === 'view_results') {
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.classList.add('hidden');
        }
    }

    // --- NEW: Fetch Lobby Config if available ---
    let lobbyConfig = null;
    if (lobbyId) {
        try {
            const lobbyRef = doc(db, 'lobbies', lobbyId);
            const lobbySnap = await getDoc(lobbyRef);
            if (lobbySnap.exists()) {
                lobbyConfig = lobbySnap.data().quizConfig;
            }
        } catch (e) {
            console.error("Error fetching lobby config:", e);
        }
    }

    // --- NEW: Handle Custom Quiz ---
    if (quizId && quizId.startsWith('custom_')) {
        let customQuizData = null;

        // 1. Try Local Storage first (Host or local play)
        const allCustomQuizzes = getSavedCustomQuizzes();
        customQuizData = allCustomQuizzes.find(q => q.customId === quizId);

        // 2. If not found locally and we are in a lobby, try fetching from Firestore
        if (!customQuizData && lobbyConfig) {
            if (lobbyConfig.customQuestions) {
                customQuizData = {
                    customId: quizId,
                    title: lobbyConfig.title,
                    description: lobbyConfig.description,
                    questions: lobbyConfig.customQuestions,
                    timerMode: lobbyConfig.timerMode || 'none',
                    customTime: lobbyConfig.customTime || null,
                    storageKey: `quizState-${quizId}`
                };
            }
        }

        if (!customQuizData) {
            handleQuizError("ไม่พบข้อมูลแบบทดสอบ", `ไม่พบข้อมูลแบบทดสอบที่สร้างเองสำหรับ ID: ${quizId}`);
            return;
        }

        populatePage(customQuizData.title, customQuizData.description);

        // Hide the timer options and pre-select the chosen mode for the custom quiz
        const timerOptions = document.getElementById('timer-options');
        if (timerOptions) {
            timerOptions.classList.add('hidden');
            const selectedTimerInput = document.querySelector(`input[name="timer-mode"][value="${customQuizData.timerMode}"]`);
            if (selectedTimerInput) selectedTimerInput.checked = true;
        }

        // Override with lobby settings if present (for host updates)
        let finalTimerMode = customQuizData.timerMode;
        let finalCustomTime = customQuizData.customTime;
        let lives = 1;
        if (lobbyConfig) {
            finalTimerMode = lobbyConfig.timerMode || 'none';
            finalCustomTime = lobbyConfig.customTime;
            lives = lobbyConfig.lives || 1;
        }

        // Apply lobby timer settings to UI if different
        if (lobbyConfig) {
             const timerOptions = document.getElementById('timer-options');
             if (timerOptions) {
                 timerOptions.classList.add('hidden');
                 const selectedTimerInput = document.querySelector(`input[name="timer-mode"][value="${finalTimerMode}"]`);
                 if (selectedTimerInput) selectedTimerInput.checked = true;
             }
        }

        initQuizApp(customQuizData.questions, customQuizData.storageKey, customQuizData.title, finalCustomTime, action, false, lives);
        return; // Stop further execution
    }

    // --- NEW: Handle Random Quiz (for Challenge Mode) ---
    if (quizId === 'random') {
        try {
            const amount = parseInt(urlParams.get('amount')) || 20;
            const seed = parseInt(urlParams.get('seed')) || Date.now();
            
            populatePage("แบบทดสอบสุ่ม (Challenge)", "แบบทดสอบที่สุ่มจากคลังข้อสอบทั้งหมด");

            // Load all quizzes concurrently
            const promises = quizList.map(q => import(`../data/${q.id}-data.js?v=${Date.now()}`).then(m => ({ module: m, info: q })).catch(e => null));
            const results = await Promise.all(promises);
            
            let allQuestions = [];
            results.forEach(res => {
                if (res && res.module) {
                    const data = res.module.quizItems || res.module.quizData || [];
                    allQuestions = allQuestions.concat(processQuizData(data, res.info));
                }
            });

            // Shuffle using seed
            const rng = mulberry32(seed);
            for (let i = allQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
            }

            // Slice to amount
            const selectedQuestions = allQuestions.slice(0, amount);

            // Init Quiz
            let customTime = null;
            let lives = 1;
            if (lobbyConfig) {
                const timerOptions = document.getElementById('timer-options');
                if (timerOptions) {
                    timerOptions.classList.add('hidden');
                    const selectedTimerInput = document.querySelector(`input[name="timer-mode"][value="${lobbyConfig.timerMode}"]`);
                    if (selectedTimerInput) selectedTimerInput.checked = true;
                }
                customTime = lobbyConfig.customTime;
                lives = lobbyConfig.lives || 1;
            }

            initQuizApp(selectedQuestions, `quizState-challenge-${seed}`, "Challenge Mode", customTime, action, true, lives);
            return;

        } catch (error) {
            console.error("Error generating random quiz:", error);
            handleQuizError("เกิดข้อผิดพลาด", "ไม่สามารถสร้างแบบทดสอบสุ่มได้");
            return;
        }
    }

    if (!quizId) {
        handleQuizError("ไม่พบ ID ของแบบทดสอบ", "กรุณาตรวจสอบ URL หรือกลับไปที่หน้าหลักเพื่อเลือกแบบทดสอบ");
        return;
    }

    // Filter out any potential null/undefined entries before finding the quiz
    const quizInfo = quizList.filter(q => q).find(q => q.id === quizId);

    if (!quizInfo) {
        handleQuizError("ไม่พบข้อมูลแบบทดสอบ", `ไม่พบแบบทดสอบสำหรับ ID: ${quizId}`);
        return;
    }

    // --- NEW: Robust data loading using fetch to avoid global scope issues ---
    try {
        const scriptPath = `../data/${quizId}-data.js?v=${Date.now()}`;
        // Use modern dynamic import for robustness and better error handling
        const module = await import(scriptPath);
        // Handle both `quizItems` and `quizData` for compatibility with older files.
        const data = module.quizItems || module.quizData || [];

        if (!data || !Array.isArray(data)) {
            handleQuizError("เกิดข้อผิดพลาดในการโหลดข้อมูลคำถาม", `ไม่พบข้อมูลคำถามในไฟล์ ${scriptPath} หรือข้อมูลมีรูปแบบไม่ถูกต้อง`);
            return;
        }

        let processedQuizData = processQuizData(data, quizInfo);

        // --- NEW: Shuffle specific quiz if seed exists (for Challenge/Coop fairness) ---
        if (seedParam) {
            const seed = parseInt(seedParam);
            const rng = mulberry32(seed);
            for (let i = processedQuizData.length - 1; i > 0; i--) {
                const j = Math.floor(rng() * (i + 1));
                [processedQuizData[i], processedQuizData[j]] = [processedQuizData[j], processedQuizData[i]];
            }
        }

        // 5. Populate the page with quiz-specific info
        populatePage(quizInfo.title, quizInfo.description);

        // Create a more detailed summary on the start screen using the actual question count
        const startScreenDesc = document.getElementById('start-screen-description');
        if (processedQuizData.length > 0 && startScreenDesc) {
            const secondsPerQuestion = 75; // Based on overallMultiplier in quiz-logic.js
            const totalMinutes = Math.ceil((processedQuizData.length * secondsPerQuestion) / 60);

            const summaryContainer = document.createElement('div');
            summaryContainer.className = 'flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-3 text-center my-6 text-gray-600 dark:text-gray-400';
            summaryContainer.innerHTML = `
                <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    <span>จำนวน <strong>${processedQuizData.length}</strong> ข้อ</span>
                </div>
                <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>เวลาที่คาดว่าจะใช้: <strong>~${totalMinutes} นาที</strong></span>
                </div>
            `;
            startScreenDesc.after(summaryContainer);
        }

        // 6. Initialize the quiz logic with the processed data
        let customTime = null;
        let lives = 1;
        if (lobbyConfig) {
            const timerOptions = document.getElementById('timer-options');
            if (timerOptions) {
                timerOptions.classList.add('hidden');
                const selectedTimerInput = document.querySelector(`input[name="timer-mode"][value="${lobbyConfig.timerMode}"]`);
                if (selectedTimerInput) selectedTimerInput.checked = true;
            }
            customTime = lobbyConfig.customTime;
            lives = lobbyConfig.lives || 1;
        }
        initQuizApp(processedQuizData, quizInfo.storageKey, quizInfo.title, customTime, action, !!seedParam, lives);

    } catch (error) {
        console.error(`Error loading quiz data for ID ${quizId}:`, error);
        handleQuizError("เกิดข้อผิดพลาดในการโหลดข้อมูล", `เกิดข้อผิดพลาดที่ไม่คาดคิดขณะพยายามโหลดแบบทดสอบ`);
    }
}

function handleQuizError(title, message) {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.innerHTML = `
            <h1 class="text-2xl sm:text-3xl font-bold text-center text-red-500 dark:text-red-400 mb-4">${title}</h1>
            <p class="text-center text-gray-600 dark:text-gray-400 mb-8">${message}</p>
            <a href="../index.html" class="w-full max-w-xs mx-auto block bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300 text-center">
                กลับไปหน้าหลัก
            </a>
        `;
    }
    document.title = "เกิดข้อผิดพลาด";
}