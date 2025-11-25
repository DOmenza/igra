const holes = document.querySelectorAll('.hole');
const scoreBoard = document.querySelector('.score');
const moles = document.querySelectorAll('.mole');
const startBtn = document.getElementById('start-btn');

let lastHole;
let timeUp = false;
let score = 0;
let gameDuration = 15000; // 15 seconds

// Telegram WebApp Integration
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Theme handling
if (tg.colorScheme === 'dark') {
    document.documentElement.style.setProperty('--bg-color', tg.themeParams.bg_color || '#1a1a2e');
    document.documentElement.style.setProperty('--text-color', tg.themeParams.text_color || '#ffffff');
}

// MainButton setup
tg.MainButton.setText('PLAY GAME');
tg.MainButton.show();
tg.MainButton.onClick(startGame);

startBtn.addEventListener('click', startGame);

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
    startBtn.style.display = 'none'; // Hide HTML button
    tg.MainButton.hide(); // Hide MainButton during game or change to "Stop"
    // Actually, let's keep MainButton hidden during game to avoid distraction, or use it for "Stop"
    // For now, hide it.

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
}

function bonk(e) {
    if (!e.isTrusted) return; // cheater!

    // Haptic feedback
    tg.HapticFeedback.impactOccurred('medium');

    score++;
    this.parentNode.classList.remove('up');
    this.parentNode.classList.add('bonked');
    setTimeout(() => {
        this.parentNode.classList.remove('bonked');
    }, 100);

    scoreBoard.textContent = score;

    createParticles(e.clientX, e.clientY);
}

function createParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
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

moles.forEach(mole => mole.addEventListener('click', bonk));
// Touch support
moles.forEach(mole => mole.addEventListener('touchstart', bonk));
