/**
 * A centralized list of all sub-categories for quizzes.
 * This file serves as the single source of truth for quiz topic structures.
 * This can be used to populate dropdowns in generator tools or for filtering.
 * The structure is designed to match the different ways sub-categories are used across quiz types.
 */

/**
 * Constants for quiz levels to avoid magic strings and ensure consistency.
 */
export const LEVELS = {
  JUNIOR_AND_SENIOR: "ม.ต้น และ ม.ปลาย",
  JUNIOR_ONLY: "ม.ต้น เท่านั้น",
  SENIOR_ONLY: "ม.ปลาย เท่านั้น",
};

/**
 * Constants for main category keys.
 */
export const MAIN_CATEGORIES = {
  EARTH_SCIENCE: 'EarthScience',
  ASTRONOMY_REVIEW: 'AstronomyReview',
  ASTRONOMY_POSN: 'AstronomyPOSN',
  GENERAL_KNOWLEDGE: 'GeneralKnowledge',
};

export const subCategoryData = {
  // Sub-categories for "วิทยาศาสตร์โลกและอวกาศ" (Earth & Space Science)
  // These are grouped by main topic (Geology, Meteorology, Astronomy)
  // and are typically used in the `specific` field of the subCategory object.
  EarthAndSpace: {
    Geology: [
      "องค์ประกอบโครงสร้างของโลก และกระบวนการที่เกิดขึ้นภายใน - พื้นผิวโลก",
      "ปรากฏการณ์ทางธณีวิทยา และธรณีสัณฐาน",
      "ลำดับเหตุการณ์ทางธรณีวิทยา",
      "ทรัพยากรแร่ หิน และซากดึกดำบรรพ์",
      "แผนที่ภูมิประเทศ และแผนที่ทางธรณีวิทยา",
      "ธรณีวิทยาโครงสร้าง และธรณีพิบัติภัย",
    ],
    Meteorology: [
      "สมดุลพลังงานของโลก และดวงอาทิตย์",
      "โครงสร้างบรรยากาศ ความชื้น การเกิดเมฆและปรากฏการณ์บนท้องฟ้า",
      "แผนที่อากาศ และการพยากรณ์อากาศ",
    ],
    Astronomy: [
      "วิทยาศาสตร์ดวงดาว พื้นผิว และธรณีวิทยาของดวงดาว",
      "เทหวัตถุ และดาวฤกษ์",
      "ทรงกลมท้องฟ้า ความส่องสว่าง และคาบการโคจร",
    ],
  },

  /**
   * A combined and structured list of all astronomy topics for the "ดาราศาสตร์" category,
   * indicating which level (Junior, Senior, or both) each topic belongs to.
   * This provides a clearer overview for curriculum planning and content creation.
   * The `level` property can be used for filtering.
   */
  Astronomy: [
    { topic: "ส่วนประกอบของระบบสุริยะ", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ปฏิสัมพันธ์ภายในและผลกระทบต่อสิ่งแวดล้อมและสิ่งมีชีวิตบนโลก", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ตำแหน่งและลักษณะของดาวเคราะห์ในระบบสุริยะ", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "กลุ่มดาวฤกษ์และการใช้ประโยชน์จากกลุ่มดาวฤกษ์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ส่วนประกอบของกาแล๊กซีและเอกภพ", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ความก้าวหน้าของเทคโนโลยีอวกาศ", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ข่าวสารทางดาราศาสตร์สมัยใหม่", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "การแปลงหน่วยและสัญลักษณ์ทางวิทยาศาสตร์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "เรขาคณิตวงกลม วงรี", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "พีชคณิตเบื้องต้น", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ฟังก์ชันตรีโกณมิติ", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "กฎของนิวตัน แรงและการเคลื่อนที่เบื้องต้น", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "พิกัดและการเคลื่อนที่ของวัตถุท้องฟ้าเบื้องต้น", level: LEVELS.SENIOR_ONLY },
    { topic: "สมบัติของดาวฤกษ์", level: LEVELS.SENIOR_ONLY },
    { topic: "กำเนิดของเอกภพ", level: LEVELS.SENIOR_ONLY },
    { topic: "การเคลื่อนที่เป็นเส้นตรงและเส้นโค้ง", level: LEVELS.SENIOR_ONLY },
    { topic: "พลังงานและโมเมนตัม", level: LEVELS.SENIOR_ONLY },
    { topic: "ทฤษฎีคลื่นแม่เหล็กไฟฟ้าเบื้องต้น", level: LEVELS.SENIOR_ONLY },
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
    mainCategory: MAIN_CATEGORIES.EARTH_SCIENCE,
    icon: './assets/icons/geology.png',
    subCategoryKey: 'EarthAndSpace'
  },
  esr: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_REVIEW,
    icon: './assets/icons/earth1.png',
    subCategoryKey: 'EarthAndSpace'
  },
  astro: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_REVIEW,
    icon: './assets/icons/space.png',
    subCategoryKey: null // Uses simple string subcategories, not a predefined list from the generator.
  },
  junior: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_POSN,
    icon: './assets/icons/astronomy1.png',
    subCategoryKey: 'Astronomy' // Uses the structured Astronomy list
  },
  senior: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_POSN,
    icon: './assets/icons/black-hole.png',
    subCategoryKey: 'Astronomy' // Also uses the structured Astronomy list
  },
  default: {
    mainCategory: MAIN_CATEGORIES.GENERAL_KNOWLEDGE,
    icon: './assets/icons/study.png',
    subCategoryKey: null
  }
};