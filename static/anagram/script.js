let game = { words: [], idx: 0, scrambled: [], selected: [], time: 0, timer: null };

window.onload = async () => {
    GamesSDK.init(); // Init SDK
    // Inject Back Button
    const backBtn = document.createElement('a');
    backBtn.href = "/";
    backBtn.className = "absolute top-4 left-4 text-white font-bold bg-slate-700 px-4 py-2 rounded-xl hover:bg-slate-600 transition z-50";
    backBtn.innerHTML = "← Hub";
    document.body.appendChild(backBtn);

    try {
        const res = await fetch('/api/daily/anagram');
        game.words = await res.json();

        if (game.words.length > 0) {
            initGame();
        } else {
            console.error("No questions received from server.");
        }
    } catch (err) {
        console.error("Failed to load game data:", err);
    }
};

function initGame() {
    game.idx = 0;
    game.time = 0;
    loadWord();

    game.timer = setInterval(() => {
        game.time++;
        document.getElementById('timer').textContent = game.time + 's';
    }, 1000);
}

function loadWord() {
    const current = game.words[game.idx];
    document.getElementById('hint').textContent = current.hint;

    const originalWord = current.word.toUpperCase();
    game.scrambled = originalWord.split('').sort(() => 0.5 - Math.random());
    game.selected = [];

    render();
}

function render() {
    const sArea = document.getElementById('scrambled-area');
    const aArea = document.getElementById('answer-area');

    sArea.innerHTML = game.scrambled.map((letter, i) =>
        `<div class="tile cursor-pointer bg-white text-orange-800 font-black text-4xl p-4 rounded-xl shadow-lg border-b-4 border-orange-600 hover:scale-110 active:scale-95 transition" onclick="moveToAnswer(${i})">${letter}</div>`
    ).join('');

    aArea.innerHTML = game.selected.map((letter, i) =>
        `<div class="tile tile-ans cursor-pointer bg-yellow-100 text-orange-900 font-black text-4xl p-4 rounded-xl shadow-inner border-2 border-dashed border-orange-300 hover:bg-red-100 transition" onclick="moveToScrambled(${i})">${letter}</div>`
    ).join('');

    document.getElementById('counter').textContent = `${game.idx + 1}/${game.words.length}`;
}

window.moveToAnswer = function (i) {
    game.selected.push(game.scrambled.splice(i, 1)[0]);
    render();
};

window.moveToScrambled = function (i) {
    game.scrambled.push(game.selected.splice(i, 1)[0]);
    render();
};

window.resetCurrentWord = function () {
    loadWord();
};

window.checkAnswer = function () {
    const userGuess = game.selected.join('');
    const correctWord = game.words[game.idx].word.toUpperCase();

    if (userGuess === correctWord) {
        game.idx++;
        if (game.idx >= game.words.length) {
            endGame();
        } else {
            loadWord();
        }
    } else {
        showError();
    }
};

function showError() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = "Incorrect combination!";
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 1500);
}

function endGame() {
    clearInterval(game.timer);
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
    document.getElementById('final-time').textContent = game.time + 's';

    // REPORT SCORE TO SDK
    GamesSDK.reportScore('anagram');
}
