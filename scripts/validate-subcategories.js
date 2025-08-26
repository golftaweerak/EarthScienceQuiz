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
    // Add other known old -> new mappings for EarthAndSpace here
  },
  ASTRONOMY_POSN: {
    "ปรากฏการณ์บนท้องฟ้า": "ปฏิสัมพันธ์ในระบบโลก-ดวงจันทร์-ดวงอาทิตย์",
    // Add other known old -> new mappings for ASTRONOMY_POSN here
  },
};

const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
  console.log("--- Starting Sub-category Validation Script ---");

  // 1. Load the master sub-category data
  const { subCategoryData, quizPrefixInfo } = await import(pathToFileURL(path.join(DATA_DIR, "sub-category-data.js")).href);

  // Pre-process ASTRONOMY_POSN for faster lookups
  const validAstronomyPosnTopics = new Set(
    subCategoryData.ASTRONOMY_POSN.map((item) => item.topic)
  );

  // 2. Get all quiz data files
  const allFiles = fs.readdirSync(DATA_DIR);
  const quizFiles = allFiles.filter(
    (file) => file.endsWith("-data.js") && file !== "sub-category-data.js"
  );

  let correctionCount = 0;
  let errorCount = 0;
  const unfixableErrors = [];

  // 3. Iterate over each quiz file and validate
  for (const fileName of quizFiles) {
    const filePath = path.join(DATA_DIR, fileName);
    const prefix = fileName.match(/^[a-zA-Z]+/)[0];
    const info = quizPrefixInfo[prefix] || quizPrefixInfo.default;

    if (!info.subCategoryKey) {
      console.log(`\n- Skipping validation for ${fileName} (subCategoryKey is null).`);
      continue;
    }

    const quizDataModule = await import(pathToFileURL(filePath).href);
    const quizData = quizDataModule.default; // Assuming default export
    let fileContent = null; // Lazily read file content only if needed
    let fileModified = false;

    for (const item of quizData) {
      // Handle nested questions (case-study)
      const questions = item.type === "case-study" ? item.questions : [item];

      for (const question of questions) {
        const subCategory = question.subCategory;
        if (!subCategory || !subCategory.specific) {
          errorCount++;
          unfixableErrors.push(`- ❗️ ERROR in ${fileName} (Question #${question.number}): Missing or incomplete subCategory object.`);
          continue;
        }

        const { main: mainCat, specific: specificCat } = subCategory;
        let isValid = true;

        // --- Validation Logic ---
        if (info.subCategoryKey === "EarthAndSpace") {
          isValid = subCategoryData.EarthAndSpace[mainCat]?.includes(specificCat);
        } else if (info.subCategoryKey === "ASTRONOMY_POSN") {
          isValid = validAstronomyPosnTopics.has(specificCat);
        }

        // --- Auto-correction Logic ---
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
              correctionCount++;
              console.log(`- 🔧 Auto-corrected in ${fileName} (#${question.number}): "${specificCat}" -> "${correction}"`);
            } else {
              errorCount++;
              unfixableErrors.push(`- ❗️ ERROR in ${fileName} (#${question.number}): Invalid category "${specificCat}". (Auto-correction failed to find string)`);
            }
          } else {
            errorCount++;
            unfixableErrors.push(`- ❗️ ERROR in ${fileName} (#${question.number}): Invalid category "${specificCat}". (No correction mapping found)`);
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

  if (errorCount === 0) {
    console.log("✅ All sub-categories are now consistent. Great job!");
  } else {
    console.log(`\n🔴 Found ${errorCount} unfixable inconsistencies:\n`);
    unfixableErrors.forEach((detail) => console.log(detail));
    console.log("\nPlease review the errors above and correct the data files or update the correction map.");
  }
  console.log("---------------------------\n");
}

main().catch((err) => {
  console.error("An unexpected error occurred:", err);
});