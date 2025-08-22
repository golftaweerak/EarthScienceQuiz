import { quizList } from '../data/quizzes-list.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

/**
 * Counts the total number of questions in a quiz data array,
 * including questions nested within 'subquestions'.
 * @param {Array<Object>} questions - The array of question objects.
 * @returns {number} The total count of questions.
 */
function countQuestions(questions) {
  if (!Array.isArray(questions)) return 0;
  
  return questions.reduce((total, item) => {
    if (item.subquestions && Array.isArray(item.subquestions)) {
      return total + item.subquestions.length;
    }
    return total + 1;
  }, 0);
}

/**
 * Validates that the 'amount' property in quizList matches the actual
 * number of questions in the corresponding data file.
 */
async function validateQuizCounts() {
  console.log('🔍 Starting validation of quiz question counts...');
  let errorsFound = 0;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const dataDir = path.join(__dirname, '../data');

  for (const quiz of quizList) {
    const expectedAmount = quiz.amount;
    const dataFileName = `${quiz.id}-data.js`;
    const dataFilePath = path.join(dataDir, dataFileName);

    if (!fs.existsSync(dataFilePath)) {
      console.error(`🔥 [${quiz.id}] ERROR: Data file not found at ${dataFilePath}`);
      errorsFound++;
      continue;
    }

    try {
      const { default: questions } = await import(path.toNamespacedPath(dataFilePath));
      const actualAmount = countQuestions(questions);

      if (expectedAmount === actualAmount) {
        console.log(`✅ [${quiz.id}] OK: Expected ${expectedAmount}, Found ${actualAmount}`);
      } else {
        console.error(`❌ [${quiz.id}] MISMATCH: Expected ${expectedAmount}, but found ${actualAmount} questions.`);
        errorsFound++;
      }
    } catch (error) {
      console.error(`🔥 [${quiz.id}] ERROR: Could not load or process file ${dataFileName}. Details: ${error.message}`);
      errorsFound++;
    }
  }

  console.log('\n--- Validation Complete ---');
  console.log(errorsFound === 0 ? '🎉 All question counts are correct!' : `🚨 Found ${errorsFound} issues. Please review the logs above.`);
}

validateQuizCounts();