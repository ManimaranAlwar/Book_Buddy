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
            document.getElementById('riddle-text').textContent = "Connection to Mission Control failed. Please reload.";
            document.getElementById('riddle-emoji').textContent = "⚠️";
        });

    // Event Listeners
    document.getElementById('submit-btn').addEventListener('click', checkAnswer);

    // Trash
    const trashZone = document.getElementById('trash-zone');
    trashZone.addEventListener('dragover', e => {
        e.preventDefault();
        trashZone.classList.add('drag-over', 'border-theme-red/50');
    });
    trashZone.addEventListener('dragleave', () => {
        trashZone.classList.remove('drag-over', 'border-theme-red/50');
    });
    trashZone.addEventListener('drop', handleDrop);
});

function initGame() {
    document.getElementById('riddle-text').textContent = currentPuzzle.riddle;
    document.getElementById('riddle-emoji').textContent = currentPuzzle.emoji;
    document.getElementById('riddle-emoji-bg').textContent = currentPuzzle.emoji;

    // Combine and Shuffle
    const allWords = [...currentPuzzle.correctWords, ...currentPuzzle.wrongWords];
    allWords.sort(() => Math.random() - 0.5);

    const container = document.getElementById('words-container');
    container.innerHTML = '';

    allWords.forEach((word, index) => {
        const chip = document.createElement('div');
        chip.className = 'word-chip glass bg-white/50 text-theme-blue font-black px-6 py-3 rounded-2xl shadow-sm border border-theme-blue/5 animate-bounce-in';
        chip.textContent = word;
        chip.draggable = true;
        chip.dataset.word = word;

        chip.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', word);
            chip.classList.add('opacity-30', 'scale-90');
        });

        chip.addEventListener('dragend', () => {
            chip.classList.remove('opacity-30', 'scale-90');
        });

        // Add small delay to staggered animation
        chip.style.animationDelay = `${index * 0.05}s`;

        container.appendChild(chip);
    });
}

function handleDrop(e) {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    const trashZone = document.getElementById('trash-zone');
    trashZone.classList.remove('drag-over', 'border-theme-red/50');

    if (!removedWords.includes(word)) {
        removedWords.push(word);

        // Remove from DOM with animation
        const chips = document.querySelectorAll('.word-chip');
        chips.forEach(c => {
            if (c.textContent === word) {
                c.classList.add('scale-0', 'opacity-0');
                setTimeout(() => c.remove(), 300);
            }
        });

        // Add to Removed List
        const removedContainer = document.getElementById('removed-words');
        const removedChip = document.createElement('div');
        removedChip.className = "bg-theme-blue/5 text-theme-blue/60 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 animate-bounce-in border border-theme-blue/5 hover:bg-theme-blue/10 transition-colors";
        removedChip.innerHTML = `
            <span>${word}</span>
            <button class="hover:scale-125 transition-transform" onclick="restoreWord('${word}')" title="Restore Word">↺</button>
        `;
        removedContainer.appendChild(removedChip);
        document.getElementById('removed-section').classList.remove('hidden');

        // Visual feedback on trash zone
        trashZone.classList.add('bg-theme-red/5');
        setTimeout(() => trashZone.classList.remove('bg-theme-red/5'), 200);
    }
}

window.restoreWord = function (word) {
    removedWords = removedWords.filter(w => w !== word);

    // Update removed container
    const removedContainer = document.getElementById('removed-words');
    const chips = removedContainer.querySelectorAll('div');
    chips.forEach(c => {
        if (c.querySelector('span').textContent === word) {
            c.classList.add('scale-0');
            setTimeout(() => c.remove(), 200);
        }
    });

    if (removedWords.length === 0) {
        setTimeout(() => {
            if (removedWords.length === 0) document.getElementById('removed-section').classList.add('hidden');
        }, 250);
    }

    // Add back to main pool
    const container = document.getElementById('words-container');
    const chip = document.createElement('div');
    chip.className = 'word-chip glass bg-white/50 text-theme-blue font-black px-6 py-3 rounded-2xl shadow-sm border border-theme-blue/5 animate-bounce-in';
    chip.textContent = word;
    chip.draggable = true;
    chip.dataset.word = word;

    chip.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', word);
        chip.classList.add('opacity-30', 'scale-90');
    });
    chip.addEventListener('dragend', () => {
        chip.classList.remove('opacity-30', 'scale-90');
    });

    container.appendChild(chip);
}

function checkAnswer() {
    const correctWords = currentPuzzle.correctWords;
    const wrongWords = currentPuzzle.wrongWords;

    const thrownGood = removedWords.filter(w => correctWords.includes(w));
    const thrownBad = removedWords.filter(w => wrongWords.includes(w));
    const keptBad = wrongWords.length - thrownBad.length;

    if (thrownGood.length > 0) {
        showGlobalFeedback(`LOGIC ERROR: Correct items were removed!`, "text-theme-red");
        return;
    }

    if (keptBad > 0) {
        showGlobalFeedback(`SCAN INCOMPLETE: ${keptBad} illogical items remain in the box.`, "text-theme-red");
        return;
    }

    // SUCCESS
    document.getElementById('success-modal').classList.remove('hidden');
    GamesSDK.reportScore('box_pick');
}

function showGlobalFeedback(msg, colorClass) {
    // Create a temporary feedback toast since we removed alerts
    const toast = document.createElement('div');
    toast.className = `fixed bottom-12 left-1/2 -translate-x-1/2 glass px-8 py-4 rounded-2xl font-black ${colorClass} shadow-2xl z-[100] animate-bounce-in border-2 border-theme-blue/10`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
