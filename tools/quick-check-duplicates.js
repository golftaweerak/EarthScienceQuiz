import fs from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";
import { fileURLToPath, pathToFileURL } from "url";

/**
 * A fast utility script to check for EXACT duplicate questions across all data files.
 * It identifies questions with the exact same text and the exact same set of options (order-independent).
 * This script is a lightweight version of check-duplicates.js, omitting the slower similarity checks.
 *
 * To run:
 * 1. Make sure you have a package.json with "type": "module".
 * 2. Run `node tools/quick-check-duplicates.js` from the project root.
 */

/**
 * A generator function to flatten the quiz items structure.
 * @param {Array<Object>} quizItems - The array of items from a data file.
 */
function* getAllQuestions(quizItems) {
  for (const item of quizItems) {
    if (item.type === "scenario" && Array.isArray(item.questions)) {
      yield* item.questions;
    } else if (item.type === "question" || item.question) {
      yield item;
    }
  }
}

/**
 * Extracts the text content from a quiz option.
 * @param {string|Object} opt - The option item.
 * @returns {string} The trimmed text of the option.
 */
function getOptionText(opt) {
  return (typeof opt === "object" && opt !== null && opt.text)
    ? opt.text.trim()
    : String(opt).trim();
}

async function quickCheckDuplicates() {
  const startTime = performance.now();

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.resolve(__dirname, "..", "data");

  const files = await fs.readdir(dataDir);
  const dataFiles = files.filter(
    (file) => file.endsWith("-data.js") && file !== "sub-category-data.js"
  );

  const seenQuestions = new Map();
  let duplicateCount = 0;
  let totalQuestions = 0;

  console.log("\n🔍 Quick Check: Finding EXACT DUPLICATES...");

  for (const file of dataFiles) {
    const filePath = path.join(dataDir, file);
    const fileUrl = `${pathToFileURL(filePath).href}?v=${Date.now()}`;
    try {
      const module = await import(fileUrl);
      const quizItems = module.quizItems;

      if (!quizItems) continue;

      for (const q of getAllQuestions(quizItems)) {
        if (!q.question || !Array.isArray(q.options)) continue;
        totalQuestions++;

        const questionText = q.question.trim();
        const sortedOptions = q.options.map(getOptionText).sort().join("|");
        const uniqueKey = `${questionText}|${sortedOptions}`;

        if (seenQuestions.has(uniqueKey)) {
          duplicateCount++;
          const firstSeen = seenQuestions.get(uniqueKey);
          console.error(`\n❗️ DUPLICATE #${duplicateCount}: "${questionText.substring(0, 80)}..."`);
          console.error(`  - Found in: ${file} (#${q.number})`);
          console.error(`  - First seen in: ${firstSeen.file} (#${firstSeen.number})`);
        } else {
          seenQuestions.set(uniqueKey, { file, number: q.number });
        }
      }
    } catch (e) {
      console.error(`\n❌ Error importing file: ${file}`, e);
    }
  }

  console.log("\n--- Check complete ---");
  console.log(`Checked ${totalQuestions} questions across ${dataFiles.length} files.`);
  duplicateCount > 0
    ? console.log(`❌ Found ${duplicateCount} duplicate question instances.`)
    : console.log("✅ No exact duplicates found.");

  const duration = (performance.now() - startTime) / 1000;
  console.log(`\n⏱️  Finished in ${duration.toFixed(3)} seconds.`);
}

quickCheckDuplicates().catch(console.error);