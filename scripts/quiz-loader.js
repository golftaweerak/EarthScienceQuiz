
import { init as initQuizApp } from './quiz-logic.js';

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

export async function initializeQuiz() {
    const { quizList } = await import(`../data/quizzes-list.js?v=${Date.now()}`);

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    // --- NEW: Handle Custom Quiz ---
    if (quizId && quizId.startsWith('custom_')) {
        const allCustomQuizzesJSON = localStorage.getItem('customQuizzesList');
        if (allCustomQuizzesJSON) {
            try {
                const allCustomQuizzes = JSON.parse(allCustomQuizzesJSON);
                const customQuizData = allCustomQuizzes.find(q => q.customId === quizId);

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

                initQuizApp(customQuizData.questions, customQuizData.storageKey, customQuizData.title);
                return; // Stop further execution
            } catch (error) {
                handleQuizError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลแบบทดสอบที่สร้างเองได้");
                return;
            }
        }
        handleQuizError("ไม่พบข้อมูลแบบทดสอบ", "ไม่พบข้อมูลแบบทดสอบที่สร้างเอง กรุณากลับไปหน้าหลักแล้วลองใหม่อีกครั้ง");
        return;
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
        const response = await fetch(scriptPath);
        if (!response.ok) {
            handleQuizError("ไม่พบไฟล์ข้อมูลแบบทดสอบ", `ไม่สามารถโหลดไฟล์ที่ต้องการได้: ${scriptPath}`);
            return;
        }
        const scriptText = await response.text();

        // Execute the script text in a sandboxed function to get the data it defines,
        // supporting 'quizItems', 'quizScenarios', or 'quizData' variables.
        const data = new Function(`${scriptText}; if (typeof quizItems !== 'undefined') return quizItems; if (typeof quizScenarios !== 'undefined') return quizScenarios; if (typeof quizData !== 'undefined') return quizData; return undefined;`)();

        if (!data || !Array.isArray(data)) {
            handleQuizError("เกิดข้อผิดพลาดในการโหลดข้อมูลคำถาม", `ไม่สามารถโหลดข้อมูลจาก ${scriptPath} ได้อย่างถูกต้อง`);
            return;
        }

        // Process the loaded data. This unified logic handles all supported formats:
        // - A flat array of questions.
        // - An array of scenario objects.
        // - A mixed array of questions and scenarios.
        let processedQuizData;
        processedQuizData = data.flatMap(item => {            
            if (!item) return []; // Gracefully handle null/undefined entries in the data array (e.g. from trailing commas)

            if (item.type === 'scenario' && Array.isArray(item.questions)) {
                // It's a scenario, prepend its title and description to each of its questions.
                const title = item.title || '';
                const description = (item.description || '').replace(/\n/g, '<br>');
                // Filter out any potential null/undefined questions within the scenario's questions array
                return item.questions.filter(q => q).map(question => ({
                    ...question, // This is safe now because we filtered out falsy values
                    question: `<div class="p-4 mb-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg"><p class="font-bold text-lg">${title}</p><div class="mt-2 text-gray-700 dark:text-gray-300">${description}</div></div>${question.question}`,
                    sourceQuizTitle: quizInfo.title // Add source quiz title to each question
                }));
            }
            // It's a standalone question or a malformed item, return it as is.
            return { ...item, sourceQuizTitle: quizInfo.title };
        });

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
        initQuizApp(processedQuizData, quizInfo.storageKey, quizInfo.title);

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