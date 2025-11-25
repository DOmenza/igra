const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const moles = document.querySelectorAll('.mole'); // This selects initial moles, but we might change classes
const startBtn = document.getElementById('start-btn');
const leaderboardBtn = document.getElementById('leaderboard-btn');
const leaderboardModal = document.getElementById('leaderboard-modal');
const closeLeaderboardBtn = document.getElementById('close-leaderboard');
const leaderboardList = document.getElementById('leaderboard-list');

let lastHole;
let timeUp = false;
let score = 0;
let gameDuration = 15000; // 15 seconds

// Telegram WebApp Integration
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Theme handling (Optional override since we are enforcing BetBoom style)
// if (tg.colorScheme === 'dark') { ... }

// MainButton setup
tg.MainButton.setText('PLAY GAME');
tg.MainButton.show();
tg.MainButton.onClick(startGame);

startBtn.addEventListener('click', startGame);
leaderboardBtn.addEventListener('click', openLeaderboard);
closeLeaderboardBtn.addEventListener('click', closeLeaderboard);

function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holes) {
    const idx = Math.floor(Math.random() * holes.length);
    const hole = holes[idx];
    if (hole === lastHole) {
        return randomHole(holes);
    }
    lastHole = hole;
    return hole;
}

function peep() {
    const time = randomTime(400, 1000);
    const hole = randomHole(holes);

    // 20% chance to be a Pug
    const isPug = Math.random() < 0.2;
    const target = hole.querySelector('div'); // Get the inner div (mole or pug)

    // Reset classes
    target.classList.remove('mole', 'pug', 'bonked');

    if (isPug) {
        target.classList.add('pug');
    } else {
        target.classList.add('mole');
    }

    hole.classList.add('up');

    setTimeout(() => {
        hole.classList.remove('up');
        if (!timeUp) peep();
    }, time);
}

function startGame() {
    scoreBoard.textContent = 0;
    timeUp = false;
    score = 0;

    // Update UI
    startBtn.style.display = 'none';
    leaderboardBtn.style.display = 'none';
    tg.MainButton.hide();

    peep();

    setTimeout(() => {
        timeUp = true;
        endGame();
    }, gameDuration);
}

function endGame() {
    tg.HapticFeedback.notificationOccurred('success');
    tg.MainButton.setText(`GAME OVER! Score: ${score}. PLAY AGAIN`);
    tg.MainButton.show();
    startBtn.style.display = 'block';
    startBtn.textContent = 'Play Again';
    leaderboardBtn.style.display = 'block';

    saveScore(score);
}

function bonk(e) {
    if (!e.isTrusted) return; // cheater!

    const isPug = this.classList.contains('pug');

    this.parentNode.classList.remove('up');
    this.parentNode.classList.add('bonked');

    if (isPug) {
        // Penalty
        score -= 5; // Deduct 5 points
        tg.HapticFeedback.notificationOccurred('error');
        createParticles(e.clientX, e.clientY, true); // Red particles
    } else {
        // Success
        score++;
        tg.HapticFeedback.impactOccurred('medium');
        createParticles(e.clientX, e.clientY, false); // Yellow particles
    }

    scoreBoard.textContent = score;

    setTimeout(() => {
        this.parentNode.classList.remove('bonked');
    }, 100);
}

function createParticles(x, y, isNegative) {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        if (isNegative) particle.classList.add('negative');

        document.body.appendChild(particle);

        const tx = (Math.random() - 0.5) * 100;
        const ty = (Math.random() - 0.5) * 100;

        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        setTimeout(() => particle.remove(), 500);
    }
}

// Leaderboard Logic
function saveScore(newScore) {
    let scores = JSON.parse(localStorage.getItem('whackamole_scores')) || [];
    scores.push({ score: newScore, date: new Date().toISOString() });
    scores.sort((a, b) => b.score - a.score); // Sort descending
    scores = scores.slice(0, 10); // Keep top 10
    localStorage.setItem('whackamole_scores', JSON.stringify(scores));
}

function openLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('whackamole_scores')) || [];
    leaderboardList.innerHTML = scores.map((entry, index) => `
        <li>
            <span class="rank">#${index + 1}</span>
            <span>${entry.score} pts</span>
        </li>
    `).join('') || '<li>No scores yet!</li>';

    leaderboardModal.classList.add('open');
}

function closeLeaderboard() {
    leaderboardModal.classList.remove('open');
}

// Event listeners for all potential targets (since we swap classes, we need to ensure listeners are attached)
// Actually, the elements are static, we just change classes. So we can attach to the elements found initially.
// However, querySelectorAll('.mole') only found elements with class .mole at that time.
// Better to select by parent .hole and then find the child, or just select all children of holes.
// The HTML is static: <div class="hole"><div class="mole"></div></div>
// We can select the inner divs.

const targets = document.querySelectorAll('.hole > div');
targets.forEach(target => {
    target.addEventListener('click', bonk);
    target.addEventListener('touchstart', bonk);
});

