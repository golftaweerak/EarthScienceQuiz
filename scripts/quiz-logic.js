import { ModalHandler } from './modal-handler.js';
import { shuffleArray } from './utils.js'; // สมมติว่าสร้างไฟล์ utils.js

// state: Stores all dynamic data of the quiz
let state = {};
// elements: Caches all DOM elements for quick access
let elements = {};
// handler: A dedicated handler for the resume modal
let resumeModalHandler;
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

/**
 * Initializes the entire quiz application.
 * This function is the main entry point for the quiz logic, called by quiz-loader.js.
 * @param {Array} quizData - The array of question objects for the quiz.
 * @param {string} storageKey - The key for storing progress in localStorage.
 */
export function init(quizData, storageKey) {
    // --- 1. Element Caching ---
    elements = {
        // Screens
        startScreen: document.getElementById("start-screen"),
        quizScreen: document.getElementById("quiz-screen"),
        resultScreen: document.getElementById("result-screen"),
        reviewScreen: document.getElementById("review-screen"),
        quizNav: document.getElementById("quiz-nav"),
        // Buttons
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
        // Result & Review UI
        reviewContainer: document.getElementById("review-container"),
        // Modal & Sound
        resumeModal: document.getElementById("resume-modal"),
        resumeConfirmBtn: document.getElementById("resume-confirm-btn"),
        resumeRejectBtn: document.getElementById("resume-reject-btn"),
        soundToggleBtn: document.getElementById("sound-toggle-btn"),
        timerDisplay: document.getElementById("timer-display"),
        timerValue: document.getElementById("timer-value"),
    };

    // --- 2. State Initialization ---
    state = {
        quizData: quizData, // Use data passed from the loader
        storageKey: storageKey, // Use key passed from the loader
        currentQuestionIndex: 0,
        score: 0,
        shuffledQuestions: [],
        userAnswers: [],
        isSoundEnabled: true, // This will be initialized properly later
        correctSound: new Audio("../assets/audio/correct.mp3"),
        incorrectSound: new Audio("../assets/audio/incorrect.mp3"),
        timerMode: "none",
        timeLeft: 0,
        timerId: null,
        initialTime: 0,
        activeScreen: null,
    };

    // --- 3. Initial Setup ---
    resumeModalHandler = new ModalHandler('resume-modal');
    bindEventListeners();
    initializeSound();
    checkForSavedQuiz(); // This will check localStorage and either show the start screen or a resume prompt.
}

  // --- UI / Rendering Functions ---

  /**
   * Handles smooth transitions between different screens (e.g., start, quiz, results).
   * @param {HTMLElement} fromScreen The screen to hide.
   * @param {HTMLElement} toScreen The screen to show.
   */
  function switchScreen(toScreen) {
    const transitionDuration = 300; // ms, should match CSS animation duration
    const fromScreen = state.activeScreen;

    if (fromScreen && fromScreen !== toScreen) {
        fromScreen.classList.add("anim-fade-out");
      setTimeout(() => {
        fromScreen.classList.add("hidden");
        fromScreen.classList.remove("anim-fade-out");
      }, transitionDuration);
    }

    if (toScreen) {
      toScreen.classList.remove("hidden");
      toScreen.classList.add("anim-fade-in");
      state.activeScreen = toScreen;
    }
  }

  /**
   * Renders mathematical formulas in a specific element using KaTeX.
   * @param {HTMLElement} element The element to render math in.
   */
  function renderMath(element) {
    if (window.renderMathInElement && element) {
      window.renderMathInElement(element, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true },
        ],
        throwOnError: false,
      });
    }
  }

  function updateProgressBar() {
    if (!elements.progressBar) return; // ป้องกัน error หากไม่มี element นี้ในหน้า
    // คำนวณ % ความคืบหน้าจากข้อปัจจุบัน
    const progressPercentage =
      ((state.currentQuestionIndex + 1) / state.shuffledQuestions.length) * 100;
    elements.progressBar.style.width = `${progressPercentage}%`;
    if (elements.quizNav) elements.quizNav.classList.remove("hidden");
  }

  /**
   * Creates a single option button element.
   * @param {string} optionText - The text content for the option.
   * @param {object|null} previousAnswer - The user's previously recorded answer for this question, if any.
   * @returns {HTMLElement} The created button element.
   */
  function createOptionButton(optionText, previousAnswer) {
    const button = document.createElement("button");
    button.innerHTML = optionText.replace(/\n/g, "<br>");
    button.dataset.optionValue = optionText; // Store raw value
    button.className = "option-btn w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500";

    if (previousAnswer) {
      // This is a revisited question, so we disable the button and show its state.
      button.disabled = true;
      const isCorrectOption = optionText.trim() === previousAnswer.correctAnswer.trim();
      const wasSelected = optionText.trim() === previousAnswer.selectedAnswer.trim();

      if (isCorrectOption) {
        button.classList.add("correct");
      } else if (wasSelected) {
        // Only mark as incorrect if it was selected and is not the correct answer.
        button.classList.add("incorrect");
      }
    } else {
      // This is a new, unanswered question.
      button.addEventListener("click", selectAnswer);
    }

    return button;
  }


  function showQuestion() {
    // Only stop the timer if it's a per-question timer.
    // The overall timer should continue running across questions.
    if (state.timerMode === "perQuestion") {
      stopTimer();
    }
    resetState();
    const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];
    if (!currentQuestion) {
        console.error("Invalid question index:", state.currentQuestionIndex);
        showResults(); // Or handle error appropriately
        return;
    }
    // Safely replace newlines, guarding against undefined/null questions
    const questionHtml = (currentQuestion?.question || "").replace(/\n/g, "<br>");

    elements.questionCounter.textContent = `ข้อที่ ${
      state.currentQuestionIndex + 1
    } / ${state.shuffledQuestions.length}`;
    elements.question.innerHTML = questionHtml;

    const previousAnswer = state.userAnswers?.[state.currentQuestionIndex];
    const shuffledOptions = shuffleArray([...(currentQuestion?.options || [])]);

    shuffledOptions.forEach((option) => {
        elements.options.appendChild(createOptionButton(option, previousAnswer));
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

    renderMath(elements.quizScreen); // Render math only within the quiz screen
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
    const correctAnswerValue =
      state.shuffledQuestions[state.currentQuestionIndex]?.answer;
    const correctAnswer = (correctAnswerValue || "").toString().trim();
    const correct = selectedValue === correctAnswer;

    // Store the user's answer. This is the only time an answer is recorded for a question.
    state.userAnswers[state.currentQuestionIndex] = {
      question: state.shuffledQuestions[state.currentQuestionIndex]?.question,
      selectedAnswer: selectedValue,
      correctAnswer: correctAnswer,
      isCorrect: correct,
      explanation: state.shuffledQuestions[state.currentQuestionIndex]?.explanation || "",
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
      state.shuffledQuestions[state.currentQuestionIndex]?.explanation,
      correctAnswer
    );

    Array.from(elements.options.children).forEach((button) => {
      if (button.dataset.optionValue.trim() === correctAnswer) {
        button.classList.add("correct");
      }
      button.disabled = true;
    });

    elements.nextBtn.classList.remove("hidden");
    renderMath(elements.feedback); // Render math only in the new feedback element
  }

  function showFeedback(isCorrect, explanation, correctAnswer) {
    const explanationHtml = explanation
      ? explanation.replace(/\n/g, "<br>")
      : "";

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

  // --- NEW: Function to display the final results screen ---
  function showResults() {
    stopTimer(); // Stop any running timers.

    // Calculate final statistics
    const totalQuestions = state.shuffledQuestions.length;
    const correctAnswers = state.score;
    const incorrectAnswersCount = totalQuestions - correctAnswers;
    const percentage =
      totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;

    // Get the appropriate message and icon based on the score
    const resultInfo = getResultInfo(percentage);

    // Prepare stats object for the layout builder
    const stats = {
      totalQuestions,
      correctAnswers,
      incorrectAnswersCount,
      percentage,
    };

    // Clean up old results and build the new layout
    cleanupResultsScreen();
    buildResultsLayout(resultInfo, stats);

    // Switch to the result screen
    switchScreen(elements.resultScreen);

    // Save the final state. This is important for the 'view results' feature.
    saveQuizState();
  }

  // --- Result Screen Helpers ---

  /**
   * Determines the appropriate result message object based on the score percentage.
   * @param {number} percentage The user's score percentage.
   * @returns {object} The result message object from the config.
   */
  function getResultInfo(percentage) {
    if (percentage >= 90) {
      return config.resultMessages.perfect;
    } else if (percentage >= 75) {
      return config.resultMessages.great;
    } else if (percentage >= 50) {
      return config.resultMessages.good;
    }
    return config.resultMessages.effort;
  }

  /**
   * Cleans up the result screen by hiding static elements and removing old dynamic layouts.
   * This prevents element duplication when restarting a quiz.
   */
  function cleanupResultsScreen() {
    // Remove any previously generated layouts to prevent duplication.
    document.getElementById("modern-results-layout")?.remove();
  }

  /**
   * Creates a compact, icon-based stat item for the results screen.
   * @param {string|number} value The main value to display.
   * @param {string} label The text label for the stat.
   * @param {string} icon SVG string for the icon.
   * @param {string} theme The color theme ('green', 'red', 'blue', 'gray').
   * @returns {HTMLElement} The stat item element.
   */
  function createStatItem(value, label, icon, theme) {
    const themeClasses = {
      green: {
        bg: "bg-green-100 dark:bg-green-900/40",
        text: "text-green-700 dark:text-green-300",
      },
      red: {
        bg: "bg-red-100 dark:bg-red-900/40",
        text: "text-red-700 dark:text-red-300",
      },
      blue: {
        bg: "bg-blue-100 dark:bg-blue-900/40",
        text: "text-blue-700 dark:text-blue-300",
      },
      gray: {
        bg: "bg-gray-100 dark:bg-gray-700/60",
        text: "text-gray-700 dark:text-gray-300",
      },
    };
    const classes = themeClasses[theme] || themeClasses.gray;

    const item = document.createElement("div");
    item.className = "flex items-center gap-3";
    item.innerHTML = `
        <div class="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${classes.bg} ${classes.text}">
            ${icon}
        </div>
        <div>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-200">${value}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">${label}</p>
        </div>
    `;
    return item;
  }

  /**
   * Builds the entire modern, responsive layout for the result screen.
   * @param {object} resultInfo The object containing the title, message, and icon for the result.
   * @param {object} stats An object with all calculated statistics (scores, percentage, time).
   */
  function buildResultsLayout(resultInfo, stats) {
    const layoutContainer = document.createElement("div");
    layoutContainer.id = "modern-results-layout";
    // A compact, centered layout that adapts for different screen sizes.
    layoutContainer.className =
      "w-full max-w-2xl mx-auto flex flex-col items-center gap-8 mt-8 mb-6 px-4";

    // --- 1. Message Area (Icon, Title, Message) ---
    const messageContainer = document.createElement("div");
    messageContainer.className = "text-center";
    messageContainer.innerHTML = `
        <div class="w-16 h-16 mx-auto mb-3 ${resultInfo.colorClass}">${resultInfo.icon}</div>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100">${resultInfo.title}</h2>
        <p class="mt-2 text-lg text-gray-600 dark:text-gray-300">${resultInfo.message}</p>
    `;
    layoutContainer.appendChild(messageContainer);

    // --- 2. Data Container (for Circle + Stats) ---
    // This container will be a flex row on medium screens and up, and a column on smaller screens.
    const dataContainer = document.createElement("div");
    dataContainer.className =
      "w-full flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8";

    // --- 2a. Progress Circle ---
    const progressContainer = document.createElement("div");
    progressContainer.className = "relative w-40 h-40 flex-shrink-0";
    progressContainer.innerHTML = `
        <svg class="w-full h-full" viewBox="0 0 36 36">
            <path class="text-gray-200 dark:text-gray-700"
                stroke="currentColor" stroke-width="2.5" fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path class="text-blue-500"
                stroke="currentColor" stroke-width="2.5" fill="none"
                stroke-linecap="round"
                stroke-dasharray="0, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-3xl font-bold text-gray-700 dark:text-gray-200">${stats.percentage}%</span>
        </div>
    `;
    dataContainer.appendChild(progressContainer);

    // Animate the circle
    setTimeout(() => {
      const circlePath = progressContainer.querySelector("path.text-blue-500");
      if (circlePath) {
        circlePath.style.transition = "stroke-dasharray 1s ease-out";
        circlePath.style.strokeDasharray = `${stats.percentage}, 100`;
      }
    }, 100);

    // --- 2b. Stats List ---
    const statsContainer = document.createElement("div");
    // Center items on mobile, align to start on medium screens and up.
    statsContainer.className =
      "flex flex-col items-center md:items-start gap-4 w-full md:w-auto";

    // Define icons for stats
    const icons = {
      correct: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>`,
      incorrect: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`,
      time: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>`,
      total: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 100 2h16a1 1 0 100-2H2zM5 15a1 1 0 110 2h10a1 1 0 110-2H5z" /></svg>`,
    };

    // Programmatically create and append stat items
    statsContainer.appendChild(
      createStatItem(stats.correctAnswers, "คำตอบถูก", icons.correct, "green")
    );
    statsContainer.appendChild(
      createStatItem(
        stats.incorrectAnswersCount,
        "คำตอบผิด",
        icons.incorrect,
        "red"
      )
    );

    if (state.timerMode === "overall" && state.initialTime > 0) {
      const timeTakenSeconds = state.initialTime - state.timeLeft;
      const minutes = Math.floor(timeTakenSeconds / 60);
      const seconds = timeTakenSeconds % 60;
      const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
      statsContainer.appendChild(
        createStatItem(formattedTime, "เวลาที่ใช้", icons.time, "blue")
      );
    } else {
      statsContainer.appendChild(
        createStatItem(stats.totalQuestions, "ข้อทั้งหมด", icons.total, "gray")
      );
    }

    dataContainer.appendChild(statsContainer);
    layoutContainer.appendChild(dataContainer);

    // --- 5. Assemble and Inject ---
    // Prepend to the result screen so it appears before the buttons
    elements.resultScreen.prepend(layoutContainer);

    // --- 6. Final UI Updates ---
    // Show or hide the review button based on incorrect answers
    const incorrectAnswers = getIncorrectAnswers();
    if (incorrectAnswers.length > 0) {
      elements.reviewBtn.classList.remove("hidden");
    } else {
      elements.reviewBtn.classList.add("hidden");
    }

    renderMath(layoutContainer); // Render math only in the new results layout
  }
  function getIncorrectAnswers() {
    // Add a check for `answer` to prevent errors if some questions were not answered
    return state.userAnswers.filter((answer) => answer && !answer.isCorrect);
  }
  // --- Core Quiz Logic ---

  function startQuiz() {
    stopTimer();
    clearSavedState();

    // Only read timer mode if the controls are visible (i.e., on the start screen).
    // On restart, it will reuse the previously selected mode.
    const timerModeSelector = document.querySelector(
      'input[name="timer-mode"]:checked'
    );
    if (timerModeSelector) {
      state.timerMode = timerModeSelector.value;
    }

    state.shuffledQuestions = shuffleArray([...state.quizData]);
    switchScreen(elements.quizScreen);
    // Initialize and start timer based on mode
    if (state.timerMode === "overall") {
      // Use shuffledQuestions.length for consistency, as it's the actual set of questions being used.
      state.initialTime =
        state.shuffledQuestions.length * config.timerDefaults.overallMultiplier;
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
    switchScreen(elements.reviewScreen);
    elements.reviewContainer.innerHTML = ""; // Clear previous review

    const incorrectAnswers = getIncorrectAnswers();

    incorrectAnswers.forEach((answer, index) => {
      const reviewItem = document.createElement("div");
      // A more distinct card for each review item
      reviewItem.className =
        "bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 mb-6 border border-gray-200 dark:border-gray-700";

      const questionHtml = (answer.question || "").replace(/\n/g, "<br>");
      const explanationHtml = answer.explanation
        ? answer.explanation.replace(/\n/g, "<br>")
        : "";

      // Using template literals for a cleaner, more structured layout
      reviewItem.innerHTML = `
          <div class="flex items-start gap-4">
              <span class="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-bold">${
                index + 1
              }</span>
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
                      <p class="text-red-700 dark:text-red-400 font-mono">${
                        answer.selectedAnswer || ""
                      }</p>
                  </div>
              </div>

              <!-- Correct answer -->
              <div class="flex items-start gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700/60">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                  <div>
                      <p class="text-sm font-medium text-green-800 dark:text-green-300">คำตอบที่ถูกต้อง</p>
                      <p class="text-green-700 dark:text-green-400 font-mono">${
                        answer.correctAnswer || ""
                      }</p>
                  </div>
              </div>
          </div>

          ${
            explanationHtml
              ? `
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
          `
              : ""
          }
      `;
      elements.reviewContainer.appendChild(reviewItem);
    });

    renderMath(elements.reviewContainer); // Render math only in the review container
  }

  function backToResult() {
    switchScreen(elements.resultScreen);
  }

  // --- State Management (LocalStorage) ---

  function loadStateFromSave(savedState) {
    state.currentQuestionIndex = savedState.currentQuestionIndex;
    state.score = savedState.score;
    state.shuffledQuestions = savedState.shuffledQuestions;
    state.userAnswers = savedState.userAnswers || [];
    state.timerMode = savedState.timerMode || "none";
    state.timeLeft = savedState.timeLeft || 0;
    state.initialTime = savedState.initialTime || 0;
  }

  function saveQuizState() {
    // Only save the necessary parts of the state to avoid saving large objects like audio elements
    // This is more explicit and safer than spreading the whole state object.
    const stateToSave = {
      currentQuestionIndex: state.currentQuestionIndex,
      score: state.score,
      shuffledQuestions: state.shuffledQuestions,
      userAnswers: state.userAnswers,
      timerMode: state.timerMode,
      timeLeft: state.timeLeft,
      initialTime: state.initialTime,
    };
    localStorage.setItem(state.storageKey, JSON.stringify(stateToSave));
  }

  function clearSavedState() {
    localStorage.removeItem(state.storageKey);
  }

  function resumeQuiz(savedState) {
    loadStateFromSave(savedState);

    switchScreen(elements.quizScreen);
    showQuestion();

    // If resuming a quiz with an overall timer, restart the countdown
    if (state.timerMode === "overall" && state.timeLeft > 0) {
      startTimer();
    }
  }

  function checkForSavedQuiz() {
    // --- NEW: Check for 'view_results' action from URL first ---
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");

    // Set initial screen
    switchScreen(elements.startScreen);

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
        clearSavedState();
        return;
      }

      // Priority 1: Handle 'view_results' action
      if (action === "view_results") {
        loadStateFromSave(savedState);

        // Hide the start screen and directly show the results screen
        elements.startScreen.classList.add("hidden");
        showResults();
        // Important: Stop further execution to prevent the resume modal from showing
        return;
      }

      // Priority 2: Handle standard quiz resume (if not viewing results)
      if (elements.resumeModal && resumeModalHandler) {
        resumeModalHandler.open();

        // The 'reject' button is now handled by `data-modal-close`,
        // but we still need to clear the state when it's clicked.
        elements.resumeRejectBtn.onclick = () => {
          clearSavedState();
          // The modal will close automatically due to data-modal-close.
        };

        // The 'confirm' button needs to resume the quiz before closing.
        elements.resumeConfirmBtn.onclick = () => {
          resumeQuiz(savedState);
          resumeModalHandler.close();
        };
      }
    } catch (e) {
      console.error("Error parsing saved quiz state:", e);
      clearSavedState();
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
    elements.timerValue.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    // --- New: Update color based on time left ---
    if (state.timerMode === "none" || state.initialTime <= 0) return;

    const percentage = (state.timeLeft / state.initialTime) * 100;
    const timerClasses = elements.timerDisplay.classList;

    // Remove all potential color classes to reset
    timerClasses.remove(
      "text-green-600",
      "dark:text-green-500",
      "text-orange-500",
      "dark:text-orange-400",
      "text-red-600",
      "dark:text-red-400"
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
      // Ensure we don't proceed if the question index is out of bounds
      if (state.currentQuestionIndex >= state.shuffledQuestions.length) {
        showResults(); // The quiz is over, just show results
        return;
      }
      const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];

      // Safely get and trim the correct answer
      const correctAnswerValue = currentQuestion.answer;
      const correctAnswer = (correctAnswerValue || "").toString().trim();

      // Record the answer as incorrect due to time out
      state.userAnswers[state.currentQuestionIndex] = {
        question: currentQuestion.question,
        selectedAnswer: "ไม่ได้ตอบ (หมดเวลา)",
        correctAnswer: correctAnswer,
        isCorrect: false,
        explanation: currentQuestion.explanation,
      };

      // Gracefully handle a missing explanation when time is up
      const feedbackExplanation =
        "หมดเวลา! " + (currentQuestion.explanation || "");
      showFeedback(false, feedbackExplanation, correctAnswer);
      Array.from(elements.options.children).forEach(
        (button) => (button.disabled = true)
      );
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
    elements.soundToggleBtn.innerHTML = state.isSoundEnabled
      ? config.soundOnIcon
      : config.soundOffIcon;
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
    // เปลี่ยนให้ปุ่ม "ทำแบบทดสอบอีกครั้ง" กลับไปที่หน้าเริ่มต้น
    // เพื่อให้ผู้ใช้สามารถเลือกโหมดจับเวลาใหม่และเริ่มควิซใหม่ได้
    elements.restartBtn.addEventListener("click", () => {
      clearSavedState(); // Clear progress from localStorage for a true fresh start
      cleanupResultsScreen(); // Reuse the cleanup function to ensure the dynamic results are removed
      switchScreen(elements.startScreen);
    });
    elements.reviewBtn.addEventListener("click", showReview);
    elements.backToResultBtn.addEventListener("click", backToResult);
    if (elements.soundToggleBtn) {
      elements.soundToggleBtn.addEventListener("click", toggleSound);
    }
  }
