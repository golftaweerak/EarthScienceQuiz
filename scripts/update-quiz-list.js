import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { quizPrefixInfo } from '../data/sub-category-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');
const quizListPath = path.join(dataDir, 'quizzes-list.js');

/**
 * Counts the number of questions in a given file content.
 * @param {string} content - The content of the data file.
 * @returns {number} The number of questions found.
 */
function countQuestionsInContent(content) {
    // This regex is a more robust heuristic to count questions.
    // It matches both `question:` (unquoted) and `"question":` (quoted) keys.
    const matches = content.match(/(?:"question"|question)\s*:/g);
    return matches ? matches.length : 0;
}

/**
 * Extracts the title and description from file content using JSDoc comments.
 * @param {string} content - The content of the data file.
 * @param {string} id - The ID of the quiz, used for default values.
 * @returns {{title: string, description: string}}
 */
function extractDetailsFromContent(content, id) {
    const defaults = {
        title: `ชุดข้อสอบ: ${id} (โปรดแก้ไข)`,
        description: "คำอธิบายสำหรับชุดข้อสอบนี้ (โปรดแก้ไข)"
    };

    // Prioritize JSDoc comments for details.
    const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*([^\n]*)/);
    if (jsdocMatch && jsdocMatch[1]) {
        const firstLine = jsdocMatch[1].trim();
        // Avoid using the template's first line as a title
        if (!firstLine.includes('ไฟล์แม่แบบ')) {
            defaults.title = firstLine;
        }
        
        // Also try to get description from the next line of the comment
        const jsdocDescMatch = content.match(/\/\*\*\s*\n\s*\*\s*[^\n]*\n\s*\*\s*([^\n]*)/);
        if (jsdocDescMatch && jsdocDescMatch[1]) {
            defaults.description = jsdocDescMatch[1].trim();
        }
    }
    return defaults;
}

/**
 * Guesses the category and icon for a new quiz based on its ID.
 * @param {string} id - The ID of the new quiz.
 * @returns {{category: string, icon: string}}
 */
function guessCategoryAndIcon(id) {
    const lowerId = id.toLowerCase();    
    // Find the longest matching prefix to handle cases like 'es' and 'esr'.
    const matchingPrefix = Object.keys(quizPrefixInfo)
        .filter(p => p !== 'default' && lowerId.startsWith(p))
        .sort((a, b) => b.length - a.length)[0]; // Sort by length descending and take the first

    const info = quizPrefixInfo[matchingPrefix] || quizPrefixInfo.default;
    return { category: info.mainCategory, icon: info.icon };
}

/**
 * Creates a new quiz entry object as a string, ready to be inserted.
 * @param {string} id - The ID of the new quiz.
 * @param {number} questionCount - The number of questions in the quiz.
 * @param {{title: string, description: string}} details - The extracted details for the quiz.
 * @returns {string} A formatted string for the new quiz object.
 */
function getNewQuizEntry(id, questionCount, details) {
    const { category, icon } = guessCategoryAndIcon(id);

    const newEntry = {
        id: id,
        title: details.title,
        amount: questionCount,
        description: details.description,
        url: `./quiz/index.html?id=${id}`,
        storageKey: `quizState-${id}`,
        icon: icon,
        borderColor: "border-gray-500", // Default color, user can change
        altText: `ไอคอนสำหรับ ${id}`,
        category: category,
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
    const newDataFiles = allFiles.filter(file => 
        file.endsWith('-data.js') && 
        !file.startsWith('template-') &&
        !file.startsWith('tempCodeRunnerFile') // Exclude temp files
    );

    let newEntriesString = '';
    let quizzesAdded = 0;

    for (const file of newDataFiles) {
        const id = file.replace('-data.js', '');
        if (!existingIds.has(id)) {
            try {
                console.log(`✨ Found new file: ${file}. Processing...`);
                const filePath = path.join(dataDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const questionCount = countQuestionsInContent(content);
                
                if (questionCount > 0) {
                    const details = extractDetailsFromContent(content, id);
                    newEntriesString += getNewQuizEntry(id, questionCount, details);
                    quizzesAdded++;
                    console.log(`  - Added "${details.title}" (${id}) with ${questionCount} questions.`);
                } else {
                    console.warn(`  - ⚠️ Skipping "${id}" because no questions were found.`);
                }
            } catch (error) {
                console.error(`  - ❌ Error processing ${file}:`, error);
            }
        }
    }

    if (quizzesAdded > 0) {
        // Find the last occurrence of a closing brace `}` before the closing bracket `];`
        // This is more robust than just finding the last `];` in case of comments.
        const closingBracketIndex = quizListContent.lastIndexOf('];');
        if (closingBracketIndex === -1) {
            console.error('❌ Could not find the closing "];" in quizzes-list.js. Aborting update.');
            return;
        }
        
        const updatedContent = quizListContent.slice(0, closingBracketIndex) + newEntriesString + quizListContent.slice(closingBracketIndex);
        fs.writeFileSync(quizListPath, updatedContent, 'utf8');
        console.log(`\n✅ Successfully added ${quizzesAdded} new quiz(zes) to quizzes-list.js.`);
        console.log('🔔 Please open quizzes-list.js to review and adjust the new entries if needed.');
    } else {
        console.log('\n👍 No new quizzes to add. Your list is up to date.');
    }
}

updateQuizList();