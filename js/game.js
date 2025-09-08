// Hollywood Crazy Wheel - Main Game Engine

class Game {
    constructor() {
        // Game state
        this.state = 'loading'; // loading, menu, playing, paused, complete, minigame
        this.currentLevel = null;
        this.objective = null;
        this.score = 0;
        this.movesLeft = 0;
        this.timeLeft = 0;
        this.wheelSpinsLeft = 0;
        this.propsCleared = 0;
        this.mistakes = 0;
        this.lastMove = null;
        
        // Game components
        this.board = null;
        this.wheel = null;
        this.economy = economyManager;
        this.powerups = powerupManager;
        this.levels = levelManager;
        this.minigames = minigameManager;
        
        // Active effects
        this.activeEffects = {
            doubleScore: { active: false, timeLeft: 0 },
            timeFreeze: { active: false, timeLeft: 0 },
            paparazziFog: { active: false, timeLeft: 0, hiddenTiles: [] }
        };
        
        // UI elements
        this.screens = {};
        this.floatingTexts = [];
        this.notifications = [];
        
        // Animation loop
        this.lastTime = 0;
        this.animationId = null;
        
        this.initializeGame();
    }

    initializeGame() {
        this.setupScreens();
        this.setupEventListeners();
        this.loadGameData();
        this.startAnimationLoop();
        
        // Show loading screen initially
        setTimeout(() => {
            this.setState('menu');
        }, 2000);
    }

    setupScreens() {
        this.screens = {
            loading: document.getElementById('loading-screen'),
            menu: document.getElementById('main-menu'),
            game: document.getElementById('game-screen'),
            minigame: document.getElementById('minigame-screen'),
            levelComplete: document.getElementById('level-complete'),
            collection: document.getElementById('collection-screen'),
            pauseMenu: document.getElementById('pause-menu'),
            wheelResult: document.getElementById('wheel-result')
        };
    }

    setupEventListeners() {
        // Menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            this.startLevel(this.levels.currentLevel);
        });
        
        document.getElementById('daily-btn').addEventListener('click', () => {
            this.startDailyChallenge();
        });
        
        document.getElementById('endless-btn').addEventListener('click', () => {
            this.startEndlessMode();
        });
        
        document.getElementById('collection-btn').addEventListener('click', () => {
            this.showCollection();
        });
        
        // Game controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('spin-wheel-btn').addEventListener('click', () => {
            this.spinWheel();
        });
        
        // Pause menu
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // Level complete
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('replay-level-btn').addEventListener('click', () => {
            this.restartLevel();
        });
        
        document.getElementById('main-menu-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // Collection screen
        document.getElementById('collection-back-btn').addEventListener('click', () => {
            this.setState('menu');
        });
        
        // Wheel result
        document.getElementById('wheel-result-ok').addEventListener('click', () => {
            this.hideWheelResult();
        });
    }

    loadGameData() {
        this.levels.loadProgress();
        this.economy.loadCurrencies();
        this.powerups.loadPowerups();
        
        // Set first play time if not set
        if (!Utils.loadFromLocalStorage('first_play_time')) {
            Utils.saveToLocalStorage('first_play_time', Date.now());
        }
    }

    setState(newState) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        if (this.screens[newState]) {
            this.screens[newState].classList.add('active');
        }
        
        this.state = newState;
        
        // State-specific logic
        switch (newState) {
            case 'menu':
                this.updateMenuUI();
                break;
            case 'playing':
                this.updateGameUI();
                break;
            case 'collection':
                this.updateCollectionUI();
                break;
        }
    }

    startLevel(levelId) {
        const level = this.levels.getLevel(levelId);
        if (!level || !this.levels.isLevelUnlocked(levelId)) {
            this.showNotification('Level not available!', 'error');
            return;
        }
        
        this.currentLevel = level;
        this.levels.currentLevel = levelId;
        this.levels.saveProgress();
        
        this.initializeLevel();
        this.setState('playing');
        
        audioManager.playSound('button_click');
    }

    initializeLevel() {
        const level = this.currentLevel;
        
        // Reset game state
        this.score = 0;
        this.movesLeft = level.moves || 999;
        this.timeLeft = level.timeLimit ? level.timeLimit * 1000 : 0;
        this.wheelSpinsLeft = level.wheelSpins || 1;
        this.propsCleared = 0;
        this.mistakes = 0;
        this.lastMove = null;
        
        // Create objective
        this.objective = new LevelObjective(level.objective);
        
        // Initialize board
        const boardCanvas = document.getElementById('game-board');
        this.board = new GameBoard(boardCanvas);
        
        // Add special tiles
        if (level.specialTiles) {
            this.addSpecialTiles(level.specialTiles);
        }
        
        // Initialize wheel
        const wheelCanvas = document.getElementById('crazy-wheel');
        this.wheel = new CrazyWheel(wheelCanvas);
        
        // Reset active effects
        this.resetActiveEffects();
        
        // Update UI
        this.updateGameUI();
        
        // Auto-spin wheel at start
        setTimeout(() => {
            if (this.wheelSpinsLeft > 0) {
                this.spinWheel();
            }
        }, 1000);
    }

    addSpecialTiles(specialTiles) {
        specialTiles.forEach(special => {
            if (special.positions) {
                // Specific positions
                special.positions.forEach(([col, row]) => {
                    if (this.board.tiles[row] && this.board.tiles[row][col]) {
                        const tile = this.board.tiles[row][col];
                        tile.type = special.type;
                        tile.isWild = special.type.id === TILE_TYPES.WILD.id;
                        tile.isProp = special.type.id === TILE_TYPES.PROP.id;
                    }
                });
            } else if (special.count) {
                // Random positions
                this.addRandomSpecialTiles(special.type, special.count);
            }
        });
    }

    addRandomSpecialTiles(tileType, count) {
        const availablePositions = [];
        
        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                availablePositions.push({ row, col });
            }
        }
        
        const positions = Utils.shuffle(availablePositions).slice(0, count);
        positions.forEach(pos => {
            const tile = this.board.tiles[pos.row][pos.col];
            tile.type = tileType;
            tile.isWild = tileType.id === TILE_TYPES.WILD.id;
            tile.isProp = tileType.id === TILE_TYPES.PROP.id;
        });
    }

    spinWheel() {
        if (this.wheelSpinsLeft <= 0 || !this.wheel || !this.wheel.canSpin()) {
            return;
        }
        
        this.wheelSpinsLeft--;
        this.updateGameUI();
        
        this.wheel.spin((selectedSector) => {
            this.handleWheelResult(selectedSector);
        });
        
        // Update spin button
        const spinButton = document.getElementById('spin-wheel-btn');
        spinButton.disabled = this.wheelSpinsLeft <= 0;
    }

    handleWheelResult(sector) {
        const result = this.wheel.applyWheelEffect(sector);
        
        // Show result popup
        this.showWheelResult(sector.name, result.message);
        
        // Apply effect if successful
        if (result.success) {
            this.applyWheelEffect(sector);
        }
    }

    applyWheelEffect(sector) {
        switch (sector.id) {
            case 'double_score':
                this.activateDoubleScore(30000);
                break;
            case 'time_freeze':
                this.freezeTimer(10000);
                break;
            case 'paparazzi_fog':
                this.activatePaparazziFog(10000);
                break;
            case 'red_carpet':
            case 'casting_call':
                this.startMinigame(sector.id.replace('_', ''));
                break;
        }
    }

    showWheelResult(title, description) {
        document.getElementById('wheel-result-title').textContent = title;
        document.getElementById('wheel-result-description').textContent = description;
        this.screens.wheelResult.classList.add('active');
    }

    hideWheelResult() {
        this.screens.wheelResult.classList.remove('active');
    }

    // Game event handlers
    onChainComplete(chainLength, score, isClosedLoop) {
        // Apply score multiplier
        let finalScore = score;
        if (this.activeEffects.doubleScore.active) {
            finalScore *= 2;
        }
        
        // Add seasonal multipliers
        const seasonalMultiplier = this.economy.getSeasonalMultipliers();
        if (seasonalMultiplier.tickets > 1) {
            finalScore = Math.floor(finalScore * seasonalMultiplier.tickets);
        }
        
        this.addScore(finalScore);
        
        // Reward tickets for chain
        const ticketReward = this.economy.rewardChainCompletion(chainLength, finalScore);
        
        // Special effects for closed loops
        if (isClosedLoop) {
            this.showFloatingText("DIRECTOR'S CUT!", 
                this.board.canvas.width / 2, 
                this.board.canvas.height / 2, 
                COLORS.GOLD
            );
            this.addScore(chainLength * 50);
        }
        
        // Deduct move if not in timed mode
        if (this.currentLevel && this.currentLevel.moves) {
            this.movesLeft--;
            this.lastMove = { type: 'chain', chainLength, score: finalScore };
        }
        
        this.updateGameUI();
        this.checkLevelCompletion();
        
        // Mid-level wheel spin chance
        if (chainLength >= 6 && this.wheelSpinsLeft <= 0 && Utils.random(0, 1) < 0.3) {
            this.wheelSpinsLeft++;
            this.showFloatingText('Bonus Spin!', 
                this.board.canvas.width / 2, 
                100, 
                COLORS.GOLD
            );
        }
    }

    addScore(points) {
        this.score += points;
        audioManager.playSound('score_increment');
        
        // Show floating score
        if (this.board) {
            this.showFloatingText(`+${points}`, 
                this.board.canvas.width / 2, 
                50, 
                COLORS.GOLD
            );
        }
    }

    addMoves(count) {
        if (this.currentLevel && this.currentLevel.moves) {
            this.movesLeft += count;
            this.updateGameUI();
            this.showFloatingText(`+${count} Moves!`, 
                this.board.canvas.width / 2, 
                100, 
                COLORS.TEAL
            );
        }
    }

    addTime(milliseconds) {
        if (this.currentLevel && this.currentLevel.timeLimit) {
            this.timeLeft += milliseconds;
            this.updateGameUI();
            this.showFloatingText(`+${Math.floor(milliseconds/1000)}s!`, 
                this.board.canvas.width / 2, 
                100, 
                COLORS.PURPLE
            );
        }
    }

    addWheelSpin() {
        this.wheelSpinsLeft++;
        const spinButton = document.getElementById('spin-wheel-btn');
        spinButton.disabled = false;
        this.updateGameUI();
        this.showFloatingText('Extra Spin!', 
            this.board.canvas.width / 2, 
            100, 
            COLORS.GOLD
        );
    }

    undoLastMove() {
        if (!this.lastMove) return false;
        
        // Restore previous state (simplified implementation)
        this.movesLeft++;
        this.score = Math.max(0, this.score - this.lastMove.score);
        this.lastMove = null;
        
        this.updateGameUI();
        return true;
    }

    // Active effects
    activateDoubleScore(duration) {
        this.activeEffects.doubleScore = {
            active: true,
            timeLeft: duration
        };
    }

    freezeTimer(duration) {
        this.activeEffects.timeFreeze = {
            active: true,
            timeLeft: duration
        };
    }

    activatePaparazziFog(duration) {
        // Hide random tiles
        const hiddenTiles = [];
        const tileCount = Math.floor(this.board.rows * this.board.cols * 0.3);
        
        for (let i = 0; i < tileCount; i++) {
            const row = Utils.randomInt(0, this.board.rows - 1);
            const col = Utils.randomInt(0, this.board.cols - 1);
            const tile = this.board.tiles[row][col];
            
            if (tile && !hiddenTiles.includes(tile)) {
                hiddenTiles.push(tile);
                tile.alpha = 0.2; // Make tile nearly invisible
            }
        }
        
        this.activeEffects.paparazziFog = {
            active: true,
            timeLeft: duration,
            hiddenTiles
        };
    }

    updateActiveEffects(deltaTime) {
        // Double score effect
        if (this.activeEffects.doubleScore.active) {
            this.activeEffects.doubleScore.timeLeft -= deltaTime;
            if (this.activeEffects.doubleScore.timeLeft <= 0) {
                this.activeEffects.doubleScore.active = false;
            }
        }
        
        // Time freeze effect
        if (this.activeEffects.timeFreeze.active) {
            this.activeEffects.timeFreeze.timeLeft -= deltaTime;
            if (this.activeEffects.timeFreeze.timeLeft <= 0) {
                this.activeEffects.timeFreeze.active = false;
            }
        }
        
        // Paparazzi fog effect
        if (this.activeEffects.paparazziFog.active) {
            this.activeEffects.paparazziFog.timeLeft -= deltaTime;
            if (this.activeEffects.paparazziFog.timeLeft <= 0) {
                this.activeEffects.paparazziFog.active = false;
                // Restore tile visibility
                this.activeEffects.paparazziFog.hiddenTiles.forEach(tile => {
                    tile.alpha = 1;
                });
                this.activeEffects.paparazziFog.hiddenTiles = [];
            }
        }
    }

    resetActiveEffects() {
        this.activeEffects = {
            doubleScore: { active: false, timeLeft: 0 },
            timeFreeze: { active: false, timeLeft: 0 },
            paparazziFog: { active: false, timeLeft: 0, hiddenTiles: [] }
        };
    }

    // Mini-games
    startMinigame(type) {
        this.minigames.startMinigame(type, (score, rewards) => {
            this.onMinigameComplete(score, rewards);
        });
    }

    onMinigameComplete(score, rewards) {
        // Award rewards
        this.economy.addCurrency('tickets', rewards.tickets);
        if (rewards.stars > 0) {
            this.economy.addCurrency('stars', rewards.stars);
        }
        
        this.showNotification(`Minigame Complete! +${rewards.tickets} tickets`, 'success');
    }

    // Level completion
    checkLevelCompletion() {
        if (!this.objective || !this.currentLevel) return;
        
        // Update objective
        const gameState = {
            score: this.score,
            movesLeft: this.movesLeft,
            timeLeft: this.timeLeft,
            propsCleared: this.propsCleared,
            mistakes: this.mistakes
        };
        
        this.objective.update(gameState);
        
        // Check win condition
        if (this.objective.completed) {
            this.completeLevel();
            return;
        }
        
        // Check lose conditions
        if (this.objective.failed || 
            (this.currentLevel.moves && this.movesLeft <= 0) ||
            (this.currentLevel.timeLimit && this.timeLeft <= 0)) {
            this.failLevel();
        }
    }

    completeLevel() {
        const stars = this.calculateStars();
        
        // Save progress
        this.levels.completeLevel(this.currentLevel.id, this.score, stars);
        
        // Award rewards
        const rewards = this.economy.rewardLevelCompletion(this.currentLevel.id, stars, this.score);
        
        // Award powerup rewards
        if (this.currentLevel.rewards.powerups) {
            this.currentLevel.rewards.powerups.forEach(powerupId => {
                this.powerups.addPowerup(powerupId, 1);
            });
        }
        
        // Show completion screen
        this.showLevelComplete(stars, rewards);
        
        audioManager.playSound('level_complete');
        Utils.vibrate([200, 100, 200, 100, 200]);
    }

    failLevel() {
        this.showNotification('Level Failed! Try again?', 'error');
        
        // Offer to continue with ad or purchase
        setTimeout(() => {
            this.showContinueOptions();
        }, 2000);
    }

    calculateStars() {
        if (!this.objective || !this.currentLevel) return 0;
        
        const progress = this.objective.getProgress();
        const efficiency = this.calculateEfficiency();
        
        let stars = 0;
        
        if (progress >= 1) stars = 1; // Completed objective
        if (progress >= 1 && efficiency >= 0.8) stars = 2; // Good efficiency
        if (progress >= 1 && efficiency >= 0.9 && this.mistakes === 0) stars = 3; // Perfect
        
        return stars;
    }

    calculateEfficiency() {
        if (!this.currentLevel) return 0;
        
        let efficiency = 1;
        
        // Factor in remaining moves/time
        if (this.currentLevel.moves) {
            efficiency *= this.movesLeft / this.currentLevel.moves;
        }
        
        if (this.currentLevel.timeLimit) {
            efficiency *= this.timeLeft / (this.currentLevel.timeLimit * 1000);
        }
        
        return Math.min(1, efficiency);
    }

    showLevelComplete(stars, rewards) {
        // Update UI
        const starsContainer = document.querySelector('.stars-earned');
        const starElements = starsContainer.querySelectorAll('.star');
        
        starElements.forEach((star, index) => {
            if (index < stars) {
                star.style.opacity = '1';
                star.style.animation = `starPulse 1s ease-in-out infinite alternate ${index * 0.2}s`;
            } else {
                star.style.opacity = '0.3';
            }
        });
        
        document.getElementById('tickets-earned').textContent = `+${rewards.tickets}`;
        
        this.setState('levelComplete');
    }

    showContinueOptions() {
        // Show options to continue (watch ad, purchase, etc.)
        // This would integrate with ad SDK in production
    }

    nextLevel() {
        const nextLevelId = this.currentLevel.id + 1;
        if (this.levels.isLevelUnlocked(nextLevelId)) {
            this.startLevel(nextLevelId);
        } else {
            this.quitToMenu();
        }
    }

    restartLevel() {
        if (this.currentLevel) {
            this.startLevel(this.currentLevel.id);
        }
    }

    quitToMenu() {
        this.setState('menu');
        
        // Cleanup
        if (this.board) {
            this.board = null;
        }
        if (this.wheel) {
            this.wheel = null;
        }
    }

    // Game modes
    startDailyChallenge() {
        const dailyChallenge = this.levels.generateDailyChallenge();
        this.currentLevel = dailyChallenge;
        this.initializeLevel();
        this.setState('playing');
    }

    startEndlessMode() {
        // Create endless level
        this.currentLevel = {
            id: 'endless',
            name: 'After Party',
            objective: { type: 'score', target: 999999, description: 'Score as high as possible!' },
            moves: null,
            timeLimit: null,
            wheelSpins: 999,
            difficulty: 'endless'
        };
        
        this.initializeLevel();
        this.setState('playing');
    }

    // UI Updates
    updateMenuUI() {
        this.economy.updateCurrencyDisplay();
        
        // Update play button with current level
        const playButton = document.getElementById('play-btn');
        playButton.textContent = `LEVEL ${this.levels.currentLevel}`;
    }

    updateGameUI() {
        if (!this.currentLevel) return;
        
        // Level info
        document.getElementById('level-number').textContent = `Level ${this.currentLevel.id}`;
        document.getElementById('level-objective').textContent = 
            this.objective ? this.objective.getCurrentDescription() : '';
        
        // Game stats
        document.getElementById('current-score').textContent = Utils.formatNumber(this.score);
        
        if (this.currentLevel.moves) {
            document.getElementById('moves-left').textContent = this.movesLeft;
            document.getElementById('timer-stat').style.display = 'none';
        } else if (this.currentLevel.timeLimit) {
            document.getElementById('time-left').textContent = Math.ceil(this.timeLeft / 1000);
            document.getElementById('timer-stat').style.display = 'block';
        }
        
        // Wheel spin button
        const spinButton = document.getElementById('spin-wheel-btn');
        spinButton.disabled = this.wheelSpinsLeft <= 0 || (this.wheel && !this.wheel.canSpin());
        
        // Currency
        this.economy.updateCurrencyDisplay();
    }

    updateCollectionUI() {
        const moviesGrid = document.getElementById('movies-grid');
        moviesGrid.innerHTML = '';
        
        const movieNames = this.levels.getMovieNames();
        
        movieNames.forEach(movieName => {
            const progress = this.levels.getMovieProgress(movieName);
            const movieCard = document.createElement('div');
            movieCard.className = `movie-card ${progress.percentage === 100 ? 'completed' : ''}`;
            
            movieCard.innerHTML = `
                <div class="movie-poster">🎬</div>
                <div class="movie-title">${movieName}</div>
                <div class="movie-progress">${progress.completed}/${progress.total} levels</div>
            `;
            
            moviesGrid.appendChild(movieCard);
        });
    }

    showCollection() {
        this.setState('collection');
    }

    // Game controls
    pauseGame() {
        if (this.state === 'playing') {
            this.screens.pauseMenu.classList.add('active');
        }
    }

    resumeGame() {
        this.screens.pauseMenu.classList.remove('active');
    }

    // Floating text system
    showFloatingText(text, x, y, color) {
        const floatingText = {
            text,
            x,
            y,
            color,
            life: 2000,
            maxLife: 2000,
            vx: Utils.random(-20, 20),
            vy: -50
        };
        
        this.floatingTexts.push(floatingText);
    }

    updateFloatingTexts(deltaTime) {
        this.floatingTexts = this.floatingTexts.filter(text => {
            text.x += text.vx * deltaTime * 0.001;
            text.y += text.vy * deltaTime * 0.001;
            text.life -= deltaTime;
            
            return text.life > 0;
        });
    }

    renderFloatingTexts(ctx) {
        this.floatingTexts.forEach(text => {
            ctx.save();
            ctx.globalAlpha = text.life / text.maxLife;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = text.color;
            ctx.strokeStyle = COLORS.BLACK;
            ctx.lineWidth = 2;
            ctx.strokeText(text.text, text.x, text.y);
            ctx.fillText(text.text, text.x, text.y);
            ctx.restore();
        });
    }

    // Notification system
    showNotification(message, type = 'info', duration = 3000) {
        const notification = {
            message,
            type,
            life: duration,
            maxLife: duration
        };
        
        this.notifications.push(notification);
        
        // Remove after duration
        setTimeout(() => {
            const index = this.notifications.indexOf(notification);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, duration);
    }

    // Animation loop
    startAnimationLoop() {
        const animate = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    update(deltaTime) {
        // Update game timer
        if (this.state === 'playing' && this.currentLevel && this.currentLevel.timeLimit) {
            if (!this.activeEffects.timeFreeze.active) {
                this.timeLeft -= deltaTime;
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.checkLevelCompletion();
                }
            }
        }
        
        // Update components
        if (this.board) {
            this.board.update(deltaTime);
        }
        
        if (this.wheel) {
            this.wheel.update(deltaTime);
        }
        
        if (this.minigames.isActive) {
            this.minigames.update(deltaTime);
        }
        
        // Update effects
        this.updateActiveEffects(deltaTime);
        
        // Update UI elements
        this.updateFloatingTexts(deltaTime);
        
        // Update game UI if playing
        if (this.state === 'playing') {
            this.updateGameUI();
        }
    }

    render() {
        // Render game components
        if (this.state === 'playing') {
            if (this.board) {
                this.board.render();
                
                // Render floating texts on board canvas
                this.renderFloatingTexts(this.board.ctx);
            }
            
            if (this.wheel) {
                this.wheel.render();
            }
        }
        
        if (this.minigames.isActive) {
            this.minigames.render();
        }
    }

    // Boss level phases
    startBossPhase2() {
        // Add special prop tiles for phase 2
        this.addRandomSpecialTiles(TILE_TYPES.PROP, 10);
        
        this.showFloatingText('PHASE 2!', 
            this.board.canvas.width / 2, 
            this.board.canvas.height / 2, 
            COLORS.RUBY
        );
        
        audioManager.playSound('powerup_activate');
    }

    // Cleanup
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Resume audio context on first user interaction
    document.addEventListener('click', () => {
        audioManager.resumeAudioContext();
    }, { once: true });
    
    // Create global game instance
    window.game = new Game();
});