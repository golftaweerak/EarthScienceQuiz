
import { AlignmentType, Document, Packer, Paragraph, TabStopPosition, TabStopType, TextRun } from "docx";

export function exportQuizToDocx(quizData) {
    if (!quizData) {
        console.error("No quiz data available to export.");
        return;
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: quizData.title,
                    heading: "Title",
                    alignment: AlignmentType.CENTER,
                }),
                ...quizData.questions.flatMap((question, index) => {
                    const questionNumber = index + 1;
                    const children = [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${questionNumber}. ${question.question}`,
                                    bold: true,
                                }),
                            ],
                        }),
                    ];

                    if (question.choices) {
                        question.choices.forEach((choice, choiceIndex) => {
                            children.push(
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: `	${String.fromCharCode(97 + choiceIndex)}. ${choice}`,
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
                                    text: `Answer: ${question.answer}`,
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
        a.download = `${quizData.id}.docx`;
        a.click();
        window.URL.revokeObjectURL(url);
    });
}
