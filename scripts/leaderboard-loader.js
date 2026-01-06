async function main() {
    try {
        const { loadComponent } = await import('./component-loader.js');
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#footer-placeholder', './components/footer.html'),
            loadComponent('#modals-placeholder', './components/modals_common.html')
        ]);

        const { initializeCommonComponents } = await import('./common-init.js');
        await initializeCommonComponents();

        // Initialize Gamification (Theme, Avatar, User State)
        const { Gamification } = await import('./gamification.js');
        new Gamification();

        const { initializeLeaderboard } = await import('./leaderboard.js');
        await initializeLeaderboard();

    } catch (error) {
        console.error("Failed to initialize leaderboard page:", error);
    }
}

document.addEventListener('DOMContentLoaded', main);