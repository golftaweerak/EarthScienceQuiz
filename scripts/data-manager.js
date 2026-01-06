/**
 * A centralized module for managing shared data like category details,
 * quiz progress, and fetching quiz question data.
 */

// Single source of truth for all category metadata.
export const categoryDetails = {
  // Main categories for the index page accordion
  // สีเทาน้ำเงิน (Blue Gray): สื่อถึงความสุขุม น่าเชื่อถือ เหมาะสำหรับหมวดทบทวน
  AstronomyReview: {
    title: "ทบทวน (Review)",
    icon: "./assets/icons/study.png",
    order: 1,
    color: "border-gray-500",
    cardGlow: "hover:shadow-gray-400/40",
    logoGlow: "group-hover:shadow-gray-400/40",
  },
  // สีฟ้า (Sky): สื่อถึงท้องฟ้าและดาราศาสตร์โดยตรง
  AstronomyPOSN: {
    title: "ดาราศาสตร์ (Astronomy)",
    displayName: "ดาราศาสตร์ (Astronomy)",
    icon: "./assets/icons/astronomy.png",
    order: 2,
    color: "border-indigo-500",
    cardGlow: "hover:shadow-indigo-500/30",
    logoGlow: "group-hover:shadow-indigo-500/40",
  },
  // สีเขียวมะนาว (Lime): สื่อถึง "โลก" และธรรมชาติที่สดใส
  EarthScience: {
    title: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)",
    displayName: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)",
    icon: "./assets/icons/earth.png",
    order: 3,
    color: "border-teal-500",
    cardGlow: "hover:shadow-teal-500/30",
    logoGlow: "group-hover:shadow-teal-500/40",
  },
  // สีส้ม (Orange): สื่อถึงความคิดสร้างสรรค์และความรู้ที่เข้าถึงง่าย
  GeneralKnowledge: {
    title: "ความรู้ทั่วไป",
    displayName: "ความรู้ทั่วไป (General)",
    icon: "./assets/icons/idea.png", // แนะนำให้ใช้ไอคอนใหม่ เช่น รูปหลอดไฟ
    order: 4,
    color: "border-orange-500",
    cardGlow: "hover:shadow-orange-500/30",
    logoGlow: "group-hover:shadow-orange-500/40",
  },
  // สีชมพูกุหลาบ (Rose): สื่อถึงความท้าทายที่น่าตื่นเต้นและโดดเด่น
  ChallengePOSN: {
    title: "ข้อสอบท้าทาย (มีได้หลายคำตอบ)",
    displayName: "ข้อสอบท้าทาย (มีหลายคำตอบ)",
    icon: "./assets/icons/trophy-star.png", // แนะนำให้ใช้ไอคอนใหม่ เช่น รูปถ้วยรางวัล
    order: 5,
    color: "border-rose-400",
    cardGlow: "hover:shadow-rose-400/30",
    logoGlow: "group-hover:shadow-rose-400/40",
  },
  // --- หมวดหมู่ใหม่สำหรับ สอวน. และโครงสร้างหลักสูตรใหม่ ---
  PosnAstroJunior: {
    title: "สอวน. ดาราศาสตร์ ม.ต้น",
    displayName: "สอวน. ดาราศาสตร์ ม.ต้น",
    icon: "./assets/icons/astronomy.png",
    order: 6,
    color: "border-orange-400",
    cardGlow: "hover:shadow-orange-400/30",
    logoGlow: "group-hover:shadow-orange-400/40",
  },
  PosnAstroSenior: {
    title: "สอวน. ดาราศาสตร์ ม.ปลาย",
    displayName: "สอวน. ดาราศาสตร์ ม.ปลาย",
    icon: "./assets/icons/astronomy.png",
    order: 7,
    color: "border-red-500",
    cardGlow: "hover:shadow-red-500/30",
    logoGlow: "group-hover:shadow-red-500/40",
  },
  PosnEarthScience: {
    title: "สอวน. วิทยาศาสตร์โลกและอวกาศ",
    displayName: "สอวน. วิทยาศาสตร์โลกและอวกาศ",
    icon: "./assets/icons/earth.png",
    order: 8,
    color: "border-teal-500",
    cardGlow: "hover:shadow-teal-500/30",
    logoGlow: "group-hover:shadow-teal-500/40",
  },
  // หมวดวิชาพื้นฐาน/เพิ่มเติม (สำหรับ Mapping ภายใน)
  EarthSpaceScienceBasic: {
    title: "วิทยาศาสตร์โลกและอวกาศ (พื้นฐาน)",
    displayName: "วิทยาศาสตร์โลกและอวกาศ (พื้นฐาน)",
    icon: "./assets/icons/earth.png",
    order: 9,
    color: "border-green-500",
    cardGlow: "hover:shadow-green-500/30",
    logoGlow: "group-hover:shadow-green-500/40",
  },
  EarthSpaceScienceAdvance: {
    title: "วิทยาศาสตร์โลกและอวกาศ (เพิ่มเติม)",
    displayName: "วิทยาศาสตร์โลกและอวกาศ (เพิ่มเติม)",
    icon: "./assets/icons/earth.png",
    order: 10,
    color: "border-indigo-500",
    cardGlow: "hover:shadow-indigo-500/30",
    logoGlow: "group-hover:shadow-indigo-500/40",
  },
  Physics: {
    title: "ฟิสิกส์ (Physics)",
    displayName: "ฟิสิกส์ (Physics)",
    icon: "./assets/icons/study.png",
    order: 11,
    color: "border-blue-500",
    cardGlow: "hover:shadow-blue-500/30",
    logoGlow: "group-hover:shadow-blue-500/40",
  },
  // This is a special category for the custom quiz creator.
  General: {
    title: "ทุกหมวดหมู่",
    displayName: "ทุกหมวดหมู่",
    icon: "./assets/icons/study.png",
  },
  // A special category for user-created quizzes that mix subjects.
  Custom: {
    title: "แบบทดสอบที่สร้างเอง",
    displayName: "แบบทดสอบที่สร้างเอง",
    icon: "./assets/icons/dices.png",
    order: 99, // Ensure it appears last in sorted lists
    color: "border-purple-500",
    cardGlow: "hover:shadow-purple-500/30",
    logoGlow: "group-hover:shadow-purple-500/40",
  },
};

/**
 * Gets the display-friendly name for a category.
 * Falls back to the title if displayName is not specified.
 * @param {string} categoryKey - The key of the category.
 * @returns {string} The display name.
 */
export function getCategoryDisplayName(categoryKey) {
    const details = categoryDetails[categoryKey];
    if (!details) return categoryKey; // Fallback to the key itself
    // Use displayName if it exists, otherwise use title.
    return details.displayName || details.title;
}


let mergedScoresCache = null;

/**
 * Fetches base scores and manual overrides, merges them, and caches the result.
 * This ensures that overrides are applied consistently across the application.
 * @returns {Promise<Array<object>>} A promise that resolves to the merged student scores.
 */
export async function getStudentScores() {
    if (mergedScoresCache) {
        return mergedScoresCache;
    }

    try {
        // Dynamically import base scores to ensure freshness if the file changes.
        const { studentScores: baseScores } = await import(`../data/scores-data.js?v=${Date.now()}`);

        // Dynamically and safely import overrides.
        let scoreOverrides = {};
        try { // This outer try-catch handles if the file doesn't exist at all.
            const overrideModule = await import(`../data/score-overrides.js?v=${Date.now()}`);
            if (overrideModule.encryptedScoreOverrides && overrideModule.encryptedScoreOverrides.trim() !== "") {
                try { // This inner try-catch handles potential decoding/parsing errors.
                    const decodedString = atob(overrideModule.encryptedScoreOverrides);
                    scoreOverrides = JSON.parse(decodedString);
                } catch (parseError) {
                    console.error("Failed to decode or parse score-overrides.js. The data might be corrupt.", parseError);
                    scoreOverrides = {}; // Reset to empty on error to prevent crashes.
                }
            }
        } catch (e) {
            console.log("Info: score-overrides.js not found. Using base scores.");
        }

        if (Object.keys(scoreOverrides).length === 0) {
            mergedScoresCache = baseScores;
            return baseScores;
        }

        // Perform a merge. Create new student objects for those with overrides.
        const mergedScores = baseScores.map(student => 
            scoreOverrides[student.id] ? { ...student, ...scoreOverrides[student.id] } : student
        );

        mergedScoresCache = mergedScores;
        return mergedScores;
    } catch (error) {
        console.error("Failed to load or merge student scores:", error);
        return []; // Return an empty array on failure.
    }
}

/**
 * Retrieves the progress state of a quiz from localStorage.
 * @param {string} storageKey - The key for the quiz in localStorage.
 * @param {number} totalQuestions - The total number of questions in the quiz.
 * @returns {object} An object containing progress details.
 */
export function getQuizProgress(storageKey, totalQuestions) {
  const defaultState = {
    score: 0,
    percentage: 0,
    hasProgress: false,
    isFinished: false,
    answeredCount: 0,
    totalQuestions: totalQuestions,
    lastAttemptTimestamp: 0, // Add timestamp for sorting by recency
  };
  if (totalQuestions <= 0) return defaultState;

  try {
    const savedStateJSON = localStorage.getItem(storageKey);
    if (!savedStateJSON) return defaultState;

    const savedState = JSON.parse(savedStateJSON);
    if (!savedState || typeof savedState.currentQuestionIndex !== "number")
      return defaultState;
    // Use the length from the saved state if available, as it's the most accurate count
    // for the session the user was in. Fallback to the static totalQuestions.
    const actualTotalQuestions = (savedState.shuffledQuestions && savedState.shuffledQuestions.length) || totalQuestions;

    // A more robust way to count answered questions is to check the userAnswers array.
    // This avoids ambiguity with currentQuestionIndex, which points to the *next* question to be shown.
    const answeredCount = Array.isArray(savedState.userAnswers)
      ? savedState.userAnswers.filter((answer) => answer !== null).length
      : 0;

    const score = savedState.score || 0;
    const isFinished = answeredCount >= actualTotalQuestions;
    const percentage = actualTotalQuestions > 0 ? Math.round((answeredCount / actualTotalQuestions) * 100) : 0;
    const lastAttemptTimestamp = savedState.lastAttemptTimestamp || 0; // Get timestamp from saved state

    return {
      score,
      percentage,
      isFinished,
      hasProgress: true,
      answeredCount,
      totalQuestions: actualTotalQuestions,
      lastAttemptTimestamp,
    };
  } catch (e) {
    console.error(`Could not parse saved state for ${storageKey}:`, e);
    return defaultState;
  }
}

/**
 * Loads the entire saved state object for a quiz from localStorage.
 * @param {string} storageKey - The key for the quiz in localStorage.
 * @returns {object|null} The parsed state object, or null if not found or corrupt.
 */
export function loadQuizState(storageKey) {
  const savedStateJSON = localStorage.getItem(storageKey);
  if (!savedStateJSON) return null;
  try {
    const parsed = JSON.parse(savedStateJSON);
    // Basic validation to ensure it's a plausible state object
    if (
      parsed &&
      typeof parsed.currentQuestionIndex === "number" &&
      Array.isArray(parsed.userAnswers)
    ) {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error(`Could not parse saved state for ${storageKey}:`, e);
    return null;
  }
}

/**
 * Retrieves detailed progress for all quizzes, including the userAnswers array.
 * @returns {Promise<Array<object>>} An array of detailed progress objects.
 */
export async function getDetailedProgressForAllQuizzes() {
  const { quizList } = await import(`../data/quizzes-list.js?v=${Date.now()}`);
  const { getSavedCustomQuizzes } = await import("./custom-quiz-handler.js");

  // Add timeout to prevent hanging
  const customQuizzesPromise = getSavedCustomQuizzes();
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 3000));
  const customQuizzes = await Promise.race([customQuizzesPromise, timeoutPromise]);

  const allQuizzes = [...quizList, ...customQuizzes];
  const allDetailedProgress = allQuizzes
    .map((quiz) => {
      const storageKey =
        quiz.storageKey || `quizState-${quiz.id || quiz.customId}`;
      const savedState = loadQuizState(storageKey); // Use the existing function that returns the full state object

      if (
        !savedState ||
        !savedState.userAnswers ||
        savedState.userAnswers.filter((a) => a !== null).length === 0
      ) {
        return null; // No progress or no answers yet
      }

      return { ...quiz, ...savedState }; // Return full quiz info and its saved state
    })
    .filter((p) => p !== null);

  return allDetailedProgress;
}
/**
 * Retrieves progress for all known quizzes (standard and custom).
 * @returns {Promise<Array<object>>} An array of progress objects for all quizzes.
 */
export async function getAllQuizProgress() {
  const { quizList } = await import(`../data/quizzes-list.js?v=${Date.now()}`);
  const { getSavedCustomQuizzes } = await import("./custom-quiz-handler.js");

  // Add timeout to prevent hanging
  const customQuizzesPromise = getSavedCustomQuizzes();
  const timeoutPromise = new Promise(resolve => setTimeout(() => resolve([]), 3000));
  const customQuizzes = await Promise.race([customQuizzesPromise, timeoutPromise]);

  const allQuizzes = [...quizList, ...customQuizzes];
  const allProgress = allQuizzes
    .map((quiz) => {
      const totalQuestions = quiz.amount || quiz.questions?.length || 0;
      if (totalQuestions === 0) return null;

      const storageKey =
        quiz.storageKey || `quizState-${quiz.id || quiz.customId}`;
      const progress = getQuizProgress(storageKey, totalQuestions);

      return {
        ...progress,
        title: quiz.title,
        category:
          (categoryDetails[quiz.category] && categoryDetails[quiz.category].title) || quiz.category || "ไม่ระบุ",
        storageKey: storageKey,
      };
    })
    .filter((p) => p !== null); // Filter out quizzes with no questions
  return allProgress;
}

let allQuestionsCache = null;
let questionsBySubCategoryCache = {};
let scenariosCache = new Map();

/**
 * Fetches and processes all questions from all quiz data files.
 * Caches the result for subsequent calls.
 * @returns {Promise<{allQuestions: Array, byCategory: object}>}
 */
export async function fetchAllQuizData() {
  // Check if all caches are populated
  if (
    allQuestionsCache &&
    Object.keys(questionsBySubCategoryCache).length > 0 &&
    scenariosCache.size > 0
  ) {
    return {
      allQuestions: allQuestionsCache,
      byCategory: questionsBySubCategoryCache,
      scenarios: scenariosCache,
    };
  }

  let quizList;
  try {
    const module = await import(`../data/quizzes-list.js?v=${Date.now()}`);
    quizList = module.quizList;
  } catch (error) {
    // Make the error more specific if the main list fails to load.
    throw new Error(`Failed to load or parse quizzes-list.js: ${error.message}`);
  }

  // Filter out any potential empty/falsy entries from the list to prevent errors.
  const validQuizList = Array.isArray(quizList) ? quizList.filter((quiz) => quiz) : [];
  const promises = validQuizList.map(async (quiz) => {
    const scriptPath = `../data/${quiz.id}-data.js?v=${Date.now()}`;
    try {
        const module = await import(scriptPath);
        const data = module.quizItems || module.quizScenarios || module.quizData || [];

        if (!Array.isArray(data)) {
            console.warn(`Data for quiz ID "${quiz.id}" is not an array. Skipping.`);
            return [];
        }

        return data.flatMap((item) => {
            if (!item) return [];

            if (item.type === "scenario" && Array.isArray(item.questions)) {
                const scenarioId = `${quiz.id}_${item.title.replace(/\s/g, "_")}`;
                if (!scenariosCache.has(scenarioId)) {
                    scenariosCache.set(scenarioId, { title: item.title, description: item.description });
                }
                return item.questions.filter(q => q).map(q => ({
                    ...q,
                    subCategory: q.subCategory || item.subCategory || quiz.category,
                    sourceQuizCategory: quiz.category,
                    sourceQuizTitle: quiz.title,
                    scenarioId: scenarioId,
                }));
            }
            return {
                ...item,
                subCategory: item.subCategory || quiz.category,
                sourceQuizCategory: quiz.category,
                sourceQuizTitle: quiz.title,
            };
        });
    } catch (error) {
        // Instead of throwing, log the error and return an empty array.
        // This allows Promise.all to complete successfully even if some files are missing.
        console.warn(`Could not load or parse data for quiz ID "${quiz.id}" from ${scriptPath}. Skipping. Error: ${error.message}`);
        return []; // Return an empty array for this failed import
    }
  });

  // Wrap Promise.all in a try-catch to handle any re-thrown errors from the map.
  try {
    const results = await Promise.all(promises);
    allQuestionsCache = results.flat();
  } catch (error) {
    // The error from a failing import will be caught here.
    // We re-throw it so the UI layer (e.g., preview.js) can display a meaningful message.
    console.error("A critical error occurred while loading all quiz data:", error);
    throw error;
  }

  // Pre-process each question to create a single, lowercase, searchable text field.
  // This is done only once when the data is first loaded, making subsequent searches much faster.
  allQuestionsCache.forEach(q => {
    const searchableParts = [
      q.question,
      q.explanation,
      q.scenarioTitle,
      q.scenarioDescription,
      q.sourceQuizTitle,
      ...(q.options || q.choices || []),
    ];
    // Handle both object and string formats for subCategory
    if (q.subCategory) {
      if (typeof q.subCategory === 'object' && q.subCategory.main) {
        searchableParts.push(q.subCategory.main);
        const specifics = Array.isArray(q.subCategory.specific) ? q.subCategory.specific : [q.subCategory.specific];
        searchableParts.push(...specifics);
      } else if (typeof q.subCategory === 'string') {
        searchableParts.push(q.subCategory);
      }
    }
    q.searchableText = searchableParts.filter(Boolean).join(' ').toLowerCase();
  });

  // This logic creates a nested structure for easier filtering by specific sub-categories.
  // e.g., { Geology: { "หัวข้อ 1": [q1, q2], "หัวข้อ 2": [q3] } }
  questionsBySubCategoryCache = allQuestionsCache.reduce((acc, question) => {
    const subCat = question.subCategory;
    if (typeof subCat === "object" && subCat.main && subCat.specific) {
      const mainKey = subCat.main;
      const specificKey = subCat.specific;

      if (!acc[mainKey]) acc[mainKey] = {};
      if (!acc[mainKey][specificKey]) acc[mainKey][specificKey] = [];
      acc[mainKey][specificKey].push(question);
    } else if (typeof subCat === "string") {
      // Handle legacy string-based subcategories by grouping them under a main key.
      const mainKey = subCat;
      const specificKey = "Uncategorized";
      if (!acc[mainKey]) acc[mainKey] = {};
      if (!acc[mainKey][specificKey]) acc[mainKey][specificKey] = [];
      acc[mainKey][specificKey].push(question);
    }
    return acc;
  }, {});

  return {
    allQuestions: allQuestionsCache,
    byCategory: questionsBySubCategoryCache,
    scenarios: scenariosCache,
  };
}

/**
 * Calculates the learner's strengths and weaknesses based on aggregated quiz data.
 * Analyzes performance across different sub-categories (topics).
 * @returns {Promise<{strengths: Array<{name: string, percentage: number, total: number}>, weaknesses: Array<{name: string, percentage: number, total: number}>}>}
 */
export async function calculateStrengthsAndWeaknesses() {
  const allProgress = await getDetailedProgressForAllQuizzes();
  const topicStats = {};

  allProgress.forEach((quiz) => {
    if (!quiz.userAnswers) return;

    quiz.userAnswers.forEach((answer) => {
      if (!answer) return;

      // Determine the topic name (Main Category)
      let topicName = "General";
      if (answer.subCategory) {
        if (typeof answer.subCategory === "object" && answer.subCategory.main) {
          topicName = answer.subCategory.main;
        } else if (typeof answer.subCategory === "string") {
          topicName = answer.subCategory;
        }
      } else if (quiz.subCategory) {
        // Fallback to quiz level subCategory
        topicName = quiz.subCategory;
      }

      // Clean up topic name (remove prefixes like "บทที่ 1: ")
      topicName = topicName.replace(/^บทที่\s*\d+:\s*/, "").trim();

      if (!topicStats[topicName]) {
        topicStats[topicName] = { correct: 0, total: 0 };
      }

      topicStats[topicName].total++;
      if (answer.isCorrect) {
        topicStats[topicName].correct++;
      }
    });
  });

  // Convert to array and calculate percentages
  const topics = Object.entries(topicStats).map(([name, stats]) => ({
    name,
    correct: stats.correct,
    total: stats.total,
    percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
  }));

  // Filter out topics with too few questions to be significant (e.g., < 3 questions)
  const significantTopics = topics.filter((t) => t.total >= 3);

  // Sort by percentage descending
  significantTopics.sort((a, b) => b.percentage - a.percentage);

  // Top 3 Strengths (Best 3)
  const strengths = significantTopics.slice(0, 3);

  // Bottom 3 Weaknesses (Worst 3, sorted ascending)
  // We take the whole list, sort ascending, then take top 3
  const weaknesses = [...significantTopics]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3);

  return { strengths, weaknesses };
}
