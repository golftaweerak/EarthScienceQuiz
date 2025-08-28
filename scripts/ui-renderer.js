import { shuffleArray } from './utils.js';

/**
 * Renders a table from structured data.
 * This is a "dumb" component that only focuses on creating the table HTML.
 * It has no margins of its own.
 * @param {object} tableData - Object with 'headers' and 'rows' arrays.
 * @returns {string} The complete HTML string for the table.
 */
function renderTable(tableData) {
  if (!tableData || !tableData.headers || !tableData.rows) return '';

  const headerRow = tableData.headers
    .map(header => `<th scope="col" class="px-6 py-3 text-center">${header}</th>`)
    .join('');

  const bodyRows = tableData.rows
    .map(row => {
      const firstCell = `<th scope="row" class="whitespace-nowrap px-6 py-4 font-medium text-slate-900 dark:text-white">${row[0]}</th>`;
      const otherCells = row.slice(1).map(cell => `<td class="px-6 py-4 text-center font-mono">${cell}</td>`).join('');
      return `<tr class="border-b bg-white dark:border-slate-700 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-700/60">${firstCell}${otherCells}</tr>`;
    })
    .join('');

  // The wrapper div has no margin classes. Spacing is controlled by the parent.
  return `
    <div class="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <table class="w-full text-sm text-left text-slate-500 dark:text-slate-400">
        <thead class="bg-slate-100 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-300">
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renders a scenario block, including its title, description, and table.
 * This function is responsible for the layout and spacing of the scenario elements.
 * @param {object} scenarioData - The scenario object from the quiz data.
 * @returns {DocumentFragment} A fragment containing the rendered scenario.
 */
export function createScenarioContent(scenarioData) {
    const fragment = document.createDocumentFragment();
    
    // Use a container with `space-y-4` for automatic, consistent vertical spacing.
    const container = document.createElement('div');
    container.className = 'space-y-4';

    if (scenarioData.description?.text) {
        const textElement = document.createElement('p');
        textElement.className = 'text-gray-700 dark:text-gray-300'; 
        textElement.innerHTML = scenarioData.description.text.replace(/\n/g, "<br>");
        container.appendChild(textElement);
    }

    if (scenarioData.description?.table) {
        container.insertAdjacentHTML('beforeend', renderTable(scenarioData.description.table));
    }
    
    fragment.appendChild(container);
    return fragment;
}

/**
 * สร้างเนื้อหาของคำถาม (ตัวหนังสือและรูปภาพ)
 * @param {object} questionData - ข้อมูลของคำถามปัจจุบัน
 * @returns {DocumentFragment} Fragment ที่มีเนื้อหาของคำถาม
 */
export function createQuestionContent(questionData) {
    const fragment = document.createDocumentFragment();
    const questionText = document.createElement('div');
    questionText.innerHTML = (questionData.question || "").replace(/\n/g, "<br>");
    fragment.appendChild(questionText);

    if (questionData.image) {
        const image = document.createElement('img');
        image.src = questionData.image.src;
        image.alt = questionData.image.alt || 'ภาพประกอบคำถาม';
        image.className = 'mt-4 mx-auto rounded-lg shadow-md max-w-full h-auto';
        fragment.appendChild(image);
    }
    return fragment;
}

/**
 * สร้างตัวเลือกคำตอบทั้งหมดสำหรับคำถาม
 * @param {object} questionData - ข้อมูลของคำถามปัจจุบัน
 * @param {object|null} answerData - ข้อมูลคำตอบของผู้ใช้ (ถ้าเคยตอบแล้ว)
 * @returns {DocumentFragment} Fragment ที่มีปุ่มตัวเลือกทั้งหมด
 */
export function createOptions(questionData, answerData) {
    const fragment = document.createDocumentFragment();
    // เรายังคงสุ่มตัวเลือกที่นี่เพื่อให้การแสดงผลแต่ละครั้งไม่เหมือนเดิม
    const shuffledOptions = shuffleArray([...(questionData?.options || [])]);

    const isMultiSelect = questionData.type === 'multiple-select';

    shuffledOptions.forEach(optionText => {
        const optionElement = isMultiSelect
            ? _createCheckboxOption(optionText, answerData)
            : _createButtonOption(optionText, answerData);
        fragment.appendChild(optionElement);
    });

    return fragment;
}

/**
 * สร้างเนื้อหาสำหรับแสดงในกล่อง Feedback (เฉลย)
 * @param {boolean} isCorrect - สถานะว่าตอบถูกหรือไม่
 * @param {string} explanation - คำอธิบาย
 * @param {string|string[]} correctAnswer - คำตอบที่ถูกต้อง
 * @returns {DocumentFragment} Fragment ที่มีเนื้อหาของกล่อง Feedback
 */
export function createFeedbackContent(isCorrect, explanation, correctAnswer) {
    const fragment = document.createDocumentFragment();
    const explanationHtml = (explanation || "").replace(/\n/g, "<br>");
    const correctAnswerDisplay = Array.isArray(correctAnswer) ? correctAnswer.join(', ') : correctAnswer;

    let innerHTML = '';
    if (isCorrect) {
        innerHTML = `<h3 class="font-bold text-lg text-green-800 dark:text-green-300">ถูกต้อง!</h3><p class="text-green-700 dark:text-green-400 mt-2">${explanationHtml}</p>`;
    } else {
        innerHTML = `<h3 class="font-bold text-lg text-red-800 dark:text-red-300">ผิดครับ!</h3><p class="text-red-700 dark:text-red-400 mt-1">คำตอบที่ถูกต้องคือ: <strong>${correctAnswerDisplay}</strong></p><p class="text-red-700 dark:text-red-400 mt-2">${explanationHtml}</p>`;
    }
    
    // ใช้ template element เพื่อความปลอดภัยและประสิทธิภาพ
    const template = document.createElement('template');
    template.innerHTML = innerHTML;
    fragment.appendChild(template.content);

    return fragment;
}


// --- Internal Helper Functions (ไม่ export) ---

function _createButtonOption(optionText, answerData) {
    const button = document.createElement("button");
    button.innerHTML = optionText.replace(/\n/g, "<br>");
    button.dataset.optionValue = optionText.trim();
    button.className = "option-btn w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-left hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors";

    if (answerData) { // ถ้ามีข้อมูลการตอบแล้ว (เช่น ตอนกลับมาดูข้อเก่า)
        button.disabled = true;
        const isCorrectOption = optionText.trim() === String(answerData.correctAnswer).trim();
        const wasSelected = optionText.trim() === String(answerData.selectedAnswer).trim();

        if (isCorrectOption) button.classList.add("correct");
        else if (wasSelected) button.classList.add("incorrect");
    }
    return button;
}

function _createCheckboxOption(optionText, answerData) {
    const wrapperLabel = document.createElement('label');
    wrapperLabel.className = 'option-checkbox-wrapper flex items-center w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-colors duration-150';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = optionText.trim();
    checkbox.className = 'h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 pointer-events-none';

    const textSpan = document.createElement('span');
    textSpan.innerHTML = optionText.replace(/\n/g, "<br>");
    textSpan.className = 'ml-3 text-gray-800 dark:text-gray-200 w-full';

    wrapperLabel.appendChild(checkbox);
    wrapperLabel.appendChild(textSpan);

    if (answerData) {
        checkbox.disabled = true;
        wrapperLabel.classList.add('cursor-not-allowed', 'opacity-75');
        wrapperLabel.classList.remove('hover:bg-gray-100', 'dark:hover:bg-gray-700', 'hover:border-blue-500', 'dark:hover:border-blue-500', 'cursor-pointer');

        const selectedAnswers = new Set(answerData.selectedAnswer || []);
        const correctAnswers = new Set(answerData.correctAnswer || []);

        if (correctAnswers.has(optionText.trim())) {
            wrapperLabel.classList.add('correct');
        } else if (selectedAnswers.has(optionText.trim())) {
            wrapperLabel.classList.add('incorrect');
        }
        if (selectedAnswers.has(optionText.trim())) {
            checkbox.checked = true;
        }
    }
    return wrapperLabel;
}