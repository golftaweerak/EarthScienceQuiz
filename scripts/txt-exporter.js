/**
 * Exports the provided quiz data to a plain .txt file.
 * Answers and explanations are explicitly excluded from the export.
 * @param {object} quizData - The quiz data to export.
 * @param {string} quizData.id - The ID of the quiz.
 * @param {string} quizData.title - The title of the quiz.
 * @param {Array<object>} quizData.questions - The array of question objects.
 */
export function exportQuizToTxt(quizData, includeKeyInFilename = false) {
    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        console.error("No quiz data available to export.");
        alert("ไม่มีข้อมูลสำหรับส่งออก หรือชุดข้อสอบที่เลือกว่างเปล่า");
        return;
    }

    try {
        let textContent = "";
        textContent += `${quizData.title}\n`;
        textContent += `=====================================\n\n`;

        let lastScenarioTitle = null; // Initialize to null

        quizData.questions.forEach((question, index) => {
            if (!question) return; // Skip if question is null or undefined

            // Check if this question belongs to a new scenario
            if (question.scenarioTitle && question.scenarioTitle !== lastScenarioTitle) {
                textContent += `\n--- สถานการณ์: ${question.scenarioTitle} ---\n`;
                if (question.scenarioDescription) {
                    // Clean up HTML tags and extra newlines from description
                    const cleanDescription = question.scenarioDescription.replace(/<[^>]*>?/gm, '').replace(/\n\s*\n/g, '\n').trim();
                    textContent += `${cleanDescription}\n\n`;
                }
                lastScenarioTitle = question.scenarioTitle; // Update last printed scenario
            } else if (!question.scenarioTitle) {
                // Reset lastScenarioTitle if the current question is not part of any scenario
                lastScenarioTitle = null;
            }

            const questionNumber = index + 1;
            textContent += `${questionNumber}. ${question.question || ''}\n`;

            const choices = question.choices || question.options;
            const thaiNumerals = ['ก', 'ข', 'ค', 'ง', 'จ'];
            if (choices && Array.isArray(choices)) {
                choices.forEach((choice, choiceIndex) => {
                    textContent += `   ${thaiNumerals[choiceIndex] || (choiceIndex + 1)}. ${choice || ''}\n`;
                });
            }

            // Include answer and explanation if includeKeyInFilename is true
            if (includeKeyInFilename) {
                if (question.answer) {
                    textContent += `เฉลย: ${question.answer}\n`;
                }
                if (question.explanation) {
                    // Clean up HTML tags and extra newlines from explanation
                    const cleanExplanation = question.explanation.replace(/<[^>]*>?/gm, '').replace(/\n\s*\n/g, '\n').trim();
                    textContent += `คำอธิบาย: ${cleanExplanation}\n`;
                }
            }

            textContent += `\n`;
        });

        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
                    const filename = `${quizData.id || 'quiz'}${includeKeyInFilename ? '-key' : ''}.txt`;
            a.download = filename;
        document.body.appendChild(a); // Required for Firefox
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error("Error creating TXT file:", error);
        alert("เกิดข้อผิดพลาดในการสร้างไฟล์ .txt");
    }
}