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

/**
 * Groups quizzes within a main category into a structured format for rendering,
 * especially for categories that require nested accordions.
 * @param {Array<object>} quizzes - The list of quizzes in the main category.
 * @param {string} categoryKey - The key of the main category (e.g., 'AstronomyPOSN').
 * @returns {Array<object>} A structured array of groups to be rendered.
 */
function groupQuizzesForCategory(quizzes, categoryKey) {
  const groups = [];
  const mainCategoryTitle = categoryDetails[categoryKey]?.title.split('(')[0].trim();

  if (categoryKey === 'AstronomyPOSN') {
    const grouped = {
      camp1_junior: quizzes.filter(q => q.id.startsWith('juniorC')),
      camp1_senior: quizzes.filter(q => q.id.startsWith('seniorC')),
      regular_junior: quizzes.filter(q => q.id.startsWith('junior') && !q.id.startsWith('juniorC')),
      regular_senior: quizzes.filter(q => q.id.startsWith('senior') && !q.id.startsWith('seniorC')),
      general: quizzes.filter(q => !q.id.startsWith('junior') && !q.id.startsWith('senior')),
    };

    if (grouped.regular_junior.length > 0) groups.push({ title: `${mainCategoryTitle} ม.ต้น (Junior)`, quizzes: grouped.regular_junior, level: 1 });
    if (grouped.regular_senior.length > 0) groups.push({ title: `${mainCategoryTitle} ม.ปลาย (Senior)`, quizzes: grouped.regular_senior, level: 1 });
    if (grouped.general.length > 0) groups.push({ title: `${mainCategoryTitle} ทั่วไป (General)`, quizzes: grouped.general, level: 1 });

    const camp1SubGroups = [];
    if (grouped.camp1_junior.length > 0) camp1SubGroups.push({ title: "ดาราศาสตร์ ม.ต้น ค่าย 1", quizzes: grouped.camp1_junior, level: 2 });
    if (grouped.camp1_senior.length > 0) camp1SubGroups.push({ title: "ดาราศาสตร์ ม.ปลาย ค่าย 1", quizzes: grouped.camp1_senior, level: 2 });

    if (camp1SubGroups.length > 0) {
      groups.push({ title: "ทบทวนค่าย 1", isNested: true, subGroups: camp1SubGroups, level: 1 });
    }
  } else if (categoryKey === 'ChallengePOSN') {
    const subGroupedQuizzes = quizzes.reduce((acc, quiz) => {
      let subKey = Object.keys(categoryDetails).find(key => quiz.id.startsWith(`adv_${key.toLowerCase()}`)) || 'GeneralKnowledge';
      if (!acc[subKey]) acc[subKey] = [];
      acc[subKey].push(quiz);
      return acc;
    }, {});

    Object.keys(subGroupedQuizzes).sort((a, b) => (categoryDetails[a]?.order || 99) - (categoryDetails[b]?.order || 99)).forEach(subKey => {
      groups.push({ title: categoryDetails[subKey]?.title || subKey, quizzes: subGroupedQuizzes[subKey], level: 1 });
    });
  } else if (categoryKey === 'AstronomyReview') {
    const subGroupedQuizzes = quizzes.reduce((acc, quiz) => {
      let subKey = quiz.id.startsWith('Astro') ? 'Astronomy' : (quiz.id.startsWith('ESr') ? 'EarthScience' : 'GeneralKnowledge');
      if (!acc[subKey]) acc[subKey] = [];
      acc[subKey].push(quiz);
      return acc;
    }, {});

    const reviewOrder = { Astronomy: 1, EarthScience: 2, GeneralKnowledge: 99 };
    Object.keys(subGroupedQuizzes).sort((a, b) => (reviewOrder[a] || 99) - (reviewOrder[b] || 99)).forEach(subKey => {
      const title = { Astronomy: "ทบทวน ดาราศาสตร์", EarthScience: "ทบทวน วิทยาศาสตร์โลกและอวกาศ" }[subKey] || categoryDetails[subKey]?.title || subKey;
      groups.push({ title, quizzes: subGroupedQuizzes[subKey], level: 1 });
    });
  }
  return groups;
}

// A function to get all the toggles, so we don't expose the variable directly
export const getSectionToggles = () =>
  document.querySelectorAll(".section-toggle");

export function initializePage() {
  // Apply modern scrollbar styling to the main page body.
  document.body.classList.add('modern-scrollbar');

  // Constants for animation timings to avoid "magic numbers"
  const ACCORDION_ANIMATION_DURATION = 500; // Corresponds to `duration-500` in Tailwind
  const SCROLL_DELAY = ACCORDION_ANIMATION_DURATION + 50; // Buffer for smooth scrolling after animation

  /**
   * Sets a CSS custom property for the header's height plus a margin.
   * This allows the CSS `scroll-padding-top` to be dynamic and responsive. It also positions the floating navigation bar.
   */
  function setHeaderHeightProperty() {
    const header = document.getElementById("main_header-placeholder");    
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
    const categoryDetail = categoryDetails[quiz.category];
    const borderColorClass = categoryDetail?.color || "border-gray-400";
    // Extract color name (e.g., 'lime' from 'border-lime-600') for dynamic background/text colors
    const colorName = borderColorClass.split('-')[1] || 'gray';

    const card = document.createElement("a");
    card.href = quiz.url;
    const totalQuestions = quiz.amount || 0;

    card.dataset.storageKey = quiz.storageKey;
    card.dataset.totalQuestions = totalQuestions;

    // Refined card styling with softer corners, better spacing, and more integrated color theme.
    card.className = `quiz-card group flex flex-col h-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700/60 hover:border-${colorName}-300 dark:hover:border-${colorName}-600 hover:shadow-2xl hover:shadow-${colorName}-500/10 dark:hover:shadow-black/20 transition-all duration-300 transform hover:-translate-y-1 anim-card-pop-in`;
    card.style.animationDelay = `${index * 50}ms`;
    const progress = getQuizProgress(quiz.storageKey, totalQuestions);
    const progressHTML = createProgressHTML(progress, quiz);

    const iconBgClass = `bg-${colorName}-100 dark:bg-${colorName}-400/20`; // Lighter, glowing background for dark mode
    const iconBorderClass = `border-${colorName}-200 dark:border-${colorName}-400`;
    const titleHoverClass = `group-hover:text-${colorName}-600 dark:group-hover:text-${colorName}-400`;

    card.innerHTML = `
      <div class="flex-grow flex items-start gap-4">
        <div class="flex-shrink-0 h-14 w-14 rounded-xl flex items-center justify-center ${iconBgClass} border-2 ${iconBorderClass} transition-all duration-300 shadow-md shadow-${colorName}-400/20">
          <img src="${quiz.icon}" alt="${quiz.altText}" class="h-9 w-9 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
        </div>
        <div class="flex-grow">
          <h3 class="text-base font-bold text-gray-900 dark:text-white font-kanit leading-tight transition-colors ${titleHoverClass}">${quiz.title}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">จำนวน ${totalQuestions} ข้อ</p>
          <p class="text-gray-600 dark:text-gray-300 text-xs leading-relaxed mt-1">${quiz.description}</p>
        </div>
      </div>
      <div class="progress-footer-wrapper">${progressHTML}</div>
    `;
    return card;
  }

  /**
   * Creates a nested accordion element for a sub-category.
   * @param {string} subCategoryTitle - The title for the sub-category accordion.
   * @param {Array<object>} quizzes - An array of quiz objects for this sub-category.
   * @param {string} colorName - The base color name (e.g., 'blue') for styling.
   * @returns {HTMLElement} The created accordion element.
   * @param {number} level - The nesting level of the accordion, for floating nav filtering.
   */
  function createSubCategoryAccordion(subCategoryTitle, quizzes, colorName, level = 1) {
    const accordion = document.createElement('div');
    accordion.className = 'sub-accordion py-1';

    const toggleHeader = document.createElement('div');
    // A slightly different style for the sub-header
    toggleHeader.className = `sub-section-toggle flex justify-between items-center cursor-pointer p-3 rounded-lg bg-${colorName}-100/40 dark:bg-${colorName}-900/20 hover:bg-${colorName}-100/70 dark:hover:bg-${colorName}-900/40 transition-colors`;
    toggleHeader.setAttribute('aria-expanded', 'false');
    toggleHeader.dataset.level = level;

    toggleHeader.innerHTML = `
        <h4 class="font-bold text-sm text-${colorName}-800 dark:text-${colorName}-300">${subCategoryTitle}</h4>
        <svg class="chevron-icon h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
    `;

    const contentDiv = document.createElement("div");
    contentDiv.className = "sub-section-content grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-in-out";

    const innerContentWrapper = document.createElement("div");
    innerContentWrapper.className = "inner-content-wrapper overflow-hidden";

    const quizGrid = document.createElement("div");
    quizGrid.className = "quiz-grid-container pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2";

    // Only create quiz cards if there are quizzes to display.
    if (quizzes && quizzes.length > 0) {
        quizzes.forEach((quiz, index) => {
            const card = createQuizCard(quiz, index);
            quizGrid.appendChild(card);
        });
    }
    innerContentWrapper.appendChild(quizGrid);
    contentDiv.appendChild(innerContentWrapper);
    accordion.append(toggleHeader, contentDiv);

    toggleHeader.addEventListener('click', () => {
      const wasOpen = toggleHeader.getAttribute('aria-expanded') === 'true';
      toggleAccordion(toggleHeader);

      // If the accordion was closed and is now opening, scroll to it.
      if (!wasOpen) {
        setTimeout(() => {
          scrollToElement(toggleHeader);
        }, 150); // A short delay for a better visual experience.
      }
    });
    return accordion;
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

    const sectionBorderColor = details.color || "border-blue-600";
    const colorName = sectionBorderColor.split('-')[1] || 'gray';

    const section = document.createElement("section");
    section.id = `category-${categoryKey}`;
    // Added a thick top border with the category color for better visual grouping.
    section.className = `section-accordion bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden border-t-4 ${sectionBorderColor}`;

    const toggleHeader = document.createElement("div");
    toggleHeader.id = `toggle-${categoryKey}`; // Add unique ID for targeting
    // Dynamic background color for header based on category, with even more subtle opacity in dark mode.
    toggleHeader.className = `section-toggle flex justify-between items-center cursor-pointer p-4 bg-${colorName}-50/30 dark:bg-${colorName}-900/10 hover:bg-${colorName}-100/50 dark:hover:bg-${colorName}-900/20 transition-colors duration-200`;

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

    const iconBgClass = `bg-${colorName}-100 dark:bg-${colorName}-400/20`; // Lighter, glowing background for dark mode
    const iconBorderClass = `border-${colorName}-300 dark:border-${colorName}-400`;

    toggleHeader.innerHTML = `
      <div class="flex items-center min-w-0 gap-4">
        <div class="section-icon-container flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center border-2 ${iconBorderClass} ${iconBgClass} transition-all duration-300 shadow-md shadow-${colorName}-400/30">
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
    // Accessibility: Add ID and ARIA attributes for the content panel
    contentDiv.id = `content-${categoryKey}`;
    contentDiv.setAttribute("role", "region");

    const hasSubCategories = ['AstronomyPOSN', 'ChallengePOSN', 'AstronomyReview'].includes(categoryKey);

    if (hasSubCategories) {
      const subCategoryContainer = document.createElement('div');
      subCategoryContainer.className = 'p-2 md:p-4 space-y-2';

      const groupedData = groupQuizzesForCategory(quizzes, categoryKey);

      groupedData.forEach(group => {
        if (group.isNested) {
          // Create a container accordion for nested groups (like "ทบทวนค่าย 1")
          const containerAccordion = createSubCategoryAccordion(group.title, [], colorName, group.level);
          const contentWrapper = containerAccordion.querySelector('.inner-content-wrapper');
          contentWrapper.innerHTML = ''; // Clear default grid
          contentWrapper.classList.remove('quiz-grid-container');
          contentWrapper.classList.add('space-y-2', 'p-2');

          group.subGroups.forEach(subGroup => {
            const nestedAccordion = createSubCategoryAccordion(subGroup.title, subGroup.quizzes, colorName, subGroup.level);
            contentWrapper.appendChild(nestedAccordion);
          });
          subCategoryContainer.appendChild(containerAccordion);
        } else {
          // Create a standard sub-category accordion
          const accordion = createSubCategoryAccordion(group.title, group.quizzes, colorName, group.level);
          subCategoryContainer.appendChild(accordion);
        }
      });

      innerContentWrapper.appendChild(subCategoryContainer);
    } else {
      const quizGrid = document.createElement("div");
      quizGrid.className = "quiz-grid-container p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2";
      quizzes.forEach((quiz, index) => {
        const card = createQuizCard(quiz, index);
        quizGrid.appendChild(card);
      });
      innerContentWrapper.appendChild(quizGrid);
    }

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
   * @param {NodeListOf<Element>} allToggles - A collection of all section toggle elements.
   */
  function updateFloatingNav(activeToggle, allToggles) {
    const floatingNavContainer = document.getElementById('floating-nav-container');    
    const floatingNavButtons = document.getElementById('floating-nav-buttons');
    if (!floatingNavContainer || !floatingNavButtons) return;

    // --- 1. Determine theme and clean up old theme classes ---
    const previousColor = floatingNavContainer.dataset.themeColor || 'default';
    let colorName = 'default';

    const activeSection = activeToggle ? activeToggle.closest('section') : null;
    if (activeToggle) {
      const activeCategoryKey = activeSection ? activeSection.id.replace('category-', '') : null;
      const activeCategoryDetails = activeCategoryKey ? categoryDetails[activeCategoryKey] : null;
      if (activeCategoryDetails && activeCategoryDetails.color) {
        const extractedColor = activeCategoryDetails.color.split('-')[1];
        if (extractedColor) colorName = extractedColor;
      }
    }

    if (previousColor !== colorName) {
      // Remove old container colors. The spread syntax (...) is used to pass multiple arguments.
      const oldContainerBg = previousColor === 'default' ? 'bg-white/60 dark:bg-gray-900/60' : `bg-${previousColor}-50/80 dark:bg-${previousColor}-950/70`;
      const oldContainerBorder = previousColor === 'default' ? 'border-gray-200 dark:border-gray-700' : `border-${previousColor}-200 dark:border-${previousColor}-800`;
      floatingNavContainer.classList.remove(...oldContainerBg.split(' '), ...oldContainerBorder.split(' '));
    }

    // --- 2. Define and apply new theme classes to the container ---
    const containerBg = colorName === 'default' ? 'bg-white/60 dark:bg-gray-900/60' : `bg-${colorName}-50/80 dark:bg-${colorName}-950/70`;
    const containerBorder = colorName === 'default' ? 'border-gray-200 dark:border-gray-700' : `border-${colorName}-200 dark:border-${colorName}-800`;
    floatingNavContainer.classList.add(...containerBg.split(' '), ...containerBorder.split(' '));
    floatingNavContainer.dataset.themeColor = colorName;

    // --- 3. Handle visibility and button generation ---
    if (!activeToggle) {
      floatingNavContainer.classList.add('opacity-0', 'pointer-events-none', 'translate-y-full');
      return;
    }

    // Define button colors based on the same theme
    const bgColor = colorName === 'default' ? 'bg-gray-200/80 dark:bg-gray-800/90' : `bg-${colorName}-100/80 dark:bg-${colorName}-900/60`;
    const hoverBgColor = colorName === 'default' ? 'hover:bg-gray-300 dark:hover:bg-gray-700/90' : `hover:bg-${colorName}-200/90 dark:hover:bg-${colorName}-800/70`;
    const borderColor = colorName === 'default' ? 'border-gray-300 dark:border-gray-700' : `border-${colorName}-300 dark:border-${colorName}-600`;
    const textColor = colorName === 'default' ? 'text-gray-800 dark:text-gray-200' : `text-${colorName}-800 dark:text-${colorName}-200`;

    // --- 4. Rebuild buttons with the new theme ---
    floatingNavButtons.innerHTML = ''; // Clear old buttons first
    const fragment = document.createDocumentFragment();
    let animationDelay = 0;
    const delayIncrement = 50; // 50ms between each button

    const createFloatingButton = (options) => {
      const button = document.createElement("button");
      const classList = options.classList || `flex items-center justify-center h-8 w-8 rounded-full ${bgColor} ${hoverBgColor} transition-all duration-200 ${textColor} shadow-md border ${borderColor}`;
      button.className = `floating-nav-btn-base anim-nav-btn-pop-in ${classList}`;
      button.setAttribute("aria-label", options.ariaLabel);
      button.innerHTML = options.innerHTML;
      button.style.animationDelay = `${animationDelay}ms`;
      animationDelay += delayIncrement;
      button.addEventListener("click", options.onClick);
      return button;
    };

    // Close Category Button
    const closeBtn = createFloatingButton({
      ariaLabel: "ปิดหมวดหมู่",
      innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
      onClick: () => activeToggle?.click(),
    });
    fragment.appendChild(closeBtn);

    // Scroll to Top Button
    const scrollToTopBtn = createFloatingButton({
      ariaLabel: "กลับไปด้านบนสุด",
      innerHTML: `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>`,
      onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
    });
    fragment.appendChild(scrollToTopBtn);

    // Add a separator if there are other buttons to navigate to.
    if (allToggles.length > 1) {
      const separator = document.createElement("hr");
      separator.className = `h-8 mx-1.5 border-l ${borderColor}`;
      fragment.appendChild(separator);
    }

    allToggles.forEach((toggle) => {
      if (toggle === activeToggle) return; // Skip the active one

      const section = toggle.closest('section');
      if (!section) return;

      const categoryKey = section.id.replace('category-', '');
      const details = categoryDetails[categoryKey];
      if (!details) return;

      const mainTitle = details.title.split('(')[0].trim();
      const button = createFloatingButton({
        ariaLabel: `ไปที่หมวดหมู่ ${mainTitle}`,
        innerHTML: `<img src="${details.icon}" alt="${mainTitle} icon" class="h-5 w-5">`,
        onClick: (e) => {
          const targetToggle = document.getElementById(toggle.id); // Use closure to get the correct toggle
          if (targetToggle) {
            const targetSection = targetToggle.closest("section");
            targetToggle.click();
            if (targetSection) {
              setTimeout(() => scrollToElement(targetSection), SCROLL_DELAY);
            }
          }
        }
      });

      fragment.appendChild(button);
    });

    // --- NEW: Add Sub-category buttons if applicable, AFTER main category buttons ---
    const activeCategoryKey = activeSection ? activeSection.id.replace('category-', '') : null;
    if (['AstronomyPOSN', 'ChallengePOSN', 'AstronomyReview'].includes(activeCategoryKey) && activeSection) {
      const subToggles = activeSection.querySelectorAll('.sub-section-toggle[data-level="1"]');
      if (subToggles.length > 0) {
        const subSeparator = document.createElement("hr");
        subSeparator.className = `h-8 mx-1.5 border-l ${borderColor}`;
        fragment.appendChild(subSeparator);

        subToggles.forEach(subToggle => {
          const subTitle = subToggle.querySelector('h4').textContent;
          let shortTitle;
          if (subTitle === 'ทบทวนค่าย 1') {
            shortTitle = 'ค่าย 1';
          } else if (subTitle.startsWith('ทบทวน ดาราศาสตร์')) {
            shortTitle = 'ดาราฯ';
          } else if (subTitle.startsWith('ทบทวน วิทยาศาสตร์โลก')) {
            shortTitle = 'วิทย์โลก';
          } else if (subTitle.includes('ม.ปลาย')) {
            shortTitle = 'ม.ปลาย';
          } else if (subTitle.includes('ม.ต้น')) {
            shortTitle = 'ม.ต้น';
          } else if (subTitle.includes('ธรณีวิทยา')) {
            shortTitle = 'ธรณีฯ';
          } else if (subTitle.includes('อุตุนิยมวิทยา')) {
            shortTitle = 'อุตุฯ';
          } else if (subTitle.includes('สมุทรศาสตร์')) {
            shortTitle = 'สมุทรฯ';
          } else if (subTitle.includes('ดาราศาสตร์')) { // For the sub-discipline
            shortTitle = 'ดาราฯ';
          } else {
            shortTitle = 'ทั่วไป';
          }

          const subButton = createFloatingButton({
            ariaLabel: `ไปที่ ${subTitle}`,
            innerHTML: `<span class="text-xs font-bold">${shortTitle}</span>`,
            classList: `flex items-center justify-center h-7 w-10 rounded-lg ${bgColor} ${hoverBgColor} transition-all duration-200 ${textColor} shadow-sm border ${borderColor}`,
            onClick: () => {
              const isAlreadyOpen = subToggle.getAttribute('aria-expanded') === 'true';
              if (!isAlreadyOpen) {
                toggleAccordion(subToggle, 'open');
              }
              setTimeout(() => {
                scrollToElement(subToggle); // Use the consistent scroll function
                subToggle.classList.add('ring-2', 'ring-offset-2', `ring-${colorName}-500`, `dark:ring-offset-gray-900`);
                setTimeout(() => subToggle.classList.remove('ring-2', 'ring-offset-2', `ring-${colorName}-500`, `dark:ring-offset-gray-900`), 2000);
              }, isAlreadyOpen ? 0 : 150); // No delay if already open, small delay if just opened.
            }
          });
          fragment.appendChild(subButton);
        });
      }
    }

    floatingNavButtons.appendChild(fragment);

    // Show the nav (the container's transition will handle the fade/slide)
    floatingNavContainer.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-full');
    // No specific button animation needed here as requested.
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
  const groupedQuizzes = quizList.reduce((acc, quiz) => {
    const category = quiz.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(quiz);
    return acc;
  }, {});

  // Sort quizzes within each category using natural sort for consistent ordering.
  // This ensures that "Quiz 2" comes before "Quiz 10".
  Object.keys(groupedQuizzes).forEach(categoryKey => {
    groupedQuizzes[categoryKey].sort((a, b) => a.title.localeCompare(b.title, 'th', { numeric: true, sensitivity: 'base' }));
  });

  // 2. Sort categories based on the 'order' property for consistent display
  const sortedCategories = Object.keys(groupedQuizzes).sort((a, b) => {
    // --- Custom Sort Logic: Force 'AstronomyReview' to be first ---
    if (a === 'AstronomyReview' && b !== 'AstronomyReview') return -1;
    if (a !== 'AstronomyReview' && b === 'AstronomyReview') return 1;

    // --- Default Sort Logic: Use the 'order' property from data-manager ---
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

  // Create and append the floating navigation container
  const floatingNavContainer = document.createElement('div');
  floatingNavContainer.id = 'floating-nav-container';
  floatingNavContainer.className = 'fixed bottom-4 left-1/2 p-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm shadow-xl rounded-t-xl transform -translate-x-1/2 opacity-0 pointer-events-none translate-y-full transition-all duration-300 z-40 border border-gray-200 dark:border-gray-700';
  floatingNavContainer.innerHTML = `<div id="floating-nav-buttons" class="flex flex-row items-center gap-2"></div>`;
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
      updateFloatingNav(currentlyOpenSectionToggle, sectionToggles);
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
      } else {
        // If the section is already open, the click won't change the state,
        // so we need to manually ensure the floating nav is visible and updated.
        updateFloatingNav(targetToggle, sectionToggles);
      }
      // Use a longer timeout here as well to ensure any closing animation has finished
      // before scrolling, which gives a more stable final position. The animation
      // is 500ms, so we wait slightly longer.
      setTimeout(() => scrollToElement(targetSection), SCROLL_DELAY);
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
