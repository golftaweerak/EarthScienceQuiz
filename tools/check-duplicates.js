import fs from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import { fileURLToPath, pathToFileURL } from "url";
import chalk from "chalk";

/**
 * A utility script to check for duplicate and similar questions across all data files.
 * 1. Duplicates: Identifies questions with the exact same text and options (order-independent).
 * 2. Similarities: Identifies pairs of questions with highly similar text (Levenshtein distance)
 *    and a high degree of overlap in their options (Jaccard similarity).
 * The script supports both standalone 'question' types and questions
 * nested within a 'scenario' type.
 *
 * To run:
 * 1. Make sure you have a package.json with "type": "module".
 * 2. Run `node tools/check-duplicates.js` from the project root.
 * 3. To force checking all files, run `node tools/check-duplicates.js --all`.
 */

// --- Configuration for Similarity Check ---
const SIMILARITY_THRESHOLD_QUESTION = 0.85; // e.g., 85% similar text
const SIMILARITY_THRESHOLD_OPTIONS = 0.75;  // e.g., 75% same options


/**
 * A generator function to flatten the quiz items structure.
 * It yields each individual question object, whether it's a standalone question
 * or nested within a scenario.
 * @param {Array<Object>} quizItems - The array of items from a data file.
 */
function* getAllQuestions(quizItems) {
    for (const item of quizItems) {
        if (item.type === "scenario" && Array.isArray(item.questions)) {
            yield* item.questions; // Use yield* to delegate to another generator/iterable
        } else if (item.type === "question" || item.question) { // Also handle items that are implicitly questions
            yield item;
        }
    }
}

/**
 * Extracts the text content from a quiz option.
 * Handles both string options and object options (e.g., { text: '...' }).
 * @param {string|Object} opt - The option item.
 * @returns {string} The trimmed text of the option.
 */
function getOptionText(opt) {
    return (typeof opt === 'object' && opt !== null && opt.text) ? opt.text.trim() : String(opt).trim();
}

/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} s1 The first string.
 * @param {string} s2 The second string.
 * @returns {number} The Levenshtein distance.
 */
function levenshteinDistance(s1, s2) {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let j = 1; j <= len2; j++) {
        for (let i = 1; i <= len1; i++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return matrix[len1][len2];
}

/**
 * Calculates a text similarity score (0 to 1) based on Levenshtein distance.
 * @param {string} s1 The first string.
 * @param {string} s2 The second string.
 * @returns {number} A similarity score from 0 (completely different) to 1 (identical).
 */
function calculateTextSimilarity(s1, s2) {
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1; // Both are empty
    const distance = levenshteinDistance(s1, s2);
    return 1 - (distance / maxLength);
}

/**
 * Calculates the Jaccard similarity between two sets.
 * @param {Set<any>} set1 The first set.
 * @param {Set<any>} set2 The second set.
 * @returns {number} The Jaccard index from 0 to 1.
 */
function calculateSetSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    if (union.size === 0) return 1; // Both are empty
    return intersection.size / union.size;
}

async function checkDuplicatesAndSimilarities() {
    const checkAllFiles = process.argv.includes('--all');
    const startTime = performance.now();

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dataDir = path.resolve(__dirname, "..", "data");

    // --- Load Filtering Criteria from sub-category-data.js ---
    let validPrefixes = null; // null indicates to check all files

    if (checkAllFiles) {
        console.log("ℹ️  `--all` flag detected. Checking all `-data.js` files.");
    } else {
        try {
            const subCategoryDataPath = path.join(dataDir, "sub-category-data.js");
            const subCategoryFileUrl = `${pathToFileURL(subCategoryDataPath).href}?v=${Date.now()}`;
            const subCategoryModule = await import(subCategoryFileUrl);
            // Correctly target the 'quizPrefixInfo' array which contains the prefixes.
            if (subCategoryModule.quizPrefixInfo && Array.isArray(subCategoryModule.quizPrefixInfo)) {
                validPrefixes = new Set(subCategoryModule.quizPrefixInfo.map(item => item.prefix));
                console.log(chalk.blue(`ℹ️  Loaded ${validPrefixes.size} valid prefixes. Will only check files matching these prefixes.`));
            } else {
                console.warn(chalk.yellow("⚠️  Could not find 'quizPrefixInfo' array in sub-category-data.js. Checking all files."));
            }
        } catch (e) {
            // If the file doesn't exist, that's fine. We just check all files.
            if (e.code !== 'ERR_MODULE_NOT_FOUND') {
                console.warn(chalk.yellow("⚠️  Could not load or parse sub-category-data.js. Checking all files."));
            }
        }
    }

    const files = await fs.readdir(dataDir);
    // Exclude the sub-category definition file itself from the check
    const dataFiles = files.filter((file) => file.endsWith("-data.js") && file !== 'sub-category-data.js');

    const seenQuestions = new Map();
    const uniqueQuestions = []; // To store unique questions for similarity check
    let duplicateCount = 0;
    let checkedFileCount = 0;

    console.log(chalk.bold("\n🔍 PASS 1: Checking for EXACT DUPLICATES across relevant data files..."));

    // --- PASS 1: Find Duplicates and Collect Unique Questions ---
    for (const file of dataFiles) {
        // --- Apply Prefix Filter ---
        // If validPrefixes is a Set and --all is not used, we apply the filter.
        if (validPrefixes && !checkAllFiles) {
            // Check if the filename starts with any of the valid prefixes.
            const fileMatchesPrefix = [...validPrefixes].some(prefix => file.startsWith(prefix));
            if (!fileMatchesPrefix) {
                continue; // Skip this file as it doesn't match the prefix criteria
            }
        }

        checkedFileCount++;
        const filePath = path.join(dataDir, file);
        // Use a cache-busting query string for dynamic import to get the latest file content
        const fileUrl = `${pathToFileURL(filePath).href}?v=${Date.now()}`;
        let module;
        try {
            module = await import(fileUrl);
        } catch (e) {
            console.error(chalk.red(`\n❌ Error importing file: ${file}`));
            console.error(e);
            continue;
        }

        const quizItems = module.quizItems;

        if (!quizItems) {
            console.warn(chalk.yellow(`⚠️  Could not find 'quizItems' array in ${file}. Skipping.`),);
            continue;
        }

        for (const questionItem of getAllQuestions(quizItems)) {
            // Ensure we are processing a valid question object
            if (!questionItem.question || !Array.isArray(questionItem.options)) {
                continue;
            }

            const questionText = questionItem.question.trim();
            const optionTexts = questionItem.options.map(getOptionText);
            const sortedOptions = optionTexts.sort().join("|");
            const uniqueKey = `${questionText}|${sortedOptions}`;

            if (seenQuestions.has(uniqueKey)) {
                duplicateCount++;
                const firstSeen = seenQuestions.get(uniqueKey);
                if (duplicateCount === 1) {
                    console.log(chalk.red.bold("\n--- Found Duplicates ---"));
                }
                console.error(chalk.red.bold(`\n❗️ DUPLICATE #${duplicateCount}:`));
                console.error(`  - First instance: ${chalk.cyan(`${firstSeen.file} (ID: ${firstSeen.id}, #${firstSeen.number})`)}`);
                console.error(`    > ${chalk.gray(firstSeen.questionText)}`);
                console.error(`  - Duplicate instance: ${chalk.cyan(`${file} (ID: ${questionItem.id || 'N/A'}, #${questionItem.number})`)}`);
                console.error(`    > ${chalk.gray(questionText)}`);
            } else {
                const questionInfo = {
                    id: questionItem.id || 'N/A',
                    file,
                    number: questionItem.number,
                    questionText,
                    optionSet: new Set(optionTexts),
                    key: uniqueKey,
                };
                seenQuestions.set(uniqueKey, questionInfo);
                uniqueQuestions.push(questionInfo);
            }
        }
    }

    // --- PASS 2: Find Similarities among Unique Questions ---
    let similarPairCount = 0;
    console.log(chalk.bold(`\n🔍 PASS 2: Checking for SIMILAR questions among ${uniqueQuestions.length} unique items...`));
    console.log(chalk.gray(`   (Thresholds: Question > ${SIMILARITY_THRESHOLD_QUESTION*100}%, Options > ${SIMILARITY_THRESHOLD_OPTIONS*100}%)`));

    for (let i = 0; i < uniqueQuestions.length; i++) {
        for (let j = i + 1; j < uniqueQuestions.length; j++) {
            const q1 = uniqueQuestions[i];
            const q2 = uniqueQuestions[j];

            const questionSimilarity = calculateTextSimilarity(q1.questionText, q2.questionText);

            if (questionSimilarity >= SIMILARITY_THRESHOLD_QUESTION) {
                const optionsSimilarity = calculateSetSimilarity(q1.optionSet, q2.optionSet);

                if (optionsSimilarity >= SIMILARITY_THRESHOLD_OPTIONS) {
                    similarPairCount++;
                    const qSim = (questionSimilarity * 100).toFixed(1);
                    const oSim = (optionsSimilarity * 100).toFixed(1);
                    if (similarPairCount === 1) {
                        console.log(chalk.yellow.bold("\n--- Found Similar Questions ---"));
                    }
                    console.warn(chalk.yellow.bold(`\n⚠️  SIMILAR PAIR #${similarPairCount} (Question: ${qSim}%, Options: ${oSim}%):`));
                    console.warn(`  - Q1: ${chalk.cyan(`${q1.file} (ID: ${q1.id}, #${q1.number})`)}`);
                    console.warn(`    > ${chalk.gray(q1.questionText)}`);
                    console.warn(`  - Q2: ${chalk.cyan(`${q2.file} (ID: ${q2.id}, #${q2.number})`)}`);
                    console.warn(`    > ${chalk.gray(q2.questionText)}`);
                }
            }
        }
    }

    console.log(chalk.bold("\n--- Check complete ---"));
    console.log(chalk.blue(`ℹ️  Checked a total of ${checkedFileCount} files.`));
    if (duplicateCount === 0) {
        console.log(chalk.green("✅ No duplicate questions found. All questions are unique."));
    } else {
        console.error(chalk.red.bold(`❌ Found a total of ${duplicateCount} duplicate question instances.`));
    }

    if (similarPairCount === 0) {
        console.log(chalk.green("✅ No highly similar question pairs found."));
    } else {
        console.warn(chalk.yellow.bold(`⚠️  Found a total of ${similarPairCount} pairs of similar questions.`));
    }

    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    console.log(`\n⏱️  Script finished in ${duration.toFixed(3)} seconds.`);
}

checkDuplicatesAndSimilarities().catch((error) => {
    console.error("An error occurred during the check:", error);
});