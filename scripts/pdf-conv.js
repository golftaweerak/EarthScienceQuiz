document.addEventListener('DOMContentLoaded', () => {
    const quizSelector = document.getElementById('quiz-selector');
    const container = document.getElementById('quiz-container');
    const downloadButton = document.getElementById('download-btn');

    let currentQuizData = null; // To store the loaded and flattened data
    let currentQuizTitle = ''; // To store the title for the PDF filename

    // --- 1. Populate Dropdown ---
    function populateQuizSelector() {
        if (typeof quizList !== 'undefined' && Array.isArray(quizList)) {
            quizList.forEach(quiz => {
                const option = document.createElement('option');
                option.value = `${quiz.id}-data.js`;
                option.textContent = quiz.title;
                quizSelector.appendChild(option);
            });
        }
    }

    // --- 2. Render Quiz HTML ---
    function renderQuizHTML(data, title) {
        if (!data || data.length === 0) {
            container.innerHTML = `<p class="placeholder">ไม่พบข้อมูลในไฟล์ที่เลือก</p>`;
            return;
        }

        let contentHTML = `<h1>${title}</h1>`;
        let questionCounter = 0;

        // Group questions by scenario for rendering
        const groupedData = [];
        let currentScenarioGroup = null;
        data.forEach(item => {
            if (item.scenarioTitle) {
                if (currentScenarioGroup && currentScenarioGroup.title === item.scenarioTitle) {
                    currentScenarioGroup.questions.push(item);
                } else {
                    currentScenarioGroup = { isScenario: true, title: item.scenarioTitle, description: item.scenarioDescription, questions: [item] };
                    groupedData.push(currentScenarioGroup);
                }
            } else {
                currentScenarioGroup = null;
                groupedData.push({ isScenario: false, questions: [item] });
            }
        });

        groupedData.forEach(group => {
            if (group.isScenario) {
                contentHTML += `<h2>${group.title}</h2>`;
                if (group.description) {
                    contentHTML += `<p><em>${group.description.replace(/\n/g, '<br>')}</em></p>`;
                }
            }
            group.questions.forEach(q => {
                questionCounter++;
                contentHTML += `<div class="question-block">`;
                const questionText = q.question || q.text || '';
                contentHTML += `<p><b>${questionCounter}.</b> ${questionText.replace(/\n/g, '<br>')}</p>`;
                
                const choices = q.choices || q.options;
                if (choices && Array.isArray(choices)) {
                    contentHTML += `<ul>`;
                    const thaiNumerals = ['ก', 'ข', 'ค', 'ง', 'จ'];
                    choices.forEach((choice, index) => {
                        // Handle both string choices and object choices {label, text}
                        const choiceText = typeof choice === 'object' ? choice.text : choice;
                        const choiceLabel = typeof choice === 'object' ? choice.label : thaiNumerals[index];
                        contentHTML += `<li><b>${choiceLabel}.</b> ${choiceText}</li>`;
                    });
                    contentHTML += `</ul>`;
                }
                contentHTML += `</div>`;
            });
        });

        container.innerHTML = contentHTML;

        // NEW: Trigger KaTeX rendering on the new content
        // This finds all math expressions and renders them.
        if (window.renderMathInElement) {
            renderMathInElement(container, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    }

    // --- 3. Flatten Data Structure ---
    // This function ensures that no matter the data file's structure, we get a simple array of questions.
    function flattenQuizData(data) {
        let flattenedData = [];
        if (!Array.isArray(data)) return [];

        data.forEach(item => {
            if (item.type === 'scenario' && Array.isArray(item.questions)) {
                const scenarioQuestions = item.questions.map(q => ({
                    ...q,
                    scenarioTitle: item.title,
                    scenarioDescription: item.description
                }));
                flattenedData.push(...scenarioQuestions);
            } else if (item.type === 'question' || !item.type) { // Handles questions and legacy format
                flattenedData.push(item);
            }
        });
        return flattenedData;
    }

    // --- 4. Load and Process Quiz Data ---
    async function loadAndRenderQuiz(scriptName) {
        container.innerHTML = `<p class="placeholder">กำลังโหลดข้อมูล...</p>`;
        if (downloadButton) downloadButton.disabled = true;
        currentQuizData = null;

        const scriptPath = `data/${scriptName}`;
        try {
            const response = await fetch(scriptPath);
            if (!response.ok) throw new Error(`ไม่สามารถโหลดไฟล์ได้ (${response.status})`);
            
            const scriptText = await response.text();
            // Execute script text in a new function scope to get the data variable.
            // This is robust enough to handle variables named `quizData` or `quizItems`.
            const data = new Function(`${scriptText}; if (typeof quizData !== 'undefined') return quizData; if (typeof quizItems !== 'undefined') return quizItems; return undefined;`)();

            if (!data) throw new Error('ไม่พบตัวแปร quizData หรือ quizItems ในไฟล์');

            currentQuizTitle = quizSelector.options[quizSelector.selectedIndex].text;
            currentQuizData = flattenQuizData(data);
            renderQuizHTML(currentQuizData, currentQuizTitle);
            if (downloadButton) downloadButton.disabled = false;
            return true; // Indicate success

        } catch (error) {
            console.error(`Error loading or processing ${scriptPath}:`, error);
            container.innerHTML = `<p class="placeholder error">เกิดข้อผิดพลาด: ${error.message}</p>`;
            if (downloadButton) downloadButton.disabled = true;
            return false; // Indicate failure
        }
    }

    // --- 5. PDF Generation ---
    // Extracted the logic into a named function for reusability
    async function triggerPdfGeneration() {
        if (!currentQuizData) {
            alert('กรุณาเลือกชุดข้อสอบก่อน');
            return;
        }

        const btn = downloadButton;
        const originalButtonText = btn.textContent; // Use textContent for button text
        btn.disabled = true;
        btn.textContent = 'กำลังเตรียมฟอนต์...'; // More accurate status

        try {
            // --- Definitive Fix for Blank PDF ---
            // 1. Wait for all fonts (especially KaTeX fonts) to be downloaded and ready.
            await document.fonts.ready;
            console.log("All fonts are loaded and ready.");

            btn.textContent = 'กำลังสร้าง PDF...'; // Update status

            const elementToPrint = document.getElementById('quiz-container');
            const pdfElement = elementToPrint.cloneNode(true); // Work on a copy

            // Apply PDF-friendly styles
            pdfElement.style.margin = '0';
            pdfElement.style.padding = '0';
            pdfElement.style.boxShadow = 'none';
            pdfElement.style.width = '100%';

            // Add to DOM off-screen
            pdfElement.style.position = 'absolute';
            pdfElement.style.left = '-9999px';
            document.body.appendChild(pdfElement);

            // 2. Force the browser to calculate the layout of the cloned element.
            // This ensures that all styles are applied before html2canvas reads the element.
            pdfElement.getBoundingClientRect();
            console.log("Forced reflow on the cloned element.");

            // 3. Give the browser a single frame to paint. This is the final step
            // to ensure the visual representation is ready for capture.
            await new Promise(resolve => requestAnimationFrame(resolve));
            console.log("Paint cycle complete. Starting PDF generation.");

            // Sanitize filename
            const filename = `${currentQuizTitle.replace(/[\\/:*?"<>|]/g, '').replace(/ /g, '_')}.pdf`;

            const opt = {
                margin: 15,
                filename: filename,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: 'css', avoid: '.question-block' }
            };

            // Generate the PDF.
            await html2pdf().from(pdfElement).set(opt).save();

            // Cleanup
            btn.textContent = originalButtonText; // Restore button text
            btn.disabled = false; // Re-enable the button
            document.body.removeChild(pdfElement);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert(`ขออภัย, เกิดข้อผิดพลาดในการสร้าง PDF: ${err.message}`);
            // Ensure button is restored on failure
            btn.disabled = false;
            btn.textContent = originalButtonText;
        }
    }

    if (downloadButton) {
        downloadButton.addEventListener('click', triggerPdfGeneration);
    }

    // --- 6. Initial Setup ---
    quizSelector.addEventListener('change', (event) => {
        const selectedScript = event.target.value;
        if (selectedScript) {
            loadAndRenderQuiz(selectedScript);
        } else {
            container.innerHTML = `<p class="placeholder">โปรดเลือกชุดข้อสอบเพื่อแสดงตัวอย่าง...</p>`;
            downloadButton.disabled = true;
        }
    });

    populateQuizSelector();

    // --- Auto-load from URL parameter ---
    async function autoLoadFromUrl() {
        const params = new URLSearchParams(window.location.search);
        const scriptNameFromUrl = params.get('script');

        if (scriptNameFromUrl) {
            // Find the option in the selector that matches the script name
            const optionToSelect = Array.from(quizSelector.options).find(opt => opt.value === scriptNameFromUrl);
            if (optionToSelect) {
                // Set the dropdown to the correct value and trigger the loading process
                optionToSelect.selected = true;
                await loadAndRenderQuiz(scriptNameFromUrl); // Only load and render, do not generate PDF
            } else {
                container.innerHTML = `<p class="placeholder error">ไม่พบชุดข้อสอบที่ตรงกับ URL ที่ระบุ (${scriptNameFromUrl})</p>`;
            }
        }
    }
    autoLoadFromUrl(); // Call the new function after populating the selector
});