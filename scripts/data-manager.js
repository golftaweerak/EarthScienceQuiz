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
  // Categories used for custom quizzes and stats breakdown.
  // These are conceptually sub-categories of Earth & Space Science.
  Geology: {
    title: "ธรณีวิทยา (Geology)",
    displayName: "ธรณีวิทยา",
    icon: "./assets/icons/geology.png",
    color: "border-orange-600", // สีส้มเข้ม: สื่อถึงดินและหิน
  },
  Astronomy: {
    title: "ดาราศาสตร์ (Astronomy)",
    displayName: "ดาราศาสตร์",
    icon: "./assets/icons/astronomy.png",
    color: "border-sky-500", // สีฟ้า: สอดคล้องกับหมวดหลัก
  },
  Meteorology: {
    title: "อุตุนิยมวิทยา (Meteorology)",
    displayName: "อุตุนิยมวิทยา",
    icon: "./assets/icons/meteorology.png",
    color: "border-sky-500", // สีฟ้า (Sky): สื่อถึงท้องฟ้าและอากาศ
  },
  Oceanography: {
    title: "สมุทรศาสตร์ (Oceanography)",
    displayName: "สมุทรศาสตร์",
    icon: "./assets/icons/ocean.png",
    color: "border-teal-500", // สีเขียวน้ำทะเล (Teal): สื่อถึงมหาสมุทร
  },
  // This is a special category for the custom quiz creator.
  General: {
    displayName: "ทุกหมวดหมู่",
    icon: "./assets/icons/study.png",
  },
};

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

    // A more robust way to count answered questions is to check the userAnswers array.
    // This avoids ambiguity with currentQuestionIndex, which points to the *next* question to be shown.
    const answeredCount = Array.isArray(savedState.userAnswers)
      ? savedState.userAnswers.filter((answer) => answer !== null).length
      : 0;

    const score = savedState.score || 0;
    const isFinished = answeredCount >= totalQuestions; // A quiz is finished when all questions have been answered.
    const percentage = Math.round((answeredCount / totalQuestions) * 100);
    const lastAttemptTimestamp = savedState.lastAttemptTimestamp || 0; // Get timestamp from saved state

    return {
      score,
      percentage,
      isFinished,
      hasProgress: true,
      answeredCount,
      totalQuestions,
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

  const allQuizzes = [...quizList, ...getSavedCustomQuizzes()];
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

  const allQuizzes = [...quizList, ...getSavedCustomQuizzes()];
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
          categoryDetails[quiz.category]?.title || quiz.category || "ไม่ระบุ",
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
    // Add a cache-busting query parameter to ensure the latest data is always fetched.
    const scriptPath = `../data/${quiz.id}-data.js?v=${Date.now()}`;
    try {
      const module = await import(scriptPath);
      // Handle modern `quizItems`, legacy `quizScenarios`, and oldest `quizData` for compatibility.
      const data =
        module.quizItems || module.quizScenarios || module.quizData || [];

      if (!data || !Array.isArray(data)) return [];

      return data.flatMap((item) => {
        if (!item) return [];

        if (item.type === "scenario" && Array.isArray(item.questions)) {
          const scenarioId = `${quiz.id}_${item.title.replace(/\s/g, "_")}`;
          // Cache the scenario details
          if (!scenariosCache.has(scenarioId)) {
            scenariosCache.set(scenarioId, {
              title: item.title,
              description: item.description,
            });
          }
          // Filter out null/undefined questions within the scenario before mapping
          return item.questions
            .filter((q) => q)
            .map((q) => ({
              ...q,
              // Use the question's subCategory, fall back to the scenario's, then to the quiz's main category.
              subCategory: q.subCategory || item.subCategory || quiz.category,
              sourceQuizTitle: quiz.title, // Add source quiz title
              scenarioId: scenarioId, // Link question back to its scenario
            }));
        }
        // For standalone questions, use its subCategory or fall back to the quiz's main category.
        return {
          ...item,
          subCategory: item.subCategory || quiz.category,
          sourceQuizTitle: quiz.title,
        };
      });
    } catch (error) {
      // Re-throw the error with more context so the caller can handle it.
      // This prevents the entire process from silently failing on one bad file.
      throw new Error(`Failed to load or parse ${scriptPath}: ${error.message}`);
    }
  });

  // Wrap Promise.all in a try-catch to handle any re-thrown errors from the map.
  try {
    const results = await Promise.all(promises);
    allQuestionsCache = results.flat();

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
  } catch (error) {
    // The error from a failing import will be caught here.
    // We re-throw it so the UI layer (e.g., preview.js) can display a meaningful message.
    console.error("A critical error occurred while loading all quiz data:", error);
    throw error;
  }

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
