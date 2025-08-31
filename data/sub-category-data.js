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
  ASTRONOMY_GENERAL: 'AstronomyGeneral', // Formerly ASTRONOMY_REVIEW
  ASTRONOMY_OLYMPIAD: 'AstronomyOlympiad', // Formerly ASTRONOMY_POSN
  GENERAL_KNOWLEDGE: 'GeneralKnowledge',
  CHALLENGE: 'Challenge', // Formerly CHALLENGE_POSN
};

/**
 * Centralized constants for core astronomy topics to avoid duplication
 * and ensure consistency between EarthAndSpace and ASTRONOMY_POSN lists.
 */
export const CORE_ASTRONOMY_TOPICS = Object.freeze({
  SPHERICAL_ASTRONOMY: "ทรงกลมท้องฟ้าและระบบพิกัด",
  CELESTIAL_MECHANICS: "กลศาสตร์ท้องฟ้าและกฎของเคปเลอร์",
  SOLAR_SYSTEM: "ระบบสุริยะและองค์ประกอบ",
  STARS: "สมบัติและวิวัฒนาการของดาวฤกษ์",
  GALAXIES: "กาแล็กซีและเอกภพวิทยา",
  TELESCOPES: "กล้องโทรทรรศน์และเทคโนโลยีอวกาศ",
});

export const GEOLOGY_TOPICS = Object.freeze({
  STRUCTURE_AND_TECTONICS: "โครงสร้างโลกและธรณีแปรสัณฐาน",
  MINERALS_ROCKS_CYCLE: "แร่ หิน และวัฏจักรหิน",
  GEOHISTORY_STRATIGRAPHY: "ธรณีประวัติและลำดับชั้นหิน",
  GEOMORPHOLOGY_SURFACE_PROCESSES: "ธรณีสัณฐานและกระบวนการบนพื้นผิวโลก",
  GEOHAZARDS: "ธรณีพิบัติภัย",
  GEORESOURCES_ENVIRONMENT: "ทรัพยากรธรณีและธรณีวิทยาสิ่งแวดล้อม",
  MAPS_SURVEYING: "แผนที่และการสำรวจทางธรณีวิทยา",
});

export const METEOROLOGY_TOPICS = Object.freeze({
  COMPOSITION_LAYERS: "องค์ประกอบและชั้นบรรยากาศ",
  ENERGY_BALANCE_RADIATION: "สมดุลพลังงานของโลกและรังสี",
  TEMP_PRESSURE_WIND: "อุณหภูมิ ความกดอากาศ และลม",
  HUMIDITY_CLOUDS_PRECIPITATION: "ความชื้น เมฆ และหยาดน้ำฟ้า",
  AIR_MASSES_FRONTS: "มวลอากาศและแนวปะทะอากาศ",
  STORMS_SEVERE_WEATHER: "พายุและสภาพอากาศรุนแรง",
  WEATHER_MAPS_FORECASTING: "แผนที่อากาศและการพยากรณ์อากาศ",
  CLIMATE_CHANGE: "ภูมิอากาศและการเปลี่ยนแปลง",
});

export const OCEANOGRAPHY_TOPICS = Object.freeze({
  PHYSICAL_CHEMICAL_PROPERTIES: "คุณสมบัติทางกายภาพและเคมีของน้ำทะเล",
  WAVES_TIDES_CURRENTS: "คลื่น น้ำขึ้นน้ำลง และการหมุนเวียนของกระแสน้ำ",
  OCEAN_ATMOSPHERE_INTERACTION: "ปฏิสัมพันธ์ระหว่างมหาสมุทรและบรรยากาศ",
  MARINE_LIFE_ECOSYSTEMS: "สิ่งมีชีวิตและระบบนิเวศทางทะเล",
  SEAFLOOR_GEOLOGY_MORPHOLOGY: "ธรณีวิทยาและสัณฐานพื้นสมุทร",
  MARINE_RESOURCES_POLLUTION: "ทรัพยากรและมลพิษทางทะเล",
});

export const subCategoryData = {
  // Sub-categories for "วิทยาศาสตร์โลกและอวกาศ" (Earth & Space Science)
  // These are grouped by main topic (Geology, Meteorology, Astronomy)
  // and are typically used in the `specific` field of the subCategory object.
  EarthAndSpace: {
    Geology: [...Object.values(GEOLOGY_TOPICS)],
    Meteorology: [...Object.values(METEOROLOGY_TOPICS)],
    Astronomy: [
      ...Object.values(CORE_ASTRONOMY_TOPICS)
    ],
    Oceanography: [...Object.values(OCEANOGRAPHY_TOPICS)],
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
    { topic: CORE_ASTRONOMY_TOPICS.SPHERICAL_ASTRONOMY, level: LEVELS.SENIOR_ONLY },
    { topic: CORE_ASTRONOMY_TOPICS.CELESTIAL_MECHANICS, level: LEVELS.SENIOR_ONLY },
    { topic: CORE_ASTRONOMY_TOPICS.SOLAR_SYSTEM, level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: CORE_ASTRONOMY_TOPICS.STARS, level: LEVELS.SENIOR_ONLY },
    { topic: CORE_ASTRONOMY_TOPICS.GALAXIES, level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: CORE_ASTRONOMY_TOPICS.TELESCOPES, level: LEVELS.JUNIOR_AND_SENIOR },
    // Foundational & Applied Topics
    { topic: "กลุ่มดาวฤกษ์และการใช้ประโยชน์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ปฏิสัมพันธ์ในระบบโลก-ดวงจันทร์-ดวงอาทิตย์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "ข่าวสารและความก้าวหน้าทางดาราศาสตร์", level: LEVELS.JUNIOR_AND_SENIOR },
    { topic: "การคำนวณทางดาราศาสตร์", level: LEVELS.JUNIOR_AND_SENIOR },
  ],
};

/**
 * @deprecated This is for backward compatibility with modules that still import combinedAstronomyTopics.
 * Please update imports to use `subCategoryData.ASTRONOMY_POSN` instead.
 */
export const combinedAstronomyTopics = subCategoryData.ASTRONOMY_POSN;
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
    mainCategory: MAIN_CATEGORIES.EARTH_SCIENCE, // วิทยาศาสตร์โลกและอวกาศ
    icon: './assets/icons/geology.png',
    subCategoryKey: 'EarthAndSpace',
  },
  esr: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_GENERAL, // ทบทวนดาราศาสตร์ (ส่วนหนึ่งของโลกและอวกาศ)
    icon: './assets/icons/earth1.png',
    subCategoryKey: 'EarthAndSpace',
  },
  // --- Astronomy Olympiad ---
  junior: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_OLYMPIAD, // ดาราศาสตร์ สอวน.
    icon: './assets/icons/astronomy1.png',
    subCategoryKey: 'ASTRONOMY_POSN', // Uses the structured Astronomy list
  },
  senior: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_OLYMPIAD, // ดาราศาสตร์ สอวน.
    icon: './assets/icons/black-hole.png',
    subCategoryKey: 'ASTRONOMY_POSN', // Also uses the structured Astronomy list
  },
  adv_astro: {
    mainCategory: MAIN_CATEGORIES.CHALLENGE, // ข้อสอบท้าทาย (ดาราศาสตร์)
    icon: './assets/icons/galaxy.png',
    subCategoryKey: 'ASTRONOMY_POSN',
  },
  adv_geology: {
    mainCategory: MAIN_CATEGORIES.CHALLENGE, // ข้อสอบท้าทาย (ธรณีวิทยา)
    icon: './assets/icons/rock.png',
    subCategoryKey: 'EarthAndSpace',
    inferredMainCategory: 'Geology', // For files that omit the main category
  },
  adv_meteorology: { // Corrected from adv_mete to match filenames
    mainCategory: MAIN_CATEGORIES.CHALLENGE, // ข้อสอบท้าทาย (อุตุนิยมวิทยา)
    icon: './assets/icons/cloud.png', // Changed icon
    subCategoryKey: 'EarthAndSpace',
    inferredMainCategory: 'Meteorology', // For files that omit the main category
  },
  adv_oceanography: { // Corrected from adv_ocean to match filenames
    mainCategory: MAIN_CATEGORIES.CHALLENGE, // ข้อสอบท้าทาย (มหาสมุทรวิทยา)
    icon: './assets/icons/wave.png', // Changed icon
    subCategoryKey: 'EarthAndSpace',
    inferredMainCategory: 'Oceanography', // For files that omit the main category
  },
  // --- General & Mixed Topics ---
  astro: {
    mainCategory: MAIN_CATEGORIES.ASTRONOMY_GENERAL, // ทบทวนดาราศาสตร์ (ทั่วไป)
    icon: './assets/icons/space.png',
    subCategoryKey: 'ASTRONOMY_POSN', // Review quizzes are validated against the ASTRONOMY_POSN list.
  },
  default: {
    mainCategory: MAIN_CATEGORIES.GENERAL_KNOWLEDGE,
    icon: './assets/icons/study.png',
    subCategoryKey: null,
  },
};