import { Gamification } from './gamification.js';
import { showToast } from './toast.js';

/**
 * Renders the daily quests into a specified container.
 * @param {Gamification} game - The gamification instance.
 * @param {string} containerId - The ID of the element to render the quests into.
 */
export function renderDailyQuests(game, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const gameInstance = game || new Gamification();
    const quests = gameInstance.state.activeQuests || [];
    const rerollsLeft = gameInstance.state.rerolls || 0;

    if (quests.length === 0) {
        container.innerHTML = '<p class="text-center text-sm text-gray-500 dark:text-gray-400 py-4">ไม่มีภารกิจประจำวันในขณะนี้</p>';
        return;
    }

    container.innerHTML = quests.map((quest, index) => {
        const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
        const isCompleted = quest.completed;

        let statusClass = 'bg-blue-500';
        if (isCompleted) {
            statusClass = 'bg-green-500';
        }

        return `
            <div class="daily-quest-item p-3 rounded-lg flex items-center gap-4 ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'}">
                <div class="text-3xl flex-shrink-0">${isCompleted ? '✅' : '📜'}</div>
                <div class="flex-grow min-w-0">
                    <p class="font-bold text-sm text-gray-800 dark:text-gray-100 truncate" title="${quest.desc}">${quest.desc}</p>
                    <div class="flex items-center gap-2 mt-1.5">
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div class="${statusClass} h-2.5 rounded-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="text-xs font-mono text-gray-500 dark:text-gray-400 flex-shrink-0">${quest.progress}/${quest.target}</span>
                    </div>
                </div>
                <div class="flex-shrink-0 flex flex-col items-center gap-1">
                    <span class="text-xs font-bold text-yellow-500 dark:text-yellow-400">+${quest.xp} XP</span>
                    <button 
                        data-quest-index="${index}" 
                        class="reroll-quest-btn p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-500 transition-colors ${isCompleted || rerollsLeft === 0 ? 'hidden' : ''}"
                        title="เปลี่ยนภารกิจ (เหลือ ${rerollsLeft} ครั้ง)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.51A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.51-1.276z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners for reroll buttons
    container.querySelectorAll('.reroll-quest-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.dataset.questIndex, 10);
            const result = gameInstance.rerollQuest(index);
            if (result.success) {
                showToast('เปลี่ยนภารกิจสำเร็จ', `คุณมีสิทธิ์เปลี่ยนภารกิจอีก ${result.rerollsLeft} ครั้ง`, '🔄');
                renderDailyQuests(gameInstance, containerId); // Re-render the quests
            } else {
                showToast('ไม่สำเร็จ', result.message, '❌', 'error');
            }
        });
    });
}