import { authManager } from './auth-manager.js';
import { db } from './firebase-config.js';
import { collection, query, orderBy, limit, getDocs, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { XP_THRESHOLDS, TRACK_TITLES, PROFICIENCY_GROUPS, getLevelBorderClass, getAvatarFrameClass } from './gamification.js';
import { escapeHtml } from './utils.js';
import { SiteConfig } from './site-config.js';

function getLevelInfoForLeaderboard(xp, type) {
    let track = 'overall';
    
    // Dynamic track lookup from SiteConfig
    const configCat = SiteConfig.categories.find(c => c.id === type);
    if (configCat && configCat.track) track = configCat.track;

    // Map specific proficiency fields to their main tracks
    for (const group of Object.values(PROFICIENCY_GROUPS)) {
        if (group.field === type) {
            track = group.track;
            break;
        }
    }

    let level = 1;
    for (const threshold of XP_THRESHOLDS) {
        if (xp >= threshold.xp) {
            level = threshold.level;
        } else {
            break;
        }
    }

    const titles = TRACK_TITLES[track] || TRACK_TITLES.overall;
    const titleIndex = Math.min(level - 1, titles.length - 1);
    const title = titles[titleIndex];
    return { level, title };
}

export async function initializeLeaderboard() {
    const listContainer = document.getElementById('leaderboard-list-full');
    const tabsContainer = document.getElementById('leaderboard-tabs-container');
    const earthSciDropdownBtn = document.getElementById('earth-science-dropdown-btn');
    const earthSciDropdown = document.getElementById('earth-science-dropdown');
    const earthSciBtnLabel = document.getElementById('earth-science-btn-label');
    
    if (!listContainer || !tabsContainer) return;
    
    // --- Dynamic Tabs Generation ---
    tabsContainer.innerHTML = ''; // Clear existing static tabs

    // 1. Total XP Tab (Always present)
    const totalTab = document.createElement('button');
    totalTab.className = "leaderboard-tab whitespace-nowrap py-2 px-4 rounded-full text-sm font-bold transition-all bg-blue-600 text-white shadow-md";
    totalTab.dataset.type = "xp";
    totalTab.dataset.mainTab = "true";
    totalTab.textContent = "คะแนนรวม";
    tabsContainer.appendChild(totalTab);

    // 2. Config Categories
    if (SiteConfig.categories) {
        SiteConfig.categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = "leaderboard-tab whitespace-nowrap py-2 px-4 rounded-full text-sm font-bold transition-all bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";
            btn.dataset.type = cat.id; // Field name in Firestore
            btn.dataset.mainTab = "true";
            btn.textContent = cat.label || cat.name;
            tabsContainer.appendChild(btn);
        });
    }

    const renderList = async (type) => {
        // FIX: Whitelist allowed sort fields to prevent NoSQL Injection (Arbitrary Sort)
        const configTypes = SiteConfig.categories.map(c => c.id);
        const allowedTypes = ['xp', ...configTypes];
        
        if (!allowedTypes.includes(type)) {
            console.error("Invalid leaderboard type requested:", type);
            listContainer.innerHTML = `<div class="text-center py-16 text-red-500">ข้อมูลไม่ถูกต้อง</div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg class="animate-spin h-8 w-8 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <span>กำลังโหลดอันดับ...</span>
            </div>
        `;

        try {
            const usersRef = collection(db, 'leaderboard');
            const q = query(usersRef, orderBy(type, 'desc'), limit(50)); // Fetch top 50
            const querySnapshot = await authManager.retryOperation(() => getDocs(q));
            
            const leaderboard = [];
            querySnapshot.forEach((doc) => {
                leaderboard.push({ id: doc.id, ...doc.data() });
            });

            if (leaderboard.length === 0) {
                listContainer.innerHTML = `<div class="text-center py-16 text-gray-500">ยังไม่มีข้อมูลการจัดอันดับ</div>`;
                return;
            }

            const currentUser = authManager?.currentUser;
            const currentUserId = currentUser ? currentUser.uid : null;
            const localState = await authManager.loadUserData() || {};

            const userInTop50 = leaderboard.some(u => u.id === currentUserId);
            let userRankData = null;

            if (!userInTop50 && currentUserId) {
                try {
                    const userScore = localState[type] || 0;
                    const rankQuery = query(usersRef, where(type, '>', userScore));
                    const snapshot = await authManager.retryOperation(() => getCountFromServer(rankQuery));
                    const rank = snapshot.data().count + 1;

                    userRankData = {
                        rank: rank,
                        id: currentUserId,
                        displayName: localState.displayName,
                        avatar: localState.avatar,
                        selectedTitle: localState.selectedTitle,
                        score: userScore,
                        isMe: true
                    };
                } catch (err) {
                    console.warn("Failed to fetch user rank:", err);
                }
            }

            // --- Rank Change Logic (Local Tracking) ---
            let myRankChange = null;
            if (currentUserId) {
                let currentRank = null;
                if (userInTop50) {
                    currentRank = leaderboard.findIndex(u => u.id === currentUserId) + 1;
                } else if (userRankData) {
                    currentRank = userRankData.rank;
                }

                if (currentRank) {
                    const storageKey = `lb_last_rank_${type}_${currentUserId}`;
                    const lastData = JSON.parse(localStorage.getItem(storageKey));
                    
                    if (lastData) {
                        // Calculate change: Old Rank - New Rank (e.g. 5 - 3 = +2 means Up 2)
                        myRankChange = lastData.rank - currentRank;
                    }
                    
                    // Save current rank for next comparison
                    localStorage.setItem(storageKey, JSON.stringify({ rank: currentRank, timestamp: Date.now() }));
                }
            }

            const renderRow = (user, rank, isMe) => {
                // Rank Change UI
                let changeHtml = '';
                const change = isMe ? myRankChange : (user.rankChange || null); // Support future server-side data for others
                
                if (change !== null && change !== 0) {
                    const isUp = change > 0;
                    const colorClass = isUp ? 'text-green-500' : 'text-red-500';
                    const icon = isUp ? '▲' : '▼';
                    changeHtml = `<div class="text-[10px] font-bold ${colorClass} flex items-center justify-center -mt-1">${icon} ${Math.abs(change)}</div>`;
                } else if (change === 0) {
                     changeHtml = `<div class="text-[10px] font-bold text-gray-400 flex items-center justify-center -mt-1">-</div>`;
                }

                let rankIcon = rank;
                let rankClass = "text-gray-500 text-lg";
                
                if (rank === 1) { rankIcon = '🥇'; rankClass = "text-3xl"; }
                else if (rank === 2) { rankIcon = '🥈'; rankClass = "text-3xl"; }
                else if (rank === 3) { rankIcon = '🥉'; rankClass = "text-3xl"; }

                const rankDisplay = `
                    <div class="flex flex-col items-center justify-center w-8">
                        <span class="font-bold ${rankClass}">${rankIcon}</span>
                        ${changeHtml}
                    </div>
                `;

                let score;
                if (isMe && user.score !== undefined) {
                    score = user.score;
                } else {
                    score = user[type] || 0;
                    // On-the-fly calculation to fix display for stale data
                    // Generic calculation based on track defined in SiteConfig
                    const configCat = SiteConfig.categories.find(c => c.id === type);
                    if (configCat && configCat.track) {
                        let calculatedXP = 0;
                        let hasSubGroups = false;
                        for (const group of Object.values(PROFICIENCY_GROUPS)) {
                            if (group.track === configCat.track) {
                                calculatedXP += (user[group.field] || 0);
                                hasSubGroups = true;
                            }
                        }
                        if (hasSubGroups) score = Math.max(score, calculatedXP);
                    }
                }

                const scoreFormatted = score.toLocaleString();                
                let level, rankTitle;

                if (type === 'xp') {
                    // For 'overall' XP, use the user's actual stored level, as it depends on quests.
                    level = user.level || 1;
                    const titles = TRACK_TITLES.overall;
                    const titleIndex = Math.min(level - 1, titles.length - 1);
                    rankTitle = titles[titleIndex];
                } else {
                    // For specific tracks, level is calculated purely from XP.
                    const levelInfo = getLevelInfoForLeaderboard(score, type);
                    level = levelInfo.level;
                    rankTitle = levelInfo.title;
                }

                const avatar = user.avatar || '🧑‍🎓';
                const isImage = avatar.includes('/') || avatar.includes('.');
                const avatarContent = isImage 
                    ? `<img src="${escapeHtml(avatar)}" class="w-full h-full rounded-full object-cover">`
                    : `<span class="text-3xl">${escapeHtml(avatar)}</span>`;
                
                const levelBorderClass = getLevelBorderClass(level);
                const avatarFrameClass = getAvatarFrameClass(avatar, 'small');

                const avatarHtml = `
                    <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 shadow-md ${levelBorderClass}">
                        <div class="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden ${avatarFrameClass}">
                            ${avatarContent}
                        </div>
                    </div>
                `;

                return `
                    <div class="flex items-center gap-4 p-3 rounded-xl ${isMe ? 'bg-blue-50 border-2 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700 shadow-lg scale-[1.01] z-10 relative' : 'bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-700/60'} transition-all duration-200">
                        <div class="flex-shrink-0">${rankDisplay}</div>
                        <div class="flex-shrink-0">${avatarHtml}</div>
                        <div class="flex-grow min-w-0 flex flex-col justify-center">
                            <div class="font-bold text-lg text-gray-800 dark:text-gray-200 truncate">
                                ${escapeHtml(user.displayName) || 'ผู้เรียน'} ${isMe ? '<span class="text-sm text-blue-600 dark:text-blue-400 ml-1">(คุณ)</span>' : ''}
                            </div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-2">
                                <span class="font-bold text-gray-600 dark:text-gray-300">(Lv.${level})</span>
                                <span class="text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">${rankTitle}</span>
                                ${user.selectedTitle ? `<span class="hidden sm:inline text-gray-400 dark:text-gray-600">•</span> <span class="truncate max-w-[150px] sm:max-w-none">《 ${escapeHtml(user.selectedTitle)} 》</span>` : ''}
                            </div>
                        </div>
                        <div class="flex-shrink-0 text-right">
                            <div class="font-mono font-bold text-blue-600 dark:text-blue-400 text-lg">
                                ${scoreFormatted}
                            </div>
                            <div class="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase">XP</div>
                        </div>
                    </div>
                `;
            };

            let listHtml = leaderboard.map((user, index) => renderRow(user, index + 1, user.id === currentUserId)).join('');

            if (userRankData) {
                listHtml += `
                    <div class="flex items-center justify-center py-2 opacity-60">
                        <div class="h-1.5 w-1.5 bg-gray-400 rounded-full mx-1"></div>
                        <div class="h-1.5 w-1.5 bg-gray-400 rounded-full mx-1"></div>
                        <div class="h-1.5 w-1.5 bg-gray-400 rounded-full mx-1"></div>
                    </div>
                    ${renderRow(userRankData, userRankData.rank, true)}
                `;
            }

            listContainer.innerHTML = listHtml;

        } catch (error) {
            console.error("Leaderboard error:", error);
            listContainer.innerHTML = `<div class="text-center py-16 text-red-500">ไม่สามารถโหลดข้อมูลได้<br>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</div>`;
        }
    };

    const activeTabClasses = ['bg-blue-600', 'text-white', 'shadow-md'];
    const inactiveTabClasses = ['bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-300', 'hover:bg-gray-200', 'dark:hover:bg-gray-600'];

    tabsContainer.addEventListener('click', (e) => {
        const clickedTab = e.target.closest('.leaderboard-tab');
        if (!clickedTab) return;

        e.preventDefault();
        const type = clickedTab.dataset.type;
        const label = clickedTab.dataset.label;

        // ถ้าไม่มี type (เช่น เป็นปุ่มเปิด Dropdown เฉยๆ) ให้หยุดการทำงานส่วนนี้
        if (!type) return;

        // Deactivate all main tabs
        tabsContainer.querySelectorAll('[data-main-tab="true"]').forEach(t => {
            t.classList.remove(...activeTabClasses);
            t.classList.add(...inactiveTabClasses);
        });

        // If a dropdown item was clicked
        if (label) {
            if (earthSciDropdownBtn) {
                earthSciDropdownBtn.classList.remove(...inactiveTabClasses);
                earthSciDropdownBtn.classList.add(...activeTabClasses);
            }
            if (earthSciBtnLabel) earthSciBtnLabel.textContent = label;
            if (earthSciDropdown) earthSciDropdown.classList.add('hidden');
        } else { // A main tab was clicked
            clickedTab.classList.remove(...inactiveTabClasses);
            clickedTab.classList.add(...activeTabClasses);
        }

        renderList(type);
    });

    renderList('xp');
}