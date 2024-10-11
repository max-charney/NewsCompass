const quizData = [
    {
        question: "What is confirmation bias?",
        options: [
            "The tendency to search for information that confirms one's preexisting beliefs",
            "The tendency to remember negative experiences more vividly than positive ones",
            "The tendency to conform to group opinions",
            "The tendency to overestimate one's abilities"
        ],
        correctAnswer: 0
    },
    {
        question: "Which of the following is an example of a primary news source?",
        options: [
            "A newspaper article summarizing a political debate",
            "A video recording of a political debate",
            "A blog post analyzing a political debate",
            "A tweet about a political debate"
        ],
        correctAnswer: 1
    },
    {
        question: "What is the 'echo chamber' effect in media consumption?",
        options: [
            "When news stories are repeated across multiple platforms",
            "When people only expose themselves to opinions that align with their own",
            "When social media algorithms amplify certain news stories",
            "When news outlets prioritize sensational stories for higher ratings"
        ],
        correctAnswer: 1
    },
    {
        question: "Which of the following is NOT typically considered a sign of a credible news source?",
        options: [
            "Citing primary sources",
            "Using emotional language",
            "Providing context for stories",
            "Correcting errors promptly"
        ],
        correctAnswer: 1
    },
    {
        question: "What is 'false balance' in journalism?",
        options: [
            "Giving equal coverage to opposing viewpoints regardless of their merit",
            "Intentionally misrepresenting facts to create controversy",
            "Focusing only on negative news stories",
            "Prioritizing speed over accuracy in reporting"
        ],
        correctAnswer: 0
    },
    // Add 10 more questions here to have a total of 15
    {
        question: "What is 'cherry-picking' in the context of media bias?",
        options: [
            "Selecting data or information that supports a particular position while ignoring contradictory evidence",
            "Focusing only on positive news stories",
            "Prioritizing stories about agriculture",
            "Using fruit metaphors in news headlines"
        ],
        correctAnswer: 0
    },
    {
        question: "What is the purpose of a news article's 'lead' or 'lede'?",
        options: [
            "To provide a detailed background of the story",
            "To summarize the key points of the story",
            "To express the journalist's opinion on the topic",
            "To list all sources used in the article"
        ],
        correctAnswer: 1
    },
    {
        question: "What does 'off the record' mean in journalism?",
        options: [
            "The information can be published without attribution",
            "The information cannot be published or attributed",
            "The information is false and should not be trusted",
            "The information is only for the journalist's personal knowledge"
        ],
        correctAnswer: 1
    },
    {
        question: "What is 'native advertising'?",
        options: [
            "Advertisements targeting indigenous populations",
            "Paid content designed to look like editorial content",
            "Advertisements featuring local products and services",
            "Free advertising provided by news outlets"
        ],
        correctAnswer: 1
    },
    {
        question: "What is the 'inverted pyramid' structure in news writing?",
        options: [
            "Starting with details and ending with the main point",
            "Organizing information from most to least important",
            "Alternating between positive and negative information",
            "Structuring articles to look like an upside-down pyramid"
        ],
        correctAnswer: 1
    },
    {
        question: "What is 'astroturfing' in the context of media manipulation?",
        options: [
            "Using environmentally friendly materials in news production",
            "Creating fake grassroots movements to influence public opinion",
            "Reporting on landscaping trends",
            "Replacing real images with computer-generated ones"
        ],
        correctAnswer: 1
    },
    {
        question: "What is a 'filter bubble' in online media consumption?",
        options: [
            "A device used to purify information before publishing",
            "A state of intellectual isolation due to personalized online experiences",
            "A pop-up blocker for advertisements",
            "A tool for fact-checking online content"
        ],
        correctAnswer: 1
    },
    {
        question: "What is 'yellow journalism'?",
        options: [
            "Journalism focused on environmental issues",
            "Sensationalized news with catchy headlines to boost sales",
            "Reporting on Asian affairs",
            "Unbiased, fact-based reporting"
        ],
        correctAnswer: 1
    },
    {
        question: "What is the purpose of a 'corrections' section in a newspaper?",
        options: [
            "To highlight the most important stories",
            "To advertise upcoming articles",
            "To acknowledge and rectify errors in previous publications",
            "To provide grammar lessons to readers"
        ],
        correctAnswer: 2
    },
    {
        question: "What is 'clickbait' in online journalism?",
        options: [
            "Headlines designed to attract attention and encourage clicks, often misleading",
            "A type of online advertisement for fishing equipment",
            "A technique to increase website loading speed",
            "A method of encrypting sensitive information in articles"
        ],
        correctAnswer: 0
    }
];

let currentQuiz = [];
let currentQuestion = 0;
let score = 0;

const quizSelection = document.getElementById('quiz-selection');
const quizContainer = document.getElementById('quiz-container');
const progressIndicator = document.getElementById('progress-indicator');
const questionContainer = document.getElementById('question-container');
const optionsContainer = document.getElementById('options-container');
const submitBtn = document.getElementById('submit-btn');
const nextBtn = document.getElementById('next-btn');
const resultsContainer = document.getElementById('results-container');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const levelDescriptionElement = document.getElementById('level-description');
const restartBtn = document.getElementById('restart-btn');

quizSelection.addEventListener('click', (e) => {
    if (e.target.classList.contains('quiz-btn')) {
        const length = e.target.dataset.length;
        startQuiz(length);
    }
});

function startQuiz(length) {
    quizSelection.style.display = 'none';
    quizContainer.style.display = 'block';

    const questionCount = {
        short: 5,
        medium: 10,
        long: 15
    }[length];

    currentQuiz = shuffleArray(quizData).slice(0, questionCount);
    currentQuestion = 0;
    score = 0;

    createProgressIndicator();
    loadQuestion();
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function createProgressIndicator() {
    progressIndicator.innerHTML = '';
    for (let i = 0; i < currentQuiz.length; i++) {
        const dot = document.createElement('div');
        dot.classList.add('progress-dot');
        if (i === 0) dot.classList.add('active');
        progressIndicator.appendChild(dot);
    }
}

function loadQuestion() {
    const question = currentQuiz[currentQuestion];
    questionContainer.textContent = question.question;

    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.classList.add('option');
        button.addEventListener('click', () => selectOption(button));
        optionsContainer.appendChild(button);
    });

    submitBtn.style.display = 'inline-block';
    nextBtn.style.display = 'none';

    updateProgressIndicator();
}

function updateProgressIndicator() {
    const dots = progressIndicator.children;
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.toggle('active', i === currentQuestion);
    }
}

function selectOption(selectedButton) {
    const options = optionsContainer.children;
    for (let option of options) {
        option.classList.remove('selected');
    }
    selectedButton.classList.add('selected');
}

function submitAnswer() {
    const selectedOption = optionsContainer.querySelector('.selected');
    if (!selectedOption) return;

    const answer = Array.from(optionsContainer.children).indexOf(selectedOption);
    const question = currentQuiz[currentQuestion];

    if (answer === question.correctAnswer) {
        selectedOption.classList.add('correct');
        score++;
    } else {
        selectedOption.classList.add('incorrect');
        optionsContainer.children[question.correctAnswer].classList.add('correct');
    }

    for (let option of optionsContainer.children) {
        option.disabled = true;
    }

    submitBtn.style.display = 'none';
    nextBtn.style.display = 'inline-block';
}

function nextQuestion() {
    currentQuestion++;
    if (currentQuestion < currentQuiz.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    quizContainer.style.display = 'none';
    resultsContainer.style.display = 'block';
    scoreElement.textContent = `${score} out of ${currentQuiz.length}`;

    const percentage = (score / currentQuiz.length) * 100;
    let level, description;

    if (percentage >= 90) {
        level = "Expert";
        description = "You have an exceptional understanding of media bias and news literacy. Keep up the great work!";
    } else if (percentage >= 70) {
        level = "Advanced";
        description = "You have a strong grasp of media bias concepts. There's still room for improvement, but you're well on your way to becoming an expert.";
    } else if (percentage >= 50) {
        level = "Intermediate";
        description = "You have a good foundation in media bias and news literacy. Keep learning and practicing to improve your skills.";
    } else {
        level = "Novice";
        description = "You're just starting your journey in understanding media bias. Don't worry, with more practice and learning, you'll improve quickly!";
    }

    levelElement.textContent = level;
    levelDescriptionElement.textContent = description;
}

function restartQuiz() {
    resultsContainer.style.display = 'none';
    quizSelection.style.display = 'block';
}

submitBtn.addEventListener('click', submitAnswer);
nextBtn.addEventListener('click', nextQuestion);
restartBtn.addEventListener('click', restartQuiz);