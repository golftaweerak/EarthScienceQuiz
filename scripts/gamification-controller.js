import { Gamification } from './gamification.js';
import { renderDailyQuests } from './daily-quests-renderer.js';

document.addEventListener('DOMContentLoaded', () => {
    const game = new Gamification();
    
    // เรนเดอร์ครั้งแรก
    updateGamificationUI(game);

    // รอฟัง Event เพื่ออัปเดตเมื่อข้อมูลซิงค์เสร็จ
    window.addEventListener('gamification-updated', () => {
        updateGamificationUI(game);
    });
});

// แยก Logic การแสดงผลออกมาเป็นฟังก์ชันเพื่อให้เรียกซ้ำได้
function updateGamificationUI(game) {
    const levelInfo = game.getCurrentLevel();
    
    // Update Level & Rank UI
    setText('user-level', levelInfo.level);
    setText('user-rank-title', levelInfo.title);
    setText('current-xp', levelInfo.currentXP.toLocaleString());
    
    // Update Progress Bar
    if (levelInfo.nextLevelXP) {
        setText('next-level-xp', levelInfo.nextLevelXP.toLocaleString());
        const progress = levelInfo.progressPercent;
        const bar = document.getElementById('xp-progress-bar');
        if (bar) bar.style.width = `${progress}%`;        
        // NEW: Update Quest Info
        const questContainer = document.getElementById('next-level-quest-container');
        const questDescEl = document.getElementById('next-level-quest-desc');
        const questProgressEl = document.getElementById('next-level-quest-progress');

        if (questContainer && questDescEl && questProgressEl && levelInfo.nextLevelQuest) {
            const quest = levelInfo.nextLevelQuest;
            questDescEl.textContent = quest.desc;
            
            const progressValue = game.getQuestProgressValue(quest);
            questProgressEl.textContent = `(${progressValue}/${quest.target})`;

            questContainer.classList.remove('hidden');
        }
    } else {
        setText('next-level-xp', 'MAX');
        const bar = document.getElementById('xp-progress-bar');
        if (bar) bar.style.width = '100%';
    }

    // Update Recent Badges
    const recentBadges = game.getEarnedBadges().slice(-3).reverse(); // Get last 3 badges
    const badgesContainer = document.getElementById('recent-badges');
    if (badgesContainer) {
        if (recentBadges.length === 0) {
            badgesContainer.innerHTML = '<span class="text-sm text-gray-400">ยังไม่มีเหรียญรางวัล</span>';
        } else {
            badgesContainer.innerHTML = recentBadges.map(b => `
                <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-xl shadow-sm border border-yellow-200 dark:border-yellow-700/50 transition-transform hover:scale-110 cursor-help" title="${b.name}: ${b.desc}">
                    ${b.icon}
                </div>
            `).join('');
        }
    }

    // Render Daily Quests
    renderDailyQuests(game, 'daily-quests-container');
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}