function initializeQuiz(quizData, storageKey) {
    // --- DOM Elements ---
    const startScreen = document.getElementById("start-screen");
    const quizScreen = document.getElementById("quiz-screen");
    const resultScreen = document.getElementById("result-screen");

    const startBtn = document.getElementById("start-btn");
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn"); // New
    const restartBtn = document.getElementById("restart-btn");
    const reviewBtn = document.getElementById("review-btn"); // New
    const backToResultBtn = document.getElementById("back-to-result-btn"); // New

    const questionCounterEl = document.getElementById("question-counter");
    const scoreCounterEl = document.getElementById("score-counter");
    const questionEl = document.getElementById("question");
    const optionsEl = document.getElementById("options");
    const feedbackEl = document.getElementById("feedback");
    const feedbackContentEl = feedbackEl.querySelector(".feedback-content");

    const finalScoreEl = document.getElementById("final-score");
    const finalMessageEl = document.getElementById("final-message");
    
    const reviewScreen = document.getElementById("review-screen"); // New
    const reviewContainer = document.getElementById("review-container"); // New

    const STORAGE_KEY = storageKey;

    // --- Quiz State ---
    let currentQuestionIndex = 0;
    let score = 0;
    let shuffledQuestions = [];
    let userAnswers = []; // New: To store user's answers

    // --- Functions ---
    function startQuiz() {
        localStorage.removeItem(STORAGE_KEY);
        startScreen.classList.add("hidden");
        quizScreen.classList.remove("hidden");
        resultScreen.classList.add("hidden");
        reviewScreen.classList.add("hidden"); // New

        score = 0;
        currentQuestionIndex = 0;
        shuffledQuestions = quizData.sort(() => Math.random() - 0.5);
        scoreCounterEl.textContent = `คะแนน: ${score}`;

        showQuestion();
        saveQuizState();
        userAnswers = []; // New: Reset answers on new quiz
    }

    function renderAllMath() {
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(document.body, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true }
                ]
            });
        }
    }

    function showQuestion() {
        resetState();
        const currentQuestion = shuffledQuestions[currentQuestionIndex];
        questionCounterEl.textContent = `ข้อที่ ${currentQuestionIndex + 1} / ${shuffledQuestions.length}`;
        questionEl.innerHTML = currentQuestion.question;

        const previousAnswer = userAnswers[currentQuestionIndex];

        currentQuestion.options.forEach((option) => {
            const button = document.createElement("button");
            button.innerHTML = option;
            button.classList.add(
                "option-btn", "w-full", "p-4", "border-2", "border-gray-300",
                "dark:border-gray-600", "rounded-lg", "text-left", "hover:bg-gray-100",
                "dark:hover:bg-gray-700", "hover:border-blue-500", "dark:hover:border-blue-500"
            );

            if (previousAnswer) {
                // This is a revisited question, disable buttons and show state
                button.disabled = true;
                if (option.trim() === previousAnswer.correctAnswer) {
                    button.classList.add("correct");
                }
                if (option.trim() === previousAnswer.selectedAnswer && !previousAnswer.isCorrect) {
                    button.classList.add("incorrect");
                }
            } else {
                // This is a new question
                button.addEventListener("click", selectAnswer);
            }
            optionsEl.appendChild(button);
        });

        if (previousAnswer) {
            // If we are revisiting a question, show the feedback panel without altering the score.
            showFeedback(previousAnswer.isCorrect, previousAnswer.explanation, previousAnswer.correctAnswer);
            nextBtn.classList.remove("hidden");
        }

        if (currentQuestionIndex > 0) {
            prevBtn.classList.remove("hidden");
        }

        renderAllMath();
    }

    function resetState() {
        nextBtn.classList.add("hidden");
        feedbackEl.classList.add("hidden");
        feedbackContentEl.innerHTML = "";
        feedbackEl.className = "hidden mt-6 p-4 rounded-lg";
        prevBtn.classList.add("hidden");
        while (optionsEl.firstChild) {
            optionsEl.removeChild(optionsEl.firstChild);
        }
    }

    function selectAnswer(e) {
        const selectedBtn = e.currentTarget;
        const correct = selectedBtn.textContent.trim() === shuffledQuestions[currentQuestionIndex].answer.trim();

        // Store the user's answer. This is the only time an answer is recorded for a question.
        userAnswers[currentQuestionIndex] = {
            question: shuffledQuestions[currentQuestionIndex].question,
            selectedAnswer: selectedBtn.textContent.trim(),
            correctAnswer: shuffledQuestions[currentQuestionIndex].answer.trim(),
            isCorrect: correct,
            explanation: shuffledQuestions[currentQuestionIndex].explanation
        };

        if (correct) {
            score++;
            scoreCounterEl.textContent = `คะแนน: ${score}`;
            selectedBtn.classList.add("correct");
        } else {
            selectedBtn.classList.add("incorrect");
        }

        // Show feedback and disable all options
        showFeedback(correct, shuffledQuestions[currentQuestionIndex].explanation, shuffledQuestions[currentQuestionIndex].answer.trim());

        Array.from(optionsEl.children).forEach((button) => {
            if (button.textContent.trim() === shuffledQuestions[currentQuestionIndex].answer.trim()) {
                button.classList.add("correct");
            }
            button.disabled = true;
        });

        nextBtn.classList.remove("hidden");
    }

    function showFeedback(isCorrect, explanation, correctAnswer) {
        if (isCorrect) {
            feedbackContentEl.innerHTML = `<h3 class="font-bold text-lg text-green-800 dark:text-green-300">ถูกต้อง!</h3><p class="text-green-700 dark:text-green-400 mt-2">${explanation}</p>`;
            feedbackEl.classList.add("bg-green-100", "dark:bg-green-900/50", "border", "border-green-300", "dark:border-green-700");
        } else {
            feedbackContentEl.innerHTML = `<h3 class="font-bold text-lg text-red-800 dark:text-red-300">ผิดครับ!</h3><p class="text-red-700 dark:text-red-400 mt-1">คำตอบที่ถูกต้องคือ: <strong>${correctAnswer}</strong></p><p class="text-red-700 dark:text-red-400 mt-2">${explanation}</p>`;
            feedbackEl.classList.add("bg-red-100", "dark:bg-red-900/50", "border", "border-red-300", "dark:border-red-700");
        }
        feedbackEl.classList.remove("hidden");
    }

    function showNextQuestion() {
        currentQuestionIndex++;
        if (currentQuestionIndex < shuffledQuestions.length) {
            showQuestion();
            saveQuizState();
        } else {
            showResults();
        }
    }

    // --- New Previous Question Function ---
    function showPreviousQuestion() {
        if (currentQuestionIndex > 0) {
            // We don't change the score here. The score is final once answered.
            currentQuestionIndex--;
            showQuestion();
            saveQuizState();
        }
    }

    function showResults() {
        localStorage.removeItem(STORAGE_KEY);
        quizScreen.classList.add("hidden");
        resultScreen.classList.remove("hidden");

        const percentage = Math.round((score / shuffledQuestions.length) * 100);
        finalScoreEl.textContent = `${score} / ${shuffledQuestions.length} (${percentage}%)`;

        let message = "";
        if (percentage >= 90) {
            message = "ยอดเยี่ยมมาก! คุณคืออนาคตนักดาราศาสตร์โอลิมปิก!";
        } else if (percentage >= 75) {
            message = "เก่งมาก! ความรู้แน่นจริงๆ";
        } else if (percentage >= 50) {
            message = "ทำได้ดี! ทบทวนอีกนิดหน่อยจะสมบูรณ์แบบเลย";
        } else {
            message = "ไม่เป็นไรนะ สู้ๆ แล้วลองพยายามอีกครั้ง!";
        }
        finalMessageEl.textContent = message;

        // New: Show or hide the review button
        const incorrectAnswers = userAnswers.filter(answer => !answer.isCorrect);
        if (incorrectAnswers.length > 0) {
            reviewBtn.classList.remove('hidden');
        } else {
            reviewBtn.classList.add('hidden');
        }
    }

    // --- New Review Functions ---
    function showReview() {
        resultScreen.classList.add('hidden');
        reviewScreen.classList.remove('hidden');
        reviewContainer.innerHTML = ''; // Clear previous review

        const incorrectAnswers = userAnswers.filter(answer => !answer.isCorrect);

        incorrectAnswers.forEach((answer, index) => {
            const reviewItem = document.createElement('div');
            reviewItem.classList.add('p-4', 'border', 'border-gray-300', 'dark:border-gray-600', 'rounded-lg', 'mb-4');
            reviewItem.innerHTML = `
                <p class="font-semibold mb-2">${index + 1}. ${answer.question}</p>
                <p class="text-red-600 dark:text-red-400">คำตอบของคุณ: <span class="font-mono">${answer.selectedAnswer}</span></p>
                <p class="text-green-600 dark:text-green-400">คำตอบที่ถูกต้อง: <span class="font-mono">${answer.correctAnswer}</span></p>
                <p class="text-gray-600 dark:text-gray-400 mt-2 text-sm"><em>คำอธิบาย: ${answer.explanation}</em></p>
            `;
            reviewContainer.appendChild(reviewItem);
        });

        renderAllMath();
    }

    function backToResult() {
        reviewScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
    }

    function saveQuizState() {
        // Don't save userAnswers to resume state, only for review at the end.
        const state = { 
            currentQuestionIndex, 
            score, 
            shuffledQuestions,
            userAnswers // Save answers to allow resuming and then reviewing
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function resumeQuiz(savedState) {
        currentQuestionIndex = savedState.currentQuestionIndex;
        score = savedState.score;
        shuffledQuestions = savedState.shuffledQuestions;
        userAnswers = savedState.userAnswers || []; // Resume answers
        startScreen.classList.add("hidden");
        quizScreen.classList.remove("hidden");
        resultScreen.classList.add("hidden");
        scoreCounterEl.textContent = `คะแนน: ${score}`;
        showQuestion();
    }

    function checkForSavedQuiz() {
        const savedStateJSON = localStorage.getItem(STORAGE_KEY);
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                if (typeof savedState.currentQuestionIndex === 'number' && Array.isArray(savedState.shuffledQuestions)) {
                    if (confirm("พบข้อมูลการทำแบบทดสอบครั้งก่อน คุณต้องการทำต่อหรือไม่? (หากไม่ต้องการ ข้อมูลเดิมจะถูกลบ)")) {
                        resumeQuiz(savedState);
                    } else {
                        localStorage.removeItem(STORAGE_KEY);
                    }
                }
            } catch (e) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    }

    // --- Event Listeners ---
    startBtn.addEventListener("click", startQuiz);
    nextBtn.addEventListener("click", showNextQuestion);
    prevBtn.addEventListener("click", showPreviousQuestion); // New
    restartBtn.addEventListener("click", startQuiz);
    reviewBtn.addEventListener("click", showReview); // New
    backToResultBtn.addEventListener("click", backToResult); // New

    // --- Initialization ---
    checkForSavedQuiz();
}