/**
 * A centralized list of all sub-categories for quizzes.
 * This file serves as the single source of truth for quiz topic structures.
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
      "10. วิทยาศาสตร์ดวงดาว พื้นผิว และธรณีวิทยาของดวงดาว",
      "11. เทหวัตถุ และดาวฤกษ์",
      "12. ทรงกลมท้องฟ้า ความส่องสว่าง และคาบการโคจร",
    ],
  },

  /**
   * A combined and structured list of all astronomy topics for the "ดาราศาสตร์" category,
   * indicating which level (Junior, Senior, or both) each topic belongs to.
   * This provides a clearer overview for curriculum planning and content creation.
   * The `level` property can be used for filtering.
   */
  Astronomy: [
    { topic: "1. ส่วนประกอบของระบบสุริยะ", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "2. ปฏิสัมพันธ์ภายในและผลกระทบต่อสิ่งแวดล้อมและสิ่งมีชีวิตบนโลก", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "3. ตำแหน่งและลักษณะของดาวเคราะห์ในระบบสุริยะ", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "4. กลุ่มดาวฤกษ์และการใช้ประโยชน์จากกลุ่มดาวฤกษ์", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "5. ส่วนประกอบของกาแล๊กซีและเอกภพ", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "6. ความก้าวหน้าของเทคโนโลยีอวกาศ", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "7. ข่าวสารทางดาราศาสตร์สมัยใหม่", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "8. การแปลงหน่วยและสัญลักษณ์ทางวิทยาศาสตร์", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "9. เรขาคณิตวงกลม วงรี", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "10. พีชคณิตเบื้องต้น", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "11. ฟังก์ชันตรีโกณมิติ", level: "ม.ต้น และ ม.ปลาย" },
    { topic: "12. แรงและการเคลื่อนที่เบื้องต้น", level: "ม.ต้น เท่านั้น" },
    { topic: "13. พิกัดและการเคลื่อนที่ของวัตถุท้องฟ้าเบื้องต้น", level: "ม.ปลาย เท่านั้น" },
    { topic: "14. สมบัติของดาวฤกษ์", level: "ม.ปลาย เท่านั้น" },
    { topic: "15. กำเนิดของเอกภพ", level: "ม.ปลาย เท่านั้น" },
    { topic: "16. กฎของนิวตัน", level: "ม.ปลาย เท่านั้น" },
    { topic: "17. การเคลื่อนที่เป็นเส้นตรงและเส้นโค้ง", level: "ม.ปลาย เท่านั้น" },
    { topic: "18. พลังงานและโมเมนตัม", level: "ม.ปลาย เท่านั้น" },
    { topic: "19. ทฤษฎีคลื่นแม่เหล็กไฟฟ้าเบื้องต้น", level: "ม.ปลาย เท่านั้น" },
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
    subCategoryKey: 'Astronomy' // Uses the structured Astronomy list
  },
  senior: {
    mainCategory: 'Astronomy',
    icon: './assets/icons/black-hole.png',
    subCategoryKey: 'Astronomy' // Also uses the structured Astronomy list
  },
  default: {
    mainCategory: 'GeneralKnowledge',
    icon: './assets/icons/study.png',
    subCategoryKey: null
  }
};