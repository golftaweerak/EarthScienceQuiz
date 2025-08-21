import { quizList } from "../data/quizzes-list.js";
import { getSavedCustomQuizzes } from "./custom-quiz-handler.js";
import { categoryDetails } from "./data-manager.js";

/**
 * Retrieves all finished quiz stats from localStorage.
 * @returns {Array<object>} An array of quiz objects merged with their progress.
 */
function getAllStats() {
  const allQuizzes = [...quizList, ...getSavedCustomQuizzes()];
  const allStats = [];

  for (const quiz of allQuizzes) {
    const data = localStorage.getItem(quiz.storageKey);
    if (data) {
      try {
        const progress = JSON.parse(data);
        const totalQuestions = progress.shuffledQuestions?.length || 0;
        const answeredCount = progress.userAnswers?.filter((a) => a !== null).length || 0;
        const isFinished = totalQuestions > 0 && answeredCount >= totalQuestions;

        allStats.push({
          ...quiz, // title, category, url, icon etc.
          ...progress, // score, userAnswers, etc.
          isFinished: isFinished, // Add the calculated property
        });
      } catch (e) {
        console.error(`Failed to parse stats for ${quiz.storageKey}`, e);
      }
    }
  }

  return allStats;
}

/**
 * Calculates aggregate summary statistics from all completed quizzes.
 * @param {Array<object>} stats - The array of stats from getAllStats.
 * @param {number} totalAvailableQuizzes - The total number of quizzes available (static + custom).
 * @returns {object} An object containing summary data.
 */
function calculateSummary(stats, totalAvailableQuizzes) {
  let totalCorrect = 0;
  let totalAnswered = 0;

  stats.forEach((stat) => {
    totalCorrect += stat.score;
    // If userAnswers exists, count the non-null entries. Otherwise, it's 0.
    totalAnswered += stat.userAnswers?.filter((a) => a !== null).length || 0;
  });

  const averageScore =
    totalAnswered > 0 ? (totalCorrect / totalAnswered) * 100 : 0;

  const completedQuizzes = stats.filter((s) => s.isFinished).length;

  return {
    totalCorrect,
    totalIncorrect: totalAnswered - totalCorrect,
    totalQuestions: totalAnswered,
    completedQuizzes: completedQuizzes,
    inProgressQuizzes: stats.length - completedQuizzes,
    averageScore: averageScore.toFixed(1),
    totalQuizCount: totalAvailableQuizzes,
  };
}

/**
 * Calculates performance metrics for each quiz category.
 * @param {Array<object>} stats - The array of stats from getAllStats.
 * @returns {Array<object>} An array of objects, each representing a category's performance.
 */
function calculateGroupedCategoryPerformance(stats) {
    const performanceByMain = {};

    stats.forEach(stat => {
        if (!stat.userAnswers) return;

        stat.userAnswers.forEach(answer => {
            if (!answer || !answer.subCategory) return;

            let mainCategory = stat.category; // Use the quiz's main category
            let subCategoryName = 'Uncategorized';

            if (typeof answer.subCategory === 'object' && answer.subCategory.specific) {
                // If the question itself defines a main category, use it. This is more specific.
                mainCategory = answer.subCategory.main || mainCategory;
                subCategoryName = answer.subCategory.specific;
            } else if (typeof answer.subCategory === 'string') {
                // If it's a string, treat it as the main category for grouping.
                mainCategory = answer.subCategory;
                subCategoryName = "ภาพรวม"; // Use a generic name for the sub-item.
            }

            if (!mainCategory) mainCategory = 'Uncategorized';

            if (!performanceByMain[mainCategory]) {
                performanceByMain[mainCategory] = {};
            }
            if (!performanceByMain[mainCategory][subCategoryName]) {
                performanceByMain[mainCategory][subCategoryName] = { correct: 0, total: 0 };
            }

            performanceByMain[mainCategory][subCategoryName].total++;
            if (answer.isCorrect) {
                performanceByMain[mainCategory][subCategoryName].correct++;
            }
        });
    });

    // Convert the nested object into a more usable format for rendering
    const finalGroupedData = {};
    for (const mainCat in performanceByMain) {
        const subCategories = Object.entries(performanceByMain[mainCat])
            .map(([name, data]) => ({
                name,
                ...data,
                averageScore: data.total > 0 ? (data.correct / data.total) * 100 : 0,
            }))
            .filter(item => item.total > 0)
            .sort((a, b) => b.averageScore - a.averageScore); // Sort sub-categories by score
        
        if (subCategories.length > 0) {
            finalGroupedData[mainCat] = subCategories;
        }
    }

    return finalGroupedData;
}
/**
 * Renders the four summary cards at the top of the page.
 * @param {object} summary - The summary object from calculateSummary.
 */
function renderSummaryCards(summary) {
  const container = document.getElementById("summary-cards-grid");
  if (!container) return;

  const completedPercentage =
    summary.totalQuizCount > 0
      ? (summary.completedQuizzes / summary.totalQuizCount) * 100
      : 0;
  const inProgressPercentage =
    summary.totalQuizCount > 0
      ? (summary.inProgressQuizzes / summary.totalQuizCount) * 100
      : 0;
  const correctPercentage =
    summary.totalQuestions > 0
      ? (summary.totalCorrect / summary.totalQuestions) * 100
      : 0;

  const cards = [
    {
      label: "ทำเสร็จแล้ว",
      value: `${summary.completedQuizzes} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">/ ${summary.totalQuizCount} ชุด</span>`,
      percentage: completedPercentage,
      color: "bg-blue-500",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
      iconBgColor: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300",
    },
    {
      label: "กำลังทำ",
      value: `${summary.inProgressQuizzes} <span class="text-sm font-normal text-gray-500 dark:text-gray-400">/ ${summary.totalQuizCount} ชุด</span>`,
      percentage: inProgressPercentage,
      color: "bg-indigo-500",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.586a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>`,
      iconBgColor: "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300",
    },
    {
      label: "ตอบถูกทั้งหมด",
      value: `${summary.totalCorrect} <span class="font-normal text-gray-500 text-sm">/ ${summary.totalQuestions} ข้อ</span>`,
      percentage: correctPercentage,
      color: "bg-green-500",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`,
      iconBgColor: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300",
    },
    {
      label: "คะแนนเฉลี่ย",
      value: `${summary.averageScore}%`,
      percentage: parseFloat(summary.averageScore),
      color: "bg-purple-500",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>`,
      iconBgColor: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400",
    },
  ];

  container.innerHTML = cards
    .map((card) => {
      const percentage = card.percentage.toFixed(0);
      return `
        <div class="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div class="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${card.iconBgColor}">
                ${card.icon}
            </div>
            <div class="flex-grow">
                <div class="flex justify-between items-baseline mb-1">
                    <span class="font-medium text-gray-700 dark:text-gray-200 text-sm">${card.label}</span>
                    <span class="font-bold text-xl text-gray-800 dark:text-gray-100 flex-shrink-0 text-sm">${card.value}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="${card.color} h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        </div>
        `;
    })
    .join("");
}

/**
 * Renders the overall progress donut chart.
 * @param {object} summary - The summary object from calculateSummary.
 */
function renderOverallChart(summary) {
  const ctx = document.getElementById("overall-chart")?.getContext("2d");
  if (!ctx) return;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["ตอบถูก", "ตอบผิด"],
      datasets: [
        {
          data: [summary.totalCorrect, summary.totalIncorrect],
          backgroundColor: ["#22c55e", "#ef4444"],
          borderColor: document.body.classList.contains("dark")
            ? "#1f2937" // Use gray-800 to match the card background in dark mode
            : "#ffffff",
          borderWidth: 4,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: document.body.classList.contains("dark")
              ? "#e5e7eb" // gray-200 for better contrast in dark mode
              : "#374151", // gray-700 for better readability
            font: { family: "'Kanit', sans-serif", size: 14 },
          },
        },
        tooltip: {
          titleFont: { family: "'Kanit', sans-serif" },
          bodyFont: { family: "'Sarabun', sans-serif" },
        },
      },
    },
  });
}

/**
 * Renders the category and sub-category performance as a series of accordions.
 * @param {object} groupedData - Data from calculateGroupedCategoryPerformance.
 */
function renderCategoryAccordions(groupedData) {
    const container = document.getElementById("category-accordion-container");
    if (!container) return;

    // Add the title here dynamically
    container.innerHTML = `<h2 class="text-xl font-bold font-kanit text-center md:text-left mb-4">คะแนนเฉลี่ยตามหมวดหมู่</h2>`;

    const sortedMainCategories = Object.keys(groupedData).sort((a, b) => {
        const orderA = categoryDetails[a]?.order || 99;
        const orderB = categoryDetails[b]?.order || 99;
        return orderA - orderB;
    });

    if (sortedMainCategories.length === 0) {
        container.innerHTML += `<p class="text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูลคะแนนตามหมวดหมู่</p>`;
        return;
    }

    sortedMainCategories.forEach(mainCategoryKey => {
        const subCategories = groupedData[mainCategoryKey];
        const mainCategoryDetails = categoryDetails[mainCategoryKey];
        if (!mainCategoryDetails || subCategories.length === 0) return;

        // Calculate overall stats for the main category header
        const mainCatStats = subCategories.reduce((acc, sub) => {
            acc.correct += sub.correct;
            acc.total += sub.total;
            return acc;
        }, { correct: 0, total: 0 });
        const mainCatAvg = mainCatStats.total > 0 ? (mainCatStats.correct / mainCatStats.total) * 100 : 0;
        const mainCatPercentage = mainCatAvg.toFixed(0);
        const mainCatColorClass = mainCatAvg >= 75 ? 'bg-green-500' : mainCatAvg >= 50 ? 'bg-yellow-500' : 'bg-red-500';

        const accordion = document.createElement('div');
        accordion.className = 'bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden';

        const subCategoryItemsHTML = subCategories.map(data => {
            const percentage = data.averageScore.toFixed(0);
            const colorClass = percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
            return `
                <div class="p-3 border-t border-gray-200 dark:border-gray-700/50">
                    <div class="flex justify-between items-center text-sm">
                        <span class="font-medium text-gray-700 dark:text-gray-200">${data.name}</span>
                        <span class="font-semibold text-gray-800 dark:text-gray-100">${data.correct}/${data.total} <span class="font-normal text-gray-500 dark:text-gray-400">(${percentage}%)</span></span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1.5">
                        <div class="${colorClass} h-2 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        accordion.innerHTML = `
            <div class="category-accordion-toggle flex justify-between items-center cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div class="flex items-center flex-grow min-w-0 gap-4">
                    <div class="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center border-4 ${mainCategoryDetails.color} bg-white p-1.5">
                        <img src="${mainCategoryDetails.icon}" alt="${mainCategoryDetails.displayName} Icon" class="h-full w-full object-contain">
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="flex justify-between items-baseline mb-1">
                            <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 font-kanit truncate pr-2">${mainCategoryDetails.displayName}</h3>
                            <span class="font-kanit font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0">${mainCatPercentage}%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div class="${mainCatColorClass} h-2.5 rounded-full" style="width: ${mainCatPercentage}%"></div>
                        </div>
                    </div>
                </div>
                <svg class="chevron-icon h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </div>
            <div class="specific-categories-container grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out">
                <div class="overflow-hidden">
                    ${subCategoryItemsHTML}
                </div>
            </div>
        `;
        container.appendChild(accordion);
    });

    // Add event listeners for the new accordions
    container.addEventListener('click', (e) => {
        const toggle = e.target.closest('.category-accordion-toggle');
        if (!toggle) return;

        const content = toggle.nextElementSibling;
        const icon = toggle.querySelector('.chevron-icon');
        const isOpen = content.classList.contains('grid-rows-[1fr]');
        content.classList.toggle('grid-rows-[1fr]', !isOpen);
        content.classList.toggle('grid-rows-[0fr]', isOpen);
        icon.classList.toggle('rotate-180', !isOpen);
    });
}
/**
 * Renders the detailed list of completed quizzes.
 * @param {Array<object>} stats - The array of stats from getAllStats.
 */
function renderDetailedList(stats) {
  const container = document.getElementById("detailed-stats-container");
  if (!container) return;

  // Sort by finished status first, then by most recent activity
  stats.sort((a, b) => {
    if (a.isFinished !== b.isFinished) {
      return a.isFinished ? 1 : -1; // In-progress quizzes on top
    }
    // For timestamp, use completed time if available, otherwise last answered time
    const timeA = a.completedTimestamp || a.lastAnsweredTimestamp || 0;
    const timeB = b.completedTimestamp || b.lastAnsweredTimestamp || 0;
    return timeB - timeA; // Most recent first
  });

  container.innerHTML = stats
    .map((stat) => {
      const categoryDetail = categoryDetails[stat.category];
      const borderColorClass = categoryDetail?.color || "border-gray-400";
      const totalQuestions = stat.shuffledQuestions?.length || 0;
      const answeredCount = stat.userAnswers?.filter((a) => a !== null).length || 0;
      const progressPercentage = totalQuestions > 0 ? ((answeredCount / totalQuestions) * 100).toFixed(0) : 0;
      const scorePercentage = answeredCount > 0 ? ((stat.score / answeredCount) * 100).toFixed(0) : 0;
      const link = stat.isFinished
        ? `${stat.url}?action=view_results`
        : stat.url;
      const secondaryTextHtml = stat.isFinished
        ? `<p class="text-sm font-medium text-green-600 dark:text-green-400">ทำเสร็จแล้ว</p>`
        : `<p class="text-sm text-gray-500 dark:text-gray-400">ทำไป ${answeredCount}/${totalQuestions} ข้อ (${progressPercentage}%)</p>`;

      const scoreHtml = answeredCount > 0 ? `
        <div class="flex-shrink-0 text-right w-16">
            <p class="font-bold font-kanit text-lg ${scorePercentage >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-500"}">${scorePercentage}%</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">คะแนน</p>
        </div>
      ` : `<div class="flex-shrink-0 w-16"></div>`; // Placeholder for alignment

      return `
        <a href="${link}" class="flex items-center gap-4 p-3 rounded-lg bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border border-gray-200 dark:border-gray-700">
            <div class="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center border-2 ${borderColorClass} bg-white p-1">
                <img src="${stat.icon}" alt="${stat.altText}" class="h-full w-full object-contain">
            </div>
            <div class="flex-grow min-w-0">
                <p class="font-bold text-gray-800 dark:text-gray-200 truncate">${stat.title}</p>
                ${secondaryTextHtml}
            </div>
            ${scoreHtml}
        </a>
      `;
    })
    .join("");
}

/**
 * Main function to build the entire stats page.
 * It orchestrates fetching, calculating, and rendering all components.
 */
export function buildStatsPage() {
  const loadingSpinner = document.getElementById("loading-spinner");
  const noStatsMessage = document.getElementById("no-stats-message");
  const statsContent = document.getElementById("stats-content");

  const allStats = getAllStats();
  const totalAvailableQuizzes = quizList.length + getSavedCustomQuizzes().length;

  loadingSpinner.classList.add("hidden");

  if (allStats.length === 0) {
    noStatsMessage.classList.remove("hidden");
    document.getElementById("clear-stats-btn").disabled = true;
  } else {
    const groupedData = calculateGroupedCategoryPerformance(allStats);
    const summary = calculateSummary(allStats, totalAvailableQuizzes);
    renderSummaryCards(summary);
    renderOverallChart(summary);
    renderCategoryAccordions(groupedData);
    renderDetailedList(allStats);
    statsContent.classList.add("anim-fade-in");
    statsContent.style.opacity = 1;
  }
}
