document.addEventListener('DOMContentLoaded', () => {
    // Select all internal links that don't just point to an anchor on the same page
    const links = document.querySelectorAll('a[href^="/"], a[href^="."]');

    links.forEach(link => {
        // Ensure the link is meant for navigation and not for other interactions
        if (link.hostname === window.location.hostname && !link.hash) {
            link.addEventListener('click', function (e) {
                const url = this.getAttribute('href');

                // Don't intercept clicks on links that open in a new tab
                if (this.target === '_blank' || e.ctrlKey || e.metaKey) {
                    return;
                }

                e.preventDefault(); // Stop the browser from navigating immediately

                document.body.classList.add('fade-out');

                setTimeout(() => { window.location.href = url; }, 300); // Match CSS duration
            });
        }
    });
});