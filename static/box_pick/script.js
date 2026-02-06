let currentPuzzle = null;
let selectedWords = [];
let removedWords = [];
let streak = 0;

document.addEventListener('DOMContentLoaded', () => {
    // Init SDK
    GamesSDK.init();
    if (GamesSDK.user) {
        streak = GamesSDK.user.streaks['box_pick'] || 0;
        document.getElementById('current-streak').textContent = streak;
    }

    // Load Puzzle
    fetch('/api/daily/box_pick')
        .then(res => {
            if (!res.ok) throw new Error("Server Error");
            return res.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);
            currentPuzzle = data;
            initGame();
        })
        .catch(err => {
            console.error(err);
            document.getElementById('riddle-text').textContent = "Failed to load puzzle.";
            document.getElementById('riddle-emoji').textContent = "⚠️";
        });

    // Event Listeners
    document.getElementById('submit-btn').addEventListener('click', checkAnswer);

    // Trash
    const trashZone = document.getElementById('trash-zone');
    trashZone.addEventListener('dragover', e => { e.preventDefault(); trashZone.classList.add('drag-over'); });
    trashZone.addEventListener('dragleave', () => trashZone.classList.remove('drag-over'));
    trashZone.addEventListener('drop', handleDrop);
});

function initGame() {
    document.getElementById('riddle-text').textContent = currentPuzzle.riddle;
    document.getElementById('riddle-emoji').textContent = currentPuzzle.emoji;

    // Combine and Shuffle
    const allWords = [...currentPuzzle.correctWords, ...currentPuzzle.wrongWords];
    allWords.sort(() => Math.random() - 0.5);

    const container = document.getElementById('words-container');
    container.innerHTML = '';

    allWords.forEach((word, index) => {
        const chip = document.createElement('div');
        chip.className = 'word-chip bg-white text-indigo-700 font-bold px-4 py-2 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition';
        chip.textContent = word;
        chip.draggable = true;
        chip.dataset.word = word;

        chip.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', word);
            chip.classList.add('opacity-50');
        });

        chip.addEventListener('dragend', () => chip.classList.remove('opacity-50'));

        container.appendChild(chip);
    });
}

function handleDrop(e) {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    document.getElementById('trash-zone').classList.remove('drag-over');

    if (!removedWords.includes(word)) {
        removedWords.push(word);
        // Remove from DOM
        const chips = document.querySelectorAll('.word-chip');
        chips.forEach(c => {
            if (c.textContent === word) c.remove();
        });

        // Add to Removed List
        const removedContainer = document.getElementById('removed-words');
        const removedChip = document.createElement('div');
        removedChip.className = "bg-gray-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2";
        removedChip.innerHTML = `${word} <span class="cursor-pointer" onclick="restoreWord('${word}')">↩️</span>`;
        removedContainer.appendChild(removedChip);
        document.getElementById('removed-section').classList.remove('hidden');
    }
}

window.restoreWord = function (word) {
    removedWords = removedWords.filter(w => w !== word);
    // Re-render whole game is easiest
    const removedContainer = document.getElementById('removed-words');
    removedContainer.innerHTML = '';
    removedWords.forEach(w => {
        // Re-add remaining
        const rc = document.createElement('div');
        rc.className = "bg-gray-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2";
        rc.innerHTML = `${w} <span class="cursor-pointer" onclick="restoreWord('${w}')">↩️</span>`;
        removedContainer.appendChild(rc);
    });

    if (removedWords.length === 0) document.getElementById('removed-section').classList.add('hidden');

    // Add back to main pool
    const container = document.getElementById('words-container');
    const chip = document.createElement('div');
    chip.className = 'word-chip bg-white text-indigo-700 font-bold px-4 py-2 rounded-full shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition';
    chip.textContent = word;
    chip.draggable = true;
    chip.dataset.word = word;
    chip.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', word); chip.classList.add('opacity-50'); });
    chip.addEventListener('dragend', () => chip.classList.remove('opacity-50'));
    container.appendChild(chip);
}

function checkAnswer() {
    // Current correct words should NOT be in removedWords
    // Current wrong words SHOULD be in removedWords

    const correctWords = currentPuzzle.correctWords;
    const wrongWords = currentPuzzle.wrongWords;

    // Did we throw away any good words?
    const thrownGood = removedWords.filter(w => correctWords.includes(w));

    // Did we keep any bad words? (Items in DOM are 'kept')
    // Easier: Check if ALL wrong words are in removedWords
    const thrownBad = removedWords.filter(w => wrongWords.includes(w));
    const keptBad = wrongWords.length - thrownBad.length;

    if (thrownGood.length > 0) {
        alert(`Oops! You threw away correct words: ${thrownGood.join(', ')}`);
        return;
    }

    if (keptBad > 0) {
        alert(`There are still ${keptBad} wrong words in the box! keep looking!`);
        return;
    }

    // WIN
    document.getElementById('success-modal').classList.remove('hidden');
    GamesSDK.reportScore('box_pick');
}
