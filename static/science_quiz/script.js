let questions = [];
let currentIdx = 0;
let score = 0;
let answered = false;

const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const scoreText = document.getElementById('score-text');

async function loadQuiz() {
    const response = await fetch('/science-quiz/api/questions');
    questions = await response.json();
    if (questions.length > 0) showQuestion();
    else questionEl.innerText = "No mathematical anomalies detected. Check systems.";
}

function showQuestion() {
    answered = false;
    nextBtn.classList.add('hidden');
    optionsEl.innerHTML = "";

    let q = questions[currentIdx];
    questionEl.innerText = q.question;

    // Update progress
    const progress = ((currentIdx) / questions.length) * 100;
    progressBar.style.width = progress + "%";
    progressText.innerText = `SECTOR ${currentIdx + 1} / ${questions.length}`;

    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.className = "option-btn glass py-5 px-8 rounded-2xl font-black text-lg text-theme-blue border-2 border-transparent text-left";
        btn.onclick = () => checkAnswer(opt, btn);
        optionsEl.appendChild(btn);
    });
}

function checkAnswer(selected, btn) {
    if (answered) return;
    answered = true;

    const q = questions[currentIdx];
    if (selected === q.answer) {
        btn.classList.add("correct", "text-white");
        score++;
    } else {
        btn.classList.add("wrong", "text-white");
        // Show correct answer
        Array.from(optionsEl.children).forEach(b => {
            if (b.innerText === q.answer) b.classList.add("correct", "text-white");
        });
    }

    nextBtn.classList.remove("hidden");
}

nextBtn.onclick = () => {
    currentIdx++;
    if (currentIdx < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
};

function showResults() {
    quizContainer.classList.add("hidden");
    resultContainer.classList.remove("hidden");
    scoreText.innerText = `You decoded ${score} out of ${questions.length} scientific anomalies correctly!`;

    // Report score
    GamesSDK.reportScore('science_quiz');
}

loadQuiz();
