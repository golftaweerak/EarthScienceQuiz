/**
 * A centralized module for managing shared data like category details,
 * quiz progress, and fetching quiz question data.
 */

// Single source of truth for all category metadata.
export const categoryDetails = {
    // Main categories for the index page accordion
    AstronomyReview: {
        title: "ทบทวน (Review)",
        icon: "./assets/icons/study.png",
        order: 1,
        color: "border-sky-500",
        cardGlow: "hover:shadow-sky-400/40",
        logoGlow: "group-hover:shadow-sky-400/40",
    },
    Astronomy: {
        title: "ดาราศาสตร์",
        displayName: "ดาราศาสตร์ (Astronomy)",
        icon: "./assets/icons/astronomy.png",
        order: 2,
        color: "border-indigo-500",
        cardGlow: "hover:shadow-indigo-400/40",
        logoGlow: "group-hover:shadow-indigo-400/40",
    },
    EarthScience: {
        title: "วิทยาศาสตร์โลกและอวกาศ",
        displayName: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)",
        icon: "./assets/icons/earth.png",
        order: 3,
        color: "border-teal-500",
        cardGlow: "hover:shadow-teal-400/40",
        logoGlow: "group-hover:shadow-teal-400/40",
    },
    GeneralKnowledge: {
        title: "ความรู้ทั่วไป",
        displayName: "ความรู้ทั่วไป (General)",
        icon: "./assets/icons/general.png", // หมายเหตุ: คุณอาจต้องสร้างไฟล์ไอคอนนี้ หรือใช้ study.png แทน
        order: 4,
        color: "border-amber-500",
        cardGlow: "hover:shadow-amber-400/40",
        logoGlow: "group-hover:shadow-amber-400/40",
    },
    // Sub-categories used for custom quiz creation
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
    };
    if (totalQuestions <= 0) return defaultState;

    try {
        const savedStateJSON = localStorage.getItem(storageKey);
        if (!savedStateJSON) return defaultState;

        const savedState = JSON.parse(savedStateJSON);
        if (!savedState || typeof savedState.currentQuestionIndex !== "number") return defaultState;

        // A more robust way to count answered questions is to check the userAnswers array.
        // This avoids ambiguity with currentQuestionIndex, which points to the *next* question to be shown.
        const answeredCount = Array.isArray(savedState.userAnswers)
            ? savedState.userAnswers.filter(answer => answer !== null).length
            : 0;

        const score = savedState.score || 0;
        const isFinished = answeredCount >= totalQuestions; // A quiz is finished when all questions have been answered.
        const percentage = Math.round((answeredCount / totalQuestions) * 100);

        return { score, percentage, isFinished, hasProgress: true, answeredCount, totalQuestions };
    } catch (e) {
        console.error(`Could not parse saved state for ${storageKey}:`, e);
        return defaultState;
    }
}

/**
 * Retrieves progress for all known quizzes (standard and custom).
 * @returns {Promise<Array<object>>} An array of progress objects for all quizzes.
 */
export async function getAllQuizProgress() {
    const { quizList } = await import(`../data/quizzes-list.js?v=${Date.now()}`);
    const { getSavedCustomQuizzes } = await import('./custom-quiz-handler.js');

    const allQuizzes = [...quizList, ...getSavedCustomQuizzes()];
    const allProgress = allQuizzes.map(quiz => {
        const totalQuestions = quiz.amount || quiz.questions?.length || 0;
        if (totalQuestions === 0) return null;

        const storageKey = quiz.storageKey || `quizState-${quiz.id || quiz.customId}`;
        const progress = getQuizProgress(storageKey, totalQuestions);

        return {
            ...progress,
            title: quiz.title,
            category: categoryDetails[quiz.category]?.title || quiz.category || 'ไม่ระบุ',
            storageKey: storageKey,
        };
    }).filter(p => p !== null); // Filter out quizzes with no questions
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
    if (allQuestionsCache && Object.keys(questionsBySubCategoryCache).length > 0 && scenariosCache.size > 0) {
        return { allQuestions: allQuestionsCache, byCategory: questionsBySubCategoryCache, scenarios: scenariosCache };
    }

    const { quizList } = await import(`../data/quizzes-list.js?v=${Date.now()}`);

    // Filter out any potential empty/falsy entries from the list to prevent errors.
    const validQuizList = quizList.filter(quiz => quiz);
    const promises = validQuizList.map(async (quiz) => {
        // Add a cache-busting query parameter to ensure the latest data is always fetched.
        const scriptPath = `../data/${quiz.id}-data.js?v=${Date.now()}`;
        try {
            const module = await import(scriptPath);
            // Handle modern `quizItems`, legacy `quizScenarios`, and oldest `quizData` for compatibility.
            const data = module.quizItems || module.quizScenarios || module.quizData || [];

            if (!data || !Array.isArray(data)) return [];

            return data.flatMap((item) => {
                if (!item) return [];

                if (item.type === "scenario" && Array.isArray(item.questions)) {
                    const scenarioId = `${quiz.id}_${item.title.replace(/\s/g, '_')}`;
                    // Cache the scenario details
                    if (!scenariosCache.has(scenarioId)) {
                        scenariosCache.set(scenarioId, { title: item.title, description: item.description });
                    }
                    // Filter out null/undefined questions within the scenario before mapping
                    return item.questions.filter(q => q).map((q) => ({ 
                        ...q,
                        // Use the question's subCategory, fall back to the scenario's, then to the quiz's main category.
                        subCategory: q.subCategory || item.subCategory || quiz.category,
                        sourceQuizTitle: quiz.title, // Add source quiz title
                        scenarioId: scenarioId // Link question back to its scenario
                    }));
                }
                // For standalone questions, use its subCategory or fall back to the quiz's main category.
                return { ...item, subCategory: item.subCategory || quiz.category, sourceQuizTitle: quiz.title };
            });
        } catch (error) {
            console.error(`Error fetching or processing ${scriptPath}:`, error);
            return [];
        }
    });

    const results = await Promise.all(promises);
    allQuestionsCache = results.flat();

    questionsBySubCategoryCache = allQuestionsCache.reduce((acc, question) => {
        const category = question.subCategory;
        if (category) {
            if (!acc[category]) acc[category] = [];
            acc[category].push(question);
        }
        return acc;
    }, {});

    return { allQuestions: allQuestionsCache, byCategory: questionsBySubCategoryCache, scenarios: scenariosCache };
}