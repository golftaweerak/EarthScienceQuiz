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

async function main() {
  console.log("--- Starting Sub-category Validation and Correction Script ---");
  const startTime = performance.now();

  // 1. Load the master sub-category data
  const { subCategoryData, quizPrefixInfo } = await import(pathToFileURL(path.join(DATA_DIR, "sub-category-data.js")).href);

  // Pre-process data into Sets for efficient O(1) lookups
  const validationData = preprocessValidationData(subCategoryData);

  let subCategoryFileModified = false;
  const newCategoriesAdded = new Set();

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
        const questionIdForTable = question.number || question.id || 'N/A';
        
        const { subCategory } = question;
        if (!subCategory || !subCategory.specific) {
          fileErrors.push({ File: fileName, ID: questionIdForTable, Error: 'Missing or incomplete subCategory object' });
          continue;
        }

        const specificCats = Array.isArray(subCategory.specific) ? subCategory.specific : [subCategory.specific];

        for (const specificCat of specificCats) {
          if (typeof specificCat !== 'string') {
            fileErrors.push({ File: fileName, ID: questionIdForTable, Error: `subCategory.specific contains non-string: ${specificCat}` });
            continue;
          }

          const trimmedCat = specificCat.trim();
          let isValid = false;

          // Perform validation
          if (info.subCategoryKey === "EarthAndSpace") {
            const effectiveMainCat = subCategory.main || info.inferredMainCategory;
            isValid = effectiveMainCat ? (validationData.validEarthAndSpace.get(effectiveMainCat)?.has(trimmedCat) ?? false) : [...validationData.validEarthAndSpace.values()].some(categorySet => categorySet.has(trimmedCat));
          } else if (info.subCategoryKey === "ASTRONOMY_POSN") {
            isValid = validationData.validAstronomyPosn.has(trimmedCat);
          }

          // Handle invalid categories
          if (!isValid) {
            const correction = correctionMap[info.subCategoryKey]?.[trimmedCat];
            if (correction) {
              if (!fileContent) {
                fileContent = fs.readFileSync(filePath, "utf-8");
              }
              const escapedOldCat = escapeRegExp(trimmedCat);
              const oldCategoryRegex = new RegExp(`(['"])${escapedOldCat}(['"])`);

              if (oldCategoryRegex.test(fileContent)) {
                fileContent = fileContent.replace(oldCategoryRegex, `$1${correction}$2`);
                fileModified = true;
                fileCorrections.push({ File: fileName, ID: questionIdForTable, Change: `"${trimmedCat}" -> "${correction}"` });
              } else {
                fileErrors.push({ File: fileName, ID: questionIdForTable, Error: `Invalid category "${trimmedCat}"`, Details: 'Auto-correction failed to find string' });
              }
            } else {
              // --- NEW LOGIC: Add the new category ---
              let added = false;
              if (info.subCategoryKey === "EarthAndSpace") {
                const effectiveMainCat = subCategory.main || info.inferredMainCategory;
                if (subCategoryData.EarthAndSpace[effectiveMainCat]) {
                  subCategoryData.EarthAndSpace[effectiveMainCat].push(trimmedCat);
                  validationData.validEarthAndSpace.get(effectiveMainCat).add(trimmedCat); // Update live validation data
                  added = true;
                }
              } else if (info.subCategoryKey === "ASTRONOMY_POSN") {
                subCategoryData.ASTRONOMY_POSN.push({ topic: trimmedCat, description: "หมวดหมู่ที่เพิ่มโดยอัตโนมัติ" });
                validationData.validAstronomyPosn.add(trimmedCat); // Update live validation data
                added = true;
              }

              if (added) {
                subCategoryFileModified = true;
                newCategoriesAdded.add(`"${trimmedCat}" (under main category: ${subCategory.main || info.inferredMainCategory || 'ASTRONOMY_POSN'})`);
              } else {
                fileErrors.push({ File: fileName, ID: questionIdForTable, Error: `Invalid category "${trimmedCat}"`, Details: 'Could not auto-add' });
              }
            }
          }
        }
      }
    }
    return { fileName, corrections: fileCorrections, errors: fileErrors, fileModified, newContent: fileContent };
  });

  const results = await Promise.all(processingPromises);

  // 4. Aggregate results and perform file writes
  const allCorrections = [];
  const allUnfixableErrors = [];

  for (const result of results) {
    allCorrections.push(...result.corrections);
    allUnfixableErrors.push(...result.errors);

    if (result.fileModified) {
      const filePath = path.join(DATA_DIR, result.fileName);
      fs.writeFileSync(filePath, result.newContent, "utf-8");
    }
  }

  // 4.5 Write back the updated sub-category data if modified
  if (subCategoryFileModified) {
    // Sort the categories alphabetically before writing for consistency
    for (const mainCat in subCategoryData.EarthAndSpace) {
      // Use Set to remove duplicates before sorting
      const uniqueCats = [...new Set(subCategoryData.EarthAndSpace[mainCat])];
      subCategoryData.EarthAndSpace[mainCat] = uniqueCats.sort((a, b) => a.localeCompare(b, 'th'));
    }
    // Use Map to handle uniqueness for objects, then convert back to array
    const uniqueAstroTopics = new Map();
    subCategoryData.ASTRONOMY_POSN.forEach(item => uniqueAstroTopics.set(item.topic, item));
    subCategoryData.ASTRONOMY_POSN = [...uniqueAstroTopics.values()].sort((a, b) => a.topic.localeCompare(b.topic, 'th'));

    const subCategoryFileContent = `export const subCategoryData = ${JSON.stringify(subCategoryData, null, 2)};\n\nexport const quizPrefixInfo = ${JSON.stringify(quizPrefixInfo, null, 2)};\n`;

    fs.writeFileSync(path.join(DATA_DIR, "sub-category-data.js"), subCategoryFileContent, "utf-8");
    console.log("\n--- Sub-category Data Updated ---");
    console.log("✅ Automatically added new sub-categories to `data/sub-category-data.js`:");
    newCategoriesAdded.forEach(cat => console.log(`  - ${cat}`));
  }

  // 5. Report final results
  console.log("\n--- ✅ Validation Complete ---");

  if (allCorrections.length > 0) {
    console.log(`\n--- 🔧 Auto-corrections (${allCorrections.length}) ---`);
    console.table(allCorrections);
  }

  if (allUnfixableErrors.length > 0) {
    console.log(`\n--- ❗️ Errors (${allUnfixableErrors.length}) ---`);
    console.table(allUnfixableErrors);
    console.error(`\nFound ${allUnfixableErrors.length} unrecoverable error(s). Please fix them manually.`);
  }

  if (allCorrections.length === 0 && allUnfixableErrors.length === 0 && newCategoriesAdded.size === 0) {
    console.log("\n✨ All sub-categories are valid. No issues found.");
  }

  const endTime = performance.now();
  const duration = (endTime - startTime) / 1000; // in seconds
  console.log(`\n⏱️  Script finished in ${duration.toFixed(3)} seconds.`);

  if (allUnfixableErrors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});