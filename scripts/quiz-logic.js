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
        message: "คุณคืออนาคตนักเรียนโอลิมปิก!",
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
 * @param {string} quizTitle - The title of the current quiz.
 * @param {number|null} customTime - Custom time in seconds, if provided.
 */
export function init(quizData, storageKey, quizTitle, customTime) {
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
        // Cache the container for the main action buttons (Next/Prev)
        actionContainer: document.getElementById("next-btn")?.parentElement,
    };

    // --- 2. State Initialization ---
    state = {
        quizData: quizData, // Use data passed from the loader
        storageKey: storageKey, // Use key passed from the loader
        quizTitle: quizTitle || "แบบทดสอบ",
        customTime: customTime, // Store custom time
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

/**
 * Toggles the floating state for the main quiz action buttons container.
 * This makes the Next/Previous buttons stick to the bottom of the screen.
 * @param {boolean} active - Whether to activate or deactivate the floating navigation.
 */
function setFloatingNav(active) {
    if (!elements.actionContainer) return;

    const floatingClasses = [
        'fixed', 'bottom-0', 'left-0', 'right-0', 'z-20',
        'p-4', 'bg-white/90', 'dark:bg-gray-800/90',
        'backdrop-blur-sm', 'border-t', 'border-gray-200', 'dark:border-gray-700',
        'shadow-[0_-2px_10px_rgba(0,0,0,0.05)]', 'dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)]'
    ];

    if (active) {
        elements.actionContainer.classList.add(...floatingClasses);
        // Add padding to the bottom of the quiz screen to prevent content overlap
        if (elements.quizScreen) {
            elements.quizScreen.style.paddingBottom = '6.5rem'; // Adjust to match button container height
        }
    } else {
        elements.actionContainer.classList.remove(...floatingClasses);
        // Reset padding
        if (elements.quizScreen) {
            elements.quizScreen.style.paddingBottom = '';
        }
    }
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

  /**
   * Creates a single checkbox option element for multiple-select questions.
   * The entire element is a label, making it fully clickable for better UX.
   * @param {string} optionText - The text content for the option.
   * @param {object|null} previousAnswer - The user's previously recorded answer.
   * @returns {HTMLElement} The created label element which acts as a fully clickable wrapper.
   */
  function createCheckboxOption(optionText, previousAnswer) {
    const wrapperLabel = document.createElement('label');
    // The entire element is now a label, making it fully clickable.
    // Added cursor-pointer to the wrapper itself and a smooth transition.
    wrapperLabel.className = 'option-checkbox-wrapper flex items-center w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors duration-150';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = optionText.trim();
    // The checkbox itself doesn't need a pointer cursor and we prevent double-toggling.
    checkbox.className = 'h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none';

    const textSpan = document.createElement('span');
    textSpan.innerHTML = optionText.replace(/\n/g, "<br>");
    // The text span doesn't need a pointer cursor either.
    textSpan.className = 'ml-3 text-gray-800 dark:text-gray-200 w-full';

    wrapperLabel.appendChild(checkbox);
    wrapperLabel.appendChild(textSpan);

    if (previousAnswer) {
      checkbox.disabled = true;
      // When disabled, the wrapper should not look clickable.
      wrapperLabel.classList.remove('cursor-pointer', 'hover:bg-gray-100', 'dark:hover:bg-gray-700', 'hover:border-blue-500', 'dark:hover:border-blue-500');
      wrapperLabel.classList.add('cursor-not-allowed', 'opacity-75');

      const selectedAnswers = new Set(previousAnswer.selectedAnswer || []);
      if (selectedAnswers.has(optionText.trim())) {
        checkbox.checked = true;
      }
    }
    return wrapperLabel;
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
    // Ensure options is an array before spreading
    const shuffledOptions = shuffleArray([...(currentQuestion?.options || [])]);

    // Check the question type to render the correct input
    if (currentQuestion.type === 'multiple-select') {
      shuffledOptions.forEach((option) => {
        elements.options.appendChild(createCheckboxOption(option, previousAnswer));
      });
      // For multi-select, show a "Submit" button immediately
      if (!previousAnswer) {
        elements.nextBtn.textContent = 'ส่งคำตอบ';
        elements.nextBtn.classList.remove('hidden');
      }
    } else {
      // Default single-choice button behavior
      shuffledOptions.forEach((option) => {
        elements.options.appendChild(createOptionButton(option, previousAnswer));
      });
    }

    if (previousAnswer) {
      // If we are revisiting a question, show the feedback panel without altering the score.
      showFeedback(previousAnswer.isCorrect, previousAnswer.explanation, previousAnswer.correctAnswer);
      elements.nextBtn.textContent = 'ข้อต่อไป'; // Ensure button text is correct when reviewing
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

  /**
   * Evaluates the answer for a multiple-select question.
   */
  function evaluateMultipleAnswer() {
    if (state.timerMode === "perQuestion") {
      stopTimer();
    }

    const selectedCheckboxes = elements.options.querySelectorAll('input[type="checkbox"]:checked');
    const selectedValues = Array.from(selectedCheckboxes).map(cb => cb.value.trim());

    const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];
    // Ensure the answer is an array, default to empty array if not defined
    const correctAnswers = Array.isArray(currentQuestion.answer)
      ? currentQuestion.answer.map(a => String(a).trim())
      : [String(currentQuestion.answer).trim()];

    // Use Sets for robust comparison (order doesn't matter)
    const selectedSet = new Set(selectedValues);
    const correctSet = new Set(correctAnswers);

    const isCorrect = selectedSet.size === correctSet.size &&
                      [...selectedSet].every(value => correctSet.has(value));

    // Store answer
    state.userAnswers[state.currentQuestionIndex] = {
      question: currentQuestion.question,
      selectedAnswer: selectedValues, // Store as array
      correctAnswer: correctAnswers, // Store as array
      isCorrect: isCorrect,
      explanation: currentQuestion.explanation || "",
      subCategory: currentQuestion.subCategory || 'ไม่มีหมวดหมู่',
      sourceQuizTitle: currentQuestion.sourceQuizTitle
    };
    saveQuizState();

    if (isCorrect) {
      state.score++;
      elements.scoreCounter.textContent = `คะแนน: ${state.score}`;
      if (state.isSoundEnabled) state.correctSound.play().catch(e => console.error("Error playing sound:", e));
    } else {
      if (state.isSoundEnabled) state.incorrectSound.play().catch(e => console.error("Error playing sound:", e));
    }

    // Show feedback and disable options
    showFeedback(isCorrect, currentQuestion.explanation, correctAnswers);

    Array.from(elements.options.querySelectorAll('.option-checkbox-wrapper')).forEach(wrapper => {
      const checkbox = wrapper.querySelector('input');
      const optionValue = checkbox.value.trim();
      checkbox.disabled = true;

      if (correctSet.has(optionValue)) {
        // Add a class to highlight all correct answers
        wrapper.classList.add('correct');
      } else if (selectedSet.has(optionValue)) {
        // Add a class to highlight incorrectly selected answers
        wrapper.classList.add('incorrect');
      }
    });

    elements.nextBtn.textContent = 'ข้อต่อไป';
    renderMath(elements.feedback);
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
      subCategory: state.shuffledQuestions[state.currentQuestionIndex]?.subCategory || 'ไม่มีหมวดหมู่',
      sourceQuizTitle: state.shuffledQuestions[state.currentQuestionIndex]?.sourceQuizTitle
    };

    // Save state immediately after an answer is recorded for better data persistence.
    saveQuizState();

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
    
    // Handle both string and array for correct answer display
    const correctAnswerDisplay = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer;

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
      elements.feedbackContent.innerHTML = `<h3 class="font-bold text-lg text-red-800 dark:text-red-300">ผิดครับ!</h3><p class="text-red-700 dark:text-red-400 mt-1">คำตอบที่ถูกต้องคือ: <strong>${correctAnswerDisplay}</strong></p><p class="text-red-700 dark:text-red-400 mt-2">${explanationHtml}</p>`;
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
    } else {
      showResults();
    }
  }

  /**
   * Central handler for the main action button (Next/Submit).
   */
  function handleNextButtonClick() {
    const currentQuestion = state.shuffledQuestions[state.currentQuestionIndex];
    const isMultiSelect = currentQuestion.type === 'multiple-select';
    const isAnswered = state.userAnswers[state.currentQuestionIndex] !== null;

    if (isMultiSelect && !isAnswered) {
      evaluateMultipleAnswer();
    } else {
      showNextQuestion();
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
    setFloatingNav(false); // Deactivate the floating navigation bar

    const totalQuestions = state.shuffledQuestions.length;
    const correctAnswers = state.score;
    const incorrectAnswersCount = totalQuestions - correctAnswers;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    // --- REVISED Time Calculation ---
    // This new logic accurately tracks time spent, even across browser sessions.
    let timeTakenInSeconds;

    if (state.timerMode === 'overall' && state.initialTime > 0) {
      // For 'overall' mode, this is the most accurate measure.
      timeTakenInSeconds = state.initialTime - state.timeLeft;
    } else {
      // For other modes, use the accumulated time.
      const lastSessionDuration = state.sessionStartTime ? (Date.now() - state.sessionStartTime) / 1000 : 0;
      timeTakenInSeconds = (state.totalTimeSpent || 0) + lastSessionDuration;
    }

    timeTakenInSeconds = Math.max(0, timeTakenInSeconds); // Ensure no negative time

    const minutes = Math.floor(timeTakenInSeconds / 60);
    const seconds = Math.floor(timeTakenInSeconds % 60);
    const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    const averageTimePerQuestion = totalQuestions > 0 ? (timeTakenInSeconds / totalQuestions).toFixed(1) : 0;
    const formattedAverageTime = `${averageTimePerQuestion} วิ/ข้อ`;

    // Calculate score by subcategory
    // This new logic groups by main category first, then by specific subcategory.
    const categoryStats = state.userAnswers.reduce((acc, answer) => {
      if (!answer || !answer.subCategory) return acc;

      let mainCategory, specificCategory;

      // Handle both new object format and old string format for subCategory
      if (typeof answer.subCategory === 'object' && answer.subCategory.main) {
          mainCategory = answer.subCategory.main;
          specificCategory = answer.subCategory.specific || 'ทั่วไป';
      } else if (typeof answer.subCategory === 'string') {
          // Fallback for older data: use the string as the main category.
          mainCategory = answer.subCategory;
          specificCategory = '—'; // Use a placeholder for no specific sub-category
      } else {
          return acc; // Skip if format is unknown
      }

      // Initialize main category if it doesn't exist
      if (!acc[mainCategory]) {
          acc[mainCategory] = { correct: 0, total: 0, subcategories: {} };
      }
      // Initialize specific subcategory if it doesn't exist
      if (!acc[mainCategory].subcategories[specificCategory]) {
          acc[mainCategory].subcategories[specificCategory] = { correct: 0, total: 0 };
      }

      // Increment counts for both main and sub categories
      acc[mainCategory].total++;
      acc[mainCategory].subcategories[specificCategory].total++;
      if (answer.isCorrect) {
          acc[mainCategory].correct++;
          acc[mainCategory].subcategories[specificCategory].correct++;
      }
      return acc;
    }, {});

    // --- Performance Analysis ---
    const performanceSummary = { best: null, worst: null };
    // Create a flat list of all specific subcategories with their stats.
    const allSubcategories = [];
    Object.values(categoryStats).forEach(mainCatData => {
        Object.entries(mainCatData.subcategories).forEach(([subName, subData]) => {
            // We only want to analyze specific, named subcategories.
            // The '—' is a placeholder for questions that only had a main category.
            if (subName !== '—' && subData.total > 0) {
                allSubcategories.push({
                    name: subName,
                    correct: subData.correct,
                    total: subData.total,
                });
            }
        });
    });

    if (allSubcategories.length > 1) {
      // Calculate scores and sort subcategories by performance.
      const scoredSubcategories = allSubcategories.map(subCat => ({
        name: subCat.name,
        score: (subCat.correct / subCat.total) * 100,
      })).sort((a, b) => a.score - b.score);

      // Only populate the summary if the scores are actually different.
      if (scoredSubcategories[scoredSubcategories.length - 1].score > scoredSubcategories[0].score) {
        performanceSummary.best = scoredSubcategories[scoredSubcategories.length - 1].name;
        performanceSummary.worst = scoredSubcategories[0].name;
      }
    }

    // Get the appropriate message and icon based on the score
    const resultInfo = getResultInfo(percentage);

    // Prepare stats object for the layout builder
    const stats = {
      totalQuestions,
      totalScore: state.quizData.length,
      correctAnswers,
      incorrectAnswersCount,
      percentage,
      formattedTime,
      formattedAverageTime,
      performanceSummary,
      categoryStats,
    };

    // Clean up old results and build the new layout
    cleanupResultsScreen();
    buildResultsLayout(resultInfo, stats);

    // Switch to the result screen
    switchScreen(elements.resultScreen);

    // It's celebration time!
    triggerConfetti();

    // Save the final state. This is important for the 'view results' feature.
    saveQuizState();
  }

  /**
   * Triggers a celebratory confetti effect for 3 seconds.
   * This creates a festive explosion of confetti from both sides of the screen.
   */
  function triggerConfetti() {
    // Ensure the confetti library is loaded and available
    if (typeof confetti !== 'function') {
      console.error("Confetti library is not loaded.");
      return;
    }

    const duration = 3 * 1000; // 3 seconds
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      // shoot from the left and right
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
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
      purple: {
        bg: "bg-purple-100 dark:bg-purple-900/40",
        text: "text-purple-700 dark:text-purple-400",
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
        <div class="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${classes.bg} ${classes.text} shadow-inner">
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
   * Builds the modern, responsive layout for the result screen.
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
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">จากชุดข้อสอบ: <span class="font-semibold">${state.quizTitle}</span></p>
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
    // Use a grid layout to ensure two columns even on small screens.
    statsContainer.className = "grid grid-cols-2 gap-4 w-full";

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
      createStatItem(stats.totalScore, "คะแนนเต็ม", icons.total, "gray")
    );    
    statsContainer.appendChild(
      createStatItem(
        stats.incorrectAnswersCount,
        "คำตอบผิด",
        icons.incorrect,
        "red"
      )
    );

    // Always show time taken if available
    statsContainer.appendChild(
      createStatItem(stats.formattedTime, "เวลาที่ใช้", icons.time, "blue")
    );
    statsContainer.appendChild(
      createStatItem(stats.formattedAverageTime, "เฉลี่ยต่อข้อ", icons.time, "purple")
    );

    dataContainer.appendChild(statsContainer);
    layoutContainer.appendChild(dataContainer);

    // --- 3. Category Breakdown ---
    // This new section creates an accordion for main categories and their subcategories.
    if (stats.categoryStats && Object.keys(stats.categoryStats).length > 0) {
      const categoryContainer = document.createElement('div');
      categoryContainer.className = 'w-full max-w-2xl mx-auto mt-8';
      categoryContainer.innerHTML = `<h3 class="text-xl font-bold text-gray-700 dark:text-gray-300 mb-4">คะแนนตามหมวดหมู่</h3>`;
      
      const accordionContainer = document.createElement('div');
      accordionContainer.className = 'space-y-2';

      const sortedCategories = Object.entries(stats.categoryStats).sort((a, b) => a[0].localeCompare(b[0]));

      for (const [mainCategory, data] of sortedCategories) {
          const mainPercentage = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
          
          const accordionItem = document.createElement('div');
          accordionItem.className = 'bg-gray-50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700';

          const accordionHeader = document.createElement('div');
          accordionHeader.className = 'p-4 cursor-pointer flex justify-between items-center hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors';
          accordionHeader.innerHTML = `
              <div>
                  <span class="font-bold text-gray-800 dark:text-gray-200">${mainCategory}</span>
                  <span class="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-400">${data.correct} / ${data.total}</span>
              </div>
              <div class="flex items-center gap-3">
                  <span class="font-bold text-blue-600 dark:text-blue-400">${mainPercentage}%</span>
                  <svg class="accordion-icon h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
              </div>
          `;

          const accordionContent = document.createElement('div');
          accordionContent.className = 'accordion-content max-h-0 overflow-hidden transition-all duration-300 ease-in-out';
          
          const subcategoryList = document.createElement('div');
          subcategoryList.className = 'p-4 border-t border-gray-200 dark:border-gray-700 space-y-3';

          const sortedSubcategories = Object.entries(data.subcategories).sort((a, b) => a[0].localeCompare(b[0]));

          for (const [specificCategory, subData] of sortedSubcategories) {
              if (specificCategory === '—') continue; // Skip placeholder for old data format
              const subPercentage = subData.total > 0 ? Math.round((subData.correct / subData.total) * 100) : 0;
              const subItem = document.createElement('div');
              subItem.innerHTML = `
                  <div class="text-sm leading-tight">
                      <p class="font-medium text-gray-700 dark:text-gray-300">${specificCategory}</p>
                      <p class="font-semibold text-gray-500 dark:text-gray-400">${subData.correct} / ${subData.total} (${subPercentage}%)</p>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1.5">
                      <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${subPercentage}%"></div>
                  </div>
              `;
              subcategoryList.appendChild(subItem);
          }

          accordionContent.appendChild(subcategoryList);
          accordionItem.appendChild(accordionHeader);
          if (subcategoryList.childElementCount > 0) {
            accordionItem.appendChild(accordionContent);
            accordionHeader.addEventListener('click', () => {
                const icon = accordionHeader.querySelector('.accordion-icon');
                if (accordionContent.style.maxHeight) {
                    accordionContent.style.maxHeight = null;
                    icon.classList.remove('rotate-180');
                } else {
                    accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
                    icon.classList.add('rotate-180');
                }
            });
          } else {
            // If no subcategories, remove the chevron icon
            accordionHeader.querySelector('.accordion-icon')?.remove();
            accordionHeader.style.cursor = 'default';
          }
          
          accordionContainer.appendChild(accordionItem);
      }
      
      categoryContainer.appendChild(accordionContainer);
      layoutContainer.appendChild(categoryContainer);
    }

    // --- 4. Performance Summary ---
    if (stats.performanceSummary && (stats.performanceSummary.best || stats.performanceSummary.worst)) {
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'w-full max-w-2xl mx-auto mt-6 p-4 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm';
        summaryContainer.innerHTML = `<h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 font-kanit">สรุปผลการทำแบบทดสอบ</h3>`;
        
        const summaryList = document.createElement('ul');
        summaryList.className = 'space-y-2 text-sm';

        if (stats.performanceSummary.best) {
            const bestItem = document.createElement('li');
            bestItem.className = 'flex items-start gap-3';
            bestItem.innerHTML = `
                <svg class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                <span class="text-gray-700 dark:text-gray-300">ทำได้ดีมากในหมวดหมู่: <strong class="font-semibold text-green-600 dark:text-green-400">${stats.performanceSummary.best}</strong></span>
            `;
            summaryList.appendChild(bestItem);
        }

        if (stats.performanceSummary.worst) {
            const worstItem = document.createElement('li');
            worstItem.className = 'flex items-start gap-3';
            worstItem.innerHTML = `
                <svg class="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                <span class="text-gray-700 dark:text-gray-300">หมวดหมู่ที่ควรทบทวนเพิ่มเติม: <strong class="font-semibold text-yellow-600 dark:text-yellow-500">${stats.performanceSummary.worst}</strong></span>
            `;
            summaryList.appendChild(worstItem);
        }

        summaryContainer.appendChild(summaryList);
        layoutContainer.appendChild(summaryContainer);
    }

    // --- 5. Action Buttons ---
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 mt-8';
    
    // Restart Button
    elements.restartBtn.className = 'w-full sm:w-auto flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 shadow-md hover:shadow-lg';
    actionsContainer.appendChild(elements.restartBtn);

    // Review Button (will be shown/hidden later)
    elements.reviewBtn.className = 'w-full sm:w-auto flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 shadow-md hover:shadow-lg';
    actionsContainer.appendChild(elements.reviewBtn);

    layoutContainer.appendChild(actionsContainer);

    // --- 6. Assemble and Inject ---
    // Prepend to the result screen so it appears before the buttons
    elements.resultScreen.prepend(layoutContainer);

    // --- 8. Final UI Updates ---
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
    setFloatingNav(true); // Activate the floating navigation bar
    clearSavedState();
    state.sessionStartTime = Date.now(); // Record start time for the session
    state.totalTimeSpent = 0; // Reset total time spent for a new quiz
    
    // Only read timer mode if the controls are visible (i.e., on the start screen).
    // On restart, it will reuse the previously selected mode.
    const timerModeSelector = document.querySelector(
      'input[name="timer-mode"]:checked'
    );
    if (timerModeSelector) {
      state.timerMode = timerModeSelector.value;
    }

    // Filter out any potential null or undefined questions from the source data
    // to prevent errors during the quiz, especially in the results analysis.
    const validQuizData = state.quizData.filter(q => q);
    state.shuffledQuestions = shuffleArray([...validQuizData]);

    switchScreen(elements.quizScreen);
    // Initialize and start timer based on mode
    if (state.timerMode === "overall") {
      // Use custom time if provided, otherwise calculate based on defaults
      state.initialTime = (state.customTime && state.customTime > 0)
        ? state.customTime
        : state.shuffledQuestions.length * config.timerDefaults.overallMultiplier;
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

    // Get both incorrect and all answers to allow for toggling
    const allUserAnswers = state.userAnswers.filter(answer => answer); // Filter out any null entries
    const incorrectAnswers = allUserAnswers.filter(answer => !answer.isCorrect);

    const reviewScreenHeader = elements.reviewScreen.querySelector('h2');
    
    if (reviewScreenHeader) {
        const headerContainer = reviewScreenHeader.parentElement;
        // Clear previous dynamic elements to prevent duplication
        headerContainer.querySelectorAll('.dynamic-review-element').forEach(el => el.remove());

        const subtitle = document.createElement('p');
        subtitle.className = 'quiz-subtitle text-md text-gray-600 dark:text-gray-400 mt-1 dynamic-review-element font-kanit';
        subtitle.innerHTML = `จากชุดข้อสอบ: <span class="font-semibold text-gray-700 dark:text-gray-300">${state.quizTitle}</span>`;
        reviewScreenHeader.after(subtitle);

        // --- Filter UI ---
        // Build category filter based on the incorrect answers to start with relevant filters
        const subCategories = [...new Set(incorrectAnswers.map(a => {
            if (typeof a.subCategory === 'object' && a.subCategory.main) {
                return a.subCategory.main;
            }
            return a.subCategory || 'ไม่มีหมวดหมู่';
        }))];
        if (subCategories.length > 1) {
            // Create category dropdown
            const filterContainer = document.createElement('div');
            filterContainer.className = 'mt-4 dynamic-review-element';
            
            let optionsHTML = '<option value="all">ทุกหมวดหมู่</option>';
            subCategories.sort().forEach(cat => {
                optionsHTML += `<option value="${cat}">${cat}</option>`;
            });

            filterContainer.innerHTML = `
                <label for="review-filter" class="block text-sm font-medium text-gray-700 dark:text-gray-300">กรองตามหมวดหมู่:</label>
                <select id="review-filter" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                    ${optionsHTML}
                </select>
            `;
            subtitle.after(filterContainer);

        }

        // --- "Show All" Toggle ---
        const toggleContainer = document.createElement('div');
        toggleContainer.className = 'mt-3 dynamic-review-element flex items-center';
        toggleContainer.innerHTML = `
            <input type="checkbox" id="show-all-toggle" class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500">
            <label for="show-all-toggle" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">แสดงข้อสอบทั้งหมด (รวมข้อที่ตอบถูก)</label>
        `;
        const lastDynamicElement = headerContainer.querySelector('.dynamic-review-element:last-of-type') || subtitle;
        lastDynamicElement.after(toggleContainer);

        const countDisplay = document.createElement('p');
        countDisplay.id = 'review-count-display';
        countDisplay.className = 'text-sm text-gray-500 dark:text-gray-400 mt-3 dynamic-review-element';
        headerContainer.appendChild(countDisplay);

        // --- Event Listeners for Filters ---
        const filterSelect = document.getElementById('review-filter');
        const showAllToggle = document.getElementById('show-all-toggle');

        const updateReviewDisplay = () => {
            const category = filterSelect ? filterSelect.value : 'all';
            const showAll = showAllToggle.checked;
            const sourceData = showAll ? allUserAnswers : incorrectAnswers;
            renderReviewItems(sourceData, category, incorrectAnswers.length);
        };

        if (filterSelect) filterSelect.addEventListener('change', updateReviewDisplay);
        if (showAllToggle) showAllToggle.addEventListener('change', updateReviewDisplay);

        // Initial render
        updateReviewDisplay();
    }

    renderMath(elements.reviewContainer); // Render math only in the review container
  }

  /**
   * Renders the list of incorrect answers, optionally filtered by category.
   * @param {Array} sourceAnswers - The array of answers to display (can be all or just incorrect).
   * @param {string} filterCategory - The category to filter by, or 'all' to show all.
   */
  function renderReviewItems(sourceAnswers, filterCategory, totalIncorrect) {
      elements.reviewContainer.innerHTML = ""; // Clear previous items

      const filteredAnswers =
        filterCategory === "all" ?
        sourceAnswers :
        sourceAnswers.filter((answer) => {
              let categoryName = "ไม่มีหมวดหมู่";
              if (typeof answer.subCategory === "object" && answer.subCategory.main) {
                categoryName = answer.subCategory.main;
              } else if (typeof answer.subCategory === "string") {
                categoryName = answer.subCategory;
              }
              return categoryName === filterCategory;
            });

      const countDisplay = document.getElementById('review-count-display');
      if (countDisplay) {
          countDisplay.textContent = `แสดง ${filteredAnswers.length} ข้อ (จากทั้งหมด ${totalIncorrect} ข้อที่ตอบผิด)`;
      }

      if (filteredAnswers.length === 0 && filterCategory !== 'all') {
          elements.reviewContainer.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400 py-4">ไม่พบข้อที่ตรงตามเงื่อนไขในหมวดหมู่นี้</p>`;
          return;
      }

      filteredAnswers.forEach((answer, index) => {
        const reviewItem = document.createElement("div");
        reviewItem.className = "bg-white dark:bg-gray-800 shadow-md rounded-lg p-5 mb-6 border border-gray-200 dark:border-gray-700";
        
        // Add a visual indicator for correct answers when "Show All" is active
        if (answer.isCorrect) {
            reviewItem.classList.add('border-l-4', 'border-green-500');
        } else {
            reviewItem.classList.add('border-l-4', 'border-red-500');
        }
        const questionHtml = (answer.question || "").replace(/\n/g, "<br>");
        const explanationHtml = answer.explanation ? answer.explanation.replace(/\n/g, "<br>") : "";

        // --- Improved Tag Generation ---
        const tags = [];
        if (answer.subCategory) {
            if (typeof answer.subCategory === 'object' && answer.subCategory.main) {
                const fullCategory = answer.subCategory.specific 
                    ? `${answer.subCategory.main} &gt; ${answer.subCategory.specific}`
                    : answer.subCategory.main;
                tags.push(fullCategory);
            } else if (typeof answer.subCategory === 'string') {
                tags.push(answer.subCategory);
            }
        }

        const tagsHtml = tags
          .map(tag => `<span class="inline-block mt-2 px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 text-xs font-semibold rounded-full">${tag}</span>`)
          .join('');

        reviewItem.innerHTML = `
            <div class="flex items-start gap-4">
                <span class="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 font-bold">${index + 1}</span>
                <div class="flex-grow min-w-0">
                    <div class="text-lg font-semibold text-gray-800 dark:text-gray-200 break-words">${questionHtml}</div>
                    ${tagsHtml ? `<div class="mt-1">${tagsHtml}</div>` : ''}
                </div>
            </div>
            <div class="mt-4 space-y-3">
                ${!answer.isCorrect ? `
                    <div class="flex items-start gap-3 p-3 rounded-md bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700/60">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>
                        <div>
                            <p class="text-sm font-medium text-red-800 dark:text-red-300">คำตอบของคุณ</p>
                            <p class="text-red-700 dark:text-red-400 font-mono break-words whitespace-pre-wrap">${answer.selectedAnswer || ""}</p>
                        </div>
                    </div>
                ` : ''}
                <div class="flex items-start gap-3 p-3 rounded-md bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700/60">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-green-500 dark:text-green-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                    <div>
                        <p class="text-sm font-medium text-green-800 dark:text-green-300">คำตอบที่ถูกต้อง</p>
                        <p class="text-green-700 dark:text-green-400 font-mono break-words whitespace-pre-wrap">${answer.correctAnswer || ""}</p>
                    </div>
                </div>
            </div>
            ${explanationHtml ? `
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-blue-500 dark:text-blue-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" /></svg>
                    <div>
                        <p class="text-sm font-medium text-blue-800 dark:text-blue-300">คำอธิบาย</p>
                        <p class="text-gray-600 dark:text-gray-400 mt-1 break-words">${explanationHtml}</p>
                    </div>
                </div>
            </div>` : ""}
        `;
        elements.reviewContainer.appendChild(reviewItem);
      });

      renderMath(elements.reviewContainer);
  }

  function backToResult() {
    switchScreen(elements.resultScreen);
  }

  // --- State Management (LocalStorage) ---

  function loadStateFromSave(savedState) {
    state.currentQuestionIndex = savedState.currentQuestionIndex || 0;
    state.score = savedState.score || 0;
    // Filter the loaded questions to ensure data integrity, in case the saved state is from an older version or has corrupt data.
    state.shuffledQuestions = Array.isArray(savedState.shuffledQuestions)
      ? savedState.shuffledQuestions.filter(q => q)
      : [];
    state.userAnswers = savedState.userAnswers || [];
    state.timerMode = savedState.timerMode || "none";
    state.timeLeft = savedState.timeLeft || 0;
    state.initialTime = savedState.initialTime || 0;
    state.totalTimeSpent = savedState.totalTimeSpent || 0; // Load accumulated time

    // Update the score display on the UI to reflect the loaded score.
    elements.scoreCounter.textContent = `คะแนน: ${state.score}`;
  }

  function saveQuizState() {
    // Only save the necessary parts of the state to avoid saving large objects like audio elements
    // --- Update total time spent before saving ---
    if (state.sessionStartTime) {
      const sessionDurationInSeconds = (Date.now() - state.sessionStartTime) / 1000;
      // Ensure totalTimeSpent is a number before adding to it
      state.totalTimeSpent = (state.totalTimeSpent || 0) + sessionDurationInSeconds;
      state.sessionStartTime = Date.now(); // Reset session start time for the next interval
    }

    // This is more explicit and safer than spreading the whole state object.
    const stateToSave = {
      currentQuestionIndex: state.currentQuestionIndex,
      score: state.score,
      shuffledQuestions: state.shuffledQuestions,
      userAnswers: state.userAnswers,
      timerMode: state.timerMode,
      timeLeft: state.timeLeft,
      initialTime: state.initialTime,
      totalTimeSpent: state.totalTimeSpent,
      lastAttemptTimestamp: Date.now(), // Add timestamp for recency tracking
    };
    try {
      localStorage.setItem(state.storageKey, JSON.stringify(stateToSave));
    } catch (e) {
      console.error("Error saving quiz state to local storage:", e);
    }
  }

  function clearSavedState() {
    localStorage.removeItem(state.storageKey);
  }

  function resumeQuiz(savedState) {
    loadStateFromSave(savedState);
    setFloatingNav(true); // Activate the floating navigation bar for the resumed session
    state.sessionStartTime = Date.now(); // Start tracking time for the new session

    switchScreen(elements.quizScreen);
    showQuestion();

    // If resuming a quiz with an overall timer, restart the countdown
    if (state.timerMode === "overall" && state.timeLeft > 0) {
      startTimer();
    }
  }

  function checkForSavedQuiz() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get("action");
    const savedStateJSON = localStorage.getItem(state.storageKey);

    // Case 1: Viewing results directly. This has the highest priority.
    if (action === 'view_results' && savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            // Validate state before using it
            if (typeof savedState.currentQuestionIndex === 'number' && Array.isArray(savedState.shuffledQuestions)) {
                loadStateFromSave(savedState);
                showResults(); // This will also call switchScreen to the result screen
                return; // Done.
            }
        } catch (e) {
            console.error("Error parsing saved state for viewing results:", e);
            clearSavedState();
            // Fall through to show start screen on error
        }
    }

    // Case 2: Resuming a quiz in progress.
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            if (typeof savedState.currentQuestionIndex === 'number' && Array.isArray(savedState.shuffledQuestions)) {
                // There is valid progress, show the start screen and then the resume prompt.
                switchScreen(elements.startScreen);
                if (elements.resumeModal && resumeModalHandler) {
                    resumeModalHandler.open();
                    elements.resumeRejectBtn.onclick = () => {
                        clearSavedState();
                    };
                    elements.resumeConfirmBtn.onclick = () => {
                        resumeQuiz(savedState);
                        resumeModalHandler.close();
                    };
                }
                return; // Done.
            } else {
                // Invalid state found, clear it.
                clearSavedState();
            }
        } catch (e) {
            console.error("Error parsing saved quiz state for resume:", e);
            clearSavedState();
        }
    }

    // Case 3: Default case - no valid saved state or not resuming. Show the start screen.
    switchScreen(elements.startScreen);
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
      // Use custom time if provided, otherwise use default
      state.timeLeft = (state.customTime && state.customTime > 0)
        ? state.customTime
        : config.timerDefaults.perQuestion;
      state.initialTime = state.timeLeft;
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
      const isMultiSelect = currentQuestion.type === 'multiple-select';

      // Handle multi-select timeout
      if (isMultiSelect) {
          const correctAnswers = (currentQuestion.answer || []).map(a => String(a).trim());
          state.userAnswers[state.currentQuestionIndex] = {
              question: currentQuestion.question,
              selectedAnswer: [], // Record as empty selection
              correctAnswer: correctAnswers,
              isCorrect: false,
              explanation: currentQuestion.explanation,
          };
          saveQuizState();
          showFeedback(false, "หมดเวลา! " + (currentQuestion.explanation || ""), correctAnswers);
          Array.from(elements.options.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.disabled = true);
          elements.nextBtn.textContent = 'ข้อต่อไป';
          elements.nextBtn.classList.remove('hidden');
          return; // End here for multi-select
      }

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
    // The main action button now has a central handler.
    elements.nextBtn.addEventListener("click", handleNextButtonClick);

    // Keep other listeners as they are.
    elements.startBtn.addEventListener("click", startQuiz);
    elements.prevBtn.addEventListener("click", showPreviousQuestion);    
    elements.restartBtn.addEventListener("click", startQuiz);
    elements.reviewBtn.addEventListener("click", showReview);
    elements.backToResultBtn.addEventListener("click", backToResult);
    if (elements.soundToggleBtn) {
      elements.soundToggleBtn.addEventListener("click", toggleSound);
    }
  }
