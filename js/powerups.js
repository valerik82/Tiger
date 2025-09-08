// Hollywood Crazy Wheel - Power-ups System

class PowerupManager {
    constructor() {
        this.powerups = {
            'directors-cut': { count: 2, name: "Director's Cut", icon: '🎬' },
            'clapboard-smash': { count: 2, name: 'Clapboard Smash', icon: '🎬' },
            'spotlight-beam': { count: 1, name: 'Spotlight Beam', icon: '💡' },
            're-shoot': { count: 1, name: 'Re-Shoot', icon: '🔄' }
        };
        
        this.activePowerup = null;
        this.powerupButtons = {};
        
        this.setupPowerupButtons();
        this.updatePowerupDisplay();
    }

    setupPowerupButtons() {
        const powerupBar = document.getElementById('powerups-bar');
        const buttons = powerupBar.querySelectorAll('.powerup-btn');
        
        buttons.forEach(button => {
            const powerupId = button.getAttribute('data-powerup');
            this.powerupButtons[powerupId] = button;
            
            button.addEventListener('click', () => {
                this.activatePowerup(powerupId);
            });
        });
    }

    updatePowerupDisplay() {
        for (const [powerupId, powerup] of Object.entries(this.powerups)) {
            const button = this.powerupButtons[powerupId];
            if (button) {
                const countSpan = button.querySelector('.powerup-count');
                if (countSpan) {
                    countSpan.textContent = powerup.count;
                }
                
                // Enable/disable button based on count
                button.disabled = powerup.count <= 0;
                button.classList.toggle('disabled', powerup.count <= 0);
            }
        }
    }

    activatePowerup(powerupId) {
        const powerup = this.powerups[powerupId];
        if (!powerup || powerup.count <= 0) return false;
        
        if (this.activePowerup) {
            // Cancel previous powerup
            this.cancelActivePowerup();
        }
        
        this.activePowerup = powerupId;
        this.highlightActivePowerup(powerupId);
        
        switch (powerupId) {
            case 'directors-cut':
                this.activateDirectorsCut();
                break;
            case 'clapboard-smash':
                this.activateClapboardSmash();
                break;
            case 'spotlight-beam':
                this.activateSpotlightBeam();
                break;
            case 're-shoot':
                this.activateReShoot();
                break;
        }
        
        audioManager.playSound('powerup_activate');
        Utils.vibrate([100, 50, 100]);
        
        return true;
    }

    highlightActivePowerup(powerupId) {
        // Remove highlight from all buttons
        Object.values(this.powerupButtons).forEach(button => {
            button.classList.remove('active');
        });
        
        // Highlight active button
        if (this.powerupButtons[powerupId]) {
            this.powerupButtons[powerupId].classList.add('active');
        }
        
        // Add cursor style to game board
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.style.cursor = 'crosshair';
        }
    }

    cancelActivePowerup() {
        if (!this.activePowerup) return;
        
        // Remove highlight from all buttons
        Object.values(this.powerupButtons).forEach(button => {
            button.classList.remove('active');
        });
        
        // Reset cursor
        const gameBoard = document.getElementById('game-board');
        if (gameBoard) {
            gameBoard.style.cursor = 'default';
        }
        
        this.activePowerup = null;
    }

    consumePowerup(powerupId) {
        const powerup = this.powerups[powerupId];
        if (powerup && powerup.count > 0) {
            powerup.count--;
            this.updatePowerupDisplay();
            this.cancelActivePowerup();
            
            // Save to localStorage
            this.savePowerups();
        }
    }

    activateDirectorsCut() {
        if (!window.game || !window.game.board) return;
        
        // Wait for player to click on board
        const board = window.game.board;
        const originalHandler = board.handleTouchStart || board.handleMouseDown;
        
        const powerupHandler = (event) => {
            event.preventDefault();
            
            let pos;
            if (event.type === 'touchstart') {
                const touch = event.touches[0];
                pos = Utils.getCanvasPosition(board.canvas, touch.clientX, touch.clientY);
            } else {
                pos = Utils.getCanvasPosition(board.canvas, event.clientX, event.clientY);
            }
            
            const tile = board.getTileAt(pos.x, pos.y);
            if (tile) {
                const clearedTiles = board.executeDirectorsCutPowerup(tile.col, tile.row);
                const score = clearedTiles * 50;
                
                if (window.game) {
                    window.game.addScore(score);
                    window.game.showFloatingText(`+${score}`, pos.x, pos.y, COLORS.GOLD);
                }
                
                this.consumePowerup('directors-cut');
                
                // Restore original handlers
                this.restoreBoardHandlers(board, originalHandler);
            }
        };
        
        // Replace handlers temporarily
        if (Utils.isTouchDevice()) {
            board.canvas.removeEventListener('touchstart', board.handleTouchStart);
            board.canvas.addEventListener('touchstart', powerupHandler, { passive: false });
        } else {
            board.canvas.removeEventListener('mousedown', board.handleMouseDown);
            board.canvas.addEventListener('mousedown', powerupHandler);
        }
    }

    activateClapboardSmash() {
        if (!window.game || !window.game.board) return;
        
        // Wait for player to click on a tile to select type
        const board = window.game.board;
        
        const powerupHandler = (event) => {
            event.preventDefault();
            
            let pos;
            if (event.type === 'touchstart') {
                const touch = event.touches[0];
                pos = Utils.getCanvasPosition(board.canvas, touch.clientX, touch.clientY);
            } else {
                pos = Utils.getCanvasPosition(board.canvas, event.clientX, event.clientY);
            }
            
            const tile = board.getTileAt(pos.x, pos.y);
            if (tile && !tile.isProp) {
                const clearedTiles = board.executeClapboardSmash(tile.type.id);
                const score = clearedTiles * 30;
                
                if (window.game) {
                    window.game.addScore(score);
                    window.game.showFloatingText(`+${score}`, pos.x, pos.y, tile.type.color);
                }
                
                this.consumePowerup('clapboard-smash');
                this.restoreBoardHandlers(board);
            }
        };
        
        // Replace handlers temporarily
        if (Utils.isTouchDevice()) {
            board.canvas.removeEventListener('touchstart', board.handleTouchStart);
            board.canvas.addEventListener('touchstart', powerupHandler, { passive: false });
        } else {
            board.canvas.removeEventListener('mousedown', board.handleMouseDown);
            board.canvas.addEventListener('mousedown', powerupHandler);
        }
    }

    activateSpotlightBeam() {
        if (!window.game || !window.game.board) return;
        
        // Wait for player to click to choose row/column
        const board = window.game.board;
        
        const powerupHandler = (event) => {
            event.preventDefault();
            
            let pos;
            if (event.type === 'touchstart') {
                const touch = event.touches[0];
                pos = Utils.getCanvasPosition(board.canvas, touch.clientX, touch.clientY);
            } else {
                pos = Utils.getCanvasPosition(board.canvas, event.clientX, event.clientY);
            }
            
            const tile = board.getTileAt(pos.x, pos.y);
            if (tile) {
                // Determine if horizontal or vertical based on click position relative to tile center
                const tileCenterX = tile.x + board.tileSize / 2;
                const tileCenterY = tile.y + board.tileSize / 2;
                const dx = Math.abs(pos.x - tileCenterX);
                const dy = Math.abs(pos.y - tileCenterY);
                const isHorizontal = dx < dy;
                
                const clearedTiles = board.executeSpotlightBeam(tile.col, tile.row, isHorizontal);
                const score = clearedTiles * 40;
                
                if (window.game) {
                    window.game.addScore(score);
                    window.game.showFloatingText(`+${score}`, pos.x, pos.y, COLORS.WHITE);
                }
                
                this.consumePowerup('spotlight-beam');
                this.restoreBoardHandlers(board);
            }
        };
        
        // Replace handlers temporarily
        if (Utils.isTouchDevice()) {
            board.canvas.removeEventListener('touchstart', board.handleTouchStart);
            board.canvas.addEventListener('touchstart', powerupHandler, { passive: false });
        } else {
            board.canvas.removeEventListener('mousedown', board.handleMouseDown);
            board.canvas.addEventListener('mousedown', powerupHandler);
        }
    }

    activateReShoot() {
        if (!window.game) return;
        
        // Immediately undo the last move
        const success = window.game.undoLastMove();
        
        if (success) {
            this.consumePowerup('re-shoot');
            
            if (window.game.board) {
                window.game.showFloatingText('Move Undone!', 
                    window.game.board.canvas.width / 2, 
                    window.game.board.canvas.height / 2, 
                    COLORS.TEAL
                );
            }
        } else {
            // No move to undo, don't consume powerup
            this.cancelActivePowerup();
        }
    }

    restoreBoardHandlers(board) {
        // Restore original event handlers
        if (Utils.isTouchDevice()) {
            board.canvas.removeEventListener('touchstart', arguments.callee);
            board.canvas.addEventListener('touchstart', board.handleTouchStart.bind(board), { passive: false });
        } else {
            board.canvas.removeEventListener('mousedown', arguments.callee);
            board.canvas.addEventListener('mousedown', board.handleMouseDown.bind(board));
        }
    }

    addPowerup(powerupId, count = 1) {
        if (this.powerups[powerupId]) {
            this.powerups[powerupId].count += count;
            this.updatePowerupDisplay();
            this.savePowerups();
        }
    }

    getPowerupCount(powerupId) {
        return this.powerups[powerupId] ? this.powerups[powerupId].count : 0;
    }

    hasPowerup(powerupId) {
        return this.getPowerupCount(powerupId) > 0;
    }

    getAllPowerups() {
        return { ...this.powerups };
    }

    savePowerups() {
        Utils.saveToLocalStorage('powerups', this.powerups);
    }

    loadPowerups() {
        const savedPowerups = Utils.loadFromLocalStorage('powerups');
        if (savedPowerups) {
            // Merge saved data with defaults
            for (const [powerupId, powerup] of Object.entries(savedPowerups)) {
                if (this.powerups[powerupId]) {
                    this.powerups[powerupId].count = powerup.count || 0;
                }
            }
            this.updatePowerupDisplay();
        }
    }

    resetPowerups() {
        for (const powerup of Object.values(this.powerups)) {
            powerup.count = 0;
        }
        this.updatePowerupDisplay();
        this.savePowerups();
    }

    // Reward powerups for achievements
    rewardPowerup(reason, powerupId = null, count = 1) {
        if (!powerupId) {
            // Give random powerup
            const powerupIds = Object.keys(this.powerups);
            powerupId = powerupIds[Utils.randomInt(0, powerupIds.length - 1)];
        }
        
        this.addPowerup(powerupId, count);
        
        // Show reward notification
        if (window.game) {
            window.game.showNotification(`Earned ${this.powerups[powerupId].name}!`, 'success');
        }
        
        return { powerupId, count, name: this.powerups[powerupId].name };
    }

    // Daily powerup rewards
    getDailyPowerups() {
        const dailyRewards = [
            { powerupId: 'directors-cut', count: 1 },
            { powerupId: 'clapboard-smash', count: 1 },
            { powerupId: 'spotlight-beam', count: 1 },
            { powerupId: 're-shoot', count: 2 }
        ];
        
        dailyRewards.forEach(reward => {
            this.addPowerup(reward.powerupId, reward.count);
        });
        
        return dailyRewards;
    }

    // Level completion powerup rewards
    getLevelCompletionRewards(level, stars) {
        const rewards = [];
        
        // Base reward
        if (stars >= 1) {
            rewards.push(this.rewardPowerup('level_complete', 're-shoot', 1));
        }
        
        // Bonus rewards for higher star ratings
        if (stars >= 2) {
            const bonusPowerups = ['directors-cut', 'clapboard-smash'];
            const bonusId = bonusPowerups[Utils.randomInt(0, bonusPowerups.length - 1)];
            rewards.push(this.rewardPowerup('two_stars', bonusId, 1));
        }
        
        if (stars >= 3) {
            rewards.push(this.rewardPowerup('three_stars', 'spotlight-beam', 1));
        }
        
        // Special milestone rewards
        if (level % 10 === 0) {
            rewards.push(this.rewardPowerup('milestone', null, 2));
        }
        
        return rewards;
    }

    // Purchase powerups with in-game currency
    purchasePowerup(powerupId, count = 1) {
        if (!this.powerups[powerupId] || !window.game) return false;
        
        const costPerPowerup = this.getPowerupCost(powerupId);
        const totalCost = costPerPowerup * count;
        
        if (window.game.economy.canAfford('tickets', totalCost)) {
            window.game.economy.spend('tickets', totalCost);
            this.addPowerup(powerupId, count);
            
            return true;
        }
        
        return false;
    }

    getPowerupCost(powerupId) {
        const costs = {
            'directors-cut': 100,
            'clapboard-smash': 80,
            'spotlight-beam': 150,
            're-shoot': 50
        };
        
        return costs[powerupId] || 100;
    }

    // Tutorial hints
    showPowerupTutorial(powerupId) {
        const tutorials = {
            'directors-cut': 'Tap anywhere on the board to clear a 3x3 area!',
            'clapboard-smash': 'Tap a tile to clear all tiles of that type!',
            'spotlight-beam': 'Tap a tile to clear its entire row or column!',
            're-shoot': 'Instantly undo your last move!'
        };
        
        const message = tutorials[powerupId];
        if (message && window.game) {
            window.game.showNotification(message, 'info', 3000);
        }
    }
}

// CSS for active powerup button
const powerupStyles = `
.powerup-btn.active {
    background: linear-gradient(45deg, #FFD700, #FFED4E) !important;
    color: #1A1A2E !important;
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
    animation: powerupPulse 1s ease-in-out infinite alternate;
}

@keyframes powerupPulse {
    0% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.8); }
    100% { box-shadow: 0 0 30px rgba(255, 215, 0, 1); }
}

.powerup-btn.disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

#game-board.powerup-active {
    cursor: crosshair !important;
}
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = powerupStyles;
document.head.appendChild(styleSheet);

// Create global powerup manager
const powerupManager = new PowerupManager();