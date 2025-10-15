// 888: Merge Rush Game Logic
class Game {
    constructor() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('bestScore') || '0');
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        this.comboActive = false;
        this.selectedCell = null;
        this.nextTileValue = this.generateNextTile();
        this.gameMode = 'classic';
        this.timeRemaining = 0;
        this.gameActive = false;
        this.blastCount = 0;
        this.bestCombo = 1;
        
        // Boosters
        this.boosters = {
            flip: 1,
            split: 1,
            shockwave: 1
        };
        
        // Settings
        this.settings = {
            sound: true,
            vibration: true,
            reducedMotion: false,
            highContrast: false
        };
        
        this.loadSettings();
        this.initializeDOM();
        this.bindEvents();
        this.updateBestScore();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        this.applySettings();
    }
    
    saveSettings() {
        localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        document.body.classList.toggle('high-contrast', this.settings.highContrast);
        document.body.classList.toggle('reduced-motion', this.settings.reducedMotion);
        
        // Update checkboxes
        document.getElementById('sound-toggle').checked = this.settings.sound;
        document.getElementById('vibration-toggle').checked = this.settings.vibration;
        document.getElementById('reduced-motion').checked = this.settings.reducedMotion;
        document.getElementById('high-contrast').checked = this.settings.highContrast;
    }
    
    initializeDOM() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                board.appendChild(cell);
            }
        }
        
        this.updateNextTilePreview();
    }
    
    bindEvents() {
        // Menu navigation
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.startGame(e.target.dataset.mode);
            });
        });
        
        // Screen navigation
        document.getElementById('settings-btn').addEventListener('click', () => this.showScreen('settings'));
        document.getElementById('settings-back').addEventListener('click', () => this.showScreen('home'));
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('retry-btn').addEventListener('click', () => this.startGame(this.gameMode));
        document.getElementById('home-btn').addEventListener('click', () => this.showScreen('home'));
        
        // Settings
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            this.settings.sound = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('vibration-toggle').addEventListener('change', (e) => {
            this.settings.vibration = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('reduced-motion').addEventListener('change', (e) => {
            this.settings.reducedMotion = e.target.checked;
            this.applySettings();
            this.saveSettings();
        });
        
        document.getElementById('high-contrast').addEventListener('change', (e) => {
            this.settings.highContrast = e.target.checked;
            this.applySettings();
            this.saveSettings();
        });
        
        // Game board interactions
        document.getElementById('game-board').addEventListener('click', (e) => {
            if (!this.gameActive) return;
            
            const cell = e.target.closest('.cell');
            if (!cell) return;
            
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            this.handleCellClick(row, col);
        });
        
        // Booster buttons
        document.querySelectorAll('.booster').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.gameActive || btn.disabled) return;
                
                const boosterType = btn.dataset.booster;
                this.useBooster(boosterType);
            });
        });
        
        // Touch/swipe support
        this.setupTouchControls();
        
        // Keyboard support
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    setupTouchControls() {
        let touchStartX, touchStartY, touchStartCell;
        
        document.getElementById('game-board').addEventListener('touchstart', (e) => {
            if (!this.gameActive) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            
            const cell = document.elementFromPoint(touch.clientX, touch.clientY).closest('.cell');
            if (cell) {
                touchStartCell = { row: parseInt(cell.dataset.row), col: parseInt(cell.dataset.col) };
            }
        });
        
        document.getElementById('game-board').addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        document.getElementById('game-board').addEventListener('touchend', (e) => {
            if (!this.gameActive || !touchStartCell) return;
            e.preventDefault();
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - touchStartX;
            const deltaY = touch.clientY - touchStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance < 20) {
                // Tap
                this.handleCellClick(touchStartCell.row, touchStartCell.col);
            } else {
                // Swipe
                const targetCell = document.elementFromPoint(touch.clientX, touch.clientY).closest('.cell');
                if (targetCell) {
                    const targetRow = parseInt(targetCell.dataset.row);
                    const targetCol = parseInt(targetCell.dataset.col);
                    
                    if (this.selectedCell && 
                        this.selectedCell.row === touchStartCell.row && 
                        this.selectedCell.col === touchStartCell.col) {
                        this.handleCellClick(targetRow, targetCol);
                    }
                }
            }
            
            touchStartCell = null;
        });
    }
    
    handleKeyboard(e) {
        if (!this.gameActive) return;
        
        // Arrow key navigation and Enter to select/merge
        const { key } = e;
        
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(key)) {
            e.preventDefault();
            
            if (!this.selectedCell) {
                this.selectedCell = { row: 3, col: 3 }; // Start in center
                this.updateCellSelection();
                return;
            }
            
            let { row, col } = this.selectedCell;
            
            switch (key) {
                case 'ArrowUp': row = Math.max(0, row - 1); break;
                case 'ArrowDown': row = Math.min(7, row + 1); break;
                case 'ArrowLeft': col = Math.max(0, col - 1); break;
                case 'ArrowRight': col = Math.min(7, col + 1); break;
                case 'Enter':
                case ' ':
                    this.handleCellClick(row, col);
                    return;
            }
            
            this.selectedCell = { row, col };
            this.updateCellSelection();
        }
    }
    
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(`${screenName}-screen`).classList.add('active');
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.gameActive = true;
        this.score = 0;
        this.comboMultiplier = 1;
        this.comboTimer = 0;
        this.comboActive = false;
        this.selectedCell = null;
        this.blastCount = 0;
        this.bestCombo = 1;
        
        // Reset board
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Set up mode-specific settings
        switch (mode) {
            case 'timeattack':
                this.timeRemaining = 88;
                this.startTimer();
                break;
            case 'daily':
                // Use daily seed
                this.setupDailyChallenge();
                break;
        }
        
        // Add initial tiles
        this.addRandomTiles(3);
        
        this.showScreen('game');
        this.updateDisplay();
        this.renderBoard();
    }
    
    setupDailyChallenge() {
        // Generate seed based on current date
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        this.dailySeed = seed;
        
        // Add some pre-placed obstacles for daily challenge
        this.addDailyObstacles();
    }
    
    seedRandom(seed) {
        let currentSeed = seed;
        return function() {
            currentSeed = (currentSeed * 9301 + 49297) % 233280;
            return currentSeed / 233280;
        };
    }
    
    addDailyObstacles() {
        // Add 2-3 stone 8s and 1-2 locked tiles in strategic positions
        const obstacles = [
            { row: 2, col: 2, type: 'stone', value: 8 },
            { row: 5, col: 5, type: 'stone', value: 8 },
            { row: 1, col: 6, type: 'locked', value: 3 },
        ];
        
        obstacles.forEach(obs => {
            if (!this.board[obs.row][obs.col]) {
                this.board[obs.row][obs.col] = {
                    value: obs.value,
                    state: obs.type,
                    comboTag: null
                };
            }
        });
    }
    
    startTimer() {
        if (this.gameMode === 'timeattack') {
            this.timerInterval = setInterval(() => {
                this.timeRemaining--;
                this.updateDisplay();
                
                if (this.timeRemaining <= 0) {
                    this.endGame();
                }
            }, 1000);
        }
    }
    
    pauseGame() {
        this.gameActive = !this.gameActive;
        
        if (this.gameActive) {
            if (this.gameMode === 'timeattack') this.startTimer();
        } else {
            if (this.timerInterval) clearInterval(this.timerInterval);
        }
        
        document.getElementById('pause-btn').textContent = this.gameActive ? '⏸' : '▶️';
    }
    
    generateNextTile() {
        // Weighted random: more 1-3 early game, introduce 4s as score increases
        const weights = this.score < 1000 ? [40, 30, 20, 10] : [30, 25, 25, 20];
        const random = Math.random() * 100;
        let cumulative = 0;
        
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return i + 1;
            }
        }
        return 1;
    }
    
    addRandomTiles(count) {
        const emptyCells = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (!this.board[row][col]) {
                    emptyCells.push({ row, col });
                }
            }
        }
        
        for (let i = 0; i < Math.min(count, emptyCells.length); i++) {
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            const { row, col } = emptyCells.splice(randomIndex, 1)[0];
            
            this.board[row][col] = {
                value: this.nextTileValue,
                state: 'normal',
                comboTag: null
            };
            
            this.nextTileValue = this.generateNextTile();
        }
    }
    
    handleCellClick(row, col) {
        const cell = this.board[row][col];
        
        if (!this.selectedCell) {
            // First click - select cell if it has a tile
            if (cell && cell.state !== 'stone') {
                this.selectedCell = { row, col };
                this.updateCellSelection();
            }
        } else {
            // Second click - try to merge or deselect
            if (this.selectedCell.row === row && this.selectedCell.col === col) {
                // Deselect
                this.selectedCell = null;
                this.updateCellSelection();
            } else {
                // Try to merge
                this.attemptMerge(this.selectedCell.row, this.selectedCell.col, row, col);
            }
        }
    }
    
    updateCellSelection() {
        // Clear all selections
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('selected', 'valid-target');
        });
        
        if (this.selectedCell) {
            const { row, col } = this.selectedCell;
            const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cellElement.classList.add('selected');
            
            // Highlight valid merge targets
            const selectedTile = this.board[row][col];
            if (selectedTile) {
                this.getAdjacentCells(row, col).forEach(({ row: r, col: c }) => {
                    const targetTile = this.board[r][c];
                    if (this.canMerge(selectedTile, targetTile)) {
                        const targetElement = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                        targetElement.classList.add('valid-target');
                    }
                });
            }
        }
    }
    
    getAdjacentCells(row, col) {
        const adjacent = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        directions.forEach(([dr, dc]) => {
            const newRow = row + dr;
            const newCol = col + dc;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                adjacent.push({ row: newRow, col: newCol });
            }
        });
        
        return adjacent;
    }
    
    canMerge(tile1, tile2) {
        if (!tile1 || !tile2) return false;
        if (tile1.state === 'stone' || tile2.state === 'stone') return false;
        if (tile1.state === 'locked' || tile2.state === 'locked') return false;
        
        // Regular merging: same values
        if (tile1.value === tile2.value && tile1.value <= 7) return true;
        
        // Special merging: 8 + 8 = 88, 88 + 88 = 888
        if (tile1.value === 8 && tile2.value === 8) return true;
        if (tile1.value === 88 && tile2.value === 88) return true;
        
        return false;
    }
    
    attemptMerge(fromRow, fromCol, toRow, toCol) {
        // Check if cells are adjacent
        const distance = Math.abs(fromRow - toRow) + Math.abs(fromCol - toCol);
        if (distance !== 1) return false;
        
        const fromTile = this.board[fromRow][fromCol];
        const toTile = this.board[toRow][toCol];
        
        if (!this.canMerge(fromTile, toTile)) return false;
        
        // Perform merge
        this.performMerge(fromRow, fromCol, toRow, toCol);
        
        // Clear selection
        this.selectedCell = null;
        this.updateCellSelection();
        
        return true;
    }
    
    performMerge(fromRow, fromCol, toRow, toCol) {
        const fromTile = this.board[fromRow][fromCol];
        const toTile = this.board[toRow][toCol];
        
        // Calculate new value
        let newValue;
        if (fromTile.value === 8 && toTile.value === 8) {
            newValue = 88;
        } else if (fromTile.value === 88 && toTile.value === 88) {
            newValue = 888;
        } else {
            newValue = fromTile.value + 1;
        }
        
        // Remove source tile
        this.board[fromRow][fromCol] = null;
        
        // Update target tile
        this.board[toRow][toCol] = {
            value: newValue,
            state: 'normal',
            comboTag: Date.now()
        };
        
        // Handle special cases
        if (newValue === 888) {
            this.trigger888Blast(toRow, toCol);
        }
        
        // Update combo
        this.updateCombo();
        
        // Calculate and add score
        const baseScore = newValue === 888 ? 888 * 888 : newValue * newValue;
        const comboBonus = Math.floor(baseScore * (this.comboMultiplier - 1) * 0.1);
        const totalScore = baseScore + comboBonus;
        
        this.score += totalScore;
        this.createScoreParticle(toRow, toCol, totalScore);
        
        // Check for stone destruction
        this.checkStoneDestruction(toRow, toCol);
        
        // Unlock locked tiles if an 8 was created
        if (newValue >= 8) {
            this.unlockTiles();
        }
        
        // Apply gravity and spawn new tiles
        setTimeout(() => {
            this.applyGravity();
            this.addRandomTiles(1);
            this.renderBoard();
            this.updateDisplay();
            this.checkGameOver();
        }, 300);
        
        // Play sound and vibration
        this.playMergeSound(newValue);
        this.vibrate(newValue >= 8 ? [100, 50, 100] : [50]);
        
        this.renderBoard();
        this.updateDisplay();
    }
    
    trigger888Blast(row, col) {
        this.blastCount++;
        
        // Clear 3x3 area around the 888
        for (let r = Math.max(0, row - 1); r <= Math.min(7, row + 1); r++) {
            for (let c = Math.max(0, col - 1); c <= Math.min(7, col + 1); c++) {
                if (r !== row || c !== col) {
                    const tile = this.board[r][c];
                    if (tile && tile.state !== 'stone') {
                        this.board[r][c] = null;
                    }
                }
            }
        }
        
        // Infinite sign sweep - remove all 1s and 2s
        setTimeout(() => {
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const tile = this.board[r][c];
                    if (tile && (tile.value === 1 || tile.value === 2) && tile.state === 'normal') {
                        this.board[r][c] = null;
                        this.createParticle(r, c, '∞');
                    }
                }
            }
            
            // Add x8 score multiplier for 5 seconds
            this.activateBlastBonus();
            
            this.applyGravity();
            this.addRandomTiles(3);
            this.renderBoard();
        }, 500);
        
        // Create blast particle effect
        this.createBlastEffect(row, col);
    }
    
    activateBlastBonus() {
        const originalMultiplier = this.comboMultiplier;
        this.comboMultiplier *= 8;
        
        setTimeout(() => {
            this.comboMultiplier = originalMultiplier;
        }, 5000);
    }
    
    updateCombo() {
        this.comboTimer = 8; // Reset to 8 seconds
        this.comboActive = true;
        
        if (this.comboInterval) clearInterval(this.comboInterval);
        
        this.comboInterval = setInterval(() => {
            this.comboTimer -= 0.1;
            
            if (this.comboTimer <= 0) {
                this.comboMultiplier = 1;
                this.comboActive = false;
                clearInterval(this.comboInterval);
            } else if (this.comboActive) {
                // Increase multiplier based on consecutive merges
                this.comboMultiplier = Math.min(8, this.comboMultiplier + 0.1);
                this.bestCombo = Math.max(this.bestCombo, Math.floor(this.comboMultiplier));
            }
            
            this.updateComboDisplay();
        }, 100);
    }
    
    checkStoneDestruction(row, col) {
        const adjacentCells = this.getAdjacentCells(row, col);
        
        adjacentCells.forEach(({ row: r, col: c }) => {
            const tile = this.board[r][c];
            if (tile && tile.state === 'stone') {
                tile.destroyCount = (tile.destroyCount || 0) + 1;
                
                if (tile.destroyCount >= 3) {
                    this.board[r][c] = null;
                    this.createParticle(r, c, '💥');
                }
            }
        });
    }
    
    unlockTiles() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const tile = this.board[row][col];
                if (tile && tile.state === 'locked') {
                    tile.state = 'normal';
                    this.createParticle(row, col, '🔓');
                }
            }
        }
    }
    
    applyGravity() {
        for (let col = 0; col < 8; col++) {
            // Collect all non-null tiles in this column
            const tiles = [];
            for (let row = 7; row >= 0; row--) {
                if (this.board[row][col]) {
                    tiles.push(this.board[row][col]);
                    this.board[row][col] = null;
                }
            }
            
            // Place tiles at bottom
            for (let i = 0; i < tiles.length; i++) {
                this.board[7 - i][col] = tiles[i];
            }
        }
    }
    
    useBooster(type) {
        if (this.boosters[type] <= 0) return;
        
        this.boosters[type]--;
        
        switch (type) {
            case 'flip':
                this.useFlipBooster();
                break;
            case 'split':
                this.useSplitBooster();
                break;
            case 'shockwave':
                this.useShockwaveBooster();
                break;
        }
        
        this.updateBoosterDisplay();
    }
    
    useFlipBooster() {
        // Rotate selected 3x3 area or center area if none selected
        let centerRow = 3, centerCol = 3;
        
        if (this.selectedCell) {
            centerRow = this.selectedCell.row;
            centerCol = this.selectedCell.col;
        }
        
        // Create 3x3 area around center
        const area = [];
        for (let r = centerRow - 1; r <= centerRow + 1; r++) {
            for (let c = centerCol - 1; c <= centerCol + 1; c++) {
                if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                    area.push({ row: r, col: c, tile: this.board[r][c] });
                }
            }
        }
        
        // Rotate the area 90 degrees clockwise
        area.forEach(({ row, col }) => {
            this.board[row][col] = null;
        });
        
        area.forEach(({ row, col, tile }, index) => {
            if (tile) {
                const newRow = centerRow - 1 + (index % 3);
                const newCol = centerCol - 1 + Math.floor(index / 3);
                
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    this.board[newRow][newCol] = tile;
                }
            }
        });
        
        this.renderBoard();
    }
    
    useSplitBooster() {
        if (!this.selectedCell) return;
        
        const { row, col } = this.selectedCell;
        const tile = this.board[row][col];
        
        if (tile && tile.value > 1 && tile.state === 'normal') {
            tile.value -= 1;
            this.createParticle(row, col, '✂️');
            this.renderBoard();
        }
    }
    
    useShockwaveBooster() {
        // Clear the bottom row
        for (let col = 0; col < 8; col++) {
            if (this.board[7][col] && this.board[7][col].state !== 'stone') {
                this.board[7][col] = null;
                this.createParticle(7, col, '💥');
            }
        }
        
        setTimeout(() => {
            this.applyGravity();
            this.renderBoard();
        }, 300);
    }
    
    checkGameOver() {
        // Check if board is full
        let hasEmpty = false;
        let hasMoves = false;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (!this.board[row][col]) {
                    hasEmpty = true;
                }
                
                const tile = this.board[row][col];
                if (tile && tile.state === 'normal') {
                    // Check for possible merges
                    const adjacent = this.getAdjacentCells(row, col);
                    for (const { row: r, col: c } of adjacent) {
                        const adjacentTile = this.board[r][c];
                        if (this.canMerge(tile, adjacentTile)) {
                            hasMoves = true;
                            break;
                        }
                    }
                }
                
                if (hasMoves) break;
            }
            if (hasMoves) break;
        }
        
        if (!hasEmpty && !hasMoves) {
            this.endGame();
        }
    }
    
    endGame() {
        this.gameActive = false;
        
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.comboInterval) clearInterval(this.comboInterval);
        
        // Update best score
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore.toString());
        }
        
        // Show game over screen
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('best-combo').textContent = `x${this.bestCombo}`;
        document.getElementById('blast-count').textContent = this.blastCount;
        
        this.showScreen('gameover');
    }
    
    renderBoard() {
        const cells = document.querySelectorAll('.cell');
        
        cells.forEach((cell, index) => {
            const row = Math.floor(index / 8);
            const col = index % 8;
            const tile = this.board[row][col];
            
            cell.innerHTML = '';
            
            if (tile) {
                const tileElement = document.createElement('div');
                tileElement.className = 'tile';
                tileElement.dataset.value = tile.value;
                tileElement.textContent = tile.value;
                
                if (tile.state === 'stone') {
                    tileElement.classList.add('stone');
                } else if (tile.state === 'locked') {
                    tileElement.classList.add('locked');
                }
                
                cell.appendChild(tileElement);
            }
        });
    }
    
    updateDisplay() {
        document.getElementById('current-score').textContent = this.score.toLocaleString();
        document.getElementById('game-mode').textContent = this.gameMode.charAt(0).toUpperCase() + this.gameMode.slice(1);
        
        if (this.gameMode === 'timeattack') {
            document.getElementById('time-remaining').textContent = `${this.timeRemaining}s`;
        } else {
            document.getElementById('time-remaining').textContent = '';
        }
        
        this.updateComboDisplay();
        this.updateBoosterDisplay();
        this.updateNextTilePreview();
        this.updateBestScore();
    }
    
    updateComboDisplay() {
        const comboBar = document.getElementById('combo-bar');
        const comboMultiplierElement = document.getElementById('combo-multiplier');
        
        const progress = this.comboActive ? (this.comboTimer / 8) * 100 : 0;
        comboBar.style.setProperty('--combo-progress', `${progress}%`);
        comboMultiplierElement.textContent = Math.floor(this.comboMultiplier);
    }
    
    updateBoosterDisplay() {
        Object.keys(this.boosters).forEach(type => {
            const countElement = document.getElementById(`${type}-count`);
            const buttonElement = document.getElementById(`${type}-booster`);
            
            countElement.textContent = this.boosters[type];
            buttonElement.disabled = this.boosters[type] <= 0;
        });
    }
    
    updateNextTilePreview() {
        const preview = document.getElementById('next-tile');
        preview.textContent = this.nextTileValue;
        preview.className = 'preview-tile';
        preview.dataset.value = this.nextTileValue;
    }
    
    updateBestScore() {
        document.getElementById('best-score').textContent = this.bestScore.toLocaleString();
    }
    
    createParticle(row, col, content) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const rect = cell.getBoundingClientRect();
        
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.textContent = content;
        particle.style.left = `${rect.left + rect.width / 2}px`;
        particle.style.top = `${rect.top + rect.height / 2}px`;
        
        document.getElementById('particles-container').appendChild(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
    
    createScoreParticle(row, col, score) {
        this.createParticle(row, col, `+${score}`);
    }
    
    createBlastEffect(row, col) {
        // Create multiple particles for blast effect
        const particles = ['💥', '✨', '⭐', '💫'];
        
        particles.forEach((particle, index) => {
            setTimeout(() => {
                this.createParticle(row, col, particle);
            }, index * 100);
        });
    }
    
    playMergeSound(value) {
        if (!this.settings.sound) return;
        
        // Create simple audio feedback using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different tile values
        const frequency = value >= 88 ? 800 : value >= 8 ? 600 : 400 + (value * 50);
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    }
    
    vibrate(pattern) {
        if (!this.settings.vibration || !navigator.vibrate) return;
        navigator.vibrate(pattern);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});