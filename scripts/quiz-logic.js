const QuizApp = (function () {
  // state: Stores all dynamic data of the quiz
  let state = {};
  // elements: Caches all DOM elements for quick access
  let elements = {};
  // config: Stores all static configuration and constants
  const config = {
    soundOnIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>`,
    soundOffIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" /><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l-2-2m0 0l-2-2m2 2l-2 2m2-2l2-2" /></svg>`,
    resultMessages: {
      perfect: {
        title: "ยอดเยี่ยมมาก!",
        message: "คุณคืออนาคตนักดาราศาสตร์โอลิมปิก!",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`,
        colorClass: "text-yellow-400",
      },
      great: {
        title: "เก่งมาก!",
        message: "เก่งมาก! ความรู้แน่นจริงๆ",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>`,
        colorClass: "text-blue-500",
      },
      good: {
        title: "ทำได้ดี!",
        message: "ทำได้ดี! ทบทวนอีกนิดหน่อยจะสมบูรณ์แบบเลย",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085c-.5 0-.975.335-1.175.808l-2 5m7 5h2.833l3.5-7A2 2 0 0017.263 5h-4.017c-.163 0-.326-.02-.485-.06L7 6" /></svg>`,
        colorClass: "text-green-500",
      },
      effort: {
        title: "พยายามได้ดีมาก!",
        message: "ไม่เป็นไรนะ สู้ๆ แล้วลองพยายามอีกครั้ง!",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22l-.648-1.437a3.375 3.375 0 00-2.456-2.456L12 18.25l1.438-.648a3.375 3.375 0 002.456-2.456L16.25 14l.648 1.437a3.375 3.375 0 002.456 2.456L20.75 18.25l-1.438.648a3.375 3.375 0 00-2.456 2.456z" /></svg>`,
        colorClass: "text-gray-500",
      },
    },
    timerDefaults: {
      perQuestion: 90, // 90 วินาทีต่อข้อ
      overallMultiplier: 75, // 75 วินาที * จำนวนข้อ สำหรับเวลาทั้งชุด
    },
  };

  function init(quizData, storageKey) {
    // --- Element Caching ---
    elements = {
      // Screens
      startScreen: document.getElementById("start-screen"),
      quizScreen: document.getElementById("quiz-screen"),
      resultScreen: document.getElementById("result-screen"),
      reviewScreen: document.getElementById("review-screen"),
      startBtn: document.getElementById("start-btn"),
      nextBtn: document.getElementById("next-btn"),
      prevBtn: document.getElementById("prev-btn"),
      restartBtn: document.getElementById("restart-btn"),
      reviewBtn: document.getElementById("review-btn"),
      backToResultBtn: document.getElementById("back-to-result-btn"),
      // Quiz UI
      questionCounter: document.getElementById("question-counter"),
      scoreCounter: document.getElementById("score-counter"),
      question: document.getElementById("question"),
      options: document.getElementById("options"),
      feedback: document.getElementById("feedback"),
      feedbackContent: document.querySelector("#feedback .feedback-content"),
      progressBar: document.getElementById("progress-bar"),
      // Result UI
      finalScore: document.getElementById("final-score"),
      finalMessage: document.getElementById("final-message"),
      resultIconContainer: document.getElementById("result-icon-container"),
      resultTitle: document.getElementById("result-title"),
      progressCircle: document.getElementById("progress-circle"),
      finalPercentage: document.getElementById("final-percentage"),
      reviewContainer: document.getElementById("review-container"),
      // Modal & Sound
      resumeModal: document.getElementById("resume-modal"),
      resumeConfirmBtn: document.getElementById("resume-confirm-btn"),
      resumeRejectBtn: document.getElementById("resume-reject-btn"),
      soundToggleBtn: document.getElementById("sound-toggle-btn"),
      timerDisplay: document.getElementById("timer-display"),
      timerValue: document.getElementById("timer-value"),
    };

    // --- State Initialization ---
    state = {
      quizData: quizData,
      storageKey: storageKey,
      currentQuestionIndex: 0,
      score: 0,
      shuffledQuestions: [],
      userAnswers: [],
      isSoundEnabled: true,
      correctSound: new Audio("../assets/audio/correct.mp3"),
      incorrectSound: new Audio("../assets/audio/incorrect.mp3"),
      timerMode: "none",
      timeLeft: 0,
      timerId: null,
    };

    // --- Initialization ---
    bindEventListeners();
    initializeSound();
    checkForSavedQuiz();
  }

  // --- UI / Rendering Functions ---

  function renderAllMath() {
    if (typeof renderMathInElement === "function") {
      renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
      });
    }
  }

  function updateProgressBar() {
    if (!elements.progressBar) return; // ป้องกัน error หากไม่มี element นี้ในหน้า
    // คำนวณ % ความคืบหน้าจากข้อปัจจุบัน
    const progressPercentage =
      ((state.currentQuestionIndex + 1) / state.shuffledQuestions.length) * 100;
    elements.progressBar.style.width = `${progressPercentage}%`;
  }

  function showQuestion() {
    stopTimer(); // Stop any previous timer
    resetState();
    const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];
    elements.questionCounter.textContent = `ข้อที่ ${state.currentQuestionIndex + 1} / ${
      state.shuffledQuestions.length
    }`;
    elements.question.innerHTML = currentQuestion.question;

    const previousAnswer = state.userAnswers[state.currentQuestionIndex];

    currentQuestion.options.forEach((option) => {
      const button = document.createElement("button");
      button.innerHTML = option;
      button.classList.add(
        "option-btn",
        "w-full",
        "p-4",
        "border-2",
        "border-gray-300",
        "dark:border-gray-600",
        "rounded-lg",
        "text-left",
        "hover:bg-gray-100",
        "dark:hover:bg-gray-700",
        "hover:border-blue-500",
        "dark:hover:border-blue-500"
      );

      if (previousAnswer) {
        // This is a revisited question, disable buttons and show state
        button.disabled = true;
        if (option.trim() === previousAnswer.correctAnswer) {
          button.classList.add("correct");
        }
        if (
          option.trim() === previousAnswer.selectedAnswer &&
          !previousAnswer.isCorrect
        ) {
          button.classList.add("incorrect");
        }
      } else {
        // This is a new question
        button.addEventListener("click", selectAnswer);
      }
      elements.options.appendChild(button);
    });

    if (previousAnswer) {
      // If we are revisiting a question, show the feedback panel without altering the score.
      showFeedback(
        previousAnswer.isCorrect,
        previousAnswer.explanation,
        previousAnswer.correctAnswer
      );
      elements.nextBtn.classList.remove("hidden");
    }

    if (state.currentQuestionIndex > 0) {
      elements.prevBtn.classList.remove("hidden");
    }

    updateProgressBar();

    // Start per-question timer if the mode is selected
    if (state.timerMode === "perQuestion" && !previousAnswer) {
      startTimer();
    }

    renderAllMath();
  }

  function resetState() {
    elements.nextBtn.classList.add("hidden");
    elements.feedback.classList.add("hidden");
    elements.feedbackContent.innerHTML = "";
    elements.feedback.className = "hidden mt-6 p-4 rounded-lg";
    elements.prevBtn.classList.add("hidden");
    while (elements.options.firstChild) {
      elements.options.removeChild(elements.options.firstChild);
    }
  }

  function selectAnswer(e) {
    stopTimer(); // Stop the timer as soon as an answer is selected
    const selectedBtn = e.currentTarget;
    const correct =
      selectedBtn.textContent.trim() ===
      state.shuffledQuestions[state.currentQuestionIndex].answer.trim();

    // Store the user's answer. This is the only time an answer is recorded for a question.
    state.userAnswers[state.currentQuestionIndex] = {
      question: state.shuffledQuestions[state.currentQuestionIndex].question,
      selectedAnswer: selectedBtn.textContent.trim(),
      correctAnswer: state.shuffledQuestions[state.currentQuestionIndex].answer.trim(),
      isCorrect: correct,
      explanation: state.shuffledQuestions[state.currentQuestionIndex].explanation,
    };

    if (correct) {
      state.score++;
      elements.scoreCounter.textContent = `คะแนน: ${state.score}`;
      selectedBtn.classList.add("correct");
      if (state.isSoundEnabled)
        state.correctSound
          .play()
          .catch((e) => console.error("Error playing sound:", e));
    } else {
      selectedBtn.classList.add("incorrect");
      if (state.isSoundEnabled)
        state.incorrectSound
          .play()
          .catch((e) => console.error("Error playing sound:", e));
    }

    // Show feedback and disable all options
    showFeedback(
      correct,
      state.shuffledQuestions[state.currentQuestionIndex].explanation,
      state.shuffledQuestions[state.currentQuestionIndex].answer.trim()
    );

    Array.from(elements.options.children).forEach((button) => {
      if (
        button.textContent.trim() ===
        state.shuffledQuestions[state.currentQuestionIndex].answer.trim()
      ) {
        button.classList.add("correct");
      }
      button.disabled = true;
    });

    elements.nextBtn.classList.remove("hidden");
    renderAllMath();
  }

  function showFeedback(isCorrect, explanation, correctAnswer) {
    if (isCorrect) {
      elements.feedbackContent.innerHTML = `<h3 class="font-bold text-lg text-green-800 dark:text-green-300">ถูกต้อง!</h3><p class="text-green-700 dark:text-green-400 mt-2">${explanation}</p>`;
      elements.feedback.classList.add(
        "bg-green-100",
        "dark:bg-green-900/50",
        "border",
        "border-green-300",
        "dark:border-green-700"
      );
    } else {
      elements.feedbackContent.innerHTML = `<h3 class="font-bold text-lg text-red-800 dark:text-red-300">ผิดครับ!</h3><p class="text-red-700 dark:text-red-400 mt-1">คำตอบที่ถูกต้องคือ: <strong>${correctAnswer}</strong></p><p class="text-red-700 dark:text-red-400 mt-2">${explanation}</p>`;
      elements.feedback.classList.add(
        "bg-red-100",
        "dark:bg-red-900/50",
        "border",
        "border-red-300",
        "dark:border-red-700"
      );
    }
    elements.feedback.classList.remove("hidden");
  }

  function showNextQuestion() {
    state.currentQuestionIndex++;
    if (state.currentQuestionIndex < state.shuffledQuestions.length) {
      showQuestion();
      saveQuizState();
    } else {
      showResults();
    }
  }

  // --- New Previous Question Function ---
  function showPreviousQuestion() {
    if (state.currentQuestionIndex > 0) {
      // We don't change the score here. The score is final once answered.
      state.currentQuestionIndex--;
      showQuestion();
      saveQuizState();
    }
  }

  function showResults() {
    stopTimer(); // Ensure timer is stopped on the result screen
    localStorage.removeItem(state.storageKey);
    elements.quizScreen.classList.add("hidden");
    elements.resultScreen.classList.remove("hidden");

    // --- New Result Screen Logic ---
    const percentage = Math.round((state.score / state.shuffledQuestions.length) * 100);

    // Safely update result elements if they exist to prevent errors
    if (elements.finalScore)
      elements.finalScore.textContent = `คะแนน: ${state.score} จาก ${state.shuffledQuestions.length}`;
    if (elements.finalPercentage) elements.finalPercentage.textContent = `${percentage}%`;

    // Animate progress circle
    if (elements.progressCircle) {
      // Use a timeout to ensure the transition is applied after the element is visible
      setTimeout(() => {
        elements.progressCircle.style.strokeDasharray = `${percentage}, 100`;
      }, 100);
    }

    let resultInfo;
    if (percentage >= 90) {
      resultInfo = config.resultMessages.perfect;
    } else if (percentage >= 75) {
      resultInfo = config.resultMessages.great;
    } else if (percentage >= 50) {
      resultInfo = config.resultMessages.good;
    } else {
      resultInfo = config.resultMessages.effort;
    }

    // Update the DOM with the determined title, message, and icon from config
    if (elements.resultTitle) elements.resultTitle.textContent = resultInfo.title;
    if (elements.finalMessage) elements.finalMessage.textContent = resultInfo.message;
    if (elements.resultIconContainer) {
      elements.resultIconContainer.innerHTML = resultInfo.icon;
      // Reset classes and apply the new color class
      elements.resultIconContainer.className = `mx-auto mb-4 w-12 h-12 ${resultInfo.colorClass}`;
    }

    // New: Show or hide the review button
    const incorrectAnswers = state.userAnswers.filter((answer) => !answer.isCorrect);
    if (incorrectAnswers.length > 0) {
      elements.reviewBtn.classList.remove("hidden");
    } else {
      elements.reviewBtn.classList.add("hidden");
    }
  }

  // --- Core Quiz Logic ---

  function startQuiz() {
    stopTimer();
    localStorage.removeItem(state.storageKey);

    // Read selected timer mode from the UI
    const selectedMode = document.querySelector('input[name="timer-mode"]:checked').value;
    state.timerMode = selectedMode;

    elements.startScreen.classList.add("hidden");
    elements.quizScreen.classList.remove("hidden");
    elements.resultScreen.classList.add("hidden");
    elements.reviewScreen.classList.add("hidden");

    // Initialize and start timer based on mode
    if (state.timerMode === "overall") {
      state.timeLeft = state.quizData.length * config.timerDefaults.overallMultiplier;
      startTimer();
    } else if (state.timerMode === "perQuestion") {
      state.timeLeft = config.timerDefaults.perQuestion;
      // Timer will be started in showQuestion()
    }

    state.score = 0;
    state.currentQuestionIndex = 0;
    state.shuffledQuestions = state.quizData.sort(() => Math.random() - 0.5);
    elements.scoreCounter.textContent = `คะแนน: ${state.score}`;

    showQuestion();
    saveQuizState();
    state.userAnswers = [];
  }

  // --- New Review Functions ---
  function showReview() {
    elements.resultScreen.classList.add("hidden");
    elements.reviewScreen.classList.remove("hidden");
    elements.reviewContainer.innerHTML = ""; // Clear previous review

    const incorrectAnswers = state.userAnswers.filter((answer) => !answer.isCorrect);

    incorrectAnswers.forEach((answer, index) => {
      const reviewItem = document.createElement("div");
      reviewItem.classList.add(
        "p-4",
        "border",
        "border-gray-300",
        "dark:border-gray-600",
        "rounded-lg",
        "mb-4"
      );
      reviewItem.innerHTML = `
                <p class="font-semibold mb-2">${index + 1}. ${
        answer.question
      }</p>
                <p class="text-red-600 dark:text-red-400">คำตอบของคุณ: <span class="font-mono">${
                  answer.selectedAnswer
                }</span></p>
                <p class="text-green-600 dark:text-green-400">คำตอบที่ถูกต้อง: <span class="font-mono">${
                  answer.correctAnswer
                }</span></p>
                <p class="text-gray-600 dark:text-gray-400 mt-2 text-sm"><em>คำอธิบาย: ${
                  answer.explanation
                }</em></p>
            `;
      elements.reviewContainer.appendChild(reviewItem);
    });

    renderAllMath();
  }

  function backToResult() {
    elements.reviewScreen.classList.add("hidden");
    elements.resultScreen.classList.remove("hidden");
  }

  // --- State Management (LocalStorage) ---

  function saveQuizState() {
    // Only save the necessary parts of the state to avoid saving large objects like audio elements
    const stateToSave = {
      currentQuestionIndex: state.currentQuestionIndex,
      score: state.score,
      shuffledQuestions: state.shuffledQuestions,
      userAnswers: state.userAnswers,
    };
    localStorage.setItem(state.storageKey, JSON.stringify(stateToSave));
  }

  function resumeQuiz(savedState) {
    state.currentQuestionIndex = savedState.currentQuestionIndex;
    state.score = savedState.score;
    state.shuffledQuestions = savedState.shuffledQuestions;
    state.userAnswers = savedState.userAnswers || []; // Resume answers
    elements.startScreen.classList.add("hidden");
    elements.quizScreen.classList.remove("hidden");
    elements.resultScreen.classList.add("hidden");
    elements.scoreCounter.textContent = `คะแนน: ${state.score}`;
    showQuestion();
  }

  function checkForSavedQuiz() {
    const savedStateJSON = localStorage.getItem(state.storageKey);
    if (savedStateJSON) {
      try {
        const savedState = JSON.parse(savedStateJSON);
        if (
          typeof savedState.currentQuestionIndex === "number" &&
          Array.isArray(savedState.shuffledQuestions)
        ) {
          // Use custom modal if it exists, otherwise fallback to confirm()
          if (elements.resumeModal && elements.resumeConfirmBtn && elements.resumeRejectBtn) {
            elements.resumeModal.classList.remove("hidden");

            elements.resumeConfirmBtn.onclick = () => {
              resumeQuiz(savedState);
              elements.resumeModal.classList.add("hidden");
            };

            elements.resumeRejectBtn.onclick = () => {
              localStorage.removeItem(state.storageKey);
              elements.resumeModal.classList.add("hidden");
            };
          } else {
            if (
              confirm(
                "พบข้อมูลการทำแบบทดสอบครั้งก่อน คุณต้องการทำต่อหรือไม่? (หากไม่ต้องการ ข้อมูลเดิมจะถูกลบ)"
              )
            ) {
              resumeQuiz(savedState);
            } else {
              localStorage.removeItem(state.storageKey);
            }
          }
        }
      } catch (e) {
        console.error("Error parsing saved quiz state:", e);
        localStorage.removeItem(state.storageKey);
      }
    }
  }

  // --- Timer Functions ---

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  function updateTimerDisplay() {
    if (!elements.timerDisplay || !elements.timerValue) return;
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    elements.timerValue.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function tick() {
    state.timeLeft--;
    updateTimerDisplay();
    if (state.timeLeft <= 0) {
      stopTimer();
      handleTimeUp();
    }
  }

  function startTimer() {
    if (state.timerMode === "none") {
      elements.timerDisplay.classList.add("hidden");
      return;
    }
    if (state.timerMode === "perQuestion") {
      state.timeLeft = config.timerDefaults.perQuestion;
    }

    elements.timerDisplay.classList.remove("hidden");
    updateTimerDisplay();
    state.timerId = setInterval(tick, 1000);
  }

  function handleTimeUp() {
    if (state.timerMode === "perQuestion") {
      const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];
      const correctAnswer = currentQuestion.answer.trim();

      // Record the answer as incorrect due to time out
      state.userAnswers[state.currentQuestionIndex] = {
        question: currentQuestion.question,
        selectedAnswer: "ไม่ได้ตอบ (หมดเวลา)",
        correctAnswer: correctAnswer,
        isCorrect: false,
        explanation: currentQuestion.explanation,
      };

      showFeedback(false, "หมดเวลา! " + currentQuestion.explanation, correctAnswer);
      Array.from(elements.options.children).forEach(button => button.disabled = true);
      elements.nextBtn.classList.remove("hidden");
      saveQuizState();
    } else if (state.timerMode === "overall") {
      showResults();
    }
  }

  // --- Sound Management ---

  // --- Sound Functions ---
  function updateSoundButton() {
    if (!elements.soundToggleBtn) return;
    elements.soundToggleBtn.innerHTML = state.isSoundEnabled ? config.soundOnIcon : config.soundOffIcon;
  }

  function toggleSound() {
    state.isSoundEnabled = !state.isSoundEnabled;
    localStorage.setItem("quizSoundEnabled", state.isSoundEnabled);
    updateSoundButton();
  }

  function initializeSound() {
    const savedSoundSetting = localStorage.getItem("quizSoundEnabled");
    // Default to true if not set, otherwise use the saved setting
    state.isSoundEnabled = savedSoundSetting !== "false";
    updateSoundButton();
  }

  // --- Event Binding ---

  function bindEventListeners() {
    elements.startBtn.addEventListener("click", startQuiz);
    elements.nextBtn.addEventListener("click", showNextQuestion);
    elements.prevBtn.addEventListener("click", showPreviousQuestion);
    elements.restartBtn.addEventListener("click", startQuiz);
    elements.reviewBtn.addEventListener("click", showReview);
    elements.backToResultBtn.addEventListener("click", backToResult);
    if (elements.soundToggleBtn) {
      elements.soundToggleBtn.addEventListener("click", toggleSound);
    }
  }

  // --- Public API ---
  return {
    init: init, // Expose the init function to the public
  };
})();
