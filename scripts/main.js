document.addEventListener('DOMContentLoaded', () => {
    const astronomyContainer = document.getElementById('astronomy-quizzes');
    const earthScienceContainer = document.getElementById('earth-science-quizzes');
    const astronomyReviewContainer = document.getElementById('astronomy-review-quizzes');

    function createQuizCard(quiz, index) {
      const card = document.createElement('a');
      card.href = quiz.url;
      card.className = 'group block bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg dark:hover:shadow-blue-500/20 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 card-animation hover:-translate-y-1';
      card.style.animationDelay = `${index * 50}ms`;

      card.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-center min-w-0">
                <div class="bg-white ${quiz.borderColor} border-4 text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-xl mr-4 flex-shrink-0">
                    <img src="${quiz.icon}" alt="${quiz.altText}" class="h-8 w-8 object-contain">
                </div>
                <div class="overflow-hidden">
                    <h2 class="text-xl font-bold text-gray-800 dark:text-gray-200  font-kanit">${quiz.title}</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400">${quiz.description}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">จำนวน ${quiz.amount}</p>
                </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
        </div>
        <div class="progress-container mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            <div class="flex justify-between mb-1">
                <span class="progress-text text-sm font-medium text-gray-500 dark:text-gray-400">ยังไม่ได้เริ่ม</span>
                <span class="progress-percentage text-sm font-medium text-blue-700 dark:text-blue-500"></span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-600">
                <div class="progress-bar bg-blue-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
        </div>
      `;

      // --- Progress Bar Logic ---
      const savedStateJSON = localStorage.getItem(quiz.storageKey);
      if (savedStateJSON) {
        try {
          const savedState = JSON.parse(savedStateJSON);
          // Check if the saved state is valid
          if (savedState && typeof savedState.currentQuestionIndex === 'number' && Array.isArray(savedState.shuffledQuestions) && savedState.shuffledQuestions.length > 0) {

            const totalQuestions = savedState.shuffledQuestions.length;
            const questionsDone = savedState.currentQuestionIndex;
            const isCompleted = questionsDone >= totalQuestions;

            // Query for elements within the newly created card
            const progressText = card.querySelector('.progress-text');
            const progressPercentage = card.querySelector('.progress-percentage');
            const progressBar = card.querySelector('.progress-bar');

            if (progressText && progressPercentage && progressBar) {
              // Check if the quiz is completed and has a score
              if (isCompleted && typeof savedState.score === 'number') {
                progressText.textContent = `ทำเสร็จแล้ว`;
                progressPercentage.textContent = `คะแนน: ${savedState.score}/${totalQuestions}`;
                progressBar.style.width = '100%';
                // Change color to green for completed quizzes
                progressBar.classList.remove('bg-blue-500');
                progressBar.classList.add('bg-green-500');
              } else {
                // Quiz is in progress - Show current score and overall percentage
                const progress = Math.round(((questionsDone + 1) / totalQuestions) * 100);
                const attemptedQuestions = savedState.userAnswers.filter(Boolean).length;
                const currentScore = savedState.score || 0;

                if (attemptedQuestions > 0) {
                    progressText.textContent = `คะแนน: ${currentScore}/${attemptedQuestions}`;
                } else {
                    progressText.textContent = `กำลังทำข้อที่ ${questionsDone + 1}`;
                }

                progressPercentage.textContent = `${progress}%`;
                progressBar.style.width = `${progress}%`;
              }
            }
          }
        } catch (e) {
          console.error(`Error parsing saved state for ${quiz.storageKey}:`, e);
          // If parsing fails, do nothing and leave the default "Not Started" state.
        }
      }
      return card;
    }

    quizList.forEach((quiz, index) => {
      const card = createQuizCard(quiz, index);

      // Check the category and append to the correct container
      if (quiz.category === 'Astronomy') {
        astronomyContainer.appendChild(card);
      } else if (quiz.category === 'EarthScience') {
        earthScienceContainer.appendChild(card);
      } else if (quiz.category === 'AstronomyReview') {
        astronomyReviewContainer.appendChild(card);
      }
    });

    // Hide sections if they are empty
    if (astronomyContainer.children.length === 0) {
      document.getElementById('astronomy-section').classList.add('hidden');
    }
    if (earthScienceContainer.children.length === 0) {
      document.getElementById('earth-science-section').classList.add('hidden');
    }
    if (astronomyReviewContainer.children.length === 0) {
      document.getElementById('astronomy-review-section').classList.add('hidden');
    }

    // --- Accordion Logic ---
    const accordions = document.querySelectorAll('.section-accordion');

    accordions.forEach((accordion, index) => {
        const toggle = accordion.querySelector('.section-toggle');
        const content = accordion.querySelector('.section-content');
        const icon = accordion.querySelector('.chevron-icon');

         toggle.addEventListener('click', () => {
             const isOpen = accordion.classList.toggle('open');

             content.classList.toggle('grid-rows-[1fr]', isOpen);
             content.classList.toggle('grid-rows-[0fr]', !isOpen);
             icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
         });
    });

    // Set current year in footer
    document.getElementById('copyright-year').textContent = new Date().getFullYear();

    // --- Visitor Counter Logic ---
    async function updateVisitorCount() {
        const counterElement = document.getElementById('visitor-count');
        if (!counterElement) return;

        const namespace = 'earthsciencequiz-th.com';
        const key = 'visits';

        try {
            const response = await fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`);
            const data = await response.json();
            counterElement.textContent = data.value.toLocaleString('th-TH');
        } catch (error) {
            console.error('Error fetching visitor count:', error);
            counterElement.textContent = 'N/A';
        }
    }

    updateVisitorCount();
 });