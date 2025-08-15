document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('quiz-menu-btn');
    const dropdown = document.getElementById('quiz-menu-dropdown');

    // Only run if the menu elements exist on the page
    if (!menuBtn || !dropdown) {
        return;
    }

    const dropdownContent = dropdown.querySelector('div');

    // Check if the quiz list data is available from 'quizzes-list.js'
    if (dropdownContent && typeof quizList !== 'undefined') {
        // Populate dropdown
        dropdownContent.innerHTML = `
            <a href="../index.html" class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-bold">หน้าหลัก</a>
            <hr class="my-1 border-gray-200 dark:border-gray-600">
        `;
        quizList.forEach(quiz => {
            const link = document.createElement('a');
            // Adjust path for subdirectories. Assumes this script is only used in quiz pages.
            link.href = `..${quiz.url.substring(1)}`; 
            link.className = 'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md';
            link.textContent = quiz.title;
            dropdownContent.appendChild(link);
        });

        // Toggle visibility on button click
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the document click listener from firing immediately
            dropdown.classList.toggle('hidden');
        });

        // Close the dropdown if the user clicks anywhere else on the page
        document.addEventListener('click', () => {
            dropdown.classList.add('hidden');
        });
    }
});