
export function exportQuizToDocx(quizData) {
    // Use the global 'docx' object provided by the CDN script
    const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;

    if (!quizData || !quizData.questions || quizData.questions.length === 0) {
        console.error("No quiz data available to export.");
        alert("ไม่มีข้อมูลสำหรับส่งออก หรือชุดข้อสอบที่เลือกว่างเปล่า");
        return;
    }

    try {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: quizData.title,
                        heading: "Title",
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: "" }), // Add a blank line for spacing
                    ...quizData.questions.flatMap((question, index) => {
                        if (!question) return []; // Skip if question is null or undefined
                        const questionNumber = index + 1;
                        const children = [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${questionNumber}. ${question.question || ''}`,
                                        bold: true,
                                    }),
                                ],
                            }),
                        ];

                        const choices = question.choices || question.options;
                        if (choices && Array.isArray(choices)) {
                            choices.forEach((choice, choiceIndex) => {
                                children.push(
                                    new Paragraph({
                                        children: [
                                            new TextRun({
                                                text: `	${String.fromCharCode(97 + choiceIndex)}. ${choice || ''}`,
                                            }),
                                        ],
                                    })
                                );
                            });
                        }

                        children.push(
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Answer: ${question.answer || ''}`,
                                        color: "FF0000",
                                    }),
                                ],
                            })
                        );

                        children.push(new Paragraph({ text: "" })); // Add a blank line for spacing

                        return children;
                    }),
                ],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${quizData.id || 'quiz'}.docx`;
            document.body.appendChild(a); // Required for Firefox
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });
    } catch (error) {
        console.error("Error creating DOCX file:", error);
        alert("เกิดข้อผิดพลาดในการสร้างไฟล์ .docx");
    }
}
