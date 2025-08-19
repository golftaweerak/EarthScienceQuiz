const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const quizListPath = path.join(dataDir, 'quizzes-list.js');

/**
 * Counts the number of questions in a given data file by looking for the "question": key.
 * @param {string} filePath - The full path to the data file.
 * @returns {number} The number of questions found.
 */
function countQuestionsInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // This regex is a more robust heuristic to count questions.
        // It matches both `question:` (unquoted) and `"question":` (quoted) keys,
        // allowing for flexibility in how the data files are written.
        const matches = content.match(/(?:"question"|question)\s*:/g);
        return matches ? matches.length : 0;
    } catch (error) {
        console.error(`Could not read or parse ${filePath}:`, error);
        return 0;
    }
}

/**
 * Extracts the title and description from a quiz data file using heuristics.
 * @param {string} filePath - The full path to the data file.
 * @returns {{title: string, description: string}}
 */
function extractDetailsFromFile(filePath) {
    const id = path.basename(filePath, '-data.js');
    const defaults = {
        title: `ชุดข้อสอบใหม่: ${id} (โปรดแก้ไข)`,
        description: "คำอธิบายสำหรับชุดข้อสอบใหม่ (โปรดแก้ไข)"
    };

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Simplified logic: Prioritize JSDoc comments for details, as it's a clearer convention.
        const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n]*)/);
        if (jsdocMatch && jsdocMatch[1]) {
            defaults.title = jsdocMatch[1].trim();
            // Also try to get description from the next line of the comment
            const jsdocDescMatch = content.match(/\/\*\*\s*\n\s*\*\s*[^\n]*\n\s*\*\s*([^\n]*)/);
            if (jsdocDescMatch && jsdocDescMatch[1]) {
                defaults.description = jsdocDescMatch[1].trim();
            }
        }
        return defaults;
    } catch (error) {
        console.error(`Could not extract details from ${filePath}. Using defaults.`, error);
        return defaults;
    }
}

/**
 * Creates a new quiz entry object as a string, ready to be inserted.
 * @param {string} id - The ID of the new quiz.
 * @param {number} questionCount - The number of questions in the quiz.
 * @param {{title: string, description: string}} details - The extracted details for the quiz.
 * @returns {string} A formatted string for the new quiz object.
 */
function getNewQuizEntry(id, questionCount, details) {
    // A template for new quiz entries. The user will need to edit the details.
    const newEntry = {
        id: id,
        title: details.title,
        amount: questionCount,
        description: details.description,
        url: `./quiz/index.html?id=${id}`,
        storageKey: `quizState-${id}`,
        icon: "./assets/icons/study.png", // Default icon
        borderColor: "border-gray-500", // Default color
        altText: `ไอคอนสำหรับ ${id}`,
        category: "GeneralKnowledge", // Default category
    };
    // Return as a formatted string with indentation, starting with a comma for easy appending.
    return `,\n  ${JSON.stringify(newEntry, null, 4).replace(/\n/g, '\n  ')}`;
}

/**
 * Main function to update the quiz list.
 */
function updateQuizList() {
    console.log('🚀 Checking for new quiz data files...');

    let quizListContent;
    try {
        quizListContent = fs.readFileSync(quizListPath, 'utf8');
    } catch (error) {
        console.error(`❌ Could not read ${quizListPath}. Make sure the file exists.`);
        return;
    }

    const existingIds = new Set((quizListContent.match(/id:\s*"([^"]+)"/g) || []).map(s => s.split('"')[1]));
    console.log('ℹ️ Found existing quiz IDs:', Array.from(existingIds));

    const allFiles = fs.readdirSync(dataDir);
    const newDataFiles = allFiles.filter(file => file.endsWith('-data.js') && !file.startsWith('template-'));

    let newEntriesString = '';
    let quizzesAdded = 0;

    for (const file of newDataFiles) {
        const id = file.replace('-data.js', '');
        if (!existingIds.has(id)) {
            console.log(`✨ New quiz found: ${id}`);
            const filePath = path.join(dataDir, file);
            const questionCount = countQuestionsInFile(filePath);
            
            if (questionCount > 0) {
                const details = extractDetailsFromFile(filePath);
                newEntriesString += getNewQuizEntry(id, questionCount, details);
                quizzesAdded++;
            } else {
                console.warn(`⚠️ Skipping ${id} because no questions were found.`);
            }
        }
    }

    if (quizzesAdded > 0) {
        const closingBracketIndex = quizListContent.lastIndexOf('];');
        const updatedContent = quizListContent.slice(0, closingBracketIndex) + newEntriesString + quizListContent.slice(closingBracketIndex);
        fs.writeFileSync(quizListPath, updatedContent, 'utf8');
        console.log(`\n✅ Successfully added ${quizzesAdded} new quiz(zes) to quizzes-list.js.`);
        console.log('🔔 Please open quizzes-list.js to edit the titles and descriptions for the new entries.');
    } else {
        console.log('\n👍 No new quizzes to add. Your list is up to date.');
    }
}

updateQuizList();