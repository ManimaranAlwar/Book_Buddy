const questionEl = document.getElementById('question-display');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const hotspotLayer = document.getElementById('hotspot-layer');
const nextLevelBtn = document.getElementById('next-level-btn');
const hint1Btn = document.getElementById('hint1-btn');
const hint2Btn = document.getElementById('hint2-btn');
const hintDisplay = document.getElementById('hint-display');
const successSound = document.getElementById('success-sound');
const gameImage = document.getElementById('game-image');
const gameContainer = document.getElementById('game-container');

let score = 0;
let lives = 3;
let currentItem = null;
let currentLevel = 0;
let gameData = [];
let hintUsed = 0;
let foundInCurrent = false;

let levels = [];

async function loadLevels() {
    try {
        const res = await fetch('/hidden/api/levels');
        levels = await res.json();
        initLevel();
    } catch (e) { console.error("Levels load failed", e); }
}

function initLevel() {
    hintUsed = 0;
    hint1Btn.disabled = false;
    hint2Btn.disabled = true;
    hintDisplay.innerText = "Select a sensor boost above if you are stuck.";
    nextLevelBtn.classList.add("hidden");
    foundInCurrent = false;

    const level = levels[currentLevel];
    gameImage.src = level.image;
    gameData = [...level.items];
    lives = 3;
    updateHearts();
    nextQuestion();
}

function nextQuestion() {
    if (gameData.length === 0) {
        if (currentLevel < levels.length - 1) {
            questionEl.innerText = "SECTOR CLEAR! PROCEED TO NEXT COORDINATE.";
            nextLevelBtn.classList.remove("hidden");
        } else {
            questionEl.innerText = "ALL SECTORS SECURED! MISSION ACCOMPLISHED.";
        }
        hotspotLayer.innerHTML = '';
        return;
    }

    foundInCurrent = false;
    currentItem = gameData[Math.floor(Math.random() * gameData.length)];
    questionEl.innerText = currentItem.riddle;
    renderHotspot();
}

function renderHotspot() {
    hotspotLayer.innerHTML = '';
    const spot = document.createElement('div');
    spot.className = 'hotspot';
    Object.assign(spot.style, {
        top: currentItem.top,
        left: currentItem.left,
        width: currentItem.width,
        height: currentItem.height,
        transform: "translate(-50%, -50%)"
    });

    spot.onclick = e => {
        e.stopPropagation();
        if (foundInCurrent) return;
        handleSuccess(spot);
    };

    hotspotLayer.appendChild(spot);
}

function handleSuccess(spot) {
    foundInCurrent = true;
    score++;
    scoreEl.innerText = score;
    spot.classList.add("found");
    successSound.play();

    // SDK Score Reporting
    GamesSDK.reportScore('hidden');

    setTimeout(() => {
        gameData.splice(gameData.indexOf(currentItem), 1);
        nextQuestion();
    }, 1000);
}

function handleMiss() {
    if (foundInCurrent || lives <= 0) return;

    lives--;
    updateHearts();
    gameContainer.classList.add('wrong-click');
    setTimeout(() => gameContainer.classList.remove('wrong-click'), 300);

    if (lives === 0) {
        questionEl.innerText = "SYSTEM CRITICAL: MISSION FAILED";
        hotspotLayer.innerHTML = '';
    }
}

function updateHearts() {
    livesEl.innerText = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
}

function showHint(num) {
    if (num === 1 && hintUsed === 0) {
        hintDisplay.innerText = currentItem.hints[0];
        hintUsed = 1;
        hint1Btn.disabled = true;
        hint2Btn.disabled = false;
    } else if (num === 2 && hintUsed === 1) {
        hintDisplay.innerText = currentItem.hints[1];
        hint2Btn.disabled = true;
    }
}

gameContainer.onclick = handleMiss;
hint1Btn.onclick = () => showHint(1);
hint2Btn.onclick = () => showHint(2);
document.getElementById('restart-btn').onclick = () => initLevel();
nextLevelBtn.onclick = () => { currentLevel++; initLevel(); };

// loadLevels() replaces direct initLevel() to fetch data from API
loadLevels();
