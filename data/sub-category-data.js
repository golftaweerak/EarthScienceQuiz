/**
 * A centralized list of all sub-categories for quizzes.
 * This can be used to populate dropdowns in generator tools or for filtering.
 * The structure is designed to match the different ways sub-categories are used across quiz types.
 */
export const subCategoryData = {
  // Sub-categories for "วิทยาศาสตร์โลกและอวกาศ" (Earth & Space Science)
  // These are grouped by main topic (Geology, Meteorology, Astronomy)
  // and are typically used in the `specific` field of the subCategory object.
  EarthAndSpace: {
    Geology: [
      "1. องค์ประกอบโครงสร้างของโลก และกระบวนการที่เกิดขึ้นภายใน - พื้นผิวโลก",
      "2. ปรากฏการณ์ทางธณีวิทยา และธรณีสัณฐาน",
      "3. ลำดับเหตุการณ์ทางธรณีวิทยา",
      "4. ทรัพยากรแร่ หิน และซากดึกดำบรรพ์",
      "5. แผนที่ภูมิประเทศ และแผนที่ทางธรณีวิทยา",
      "6. ธรณีวิทยาโครงสร้าง และธรณีพิบัติภัย",
    ],
    Meteorology: [
      "7. สมดุลพลังงานของโลก และดวงอาทิตย์",
      "8. โครงสร้างบรรยากาศ ความชื้น การเกิดเมฆและปรากฏการณ์บนท้องฟ้า",
      "9. แผนที่อากาศ และการพยากรณ์อากาศ",
    ],
    Astronomy: [
      "10. วิทยาศาสตร์ดวงดาว พื้นผิว และรรณีวิทยาของดวงดาว",
      "11. เทหวัตถุ และดาวฤกษ์",
      "12. ทรงกลมท้องฟ้า ความส่องสว่าง และคาบการโคจร",
    ],
  },

  // Sub-categories for "ดาราศาสตร์ ม.ต้น" (Junior High Astronomy)
  // These are typically used as a string in the subCategory field.
  JuniorAstronomy: [
    "1. ส่วนประกอบของระบบสุริยะ",
    "2. ปฏิสัมพันธ์ภายในและผลกระทบต่อสิ่งแวดล้อมและสิ่งมีชีวิตบนโลก",
    "3. ตำแหน่งและลักษณะของดาวเคราะห์ในระบบสุริยะ",
    "4. กลุ่มดาวฤกษ์และการใช้ประโยชน์จากกลุ่มดาวฤกษ์",
    "5. ส่วนประกอบของกาแล๊กซีและเอกภพ",
    "6. ความก้าวหน้าของเทคโนโลยีอวกาศ",
    "7. ข่าวสารทางดาราศาสตร์สมัยใหม่",
    "8. การแปลงหน่วยและสัญลักษณ์ทางวิทยาศาสตร์",
    "9. เรขาคณิตวงกลม วงรี",
    "10. พีชคณิตเบื้องต้น",
    "11. ฟังก์ชันตรีโกณมิติ",
    "12. แรงและการเคลื่อนที่เบื้องต้น",
  ],

  // Sub-categories for "ดาราศาสตร์ ม.ปลาย" (Senior High Astronomy)
  // These are also typically used as a string in the subCategory field.
  SeniorAstronomy: [
    "1. ส่วนประกอบของระบบสุริยะ",
    "2. ปฏิสัมพันธ์ภายในและผลกระทบต่อสิ่งแวดล้อมและสิ่งมีชีวิตบนโลก",
    "3. ตำแหน่งและลักษณะของดาวเคราะห์ในระบบสุริยะ",
    "4. พิกัดและการเคลื่อนที่ของวัตถุท้องฟ้าเบื้องต้น",
    "5. กลุ่มดาวฤกษ์และการใช้ประโยชน์จากกลุ่มดาวฤกษ์",
    "6. ส่วนประกอบของกาแล๊กซีและเอกภพ",
    "7. ความก้าวหน้าของเทคโนโลยีอวกาศ",
    "8. ข่าวสารทางดาราศาสตร์สมัยใหม่",
    "9. สมบัติของดาวฤกษ์",
    "10. กำเนิดของเอกภพ",
    "11. การแปลงหน่วยและสัญลักษณ์ทางวิทยาศาสตร์",
    "12. เรขาคณิตวงกลม วงรี",
    "13. พีชคณิตเบื้องต้น ฟังก์ชันตรีโกณมิติ",
    "14. กฎของนิวตัน",
    "15. การเคลื่อนที่เป็นเส้นตรงและเส้นโค้ง",
    "16. พลังงานและโมเมนตัม",
    "17. ทฤษฎีคลื่นแม่เหล็กไฟฟ้าเบื้องต้น",
  ],
  Astronomy: [
    "1. ส่วนประกอบของระบบสุริยะ (ม.ต้น และ ม.ปลาย)",
    "2. ปฏิสัมพันธ์ภายในและผลกระทบต่อสิ่งแวดล้อมและสิ่งมีชีวิตบนโลก (ม.ต้น และ ม.ปลาย)",
    "3. ตำแหน่งและลักษณะของดาวเคราะห์ในระบบสุริยะ (ม.ต้น และ ม.ปลาย)",
    "4. กลุ่มดาวฤกษ์และการใช้ประโยชน์จากกลุ่มดาวฤกษ์ (ม.ต้น และ ม.ปลาย)",
    "5. ส่วนประกอบของกาแล๊กซีและเอกภพ (ม.ต้น และ ม.ปลาย)",
    "6. ความก้าวหน้าของเทคโนโลยีอวกาศ (ม.ต้น และ ม.ปลาย)",
    "7. ข่าวสารทางดาราศาสตร์สมัยใหม่ (ม.ต้น และ ม.ปลาย)",
    "8. การแปลงหน่วยและสัญลักษณ์ทางวิทยาศาสตร์ (ม.ต้น และ ม.ปลาย)",
    "9. เรขาคณิตวงกลม วงรี (ม.ต้น และ ม.ปลาย)",
    "10. พีชคณิตเบื้องต้น (ม.ต้น และ ม.ปลาย)",
    "11. ฟังก์ชันตรีโกณมิติ (ม.ต้น และ ม.ปลาย)",
    "12. แรงและการเคลื่อนที่เบื้องต้น (ม.ต้น)",
    "13. พิกัดและการเคลื่อนที่ของวัตถุท้องฟ้าเบื้องต้น (ม.ปลาย)",
    "14. สมบัติของดาวฤกษ์ (ม.ปลาย)",
    "15. กำเนิดของเอกภพ (ม.ปลาย)",
    "16. กฎของนิวตัน (ม.ปลาย)",
    "17. การเคลื่อนที่เป็นเส้นตรงและเส้นโค้ง (ม.ปลาย)",
    "18. พลังงานและโมเมนตัม (ม.ปลาย)",
    "19. ทฤษฎีคลื่นแม่เหล็กไฟฟ้าเบื้องต้น (ม.ปลาย)"
  ],
};

/**
 * Maps filename prefixes to their corresponding quiz types and metadata.
 * This centralizes logic for scripts like `update-quiz-list.js` (for category/icon assignment)
 * and `preview.js` (for the data generator).
 * The keys should be lowercase.
 */
export const quizPrefixInfo = {
  es: {
    mainCategory: 'EarthScience',
    icon: './assets/icons/geology.png',
    subCategoryKey: 'EarthAndSpace'
  },
  esr: {
    mainCategory: 'AstronomyReview',
    icon: './assets/icons/earth1.png',
    subCategoryKey: 'EarthAndSpace'
  },
  astro: {
    mainCategory: 'AstronomyReview',
    icon: './assets/icons/space.png',
    subCategoryKey: null // Uses simple string subcategories, not a predefined list from the generator.
  },
  junior: {
    mainCategory: 'Astronomy',
    icon: './assets/icons/astronomy1.png',
    subCategoryKey: 'JuniorAstronomy'
  },
  senior: {
    mainCategory: 'Astronomy',
    icon: './assets/icons/black-hole.png',
    subCategoryKey: 'SeniorAstronomy'
  },
  default: {
    mainCategory: 'GeneralKnowledge',
    icon: './assets/icons/study.png',
    subCategoryKey: null
  }
};

/**
 * A combined and structured list of all astronomy topics,
 * indicating which level (Junior, Senior, or both) each topic belongs to.
 * This provides a clearer overview for curriculum planning and content creation.
 */
export const combinedAstronomyTopics = [
  { topic: "ส่วนประกอบของระบบสุริยะ", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "ปฏิสัมพันธ์ภายในและผลกระทบต่อสิ่งแวดล้อมและสิ่งมีชีวิตบนโลก", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "ตำแหน่งและลักษณะของดาวเคราะห์ในระบบสุริยะ", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "กลุ่มดาวฤกษ์และการใช้ประโยชน์จากกลุ่มดาวฤกษ์", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "ส่วนประกอบของกาแล๊กซีและเอกภพ", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "ความก้าวหน้าของเทคโนโลยีอวกาศ", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "ข่าวสารทางดาราศาสตร์สมัยใหม่", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "การแปลงหน่วยและสัญลักษณ์ทางวิทยาศาสตร์", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "เรขาคณิตวงกลม วงรี", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "พีชคณิตเบื้องต้น", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "ฟังก์ชันตรีโกณมิติ", level: "ม.ต้น และ ม.ปลาย" },
  { topic: "แรงและการเคลื่อนที่เบื้องต้น", level: "ม.ต้น เท่านั้น" },
  { topic: "พิกัดและการเคลื่อนที่ของวัตถุท้องฟ้าเบื้องต้น", level: "ม.ปลาย เท่านั้น" },
  { topic: "สมบัติของดาวฤกษ์", level: "ม.ปลาย เท่านั้น" },
  { topic: "กำเนิดของเอกภพ", level: "ม.ปลาย เท่านั้น" },
  { topic: "กฎของนิวตัน", level: "ม.ปลาย เท่านั้น" },
  { topic: "การเคลื่อนที่เป็นเส้นตรงและเส้นโค้ง", level: "ม.ปลาย เท่านั้น" },
  { topic: "พลังงานและโมเมนตัม", level: "ม.ปลาย เท่านั้น" },
  { topic: "ทฤษฎีคลื่นแม่เหล็กไฟฟ้าเบื้องต้น", level: "ม.ปลาย เท่านั้น" },
];