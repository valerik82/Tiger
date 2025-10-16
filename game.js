// Game State
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

const GameMode = {
    CLASSIC: 'classic',
    TIME_ATTACK: 'timeattack',
    DAILY_8: 'daily8'
};

class Game888 {
    constructor() {
        this.board = [];
        this.score = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.comboActive = false;
        this.nextTileValue = 1;
        this.gameState = GameState.MENU;
        this.gameMode = GameMode.CLASSIC;
        this.modeTimer = 0;
        this.highestTile = 1;
        this.totalMerges = 0;
        this.blastCount = 0;
        this.activeBooster = null;
        this.isDragging = false;
        this.draggedTile = null;
        this.dragStartPos = null;
        this.boosters = {
            flip8: 3,
            split: 3,
            shockwave: 3
        };
        this.quests = [];
        this.questProgress = {};
        this.settings = {
            sfx: true,
            music: true,
            vibration: true,
            highContrast: false,
            reducedMotion: false
        };
        this.dailySeed = null;
        this.streak = 0;
        this.lastVisit = null;
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.loadProgress();
        this.initializeBoard();
        this.initializeEventListeners();
        this.initializeQuests();
        this.updateUI();
        
        // Check daily streak
        this.checkDailyStreak();
        
        // Start animation loop
        this.lastTime = performance.now();
        this.animate();
    }
    
    initializeBoard() {
        this.board = [];
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                this.board[row][col] = {
                    value: 0,
                    state: 'normal', // normal, stone, locked
                    stoneLives: 3,
                    isLocked: false,
                    element: null
                };
            }
        }
        
        // For Daily 8 mode, use a seeded random
        if (this.gameMode === GameMode.DAILY_8) {
            this.dailySeed = this.getDailySeed();
            this.random = this.seededRandom(this.dailySeed);
        } else {
            this.random = Math.random;
        }
    }
    
    initializeEventListeners() {
        // Menu buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.startGame(mode);
            });
        });
        
        // Settings
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showModal('settings-modal');
        });
        
        document.getElementById('quests-btn').addEventListener('click', () => {
            this.showModal('quests-modal');
            this.renderQuests();
        });
        
        document.getElementById('leaderboard-btn').addEventListener('click', () => {
            this.showModal('leaderboard-modal');
            this.renderLeaderboard();
        });
        
        // Settings toggles
        document.getElementById('sfx-toggle').addEventListener('change', (e) => {
            this.settings.sfx = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('music-toggle').addEventListener('change', (e) => {
            this.settings.music = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('vibration-toggle').addEventListener('change', (e) => {
            this.settings.vibration = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('contrast-toggle').addEventListener('change', (e) => {
            this.settings.highContrast = e.target.checked;
            document.body.classList.toggle('high-contrast', e.target.checked);
            this.saveSettings();
        });
        
        document.getElementById('motion-toggle').addEventListener('change', (e) => {
            this.settings.reducedMotion = e.target.checked;
            document.body.classList.toggle('reduced-motion', e.target.checked);
            this.saveSettings();
        });
        
        document.getElementById('reset-data').addEventListener('click', () => {
            if (confirm('Reset all progress? This cannot be undone!')) {
                localStorage.clear();
                location.reload();
            }
        });
        
        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('active');
            });
        });
        
        // Game controls
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // Game over buttons
        document.getElementById('retry-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('share-btn').addEventListener('click', () => {
            this.shareScore();
        });
        
        document.getElementById('home-btn').addEventListener('click', () => {
            this.quitToMenu();
        });
        
        // Boosters
        document.querySelectorAll('.booster-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const booster = e.currentTarget.dataset.booster;
                this.activateBooster(booster);
            });
        });
        
        document.getElementById('cancel-booster').addEventListener('click', () => {
            this.cancelBooster();
        });
        
        // Touch/Mouse controls for game board
        const board = document.getElementById('game-board');
        
        // Touch events
        board.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        board.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        board.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse events
        board.addEventListener('mousedown', this.handleMouseDown.bind(this));
        board.addEventListener('mousemove', this.handleMouseMove.bind(this));
        board.addEventListener('mouseup', this.handleMouseUp.bind(this));
        board.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        
        // Keyboard controls
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }
    
    initializeQuests() {
        this.quests = [
            { id: 'merge_8s', title: 'Eight is Great', description: 'Create 3 tiles with value 8', target: 3, reward: '+1 Flip 8' },
            { id: 'trigger_blast', title: 'Infinity Blast', description: 'Trigger 1 888 blast', target: 1, reward: '+1 Shockwave' },
            { id: 'clear_locks', title: 'Locksmith', description: 'Clear 5 locked tiles', target: 5, reward: '+1 Split' },
            { id: 'combo_chain', title: 'Combo Master', description: 'Achieve a x8 multiplier', target: 8, reward: '+2 All Boosters' },
            { id: 'high_score', title: 'Score Hunter', description: 'Score 8888 points in one game', target: 8888, reward: '+1 All Boosters' }
        ];
        
        // Load quest progress
        const savedProgress = localStorage.getItem('questProgress');
        if (savedProgress) {
            this.questProgress = JSON.parse(savedProgress);
        } else {
            this.questProgress = {};
            this.quests.forEach(quest => {
                this.questProgress[quest.id] = { current: 0, completed: false };
            });
        }
    }
    
    handleTouchStart(e) {
        if (this.gameState !== GameState.PLAYING) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const tile = this.getTileFromPoint(touch.clientX, touch.clientY);
        
        if (tile && tile.dataset.row !== undefined) {
            this.startDrag(tile, touch.clientX, touch.clientY);
        }
    }
    
    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        this.updateDrag(touch.clientX, touch.clientY);
    }
    
    handleTouchEnd(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        this.endDrag();
    }
    
    handleMouseDown(e) {
        if (this.gameState !== GameState.PLAYING) return;
        
        const tile = this.getTileFromPoint(e.clientX, e.clientY);
        if (tile && tile.dataset.row !== undefined) {
            this.startDrag(tile, e.clientX, e.clientY);
        }
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        this.updateDrag(e.clientX, e.clientY);
    }
    
    handleMouseUp(e) {
        if (!this.isDragging) return;
        this.endDrag();
    }
    
    handleKeyboard(e) {
        if (this.gameState !== GameState.PLAYING) return;
        
        // Arrow keys for accessibility
        switch(e.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                // Keyboard tile movement would be implemented here
                break;
            case 'Escape':
                this.pauseGame();
                break;
        }
    }
    
    startDrag(tile, x, y) {
        const row = parseInt(tile.dataset.row);
        const col = parseInt(tile.dataset.col);
        const cell = this.board[row][col];
        
        if (cell.value === 0 || cell.state === 'stone') return;
        
        this.isDragging = true;
        this.draggedTile = { row, col, element: tile };
        this.dragStartPos = { x, y };
        tile.classList.add('dragging');
        
        if (this.settings.vibration && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
    
    updateDrag(x, y) {
        if (!this.draggedTile) return;
        
        // Visual feedback for drag
        const dx = x - this.dragStartPos.x;
        const dy = y - this.dragStartPos.y;
        this.draggedTile.element.style.transform = `translate(${dx}px, ${dy}px) scale(1.1)`;
        
        // Check for merge target
        const targetTile = this.getTileFromPoint(x, y);
        if (targetTile && targetTile !== this.draggedTile.element) {
            const targetRow = parseInt(targetTile.dataset.row);
            const targetCol = parseInt(targetTile.dataset.col);
            
            // Remove previous merge target highlight
            document.querySelectorAll('.merge-target').forEach(t => t.classList.remove('merge-target'));
            
            // Check if valid merge
            if (this.canMerge(this.draggedTile.row, this.draggedTile.col, targetRow, targetCol)) {
                targetTile.classList.add('merge-target');
            }
        }
    }
    
    endDrag() {
        if (!this.draggedTile) return;
        
        const finalPos = this.getTileFromPoint(
            this.dragStartPos.x + parseInt(this.draggedTile.element.style.transform.match(/translate\(([^,]+)/)?.[1] || 0),
            this.dragStartPos.y + parseInt(this.draggedTile.element.style.transform.match(/translate\([^,]+,\s*([^)]+)/)?.[1] || 0)
        );
        
        if (finalPos && finalPos !== this.draggedTile.element) {
            const targetRow = parseInt(finalPos.dataset.row);
            const targetCol = parseInt(finalPos.dataset.col);
            
            if (this.canMerge(this.draggedTile.row, this.draggedTile.col, targetRow, targetCol)) {
                this.performMerge(this.draggedTile.row, this.draggedTile.col, targetRow, targetCol);
            }
        }
        
        // Reset drag state
        this.draggedTile.element.classList.remove('dragging');
        this.draggedTile.element.style.transform = '';
        document.querySelectorAll('.merge-target').forEach(t => t.classList.remove('merge-target'));
        
        this.isDragging = false;
        this.draggedTile = null;
        this.dragStartPos = null;
    }
    
    getTileFromPoint(x, y) {
        const element = document.elementFromPoint(x, y);
        if (element && element.classList.contains('tile')) {
            return element;
        }
        return null;
    }
    
    canMerge(fromRow, fromCol, toRow, toCol) {
        // Check if positions are adjacent
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
            const fromCell = this.board[fromRow][fromCol];
            const toCell = this.board[toRow][toCol];
            
            // Can't merge with empty, stone, or different values
            if (toCell.value === 0 || toCell.state === 'stone') return false;
            
            // Check if values match for merge
            return fromCell.value === toCell.value;
        }
        return false;
    }
    
    performMerge(fromRow, fromCol, toRow, toCol) {
        const fromCell = this.board[fromRow][fromCol];
        const toCell = this.board[toRow][toCol];
        
        if (fromCell.value !== toCell.value) return;
        
        // Calculate merged value
        let mergedValue = fromCell.value + 1;
        if (fromCell.value === 8 && toCell.value === 8) {
            mergedValue = 88;
        } else if (fromCell.value === 88 && toCell.value === 88) {
            mergedValue = 888;
        } else if (fromCell.value >= 888) {
            return; // Can't merge 888s
        }
        
        // Perform merge
        toCell.value = mergedValue;
        fromCell.value = 0;
        
        // Update score
        const basePoints = mergedValue * mergedValue;
        const comboBonus = this.comboActive ? this.comboMultiplier : 1;
        const points = Math.floor(basePoints * comboBonus);
        this.score += points;
        
        // Show score popup
        this.showScorePopup(toRow, toCol, points);
        
        // Update combo
        this.updateCombo();
        
        // Update stats
        this.totalMerges++;
        if (mergedValue > this.highestTile) {
            this.highestTile = mergedValue;
        }
        
        // Check for special events
        if (mergedValue === 8) {
            this.unlockTilesOnBoard();
            this.updateQuestProgress('merge_8s', 1);
        } else if (mergedValue === 888) {
            this.trigger888Blast(toRow, toCol);
        }
        
        // Damage adjacent stones
        this.damageAdjacentStones(toRow, toCol);
        
        // Apply gravity and spawn new tiles
        setTimeout(() => {
            this.applyGravity();
            this.spawnNewTiles();
            this.renderBoard();
            
            // Check game over
            if (this.checkGameOver()) {
                this.endGame();
            }
        }, 200);
        
        // Sound effect
        this.playSound('merge');
        
        // Update UI
        this.updateUI();
        this.renderBoard();
    }
    
    updateCombo() {
        this.comboActive = true;
        this.comboTimer = 8000; // 8 seconds in milliseconds
        
        if (this.comboMultiplier < 8) {
            this.comboMultiplier = Math.min(this.comboMultiplier + 1, 8);
        }
        
        // Update quest for combo
        if (this.comboMultiplier === 8) {
            this.updateQuestProgress('combo_chain', 1);
        }
    }
    
    unlockTilesOnBoard() {
        let unlocked = 0;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col].isLocked) {
                    this.board[row][col].isLocked = false;
                    unlocked++;
                }
            }
        }
        
        if (unlocked > 0) {
            this.updateQuestProgress('clear_locks', unlocked);
            this.playSound('unlock');
        }
    }
    
    trigger888Blast(centerRow, centerCol) {
        this.blastCount++;
        this.updateQuestProgress('trigger_blast', 1);
        
        // Clear 3x3 area around the 888
        for (let row = Math.max(0, centerRow - 1); row <= Math.min(7, centerRow + 1); row++) {
            for (let col = Math.max(0, centerCol - 1); col <= Math.min(7, centerCol + 1); col++) {
                if (this.board[row][col].state !== 'stone') {
                    this.board[row][col].value = 0;
                }
            }
        }
        
        // Infinity sweep - clear all 1s and 2s
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col].value === 1 || this.board[row][col].value === 2) {
                    this.board[row][col].value = 0;
                }
            }
        }
        
        // Show infinity animation
        this.showInfinityAnimation();
        
        // x8 bonus for 5 seconds
        this.comboMultiplier = 8;
        this.comboTimer = 5000;
        
        // Big score bonus
        this.score += 8888;
        this.showScorePopup(centerRow, centerCol, 8888);
        
        this.playSound('blast');
    }
    
    damageAdjacentStones(row, col) {
        const adjacent = [
            [row - 1, col], [row + 1, col],
            [row, col - 1], [row, col + 1]
        ];
        
        adjacent.forEach(([r, c]) => {
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                const cell = this.board[r][c];
                if (cell.state === 'stone') {
                    cell.stoneLives--;
                    if (cell.stoneLives <= 0) {
                        cell.state = 'normal';
                        cell.value = 0;
                        this.playSound('stone_break');
                    }
                }
            }
        });
    }
    
    applyGravity() {
        let moved = true;
        while (moved) {
            moved = false;
            for (let col = 0; col < 8; col++) {
                for (let row = 6; row >= 0; row--) {
                    if (this.board[row][col].value > 0 && this.board[row + 1][col].value === 0) {
                        // Move tile down
                        this.board[row + 1][col] = this.board[row][col];
                        this.board[row][col] = { value: 0, state: 'normal', stoneLives: 3, isLocked: false };
                        moved = true;
                    }
                }
            }
        }
    }
    
    spawnNewTiles() {
        // Count empty spaces in top row
        let emptySpaces = [];
        for (let col = 0; col < 8; col++) {
            if (this.board[0][col].value === 0) {
                emptySpaces.push(col);
            }
        }
        
        // Spawn 1-3 new tiles
        const spawnCount = Math.min(emptySpaces.length, Math.floor(this.random() * 3) + 1);
        
        for (let i = 0; i < spawnCount; i++) {
            if (emptySpaces.length === 0) break;
            
            const colIndex = Math.floor(this.random() * emptySpaces.length);
            const col = emptySpaces[colIndex];
            emptySpaces.splice(colIndex, 1);
            
            // Weighted random for tile value (more low values early)
            const weights = this.score < 1000 ? [50, 30, 15, 5] : [40, 30, 20, 10];
            const value = this.weightedRandom(weights) + 1;
            
            this.board[0][col] = {
                value: value,
                state: 'normal',
                stoneLives: 3,
                isLocked: this.random() < 0.1 // 10% chance of locked tile
            };
        }
        
        // Occasionally spawn stones
        if (this.random() < 0.05 && this.totalMerges > 20) {
            const col = Math.floor(this.random() * 8);
            if (this.board[0][col].value === 0) {
                this.board[0][col] = {
                    value: 8,
                    state: 'stone',
                    stoneLives: 3,
                    isLocked: false
                };
            }
        }
        
        // Generate next tile preview
        this.nextTileValue = Math.floor(this.random() * 4) + 1;
    }
    
    weightedRandom(weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = this.random() * total;
        
        for (let i = 0; i < weights.length; i++) {
            random -= weights[i];
            if (random < 0) return i;
        }
        return weights.length - 1;
    }
    
    checkGameOver() {
        // Check if board is full
        for (let col = 0; col < 8; col++) {
            if (this.board[0][col].value === 0) return false;
        }
        
        // Check if any merges are possible
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.board[row][col].value === 0) continue;
                if (this.board[row][col].state === 'stone') continue;
                
                // Check adjacent tiles
                const adjacent = [
                    [row - 1, col], [row + 1, col],
                    [row, col - 1], [row, col + 1]
                ];
                
                for (let [r, c] of adjacent) {
                    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                        if (this.canMerge(row, col, r, c)) {
                            return false;
                        }
                    }
                }
            }
        }
        
        return true;
    }
    
    activateBooster(type) {
        if (this.boosters[type] <= 0) return;
        
        this.activeBooster = type;
        document.querySelector(`[data-booster="${type}"]`).classList.add('active');
        
        if (type === 'shockwave') {
            // Shockwave clears bottom row immediately
            this.useShockwave();
        } else {
            // Other boosters need target selection
            document.getElementById('booster-overlay').classList.add('active');
            document.getElementById('booster-name').textContent = type === 'flip8' ? 'Flip 8' : 'Split';
        }
    }
    
    cancelBooster() {
        this.activeBooster = null;
        document.querySelectorAll('.booster-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('booster-overlay').classList.remove('active');
    }
    
    useShockwave() {
        // Clear bottom row
        for (let col = 0; col < 8; col++) {
            if (this.board[7][col].state !== 'stone') {
                this.board[7][col].value = 0;
            }
        }
        
        this.boosters.shockwave--;
        this.updateBoosterUI();
        this.cancelBooster();
        
        // Apply gravity and continue
        this.applyGravity();
        this.spawnNewTiles();
        this.renderBoard();
        
        this.playSound('shockwave');
    }
    
    renderBoard() {
        const boardElement = document.getElementById('game-board');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = this.board[row][col];
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                if (cell.value === 0) {
                    tile.classList.add('empty');
                } else {
                    tile.dataset.value = cell.value;
                    tile.textContent = cell.value;
                    
                    if (cell.state === 'stone') {
                        tile.classList.add('stone');
                        const counter = document.createElement('div');
                        counter.className = 'stone-counter';
                        counter.textContent = cell.stoneLives;
                        tile.appendChild(counter);
                    }
                    
                    if (cell.isLocked) {
                        tile.classList.add('locked');
                    }
                    
                    if (cell.spawning) {
                        tile.classList.add('spawning');
                        cell.spawning = false;
                    }
                }
                
                boardElement.appendChild(tile);
            }
        }
    }
    
    updateUI() {
        // Score
        document.getElementById('score').textContent = this.score;
        
        // Combo
        const comboMultElement = document.getElementById('combo-multiplier');
        if (this.comboActive && this.comboMultiplier > 1) {
            comboMultElement.textContent = `×${this.comboMultiplier}`;
            comboMultElement.classList.add('active');
        } else {
            comboMultElement.classList.remove('active');
        }
        
        // Combo timer
        const timerFill = document.getElementById('combo-timer');
        const timerSeconds = document.getElementById('combo-seconds');
        const percentage = (this.comboTimer / 8000) * 100;
        timerFill.style.width = `${percentage}%`;
        timerSeconds.textContent = `${(this.comboTimer / 1000).toFixed(1)}s`;
        
        // Next tile
        const nextTileElement = document.getElementById('next-tile');
        nextTileElement.textContent = this.nextTileValue;
        nextTileElement.style.background = `var(--tile-${this.nextTileValue})`;
        
        // Mode specific UI
        if (this.gameMode === GameMode.TIME_ATTACK) {
            document.getElementById('mode-timer').textContent = Math.ceil(this.modeTimer / 1000) + 's';
        }
        
        // Daily streak
        document.querySelector('.streak-count').textContent = this.streak;
        
        // Quest badge
        const activeQuests = this.quests.filter(q => !this.questProgress[q.id].completed).length;
        const questBadge = document.querySelector('.quest-badge');
        questBadge.dataset.count = activeQuests;
        questBadge.textContent = activeQuests > 0 ? activeQuests : '';
    }
    
    updateBoosterUI() {
        Object.keys(this.boosters).forEach(type => {
            const btn = document.querySelector(`[data-booster="${type}"]`);
            const count = btn.querySelector('.booster-count');
            count.textContent = this.boosters[type];
            btn.disabled = this.boosters[type] <= 0;
            if (this.boosters[type] <= 0) {
                count.style.display = 'none';
            } else {
                count.style.display = 'flex';
            }
        });
    }
    
    animate(currentTime) {
        if (!this.lastTime) this.lastTime = currentTime;
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === GameState.PLAYING) {
            // Update combo timer
            if (this.comboActive && this.comboTimer > 0) {
                this.comboTimer -= deltaTime;
                if (this.comboTimer <= 0) {
                    this.comboActive = false;
                    this.comboMultiplier = 1;
                    this.comboTimer = 0;
                }
                this.updateUI();
            }
            
            // Update mode timer
            if (this.gameMode === GameMode.TIME_ATTACK) {
                this.modeTimer -= deltaTime;
                if (this.modeTimer <= 0) {
                    this.endGame();
                }
                this.updateUI();
            }
        }
        
        requestAnimationFrame(this.animate.bind(this));
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.gameState = GameState.PLAYING;
        this.score = 0;
        this.comboTimer = 0;
        this.comboMultiplier = 1;
        this.comboActive = false;
        this.highestTile = 1;
        this.totalMerges = 0;
        this.blastCount = 0;
        
        // Reset boosters
        this.boosters = { flip8: 3, split: 3, shockwave: 3 };
        this.updateBoosterUI();
        
        // Mode-specific setup
        if (mode === GameMode.TIME_ATTACK) {
            this.modeTimer = 88000; // 88 seconds
            document.getElementById('mode-timer').style.display = 'block';
        } else {
            document.getElementById('mode-timer').style.display = 'none';
        }
        
        document.querySelector('.mode-name').textContent = 
            mode === GameMode.CLASSIC ? 'Classic' :
            mode === GameMode.TIME_ATTACK ? 'Time Attack' :
            'Daily 8';
        
        // Initialize board and spawn initial tiles
        this.initializeBoard();
        this.spawnNewTiles();
        this.applyGravity();
        this.renderBoard();
        
        // Switch screens
        document.querySelector('.home-screen').classList.remove('active');
        document.querySelector('.game-screen').classList.add('active');
        
        this.updateUI();
    }
    
    pauseGame() {
        if (this.gameState !== GameState.PLAYING) return;
        this.gameState = GameState.PAUSED;
        this.showModal('pause-modal');
    }
    
    resumeGame() {
        this.gameState = GameState.PLAYING;
        document.getElementById('pause-modal').classList.remove('active');
    }
    
    restartGame() {
        document.getElementById('pause-modal').classList.remove('active');
        document.querySelector('.game-over-screen').classList.remove('active');
        this.startGame(this.gameMode);
    }
    
    quitToMenu() {
        this.gameState = GameState.MENU;
        document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelector('.home-screen').classList.add('active');
    }
    
    endGame() {
        this.gameState = GameState.GAME_OVER;
        
        // Save high score
        const key = `highScore_${this.gameMode}`;
        const highScore = parseInt(localStorage.getItem(key) || 0);
        if (this.score > highScore) {
            localStorage.setItem(key, this.score);
        }
        
        // Update stats
        document.getElementById('final-score').textContent = this.score;
        document.getElementById('best-score').textContent = Math.max(this.score, highScore);
        document.getElementById('highest-tile').textContent = this.highestTile;
        document.getElementById('blast-count').textContent = this.blastCount;
        document.getElementById('merge-count').textContent = this.totalMerges;
        
        // Check quest completion
        if (this.score >= 8888) {
            this.updateQuestProgress('high_score', this.score);
        }
        
        // Save quest progress
        this.saveQuestProgress();
        
        // Show game over screen
        document.querySelector('.game-screen').classList.remove('active');
        document.querySelector('.game-over-screen').classList.add('active');
        
        this.playSound('game_over');
    }
    
    shareScore() {
        const text = `I scored ${this.score} in 888: Merge Rush! 🎮\nHighest tile: ${this.highestTile}\n888 Blasts: ${this.blastCount}\nCan you beat my score?`;
        
        if (navigator.share) {
            navigator.share({
                title: '888: Merge Rush',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert('Score copied to clipboard!');
            });
        }
    }
    
    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }
    
    renderQuests() {
        const questList = document.getElementById('quest-list');
        questList.innerHTML = '';
        
        this.quests.forEach(quest => {
            const progress = this.questProgress[quest.id];
            const questDiv = document.createElement('div');
            questDiv.className = 'quest-item' + (progress.completed ? ' completed' : '');
            
            questDiv.innerHTML = `
                <div class="quest-title">${quest.title}</div>
                <div class="quest-progress">${quest.description} (${Math.min(progress.current, quest.target)}/${quest.target})</div>
                <div class="quest-reward">Reward: ${quest.reward}</div>
            `;
            
            questList.appendChild(questDiv);
        });
    }
    
    updateQuestProgress(questId, amount) {
        if (!this.questProgress[questId].completed) {
            this.questProgress[questId].current += amount;
            
            const quest = this.quests.find(q => q.id === questId);
            if (this.questProgress[questId].current >= quest.target) {
                this.questProgress[questId].completed = true;
                this.completeQuest(quest);
            }
            
            this.saveQuestProgress();
        }
    }
    
    completeQuest(quest) {
        // Grant rewards
        if (quest.reward.includes('Flip 8')) {
            this.boosters.flip8 += parseInt(quest.reward.match(/\d+/)[0]);
        }
        if (quest.reward.includes('Split')) {
            this.boosters.split += parseInt(quest.reward.match(/\d+/)[0]);
        }
        if (quest.reward.includes('Shockwave')) {
            this.boosters.shockwave += parseInt(quest.reward.match(/\d+/)[0]);
        }
        if (quest.reward.includes('All Boosters')) {
            const amount = parseInt(quest.reward.match(/\d+/)[0]);
            this.boosters.flip8 += amount;
            this.boosters.split += amount;
            this.boosters.shockwave += amount;
        }
        
        this.updateBoosterUI();
        this.playSound('quest_complete');
        
        // Show notification
        this.showNotification(`Quest Complete: ${quest.title}!`);
    }
    
    renderLeaderboard() {
        const content = document.getElementById('leaderboard-content');
        const tabs = document.querySelectorAll('.tab-btn');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                const mode = e.target.dataset.tab;
                this.displayLeaderboard(mode);
            });
        });
        
        // Display classic by default
        this.displayLeaderboard('classic');
    }
    
    displayLeaderboard(mode) {
        const content = document.getElementById('leaderboard-content');
        const key = `highScore_${mode}`;
        const scores = [];
        
        // Get local high score
        const localScore = parseInt(localStorage.getItem(key) || 0);
        if (localScore > 0) {
            scores.push({ name: 'You', score: localScore });
        }
        
        // Add some placeholder scores
        const placeholders = [
            { name: 'Player888', score: 88888 },
            { name: 'MergeMaster', score: 66666 },
            { name: 'TileKing', score: 44444 },
            { name: 'ComboQueen', score: 33333 },
            { name: 'BlastPro', score: 22222 }
        ];
        
        scores.push(...placeholders);
        scores.sort((a, b) => b.score - a.score);
        
        content.innerHTML = '';
        scores.slice(0, 10).forEach((entry, index) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-entry';
            div.innerHTML = `
                <span class="leaderboard-rank">${index + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score}</span>
            `;
            content.appendChild(div);
        });
    }
    
    checkDailyStreak() {
        const now = new Date();
        const today = now.toDateString();
        const lastVisit = localStorage.getItem('lastVisit');
        
        if (lastVisit) {
            const lastDate = new Date(lastVisit);
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() === yesterday.toDateString()) {
                // Continue streak
                this.streak = parseInt(localStorage.getItem('streak') || 0) + 1;
            } else if (lastDate.toDateString() !== today) {
                // Reset streak
                this.streak = 1;
            } else {
                // Same day
                this.streak = parseInt(localStorage.getItem('streak') || 1);
            }
        } else {
            this.streak = 1;
        }
        
        localStorage.setItem('streak', this.streak);
        localStorage.setItem('lastVisit', now.toISOString());
        
        // Check if it's 8:08
        const hour = now.getHours();
        const minute = now.getMinutes();
        if (hour === 8 && minute === 8) {
            // Bonus booster!
            const types = ['flip8', 'split', 'shockwave'];
            const bonusType = types[Math.floor(Math.random() * types.length)];
            this.boosters[bonusType]++;
            this.showNotification(`Daily 8:08 Bonus! +1 ${bonusType}`);
        }
    }
    
    getDailySeed() {
        const today = new Date();
        return `${today.getFullYear()}${today.getMonth()}${today.getDate()}`;
    }
    
    seededRandom(seed) {
        let x = Math.sin(parseInt(seed)) * 10000;
        return function() {
            x = Math.sin(x) * 10000;
            return x - Math.floor(x);
        };
    }
    
    showScorePopup(row, col, points) {
        const tile = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!tile) return;
        
        const popup = document.createElement('div');
        popup.className = 'score-popup';
        popup.textContent = `+${points}`;
        
        const rect = tile.getBoundingClientRect();
        popup.style.left = rect.left + rect.width / 2 + 'px';
        popup.style.top = rect.top + 'px';
        
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1000);
    }
    
    showInfinityAnimation() {
        const infinity = document.createElement('div');
        infinity.className = 'infinity-sweep';
        infinity.textContent = '∞';
        document.querySelector('.board-wrapper').appendChild(infinity);
        setTimeout(() => infinity.remove(), 2000);
    }
    
    showNotification(message) {
        // Create a simple notification (could be enhanced with better UI)
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--primary-color);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            font-size: 18px;
            z-index: 10000;
            animation: score-popup 2s ease-out forwards;
        `;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }
    
    playSound(type) {
        if (!this.settings.sfx) return;
        
        // Sound implementation would go here
        // For now, we'll use the Web Audio API for simple sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch(type) {
            case 'merge':
                oscillator.frequency.value = 440;
                gainNode.gain.value = 0.1;
                break;
            case 'blast':
                oscillator.frequency.value = 880;
                gainNode.gain.value = 0.2;
                break;
            case 'unlock':
                oscillator.frequency.value = 660;
                gainNode.gain.value = 0.1;
                break;
            case 'stone_break':
                oscillator.frequency.value = 220;
                gainNode.gain.value = 0.1;
                break;
            case 'shockwave':
                oscillator.frequency.value = 110;
                gainNode.gain.value = 0.2;
                break;
            case 'quest_complete':
                oscillator.frequency.value = 880;
                gainNode.gain.value = 0.15;
                break;
            case 'game_over':
                oscillator.frequency.value = 220;
                gainNode.gain.value = 0.2;
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            this.settings = JSON.parse(saved);
            
            // Apply settings
            document.getElementById('sfx-toggle').checked = this.settings.sfx;
            document.getElementById('music-toggle').checked = this.settings.music;
            document.getElementById('vibration-toggle').checked = this.settings.vibration;
            document.getElementById('contrast-toggle').checked = this.settings.highContrast;
            document.getElementById('motion-toggle').checked = this.settings.reducedMotion;
            
            if (this.settings.highContrast) {
                document.body.classList.add('high-contrast');
            }
            if (this.settings.reducedMotion) {
                document.body.classList.add('reduced-motion');
            }
        }
    }
    
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }
    
    loadProgress() {
        // Load various game progress
        this.streak = parseInt(localStorage.getItem('streak') || 0);
    }
    
    saveQuestProgress() {
        localStorage.setItem('questProgress', JSON.stringify(this.questProgress));
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game888();
});