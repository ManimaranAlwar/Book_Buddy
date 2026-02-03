let pilotName = localStorage.getItem('pilotName') || "UNKNOWN";
let startTime, timerActive = false;
// currentLevel is defined in index.html

window.onload = () => {
    GamesSDK.init();
    if (GamesSDK.user) {
        pilotName = GamesSDK.user.name;
    }

    document.getElementById('display-name').innerText = pilotName;

    startTime = Date.now();
    timerActive = true;
    setInterval(updateTimer, 1000);

    const inputs = document.querySelectorAll('.input-cell');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim() === "") {
                input.classList.remove('correct', 'wrong');
            } else if (input.value.trim() === input.dataset.ans) {
                input.classList.add('correct');
                input.classList.remove('wrong');
            } else {
                input.classList.add('wrong');
                input.classList.remove('correct');
            }
        });
    });
};

function updateTimer() {
    if (!timerActive) return;
    let elapsed = Math.floor((Date.now() - startTime) / 1000);
    let m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    let s = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('timer').innerText = `T-MINUS: ${m}:${s}`;
}

async function validateTerminal() {
    const inputs = document.querySelectorAll('.input-cell');
    const msg = document.getElementById('status-msg');

    let allClear = Array.from(inputs).every(i => i.value.trim() === i.dataset.ans);

    if (allClear) {
        timerActive = false;
        msg.innerText = "ACCESS GRANTED. WARPING...";
        msg.className = "status-msg success";

        // Report Score
        GamesSDK.reportScore('cross_maths');

        setTimeout(() => {
            window.location.href = "/cross-maths/level/" + (parseInt(window.currentLevel) + 1);
        }, 1500);
    } else {
        msg.innerText = "CRITICAL ERROR: CALCULATIONS INCOMPLETE";
        msg.className = "status-msg error";
        document.querySelector('.terminal-container').style.borderColor = "red";
        setTimeout(() => {
            document.querySelector('.terminal-container').style.borderColor = "var(--neon-cyan)";
        }, 500);
    }
}
