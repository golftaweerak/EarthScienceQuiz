import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { fileURLToPath, pathToFileURL } from "url";

// Since this is an ES module, __dirname is not available.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Main Configuration ---
const DATA_DIR = path.join(__dirname, "../data");

// --- Auto-correction Mapping ---
// Maps old/incorrect sub-categories to the correct ones.

const correctionMap = {
  EarthAndSpace: {
    "ธรณีวิทยาโครงสร้าง และธรณีพิบัติภัย": "ธรณีพิบัติภัย",
    "สมดุลพลังงานของโลก และดวงอาทิตย์": "สมดุลพลังงานของโลกและรังสี",
    "ดาวฤกษ์ คุณสมบัติและวิวัฒนาการ": "สมบัติและวิวัฒนาการของดาวฤกษ์",
    "แผนที่อากาศ และการพยากรณ์อากาศ": "แผนที่อากาศและการพยากรณ์อากาศ",
    "ภาวะเรือนกระจก": "สมดุลพลังงานของโลกและรังสี",
    "ธรณีวิทยาโครงสร้าง": "ธรณีสัณฐานและกระบวนการบนพื้นผิวโลก"
  },
  ASTRONOMY_POSN: {
    "ปรากฏการณ์บนท้องฟ้า": "ปฏิสัมพันธ์ในระบบโลก-ดวงจันทร์-ดวงอาทิตย์",
    "พิกัดและการเคลื่อนที่ของวัตถุท้องฟ้าเบื้องต้น": "ทรงกลมท้องฟ้าและระบบพิกัด",
    "สมบัติของดาวฤกษ์": "สมบัติและวิวัฒนาการของดาวฤกษ์",
    "ส่วนประกอบของกาแล็กซีและเอกภพ": "กาแล็กซีและเอกภพวิทยา",
    "ตำแหน่งและลักษณะของดาวเคราะห์ในระบบสุริยะ": "ระบบสุริยะและองค์ประกอบ",
    "ส่วนประกอบของระบบสุริยะ": "ระบบสุริยะและองค์ประกอบ",
    "ระบบสุริยะ": "ระบบสุริยะและองค์ประกอบ",
    "ข่าวสารทางดาราศาสตร์สมัยใหม่": "ข่าวสารและความก้าวหน้าทางดาราศาสตร์",
    "ประวัติศาสตร์ดาราศาสตร์": "ข่าวสารและความก้าวหน้าทางดาราศาสตร์",
    "ปฏิสัมพันธ์ภายในและผลกระทบต่อสิ่งแวดล้อมและสิ่งมีชีวิตบนโลก": "ปฏิสัมพันธ์ในระบบโลก-ดวงจันทร์-ดวงอาทิตย์",
    // Add other known old -> new mappings for ASTRONOMY_POSN here
    "ดาวฤกษ์ คุณสมบัติและวิวัฒนาการ": "สมบัติและวิวัฒนาการของดาวฤกษ์",
    "ลุ่มดาวฤกษ์และการใช้ประโยชน์": "กลุ่มดาวฤกษ์และการใช้ประโยชน์"
  },
};

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} string The string to escape.
 * @returns {string} The escaped string.
 */
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Pre-processes the subCategoryData for efficient validation lookups.
 * @param {object} subCategoryData The raw sub-category data.
 * @returns {{validEarthAndSpace: Map<string, Set<string>>, validAstronomyPosn: Set<string>}}
 */
function preprocessValidationData(subCategoryData) {
  // For EarthAndSpace, create a Map where keys are main categories and values are Sets of specific categories.
  const validEarthAndSpace = new Map();
  for (const mainCategory in subCategoryData.EarthAndSpace) {
    validEarthAndSpace.set(
      mainCategory,
      new Set(subCategoryData.EarthAndSpace[mainCategory])
    );
  }

  // For ASTRONOMY_POSN, create a single Set of all valid topics.
  const validAstronomyPosn = new Set(
    subCategoryData.ASTRONOMY_POSN.map((item) => item.topic)
  );

  return { validEarthAndSpace, validAstronomyPosn };
}

/**
 * Finds the primary quiz data array within an imported module.
 * It checks for a default export, a named 'quizData' export, or the first exported array.
 * @param {object} quizModule - The imported module object.
 * @returns {Array|null} The quiz data array or null if not found.
 */
function findQuizArrayInModule(quizModule) {
  if (quizModule.default && Array.isArray(quizModule.default)) {
    return quizModule.default;
  }
  if (quizModule.quizData && Array.isArray(quizModule.quizData)) {
    return quizModule.quizData;
  }
  // Fallback to find the first exported array in the module
  return Object.values(quizModule).find(val => Array.isArray(val)) || null;
}

/**
 * Validates a single question's sub-category.
 * @param {object} question - The question object.
 * @param {object} info - The validation rules from quizPrefixInfo.
 * @param {{validEarthAndSpace: Map<string, Set<string>>, validAstronomyPosn: Set<string>}} validationData - The pre-processed validation data.
 * @returns {{isValid: boolean, specificCat: string|null}}
 */
function validateQuestionSubCategory(question, info, { validEarthAndSpace, validAstronomyPosn }) {
  const { subCategory } = question;
  if (!subCategory || typeof subCategory.specific !== 'string') {
    return { isValid: false, specificCat: null };
  }

  const specificCat = subCategory.specific.trim();
  let isValid = false;

  if (info.subCategoryKey === "EarthAndSpace") {
    const effectiveMainCat = subCategory.main || info.inferredMainCategory;
    isValid = effectiveMainCat ? (validEarthAndSpace.get(effectiveMainCat)?.has(specificCat) ?? false) : [...validEarthAndSpace.values()].some(categorySet => categorySet.has(specificCat));
  } else if (info.subCategoryKey === "ASTRONOMY_POSN") {
    isValid = validAstronomyPosn.has(specificCat);
  }
  return { isValid, specificCat };
}

async function main() {
  console.log("--- Starting Sub-category Validation and Correction Script ---");
  const startTime = performance.now();

  // 1. Load the master sub-category data
  const { subCategoryData, quizPrefixInfo } = await import(pathToFileURL(path.join(DATA_DIR, "sub-category-data.js")).href);

  // Pre-process data into Sets for efficient O(1) lookups
  const validationData = preprocessValidationData(subCategoryData);

  // Get and sort prefix keys by length (descending) to find the longest match first
  // e.g., ensure 'adv_geology' is checked before 'adv_astro'
  const sortedPrefixKeys = Object.keys(quizPrefixInfo).sort((a, b) => b.length - a.length);

  // 2. Get all quiz data files
  const allFiles = fs.readdirSync(DATA_DIR);
  const quizFiles = allFiles.filter(
    (file) => file.endsWith("-data.js") && file !== "sub-category-data.js"
  );

  // 3. Process all files in parallel
  const processingPromises = quizFiles.map(async (fileName) => {
    const prefix = sortedPrefixKeys.find(key => fileName.toLowerCase().startsWith(key));
    const info = quizPrefixInfo[prefix] || quizPrefixInfo.default;

    const fileCorrections = [];
    const fileErrors = [];

    if (!info || !info.subCategoryKey) {
      console.log(`\n- Skipping validation for ${fileName} (no subCategoryKey defined in quizPrefixInfo).`);
      return { fileName, corrections: fileCorrections, errors: fileErrors, fileModified: false, newContent: null };
    }

    const filePath = path.join(DATA_DIR, fileName);
    const quizDataModule = await import(pathToFileURL(filePath).href);
    const quizData = findQuizArrayInModule(quizDataModule);

    if (!quizData) {
      fileErrors.push(`- ❗️ WARNING in ${fileName}: Could not find an iterable quizData array. Please check the file's export structure.`);
      return { fileName, corrections: fileCorrections, errors: fileErrors, fileModified: false, newContent: null };
    }

    let fileContent = null;
    let fileModified = false;

    for (const item of quizData) {
      // Handle nested questions (case-study)
      const questions = (item.type === "scenario" || item.type === "case-study") && Array.isArray(item.questions) ? item.questions : [item];

      for (const question of questions) {
        const questionIdentifier = `(ID: ${question.id || 'N/A'}, Number: ${question.number || 'N/A'})`;
        const { isValid, specificCat } = validateQuestionSubCategory(question, info, validationData);

        if (specificCat === null) {
          fileErrors.push(`- ❗️ ERROR in ${fileName} ${questionIdentifier}: Missing or incomplete subCategory object.`);
          continue;
        }

        if (!isValid) {
          const correction = correctionMap[info.subCategoryKey]?.[specificCat];
          if (correction) {
            if (!fileContent) {
              fileContent = fs.readFileSync(filePath, "utf-8");
            }
            const escapedOldCat = escapeRegExp(specificCat);
            const oldCategoryRegex = new RegExp(`(specific:\\s*['"])${escapedOldCat}(['"])`);

            if (oldCategoryRegex.test(fileContent)) {
              fileContent = fileContent.replace(oldCategoryRegex, `$1${correction}$2`);
              fileModified = true;
              fileCorrections.push(`- 🔧 Auto-corrected in ${fileName} ${questionIdentifier}: "${specificCat}" -> "${correction}"`);
            } else {
              fileErrors.push(`- ❗️ ERROR in ${fileName} ${questionIdentifier}: Invalid category "${specificCat}". (Auto-correction failed to find string)`);
            }
          } else {
            fileErrors.push(`- ❗️ ERROR in ${fileName} ${questionIdentifier}: Invalid category "${specificCat}". (No correction mapping found)`);
          }
        }
      }
    }
    return { fileName, corrections: fileCorrections, errors: fileErrors, fileModified, newContent: fileContent };
  });

  const results = await Promise.all(processingPromises);

  // 4. Aggregate results and perform file writes
  let totalCorrections = 0;
  const allUnfixableErrors = [];

  for (const result of results) {
    result.corrections.forEach(c => console.log(c));
    totalCorrections += result.corrections.length;
    allUnfixableErrors.push(...result.errors);

    if (result.fileModified) {
      const filePath = path.join(DATA_DIR, result.fileName);
      fs.writeFileSync(filePath, result.newContent, "utf-8");
      console.log(`- ✅ Saved changes to ${result.fileName}\n`);
    }
  }

  // 5. Report final results
  console.log("\n--- Validation Complete ---");
  if (totalCorrections > 0) {
    console.log(`🔧 Successfully auto-corrected ${totalCorrections} instance(s).`);
  }

  const totalErrors = allUnfixableErrors.length;
  if (totalErrors === 0 && totalCorrections === 0) {
    console.log("✅ All sub-categories are already consistent. No changes needed.");
  } else if (totalErrors === 0) {
    console.log("✅ All sub-categories are now consistent after corrections.");
  } else {
    console.log(`\n🔴 Found ${totalErrors} unfixable inconsistencies:\n`);
    allUnfixableErrors.forEach((detail) => console.log(detail));
    console.log("\nPlease review the errors above and correct the data files or update the correction map.");
    process.exit(1); // Exit with an error code to signal failure in CI/CD pipelines
  }

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // in seconds
  console.log(`\n⏱️  Script finished in ${duration.toFixed(3)} seconds.`);
  console.log("------------------------------------------------------------\n");
}

main().catch((err) => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});