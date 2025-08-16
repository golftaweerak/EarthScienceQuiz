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
      modalContent: document.querySelector("#resume-modal .modal-content"),
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
      initialTime: 0, // Add to track the starting time for color coding
    };

    // --- Initialization ---
    setupDynamicUI();
    bindEventListeners();
    initializeSound();
    checkForSavedQuiz();
  }

  /**
   * Sets up UI elements that are dynamically added to the DOM.
   * This improves separation of concerns by keeping DOM manipulation out of the main init function.
   */
  function setupDynamicUI() {
    // Create and inject 'Back to Home' button on the result screen
    if (elements.restartBtn && elements.restartBtn.parentElement && !document.getElementById('back-to-home-btn')) {
        const homeBtn = document.createElement('a');
        homeBtn.id = 'back-to-home-btn';
        homeBtn.href = '../index.html'; // Link to the main page
        homeBtn.textContent = 'กลับหน้าแรก';
        // Use styles consistent with other buttons in the project.
        homeBtn.className = 'w-full max-w-xs text-center bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-lg transition duration-300';
        elements.restartBtn.parentElement.appendChild(homeBtn);
    }
  }

  // --- UI / Rendering Functions ---

  /**
   * Handles smooth transitions between different screens (e.g., start, quiz, results).
   * @param {HTMLElement} fromScreen The screen to hide.
   * @param {HTMLElement} toScreen The screen to show.
   */
  function switchScreen(fromScreen, toScreen) {
    const transitionDuration = 300; // ms, should match CSS animation duration

    if (fromScreen) {
      fromScreen.classList.add('anim-fade-out');
      setTimeout(() => {
        fromScreen.classList.add('hidden');
        fromScreen.classList.remove('anim-fade-out');
        if (toScreen) {
          toScreen.classList.remove('hidden');
          toScreen.classList.add('anim-fade-in');
        }
      }, transitionDuration);
    } else if (toScreen) { // For the very first screen
      toScreen.classList.remove('hidden');
      toScreen.classList.add('anim-fade-in');
    }
  }

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
    // Only stop the timer if it's a per-question timer.
    // The overall timer should continue running across questions.
    if (state.timerMode === "perQuestion") {
      stopTimer();
    }
    resetState();
    const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];
    // Replace newline characters with <br> for proper HTML rendering
    const questionHtml = currentQuestion.question.replace(/\n/g, '<br>');

    elements.questionCounter.textContent = `ข้อที่ ${state.currentQuestionIndex + 1} / ${
      state.shuffledQuestions.length
    }`;
    elements.question.innerHTML = questionHtml;

    const previousAnswer = state.userAnswers[state.currentQuestionIndex];

    // --- New: Shuffle options to prevent memorizing order ---
    // Create a copy to avoid modifying the original question data in the state
    const shuffledOptions = [...currentQuestion.options];
    // Fisher-Yates (aka Knuth) Shuffle algorithm for an unbiased shuffle
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    // Use the shuffled array to create the buttons
    shuffledOptions.forEach((option) => {
      const button = document.createElement("button");
      button.innerHTML = option.replace(/\n/g, '<br>');
      // Store the original, raw option value to prevent issues with HTML/KaTeX rendering
      button.dataset.optionValue = option;
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
    // Only stop the timer if it's a per-question timer.
    // The overall timer should keep running.
    if (state.timerMode === "perQuestion") {
      stopTimer();
    }
    const selectedBtn = e.currentTarget;
    selectedBtn.classList.add("anim-option-pop");
    const selectedValue = selectedBtn.dataset.optionValue.trim();
    // Safely get and trim the correct answer to prevent errors if it's not a string (e.g., null, undefined, number)
    const correctAnswerValue = state.shuffledQuestions[state.currentQuestionIndex].answer;
    const correctAnswer = (correctAnswerValue || '').toString().trim();
    const correct = selectedValue === correctAnswer;

    // Store the user's answer. This is the only time an answer is recorded for a question.
    state.userAnswers[state.currentQuestionIndex] = {
      question: state.shuffledQuestions[state.currentQuestionIndex].question,
      selectedAnswer: selectedValue,
      correctAnswer: correctAnswer,
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
      correctAnswer
    );

    Array.from(elements.options.children).forEach((button) => {
      if (button.dataset.optionValue.trim() === correctAnswer) {
        button.classList.add("correct");
      }
      button.disabled = true;
    });

    elements.nextBtn.classList.remove("hidden");
    renderAllMath();
  }

  function showFeedback(isCorrect, explanation, correctAnswer) {
    const explanationHtml = explanation ? explanation.replace(/\n/g, '<br>') : '';

    if (isCorrect) {
      elements.feedbackContent.innerHTML = `<h3 class="font-bold text-lg text-green-800 dark:text-green-300">ถูกต้อง!</h3><p class="text-green-700 dark:text-green-400 mt-2">${explanationHtml}</p>`;
      elements.feedback.classList.add(
        "bg-green-100",
        "dark:bg-green-900/50",
        "border",
        "border-green-300",
        "dark:border-green-700"
      );
    } else {
      elements.feedbackContent.innerHTML = `<h3 class="font-bold text-lg text-red-800 dark:text-red-300">ผิดครับ!</h3><p class="text-red-700 dark:text-red-400 mt-1">คำตอบที่ถูกต้องคือ: <strong>${correctAnswer}</strong></p><p class="text-red-700 dark:text-red-400 mt-2">${explanationHtml}</p>`;
      elements.feedback.classList.add(
        "bg-red-100",
        "dark:bg-red-900/50",
        "border",
        "border-red-300",
        "dark:border-red-700"
      );
    }
    elements.feedback.classList.remove("hidden");
    elements.feedback.classList.add("anim-feedback-in");
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
    switchScreen(elements.quizScreen, elements.resultScreen);
    saveQuizState(); // Save the final state, including the score

    // --- Refactored Result Screen Logic ---
    const totalQuestions = state.shuffledQuestions.length;
    const correctAnswers = state.score;
    const incorrectAnswersCount = totalQuestions - correctAnswers;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // Remove any existing stats container to prevent duplicates on restart
    const existingStats = document.getElementById('result-stats-container');
    if (existingStats) {
        existingStats.remove();
    }

    // Create the new stats container
    const statsContainer = document.createElement('div');
    statsContainer.id = 'result-stats-container';
    statsContainer.className = 'w-full max-w-md mx-auto grid grid-cols-3 gap-4 my-8 text-center';

    let statsHTML = `
        <!-- Correct Answers -->
        <div class="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800/60">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">${correctAnswers}</p>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">คำตอบถูก</p>
        </div>
        <!-- Incorrect Answers -->
        <div class="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800/60">
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">${incorrectAnswersCount}</p>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">คำตอบผิด</p>
        </div>
    `;

    // Conditionally add Time Taken or Total Questions
    if (state.timerMode === 'overall' && state.initialTime > 0) {
        const timeTakenSeconds = state.initialTime - state.timeLeft;
        const minutes = Math.floor(timeTakenSeconds / 60);
        const seconds = timeTakenSeconds % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        statsHTML += `
            <div class="flex flex-col items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/60">
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formattedTime}</p>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">เวลาที่ใช้</p>
            </div>
        `;
    } else {
        statsHTML += `
            <div class="flex flex-col items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-700">
                <p class="text-2xl font-bold text-gray-600 dark:text-gray-300">${totalQuestions}</p>
                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">ข้อทั้งหมด</p>
            </div>
        `;
    }

    statsContainer.innerHTML = statsHTML;

    // --- NEW LAYOUT LOGIC ---
    // The goal is to group all quantitative results under one header for a cleaner layout.
    // The desired order is: Header -> Progress Circle -> Stat Cards.

    // Find the wrapper for the progress circle. We assume it's the parent of the parent of the circle SVG element.
    const progressCircleWrapper = elements.progressCircle ? elements.progressCircle.parentElement.parentElement : null;

    if (elements.finalScore && progressCircleWrapper) {
        // 1. Repurpose the 'finalScore' element as the main header for the results.
        elements.finalScore.textContent = 'สรุปผลคะแนน';
        // Make it a more prominent header and adjust margins for better spacing.
        elements.finalScore.className = 'text-center text-2xl font-bold text-gray-800 dark:text-gray-200 mt-8 mb-4';

        // 2. Move the header to be *before* the progress circle's wrapper.
        progressCircleWrapper.before(elements.finalScore);

        // 3. Insert the detailed stats cards *after* the progress circle's wrapper.
        progressCircleWrapper.after(statsContainer);
    } else {
        // Fallback for safety, in case the DOM structure is not as expected.
        if (elements.finalScore) {
            elements.finalScore.textContent = `สรุปผลคะแนน`;
            elements.finalScore.className = 'text-center text-lg font-bold text-gray-700 dark:text-gray-300 mt-8 mb-0';
            elements.finalScore.after(statsContainer);
        }
    }

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
    // Add a check for `answer` to prevent errors if some questions were not answered (e.g., time ran out)
    const incorrectAnswers = state.userAnswers.filter((answer) => answer && !answer.isCorrect);
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

    // Only read timer mode if the controls are visible (i.e., on the start screen).
    // On restart, it will reuse the previously selected mode.
    const timerModeSelector = document.querySelector('input[name="timer-mode"]:checked');
    if (timerModeSelector) {
      state.timerMode = timerModeSelector.value;
    }

    // --- New: Determine which screen to transition from ---
    // This fixes the bug where restarting from the result screen didn't hide it.
    let fromScreen = null;
    if (!elements.startScreen.classList.contains("hidden")) {
      fromScreen = elements.startScreen;
    } else if (!elements.resultScreen.classList.contains("hidden")) {
      fromScreen = elements.resultScreen;
    }

    state.shuffledQuestions = state.quizData.sort(() => Math.random() - 0.5);

    switchScreen(fromScreen, elements.quizScreen);
    // Initialize and start timer based on mode
    if (state.timerMode === "overall") {
      // Use shuffledQuestions.length for consistency, as it's the actual set of questions being used.
      state.initialTime = state.shuffledQuestions.length * config.timerDefaults.overallMultiplier;
      state.timeLeft = state.initialTime;
      startTimer();
    } else if (state.timerMode === "perQuestion") {
      // Timer will be started in showQuestion(), which calls startTimer() to set initial values.
    }

    state.score = 0;
    state.currentQuestionIndex = 0;
    state.userAnswers = new Array(state.shuffledQuestions.length).fill(null); // Pre-allocate array for answers
    elements.scoreCounter.textContent = `คะแนน: ${state.score}`;

    showQuestion();
    saveQuizState();
  }

  // --- New Review Functions ---
  function showReview() {
    switchScreen(elements.resultScreen, elements.reviewScreen);
    elements.reviewContainer.innerHTML = ""; // Clear previous review

    // Add a check for `answer` to prevent errors if some questions were not answered
    const incorrectAnswers = state.userAnswers.filter((answer) => answer && !answer.isCorrect);

    incorrectAnswers.forEach((answer, index) => {
      const reviewItem = document.createElement("div");
      // A more distinct card for each review item
      reviewItem.className = "bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 mb-6 border border-gray-200 dark:border-gray-700";

      const questionHtml = answer.question.replace(/\n/g, '<br>');
      const explanationHtml = answer.explanation ? answer.explanation.replace(/\n/g, '<br>') : '';

      // Using template literals for a cleaner, more structured layout
      reviewItem.innerHTML = `
          <div class="flex items-start gap-4">
              <span class="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-bold">${index + 1}</span>
              <div class="flex-grow text-lg font-semibold text-gray-800 dark:text-gray-200">${questionHtml}</div>
          </div>

          <div class="mt-4 space-y-3">
              <!-- User's incorrect answer -->
              <div class="flex items-start gap-3 p-3 rounded-md bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700/60">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <div>
                      <p class="text-sm font-medium text-red-800 dark:text-red-300">คำตอบของคุณ</p>
                      <p class="text-red-700 dark:text-red-400 font-mono">${answer.selectedAnswer}</p>
                  </div>
              </div>

              <!-- Correct answer -->
              <div class="flex items-start gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700/60">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <div>
                      <p class="text-sm font-medium text-green-800 dark:text-green-300">คำตอบที่ถูกต้อง</p>
                      <p class="text-green-700 dark:text-green-400 font-mono">${answer.correctAnswer}</p>
                  </div>
              </div>
          </div>

          ${explanationHtml ? `
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" />
                  </svg>
                  <div>
                      <p class="text-sm font-medium text-blue-800 dark:text-blue-300">คำอธิบาย</p>
                      <p class="text-gray-600 dark:text-gray-400 mt-1">${explanationHtml}</p>
                  </div>
              </div>
          </div>
          ` : ''}
      `;
      elements.reviewContainer.appendChild(reviewItem);
    });

    renderAllMath();
  }

  function backToResult() {
    switchScreen(elements.reviewScreen, elements.resultScreen);
  }

  // --- State Management (LocalStorage) ---

  function saveQuizState() {
    // Only save the necessary parts of the state to avoid saving large objects like audio elements
    const stateToSave = {
      currentQuestionIndex: state.currentQuestionIndex,
      score: state.score,
      shuffledQuestions: state.shuffledQuestions,
      userAnswers: state.userAnswers,
      // Add timer state for resuming
      timerMode: state.timerMode,
      timeLeft: state.timeLeft,
      initialTime: state.initialTime,
    };
    localStorage.setItem(state.storageKey, JSON.stringify(stateToSave));
  }

  function resumeQuiz(savedState) {
    state.currentQuestionIndex = savedState.currentQuestionIndex;
    state.score = savedState.score;
    state.shuffledQuestions = savedState.shuffledQuestions;
    state.userAnswers = savedState.userAnswers || []; // Resume answers
    // Restore timer state
    state.timerMode = savedState.timerMode || "none";
    state.timeLeft = savedState.timeLeft || 0;
    state.initialTime = savedState.initialTime || 0;
    
    switchScreen(elements.startScreen, elements.quizScreen);
    elements.scoreCounter.textContent = `คะแนน: ${state.score}`;
    showQuestion();

    // If resuming a quiz with an overall timer, restart the countdown
    if (state.timerMode === "overall" && state.timeLeft > 0) {
      startTimer();
    }
  }

  function checkForSavedQuiz() {
    // --- NEW: Check for 'view_results' action from URL first ---
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');

    const savedStateJSON = localStorage.getItem(state.storageKey);
    if (!savedStateJSON) {
      // If there's no saved state, we can't view results or resume, so just exit.
      return;
    }

    try {
      const savedState = JSON.parse(savedStateJSON);
      if (
        typeof savedState.currentQuestionIndex !== "number" ||
        !Array.isArray(savedState.shuffledQuestions)
      ) {
        // Invalid state, remove it and exit.
        localStorage.removeItem(state.storageKey);
        return;
      }

      // Priority 1: Handle 'view_results' action
      if (action === 'view_results') {
        // Load the state from the saved data
        state.currentQuestionIndex = savedState.currentQuestionIndex;
        state.score = savedState.score;
        state.shuffledQuestions = savedState.shuffledQuestions;
        state.userAnswers = savedState.userAnswers || [];
        state.timerMode = savedState.timerMode || "none";
        state.timeLeft = savedState.timeLeft || 0;
        state.initialTime = savedState.initialTime || 0;

        // Hide the start screen and directly show the results screen
        elements.startScreen.classList.add('hidden');
        showResults();
        // Important: Stop further execution to prevent the resume modal from showing
        return;
      }

      // Priority 2: Handle standard quiz resume (if not viewing results)
      if (elements.resumeModal && elements.modalContent) {
        elements.resumeModal.classList.remove("hidden");
        elements.resumeModal.classList.add("anim-backdrop-fade-in");
        elements.modalContent.classList.add("anim-modal-pop-in");

        elements.resumeConfirmBtn.onclick = () => {
          resumeQuiz(savedState);
          hideModal();
        };
        elements.resumeRejectBtn.onclick = () => {
          localStorage.removeItem(state.storageKey);
          hideModal();
        };
      }
    } catch (e) {
      console.error("Error parsing saved quiz state:", e);
      localStorage.removeItem(state.storageKey);
    }
  }

  function hideModal() {
    if (!elements.resumeModal || !elements.modalContent) return;
    elements.resumeModal.classList.remove('anim-backdrop-fade-in');
    elements.resumeModal.classList.add('anim-backdrop-fade-out');
    elements.modalContent.classList.add('anim-modal-pop-out');
    setTimeout(() => {
      elements.resumeModal.classList.add('hidden');
      elements.resumeModal.classList.remove('anim-backdrop-fade-out');
      elements.modalContent.classList.remove('anim-modal-pop-in', 'anim-modal-pop-out');
    }, 300); // Match longest animation duration
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
    elements.timerValue.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    // --- New: Update color based on time left ---
    if (state.timerMode === "none" || state.initialTime <= 0) return;

    const percentage = (state.timeLeft / state.initialTime) * 100;
    const timerClasses = elements.timerDisplay.classList;

    // Remove all potential color classes to reset
    timerClasses.remove(
      "text-green-600", "dark:text-green-500",
      "text-orange-500", "dark:text-orange-400",
      "text-red-600", "dark:text-red-400"
    );

    // Add the appropriate color class based on the percentage of time remaining
    if (percentage > 50) {
      timerClasses.add("text-green-600", "dark:text-green-500"); // Plenty of time
    } else if (percentage > 25) {
      timerClasses.add("text-orange-500", "dark:text-orange-400"); // Getting low
    } else {
      timerClasses.add("text-red-600", "dark:text-red-400"); // Critically low
    }

    // Add a pulsing animation when time is very low
    if (state.timeLeft <= 10 && state.timeLeft > 0) {
      timerClasses.add("anim-pulse-warning");
    } else {
      timerClasses.remove("anim-pulse-warning");
    }
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
      state.initialTime = config.timerDefaults.perQuestion;
    }

    elements.timerDisplay.classList.remove("hidden");
    updateTimerDisplay();
    state.timerId = setInterval(tick, 1000);
  }

  function handleTimeUp() {
    if (state.timerMode === "perQuestion") {
      const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];
      // Safely get and trim the correct answer
      const correctAnswerValue = currentQuestion.answer;
      const correctAnswer = (correctAnswerValue || '').toString().trim();

      // Record the answer as incorrect due to time out
      state.userAnswers[state.currentQuestionIndex] = {
        question: currentQuestion.question,
        selectedAnswer: "ไม่ได้ตอบ (หมดเวลา)",
        correctAnswer: correctAnswer,
        isCorrect: false,
        explanation: currentQuestion.explanation,
      };

      // Gracefully handle a missing explanation when time is up
      const feedbackExplanation = "หมดเวลา! " + (currentQuestion.explanation || '');
      showFeedback(false, feedbackExplanation, correctAnswer);
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
