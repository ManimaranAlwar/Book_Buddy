let game = { words: [], idx: 0, scrambled: [], selected: [], time: 0, timer: null };

window.onload = async () => {
    GamesSDK.init(); // Init SDK

    try {
        const res = await fetch('/api/daily/anagram');
        game.words = await res.json();

        if (game.words.length > 0) {
            initGame();
        } else {
            console.error("No questions received from server.");
            document.getElementById('hint').textContent = "Error loading daily challenge.";
        }
    } catch (err) {
        console.error("Failed to load game data:", err);
        document.getElementById('hint').textContent = "Error loading daily challenge.";
    }
};

function initGame() {
    game.idx = 0;
    game.time = 0;
    loadWord();

    game.timer = setInterval(() => {
        game.time++;
        const seconds = game.time % 60;
        const minutes = Math.floor(game.time / 60);
        document.getElementById('timer').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}s`;
    }, 1000);
}

function loadWord() {
    if (game.idx >= game.words.length) {
        endGame();
        return;
    }
    const current = game.words[game.idx];
    document.getElementById('hint').textContent = current.hint;
    document.getElementById('hint').classList.add('animate-bounce-in');
    setTimeout(() => document.getElementById('hint').classList.remove('animate-bounce-in'), 500);

    const originalWord = current.word.toUpperCase();
    game.scrambled = originalWord.split('').sort(() => 0.5 - Math.random());
    game.selected = [];

    render();
}

function render() {
    const sArea = document.getElementById('scrambled-area');
    const aArea = document.getElementById('answer-area');

    sArea.innerHTML = game.scrambled.map((letter, i) =>
        `<div class="tile w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-white text-theme-blue font-black text-3xl sm:text-4xl rounded-2xl shadow-lg border-2 border-theme-blue/10 animate-bounce-in" onclick="moveToAnswer(${i})">${letter}</div>`
    ).join('');

    aArea.innerHTML = game.selected.map((letter, i) =>
        `<div class="tile w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-theme-blue text-white font-black text-3xl sm:text-4xl rounded-2xl shadow-xl border-2 border-theme-blue animate-bounce-in" onclick="moveToScrambled(${i})">${letter}</div>`
    ).join('');

    // Fill remaining slots in answer area
    const current = game.words[game.idx];
    if (current) {
        const remaining = current.word.length - game.selected.length;
        for (let i = 0; i < remaining; i++) {
            aArea.innerHTML += `<div class="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-theme-blue/5 rounded-2xl border-2 border-dashed border-theme-blue/10"></div>`;
        }
    }

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
        showFeedback("PERFECT!", "text-green-500");
        game.idx++;
        setTimeout(() => {
            if (game.idx >= game.words.length) {
                endGame();
            } else {
                loadWord();
            }
        }, 800);
    } else {
        showFeedback("TRY AGAIN", "text-theme-red");
        // Optional: Shake animation here
    }
};

function showFeedback(text, colorClass) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = text;
    feedback.className = `h-8 mt-6 text-center font-black tracking-widest ${colorClass} animate-bounce-in`;
    setTimeout(() => {
        feedback.textContent = "";
        feedback.className = "h-8 mt-6 text-center font-bold";
    }, 1500);
}

function endGame() {
    clearInterval(game.timer);
    document.getElementById('game-container').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');

    const minutes = Math.floor(game.time / 60);
    const seconds = game.time % 60;
    document.getElementById('final-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    // REPORT SCORE TO SDK
    GamesSDK.reportScore('anagram');
}
