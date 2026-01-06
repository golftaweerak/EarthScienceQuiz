import { webkit, devices } from 'playwright';

(async () => {
  const browser = await webkit.launch({ headless: false }); // false เพื่อให้เห็นหน้าต่าง Browser
  const context = await browser.newContext({
    ...devices['iPhone 12'], // จำลองเป็น iPhone 12
  });
  const page = await context.newPage();
  
  try {
    await page.goto('http://127.0.0.1:3000/index.html'); // ใส่ URL ของคุณ (เช่น Live Server)
  } catch (error) {
    console.error('\n❌ Error: ไม่สามารถเชื่อมต่อกับ Server ได้ (http://localhost:5500)');
    console.error('💡 คำแนะนำ: กรุณาเปิด Local Server (เช่นกด Go Live ใน VS Code หรือรัน "npx http-server -p 5500") ก่อนรันคำสั่งนี้\n');
    await browser.close();
  }

  // รอให้คุณดูผลลัพธ์สักพัก (หรือใส่ breakpoint)
  // await browser.close();
})();
