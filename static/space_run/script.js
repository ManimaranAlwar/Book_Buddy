class AstraEngine {
    constructor() {
        this.score = 0;
        this.oxygen = 100;
        this.fuel = 100;
        this.currentIdx = 0;
        this.questions = [];
        this.astro = document.getElementById('astronaut');
        this.planetPool = [
            'jupeter.png', 'mars.png', 'sarten.png',
            'urenis.png', 'ploto.png', 'suturn.png', 'earth.png'
        ];
        this.createStars();
        document.getElementById('hint-btn').onclick = () => this.triggerHint();
        this.init();
    }

    createStars() {
        const container = document.getElementById('starfield');
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 3;
            star.style.width = size + 'px'; star.style.height = size + 'px';
            star.style.left = Math.random() * 100 + '%'; star.style.top = Math.random() * 100 + '%';
            container.appendChild(star);
        }
    }

    async init() {
        GamesSDK.init(); // SDK
        try {
            const res = await fetch('/api/daily/space_run');
            this.questions = await res.json();
            // Start Game
            this.spawnPlanet("START", "earth.png", 50, 5, 180, true);
            this.startLoop();
            this.loadMission();
        } catch (e) {
            console.error(e);
            alert("Mission Abort: Data Failure");
        }
    }

    startLoop() {
        setInterval(() => {
            if (this.currentIdx < this.questions.length) {
                this.oxygen -= 0.3;
                document.getElementById('oxy-bar').style.width = this.oxygen + '%';
                if (this.oxygen <= 0) this.endGame("OXYGEN DEPLETED");
            }
        }, 1000);
    }

    triggerHint() {
        const q = this.questions[this.currentIdx];
        const ship = document.getElementById('hint-ship');
        if (!q) return;
        document.getElementById('hint-bubble').innerText = q.hint;
        ship.classList.add('active');
        setTimeout(() => ship.classList.remove('active'), 4000);
    }

    loadMission() {
        const q = this.questions[this.currentIdx];
        if (!q) return this.endGame("GALAXY SAVED!");
        document.getElementById('question-text').innerText = q.q;

        const pos = [{ l: 20, b: 35 }, { l: 50, b: 50 }, { l: 80, b: 35 }];
        let shuffled = [...this.planetPool].sort(() => Math.random() - 0.5);

        q.options.forEach((opt, i) => {
            const img = shuffled[i];
            const p = this.spawnPlanet(opt, img, pos[i].l, pos[i].b, 150);
            p.onclick = () => this.jump(p, i === q.correct);
        });
    }

    jump(target, isCorrect) {
        if (!isCorrect) {
            target.classList.add('planet-fall');
            setTimeout(() => this.endGame("CRITICAL NAVIGATION ERROR"), 1000);
            return;
        }

        this.astro.classList.add('flying');
        this.fuel -= 10;
        this.score += 100;
        document.getElementById('score-val').innerText = this.score;
        document.getElementById('fuel-bar').style.width = this.fuel + '%';

        this.syncAstro(target);

        setTimeout(() => {
            this.astro.classList.remove('flying');
            document.querySelectorAll('.planet').forEach(p => { if (p !== target) p.remove(); });

            target.style.left = "50%";
            target.style.bottom = "5%";
            target.style.width = "180px";
            target.style.height = "180px";

            setTimeout(() => {
                this.syncAstro(target);
                this.currentIdx++;
                this.loadMission();
            }, 800);
        }, 600);
    }

    syncAstro(p) {
        const r = p.getBoundingClientRect();
        this.astro.style.left = `${r.left + r.width / 2 - 32}px`;
        this.astro.style.top = `${r.top + r.height / 2 - 80}px`;
    }

    spawnPlanet(txt, img, l, b, size, isOrigin = false) {
        const p = document.createElement('div');
        p.className = 'planet';
        p.innerHTML = `<span>${txt}</span>`;
        p.style.left = l + '%';
        p.style.bottom = b + '%';
        p.style.width = size + 'px';
        p.style.height = size + 'px';

        // FIX: Ensure image path is correct relative to Flask static
        p.style.backgroundImage = `url('/static/space_run/images/${img}')`;

        document.body.appendChild(p);

        if (isOrigin) {
            setTimeout(() => this.syncAstro(p), 100);
        }
        return p;
    }

    async endGame(msg) {
        document.getElementById('end-screen').style.display = 'flex';
        document.getElementById('status').innerText = msg;
        document.getElementById('final-score').innerText = this.score;

        // Report Score
        if (msg === "GALAXY SAVED!") {
            GamesSDK.reportScore('space_run');
        }
    }
}
window.onload = () => new AstraEngine();