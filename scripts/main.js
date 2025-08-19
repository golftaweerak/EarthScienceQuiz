import { ModalHandler } from "./modal-handler.js";
import { getQuizProgress, categoryDetails } from "./data-manager.js";
import { quizList } from "../data/quizzes-list.js";

export function initializePage() {
  // --- 0. Initialize Modals and Cache Elements ---

  // Use the new ModalHandler for accessible, reusable modals.
  const confirmModal = new ModalHandler("confirm-action-modal");
  const completedModal = new ModalHandler("completed-quiz-modal");

  // Cache buttons that trigger actions other than just closing the modal.
  const confirmActionBtn = document.getElementById("confirm-action-btn");
  const viewResultsBtn = document.getElementById("completed-view-results-btn");
  const startOverBtn = document.getElementById("completed-start-over-btn");
  // Cache modal text elements for dynamic content
  const confirmModalTitle = document.getElementById("confirm-modal-title");
  const confirmModalDesc = document.getElementById("confirm-modal-description");

  // State variables to hold context for the active modal.
  let activeQuizUrl = ""; // To store the quiz URL for the 'completed' modal actions.
  let activeStorageKey = ""; // To store the storage key for the modal actions
  let confirmCallback = null; // To store the action to perform on confirmation

  /**
   * Creates the HTML for the progress bar section of a quiz card.
   * @param {object} progress - The progress object from getQuizProgress.
   * @param {string} storageKey - The localStorage key for the quiz.
   * @returns {string} The HTML string for the progress section.
   */
  function createProgressHTML(progress, storageKey) {
    // The progress object now contains totalQuestions, answeredCount, etc. from data-manager
    if (!progress.totalQuestions || progress.totalQuestions <= 0) return "";

    let progressText, progressTextColor, progressBarColor, progressDetails;

    if (progress.isFinished) {
      progressText = "ทำเสร็จแล้ว!";
      progressTextColor = "text-green-600 dark:text-green-400";
      progressBarColor = "bg-green-500";
      progressDetails = `คะแนน: ${progress.score}/${progress.totalQuestions}`;
    } else if (progress.hasProgress) {
      progressText = "ความคืบหน้า";
      progressTextColor = "text-blue-600 dark:text-blue-400";
      progressBarColor = "bg-blue-500";
      progressDetails = `คะแนน: ${progress.score} | ${progress.answeredCount}/${progress.totalQuestions} ข้อ`;
    } else {
      progressText = "ยังไม่เริ่ม";
      progressTextColor = "text-gray-500 dark:text-gray-400";
      progressBarColor = "bg-gray-300 dark:bg-gray-600";
      progressDetails = `0/${progress.totalQuestions} ข้อ`;
    }

    const resetButtonHTML = progress.hasProgress
      ? `
            <button data-storage-key="${storageKey}" class="reset-progress-btn text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200 inline-flex items-center font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                ล้างข้อมูล
            </button>`
      : "";

    return `<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/80"><div class="flex justify-between items-center mb-1 font-medium"><span class="text-sm ${progressTextColor}">${progressText}</span><span class="text-sm text-gray-500 dark:text-gray-400">${progress.percentage}%</span></div><div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden"><div class="${progressBarColor} h-2.5 rounded-full transition-all duration-500" style="width: ${progress.percentage}%"></div></div><div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mt-1"><span>${progressDetails}</span>${resetButtonHTML}</div></div>`;
  }

  // Map border colors to their corresponding shadow colors for the hover effect
  const shadowColorMap = {
    "border-sky-500": "hover:shadow-sky-500/40",
    "border-indigo-500": "hover:shadow-indigo-500/40",
    "border-teal-500": "hover:shadow-teal-500/40",
    "border-amber-500": "hover:shadow-amber-500/40",
  };

  /**
   * Creates a single quiz card element.
   * @param {object} quiz - The quiz data object.
   * @param {number} index - The index for animation delay.
   * @returns {HTMLElement} The created anchor element representing the card.
   */
  function createQuizCard(quiz, index) {
    const card = document.createElement("a");
    card.href = quiz.url;
    const borderColorClass = categoryDetails[quiz.category]?.color || "border-gray-400";
    const shadowClass = shadowColorMap[borderColorClass] || "hover:shadow-gray-400/30";

    card.className = `quiz-card group flex flex-col h-full bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-xl border border-gray-200 dark:border-gray-700/50 transition-all duration-300 transform hover:-translate-y-1 fade-in-up ${shadowClass}`;
    card.style.animationDelay = `${index * 50}ms`; // Slightly faster animation

    const totalQuestions = quiz.amount || 0;
    const progress = getQuizProgress(quiz.storageKey, totalQuestions);
    const progressHTML = createProgressHTML(progress, quiz.storageKey);

    card.innerHTML = `
      <div class="flex-grow flex items-start gap-4">
        <div class="flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center border-4 ${borderColorClass} transition-colors duration-300 bg-white dark:bg-white">
          <img src="${quiz.icon}" alt="${quiz.altText}" class="h-9 w-9 transition-transform duration-300 group-hover:scale-110">
        </div>
        <div class="flex-grow">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white font-kanit leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">${quiz.title}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">จำนวน ${totalQuestions} ข้อ</p>
          <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-2">${quiz.description}</p>
        </div>
      </div>
      <div class="progress-footer-wrapper">${progressHTML}</div>
    `;

    // =================================================================
    // START: ส่วนแก้ไขปัญหาการคลิก
    // นี่คือส่วนสำคัญที่แก้ไขปัญหาการคลิกการ์ดแล้วไม่ไปหน้าทำข้อสอบ
    // เราจะดักจับ event การคลิกเพื่อตรวจสอบเงื่อนไขพิเศษเท่านั้น
    card.addEventListener("click", (event) => {
      // ตรวจสอบสถานะล่าสุดของแบบทดสอบนี้
      const currentProgress = getQuizProgress(quiz.storageKey, quiz.amount || 0);

      // เงื่อนไข: ถ้าทำแบบทดสอบ "เสร็จแล้ว" เท่านั้น
      if (currentProgress.isFinished) {
        // ให้ยกเลิกการทำงานปกติของลิงก์ (คือไม่ให้ไปที่หน้า quiz)
        event.preventDefault();

        // เก็บข้อมูลที่จำเป็นสำหรับการทำงานของ Modal
        activeQuizUrl = quiz.url;
        activeStorageKey = quiz.storageKey;

        // แล้วเปิดหน้าต่าง Modal ขึ้นมาแทน
        completedModal.open(event.currentTarget);
      }
      // ถ้าเงื่อนไขไม่เป็นจริง (ยังทำไม่เสร็จ หรือยังไม่เริ่ม)
      // โค้ดใน if block นี้จะไม่ทำงาน และลิงก์จะทำงานตามปกติ
      // คือพาผู้ใช้ไปยัง URL ที่กำหนดใน href
    });
    // END: ส่วนแก้ไขปัญหาการคลิก
    // =================================================================

    const resetButton = card.querySelector(".reset-progress-btn");
    if (resetButton) {
      resetButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const key = event.currentTarget.dataset.storageKey;
        const onConfirm = () => {
          localStorage.removeItem(key);
          const progressWrapper = card.querySelector(".progress-footer-wrapper");
          if (!progressWrapper) return;
          const newProgress = getQuizProgress(key, totalQuestions);
          const newProgressHTML = createProgressHTML(newProgress, key);
          progressWrapper.style.transition = "opacity 0.2s ease-out";
          progressWrapper.style.opacity = "0";
          setTimeout(() => {
            progressWrapper.innerHTML = newProgressHTML;
            progressWrapper.style.transition = "opacity 0.3s ease-in";
            progressWrapper.style.opacity = "1";
          }, 200);
        };
        showConfirmModal("ยืนยันการล้างข้อมูล", 'คุณแน่ใจหรือไม่ว่าต้องการล้างความคืบหน้าของแบบทดสอบนี้?<br><strong class="text-red-600 dark:text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>', onConfirm, event.currentTarget);
      });
    }
    return card;
  }

  /**
   * Creates a full category section element, including its header and quiz cards.
   * @param {string} categoryKey - The key for the category (e.g., 'Senior').
   * @param {Array<object>} quizzes - An array of quiz objects for this category.
   * @returns {HTMLElement} The created section element.
   */
  function createCategorySection(categoryKey, quizzes) {
    const details = categoryDetails[categoryKey];
    if (!details) {
      console.warn(`Details for category "${categoryKey}" not found. Skipping.`);
      return null;
    }

    const section = document.createElement("section");
    section.id = `category-${categoryKey}`;
    section.className = "section-accordion bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden";

    const toggleHeader = document.createElement("div");
    toggleHeader.className = "section-toggle flex justify-between items-center cursor-pointer p-4";
    const sectionBorderColor = details.color || "border-blue-600";
    toggleHeader.innerHTML = `<h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center font-kanit"><div class="section-icon-container flex-shrink-0 h-12 w-12 mr-3 rounded-full flex items-center justify-center border-4 ${sectionBorderColor} bg-white dark:bg-white transition-all duration-300"><img src="${details.icon}" alt="${details.title} Icon" class="h-8 w-8"></div>${details.title}</h2><svg class="chevron-icon h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>`;
    // Accessibility: Add ARIA attributes for the accordion header
    toggleHeader.setAttribute("aria-expanded", "false");
    toggleHeader.setAttribute("aria-controls", `content-${categoryKey}`);

    const contentDiv = document.createElement("div");
    contentDiv.className = "section-content grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out";
    const innerContentWrapper = document.createElement("div");
    innerContentWrapper.className = "overflow-hidden";
    const quizGrid = document.createElement("div");
    quizGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-6 p-4";
    // Accessibility: Add ID and ARIA attributes for the content panel
    contentDiv.id = `content-${categoryKey}`;
    contentDiv.setAttribute("role", "region");

    quizzes.forEach((quiz, index) => {
      const card = createQuizCard(quiz, index);
      quizGrid.appendChild(card);
    });

    innerContentWrapper.appendChild(quizGrid);
    contentDiv.appendChild(innerContentWrapper);
    section.append(toggleHeader, contentDiv);
    return section;
  }

  /**
   * Toggles the state of an accordion section (expands or collapses it).
   * @param {HTMLElement} toggleElement The header element of the accordion section.
   * @param {'open'|'close'|undefined} forceState - Force the accordion to open, close, or toggle.
   */
  const toggleAccordion = (toggleElement, forceState) => {
    const content = toggleElement.nextElementSibling;
    const icon = toggleElement.querySelector(".chevron-icon");
    const iconContainer = toggleElement.querySelector(
      ".section-icon-container"
    );
    if (!content || !icon) return;

    const isCollapsed = content.classList.contains("grid-rows-[0fr]");

    let shouldBeOpen =
      forceState === "open"
        ? true
        : forceState === "close"
        ? false
        : isCollapsed;

    if (shouldBeOpen === !isCollapsed) return;

    content.classList.toggle("grid-rows-[1fr]", shouldBeOpen);
    content.classList.toggle("grid-rows-[0fr]", !shouldBeOpen);
    icon.classList.toggle("rotate-180", shouldBeOpen);

    // Accessibility: Update ARIA attribute
    toggleElement.setAttribute("aria-expanded", shouldBeOpen);


    if (iconContainer) {
      iconContainer.classList.toggle("scale-105", shouldBeOpen);
      iconContainer.classList.toggle("shadow-lg", shouldBeOpen);
    }
  };

  // --- Main Rendering Logic ---

  // 1. Group quizzes by category
  const groupedQuizzes = quizList.reduce((acc, quiz) => {
    const category = quiz.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(quiz);
    return acc;
  }, {});

  // 2. Sort categories based on the 'order' property for consistent display
  const sortedCategories = Object.keys(groupedQuizzes).sort((a, b) => {
    const orderA = categoryDetails[a]?.order || 99;
    const orderB = categoryDetails[b]?.order || 99;
    return orderA - orderB;
  });

  // 3. Create and append category sections using a DocumentFragment for performance
  const container = document.getElementById("quiz-categories-container");
  if (container) {
    const fragment = document.createDocumentFragment();
    sortedCategories.forEach((categoryKey) => {
      const quizzes = groupedQuizzes[categoryKey];
      const section = createCategorySection(categoryKey, quizzes);
      if (section) {
        fragment.appendChild(section);
      }
    });
    container.innerHTML = ""; // Clear existing content
    container.appendChild(fragment);
  } else {
    console.error("Category container not found!");
  }

  // 4. Attach listeners and set initial state for accordions
  const sectionToggles = document.querySelectorAll(".section-toggle");
  sectionToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => toggleAccordion(toggle));
  });

  // Open the first section by default for better UX
  if (sectionToggles.length > 0) {
    toggleAccordion(sectionToggles[0], "open");
  }

  // 5. Add listeners to header buttons to open corresponding accordions
  // This makes the category buttons in the header interactive.
  const headerCategoryLinks = document.querySelectorAll('#header-placeholder a[href^="#category-"]');
  headerCategoryLinks.forEach(link => {
      link.addEventListener('click', (event) => {
          // The default browser action (scrolling to the anchor) is desired, so we don't use event.preventDefault().
          const targetId = link.getAttribute('href').substring(1);
          const targetSection = document.getElementById(targetId);

          if (targetSection) {
              const targetToggle = targetSection.querySelector('.section-toggle');
              if (targetToggle) {
                  // For a better user experience, close all other accordions first.
                  sectionToggles.forEach(otherToggle => {
                      if (otherToggle !== targetToggle) {
                          toggleAccordion(otherToggle, 'close');
                      }
                  });
                  // Then, ensure the target accordion is open.
                  toggleAccordion(targetToggle, 'open');
              }
          }
      });
  });

  // --- Random Quiz Button Functionality ---
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

  // --- Modal Action Logic ---

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
}
