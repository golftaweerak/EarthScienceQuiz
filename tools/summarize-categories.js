import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// Since this is an ES module, __dirname is not available.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Main Configuration ---
const DATA_DIR = path.join(__dirname, "../data");

/**
 * Recursively extracts all individual question objects from the data,
 * handling nested structures like scenarios or case studies.
 * @param {Array} data The array of quiz items from a data file.
 * @returns {Array} A flat array of all question objects.
 */
function flattenQuestions(data) {
  const allQuestions = [];
  for (const item of data) {
    if (
      (item.type === "scenario" || item.type === "case-study") &&
      Array.isArray(item.questions)
    ) {
      // If it's a container, recursively process its inner questions
      allQuestions.push(...flattenQuestions(item.questions));
    } else if (item.question) {
      // If it's a standalone question, add it to the list
      allQuestions.push(item);
    }
  }
  return allQuestions;
}

async function main() {
  console.log("--- Starting Category Summary Script ---");

  // 1. Get all quiz data files
  const allFiles = fs.readdirSync(DATA_DIR);
  const quizFiles = allFiles.filter(
    (file) => file.endsWith("-data.js") && file !== "sub-category-data.js"
  );

  // Structure to hold counts: Map<MainCategory, Map<SpecificCategory, Count>>
  const categoryCounts = new Map();
  let totalQuestions = 0;
  let uncategorizedCount = 0;

  // 2. Iterate over each quiz file to count questions
  for (const fileName of quizFiles) {
    const filePath = path.join(DATA_DIR, fileName);

    try {
      const quizDataModule = await import(pathToFileURL(filePath).href);
      let quizData = quizDataModule.default || quizDataModule.quizData;

      if (!Array.isArray(quizData)) {
        quizData = Object.values(quizDataModule).find((val) => Array.isArray(val));
      }

      if (!Array.isArray(quizData)) {
        console.warn(`\n- ⚠️ WARNING: Skipping ${fileName}. Could not find an iterable quizData array.`);
        continue;
      }

      const allQuestions = flattenQuestions(quizData);
      totalQuestions += allQuestions.length;

      for (const question of allQuestions) {
        const { main, specific } = question.subCategory || {};

        if (main && specific) {
          if (!categoryCounts.has(main)) {
            categoryCounts.set(main, new Map());
          }
          const specificCounts = categoryCounts.get(main);
          specificCounts.set(specific, (specificCounts.get(specific) || 0) + 1);
        } else {
          uncategorizedCount++;
        }
      }
    } catch (error) {
      console.error(`\n- ❌ ERROR: Failed to process ${fileName}.`, error);
    }
  }

  // 3. Report the final summary
  console.log("\n--- Question Category Summary ---");

  const sortedMainCategories = [...categoryCounts.keys()].sort((a, b) => a.localeCompare(b, 'th'));

  for (const mainCat of sortedMainCategories) {
    const specificCounts = categoryCounts.get(mainCat);
    const sortedSpecifics = [...specificCounts.keys()].sort((a, b) => a.localeCompare(b, 'th'));
    
    const mainTotal = [...specificCounts.values()].reduce((sum, count) => sum + count, 0);
    console.log(`\n📁 ${mainCat} (Total: ${mainTotal})`);

    for (const specificCat of sortedSpecifics) {
      console.log(`  - ${specificCat}: ${specificCounts.get(specificCat)}`);
    }
  }

  console.log("\n-----------------------------------");
  console.log(`📊 Total Questions Processed: ${totalQuestions}`);
  if (uncategorizedCount > 0) {
    console.log(`⚠️ Uncategorized Questions: ${uncategorizedCount}`);
  }
  console.log("-----------------------------------\n");
}

main().catch((err) => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});