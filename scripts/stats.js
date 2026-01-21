import { quizList } from "../data/quizzes-list.js";
import { getSavedCustomQuizzes } from "./custom-quiz-handler.js";
import { categoryDetails, getCategoryDisplayName } from "./data-manager.js";
import { PROFICIENCY_GROUPS } from './gamification.js'; // NEW: Import for consistent grouping
import { ModalHandler } from "./modal-handler.js";

/**
 * Converts a Tailwind CSS border color class to an RGBA string.
 * @param {string} tailwindClass - The Tailwind class (e.g., 'border-red-500').
 * @param {number} [opacity=0.7] - The desired opacity.
 * @returns {string} The RGBA color string.
 */
function tailwindBorderToRgba(tailwindClass, opacity = 0.7) {
    const colorMap = {
        'border-gray-500': '107, 114, 128',
        'border-indigo-500': '99, 102, 241',
        'border-teal-500': '20, 184, 166',
        'border-orange-500': '249, 115, 22',
        'border-orange-400': '251, 146, 60',
        'border-rose-400': '251, 113, 133',
        'border-red-500': '239, 68, 68',
        'border-amber-500': '245, 158, 11',
        'border-green-400': '74, 222, 128',        
        'border-green-500': '34, 197, 94',
        'border-blue-500': '59, 130, 246',
        'border-purple-500': '168, 85, 247',        
        'border-indigo-600': '79, 70, 229', // Dark Indigo
    };
    const rgb = colorMap[tailwindClass] || '107, 114, 128'; // Default to gray
    return `rgba(${rgb}, ${opacity})`;
}

/**
 * Converts a Tailwind CSS border color class to a HEX string.
 * @param {string} tailwindClass - The Tailwind class (e.g., 'border-red-500').
 * @returns {string} The HEX color string.
 */
function tailwindBorderToHex(tailwindClass) {
    const colorMap = {
        'border-gray-500': '#6b7280', 'border-indigo-500': '#6366f1', 'border-teal-500': '#14b8a6',
        'border-orange-500': '#f97316', 'border-orange-400': '#fb923c',
        'border-rose-400': '#fb7185', 'border-green-400': '#4ade80',
        'border-green-500': '#22c55e',
        'border-blue-500': '#3b82f6',
        'border-purple-500': '#a855f7',
        'border-red-500': '#ef4444',
        'border-amber-500': '#f59e0b',
        'border-indigo-600': '#4f46e5', // Dark Indigo
    };
    return colorMap[tailwindClass] || '#6b7280'; // Default to gray
}

/**
 * Retrieves all finished quiz stats from localStorage.
 * @returns {Array<object>} An array of quiz objects merged with their progress.
 */
function getAllStats(customQuizzes) {
  const allQuizzes = [...quizList, ...customQuizzes];
  const allStats = [];

  for (const quiz of allQuizzes) {
    const storageKey = quiz.storageKey || `quizState-${quiz.id || quiz.customId}`;
    const data = localStorage.getItem(storageKey);
    if (data) {
      try { // Wrap the entire processing of a single item in a try-catch
        const progress = JSON.parse(data);

        // Add a more robust check for a valid progress object.
        // Old data might be malformed or incomplete.
        if (!progress || typeof progress !== 'object' || !Array.isArray(progress.userAnswers)) {
            console.warn(`Skipping invalid or incomplete stats for ${quiz.storageKey}`);
            continue; // Skip this item and move to the next one
        }

        const totalQuestions = progress.shuffledQuestions?.length || 0;
        const answeredCount = progress.userAnswers.filter((a) => a !== null).length;
        const isFinished = totalQuestions > 0 && answeredCount >= totalQuestions;

        let finalUrl = quiz.url;
        if (!finalUrl && quiz.customId) {
          finalUrl = `./quiz/index.html?id=${quiz.customId}`;
        }

        allStats.push({
          ...quiz, // title, category, url, icon etc.
          ...progress, // score, userAnswers, etc.
          storageKey: storageKey, // Ensure the correct storageKey is carried forward
          url: finalUrl,
          isFinished: isFinished,
        });
      } catch (e) {
        console.error(`Failed to process stats for ${quiz.storageKey}. Data might be corrupted.`, e);
      }
    }
  }

  return allStats;
}

/**
 * NEW: Calculates the score trend over time for completed quizzes.
 * @param {Array<object>} stats - The array of stats from getAllStats.
 * @returns {{labels: Array<string>, data: Array<number>}} An object for Chart.js.
 */
function calculateScoreTrend(stats) {
    const finishedQuizzes = stats
        .filter(stat => stat.isFinished && stat.lastAttemptTimestamp)
        .map(stat => {
            const totalQuestions = stat.shuffledQuestions?.length || 0;
            const score = stat.score || 0;
            const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
            return {
                date: new Date(stat.lastAttemptTimestamp),
                score: percentage
            };
        })
        .sort((a, b) => a.date - b.date); // Sort by date ascending

    const labels = finishedQuizzes.map(item => item.date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }));
    const data = finishedQuizzes.map(item => item.score);

    return { labels, data };
}

/**
 * NEW: Calculates performance for each specific topic/learning outcome.
 * @param {Array<object>} stats - The array of all quiz progress data.
 * @returns {{best: object|null, worst: object|null}}
 */
function calculateProficiencyPerformance(stats) {
    const performanceByGroup = {};
    Object.keys(PROFICIENCY_GROUPS).forEach(key => {
        performanceByGroup[key] = { correct: 0, total: 0 };
    });
    // NEW: Add a bucket for uncategorized questions to ensure all questions are counted.
    performanceByGroup['General'] = { correct: 0, total: 0 };

    stats.forEach(stat => {
        if (!stat.userAnswers || !stat.shuffledQuestions) return;
        stat.userAnswers.forEach((answer, index) => {
            if (!answer) return;
            const question = stat.shuffledQuestions[index];
            if (!question) return;

            let subCatStr = '';
            if (question.subCategory) {
                if (typeof question.subCategory === 'string') subCatStr = question.subCategory;
                else if (question.subCategory.main) {
                    subCatStr = question.subCategory.main;
                    if (question.subCategory.specific) {
                        const specific = Array.isArray(question.subCategory.specific) 
                            ? question.subCategory.specific.filter(s => s).join(' ') 
                            : question.subCategory.specific;
                        subCatStr += ' ' + (specific || '');
                    }
                }
            }
            // Also consider the main category of the quiz for broader matching
            subCatStr += ' ' + (question.sourceQuizCategory || stat.category || '');

            let matchedGroup = null;
            const matches = (text, keywords) => keywords.some(k => text.toLowerCase().includes(k.toLowerCase()));

            for (const [groupKey, groupDef] of Object.entries(PROFICIENCY_GROUPS)) {
                if (matches(subCatStr, groupDef.keywords)) {
                    matchedGroup = groupKey;
                    break;
                }
            }

            // If no specific group was matched, categorize it as 'General'.
            const finalGroup = matchedGroup || 'General';
            performanceByGroup[finalGroup].total++;
            if (answer.isCorrect) {
                performanceByGroup[finalGroup].correct++;
            }
        });
    });

    const scoredGroups = Object.entries(performanceByGroup)
        .map(([name, data]) => ({
            name: PROFICIENCY_GROUPS[name]?.label || 'ทั่วไป', // Use optional chaining and a fallback for the 'General' group
            ...data,
            score: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        }))
        .filter(group => group.total >= 5); // Only consider groups with at least 5 questions

    if (scoredGroups.length < 2) {
        return { best: null, worst: null };
    }

    scoredGroups.sort((a, b) => b.score - a.score);

    const best = scoredGroups[0];
    const worst = scoredGroups[scoredGroups.length - 1];

    // Ensure there's a meaningful difference to report
    if (best && worst && best.score > worst.score) {
        return { best, worst };
    }

    return { best: null, worst: null };
}

/**
 * NEW: Calculates performance based on question type (theory vs. calculation).
 * @param {Array<object>} stats - The array of all quiz progress data.
 * @returns {{theory: object, calculation: object}}
 */
function calculateQuestionTypePerformance(stats) {
    const performanceByType = { theory: { correct: 0, total: 0 }, calculation: { correct: 0, total: 0 } };
    stats.forEach(stat => {
        if (!stat.userAnswers || !stat.shuffledQuestions) return;
        stat.userAnswers.forEach((answer, index) => {
            if (!answer) return;
            const question = stat.shuffledQuestions[index];
            if (!question) return;
            const type = question.type === 'fill-in-number' ? 'calculation' : 'theory';
            performanceByType[type].total++;
            if (answer.isCorrect) performanceByType[type].correct++;
        });
    });
    const theoryScore = performanceByType.theory.total > 0 ? (performanceByType.theory.correct / performanceByType.theory.total) * 100 : 0;
    const calcScore = performanceByType.calculation.total > 0 ? (performanceByType.calculation.correct / performanceByType.calculation.total) * 100 : 0;
    return { theory: { ...performanceByType.theory, score: theoryScore }, calculation: { ...performanceByType.calculation, score: calcScore } };
}

/**
 * NEW: Creates a styled card for displaying a single statistic.
 * @param {string} value - The main value of the stat.
 * @param {string} label - The label for the stat.
 * @param {string} icon - The SVG icon HTML string.
 * @param {string} theme - The color theme ('green', 'red', 'blue', 'purple', 'gray').
 * @returns {HTMLElement} The created card element.
 */
function createStatCard(value, label, icon, theme) {
    const themeClasses = {
        green: { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300" },
        red: { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-700 dark:text-red-300" },
        blue: { bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-700 dark:text-blue-300" },
        purple: { bg: "bg-purple-100 dark:bg-purple-900/40", text: "text-purple-700 dark:text-purple-400" },
        gray: { bg: "bg-gray-100 dark:bg-gray-700/60", text: "text-gray-700 dark:text-gray-300" },
    };
    const classes = themeClasses[theme] || themeClasses.gray;

    const card = document.createElement("div");
    card.className = `flex items-center gap-4 p-4 bg-white dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700`;
    card.innerHTML = `
        <div class="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${classes.bg} ${classes.text}">
            ${icon}
        </div>
        <div>
            <p class="text-xl font-bold text-gray-800 dark:text-gray-200">${value}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">${label}</p>
        </div>
    `;
    return card;
}

/**
 * NEW: Renders in-depth statistics like average time per question.
 * @param {Array<object>} allStats - The array of all quiz progress data.
 */
function renderInDepthStats(allStats) {
    const container = document.getElementById('summary-cards-grid');
    if (!container) return;

    // --- 1. Calculate Average Time Per Question ---
    const attemptedStats = allStats.filter(quiz => quiz.userAnswers && quiz.userAnswers.some(a => a !== null));
    const totalTimeSpentSeconds = attemptedStats.reduce((sum, quiz) => sum + (quiz.totalTimeSpent || 0), 0);
    const totalQuestionsAnswered = attemptedStats.reduce((sum, quiz) => sum + (quiz.shuffledQuestions?.length || 0), 0);

    const averageTimePerQuestion = totalQuestionsAnswered > 0
        ? (totalTimeSpentSeconds / totalQuestionsAnswered)
        : 0;
    const timeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>`;

    if (totalQuestionsAnswered > 0) {
        const avgTimeCard = createStatCard(
            `${averageTimePerQuestion.toFixed(1)} วิ/ข้อ`,
            'เวลาเฉลี่ยต่อข้อ',
            timeIcon,
            'purple'
        );
        container.appendChild(avgTimeCard);
    }

    // --- 2. Calculate and Render Best/Worst Topics ---
    const proficiencyPerformance = calculateProficiencyPerformance(allStats);
    if (proficiencyPerformance.best) {
        const bestTopicIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`;
        const bestTopicCard = createStatCard(`${proficiencyPerformance.best.score.toFixed(0)}%`, `หมวดที่ถนัด: ${proficiencyPerformance.best.name}`, bestTopicIcon, 'green');
        container.appendChild(bestTopicCard);
    }
    if (proficiencyPerformance.worst) {
        const worstTopicIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>`;
        const worstTopicCard = createStatCard(`${proficiencyPerformance.worst.score.toFixed(0)}%`, `ควรทบทวน: ${proficiencyPerformance.worst.name}`, worstTopicIcon, 'red');
        container.appendChild(worstTopicCard);
    }

    // --- 3. Calculate and Render Question Type Performance ---
    const typePerformance = calculateQuestionTypePerformance(allStats);
    const theoryIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" /></svg>`;
    const calcIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zM6 7a1 1 0 011-1h4a1 1 0 110 2H7a1 1 0 01-1-1zm0 3a1 1 0 100 2h4a1 1 0 100-2H6z" clip-rule="evenodd" /></svg>`;
    
    if (typePerformance.theory.total > 0) {
        const theoryCard = createStatCard(`${typePerformance.theory.score.toFixed(0)}%`, `ความแม่นยำ (ทฤษฎี)`, theoryIcon, 'blue');
        container.appendChild(theoryCard);
    }
    if (typePerformance.calculation.total > 0) {
        const calcCard = createStatCard(`${typePerformance.calculation.score.toFixed(0)}%`, `ความแม่นยำ (คำนวณ)`, calcIcon, 'blue');
        container.appendChild(calcCard);
    }
}

/**
 * NEW: Calculates the distribution of scores for completed quizzes.
 * @param {Array<object>} stats - The array of stats from getAllStats.
 * @returns {{labels: Array<string>, data: Array<number>}} An object for Chart.js.
 */
function calculateScoreDistribution(stats) {
    const scoreBins = {
        '0-9%': 0, '10-19%': 0, '20-29%': 0, '30-39%': 0, '40-49%': 0,
        '50-59%': 0, '60-69%': 0, '70-79%': 0, '80-89%': 0, '90-100%': 0
    };

    stats.filter(s => s.isFinished).forEach(stat => {
        const total = stat.shuffledQuestions?.length || 0;
        const score = stat.score || 0;
        if (total > 0) {
            const percentage = (score / total) * 100;
            if (percentage >= 90) scoreBins['90-100%']++;
            else if (percentage >= 80) scoreBins['80-89%']++;
            else if (percentage >= 70) scoreBins['70-79%']++;
            else if (percentage >= 60) scoreBins['60-69%']++;
            else if (percentage >= 50) scoreBins['50-59%']++;
            else if (percentage >= 40) scoreBins['40-49%']++;
            else if (percentage >= 30) scoreBins['30-39%']++;
            else if (percentage >= 20) scoreBins['20-29%']++;
            else if (percentage >= 10) scoreBins['10-19%']++;
            else scoreBins['0-9%']++;
        }
    });

    return {
        labels: Object.keys(scoreBins),
        data: Object.values(scoreBins)
    };
}

/**
 * NEW: Renders the score trend line chart.
 * @param {object} trendData - Data from calculateScoreTrend.
 */
function renderScoreTrendChart(trendData) {
    const canvas = document.getElementById('score-trend-chart');
    const chartContainer = canvas?.closest('section');
    const ctx = canvas?.getContext('2d');

    // Destroy existing chart to prevent duplicates on re-render
    if (ctx) {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
    }
    if (!ctx || !chartContainer) return;

    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded. Skipping score trend chart.");
        return;
    }

    // Remove any existing no-data message
    const existingMsg = chartContainer.querySelector('.no-data-message');
    if (existingMsg) existingMsg.remove();

    // If there's not enough data to show a meaningful trend, display a message instead.
    if (trendData.labels.length < 2) {
        canvas.classList.add('hidden');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'no-data-message flex items-center justify-center h-56';
        msgDiv.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">ทำแบบทดสอบให้เสร็จอย่างน้อย 2 ชุด<br>เพื่อดูแนวโน้มคะแนนของคุณที่นี่</p>`;
        // Append message after the title (assuming title is the first child of section)
        chartContainer.appendChild(msgDiv);
        return;
    }
    
    // Show canvas
    canvas.classList.remove('hidden');

    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [{
                label: 'คะแนน (%)',
                data: trendData.data,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgba(59, 130, 246, 1)',
                tension: 0.3,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100, ticks: { color: textColor, callback: value => value + '%' }, grid: { color: gridColor } }, x: { ticks: { color: textColor }, grid: { display: false } } },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` คะแนน: ${context.raw.toFixed(1)}%` } } }
        }
    });
}

/**
 * NEW: Renders the score distribution bar chart.
 * @param {object} distributionData - Data from calculateScoreDistribution.
 */
function renderScoreDistributionChart(distributionData) {
    const canvas = document.getElementById('score-distribution-chart');
    const chartContainer = canvas?.closest('section');
    const ctx = canvas?.getContext('2d');

    if (ctx) {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) existingChart.destroy();
    }
    if (!ctx || !chartContainer) return;

    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded. Skipping score distribution chart.");
        return;
    }

    // Remove any existing no-data message
    const existingMsg = chartContainer.querySelector('.no-data-message');
    if (existingMsg) existingMsg.remove();

    const totalScores = distributionData.data.reduce((a, b) => a + b, 0);
    if (totalScores === 0) {
        canvas.classList.add('hidden');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'no-data-message flex items-center justify-center h-56';
        msgDiv.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400">ทำแบบทดสอบให้เสร็จเพื่อดูการกระจายของคะแนน</p>`;
        chartContainer.appendChild(msgDiv);
        return;
    }

    // Show canvas
    canvas.classList.remove('hidden');

    const isDarkMode = document.documentElement.classList.contains('dark');
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: distributionData.labels,
            datasets: [{
                label: 'จำนวนครั้ง',
                data: distributionData.data,
                backgroundColor: 'rgba(168, 85, 247, 0.7)',
                borderColor: 'rgba(168, 85, 247, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: textColor, precision: 0 },
                    title: { display: true, text: 'จำนวนครั้ง', color: textColor },
                    grid: { color: gridColor }
                },
                x: { ticks: { color: textColor }, title: { display: true, text: 'ช่วงคะแนน', color: textColor }, grid: { display: false } }
            },
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => ` จำนวน: ${context.raw} ครั้ง` } } }
        }
    });
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
    totalCorrect += stat.score || 0;
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
 * Calculates the average score for each main subject category.
 * @param {Array<object>} stats - The array of stats from getAllStats.
 * @returns {Array<object>} A sorted array of objects, each containing subject name, score, and order.
 */
function calculateSubjectPerformance(stats) {
    const performanceBySubject = {};

  // Iterate through each quiz session
  stats.forEach((stat) => {
    // Ensure there are answers to process
    if (!stat.userAnswers) return;

    // Iterate through each answer within the session
    stat.userAnswers.forEach((answer) => {
      if (!answer) return; // Skip if an answer is null (e.g., skipped question)

      // Use the question's own original category for accurate grouping
      const subject = answer.sourceQuizCategory || stat.category || "Uncategorized";

      if (!performanceBySubject[subject]) {
        performanceBySubject[subject] = { correct: 0, total: 0 };
      }
      performanceBySubject[subject].total++;
      if (answer.isCorrect) {
        performanceBySubject[subject].correct++;
      }
    });
  });
    return Object.entries(performanceBySubject)
        .map(([subjectKey, data]) => {
            const details = categoryDetails[subjectKey] || { order: 99 };
            return {
                subjectKey: subjectKey,
                subject: getCategoryDisplayName(subjectKey),
                score: data.total > 0 ? (data.correct / data.total) * 100 : 0,
                order: details.order,
            };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => a.order - b.order);
}
/**
 * Calculates performance metrics grouped by subject (category), then by chapter (main subCategory),
 * and finally by learning outcome/specific topic (specific subCategory).
 * @param {Array<object>} stats - The array of stats from getAllStats, which includes userAnswers.
 * @returns {object} A nested object representing the grouped performance data.
 */
function calculateGroupedPerformance(stats) {
    const performanceBySubject = {};

    stats.forEach(stat => {
        if (!stat.userAnswers) return;

        stat.userAnswers.forEach(answer => {
            // Defensive check: Ensure 'answer' is not null before accessing its properties.
            // This handles old data formats and prevents crashes from skipped questions.
            if (!answer) {
                return;
            }

            // Use the question's own original category if available, otherwise fall back to the quiz's category.
            const subject = answer.sourceQuizCategory || stat.category || 'Uncategorized';
            
            let chapter;
            let learningOutcomes = [];

            if (answer.subCategory && typeof answer.subCategory === 'object' && answer.subCategory.main) {
                chapter = answer.subCategory.main;
                const specific = answer.subCategory.specific;
                if (Array.isArray(specific)) {
                    learningOutcomes = specific.filter(s => s);
                    if (learningOutcomes.length === 0) learningOutcomes = ['General'];
                } else {
                    learningOutcomes = [specific || 'General'];
                }
            } else {
                chapter = (typeof answer.subCategory === 'string') ? answer.subCategory : 'General';
                learningOutcomes = ['General'];
            }

            // Initialize structures
            if (!performanceBySubject[subject]) {
                performanceBySubject[subject] = {};
            }
            if (!performanceBySubject[subject][chapter]) {
                performanceBySubject[subject][chapter] = {};
            }

            learningOutcomes.forEach(outcome => {
                if (!performanceBySubject[subject][chapter][outcome]) {
                    performanceBySubject[subject][chapter][outcome] = { correct: 0, total: 0 };
                }

                // Increment counts.
                performanceBySubject[subject][chapter][outcome].total++;
                if (answer.isCorrect) {
                    performanceBySubject[subject][chapter][outcome].correct++;
                }
            });
        });
    });

    const finalGroupedData = {};
    for (const subject in performanceBySubject) {
        finalGroupedData[subject] = {};
        for (const chapter in performanceBySubject[subject]) {
            const outcomes = Object.entries(performanceBySubject[subject][chapter])
                .map(([name, data]) => ({
                    name, ...data,
                    averageScore: data.total > 0 ? (data.correct / data.total) * 100 : 0,
                }))
                .filter(item => item.total > 0)
                .sort((a, b) => a.name.localeCompare(b.name, 'th'));

            if (outcomes.length > 0) {
                finalGroupedData[subject][chapter] = outcomes;
            }
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
      // Redesigned card for a more compact 2-column layout on all screen sizes, with added effects.
            return `
        <div class="bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700 dark:text-gray-200 text-sm">${card.label}</span>
                <div class="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center ${card.iconBgColor}">
                    ${card.icon}
                </div>
                    </div>
            <div>
                <span class="font-bold text-2xl text-gray-800 dark:text-gray-100">${card.value}</span>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                    <div class="${card.color} h-2 rounded-full progress-bar-animated" style="width: ${percentage}%"></div>
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
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded. Skipping overall chart.");
        return;
    }
    const ctx = document.getElementById("overall-chart")?.getContext("2d");

    // Destroy existing chart to prevent duplicates on re-render
    if (ctx) {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
    }
    if (!ctx) return;

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["ตอบถูก", "ตอบผิด"],
            datasets: [
                {
                    data: [summary.totalCorrect, summary.totalIncorrect],
                    backgroundColor: ["#22c55e", "#ef4444"],
                    borderColor: document.documentElement.classList.contains("dark")
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
                        color: document.documentElement.classList.contains("dark")
                            ? "#d1d5db" // gray-300 for better contrast in dark mode
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
 * Renders a horizontal bar chart showing the average score per subject.
 * @param {Array<object>} subjectData - Data from calculateSubjectPerformance.
 */
function renderSubjectPerformanceChart(subjectData) {
    if (typeof Chart === 'undefined') {
        console.warn("Chart.js is not loaded. Skipping subject performance chart.");
        return;
    }
    const ctx = document.getElementById('subject-performance-chart')?.getContext('2d');
    
    // Destroy existing chart to prevent duplicates on re-render
    if (ctx) {
        const existingChart = Chart.getChart(ctx);
        if (existingChart) {
            existingChart.destroy();
        }
    }

    if (!ctx || subjectData.length === 0) return;

    const labels = subjectData.map(d => d.subject);
    const scores = subjectData.map(d => d.score);
    const backgroundColors = subjectData.map(d => {
        const details = categoryDetails[d.subjectKey] || {};
        return tailwindBorderToRgba(details.color || 'border-gray-500', 0.7);
    });
    const borderColors = subjectData.map(d => {
        const details = categoryDetails[d.subjectKey] || {};
        return tailwindBorderToHex(details.color || 'border-gray-500');
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'คะแนนเฉลี่ย (%)',
                data: scores,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            indexAxis: 'y', // Make it a horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                        callback: function(value) {
                            return value + '%'
                        }
                    }
                },
                y: {
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151',
                        font: { family: "'Kanit', sans-serif" }
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: context => `คะแนนเฉลี่ย: ${context.raw.toFixed(1)}%` } }
            }
        }
    });
}

/**
 * Initializes the tab navigation functionality.
 */
export function initializeTabs() {
    const tabContainer = document.querySelector('[aria-label="Tabs"]');
    if (!tabContainer) return;

    const tabs = tabContainer.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    const activeTabClasses = ['border-blue-500', 'text-blue-600', 'dark:border-blue-400', 'dark:text-blue-400', 'font-bold'];
    const inactiveTabClasses = ['border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300', 'dark:text-gray-400', 'dark:hover:text-gray-200', 'dark:hover:border-gray-500', 'font-medium'];

    tabContainer.addEventListener('click', (e) => {
        const clickedTab = e.target.closest('[role="tab"]');
        if (!clickedTab) return;

        // Deactivate all tabs and hide all panels
        tabs.forEach(tab => {
            tab.setAttribute('aria-selected', 'false');
            tab.classList.remove(...activeTabClasses);
            tab.classList.add(...inactiveTabClasses);
            
            const panelId = tab.getAttribute('aria-controls');
            const panel = document.getElementById(panelId);
            if (panel) panel.classList.add('hidden');
        });

        // Activate the clicked tab and show its panel
        clickedTab.setAttribute('aria-selected', 'true');
        clickedTab.classList.remove(...inactiveTabClasses);
        clickedTab.classList.add(...activeTabClasses);
        const activePanel = document.getElementById(clickedTab.getAttribute('aria-controls'));
        if (activePanel) activePanel.classList.remove('hidden');
    });
}
/**
 * Renders the performance data as a series of nested accordions, grouped by subject and then chapter.
 * @param {object} groupedData - Data from calculateGroupedCategoryPerformance.
 */
function renderPerformanceAccordions(groupedData) {
    const container = document.getElementById("subject-performance-container");
    if (!container) return;

    container.innerHTML = `<h2 class="text-2xl font-bold font-kanit text-gray-800 dark:text-gray-100 mb-4">วิเคราะห์คะแนนรายบทเรียน</h2>`;

    const sortedSubjects = Object.keys(groupedData).sort((a, b) => {
        const orderA = categoryDetails[a]?.order || 99;
        const orderB = categoryDetails[b]?.order || 99;
        return orderA - orderB;
    });

    if (sortedSubjects.length === 0 || Object.values(groupedData).every(subject => Object.keys(subject).length === 0)) {
        container.innerHTML += `<p class="text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูลคะแนน</p>`;
        return;
    }

    sortedSubjects.forEach(subjectKey => {
        const chapters = groupedData[subjectKey];
        const subjectDetails = categoryDetails[subjectKey] || { displayName: subjectKey, color: 'border-gray-500', icon: './assets/icons/study.png' };
        if (Object.keys(chapters).length === 0) return;
        const subjectAccordion = document.createElement('div');
        subjectAccordion.className = 'bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden';

        let chapterAccordionsHTML = '';
        const sortedChapters = Object.keys(chapters).sort((a, b) => a.localeCompare(b, 'th'));

        sortedChapters.forEach(chapterTitle => {
            const outcomes = chapters[chapterTitle];
            if (!outcomes || outcomes.length === 0) return;

            const chapterStats = outcomes.reduce((acc, sub) => {
                acc.correct += sub.correct;
                acc.total += sub.total;
                return acc;
            }, { correct: 0, total: 0 });
            const chapterAvg = chapterStats.total > 0 ? (chapterStats.correct / chapterStats.total) * 100 : 0;
            const chapterPercentage = chapterAvg.toFixed(0);
            const chapterColorClass = chapterAvg >= 75 ? 'bg-green-500' : chapterAvg >= 50 ? 'bg-yellow-500' : 'bg-red-500';

            const outcomeItemsHTML = outcomes.map(data => {
                const percentage = data.averageScore;
                const colorClass = percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                return `
                    <div class="p-3 border-t border-gray-200 dark:border-gray-700/50">
                        <div class="flex justify-between items-center text-sm">
                            <span class="font-medium text-gray-700 dark:text-gray-200">${data.name.replace(/^ว\s[\d\.]+\sม\.[\d\/]+\s/, '').replace(/^\d+\.\s/, '').trim()}</span>
                            <span class="font-semibold text-gray-800 dark:text-gray-100">${data.correct}/${data.total} <span class="font-normal text-gray-500 dark:text-gray-400">(${percentage.toFixed(0)}%)</span></span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1.5">
                            <div class="${colorClass} h-2 rounded-full" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                `;
            }).join('');

            chapterAccordionsHTML += `
                <details class="group bg-gray-50 dark:bg-gray-800/30 rounded-lg mx-4 mb-2 border border-gray-200 dark:border-gray-700/50 overflow-hidden">
                    <summary class="flex justify-between items-center cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors list-none">
                        <div class="flex-grow min-w-0">
                            <div class="flex justify-between items-baseline mb-1">
                                <h4 class="text-base font-bold text-gray-800 dark:text-gray-200 font-kanit truncate pr-2">${chapterTitle}</h4>
                                <span class="font-kanit font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0 text-sm sm:text-base">${chapterPercentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div class="${chapterColorClass} h-2.5 rounded-full" style="width: ${chapterPercentage}%"></div>
                            </div>
                        </div>
                        <svg class="chevron-icon h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 sm:ml-4 group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <div class="border-t border-gray-200 dark:border-gray-700/50">
                        ${outcomeItemsHTML}
                    </div>
                </details>
            `;
        });

        // Calculate overall stats for the subject header
        const subjectTotal = Object.values(chapters).flat().reduce((sum, outcome) => sum + outcome.total, 0);
        const subjectCorrect = Object.values(chapters).flat().reduce((sum, outcome) => sum + outcome.correct, 0);
        const subjectAvg = subjectTotal > 0 ? (subjectCorrect / subjectTotal) * 100 : 0;
        const subjectPercentage = subjectAvg.toFixed(0);
        const subjectColorClass = subjectAvg >= 75 ? 'bg-green-500' : subjectAvg >= 50 ? 'bg-yellow-500' : 'bg-red-500';

        subjectAccordion.innerHTML = `
            <details class="group">
                <summary class="flex justify-between items-center cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors list-none">
                    <div class="flex items-center flex-grow min-w-0 gap-3 sm:gap-4">
                        <div class="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border-4 ${subjectDetails.color} bg-white p-1 sm:p-1.5 overflow-hidden">
                            <img src="${subjectDetails.icon}" alt="${subjectDetails.displayName} Icon" class="h-full w-full object-contain">
                        </div>
                        <div class="flex-grow min-w-0">
                            <div class="flex justify-between items-baseline mb-1">
                                <h3 class="text-lg font-bold text-gray-800 dark:text-gray-200 font-kanit truncate pr-2">${subjectDetails.displayName}</h3>
                                <span class="font-kanit font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0 text-base sm:text-lg">${subjectPercentage}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div class="${subjectColorClass} h-2.5 rounded-full" style="width: ${subjectPercentage}%"></div>
                            </div>
                        </div>
                    </div>
                    <svg class="chevron-icon h-6 w-6 text-gray-500 dark:text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 sm:ml-4 group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
                    ${chapterAccordionsHTML}
                </div>
            </details>
        `;
        container.appendChild(subjectAccordion);
    });
}
/**
 * Renders the detailed list of all quizzes taken, ensuring each item is a functional link
 * that allows the user to retake the quiz, now displayed as info-rich cards.
 * @param {Array<object>} stats - The array of stats from getAllStats.
 */
function renderDetailedList(stats) {
    const container = document.getElementById("detailed-stats-container");
    if (!container) return;

    container.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

    stats.sort((a, b) => {
        if (a.isFinished !== b.isFinished) {
            return a.isFinished ? 1 : -1; // In-progress quizzes first
        }
        return (b.lastAttemptTimestamp || 0) - (a.lastAttemptTimestamp || 0); // Then by most recent
    });

    if (stats.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 dark:text-gray-400 md:col-span-2">ไม่มีประวัติการทำแบบทดสอบ</p>`;
        return;
    }

    container.innerHTML = stats.map((stat, index) => {
        const { title, url, isFinished, score, shuffledQuestions, userAnswers, icon, altText, category, storageKey } = stat;
        const totalQuestions = shuffledQuestions?.length || 0;
        const answeredCount = userAnswers?.filter((a) => a !== null).length || 0;
        const scorePercentage = totalQuestions > 0 ? ((score / totalQuestions) * 100).toFixed(0) : 0;

        const categoryDetail = categoryDetails[category];
        const colorName = categoryDetail?.color?.split('-')[1] || 'gray';

        let statusText, statusColor, buttonText, buttonColor;

        if (isFinished) {
            statusText = `ทำเสร็จแล้ว - คะแนน ${scorePercentage}%`;
            statusColor = 'text-green-600 dark:text-green-400';
            buttonText = 'ดูผล / ทำใหม่';
            buttonColor = `bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600`;
        } else {
            statusText = `ทำไป ${answeredCount}/${totalQuestions} ข้อ`;
            statusColor = 'text-blue-600 dark:text-blue-400';
            buttonText = 'ทำต่อ';
            buttonColor = `bg-blue-600 hover:bg-blue-700 text-white`;
        }

        return `
            <div class="stat-quiz-card flex flex-col bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:border-${colorName}-400 dark:hover:border-${colorName}-500 transform hover:-translate-y-1" style="animation-delay: ${index * 50}ms;">
                <div class="flex items-center gap-4 flex-grow">
                    <div class="flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 p-2 overflow-hidden">
                        <img src="${icon || './assets/icons/dices.png'}" alt="${altText || title}" ${index > 4 ? 'loading="lazy"' : ''} class="h-full w-full object-contain">
                    </div>
                    <div class="flex-grow min-w-0">
                        <h4 class="font-bold text-gray-800 dark:text-gray-100 truncate">${title}</h4>
                        <p class="text-sm font-medium ${statusColor}">${statusText}</p>
                    </div>
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <a href="${url}" 
                       data-is-finished="${isFinished}"
                       data-storage-key="${storageKey}"
                       data-quiz-title="${title}"
                       class="quiz-stat-item block w-full text-center px-4 py-2 rounded-md text-sm font-bold transition ${buttonColor}">
                        ${buttonText}
                    </a>
                </div>
            </div>
        `;
    }).join("");
}

/**
 * Shows a modal asking the user whether to view results or restart a completed quiz.
 * @param {string} title - The title of the quiz.
 * @param {string} url - The base URL of the quiz.
 * @param {string} storageKey - The localStorage key for the quiz's progress.
 */
let finishedQuizModalHandler;
let actionListenerController = null; // NEW: Controller to manage event listeners

function showFinishedQuizModal(title, url, storageKey) {
    if (!finishedQuizModalHandler) return;

    const modalTitle = document.getElementById('finished-quiz-modal-title');
    const viewBtn = document.getElementById('view-results-btn');
    const restartBtn = document.getElementById('restart-quiz-btn');

    if (!modalTitle || !viewBtn || !restartBtn) return;

    modalTitle.textContent = title;

    // Directly assign onclick handlers. This is simpler and automatically
    // replaces any previous handlers. The cloneNode pattern is not needed here.
    viewBtn.onclick = () => {
        // Construct the URL to view results and navigate.
        const finalUrl = url.includes('?') ? `${url}&action=view_results` : `${url}?action=view_results`;
        window.location.href = finalUrl;
        finishedQuizModalHandler.close();
    };

    restartBtn.onclick = () => {
        // Clear the saved state for this quiz and navigate to start it over.
        localStorage.removeItem(storageKey);
        window.location.href = url;
        finishedQuizModalHandler.close();
    };

    finishedQuizModalHandler.open();
}

/**
 * Sets up a single, unified event listener for all quiz items in the detailed list.
 * Clicking any item will navigate to the quiz URL to retake it.
 */
function setupActionListeners() {
    const container = document.getElementById("detailed-stats-container");
    if (!container) return;

    // NEW: Remove previous listener if exists to prevent duplication
    if (actionListenerController) {
        actionListenerController.abort();
    }
    actionListenerController = new AbortController();

    container.addEventListener('click', (e) => {
        const statItem = e.target.closest('.quiz-stat-item');
        if (!statItem) return;

        // Prevent the default link behavior to handle navigation via script.
        e.preventDefault();

        const isFinished = statItem.dataset.isFinished === 'true';
        const url = statItem.getAttribute('href');
        const storageKey = statItem.dataset.storageKey;
        const title = statItem.dataset.quizTitle;

        if (!url || !storageKey) {
            console.error('Missing URL or storageKey on clicked stat item.', statItem);
            return;
        }

        if (isFinished) {
            // For finished quizzes, show a modal with options.
            showFinishedQuizModal(title, url, storageKey);
        } else {
            // For quizzes in progress, navigate directly to resume.
            window.location.href = url;
        }
    }, { signal: actionListenerController.signal }); // Bind signal for cleanup
}

/**
 * Main function to build the entire stats page.
 * It orchestrates fetching, calculating, and rendering all components.
 */
export async function buildStatsPage() {
    const loadingSpinner = document.getElementById("loading-spinner");
    const noStatsMessage = document.getElementById("no-stats-message");
    const statsContent = document.getElementById("stats-content");

    // Fetch custom quizzes ONCE with a timeout to prevent hanging.
    const customQuizzesPromise = getSavedCustomQuizzes();
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 3000)); // Increased timeout to 3s for safety
    const customQuizzes = await Promise.race([customQuizzesPromise, timeoutPromise]);

    const allStats = getAllStats(customQuizzes); // Pass data, don't re-fetch
    const totalAvailableQuizzes = quizList.length + customQuizzes.length;

    loadingSpinner.classList.add("hidden");

    if (allStats.length === 0) {
        noStatsMessage.classList.remove("hidden");
        document.getElementById("clear-stats-btn").disabled = true;
    } else {
        try {
            const groupedData = calculateGroupedPerformance(allStats);
            const summary = calculateSummary(allStats, totalAvailableQuizzes);
            const subjectPerformance = calculateSubjectPerformance(allStats);
            
            renderSummaryCards(summary);
            renderOverallChart(summary);
            renderSubjectPerformanceChart(subjectPerformance);
            renderPerformanceAccordions(groupedData);
            renderDetailedList(allStats);

            // NEW calls for trend chart
            const trendData = calculateScoreTrend(allStats);
            renderScoreTrendChart(trendData);
            renderInDepthStats(allStats);
            const distributionData = calculateScoreDistribution(allStats);
            renderScoreDistributionChart(distributionData);

            // NEW: Cleanup previous modal handler before creating a new one
            if (finishedQuizModalHandler) {
                finishedQuizModalHandler.destroy();
            }
            finishedQuizModalHandler = new ModalHandler('finished-quiz-modal');
            setupActionListeners();
        } catch (error) {
            console.error("Error building stats page components:", error);
        } finally {
            initializeTabs();
            statsContent.classList.add("anim-fade-in");
            statsContent.style.opacity = 1;
        }
    }
}
