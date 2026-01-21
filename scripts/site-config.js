// c:\Users\golf_\OneDrive\Documents\GitHub\EarthScienceQuiz\scripts\site-config.js

export const SiteConfig = {
    // ข้อมูลทั่วไปของเว็บไซต์
    appTitle: "เตรียมความพร้อม สอวน. วิทยาศาสตร์โลกและอวกาศ",
    appDescription: "แหล่งรวมแบบทดสอบออนไลน์สำหรับเตรียมความพร้อม สอวน. ดาราศาสตร์ และสอวน. วิทยาศาสตร์โลกและอวกาศ",
    appKeywords: "สอวน, สอวน. ดาราศาสตร์, สอวน. วิทยาศาสตร์โลกและอวกาศ, แบบทดสอบออนไลน์, เตรียมความพร้อม, ดาราศาสตร์, วิทยาศาสตร์โลก, อวกาศ",
    author: "Taweerak Thuhphuttha",
    
    // หมวดหมู่รายวิชา (ใช้สำหรับตัวกรองและ Generator)
    // keywords: คำค้นหาที่ใช้ระบุว่าข้อสอบชุดนี้ควรถูกนับคะแนนเข้าสายวิชาใด (ใช้ใน gamification.js)
    categories: [
        { 
            id: "astronomyTrackXP", 
            name: "Astronomy", 
            label: "สอวน. ดาราศาสตร์", 
            track: "astronomy",
            keywords: ['astronomy', 'ดาราศาสตร์', 'space', 'อวกาศ', 'physics', 'ฟิสิกส์', 'astro', 'junior', 'senior', 'phy_']
        },
        { 
            id: "earthTrackXP", 
            name: "EarthScience", 
            label: "สอวน. วิทย์โลก", 
            track: "earth",
            keywords: ['earth', 'โลก', 'วิทย์โลก', 'geology', 'ธรณี', 'meteorology', 'อุตุนิยมวิทยา', 'oceanography', 'สมุทรศาสตร์', 'es', 'ess_']
        }
    ],

    // เกณฑ์ XP และเงื่อนไขการเลเวลอัพ (XP Thresholds & Quests)
    xpThresholds: [
        { level: 1, xp: 0, quest: null }, // No quest to reach level 1
        { level: 2, xp: 100, quest: { type: 'correct_streak', target: 10, desc: 'ตอบคำถามถูกติดต่อกัน 10 ข้อ' } },
        { level: 3, xp: 300, quest: { type: 'quizzes_completed', target: 5, desc: 'ทำแบบทดสอบให้ครบ 5 ครั้ง' } },
        { level: 4, xp: 600, quest: { type: 'perfect_scores', target: 1, desc: 'ทำคะแนนเต็ม 100% ให้ได้ 1 ครั้ง' } },
        { level: 5, xp: 1000, quest: { type: 'high_scores_80', target: 3, desc: 'ทำคะแนนได้ 80% ขึ้นไป 3 ครั้ง' } },
        { level: 6, xp: 1500, quest: { type: 'quizzes_completed', target: 15, desc: 'ทำแบบทดสอบให้ครบ 15 ครั้ง' } },
        { level: 7, xp: 2200, quest: { type: 'correct_streak', target: 20, desc: 'ตอบคำถามถูกติดต่อกัน 20 ข้อ' } },
        { level: 8, xp: 3000, quest: { type: 'astronomy_level', target: 5, desc: 'ไปให้ถึงเลเวล 5 ในสายดาราศาสตร์' } },
        { level: 9, xp: 4000, quest: { type: 'earth_level', target: 5, desc: 'ไปให้ถึงเลเวล 5 ในสายวิทย์โลก' } },
        { level: 10, xp: 5500, quest: { type: 'quizzes_completed', target: 30, desc: 'ทำแบบทดสอบให้ครบ 30 ครั้ง' } },
        { level: 11, xp: 7500, quest: { type: 'high_scores_80', target: 10, desc: 'ทำคะแนนได้ 80% ขึ้นไป 10 ครั้ง' } },
        { level: 12, xp: 10000, quest: { type: 'correct_streak', target: 30, desc: 'ตอบคำถามถูกติดต่อกัน 30 ข้อ' } },
        { level: 13, xp: 13000, quest: { type: 'quizzes_completed', target: 50, desc: 'ทำแบบทดสอบให้ครบ 50 ครั้ง' } },
        { level: 14, xp: 16500, quest: { type: 'perfect_scores', target: 5, desc: 'ทำคะแนนเต็ม 100% ให้ได้ 5 ครั้ง' } },
        { level: 15, xp: 20500, quest: { type: 'astronomy_level', target: 10, desc: 'ไปให้ถึงเลเวล 10 ในสายดาราศาสตร์' } },
        { level: 16, xp: 25000, quest: { type: 'earth_level', target: 10, desc: 'ไปให้ถึงเลเวล 10 ในสายวิทย์โลก' } },
        { level: 17, xp: 30000, quest: { type: 'high_scores_80', target: 20, desc: 'ทำคะแนนได้ 80% ขึ้นไป 20 ครั้ง' } },
        { level: 18, xp: 36000, quest: { type: 'quizzes_completed', target: 100, desc: 'ทำแบบทดสอบให้ครบ 100 ครั้ง' } },
        { level: 19, xp: 43000, quest: { type: 'correct_streak', target: 50, desc: 'ตอบคำถามถูกติดต่อกัน 50 ข้อ' } },
        { level: 20, xp: 50000, quest: { type: 'perfect_scores', target: 10, desc: 'ทำคะแนนเต็ม 100% ให้ได้ 10 ครั้ง' } }
    ],

    // ชื่อยศสำหรับแต่ละสาย (Titles)
    trackTitles: {
        overall: [
            "ผู้เริ่มต้น (Novice)", "นักสำรวจ (Explorer)", "ผู้รอบรู้ (Scholar)", 
            "ผู้เชี่ยวชาญ (Expert)", "ปราชญ์ (Sage)", "ปรมาจารย์ (Master)", 
            "ตำนาน (Legend)", "ผู้พิทักษ์ความรู้ (Guardian)", "มหาปราชญ์ (Grand Sage)", "เทพเจ้าแห่งปัญญา (God of Wisdom)",
            "ผู้หยั่งรู้ (The Seer)", "ผู้บรรลุ (The Enlightened)", "ผู้รอบรู้จักรวาล (Cosmic Scholar)",
            "ผู้พิทักษ์ดวงดาว (Stellar Guardian)", "ปรมาจารย์แห่งเอกภพ (Celestial Master)", "ผู้ถอดรหัสจักรวาล (Cosmic Decoder)",
            "ผู้บัญชาการดวงดาว (Star Commander)", "ตำนานแห่งกาแล็กซี (Galactic Legend)", "ผู้สร้างเอกภพ (Universe Crafter)", "หนึ่งเดียวกับจักรวาล (The One with the Cosmos)"
        ],
        astronomy: [
            "นักดูดาวฝึกหัด", "ผู้หลงใหลท้องฟ้า", "นักสำรวจกลุ่มดาว",
            "ผู้เชี่ยวชาญระบบสุริยะ", "นักดาราศาสตร์", "ผู้คำนวณวงโคจร",
            "ผู้พิทักษ์หอดูดาว", "จ้าวแห่งเนบิวลา", "ผู้หยั่งรู้เอกภพ", "ปรมาจารย์ดาราศาสตร์",
            "ผู้ท่องกาลอวกาศ", "ผู้ควบคุมแรงโน้มถ่วง", "ตำนานแห่งทางช้างเผือก",
            "ผู้สร้างดาวฤกษ์", "จ้าวแห่งหลุมดำ", "ผู้ไขปริศนาบิกแบง",
            "ผู้บัญชาการยานอวกาศ", "เทพเจ้าแห่งดวงดาว", "ผู้สร้างจักรวาล", "หนึ่งเดียวกับความว่างเปล่า"
        ],
        earth: [
            "นักสำรวจหิน", "ผู้สนใจธรณี", "นักอุตุนิยมวิทยาฝึกหัด",
            "ผู้เชี่ยวชาญแผนที่", "นักธรณีวิทยา", "ผู้พยากรณ์อากาศ",
            "นักสมุทรศาสตร์", "ผู้หยั่งรู้ใต้พิภพ", "จ้าวแห่งมหาสมุทร", "ปรมาจารย์วิทย์โลก",
            "ผู้ควบคุมแผ่นเปลือกโลก", "ผู้บัญชาการพายุ", "ผู้พิทักษ์ทรัพยากร",
            "ผู้สร้างภูเขา", "จ้าวแห่งวัฏจักร", "ผู้ไขปริศนาโลกล้านปี",
            "ผู้ควบคุมกระแสน้ำ", "เทพเจ้าแห่งผืนดิน", "ผู้สร้างโลก", "จิตวิญญาณแห่งไกอา"
        ]
    },

    // กลุ่มรายวิชาย่อย (Proficiency Groups) - ใช้สำหรับคำนวณกราฟเรดาร์และสถิติ
    proficiencyGroups: {
        'Astronomy': { 
            label: 'ดาราศาสตร์', 
            field: 'astronomyXP',
            track: 'astronomy',
            keywords: ['astronomy', 'ดาราศาสตร์', 'เอกภพ', 'กาแล็กซี', 'ดาวฤกษ์', 'ระบบสุริยะ', 'ดาวเคราะห์', 'ทรงกลมฟ้า', 'พิกัด', 'กล้องโทรทรรศน์', 'สเปกตรัม', 'กฎของเคปเลอร์', 'อวกาศ', 'เทคโนโลยีอวกาศ', 'space'] 
        },
        'Geology': { 
            label: 'ธรณีวิทยา', 
            field: 'geologyXP',
            track: 'earth',
            keywords: ['geology', 'ธรณี', 'หิน', 'แร่', 'วัฏจักรหิน', 'โครงสร้างโลก', 'แผ่นเปลือกโลก', 'ไหวสะเทือน', 'ภูเขาไฟ', 'ซากดึกดำบรรพ์', 'ลำดับชั้นหิน', 'ทรัพยากรธรณี', 'ดิน', 'แผนที่'] 
        },
        'Meteorology': { 
            label: 'อุตุนิยมวิทยา', 
            field: 'meteorologyXP',
            track: 'earth',
            keywords: ['meteorology', 'อุตุนิยมวิทยา', 'บรรยากาศ', 'ลม', 'ความกดอากาศ', 'เมฆ', 'หยาดน้ำฟ้า', 'พายุ', 'ภูมิอากาศ', 'แผนที่อากาศ', 'พยากรณ์', 'สมดุลพลังงาน'] 
        },
        'Oceanography': {
            label: 'สมุทรศาสตร์',
            field: 'oceanographyXP',
            track: 'earth',
            keywords: ['oceanography', 'สมุทร', 'น้ำทะเล', 'มหาสมุทร', 'ความเค็ม', 'กระแสน้ำ', 'น้ำขึ้นน้ำลง', 'คลื่น', 'ชายฝั่ง', 'นิเวศทางทะเล']
        }
    },

    // ตั้งค่า UI
    theme: {
        primaryColor: "blue", // ชื่อสีตาม Tailwind (blue, green, red, etc.)
    }
};
