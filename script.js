document.addEventListener('DOMContentLoaded', function() {

    // --- Elementos del DOM ---
    const gameContainer = document.getElementById('game-container');
    const character = document.getElementById('character');
    const powerUpMessage = document.getElementById('power-up-message');
    const scoreDisplay = document.getElementById('score');
    const moneyDisplay = document.getElementById('money-count');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    const scoreList = document.getElementById('score-list');
    const levelUpScreen = document.getElementById('level-up-screen');
    const continueButton = document.getElementById('continue-button');
    const winScreen = document.getElementById('win-screen');
    const playAgainButton = document.getElementById('play-again-button');
    const startGameButton = document.getElementById('start-game-button');
    const pauseButton = document.getElementById('pause-button');
    const pauseScreen = document.getElementById('pause-screen');
    const resumeButton = document.getElementById('resume-button');
    const jumpButton = document.getElementById('jump-button'); // Botón de salto

    // --- Configuración del Juego ---
    const gravity = 0.5;
    const jumpStrength = 12;
    const maxJumps = 2;
    const POWER_UP_DURATION = 5000;
    const BASE_SPEED_INCREASE = 0.5;
    const MONEY_FOR_POWER_UP = 5;

    // --- Variables de Estado del Juego ---
    let characterY = 0, characterVelocityY = 0;
    let score = 0, moneyCollected = 0;
    let gameSpeed = 5, jumpCount = 0;
    let isGameRunning = false;
    let isPaused = false;
    let obstacles = [], collectibles = [];
    let clickCountForExit = 0, clickTimer = null;
    let currentLevel = 1, scoreNeededForNextLevel = 900;
    let isPoweredUp = false, powerUpTimer = null;
    let moneySinceLastPowerUp = 0, totalScoreAcrossLevels = 0;

    // --- Lógica del Juego ---
    function gameLoop() {
        if (!isGameRunning) return;
        characterVelocityY -= gravity;
        characterY += characterVelocityY;
        if (characterY < 0) { characterY = 0; characterVelocityY = 0; jumpCount = 0; }
        character.style.bottom = `${characterY}px`;
        if (characterY > 0 && !character.classList.contains('jumping')) { character.classList.remove('running'); character.classList.add('jumping'); } 
        else if (characterY === 0 && !character.classList.contains('running') && !character.classList.contains('hit')) { character.classList.remove('jumping'); character.classList.add('running'); }
        moveGameElements(obstacles);
        moveGameElements(collectibles);
        checkCollisions();
        requestAnimationFrame(gameLoop);
    }

    function moveGameElements(elements) {
        const gameWidth = gameContainer.offsetWidth;
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            let currentRight = parseFloat(element.style.right);
            currentRight += gameSpeed;
            element.style.right = `${currentRight}px`;
            if (currentRight > gameWidth) { element.remove(); elements.splice(i, 1); }
        }
    }

    function createItem(type) {
        if (!isGameRunning) return;

        const item = document.createElement('div');
        item.classList.add(type);

        let itemHeight, initialRight, itemWidth;
        if (type === 'obstacle') {
            itemHeight = 60; initialRight = '-80px'; itemWidth = 75;
        } else if (type === 'collectible') {
            itemHeight = 60; initialRight = '-70px'; itemWidth = 60;
        }
        
        item.style.right = initialRight;

        const lane = Math.floor(Math.random() * 3);
        const gameHeight = gameContainer.offsetHeight;
        let potentialBottom;
        switch (lane) {
            case 0: potentialBottom = '10px'; break;
            case 1: potentialBottom = `${(gameHeight / 2) - (itemHeight / 2)}px`; break;
            case 2: potentialBottom = `${gameHeight - itemHeight - 10}px`; break;
        }
        
        const allItems = [...obstacles, ...collectibles];
        const unsafeDistance = itemWidth * 1.5;

        for (let existingItem of allItems) {
            if (parseFloat(existingItem.style.right) < unsafeDistance) {
                if (existingItem.style.bottom === potentialBottom) {
                    return;
                }
            }
        }

        item.style.bottom = potentialBottom;
        
        gameContainer.appendChild(item);
        if (type === 'obstacle') obstacles.push(item);
        else if (type === 'collectible') collectibles.push(item);
    }

    function checkCollisions() {
        const charRect = character.getBoundingClientRect();

        for (let i = obstacles.length - 1; i >= 0; i--) {
            if (isColliding(charRect, obstacles[i].getBoundingClientRect())) {
                if (isPoweredUp) {
                    destroyObstacle(obstacles[i], i);
                } else {
                    character.classList.add('hit');
                    endGame();
                    return;
                }
            }
        }

        for (let i = collectibles.length - 1; i >= 0; i--) {
            if (isColliding(charRect, collectibles[i].getBoundingClientRect())) {
                score += 50;
                moneyCollected++;
                moneySinceLastPowerUp++;
                scoreDisplay.textContent = score;
                moneyDisplay.textContent = moneyCollected;
                
                if (moneySinceLastPowerUp >= MONEY_FOR_POWER_UP) {
                    activatePowerUp();
                    moneySinceLastPowerUp = 0;
                }

                collectibles[i].remove();
                collectibles.splice(i, 1);
            }
        }
    }

    function destroyObstacle(obstacle, index) {
        obstacle.classList.add('broken');
        obstacles.splice(index, 1);
        setTimeout(() => { if(obstacle) obstacle.remove(); }, 500);
    }

    function isColliding(rect1, rect2) { return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom); }

    function activatePowerUp() {
        isPoweredUp = true;
        character.classList.add('giant');
        powerUpMessage.classList.remove('hidden');
        clearTimeout(powerUpTimer);
        powerUpTimer = setTimeout(deactivatePowerUp, POWER_UP_DURATION);
    }

    function deactivatePowerUp() {
        isPoweredUp = false;
        character.classList.remove('giant');
        powerUpMessage.classList.add('hidden');
    }

    function togglePause() {
        if (!isGameRunning && !isPaused) return;

        isPaused = !isPaused;

        if (isPaused) {
            isGameRunning = false;
            jumpButton.style.display = 'none'; // Oculta el botón de salto
            if (window.gameIntervals) window.gameIntervals.forEach(clearInterval);
            pauseScreen.style.display = 'flex';
        } else {
            isGameRunning = true;
            jumpButton.style.display = 'flex'; // Muestra el botón de salto
            pauseScreen.style.display = 'none';
            resumeGameIntervals();
            requestAnimationFrame(gameLoop);
        }
    }

    function updateScore() {
        if (!isGameRunning) return;
        score++;
        scoreDisplay.textContent = score;
        if (score >= scoreNeededForNextLevel) {
            currentLevel >= 4 ? winGame() : levelUp();
        }
    }

    function levelUp() {
        isGameRunning = false;
        jumpButton.style.display = 'none'; // Oculta el botón de salto
        if (window.gameIntervals) window.gameIntervals.forEach(clearInterval);
        if (isPoweredUp) deactivatePowerUp();
        
        moneySinceLastPowerUp = 0; 
        
        totalScoreAcrossLevels += score;
        currentLevel++;
        scoreNeededForNextLevel = 900 * currentLevel;
        score = 0;
        scoreDisplay.textContent = score;
        document.getElementById('level-up-title').textContent = 'Le ganaste a la justicia';
        document.getElementById('level-up-message').textContent = `¡Vamos por el Nivel ${currentLevel}!`;
        levelUpScreen.style.display = 'flex';
    }

    function continueGame() {
        levelUpScreen.style.display =
