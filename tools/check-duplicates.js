import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

/**
 * A utility script to check for duplicate questions across all data files.
 * It identifies duplicates based on a combination of the question text and the
 * set of options, ignoring the order of options.
 * This script now supports both standalone 'question' types and questions
 * nested within a 'scenario' type.
 *
 * To run:
 * 1. Make sure you have a package.json with "type": "module".
 * 2. Run `node tools/check-duplicates.js` from the project root.
 */

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

async function checkDuplicates() {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dataDir = path.resolve(__dirname, "..", "data");
    const files = await fs.readdir(dataDir);
    const dataFiles = files.filter((file) => file.endsWith("-data.js"));

    const seenQuestions = new Map();
    let duplicateCount = 0;

    console.log("🔍 Starting duplicate question check across all data files...");

    for (const file of dataFiles) {
        const filePath = path.join(dataDir, file);
        // Use a cache-busting query string for dynamic import to get the latest file content
        const fileUrl = `${pathToFileURL(filePath).href}?v=${Date.now()}`;
        const module = await import(fileUrl);
        const quizItems = module.quizItems;

        if (!quizItems) {
            console.warn(`⚠️  Could not find 'quizItems' array in ${file}. Skipping.`);
            continue;
        }

        for (const questionItem of getAllQuestions(quizItems)) {
            // Ensure we are processing a valid question object
            if (!questionItem.question || !questionItem.options) {
                continue;
            }

            const questionText = questionItem.question.trim();
            // Normalize options by extracting their text content, then sorting them
            // to make the check order-independent. This handles both string options
            // and object options (e.g., { text: '...' }).
            const optionTexts = questionItem.options.map(opt =>
                typeof opt === 'object' && opt !== null && opt.text ? opt.text.trim() : String(opt).trim()
            );
            const sortedOptions = optionTexts.sort().join("|");
            const uniqueKey = `${questionText}|${sortedOptions}`;

            if (seenQuestions.has(uniqueKey)) {
                duplicateCount++;
                const firstSeen = seenQuestions.get(uniqueKey);
                console.error(`\n❗️ DUPLICATE FOUND (#${duplicateCount}):`);
                console.error(`  - In File: ${file}, Number: ${questionItem.number}`);
                console.error(`  - Question: "${questionText.substring(0, 70)}..."`);
                console.error(`  - This is a duplicate of a question in:`);
                console.error(`  - File: ${firstSeen.file}, Number: ${firstSeen.number}`);
            } else {
                seenQuestions.set(uniqueKey, { file, number: questionItem.number });
            }
        }
    }

    console.log("\n--- Check complete ---");
    if (duplicateCount === 0) {
        console.log("✅ No duplicate questions found. All questions are unique.");
    } else {
        console.log(`❌ Found a total of ${duplicateCount} duplicate questions.`);
    }
}

checkDuplicates().catch((error) => {
    console.error("An error occurred during the check:", error);
});