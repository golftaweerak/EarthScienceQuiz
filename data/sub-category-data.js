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
  CHALLENGE_POSN: 'ChallengePOSN'
};

export const subCategoryData = {
  // Sub-categories for "วิทยาศาสตร์โลกและอวกาศ" (Earth & Space Science)
  // These are grouped by main topic (Geology, Meteorology, Astronomy)
  // and are typically used in the `specific` field of the subCategory object.
  EarthAndSpace: {
    Geology: [
      "โครงสร้างโลกและธรณีแปรสัณฐาน",
      "แร่ หิน และวัฏจักรหิน",
      "ธรณีประวัติและลำดับชั้นหิน",
      "ธรณีสัณฐานและกระบวนการบนพื้นผิวโลก",
      "ธรณีพิบัติภัย",
      "ทรัพยากรธรณีและธรณีวิทยาสิ่งแวดล้อม",
      "แผนที่และการสำรวจทางธรณีวิทยา",
    ],
    Meteorology: [
      "องค์ประกอบและชั้นบรรยากาศ",
      "สมดุลพลังงานของโลกและรังสี",
      "อุณหภูมิ ความกดอากาศ และลม",
      "ความชื้น เมฆ และหยาดน้ำฟ้า",
      "มวลอากาศและแนวปะทะอากาศ",
      "พายุและสภาพอากาศรุนแรง",
      "แผนที่อากาศและการพยากรณ์อากาศ",
      "ภูมิอากาศและการเปลี่ยนแปลง",
    ],
    Astronomy: [
      "ทรงกลมท้องฟ้าและระบบพิกัด",
      "กลศาสตร์ท้องฟ้าและกฎของเคปเลอร์",
      "ระบบสุริยะและองค์ประกอบ",
      "ดาวฤกษ์ คุณสมบัติและวิวัฒนาการ",
      "กาแล็กซีและเอกภพวิทยา",
      "กล้องโทรทรรศน์และเทคโนโลยีอวกาศ",
    ],
    Oceanography: [
      "คุณสมบัติทางกายภาพและเคมีของน้ำทะเล",
      "คลื่น น้ำขึ้นน้ำลง และการหมุนเวียนของกระแสน้ำ",
      "ปฏิสัมพันธ์ระหว่างมหาสมุทรและบรรยากาศ",
      "สิ่งมีชีวิตและระบบนิเวศทางทะเล",
      "ธรณีวิทยาและสัณฐานพื้นสมุทร",
      "ทรัพยากรและมลพิษทางทะเล",
    ],
  },

  /**
   * A combined and structured list of all astronomy topics for the "ดาราศาสตร์" category,
   * indicating which level (Junior, Senior, or both) each topic belongs to.
   * This provides a clearer overview for curriculum planning and content creation.
   * The `level` property can be used for filtering.
   */
  ASTRONOMY_POSN: [
    // Foundational Math & Physics
    { topic: "การแปลงหน่วยและสัญลักษณ์ทางวิทยาศาสตร์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "พีชคณิตเบื้องต้น", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "เรขาคณิตวงกลม วงรี", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ฟังก์ชันตรีโกณมิติ", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "การเคลื่อนที่เป็นเส้นตรงและเส้นโค้ง", level: LEVELS.SENIOR_ONLY },
    { topic: "กฎของนิวตัน แรงและการเคลื่อนที่เบื้องต้น", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "พลังงานและโมเมนตัม", level: LEVELS.SENIOR_ONLY },
    { topic: "ทฤษฎีคลื่นแม่เหล็กไฟฟ้าเบื้องต้น", level: LEVELS.SENIOR_ONLY },
    // Core Astronomy - Aligned with EarthAndSpace.Astronomy for consistency
    { topic: "ทรงกลมท้องฟ้าและระบบพิกัด", level: LEVELS.SENIOR_ONLY },
    { topic: "กลศาสตร์ท้องฟ้าและกฎของเคปเลอร์", level: LEVELS.SENIOR_ONLY },
    { topic: "ระบบสุริยะและองค์ประกอบ", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ดาวฤกษ์ คุณสมบัติและวิวัฒนาการ", level: LEVELS.SENIOR_ONLY },
    { topic: "กาแล็กซีและเอกภพวิทยา", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "กล้องโทรทรรศน์และเทคโนโลยีอวกาศ", level: LEVELS.JUNIOR_AND_SENIOR },
    // Foundational & Applied Topics
    { topic: "กลุ่มดาวฤกษ์และการใช้ประโยชน์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ปฏิสัมพันธ์ในระบบโลก-ดวงจันทร์-ดวงอาทิตย์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ข่าวสารและความก้าวหน้าทางดาราศาสตร์", level: LEVELS.JUNIOR_AND_SENIOR },
  ],
};
/*
/**
 * Maps filename prefixes to their corresponding main categories, icons, and sub-category validation keys.
 * - `es`, `esr`: Earth Science Olympiad (วิทยาศาสตร์โลกและอวกาศ), uses `EarthAndSpace` sub-categories.
 * - `junior`, `senior`: Astronomy Olympiad (ดาราศาสตร์ สอวน.), uses `ASTRONOMY_POSN` sub-categories.
 * - `astro`: Astronomy Review quizzes, uses `ASTRONOMY_POSN` sub-categories.
 * - `adv`: Advanced/Challenge quizzes, uses `EarthAndSpace` sub-categories.
 */
export const quizPrefixInfo = {
  // --- Earth Science Olympiad ---
  es: {
    mainCategory: MAIN_CATEGORIES.EARTH_SCIENCE,
    icon: './assets/icons/geology.png',
    subCategoryKey: 'EarthAndSpace',
  },
  esr: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_REVIEW,
    icon: './assets/icons/earth1.png',
    subCategoryKey: 'EarthAndSpace',
  },
  // --- Astronomy Olympiad ---
  junior: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_POSN,
    icon: './assets/icons/astronomy1.png',
    subCategoryKey: 'ASTRONOMY_POSN', // Uses the structured Astronomy list
  },
  senior: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_POSN,
    icon: './assets/icons/black-hole.png',
    subCategoryKey: 'ASTRONOMY_POSN', // Also uses the structured Astronomy list
  },
  adv: {
    mainCategory: MAIN_CATEGORIES.CHALLENGE_POSN,
    icon: './assets/icons/galaxy.png',
    subCategoryKey: 'EarthAndSpace', // Validates against the EarthAndSpace sub-category list.
  },
  // --- General & Mixed Topics ---
  astro: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_REVIEW,
    icon: './assets/icons/space.png',
    subCategoryKey: 'ASTRONOMY_POSN', // Review quizzes are validated against the ASTRONOMY_POSN list.
  },
  default: {
    mainCategory: MAIN_CATEGORIES.GENERAL_KNOWLEDGE,
    icon: './assets/icons/study.png',
    subCategoryKey: null,
  },
};