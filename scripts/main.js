import { ModalHandler } from "./modal-handler.js";
import { getQuizProgress, categoryDetails } from "./data-manager.js";
import { quizList } from "../data/quizzes-list.js";

/**
 * Toggles the state of an accordion section (expands or collapses it).
 * @param {HTMLElement} toggleElement The header element of the accordion section.
 * @param {'open'|'close'|undefined} forceState - Force the accordion to open, close, or toggle.
 */
export const toggleAccordion = (toggleElement, forceState) => {
    const content = toggleElement.nextElementSibling;
    const icon = toggleElement.querySelector(".chevron-icon");
    const innerContent = content?.querySelector(".inner-content-wrapper");
    const iconContainer = toggleElement.querySelector(".section-icon-container");
    const mainIcon = iconContainer?.querySelector(".section-main-icon");
    if (!content || !icon) return;

    const isCurrentlyOpen = toggleElement.getAttribute('aria-expanded') === 'true';
    // Determine the target state. If forceState is provided, use it. Otherwise, toggle.
    const shouldBeOpen = forceState !== undefined ? forceState === 'open' : !isCurrentlyOpen;

    // If the state is already what we want, do nothing.
    if (shouldBeOpen === isCurrentlyOpen) return;

    toggleElement.setAttribute("aria-expanded", shouldBeOpen);
    icon.classList.toggle("rotate-180", shouldBeOpen);

    if (iconContainer) {
        iconContainer.classList.toggle("scale-105", shouldBeOpen);
        iconContainer.classList.toggle("shadow-lg", shouldBeOpen);
    }
    if (mainIcon) {
        mainIcon.classList.toggle("rotate-12", shouldBeOpen);
    }

    // The grid-rows trick is a clever way to animate height with Tailwind.
    content.classList.toggle("grid-rows-[1fr]", shouldBeOpen);
    content.classList.toggle("grid-rows-[0fr]", !shouldBeOpen);

    // Animate inner content opacity and transform for a smoother "fade and slide in" effect.
    if (innerContent) {
        // The delay helps the fade-in feel more natural as the container expands.
        innerContent.style.transitionDelay = shouldBeOpen ? "150ms" : "0ms";
        innerContent.classList.toggle("opacity-100", shouldBeOpen);
        innerContent.classList.toggle("translate-y-0", shouldBeOpen);
        innerContent.classList.toggle("opacity-0", !shouldBeOpen);
        innerContent.classList.toggle("-translate-y-2", !shouldBeOpen);
    }
};

// A function to get all the toggles, so we don't expose the variable directly
export const getSectionToggles = () =>
  document.querySelectorAll(".section-toggle");

export function initializePage() {
  /**
   * Sets a CSS custom property for the header's height plus a margin.
   * This allows the CSS `scroll-padding-top` to be dynamic and responsive.
   */
  function setHeaderHeightProperty() {
    const header = document.querySelector("header"); // Assumes the main header is a <header> tag
    if (header) {
      const headerHeight = header.offsetHeight;
      // Set the value to header height + 16px for a nice margin
      document.documentElement.style.setProperty(
        "--header-height-offset",
        `${headerHeight + 16}px`
      );
    }
  }

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
  const pageState = {
    activeQuizUrl: "", // To store the quiz URL for the 'completed' modal actions.
    activeStorageKey: "", // To store the storage key for the modal actions
    confirmCallback: null, // To store the action to perform on confirmation
  };

  /**
   * Creates the HTML for the progress bar section of a quiz card.
   * @param {object} progress - The progress object from getQuizProgress.
   * @param {object} quiz - The full quiz object.
   * @returns {string} The HTML string for the progress section.
   */
  function createProgressHTML(progress, quiz) {
    // The progress object now contains totalQuestions, answeredCount, etc. from data-manager
    if (!progress.totalQuestions || progress.totalQuestions <= 0) return "";

    let progressText, progressTextColor, progressBarColor, progressDetails;

    if (progress.isFinished) {
      progressText = `<span class="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>ทำเสร็จแล้ว!</span>`;
      progressTextColor = "text-green-600 dark:text-green-400";
      progressBarColor = "bg-gradient-to-r from-green-400 to-green-500";
      progressDetails = `คะแนน: ${progress.score}/${progress.totalQuestions}`;
    } else if (progress.hasProgress) {
      progressText = `<span class="inline-flex items-center"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>ความคืบหน้า</span>`;
      progressTextColor = "text-blue-600 dark:text-blue-400";
      progressBarColor = "bg-gradient-to-r from-blue-400 to-blue-600";
      progressDetails = `คะแนน: ${progress.score} | ${progress.answeredCount}/${progress.totalQuestions} ข้อ`;
    } else {
      progressText = "ยังไม่เริ่ม";
      progressTextColor = "text-gray-500 dark:text-gray-400";
      progressBarColor = "bg-gray-300 dark:bg-gray-600";
      progressDetails = `0/${progress.totalQuestions} ข้อ`;
    }

    const actions = [];
    if (progress.hasProgress) {
      actions.push(`
            <button data-storage-key="${quiz.storageKey}" class="reset-progress-btn text-[11px] text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors duration-200 inline-flex items-center font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                ล้างข้อมูล
            </button>`);
    }

    const footerActionsHTML = actions.join(
      '<span class="text-gray-300 dark:text-gray-600">|</span>'
    );

    return `<div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700/80"><div class="flex justify-between items-center mb-1 font-medium"><span class="text-xs ${progressTextColor}">${progressText}</span><span class="text-xs text-gray-500 dark:text-gray-400">${progress.percentage}%</span></div><div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden"><div class="${progressBarColor} h-2.5 rounded-full transition-all duration-500" style="width: ${progress.percentage}%"></div></div><div class="flex justify-between items-center text-[11px] text-gray-500 dark:text-gray-400 mt-1"><span>${progressDetails}</span><div class="flex items-center gap-2">${footerActionsHTML}</div></div></div>`;
  }

  /**
   * Creates a single quiz card element.
   * @param {object} quiz - The quiz data object.
   * @param {number} index - The index for animation delay.
   * @returns {HTMLElement} The created anchor element representing the card.
   */
  function createQuizCard(quiz, index) {
    const card = document.createElement("a");
    card.href = quiz.url;
    const categoryDetail = categoryDetails[quiz.category];
    const borderColorClass = categoryDetail?.color || "border-gray-400";
    const cardGlowClass = categoryDetail?.cardGlow || "";
    const logoGlowClass = categoryDetail?.logoGlow || "";
    const totalQuestions = quiz.amount || 0;

    card.dataset.storageKey = quiz.storageKey;
    card.dataset.totalQuestions = totalQuestions;

    // Enhanced card styling for more visual appeal, size back to normal
    card.className = `quiz-card group flex flex-col h-full bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 p-3 rounded-xl shadow-lg hover:shadow-2xl border border-gray-200 dark:border-gray-700/50 transition-all duration-300 transform hover:scale-[1.02] anim-card-pop-in ${borderColorClass} ${cardGlowClass}`;
    card.style.animationDelay = `${index * 50}ms`;
    const progress = getQuizProgress(quiz.storageKey, totalQuestions);
    const progressHTML = createProgressHTML(progress, quiz);

    card.innerHTML = `
      <div class="flex-grow flex items-start gap-4">
        <div class="flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center border-4 ${borderColorClass} transition-all duration-300 bg-white/80 dark:bg-white group-hover:shadow-lg group-hover:scale-105 ${logoGlowClass}">
          <img src="${quiz.icon}" alt="${quiz.altText}" class="h-9 w-9 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        </div>
        <div class="flex-grow">
          <h3 class="text-base font-bold text-gray-900 dark:text-white font-kanit leading-tight transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">${quiz.title}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">จำนวน ${totalQuestions} ข้อ</p>
          <p class="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mt-1">${quiz.description}</p>
        </div>
      </div>
      <div class="progress-footer-wrapper">${progressHTML}</div>
    `;
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
      console.warn(
        `Details for category "${categoryKey}" not found. Skipping.`
      );
      return null;
    }

    const section = document.createElement("section");
    section.id = `category-${categoryKey}`;
    section.className =
      "section-accordion bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden";

    const toggleHeader = document.createElement("div");
    toggleHeader.id = `toggle-${categoryKey}`; // Add unique ID for targeting
    toggleHeader.className =
      "section-toggle flex justify-between items-center cursor-pointer p-4";
    const sectionBorderColor = details.color || "border-blue-600";
    
    // Handle titles with parentheses for better wrapping on small screens.
    const titleMatch = details.title.match(/(.+)\s+\((.+)\)/);
    let titleContent;

    if (titleMatch) {
      const mainTitle = titleMatch[1];
      const subTitle = titleMatch[2];
      titleContent = `
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 font-kanit flex flex-wrap items-baseline gap-x-2 leading-tight">
          <span>${mainTitle}</span>
          <span class="text-base font-normal text-gray-500 dark:text-gray-400">(${subTitle})</span>
        </h2>
      `;
    } else {
      titleContent = `<h2 class="text-xl font-bold text-gray-800 dark:text-gray-200 font-kanit">${details.title}</h2>`;
    }

    toggleHeader.innerHTML = `
      <div class="flex items-center min-w-0 gap-4">
        <div class="section-icon-container flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center border-4 ${sectionBorderColor} bg-white dark:bg-white transition-all duration-300">
          <img src="${details.icon}" alt="${details.title} Icon" class="section-main-icon h-8 w-8 transition-transform duration-300 ease-in-out">
        </div>
        <div class="min-w-0">
          ${titleContent}
          <p class="text-xs font-normal text-gray-500 dark:text-gray-400 -mt-1">${quizzes.length} ชุด</p>
        </div>
      </div>
      <svg class="chevron-icon h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
    `;
    // Accessibility: Add ARIA attributes for the accordion header
    toggleHeader.setAttribute("aria-expanded", "false");
    toggleHeader.setAttribute("aria-controls", `content-${categoryKey}`);

    const contentDiv = document.createElement("div");
    contentDiv.className =
      "section-content grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out";
    const innerContentWrapper = document.createElement("div"); // This wrapper will be animated
    // The inner wrapper handles the fade/slide, while the parent handles the height expansion.
    innerContentWrapper.className = "inner-content-wrapper overflow-hidden transition-all duration-300 ease-out opacity-0 -translate-y-2";
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
   * Scrolls the page smoothly to a target element, respecting the CSS `scroll-padding-top`.
   * @param {HTMLElement} targetElement The element to scroll to.
   */
  function scrollToElement(targetElement) {
    targetElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  /**
   * Updates the floating navigation bar based on the currently active section.
   * @param {HTMLElement|null} activeToggle - The toggle element of the currently open section, or null to hide.
   */
  function updateFloatingNav(activeToggle) {
    const floatingNavContainer = document.getElementById('floating-nav-container');
    const floatingNavButtons = document.getElementById('floating-nav-buttons');
    if (!floatingNavContainer || !floatingNavButtons) return;

    if (!activeToggle) { // If no section is open, hide the nav
      floatingNavContainer.classList.add('translate-x-full');
      return;
    }

    floatingNavButtons.innerHTML = ''; // Clear old buttons
    const allToggles = getSectionToggles();
    const fragment = document.createDocumentFragment();

    allToggles.forEach(toggle => {
      if (toggle === activeToggle) return; // Skip the active one

      const section = toggle.closest('section');
      if (!section) return;

      const categoryKey = section.id.replace('category-', '');
      const details = categoryDetails[categoryKey];
      if (!details) return;

      const button = document.createElement('button');
      button.className = 'floating-nav-btn flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-200/80 dark:bg-gray-800/90 hover:bg-gray-300 dark:hover:bg-gray-700/90 transition-all duration-200 text-sm font-medium text-gray-800 dark:text-gray-200 shadow-md border border-gray-300 dark:border-gray-700';
      button.dataset.targetId = toggle.id;

      const mainTitle = details.title.split('(')[0].trim();
      button.innerHTML = `
        <img src="${details.icon}" class="h-5 w-5">
        <span class="hidden sm:inline">${mainTitle}</span>
      `;

      button.addEventListener('click', () => {
        const targetToggle = document.getElementById(button.dataset.targetId);
        if (targetToggle) {
          // The main listener will handle closing the old one.
          const targetSection = targetToggle.closest("section");
          targetToggle.click();
          // Scroll to the parent section for consistency
          // Use a longer timeout to allow the closing animation of the previous section to complete
          // The animation duration is 500ms, so we wait slightly longer.
          if (targetSection) {
            setTimeout(() => scrollToElement(targetSection), 550);
          }
        }
      });

      fragment.appendChild(button);
    });

    floatingNavButtons.appendChild(fragment);
    floatingNavContainer.classList.remove('translate-x-full'); // Show the nav
  }

  // Set the header height property on initial load and on window resize.
  setHeaderHeightProperty();
  window.addEventListener("resize", setHeaderHeightProperty);
  // --- Main Rendering Logic ---

  // Display total quiz count in the new header for the list
  const quizListHeader = document.getElementById("quiz-list-header");
  const quizCountDisplay = document.getElementById("quiz-count-display");
  if (quizListHeader && quizCountDisplay) {
    const totalQuizCount = quizList.filter(q => q).length; // Filter for safety
    const totalQuestionsCount = quizList.reduce((sum, quiz) => sum + (quiz.amount || 0), 0);

    if (totalQuizCount > 0) {
      quizCountDisplay.innerHTML = `
        <div>
            <span class="text-base text-xs font-bold">แบบทดสอบทั้งหมด</span> 
            <span class="text-base text-xs font-bold text-teal-600 dark:text-teal-400 ml-2">${totalQuizCount} ชุด</span>
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">จำนวนคำถามทั้งหมด ${totalQuestionsCount.toLocaleString()} ข้อ</div>
      `;
      quizListHeader.classList.remove('hidden');
    }
  }
  // 1. Group quizzes by category
  let fragment; // Declare fragment here so it's accessible later
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
    // Proactively adjust the spacing between sections for a more compact view.
    // This assumes the container uses Tailwind's space-y utility.
    container.classList.remove('space-y-6', 'space-y-8'); // Remove potentially larger spacing
    container.classList.add('space-y-4'); // Apply a smaller, consistent gap

    fragment = document.createDocumentFragment(); // Assign to the already declared fragment
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

  // Create and append the floating navigation container
  const floatingNavContainer = document.createElement('div');
  floatingNavContainer.id = 'floating-nav-container';
  floatingNavContainer.className = 'fixed top-1/2 right-4 p-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm shadow-xl rounded-l-xl transform -translate-y-1/2 translate-x-full transition-transform duration-300 z-40';
  floatingNavContainer.innerHTML = `<div id="floating-nav-buttons" class="flex flex-col items-end gap-2"></div>`;
  document.body.appendChild(floatingNavContainer);

  // 4. Attach listeners and set initial state for accordions
  const sectionToggles = getSectionToggles();
  let currentlyOpenSectionToggle = null;

  // Refactored accordion logic for clarity and robustness.
  // This ensures that state is managed correctly regardless of how the toggle is triggered.
  sectionToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const isThisTheCurrentlyOpen = currentlyOpenSectionToggle === toggle;

      // Case 1: The clicked toggle is the one that's already open, so we close it.
      if (isThisTheCurrentlyOpen) {
        toggleAccordion(toggle, "close");
        currentlyOpenSectionToggle = null;
      } else {
        // Case 2: A new section is being opened.
        // First, close the old one if it exists.
        if (currentlyOpenSectionToggle) {
          toggleAccordion(currentlyOpenSectionToggle, "close");
        }
        // Then, open the new one and update the state.
        toggleAccordion(toggle, "open");
        currentlyOpenSectionToggle = toggle;
      }

      // After all state changes, update the floating nav based on the new state.
      updateFloatingNav(currentlyOpenSectionToggle);
    });
  });

  /**
   * Handles clicks on navigation links (e.g., in the header) that point to category sections.
   * This allows opening a specific accordion section from anywhere on the page.
   * @param {MouseEvent} event
   */
  function handleCategoryNavigation(event) {
    const navLink = event.target.closest('a[href^="#category-"]');
    if (!navLink) return;

    event.preventDefault();
    const targetId = navLink.hash;
    const targetSection = document.querySelector(targetId);
    if (!targetSection) return;

    const targetToggle = targetSection.querySelector('.section-toggle');
    if (targetToggle) {
      const isAlreadyOpen = targetToggle.getAttribute('aria-expanded') === 'true';
      if (!isAlreadyOpen) {
        // Programmatically click the toggle to trigger all associated logic
        // (closing other sections, updating floating nav, etc.)
        targetToggle.click();
      }
      // Use a longer timeout here as well to ensure any closing animation has finished
      // before scrolling, which gives a more stable final position. The animation
      // is 500ms, so we wait slightly longer.
      setTimeout(() => scrollToElement(targetSection), 550);
    }
  }
  document.addEventListener('click', handleCategoryNavigation);

  // Display a message if no quizzes were found after processing
  // This check should happen AFTER attempting to append content to the container.
  // Check if the container actually has children, not the fragment (which might be empty or out of scope).
  if (container && container.children.length === 0) {
    container.innerHTML = `
        <div class="text-center py-16 text-gray-500 dark:text-gray-400">
          <p class="text-lg font-bold mb-2">ไม่พบแบบทดสอบ</p>
          <p>ดูเหมือนจะยังไม่มีแบบทดสอบให้แสดงในขณะนี้ โปรดลองตรวจสอบภายหลัง</p>
        </div>
      `;
  }

  /**
   * Handles the logic when a reset progress button is clicked.
   * @param {Event} event The click event.
   * @param {HTMLElement} card The parent quiz card element.
   * @param {HTMLElement} resetButton The reset button that was clicked.
   */
  function handleResetButtonClick(event, card, resetButton) {
    event.preventDefault();
    event.stopPropagation();
    const key = resetButton.dataset.storageKey;
    const totalQuestions = parseInt(card.dataset.totalQuestions, 10);
    const quiz = quizList.find(q => q.storageKey === key);

    const onConfirm = () => {
      localStorage.removeItem(key);
      const progressWrapper = card.querySelector(".progress-footer-wrapper");
      if (!progressWrapper) return;
      const newProgress = getQuizProgress(key, totalQuestions);
      const newProgressHTML = createProgressHTML(newProgress, quiz);
      progressWrapper.style.transition = "opacity 0.2s ease-out";
      progressWrapper.style.opacity = "0";
      setTimeout(() => {
        progressWrapper.innerHTML = newProgressHTML;
        progressWrapper.style.transition = "opacity 0.3s ease-in";
        progressWrapper.style.opacity = "1";
      }, 200);
    };
    showConfirmModal(
      "ยืนยันการล้างข้อมูล",
      'คุณแน่ใจหรือไม่ว่าต้องการล้างความคืบหน้าของแบบทดสอบนี้?<br><strong class="text-red-600 dark:text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</strong>',
      onConfirm,
      resetButton
    );
  }

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
    pageState.confirmCallback = onConfirm;
    confirmModal.open(triggerElement);
  }

  // --- Event Delegation Listener ---
  if (container) {
    container.addEventListener("click", (event) => {
      const card = event.target.closest(".quiz-card");
      if (!card) return; // Exit if the click was not inside a card

      const resetButton = event.target.closest(".reset-progress-btn");

      // Handle reset button click
      if (resetButton) {
        handleResetButtonClick(event, card, resetButton);
        return; // Stop further processing
      }

      // Handle card click (for completed quizzes)
      const storageKey = card.dataset.storageKey;
      const totalQuestions = parseInt(card.dataset.totalQuestions, 10);
      const currentProgress = getQuizProgress(storageKey, totalQuestions);

      if (currentProgress.isFinished) {
        event.preventDefault();
        pageState.activeQuizUrl = card.href;
        pageState.activeStorageKey = storageKey;
        completedModal.open(card);
      }
    });
  }

  // This single listener handles all confirmation actions for the generic modal.
  if (confirmActionBtn) {
    confirmActionBtn.addEventListener("click", () => {
      if (typeof pageState.confirmCallback === "function") {
        pageState.confirmCallback();
      }
      confirmModal.close();
      pageState.confirmCallback = null; // Clean up callback after use.
    });
  }

  // --- Completed Quiz Modal Actions ---
  if (viewResultsBtn) {
    viewResultsBtn.addEventListener("click", () => {
      if (pageState.activeQuizUrl) {
        const separator = pageState.activeQuizUrl.includes("?") ? "&" : "?";
        window.location.href = `${pageState.activeQuizUrl}${separator}action=view_results`;
      }
      completedModal.close();
    });
  }
  if (startOverBtn) {
    startOverBtn.addEventListener("click", () => {
      if (pageState.activeStorageKey) localStorage.removeItem(pageState.activeStorageKey);
      if (pageState.activeQuizUrl) window.location.href = pageState.activeQuizUrl;
      completedModal.close();
    });
  }
}
