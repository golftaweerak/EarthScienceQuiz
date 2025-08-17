document.addEventListener('DOMContentLoaded', () => {
    // Select all links with an href attribute for more robust filtering
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        // --- Condition Checks to determine if a link should have the transition ---

        // 1. Exclude links that are not on the same origin (external links)
        // 'origin' is more robust than 'hostname' as it includes protocol and port.
        if (link.origin !== window.location.origin) {
            return;
        }

        // 2. Exclude links opening in a new tab
        if (link.target === '_blank') {
            return;
        }

        // 3. Exclude same-page anchor links (e.g., href="#top")
        if (link.pathname === window.location.pathname && link.hash) {
            return;
        }

        // 4. Exclude links with a 'no-transition' class for manual opt-out
        if (link.classList.contains('no-transition')) {
            return;
        }

        // 5. (Optional but recommended) Exclude links to common file types to prevent
        // the transition effect on downloads.
        const isFile = /\.(pdf|zip|jpg|jpeg|png|gif|mp3|mp4|docx|xlsx)$/i;
        if (isFile.test(link.pathname)) {
            return;
        }

        // --- Add the event listener if all checks pass ---
        link.addEventListener('click', function (e) {
            // Re-check for Ctrl/Meta key press at the moment of the click
            if (e.ctrlKey || e.metaKey) {
                return;
            }

            e.preventDefault(); // Stop the browser from navigating immediately
            document.body.classList.add('fade-out');
            setTimeout(() => { window.location.href = link.href; }, 300); // Match CSS animation duration
        });
    });
});