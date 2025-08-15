document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the quiz ID from the URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (!quizId) {
        handleQuizError("ไม่พบ ID ของแบบทดสอบ", "กรุณาตรวจสอบ URL หรือกลับไปที่หน้าหลักเพื่อเลือกแบบทดสอบ");
        return;
    }

    // 2. Find the corresponding quiz info from the global quizList
    // Ensure quizList is loaded before this script runs
    if (typeof quizList === 'undefined') {
        handleQuizError("เกิดข้อผิดพลาดในการโหลดรายการแบบทดสอบ", "ไม่สามารถโหลด quizList ได้");
        return;
    }

    const quizInfo = quizList.find(q => q.storageKey.endsWith(quizId));

    if (!quizInfo) {
        handleQuizError("ไม่พบข้อมูลแบบทดสอบ", `ไม่พบแบบทดสอบสำหรับ ID: ${quizId}`);
        return;
    }

    // 3. Dynamically load the specific quiz data script
    const dataScript = document.createElement('script');
    // Example: ../data/junior1-data.js
    dataScript.src = `../data/${quizId}-data.js`;

    dataScript.onload = () => {
        // 4. Once the data script is loaded, process the data.
        // The loader now supports three formats for backward compatibility and flexibility:
        // - `quizItems`: A mixed array of standalone questions and scenario objects. (New recommended format)
        // - `quizScenarios`: An array of only scenario objects.
        // - `quizData`: A flat array of only standalone questions. (Old format)
        let processedQuizData;

        if (typeof quizItems !== 'undefined') {
            // New unified format: process a mix of questions and scenarios
            processedQuizData = quizItems.flatMap(item => {
                if (item.type === 'scenario') {
                    // It's a scenario, prepend description to its questions
                    return item.questions.map(question => ({
                        ...question,
                        question: `<div class="p-4 mb-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg"><p class="font-bold text-lg">${item.title}</p><p class="mt-2 text-gray-700 dark:text-gray-300">${item.description.replace(/\n/g, '<br>')}</p></div>${question.question}`
                    }));
                }
                // It's a standalone question, return it as is
                return item; 
            });
        } else if (typeof quizScenarios !== 'undefined') {
            // Scenario-only format (like the refactored ES3)
            processedQuizData = quizScenarios.flatMap(scenario => 
                scenario.questions.map(question => ({
                    ...question,
                    question: `<div class="p-4 mb-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg"><p class="font-bold text-lg">${scenario.title}</p><p class="mt-2 text-gray-700 dark:text-gray-300">${scenario.description.replace(/\n/g, '<br>')}</p></div>${question.question}`
                }))
            );
        } else if (typeof quizData !== 'undefined') {
            // Old flat format, use it directly
            processedQuizData = quizData;
        } else {
            // Neither format was found
            handleQuizError("เกิดข้อผิดพลาดในการโหลดข้อมูลคำถาม", `ไม่สามารถโหลดข้อมูลจาก ${dataScript.src} ได้`);
            return;
        }

        // 5. Populate the page with quiz-specific info
        document.title = quizInfo.title;
        document.getElementById('start-screen-title').textContent = quizInfo.title;
        document.getElementById('start-screen-description').textContent = `${quizInfo.description} (${quizInfo.amount})`;
        document.getElementById('quiz-title-header').textContent = quizInfo.title;

        // 6. Initialize the quiz logic with the loaded data
        QuizApp.init(processedQuizData, quizInfo.storageKey);

        // 7. Highlight the active quiz in the dropdown menu
        highlightActiveQuiz(quizInfo.storageKey);
    };

    dataScript.onerror = () => {
        handleQuizError("ไม่พบไฟล์ข้อมูลแบบทดสอบ", `ไม่สามารถโหลดไฟล์ที่ต้องการได้: ${dataScript.src}`);
    };

    document.body.appendChild(dataScript);
});

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

function highlightActiveQuiz(storageKey) {
    const links = document.querySelectorAll('#quiz-menu-dropdown a');
    links.forEach(link => {
        const quizFromLink = quizList.find(q => link.href.includes(q.url.substring(1)));
        if (quizFromLink && quizFromLink.storageKey === storageKey) {
            link.classList.add('font-bold', 'bg-blue-50', 'dark:bg-gray-700/50');
        }
    });
}