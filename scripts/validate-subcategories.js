import fs from "fs";
import path from "path";
import { EOL } from "os";
import { fileURLToPath, pathToFileURL } from "url";

// This script assumes it's in a 'scripts' directory.
// It dynamically imports the master list of categories.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const subCategoryDataPath = path.join(dataDir, "sub-category-data.js");
const { subCategoryData } = await import(pathToFileURL(subCategoryDataPath).href);
const fixMode = process.argv.includes("--fix");

// --- Step 1: Build a master list of valid categories for fast checking ---
const validSubcategories = new Map();
for (const mainKey in subCategoryData.mainCategories) {
  const mainCategory = subCategoryData.mainCategories[mainKey];
  const specificTopics = new Set(mainCategory.specific.map((s) => s.topic));
  validSubcategories.set(mainCategory.name, specificTopics);
}

// --- Build a reverse map for auto-fixing (specific topic -> main category) ---
const specificToMainMap = new Map();
for (const mainKey in subCategoryData.mainCategories) {
  const mainCategory = subCategoryData.mainCategories[mainKey];
  for (const spec of mainCategory.specific) {
    if (specificToMainMap.has(spec.topic)) {
      console.warn(`⚠️  Warning: Duplicate specific topic found: "${spec.topic}". Auto-fix might be ambiguous.`);
    }
    specificToMainMap.set(spec.topic, mainCategory.name);
  }
}

// --- Step 2: The main function to read and validate files ---
async function validateAllDataFiles() {
  let totalErrors = 0;
  const allFiles = fs.readdirSync(dataDir);
  const dataFilesToCheck = allFiles.filter(
    (file) => file.endsWith("-data.js") && file !== "sub-category-data.js"
  );

  console.log(`Found ${dataFilesToCheck.length} data file(s) to validate...`);

  for (const file of dataFilesToCheck) {
    const filePath = path.join(dataDir, file);
    let fileContent = fs.readFileSync(filePath, "utf-8");
    let fileWasModified = false;

    try {
      const { quizData } = await import(pathToFileURL(filePath).href);

      if (!Array.isArray(quizData)) {
        console.error(`\n❌ ERROR in ${file}: The exported 'quizData' is not an array.`);
        totalErrors++;
        continue;
      }

      for (const [index, question] of quizData.entries()) {
        const questionId = `Question #${question.number || index + 1}`;

        // Check 1: Is subCategory an object?
        if (typeof question.subCategory === "string" && fixMode) {
          const oldSubCategory = question.subCategory;
          const mainCategory = specificToMainMap.get(oldSubCategory);
          if (mainCategory) {
            const searchRegex = new RegExp(`(subCategory:\\s*)"${oldSubCategory.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
            const newSubCategoryObject = `{ main: "${mainCategory}", specific: "${oldSubCategory}" }`;
            const newFileContent = fileContent.replace(searchRegex, `$1${newSubCategoryObject}`);

            if (newFileContent !== fileContent) {
              fileContent = newFileContent;
              fileWasModified = true;
              console.log(`\n✅ Fixed in ${file} (${questionId}): Converted string to object.`);
            } else {
              console.error(`\n❌ ERROR in ${file} (${questionId}):`);
              console.error(`   - Could not find string to auto-fix: "${oldSubCategory}"`);
              totalErrors++;
            }
          } else {
            console.error(`\n❌ ERROR in ${file} (${questionId}):`);
            console.error(`   - Cannot fix: Unknown specific category string "${oldSubCategory}".`);
            totalErrors++;
          }
          continue; // Move to the next question after attempting a fix
        } else if (typeof question.subCategory !== "object" || question.subCategory === null) {
          console.error(`\n❌ ERROR in ${file} (${questionId}):`);
          console.error(`   - subCategory must be an object, but found: ${JSON.stringify(question.subCategory)}`);
          totalErrors++;
          continue;
        }

        const { main, specific } = question.subCategory;

        // Check 2: Does it have the required keys?
        if (!main || !specific) {
          console.error(`\n❌ ERROR in ${file} (${questionId}):`);
          console.error(`   - subCategory is missing 'main' or 'specific' property. Found: ${JSON.stringify(question.subCategory)}`);
          totalErrors++;
          continue;
        }

        // Check 3: Is the main category valid?
        if (!validSubcategories.has(main)) {
          console.error(`\n❌ ERROR in ${file} (${questionId}):`);
          console.error(`   - Invalid main category: "${main}"`);
          totalErrors++;
          continue;
        }

        // Check 4: Is the specific category valid for that main category?
        const validSpecifics = validSubcategories.get(main);
        if (!validSpecifics.has(specific)) {
          console.error(`\n❌ ERROR in ${file} (${questionId}):`);
          console.error(`   - Invalid specific category: "${specific}" for main category "${main}".`);
          totalErrors++;
        }
      }

      if (fixMode && fileWasModified) {
        fs.writeFileSync(filePath, fileContent, "utf-8");
        console.log(`💾 Saved changes to ${file}`);
      }
    } catch (err) {
      console.error(`\n❌ FATAL ERROR: Could not process file ${file}.`);
      console.error(`   - ${err.message}`);
      totalErrors++;
    }
  }

  // --- Step 3: Report the final result ---
  console.log("\n--------------------------");
  console.log("Validation Complete.");
  if (totalErrors === 0) {
    console.log("✅ Success! All data files are valid.");
  } else {
    console.log(`🚨 Found ${totalErrors} error(s). Please review the messages above.`);
  }
  console.log("--------------------------");

  return totalErrors;
}

// --- Run the script and exit with the correct status code ---
validateAllDataFiles().then((errorCount) => {
  process.exit(errorCount > 0 ? 1 : 0);
});