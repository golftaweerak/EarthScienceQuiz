async function main() {
    try {
        // Optimization: Start importing modules in parallel
        const componentLoaderPromise = import('./component-loader.js');
        const commonInitPromise = import('./common-init.js');
        const gamificationPromise = import('./gamification.js');
        const leaderboardPromise = import('./leaderboard.js');

        const { loadComponent } = await componentLoaderPromise;
        await Promise.all([
            loadComponent('#main_header-placeholder', './components/main_header.html'),
            loadComponent('#footer-placeholder', './components/footer.html'),
            loadComponent('#modals-placeholder', './components/modals_common.html')
        ]);

        const { initializeCommonComponents } = await commonInitPromise;
        await initializeCommonComponents();

        // Initialize Gamification (Theme, Avatar, User State)
        const { Gamification } = await gamificationPromise;
        new Gamification();

        const { initializeLeaderboard } = await leaderboardPromise;
        await initializeLeaderboard();

    } catch (error) {
        console.error("Failed to initialize leaderboard page:", error);
    }
}

document.addEventListener('DOMContentLoaded', main);