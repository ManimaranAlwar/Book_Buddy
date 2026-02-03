document.addEventListener('DOMContentLoaded', () => {
    GamesSDK.init();

    // Inject Hub Button
    const btn = document.createElement('a');
    btn.href = '/';
    btn.className = 'fixed top-4 left-4 z-50 bg-white/50 hover:bg-white text-blue-900 font-bold py-2 px-4 rounded-full backdrop-blur-md shadow-lg transition';
    btn.innerText = '🏠 Home';
    document.body.appendChild(btn);

    let levels = [];
    let currentLevelIndex = 0;
    let currentLevel = null;
    let selectedLeft = null;
    let selectedRight = null;
    let matchesFound = 0;
    let totalMatches = 0;
    let startTime = null;
    let timerInterval = null;

    const colLeft = document.getElementById('col-left');
    const colRight = document.getElementById('col-right');
    const scoreEl = document.getElementById('score');
    const timerEl = document.getElementById('timer');
    const winOverlay = document.getElementById('win-overlay');
    const levelTitleEl = document.getElementById('level-title');

    // Updated API Route
    fetch('/api/daily/matchup')
        .then(response => response.json())
        .then(data => {
            levels = data;
            initLevel(0);
        })
        .catch(err => {
            console.error(err);
            colLeft.innerHTML = "<p>Error loading game data.</p>";
        });

    window.initLevel = function (index) {
        currentLevelIndex = index;
        if (index >= levels.length) {
            // ALL LEVELS COMPLETE
            winOverlay.querySelector('h2').textContent = "🏆 CHAMPION!";
            winOverlay.querySelector('p').textContent = "You completed ALL levels!";
            const btn = winOverlay.querySelector('button');
            btn.textContent = "Back to Hub";
            btn.onclick = () => window.location.href = '/';
            winOverlay.classList.remove('hidden');

            // REPORT SCORE
            GamesSDK.reportScore('matchup');
            return;
        }

        currentLevel = levels[index];
        matchesFound = 0;
        totalMatches = currentLevel.pairs.length;

        scoreEl.textContent = `0/${totalMatches}`;
        winOverlay.classList.add('hidden');
        if (levelTitleEl) levelTitleEl.textContent = currentLevel.title;

        const leftWords = currentLevel.pairs.map(p => ({ text: p.word, type: 'left', id: p.word }));
        const rightWords = currentLevel.pairs.map(p => ({ text: p.match, type: 'right', matches: p.word }));

        shuffle(leftWords);
        shuffle(rightWords);

        renderColumn(colLeft, leftWords);
        renderColumn(colRight, rightWords);

        clearInterval(timerInterval);
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function renderColumn(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'word-card';
            el.textContent = item.text;
            el.dataset.type = item.type;
            if (item.type === 'left') {
                el.dataset.id = item.id;
            } else {
                el.dataset.matches = item.matches;
            }
            el.addEventListener('click', handleCardClick);
            container.appendChild(el);
        });
    }

    function handleCardClick(e) {
        const card = e.currentTarget;
        if (card.classList.contains('matched') || card.classList.contains('selected')) return;

        card.style.transform = "scale(0.95)";
        setTimeout(() => card.style.transform = "", 100);

        const type = card.dataset.type;
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

        if (type === 'left') {
            if (selectedLeft) selectedLeft.classList.remove('selected');
            selectedLeft = card;
            card.classList.add('selected');
        } else {
            if (selectedRight) selectedRight.classList.remove('selected');
            selectedRight = card;
            card.classList.add('selected');
        }

        checkMatch();
    }

    function checkMatch() {
        if (!selectedLeft || !selectedRight) return;

        const wordId = selectedLeft.dataset.id;
        const matchId = selectedRight.dataset.matches;

        if (wordId === matchId) {
            handleSuccess();
        } else {
            handleFailure();
        }
    }

    function handleSuccess() {
        selectedLeft.classList.add('matched');
        selectedRight.classList.add('matched');
        selectedLeft = null;
        selectedRight = null;
        matchesFound++;
        scoreEl.textContent = `${matchesFound}/${totalMatches}`;

        if (matchesFound === totalMatches) {
            setTimeout(handleWin, 500);
        }
    }

    function handleFailure() {
        const l = selectedLeft;
        const r = selectedRight;
        setTimeout(() => {
            l.classList.add('error');
            r.classList.add('error');
            l.classList.remove('selected');
            r.classList.remove('selected');
        }, 300);
        selectedLeft = null;
        selectedRight = null;
    }

    function updateTimer() {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        timerEl.textContent = `${minutes}:${seconds}`;
    }

    function handleWin() {
        clearInterval(timerInterval);
        const h2 = winOverlay.querySelector('h2');
        const p = winOverlay.querySelector('p');
        const btn = winOverlay.querySelector('button');

        h2.textContent = "🎉 Awesome Job!";
        p.textContent = `You finished Level ${currentLevelIndex + 1}!`;

        if (currentLevelIndex + 1 < levels.length) {
            btn.textContent = "Next Level ➡️";
            btn.onclick = () => initLevel(currentLevelIndex + 1);
        } else {
            h2.textContent = "🏆 YOU WIN!";
            p.textContent = "You completed ALL levels!";
            btn.textContent = "Back to Hub";
            btn.onclick = () => window.location.href = '/';
            GamesSDK.reportScore('matchup');
        }

        winOverlay.classList.remove('hidden');
    }
});
