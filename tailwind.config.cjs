/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./components/**/*.html",
    // FIX: เจาะจงไฟล์ Script ที่มี UI Logic เพื่อป้องกันการสร้าง Class ขยะจากไฟล์ Data หรือ Logic อื่นๆ
    "./scripts/main.js",
    "./scripts/modal-handler.js",
    "./quiz/**/*.html"
  ],
  // Safelist: ป้องกันไม่ให้ Tailwind ลบคลาสที่ถูกเรียกใช้ผ่านตัวแปร JS (Dynamic Classes)
  safelist: [
    {
      // ครอบคลุมสีและ Utility ที่ใช้ใน main.js (bg, text, border, ring, shadow)
      // OPTIMIZED: ตัด Opacity (/(...)) ออก และลด Variants ที่ไม่จำเป็นเพื่อลดขนาดไฟล์ bundle.css
      // หากโค้ด JS ของคุณมีการใช้ Opacity แบบ dynamic (เช่น bg-blue-500/50) ให้เติมส่วน Opacity กลับเข้ามา
      // FIX: เพิ่มสีที่ขาดไป (orange, rose, amber) และนำส่วน Opacity กลับมาเพื่อให้สีของ Accordion แสดงผลถูกต้อง
      pattern: /(bg|text|border|ring|shadow)-(blue|green|red|yellow|gray|indigo|teal|purple|orange|rose|amber)-(\d+)(\/(10|20|30|40|50|60|70|80|90))?/,
      // ลด Variants เหลือเท่าที่จำเป็น (ปกติ dynamic class มักใช้แค่ state พื้นฐานกับ hover/dark)
      // FIX: เพิ่ม group-hover กลับมา เพราะใน main.js มีการใช้ group-hover:text-...
      variants: ['hover', 'dark', 'dark:hover', 'group-hover', 'dark:group-hover'],
    }
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'sans-serif'],
        sarabun: ['Sarabun', 'sans-serif'],
      },
      height: {
        screen: '100dvh',
      },
      minHeight: {
        screen: '100dvh',
      }
    },
  },
  plugins: [],
}