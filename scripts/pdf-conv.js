// ข้อมูล JSON ของคุณ (ใส่ไว้ในตัวแปร)
const quizData = {
  "title": "แบบทดสอบเตรียมความพร้อม สอวน. วิทยาศาสตร์โลกและอวกาศ | ชุด 2",
  "description": "แบบทดสอบนี้มีทั้งหมด 3 ส่วน รวม 150 ข้อ...",
  "sections": [
    {
      "title": "ส่วนที่ 1: ธรณีวิทยา (50 ข้อ)",
      "questions": [
        { "number": 1, "text": "ชั้นโครงสร้างโลกใดที่มีสถานะเป็นของเหลวและเป็นสาเหตุสำคัญของการเกิดสนามแม่เหล็กโลก", "options": [{ "label": "ก", "text": "เปลือกโลก (Crust)" }, { "label": "ข", "text": "เนื้อโลก (Mantle)" }, { "label": "ค", "text": "แก่นโลกชั้นนอก (Outer Core)" }, { "label": "ง", "text": "แก่นโลกชั้นใน (Inner Core)" }], "answer": "ค" },
        { "number": 2, "text": "'ไซมา' (SIMA) เป็นชื่อเรียกของเปลือกโลกส่วนใด และประกอบด้วยธาตุหลักอะไร", "options": [{ "label": "ก", "text": "เปลือกโลกทวีป, ซิลิคอนและแมกนีเซียม" }, { "label": "ข", "text": "เปลือกโลกมหาสมุทร, ซิลิคอนและอะลูมิเนียม" }, { "label": "ค", "text": "เปลือกโลกทวีป, ซิลิคอนและอะลูมิเนียม" }, { "label": "ง", "text": "เปลือกโลกมหาสมุทร, ซิลิคอนและแมกนีเซียม" }], "answer": "ง" },
        { "number": 11, "prompt": "พิจารณาภาพตัดขวางทางธรณีวิทยา ซึ่งแสดงชั้นหิน A, B, C, E และพนังหินอัคนี (Dike) F โดยชั้นหินไม่มีการพลิกกลับ ด้านบนสุดของชั้น A ถูกกัดกร่อนเป็นผิวไม่ต่อเนื่อง และมีชั้น D ซึ่งเป็นตะกอนแม่น้ำทับอยู่", "image": "geological_cross_section.png", "text": "เหตุการณ์ใดเกิดขึ้นหลังสุด", "options": [{ "label": "ก", "text": "การสะสมตัวของชั้นหิน B" }, { "label": "ข", "text": "การแทรกดันของพนังหินอัคนี F" }, { "label": "ค", "text": "การกัดกร่อนผิวของชั้นหิน A" }, { "label": "ง", "text": "การสะสมตัวของชั้นหิน D" }], "answer": "ง" }
        // ... คำถามอื่นๆ
      ]
    }
    // ... ส่วนอื่นๆ
  ]
};

// ส่วนที่ 1: สร้าง HTML จากข้อมูล JSON
const container = document.getElementById('quiz-container');
let contentHTML = `<h1>${quizData.title}</h1>`;

quizData.sections.forEach(section => {
    contentHTML += `<h2>${section.title}</h2>`;
    section.questions.forEach(q => {
        contentHTML += `<div class="question-block">`;
        // เพิ่มคำอธิบายและรูปภาพ ถ้ามี
        if (q.prompt) {
            contentHTML += `<p><em>${q.prompt}</em></p>`;
        }
        if (q.image) {
            // **หมายเหตุ:** คุณต้องมีไฟล์รูปภาพตามชื่อที่ระบุใน JSON
            contentHTML += `<img src="${q.image}" alt="ภาพประกอบข้อ ${q.number}">`;
        }
        // เพิ่มคำถาม
        contentHTML += `<p><b>${q.number}.</b> ${q.text}</p>`;
        // เพิ่มตัวเลือก
        contentHTML += `<ul>`;
        q.options.forEach(opt => {
            contentHTML += `<li><b>${opt.label}.</b> ${opt.text}</li>`;
        });
        contentHTML += `</ul></div>`;
    });
});

// นำ HTML ที่สร้างเสร็จแล้วไปแสดงใน container
container.innerHTML = contentHTML;


// ส่วนที่ 2: สั่งให้สร้าง PDF เมื่อกดปุ่ม
document.getElementById('download-btn').addEventListener('click', () => {
    const element = document.getElementById('quiz-container');
    const opt = {
      margin:       10, // หน่วยเป็น mm
      filename:     'แบบทดสอบ_สอวน_ชุดที่2.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // เรียกใช้ html2pdf
    html2pdf().from(element).set(opt).save();
});