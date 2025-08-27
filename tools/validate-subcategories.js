import fs from "fs";
import path from "path";
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
    "ดาวฤกษ์ คุณสมบัติและวิวัฒนาการ": "สมบัติและวิวัฒนาการของดาวฤกษ์" 
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


async function main() {
  console.log("--- Starting Sub-category Validation and Correction Script ---");

  // 1. Load the master sub-category data
  const { subCategoryData, quizPrefixInfo } = await import(pathToFileURL(path.join(DATA_DIR, "sub-category-data.js")).href);

  // Pre-process data into Sets for efficient O(1) lookups
  const { validEarthAndSpace, validAstronomyPosn } = preprocessValidationData(subCategoryData);

  // Get and sort prefix keys by length (descending) to find the longest match first
  // e.g., ensure 'adv_geology' is checked before 'adv'
  const sortedPrefixKeys = Object.keys(quizPrefixInfo).sort((a, b) => b.length - a.length);

  // 2. Get all quiz data files
  const allFiles = fs.readdirSync(DATA_DIR);
  const quizFiles = allFiles.filter(
    (file) => file.endsWith("-data.js") && file !== "sub-category-data.js"
  );

  let correctionCount = 0;
  let errorCount = 0;
  const unfixableErrors = [];

  // 3. Iterate over each quiz file to validate and correct
  for (const fileName of quizFiles) {
    // Find the longest matching prefix for the current file
    const prefix = sortedPrefixKeys.find(key => fileName.toLowerCase().startsWith(key));

    // Get validation rules for this prefix, or use default
    const info = quizPrefixInfo[prefix] || quizPrefixInfo.default;

    if (!info || !info.subCategoryKey) {
      console.log(`\n- Skipping validation for ${fileName} (no subCategoryKey defined in quizPrefixInfo).`);
      continue;
    }

    const filePath = path.join(DATA_DIR, fileName);
    const quizDataModule = await import(pathToFileURL(filePath).href);
    let quizData = quizDataModule.default || quizDataModule.quizData; // Support both default and named export

    // If standard exports are not found, search for the first exported array in the module.
    // This makes the script more robust against varying export conventions.
    if (!Array.isArray(quizData)) {
      quizData = Object.values(quizDataModule).find(val => Array.isArray(val));
    }

    let fileContent = null; // Lazily read file content only if needed for correction
    let fileModified = false;

    // Add a guard clause to ensure quizData is an array before iterating
    if (!Array.isArray(quizData)) {
      console.error(`\n- ❗️ WARNING: Skipping ${fileName}. Could not find an iterable quizData array. Please check the file's export structure.`);
      continue;
    }

    for (const item of quizData) {
      // Handle nested questions (case-study)
      // Correctly handle both "scenario" and "case-study" types.
      // This ensures we only validate the inner questions, not the container object.
      const questions = (item.type === "scenario" || item.type === "case-study") && Array.isArray(item.questions) ? item.questions : [item];

      for (const question of questions) {
        const subCategory = question.subCategory;
        const questionIdentifier = `(ID: ${question.id || 'N/A'}, Number: ${question.number || 'N/A'})`;

        if (!subCategory || !subCategory.specific) {
          errorCount++;
          unfixableErrors.push(`- ❗️ ERROR in ${fileName} ${questionIdentifier}: Missing or incomplete subCategory object.`);
          continue;
        }

        const { main: mainCat, specific: specificCatRaw } = subCategory;
        // Trim whitespace from the specific category to handle data entry errors.
        const specificCat = typeof specificCatRaw === 'string' ? specificCatRaw.trim() : specificCatRaw;
        let isValid = false;

        // --- Validation Logic using pre-processed Sets ---
        if (info.subCategoryKey === "EarthAndSpace") {
          // If main category is missing in data (common in 'adv' files), use the one inferred from the filename.
          // This fixes a bug where the inferred category was not being used correctly.
          const effectiveMainCat = mainCat || info.inferredMainCategory;
          if (effectiveMainCat) {
            // If we have a main category (from data or inference), check it directly.
            isValid = validEarthAndSpace.get(effectiveMainCat)?.has(specificCat) ?? false;
          } else {
            // If no main category is specified, search across all EarthAndSpace categories.
            // This makes the script more robust for mixed-topic files like ES*.
            isValid = [...validEarthAndSpace.values()].some(categorySet => categorySet.has(specificCat));
          }
        } else if (info.subCategoryKey === "ASTRONOMY_POSN") {
          isValid = validAstronomyPosn.has(specificCat);
        }

        // --- Auto-correction Logic ---
        if (!isValid) {
          const correction = correctionMap[info.subCategoryKey]?.[specificCat];
          if (correction) {
            if (!fileContent) {
              fileContent = fs.readFileSync(filePath, "utf-8");
            }
            const escapedOldCat = escapeRegExp(specificCat);
            // Regex to find 'specific: "category"' or 'specific: 'category''
            const oldCategoryRegex = new RegExp(`(specific:\\s*['"])${escapedOldCat}(['"])`);

            if (oldCategoryRegex.test(fileContent)) {
              fileContent = fileContent.replace(oldCategoryRegex, `$1${correction}$2`);
              fileModified = true;
              correctionCount++;
              console.log(`- 🔧 Auto-corrected in ${fileName} ${questionIdentifier}: "${specificCat}" -> "${correction}"`);
            } else {
              errorCount++;
              unfixableErrors.push(`- ❗️ ERROR in ${fileName} ${questionIdentifier}: Invalid category "${specificCat}". (Auto-correction failed to find string)`);
            }
          } else {
            errorCount++;
            unfixableErrors.push(`- ❗️ ERROR in ${fileName} ${questionIdentifier}: Invalid category "${specificCat}". (No correction mapping found)`);
          }
        }
      }
    }

    if (fileModified) {
      fs.writeFileSync(filePath, fileContent, "utf-8");
      console.log(`- ✅ Saved changes to ${fileName}\n`);
    }
  }

  // 4. Report results
  console.log("\n--- Validation Complete ---");
  if (correctionCount > 0) {
    console.log(`🔧 Successfully auto-corrected ${correctionCount} instance(s).`);
  }

  if (errorCount === 0 && correctionCount === 0) {
    console.log("✅ All sub-categories are already consistent. No changes needed.");
  } else if (errorCount === 0) {
    console.log("✅ All sub-categories are now consistent after corrections.");
  } else {
    console.log(`\n🔴 Found ${errorCount} unfixable inconsistencies:\n`);
    unfixableErrors.forEach((detail) => console.log(detail));
    console.log("\nPlease review the errors above and correct the data files or update the correction map.");
    process.exit(1); // Exit with an error code to signal failure in CI/CD pipelines
  }
  console.log("---------------------------\n");
}

main().catch((err) => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});