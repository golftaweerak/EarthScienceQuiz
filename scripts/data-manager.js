/**
 * A centralized module for managing shared data like category details,
 * quiz progress, and fetching quiz question data.
 */
import { quizList } from '../data/quizzes-list.js';

// Single source of truth for all category metadata.
export const categoryDetails = {
    // Main categories for the index page accordion
    AstronomyReview: {
        title: "ทบทวน (Review)",
        icon: "./assets/icons/study.png",
        order: 1,
        color: "border-sky-500",
    },
    Astronomy: {
        title: "ดาราศาสตร์ (Astronomy)",
        icon: "./assets/icons/astronomy.png",
        order: 2,
        color: "border-indigo-500",
    },
    EarthScience: {
        title: "วิทยาศาสตร์โลกและอวกาศ (Earth & Space Science)",
        icon: "./assets/icons/earth.png",
        order: 3,
        color: "border-teal-500",
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

let allQuestionsCache = null;
let questionsBySubCategoryCache = {};

/**
 * Fetches and processes all questions from all quiz data files.
 * Caches the result for subsequent calls.
 * @returns {Promise<{allQuestions: Array, byCategory: object}>}
 */
export async function fetchAllQuizData() {
    if (allQuestionsCache && Object.keys(questionsBySubCategoryCache).length > 0) {
        return { allQuestions: allQuestionsCache, byCategory: questionsBySubCategoryCache };
    }

    const promises = quizList.map(async (quiz) => {
        const scriptPath = `./data/${quiz.id}-data.js`;
        try {
            const response = await fetch(scriptPath);
            if (!response.ok) return [];
            const scriptText = await response.text();
            const data = new Function(`${scriptText}; if (typeof quizData !== 'undefined') return quizData; if (typeof quizItems !== 'undefined') return quizItems; return undefined;`)();

            if (!data || !Array.isArray(data)) return [];

            return data.flatMap((item) => {
                if (item.type === "scenario" && Array.isArray(item.questions)) {
                    return item.questions.map((q) => ({ ...q, subCategory: q.subCategory || item.subCategory }));
                }
                return { ...item, subCategory: item.subCategory };
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

    return { allQuestions: allQuestionsCache, byCategory: questionsBySubCategoryCache };
}