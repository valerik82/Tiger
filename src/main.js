// Hollywood Crazy Wheel - Main Game Logic
import { GameBoard } from './gameBoard.js';
import { CrazyWheel } from './crazyWheel.js';
import { MiniGames } from './miniGames.js';
import { LevelManager } from './levelManager.js';
import { AudioManager } from './audioManager.js';
import { GameState } from './gameState.js';

class HollywoodCrazyWheel {
    constructor() {
        this.state = new GameState();
        this.board = new GameBoard(this);
        this.wheel = new CrazyWheel(this);
        this.miniGames = new MiniGames(this);
        this.levelManager = new LevelManager(this);
        this.audio = new AudioManager();
        
        this.currentScreen = 'loading';
        this.isPaused = false;
        this.currentPowerUp = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadGame();
        
        // Simulate loading
        setTimeout(() => {
            this.showScreen('main-menu');
        }, 2000);
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            this.startGame('story');
        });
        
        document.getElementById('daily-btn').addEventListener('click', () => {
            this.startGame('daily');
        });
        
        document.getElementById('endless-btn').addEventListener('click', () => {
            this.startGame('endless');
        });
        
        // Game controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('spin-wheel-btn').addEventListener('click', () => {
            if (this.state.wheelCharges > 0) {
                this.wheel.spin();
                this.state.wheelCharges--;
                this.updateUI();
            }
        });
        
        // Power-ups
        document.querySelectorAll('.power-up-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const power = e.currentTarget.dataset.power;
                this.activatePowerUp(power);
            });
        });
        
        // Level complete
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.closeMovieComplete();
        });
    }
    
    loadGame() {
        // Load saved game state
        const saved = localStorage.getItem('hollywoodCrazyWheel');
        if (saved) {
            const data = JSON.parse(saved);
            this.state.tickets = data.tickets || 0;
            this.state.stars = data.stars || 0;
            this.state.currentLevel = data.currentLevel || 1;
            this.state.unlockedMovies = data.unlockedMovies || [];
            this.state.powerUps = data.powerUps || this.state.powerUps;
        }
        this.updateUI();
    }
    
    saveGame() {
        const data = {
            tickets: this.state.tickets,
            stars: this.state.stars,
            currentLevel: this.state.currentLevel,
            unlockedMovies: this.state.unlockedMovies,
            powerUps: this.state.powerUps
        };
        localStorage.setItem('hollywoodCrazyWheel', JSON.stringify(data));
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
            this.currentScreen = screenId;
        }
    }
    
    startGame(mode) {
        this.state.gameMode = mode;
        this.state.currentLevel = mode === 'endless' ? 1 : this.state.currentLevel;
        
        // Initialize level
        this.levelManager.loadLevel(this.state.currentLevel);
        
        // Setup board
        this.board.init();
        
        // Setup wheel
        this.wheel.init();
        
        // Show game screen
        this.showScreen('game-screen');
        
        // Start with auto wheel spin
        setTimeout(() => {
            this.wheel.spin();
        }, 500);
        
        this.updateUI();
    }
    
    updateUI() {
        // Update menu stats
        document.getElementById('tickets-display').textContent = this.state.tickets;
        document.getElementById('stars-display').textContent = this.state.stars;
        
        // Update game UI
        document.getElementById('level-number').textContent = this.state.currentLevel;
        document.getElementById('current-score').textContent = this.state.score;
        document.getElementById('moves-left').textContent = this.state.movesLeft;
        
        // Update objective
        const objective = this.levelManager.getCurrentObjective();
        if (objective) {
            document.querySelector('.objective-text').textContent = objective.text;
            const progress = (objective.current / objective.target) * 100;
            document.querySelector('.progress-fill').style.width = `${Math.min(progress, 100)}%`;
        }
        
        // Update power-up counts
        document.querySelectorAll('.power-up-btn').forEach(btn => {
            const power = btn.dataset.power;
            const count = this.state.powerUps[power] || 0;
            btn.querySelector('.power-count').textContent = count;
            btn.disabled = count === 0;
        });
        
        // Update wheel button
        const spinBtn = document.getElementById('spin-wheel-btn');
        spinBtn.disabled = this.state.wheelCharges === 0;
        spinBtn.textContent = this.state.wheelCharges > 0 ? 'SPIN!' : 'No Charges';
    }
    
    handleMove(tiles, isLoop) {
        if (this.isPaused || this.state.movesLeft <= 0) return false;
        
        // Apply current power-up effect if any
        if (this.currentPowerUp) {
            this.applyPowerUpEffect(tiles);
            this.currentPowerUp = null;
        }
        
        // Calculate score
        let points = tiles.length * 10;
        if (tiles.length >= 5) points *= 1.5;
        if (tiles.length >= 7) points *= 2;
        if (isLoop) points *= 3;
        
        // Apply active modifiers
        if (this.state.activeModifiers.doubleScore) {
            points *= 2;
        }
        
        this.state.score += Math.floor(points);
        this.state.movesLeft--;
        
        // Update objective progress
        this.levelManager.updateObjective('score', points);
        this.levelManager.updateObjective('tiles', tiles.length);
        if (isLoop) {
            this.levelManager.updateObjective('loops', 1);
        }
        
        // Show combo popup
        if (tiles.length >= 5) {
            this.showCombo(tiles.length);
        }
        
        // Check for level complete
        if (this.levelManager.isLevelComplete()) {
            this.completeLevel();
        } else if (this.state.movesLeft === 0) {
            this.failLevel();
        }
        
        this.updateUI();
        this.audio.playSound('combo');
        
        return true;
    }
    
    showCombo(length) {
        const combo = document.getElementById('combo-display');
        let text = 'COMBO!';
        if (length >= 7) text = 'MEGA COMBO!';
        if (length >= 10) text = 'HOLLYWOOD COMBO!';
        
        combo.textContent = text;
        combo.style.opacity = '1';
        combo.style.animation = 'none';
        
        setTimeout(() => {
            combo.style.animation = 'combo-pop 1s ease-out';
            setTimeout(() => {
                combo.style.opacity = '0';
            }, 1000);
        }, 10);
    }
    
    activatePowerUp(type) {
        if (this.state.powerUps[type] > 0) {
            this.currentPowerUp = type;
            this.state.powerUps[type]--;
            this.board.setPowerUpMode(type);
            this.updateUI();
            this.audio.playSound('click');
        }
    }
    
    applyPowerUpEffect(tiles) {
        switch(this.currentPowerUp) {
            case 'directors-cut':
                // Clear 3x3 area
                this.board.clearArea(tiles[0], 3);
                break;
            case 'clapboard':
                // Clear all of one type
                this.board.clearType(tiles[0].type);
                break;
            case 'spotlight':
                // Clear row or column
                this.board.clearLine(tiles[0]);
                break;
            case 'reshoot':
                // Undo last move
                this.board.undoMove();
                this.state.movesLeft++; // Restore the move
                break;
        }
    }
    
    applyWheelEffect(effect) {
        console.log('Wheel Effect:', effect);
        
        switch(effect.type) {
            case 'boost':
                this.applyBoost(effect.value);
                break;
            case 'challenge':
                this.applyChallenge(effect.value);
                break;
            case 'minigame':
                this.startMiniGame(effect.value);
                break;
        }
        
        this.updateUI();
    }
    
    applyBoost(boost) {
        switch(boost) {
            case 'doubleScore':
                this.state.activeModifiers.doubleScore = true;
                setTimeout(() => {
                    this.state.activeModifiers.doubleScore = false;
                }, 30000);
                this.showNotification('Double Score Active!', 'gold');
                break;
            case 'extraMoves':
                this.state.movesLeft += 5;
                this.showNotification('+5 Moves!', 'teal');
                break;
            case 'timeFreeze':
                if (this.state.timeLimit) {
                    this.state.timeFrozen = true;
                    setTimeout(() => {
                        this.state.timeFrozen = false;
                    }, 10000);
                    this.showNotification('Time Frozen!', 'blue');
                }
                break;
            case 'rainbowWild':
                this.board.addWildTiles(3);
                this.showNotification('Rainbow Wilds Added!', 'purple');
                break;
            case 'stuntDouble':
                this.state.mistakesAllowed = 1;
                this.showNotification('Stunt Double Active!', 'gold');
                break;
        }
    }
    
    applyChallenge(challenge) {
        switch(challenge) {
            case 'paparazziFog':
                this.board.applyFog(10000);
                this.showNotification('Paparazzi Fog!', 'gray');
                break;
            case 'budgetCut':
                this.state.movesLeft = Math.max(1, this.state.movesLeft - 3);
                this.showNotification('Budget Cut: -3 Moves!', 'red');
                break;
            case 'scriptRewrite':
                this.board.shuffleBoard();
                this.showNotification('Script Rewrite!', 'orange');
                break;
            case 'suddenCameo':
                this.levelManager.addBonusObjective();
                this.showNotification('New Objective Added!', 'purple');
                break;
        }
    }
    
    startMiniGame(game) {
        this.isPaused = true;
        this.miniGames.start(game, (reward) => {
            this.handleMiniGameReward(reward);
            this.isPaused = false;
        });
    }
    
    handleMiniGameReward(reward) {
        if (reward.tickets) {
            this.state.tickets += reward.tickets;
            this.showNotification(`+${reward.tickets} Tickets!`, 'gold');
        }
        if (reward.wilds) {
            this.board.addWildTiles(reward.wilds);
            this.showNotification(`+${reward.wilds} Wild Tiles!`, 'purple');
        }
        if (reward.moves) {
            this.state.movesLeft += reward.moves;
            this.showNotification(`+${reward.moves} Moves!`, 'teal');
        }
        this.updateUI();
    }
    
    showNotification(text, color = 'gold') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 40px;
            background: rgba(0, 0, 0, 0.8);
            color: ${color === 'gold' ? '#FFD700' : 
                    color === 'teal' ? '#17B5A6' : 
                    color === 'red' ? '#E0115F' : 
                    color === 'purple' ? '#8B4789' : 
                    color === 'blue' ? '#4169E1' : 
                    color === 'orange' ? '#FFA500' : 
                    '#888'};
            font-size: 1.5rem;
            font-weight: bold;
            border-radius: 20px;
            z-index: 2000;
            animation: notification-pop 2s ease-out;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    completeLevel() {
        // Calculate rewards
        const ticketsEarned = 50 + (this.state.currentLevel * 10);
        const starsEarned = this.calculateStars();
        
        this.state.tickets += ticketsEarned;
        this.state.stars += starsEarned;
        
        // Show level complete popup
        document.getElementById('tickets-earned').textContent = `+${ticketsEarned}`;
        document.getElementById('final-score').textContent = this.state.score;
        
        const starIcons = document.querySelectorAll('.stars-earned .star-icon');
        starIcons.forEach((star, index) => {
            star.style.opacity = index < starsEarned ? '1' : '0.3';
        });
        
        document.getElementById('level-complete').classList.add('active');
        
        // Check for movie complete
        if (this.state.currentLevel % 10 === 0) {
            this.completeMovie();
        }
        
        this.saveGame();
        this.audio.playSound('win');
    }
    
    calculateStars() {
        const objective = this.levelManager.getCurrentObjective();
        const completion = objective.current / objective.target;
        
        if (completion >= 1.5) return 3;
        if (completion >= 1.2) return 2;
        if (completion >= 1) return 1;
        return 0;
    }
    
    failLevel() {
        this.showNotification('Level Failed! Try Again', 'red');
        setTimeout(() => {
            this.restartLevel();
        }, 2000);
    }
    
    restartLevel() {
        this.state.score = 0;
        this.state.movesLeft = 20;
        this.state.wheelCharges = 2;
        this.board.init();
        this.levelManager.loadLevel(this.state.currentLevel);
        this.updateUI();
    }
    
    nextLevel() {
        document.getElementById('level-complete').classList.remove('active');
        this.state.currentLevel++;
        this.state.score = 0;
        this.state.movesLeft = 20;
        this.state.wheelCharges = 2;
        this.levelManager.loadLevel(this.state.currentLevel);
        this.board.init();
        this.updateUI();
        
        // Auto spin wheel at start
        setTimeout(() => {
            this.wheel.spin();
        }, 500);
    }
    
    completeMovie() {
        const movieIndex = Math.floor((this.state.currentLevel - 1) / 10);
        const movies = [
            { title: 'Action Hero', genre: 'Action', buff: '+10% Score' },
            { title: 'Love Story', genre: 'Romance', buff: '+2 Starting Moves' },
            { title: 'Space Odyssey', genre: 'Sci-Fi', buff: '+1 Wheel Charge' },
            { title: 'Comedy Gold', genre: 'Comedy', buff: '+15% Tickets' },
            { title: 'Mystery Case', genre: 'Thriller', buff: 'Extra Power-up' }
        ];
        
        const movie = movies[movieIndex % movies.length];
        this.state.unlockedMovies.push(movie);
        
        // Show movie poster
        document.querySelector('.poster-title').textContent = movie.title;
        document.querySelector('.poster-genre').textContent = movie.genre;
        document.getElementById('buff-text').textContent = movie.buff;
        
        setTimeout(() => {
            document.getElementById('movie-complete').classList.add('active');
        }, 1000);
    }
    
    closeMovieComplete() {
        document.getElementById('movie-complete').classList.remove('active');
        this.nextLevel();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showNotification('Game Paused', 'gray');
        }
    }
}

// Add notification animation to styles
const style = document.createElement('style');
style.textContent = `
    @keyframes notification-pop {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }
        20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
        }
        40% {
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -60%);
        }
    }
`;
document.head.appendChild(style);

// Start the game
window.addEventListener('DOMContentLoaded', () => {
    window.game = new HollywoodCrazyWheel();
});