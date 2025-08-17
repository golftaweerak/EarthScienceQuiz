document.addEventListener("DOMContentLoaded", () => {
  // --- 0. Initialize Modals and Cache Elements ---

  // Use the new ModalHandler for accessible, reusable modals.
  const confirmModal = new ModalHandler("confirm-action-modal");
  const completedModal = new ModalHandler("completed-quiz-modal");
  const customQuizModal = new ModalHandler("custom-quiz-modal");
  const customQuizHubModal = new ModalHandler("custom-quiz-hub-modal");

  // Cache buttons that trigger actions other than just closing the modal.
  const confirmActionBtn = document.getElementById("confirm-action-btn");
  const viewResultsBtn = document.getElementById("completed-view-results-btn");
  const startOverBtn = document.getElementById("completed-start-over-btn");
  // Cache modal text elements for dynamic content
  const confirmModalTitle = document.getElementById("confirm-modal-title");
  const confirmModalDesc = document.getElementById("confirm-modal-description");

  // Cancel buttons are now handled automatically by the ModalHandler via the `data-modal-close` attribute.

  // State variables to hold context for the active modal.
  let activeQuizUrl = ""; // To store the quiz URL for the 'completed' modal actions.
  let activeStorageKey = ""; // To store the storage key for the modal actions
  let confirmCallback = null; // To store the action to perform on confirmation

  // --- Custom Quiz Creation ---
  let allQuestionsCache = null; // Cache for all quiz questions
  let questionsBySubCategory = {}; // Cache for questions sorted by sub-category { Astronomy: [], Geology: [], ... }

  // This function is adapted from preview.js. For a larger project,
  // this would be moved to a shared utility module.
  async function fetchAllQuizData() {
    // If cache is populated, return it immediately.
    if (allQuestionsCache && Object.keys(questionsBySubCategory).length > 0) {
      return {
        allQuestions: allQuestionsCache,
        byCategory: questionsBySubCategory,
      };
    }

    const promises = quizList.map(async (quiz) => {
      const scriptPath = `./data/${quiz.id}-data.js`;
      try {
        const response = await fetch(scriptPath);
        if (!response.ok) return [];
        const scriptText = await response.text();
        // This is a safe way to execute the script text and get the data variable.
        const data = new Function(
          `${scriptText}; if (typeof quizData !== 'undefined') return quizData; if (typeof quizItems !== 'undefined') return quizItems; return undefined;`
        )();

        if (data && Array.isArray(data)) {
          // Flatten scenarios into individual questions, prepending the scenario context.
          // Also, ensure each question has a subCategory property.
          const processedData = data.flatMap((item) => {
            if (item.type === "scenario" && Array.isArray(item.questions)) {
              return item.questions.map((q) => ({
                ...q,
                question: `<div class="p-4 mb-4 bg-gray-100 dark:bg-gray-800 border-l-4 border-blue-500 rounded-r-lg"><p class="font-bold text-lg">${
                  item.title
                }</p><p class="mt-2 text-gray-700 dark:text-gray-300">${item.description.replace(
                  /\n/g,
                  "<br>"
                )}</p></div>${q.question}`,
                // Prioritize subCategory from question, then scenario.
                subCategory: q.subCategory || item.subCategory,
              }));
            }
            // Standalone question
            return { ...item, subCategory: item.subCategory };
          });
          // Return all processed questions, including those without a subCategory
          return processedData;
        }
        return [];
      } catch (error) {
        console.error(`Error fetching or processing ${scriptPath}:`, error);
        return [];
      }
    });

    const results = await Promise.all(promises);
    allQuestionsCache = results.flat();

    // Group questions by sub-category
    questionsBySubCategory = allQuestionsCache.reduce((acc, question) => {
      const category = question.subCategory;
      // Only group questions that have a defined subCategory.
      if (category) {
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(question);
      }
      return acc;
    }, {});

    return {
      allQuestions: allQuestionsCache,
      byCategory: questionsBySubCategory,
    };
  }

  // --- Helper Functions for Progress Display ---

  /**
   * Retrieves the progress state of a quiz from localStorage.
   * @param {string} storageKey - The key for the quiz in localStorage.
   * @param {number} totalQuestions - The total number of questions in the quiz.
   * @returns {object} An object containing progress details.
   */
  function getQuizProgress(storageKey, totalQuestions) {
    const defaultState = {
      percentage: 0,
      progressText: "ยังไม่เริ่ม",
      progressTextColor: "text-gray-500 dark:text-gray-400",
      progressBarColor: "bg-gray-300 dark:bg-gray-600",
      progressDetails: `0/${totalQuestions} ข้อ`,
      isFinished: false,
      hasProgress: false,
    };

    if (totalQuestions <= 0) {
      return { ...defaultState, noQuestions: true };
    }

    try {
      const savedStateJSON = localStorage.getItem(storageKey);
      if (!savedStateJSON) return defaultState;

      const savedState = JSON.parse(savedStateJSON);
      if (!savedState || typeof savedState.currentQuestionIndex !== "number")
        return defaultState;

      const answeredCount = savedState.currentQuestionIndex;
      const score = savedState.score || 0;
      const isFinished = answeredCount >= totalQuestions;
      const percentage = Math.round((answeredCount / totalQuestions) * 100);

      if (isFinished) {
        return {
          score,
          percentage,
          progressText: "ทำเสร็จแล้ว!",
          progressTextColor: "text-green-600 dark:text-green-400",
          progressBarColor: "bg-green-500",
          progressDetails: `คะแนน: ${score}/${totalQuestions}`,
          isFinished: true,
          hasProgress: true,
        };
      } else {
        return {
          score,
          percentage,
          progressText: "ความคืบหน้า",
          progressTextColor: "text-blue-600 dark:text-blue-400",
          progressBarColor: "bg-blue-500",
          progressDetails: `คะแนน: ${score} | ${answeredCount}/${totalQuestions} ข้อ`,
          isFinished: false,
          hasProgress: true,
        };
      }
    } catch (e) {
      console.error(`Could not parse saved state for ${storageKey}:`, e);
      return defaultState;
    }
  }

  /**
   * Creates the HTML for the progress bar section of a quiz card.
   * @param {object} progress - The progress object from getQuizProgress.
   * @param {string} storageKey - The localStorage key for the quiz.
   * @returns {string} The HTML string for the progress section.
   */
  function createProgressHTML(progress, storageKey) {
    if (progress.noQuestions) return "";

    const resetButtonHTML = progress.hasProgress
      ? `
            <button data-storage-key="${storageKey}" class="reset-progress-btn text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200 inline-flex items-center font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                ล้างข้อมูล
            </button>`
      : "";

    return `<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/80"><div class="flex justify-between items-center mb-1 font-medium"><span class="text-sm ${progress.progressTextColor}">${progress.progressText}</span><span class="text-sm text-gray-500 dark:text-gray-400">${progress.percentage}%</span></div><div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden"><div class="${progress.progressBarColor} h-2.5 rounded-full transition-all duration-500" style="width: ${progress.percentage}%"></div></div><div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1"><span>${progress.progressDetails}</span>${resetButtonHTML}</div></div>`;
  }

  // --- 1. Define Category Details for display ---
  const categoryDetails = {
    AstronomyReview: {
      title: "ทบทวน (Review)",
      icon: "./assets/icons/study.png",
      order: 1,
      color: "border-sky-500", // A bright, academic blue
    },
    Astronomy: {
      title: "ดาราศาสตร์ (Astronomy)",
      icon: "./assets/icons/astronomy.png",
      order: 2,
      color: "border-indigo-500", // A deep, space-like indigo
    },
    EarthScience: {
      title: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)",
      icon: "./assets/icons/earth.png",
      order: 3,
      color: "border-teal-500", // A rich, natural teal
    },
    // You can add more categories here in the future
  };

  // Map border colors to their corresponding shadow colors for the hover effect
  const shadowColorMap = {
    "border-sky-500": "hover:shadow-sky-500/40",
    "border-indigo-500": "hover:shadow-indigo-500/40",
    "border-teal-500": "hover:shadow-teal-500/40",
  };

  // --- 2. Group Quizzes by Category ---
  const groupedQuizzes = quizList.reduce((acc, quiz) => {
    const category = quiz.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(quiz);
    return acc;
  }, {});

  // --- 3. Get Container and Generate HTML ---
  const container = document.getElementById("quiz-categories-container");
  if (!container) {
    console.error("Category container not found!");
    return;
  }
  container.innerHTML = ""; // Clear any existing content or placeholders

  // Sort categories based on the 'order' property for consistent display
  const sortedCategories = Object.keys(groupedQuizzes).sort((a, b) => {
    const orderA = categoryDetails[a]?.order || 99;
    const orderB = categoryDetails[b]?.order || 99;
    return orderA - orderB;
  });

  // --- 4. Create and Append Category Sections ---
  sortedCategories.forEach((categoryKey) => {
    const quizzes = groupedQuizzes[categoryKey];
    const details = categoryDetails[categoryKey];

    if (!details) {
      console.warn(
        `Details for category "${categoryKey}" not found. Skipping.`
      );
      return;
    }

    const section = document.createElement("section");
    // Add an ID for anchor linking from the header buttons
    section.id = `category-${categoryKey}`;
    section.className =
      "section-accordion bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden";

    const toggleHeader = document.createElement("div");
    toggleHeader.className =
      "section-toggle flex justify-between items-center cursor-pointer p-4";
    const sectionBorderColor = details.color || "border-blue-600"; // Use category color
    toggleHeader.innerHTML = `
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center font-kanit">
                <div class="section-icon-container flex-shrink-0 h-12 w-12 mr-3 rounded-full flex items-center justify-center border-4 ${sectionBorderColor} bg-white dark:bg-white transition-all duration-300">
                    <img src="${details.icon}" alt="${details.title} Icon" class="h-8 w-8">
                </div>
                ${details.title}
            </h2>
            <svg class="chevron-icon h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
        `;

    const contentDiv = document.createElement("div");
    // This is the collapsible part
    contentDiv.className =
      "section-content grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out";

    const innerContentWrapper = document.createElement("div");
    innerContentWrapper.className = "overflow-hidden";

    const quizGrid = document.createElement("div");
    quizGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-6 p-4";

    // --- 5. Create and Append Quiz Cards ---
    quizzes.forEach((quiz, index) => {
      const card = document.createElement("a");
      card.href = quiz.url;
      // Use the color from the category for consistency, with a fallback.
      const borderColorClass =
        categoryDetails[quiz.category]?.color || "border-gray-400";
      // Get the corresponding colored shadow class for the hover effect
      const shadowClass =
        shadowColorMap[borderColorClass] || "hover:shadow-gray-400/30";

      // Restore the essential class definitions for the card's appearance and effects.
      // Added a subtle background color (bg-gray-50) and a border in light mode to make cards stand out from the background.
      card.className = `quiz-card group flex flex-col h-full bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700/50 transition-all duration-300 transform hover:-translate-y-1 fade-in-up ${shadowClass}`;

      card.style.animationDelay = `${index * 75}ms`; // Staggered animation delay

      // --- Progress Bar Logic (Refactored) ---
      // Use the helper functions to get progress state and generate HTML.
      const totalQuestions = parseInt(quiz.amount, 10) || 0;
      const progress = getQuizProgress(quiz.storageKey, totalQuestions);
      const progressHTML = createProgressHTML(progress, quiz.storageKey);

      // Polished Layout: Added group-hover effects for icon and title, and a colored shadow.
      card.innerHTML = `
                <!-- Main content area (grows to fill space) -->
                <div class="flex-grow flex items-start gap-4">
                    <!-- Left side: Icon container -->
                    <div class="flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center border-4 ${borderColorClass} transition-colors duration-300 dark:bg-white">
                        <img src="${quiz.icon}" alt="${quiz.altText}" class="h-9 w-9 transition-transform duration-300 group-hover:scale-110">
                    </div>

                    <!-- Right side: Text content -->
                    <div class="flex-grow">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white font-kanit leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">${quiz.title}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${quiz.amount}</p>
                        <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-2">${quiz.description}</p>
                    </div>
                </div>

                <!-- Footer with progress bar (spans full width) -->
                <div class="progress-footer-wrapper">
                    ${progressHTML}
                </div>
            `;
      quizGrid.appendChild(card);

      // --- NEW: Add event listener to the card itself ---
      card.addEventListener("click", (event) => {
        // BUG FIX: Re-check the status on click to ensure it's up-to-date,
        // especially after a user resets progress without reloading the page.
        const currentProgress = getQuizProgress(
          quiz.storageKey,
          totalQuestions
        );

        if (currentProgress.isFinished) {
          // If the quiz is completed, prevent default navigation and show the modal
          event.preventDefault();
          activeQuizUrl = quiz.url;
          activeStorageKey = quiz.storageKey;
          completedModal.open(event.currentTarget); // Open modal and pass the card as the trigger for focus restoration.
        }
        // Otherwise, the default 'a' tag behavior (navigation) will proceed.
      });

      // --- New: Add event listener for the reset button ---
      const resetButton = card.querySelector(".reset-progress-btn");
      if (resetButton) {
        resetButton.addEventListener("click", (event) => {
          // Prevent the card's link from being followed
          event.preventDefault();
          event.stopPropagation();

          const key = event.currentTarget.dataset.storageKey;

          // Define what happens on confirmation
          const onConfirm = () => {
            localStorage.removeItem(key);

            // Instead of removing the progress section, we'll update it to the "Not Started" state.
            // REFACTOR: Reuse helper functions to generate the new "Not Started" state HTML.
            const progressWrapper = card.querySelector(
              ".progress-footer-wrapper"
            );
            if (!progressWrapper) return;

            const totalQuestions = parseInt(quiz.amount, 10) || 0;
            const newProgress = getQuizProgress(key, totalQuestions); // This will be the default state
            const newProgressHTML = createProgressHTML(newProgress, key);

            // Animate out, update content, and animate in for a smooth transition.
            progressWrapper.style.transition = "opacity 0.2s ease-out";
            progressWrapper.style.opacity = "0";

            setTimeout(() => {
              progressWrapper.innerHTML = newProgressHTML;
              progressWrapper.style.transition = "opacity 0.3s ease-in";
              progressWrapper.style.opacity = "1";
            }, 200); // Wait for the fade-out to complete.
          };

          // Show the generic confirmation modal
          const title = "ยืนยันการล้างข้อมูล";
          const description =
            'คุณแน่ใจหรือไม่ว่าต้องการล้างความคืบหน้าของแบบทดสอบนี้?<br><strong class="text-red-600 dark:text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>';
          showConfirmModal(title, description, onConfirm, event.currentTarget);
        });
      }
    });

    innerContentWrapper.appendChild(quizGrid);
    contentDiv.appendChild(innerContentWrapper);
    section.appendChild(toggleHeader);
    section.appendChild(contentDiv);
    container.appendChild(section);
  });

  /**
   * Populates the main navigation dropdown menu with a list of all available quizzes,
   * grouped by category, for quick access.
   */
  function populateMenuWithQuizzes() {
    const menuQuizListContainer = document.getElementById("menu-quiz-list");
    if (!menuQuizListContainer) return;

    let menuHTML = "";

    // Use the same sorted categories as the main page for consistency.
    sortedCategories.forEach((categoryKey) => {
      const quizzes = groupedQuizzes[categoryKey];
      const details = categoryDetails[categoryKey];

      if (!details || !quizzes || quizzes.length === 0) {
        return;
      }

      // Add a non-clickable category header to the menu.
      menuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">${details.title}</h4>`;

      // Add each quiz as a link.
      quizzes.forEach((quiz) => {
        const totalQuestions = parseInt(quiz.amount, 10) || 0;
        const progress = getQuizProgress(quiz.storageKey, totalQuestions);

        // Determine vertical alignment: center if finished, top-align otherwise.
        const alignmentClass = progress.hasProgress ? 'items-center' : 'items-start';

        // Create text for score and percentage if there's progress.
        const progressDetailsHTML = progress.hasProgress
          ? `<div>
                <span class="text-xs font-medium ${progress.progressTextColor}">คะแนน: ${progress.score}/${totalQuestions} (${progress.percentage}%)</span>
             </div>`
          : "";

        menuHTML += `
          <a href="${quiz.url}" data-storage-key="${quiz.storageKey}" data-total-questions="${totalQuestions}" class="quiz-menu-item block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <div class="flex ${alignmentClass} gap-3">
                  <div class="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-white">
                      <img src="${quiz.icon}" alt="${quiz.title} icon" class="h-4 w-4">
                  </div>
                  <div class="min-w-0">
                      <span>${quiz.title}</span>
                      ${progressDetailsHTML}
                  </div>
              </div>
          </a>
        `;
      });
    });

    menuQuizListContainer.innerHTML = menuHTML;
  }

  /**
   * Populates the main navigation dropdown menu with a list of saved custom quizzes
   * from localStorage for quick access.
   */
  function populateMenuWithCustomQuizzes() {
    const menuQuizListContainer = document.getElementById("menu-quiz-list");
    if (!menuQuizListContainer) return;

    const savedQuizzesJSON = localStorage.getItem("customQuizzesList");
    const savedQuizzes = savedQuizzesJSON ? JSON.parse(savedQuizzesJSON) : [];

    if (savedQuizzes.length === 0) {
      return; // No custom quizzes to show.
    }

    let customMenuHTML = "";

    // Add a separator and a header for the custom quizzes section.
    customMenuHTML += `<hr class="my-2 border-gray-200 dark:border-gray-600">`;
    customMenuHTML += `<h4 class="px-4 pt-2 pb-1 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">แบบทดสอบที่สร้างเอง</h4>`;

    savedQuizzes.forEach((quiz) => {
      const totalQuestions = quiz.questions.length;
      const progress = getQuizProgress(quiz.storageKey, totalQuestions);

      // Determine vertical alignment: center if finished, top-align otherwise.
      const alignmentClass = progress.hasProgress ? 'items-center' : 'items-start';

      const progressDetailsHTML = progress.hasProgress
        ? `<div>
                <span class="text-xs font-medium ${progress.progressTextColor}">คะแนน: ${progress.score}/${totalQuestions} (${progress.percentage}%)</span>
             </div>`
        : "";

      customMenuHTML += `
          <a href="./quiz/index.html?id=${quiz.customId}" data-storage-key="${quiz.storageKey}" data-total-questions="${totalQuestions}" class="quiz-menu-item block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <div class="flex ${alignmentClass} gap-3">
                  <div class="h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-white">
                      <img src="./assets/icons/study.png" alt="ไอคอนแบบทดสอบที่สร้างเอง" class="h-4 w-4">
                  </div>
                  <div class="min-w-0">
                      <span>${quiz.title}</span>
                      ${progressDetailsHTML}
                  </div>
              </div>
          </a>
        `;
    });

    // Append this HTML to the existing menu content.
    menuQuizListContainer.innerHTML += customMenuHTML;
  }

  // Populate the main menu with the quiz list for easy navigation.
  populateMenuWithQuizzes();
  populateMenuWithCustomQuizzes();

  // Add event listener for the main menu to handle clicks on completed quizzes.
  // This uses event delegation, which is efficient and works for dynamically added content.
  const menuQuizListContainerForEvents = document.getElementById("menu-quiz-list");
  if (menuQuizListContainerForEvents) {
    menuQuizListContainerForEvents.addEventListener('click', (event) => {
        // Find the link that was clicked, even if a child element was the target.
        const quizLink = event.target.closest('.quiz-menu-item');

        // If the click wasn't on a quiz item, do nothing.
        if (!quizLink) {
            return;
        }

        const storageKey = quizLink.dataset.storageKey;
        const totalQuestions = parseInt(quizLink.dataset.totalQuestions, 10) || 0;

        // If the link is missing necessary data, let it navigate normally.
        if (!storageKey || totalQuestions === 0) {
            return;
        }

        const progress = getQuizProgress(storageKey, totalQuestions);

        // If the quiz is finished, prevent navigation and show the "Completed" modal.
        if (progress.isFinished) {
            event.preventDefault();
            activeQuizUrl = quizLink.href;
            activeStorageKey = storageKey;
            completedModal.open(quizLink); // Pass the link for focus restoration.
        }
    });
  }

  // --- 6. Accordion Functionality ---
  const toggleAccordion = (toggleElement, forceState) => {
    // forceState can be 'open', 'close', or undefined (toggle)
    const content = toggleElement.nextElementSibling;
    const icon = toggleElement.querySelector(".chevron-icon");
    const iconContainer = toggleElement.querySelector(
      ".section-icon-container"
    );
    if (!content || !icon) return;

    const isCollapsed = content.classList.contains("grid-rows-[0fr]");

    let shouldBeOpen;
    if (forceState === "open") {
      shouldBeOpen = true;
    } else if (forceState === "close") {
      shouldBeOpen = false;
    } else {
      shouldBeOpen = isCollapsed; // Toggle
    }

    // If the state is already what we want it to be, do nothing.
    if (shouldBeOpen === !isCollapsed) {
      return;
    }

    content.classList.toggle("grid-rows-[1fr]", shouldBeOpen);
    content.classList.toggle("grid-rows-[0fr]", !shouldBeOpen);

    icon.classList.toggle("rotate-180", shouldBeOpen);

    if (iconContainer) {
      iconContainer.classList.toggle("scale-105", shouldBeOpen);
      iconContainer.classList.toggle("shadow-lg", shouldBeOpen);
    }
  };

  // Attach listener to the accordion headers themselves for toggling
  document.querySelectorAll(".section-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => toggleAccordion(toggle));
  });

  // Attach listeners to the main category buttons in the header to open the corresponding accordion
  document
    .querySelectorAll('header[aria-label="เลือกหมวดวิชา"] a')
    .forEach((button) => {
      button.addEventListener("click", (event) => {
        // Prevent the default anchor link behavior to handle it with JS for consistency.
        // This can resolve issues on some touch devices where both JS and default behavior conflict.
        event.preventDefault();

        const targetId = button.getAttribute("href").substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          // Manually scroll to the section. The `scroll-behavior: smooth` in CSS will handle the animation.
          targetSection.scrollIntoView({ behavior: "smooth", block: "start" });

          const toggleHeader = targetSection.querySelector(".section-toggle");
          if (toggleHeader) {
            // When clicking the header button, we want to ensure the section opens.
            toggleAccordion(toggleHeader, "open");
          }
        }
      });
    });

  // --- 7. Random Quiz Button Functionality ---
  const randomQuizBtn = document.getElementById("random-quiz-btn");
  if (randomQuizBtn) {
    randomQuizBtn.addEventListener("click", () => {
      if (quizList && quizList.length > 0) {
        const randomIndex = Math.floor(Math.random() * quizList.length);
        const randomQuizUrl = quizList[randomIndex].url;
        window.location.href = randomQuizUrl;
      }
    });
  }

  // --- 9. Custom Quiz Creation Functionality ---
  const createCustomQuizBtn = document.getElementById("create-custom-quiz-btn");
  const customQuizStartBtn = document.getElementById("custom-quiz-start-btn");
  const categorySelectionContainer = document.getElementById(
    "custom-quiz-category-selection"
  );
  const totalQuestionCountDisplay = document.getElementById(
    "total-question-count"
  );
  const openCreateQuizModalBtn = document.getElementById(
    "open-create-quiz-modal-btn"
  );
  const customQuizListContainer = document.getElementById("custom-quiz-list");
  const noCustomQuizzesMsg = document.getElementById("no-custom-quizzes-msg");

  /**
   * Deletes a specific custom quiz and its associated progress.
   * @param {string} customId The unique ID of the quiz to delete.
   */
  function deleteCustomQuiz(customId) {
    const savedQuizzesJSON = localStorage.getItem("customQuizzesList");
    let savedQuizzes = savedQuizzesJSON ? JSON.parse(savedQuizzesJSON) : [];

    const quizToDelete = savedQuizzes.find((q) => q.customId === customId);
    if (quizToDelete && quizToDelete.storageKey) {
      // Also remove the progress data for this quiz
      localStorage.removeItem(quizToDelete.storageKey);
    }

    // Filter out the deleted quiz
    const updatedQuizzes = savedQuizzes.filter((q) => q.customId !== customId);

    // Save the updated list back to localStorage
    localStorage.setItem("customQuizzesList", JSON.stringify(updatedQuizzes));

    // Re-render the list in the hub
    renderCustomQuizList();
  }

  /**
   * Renders the list of saved custom quizzes in the hub modal.
   */
  function renderCustomQuizList() {
    const savedQuizzesJSON = localStorage.getItem("customQuizzesList");
    const savedQuizzes = savedQuizzesJSON ? JSON.parse(savedQuizzesJSON) : [];

    if (savedQuizzes.length === 0) {
      customQuizListContainer.innerHTML = ""; // Clear any old list items
      noCustomQuizzesMsg.classList.remove("hidden");
      return;
    }

    noCustomQuizzesMsg.classList.add("hidden");
    customQuizListContainer.innerHTML = ""; // Clear before rendering

    savedQuizzes.forEach((quiz) => {
      const quizItemEl = document.createElement("div");
      quizItemEl.className =
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600";

      const progress = getQuizProgress(quiz.storageKey, quiz.questions.length);
      let progressText = "";
      if (progress.isFinished) {
        progressText = `<span class="text-xs font-medium text-green-600 dark:text-green-400">ทำเสร็จแล้ว (${progress.progressDetails})</span>`;
      } else if (progress.hasProgress) {
        progressText = `<span class="text-xs font-medium text-blue-600 dark:text-blue-400">ทำต่อ (${progress.progressDetails})</span>`;
      }

      quizItemEl.innerHTML = `
                <div class="flex-grow">
                    <p class="font-bold text-gray-800 dark:text-gray-100">${
                      quiz.title
                    }</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${
                      quiz.description
                    }</p>
                    ${
                      progressText
                        ? `<div class="mt-1">${progressText}</div>`
                        : ""
                    }
                </div>
                <div class="flex-shrink-0 flex items-center gap-2">
                    <a href="./quiz/index.html?id=${
                      quiz.customId
                    }" class="start-custom-quiz-btn px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-bold transition">
                        ${progress.hasProgress ? "ทำต่อ" : "เริ่มทำ"}
                    </a>
                    <button data-quiz-id="${
                      quiz.customId
                    }" aria-label="ลบแบบทดสอบ" class="delete-custom-quiz-btn p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 rounded-full transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            `;
      customQuizListContainer.appendChild(quizItemEl);
    });

    // Add event listeners to the newly created delete buttons.
    // This direct binding is more robust in this case than event delegation.
    customQuizListContainer
      .querySelectorAll(".delete-custom-quiz-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation(); // Prevent any other click events from firing.
          const customId = e.currentTarget.dataset.quizId;
          // Use the generic confirmation modal
          const onConfirmDelete = () => deleteCustomQuiz(customId);
          const title = "ยืนยันการลบ";
          const description =
            'คุณแน่ใจหรือไม่ว่าต้องการลบแบบทดสอบนี้? <br><strong class="text-red-600 dark:text-red-500">ข้อมูลความคืบหน้าจะถูกลบไปด้วย และไม่สามารถย้อนกลับได้</strong>';
          showConfirmModal(
            title,
            description,
            onConfirmDelete,
            e.currentTarget
          );
        });
      });
  }

  // --- NEW: Centralized logic for Custom Quiz UI generation and handling ---

  // Define metadata for categories to be displayed in the custom quiz modal.
  // This makes it easy to add/remove/change categories in one place.
  const customCategoryMeta = {
    Astronomy: {
      displayName: "ดาราศาสตร์",
      icon: "./assets/icons/astronomy.png",
    },
    Geology: {
      displayName: "ธรณีวิทยา",
      icon: "./assets/icons/geology.png",
    },
    Meteorology: {
      displayName: "อุตุนิยมวิทยา",
      icon: "./assets/icons/meteorology.png",
    },
    General: {
      displayName: "สุ่มจากทุกหมวดหมู่",
      icon: "./assets/icons/study.png",
    },
  };

  /**
   * Creates the HTML string for a single category's controls (slider and input).
   * @param {string} category - The internal category name (e.g., "Astronomy").
   * @param {string} displayName - The user-facing name (e.g., "ดาราศาสตร์").
   * @param {string} iconSrc - The path to the category's icon.
   * @param {number} maxCount - The maximum number of questions available.
   * @returns {string} The HTML for the control.
   */
  function createCategoryControlHTML(
    category,
    displayName,
    iconSrc,
    maxCount
  ) {
    return `
      <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 ${
        maxCount === 0 ? "opacity-50 cursor-not-allowed" : ""
      }">
          <label for="count-slider-${category}" class="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-3 ${
            maxCount === 0 ? "cursor-not-allowed" : ""
          }">
              <div class="flex-shrink-0 h-8 w-8 rounded-full bg-white flex items-center justify-center">
                  <img src="${iconSrc}" alt="ไอคอน${displayName}" class="h-5 w-5">
              </div>
              <span>
                  ${displayName}:
                  <span data-value-display="${category}" class="font-sarabun text-blue-600 dark:text-blue-400">0</span> /
                  <span data-max-display="${category}" class="font-sarabun">${maxCount}</span> ข้อ
              </span>
          </label>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-2">
              <input data-slider="${category}" id="count-slider-${category}" type="range" min="0" max="${maxCount}" value="0"
                  class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" ${
                    maxCount === 0 ? "disabled" : ""
                  }>
              <input data-input="${category}" id="count-input-${category}" type="number" min="0" max="${maxCount}" value="0"
                  class="w-full sm:w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-center text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500" ${
                    maxCount === 0 ? "disabled" : ""
                  }>
          </div>
      </div>
    `;
  }

  /**
   * Attaches event listeners to all sliders and inputs in the custom quiz modal.
   * This should be called after the controls are dynamically created.
   */
  function setupCustomQuizInputListeners() {
    Object.keys(customCategoryMeta).forEach((category) => {
      const slider = document.querySelector(`[data-slider="${category}"]`);
      const input = document.querySelector(`[data-input="${category}"]`);

      if (slider) {
        slider.addEventListener("input", (e) => {
          const value = e.target.value;
          const currentCategory = e.target.dataset.slider;
          if (input) input.value = value;
          updateCategoryCount(currentCategory, value);

          updateTotalCount();
        });
      }

      if (input) {
        input.addEventListener("input", (e) => {
          handleNumberInputChange(e.target); // Clamp value if it exceeds max

          const value = e.target.value;
          const currentCategory = e.target.dataset.input;
          const slider = document.querySelector(
            `[data-slider="${currentCategory}"]`
          );

          // If the input is empty, treat it as 0 for the slider and display
          const displayValue = value === "" ? 0 : value;

          if (slider) slider.value = displayValue;
          updateCategoryCount(currentCategory, displayValue);

          updateTotalCount();
        });
      }
    });
  }

  // The main "Create Custom Quiz" button now opens the Hub modal
  if (createCustomQuizBtn && customQuizHubModal.modal) {
    createCustomQuizBtn.addEventListener("click", (e) => {
      renderCustomQuizList();
      customQuizHubModal.open(e.currentTarget);
    });
  }

  // The button inside the Hub opens the Creation modal
  if (openCreateQuizModalBtn && customQuizModal.modal) {
    openCreateQuizModalBtn.addEventListener("click", async (e) => {
      const originalText = openCreateQuizModalBtn.innerHTML;
      openCreateQuizModalBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังโหลด...
            `;
      openCreateQuizModalBtn.disabled = true;

      try {
        const { byCategory } = await fetchAllQuizData();

        // --- REFACTORED: Dynamically populate the category controls ---
        categorySelectionContainer.innerHTML = ""; // Clear any previous content

        // Generate controls for specific categories found in the data
        Object.keys(customCategoryMeta).forEach((category) => {
          // Skip "General" for now, we'll add it last.
          if (category === "General") return;

          const meta = customCategoryMeta[category];
          // Always show the category, even if it has no questions, to inform the user.
          if (meta) {
            const questions = byCategory[category] || []; // Default to empty array
            const maxCount = questions.length;
            const controlHTML = createCategoryControlHTML(
              category,
              meta.displayName,
              meta.icon,
              maxCount
            );
            categorySelectionContainer.innerHTML += controlHTML;
          }
        });

        // Now, add the "General" category control with the total question count
        const { allQuestions } = await fetchAllQuizData();
        const generalMaxCount = allQuestions.length;
        const generalMeta = customCategoryMeta["General"];
        if (generalMeta) {
          const generalControlHTML = createCategoryControlHTML(
            "General",
            generalMeta.displayName,
            generalMeta.icon,
            generalMaxCount
          );
          categorySelectionContainer.innerHTML += generalControlHTML;
        }

        customQuizHubModal.close();
        customQuizModal.open(e.currentTarget);
      } catch (error) {
        console.error("Failed to prepare custom quiz modal:", error);
        alert("เกิดข้อผิดพลาดในการโหลดคลังข้อสอบ กรุณาลองใหม่อีกครั้ง");
      } finally {
        openCreateQuizModalBtn.innerHTML = originalText;
        openCreateQuizModalBtn.disabled = false;
        // Attach listeners to the newly created elements and update counts
        setupCustomQuizInputListeners();
        updateTotalCount();
      }
    });
  }

  /**
   * Updates the displayed value for a specific category.
   * @param {string} category - The category name (e.g., "Astronomy").
   * @param {string|number} value - The new value to display.
   */
  function updateCategoryCount(category, value) {
    const valueDisplay = document.querySelector(
      `[data-value-display="${category}"]`
    );
    if (valueDisplay) {
      valueDisplay.textContent = value;
    }
  }

  /**
   * Calculates and updates the total number of questions selected across all categories.
   */
  function updateTotalCount() {
    let total = 0;
    // Use the metadata object as the source of truth for categories
    Object.keys(customCategoryMeta).forEach((category) => {
      const input = document.querySelector(`[data-input="${category}"]`);
      if (input && input.value) {
        total += parseInt(input.value, 10) || 0;
      }
    });
    if (totalQuestionCountDisplay) {
      totalQuestionCountDisplay.textContent = total;
    }
  }

  /**
   * Handles changes to a number input, validates the value, and prevents illegal values.
   * @param {HTMLInputElement} inputEl The input element that triggered the event.
   */
  function handleNumberInputChange(inputEl) {
    // This function now only clamps the value if it exceeds max.
    // It allows the field to be temporarily empty for better UX while typing.
    const value = parseInt(inputEl.value, 10);
    const max = parseInt(inputEl.max, 10);

    if (!isNaN(value) && value > max) {
      inputEl.value = max;
    }
  }

  // Handle start button click from the creation modal
  customQuizStartBtn.addEventListener("click", () => {
    if (
      !allQuestionsCache ||
      Object.keys(questionsBySubCategory).length === 0
    ) {
      alert("เกิดข้อผิดพลาด: ไม่พบคลังข้อสอบ");
      return;
    }

    const specificCategories = ["Astronomy", "Geology", "Meteorology"];
    const allCategories = [...specificCategories, "General"];
    const requestedCounts = {};
    let totalCount = 0;

    allCategories.forEach((category) => {
      const input = document.querySelector(`[data-input="${category}"]`);
      if (input) {
        const count = parseInt(input.value, 10) || 0;
        requestedCounts[category] = count;
        totalCount += count;
      }
    });

    if (totalCount === 0) {
      alert("กรุณาเลือกจำนวนข้ออย่างน้อย 1 ข้อ");
      return;
    }

    // Use a Set to keep track of selected question objects to avoid duplicates
    const selectedQuestionObjects = new Set();
    let finalQuestions = [];

    // 1. Select questions from specific categories first.
    // This ensures the user gets the exact number of questions they want from each specific topic.
    specificCategories.forEach((category) => {
      const count = requestedCounts[category];
      if (count > 0 && questionsBySubCategory[category]) {
        const shuffled = [...questionsBySubCategory[category]].sort(
          () => 0.5 - Math.random()
        );
        let addedCount = 0;
        for (const q of shuffled) {
          if (addedCount >= count) break;
          if (!selectedQuestionObjects.has(q)) {
            finalQuestions.push(q);
            selectedQuestionObjects.add(q);
            addedCount++;
          }
        }
      }
    });

    // 2. Select questions for the "General" category from the remaining, unselected pool.
    // This prevents selecting the same question twice.
    const generalCount = requestedCounts["General"];
    if (generalCount > 0) {
      const remainingQuestions = allQuestionsCache.filter(
        (q) => !selectedQuestionObjects.has(q)
      );
      const shuffledRemaining = remainingQuestions.sort(
        () => 0.5 - Math.random()
      );
      finalQuestions.push(...shuffledRemaining.slice(0, generalCount));
    }

    // Shuffle the final combined list to mix categories
    for (let i = finalQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalQuestions[i], finalQuestions[j]] = [
        finalQuestions[j],
        finalQuestions[i],
      ];
    }
    const timerMode = document.querySelector(
      'input[name="custom-timer-mode"]:checked'
    ).value;

    const customId = `custom_${Date.now()}`;
    const newQuiz = {
      customId: customId,
      id: customId,
      title: `แบบทดสอบ #${customId.slice(-4)}`,
      description: `ชุดข้อสอบแบบกำหนดเองจำนวน ${finalQuestions.length} ข้อ`,
      storageKey: `quizState-${customId}`,
      questions: finalQuestions,
      timerMode: timerMode,
      amount: finalQuestions.length.toString(),
    };

    const savedQuizzesJSON = localStorage.getItem("customQuizzesList");
    let savedQuizzes = savedQuizzesJSON ? JSON.parse(savedQuizzesJSON) : [];
    savedQuizzes.push(newQuiz);
    localStorage.setItem("customQuizzesList", JSON.stringify(savedQuizzes));

    window.location.href = `./quiz/index.html?id=${customId}`;
  });

  // --- 8. Dynamic Copyright Year ---
  const yearSpan = document.getElementById("copyright-year");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- 10. Modal Action Logic ---

  // --- Completed Quiz Modal Actions ---
  if (viewResultsBtn) {
    viewResultsBtn.addEventListener("click", () => {
      if (activeQuizUrl) {
        const separator = activeQuizUrl.includes("?") ? "&" : "?";
        window.location.href = `${activeQuizUrl}${separator}action=view_results`;
      }
      completedModal.close();
    });
  }
  if (startOverBtn) {
    startOverBtn.addEventListener("click", () => {
      if (activeStorageKey) localStorage.removeItem(activeStorageKey);
      if (activeQuizUrl) window.location.href = activeQuizUrl;
      completedModal.close();
    });
  }

  /**
   * Shows a generic confirmation modal.
   * @param {string} title The title for the confirmation dialog.
   * @param {string} description The descriptive text for the dialog, can contain HTML.
   * @param {Function} onConfirm The callback function to execute if the user confirms.
   * @param {HTMLElement} triggerElement The element that triggered the modal.
   */
  function showConfirmModal(title, description, onConfirm, triggerElement) {
    if (confirmModalTitle) confirmModalTitle.textContent = title;
    if (confirmModalDesc) confirmModalDesc.innerHTML = description;
    confirmCallback = onConfirm;
    confirmModal.open(triggerElement);
  }

  // This single listener handles all confirmation actions for the generic modal.
  if (confirmActionBtn) {
    confirmActionBtn.addEventListener("click", () => {
      if (typeof confirmCallback === "function") {
        confirmCallback();
      }
      confirmModal.close();
      confirmCallback = null; // Clean up callback after use.
    });
  }
});
