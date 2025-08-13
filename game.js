class FortuneTiger {
    constructor() {
        this.gridSize = 8;
        this.gemTypes = ['tiger', 'ruby', 'emerald', 'sapphire', 'diamond', 'topaz', 'amethyst'];
        this.gemEmojis = {
            'tiger': '🪙',
            'ruby': '💎',
            'emerald': '💚',
            'sapphire': '💙',
            'diamond': '💍',
            'topaz': '🟡',
            'amethyst': '💜'
        };
        
        this.board = [];
        this.selectedGem = null;
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.targetScore = 1000;
        this.isAnimating = false;
        this.isPaused = false;
        
        this.scoreMultipliers = {
            3: 100,
            4: 200,
            5: 400,
            6: 800
        };
        
        this.init();
    }
    
    init() {
        this.showLoadingScreen();
        setTimeout(() => {
            this.hideLoadingScreen();
            this.createBoard();
            this.bindEvents();
            this.updateUI();
        }, 2000);
    }
    
    showLoadingScreen() {
        document.getElementById('loading-screen').classList.remove('hidden');
    }
    
    hideLoadingScreen() {
        document.getElementById('loading-screen').classList.add('hidden');
    }
    
    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        this.board = [];
        
        // Initialize empty board
        for (let row = 0; row < this.gridSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.board[row][col] = null;
            }
        }
        
        // Fill board with gems, ensuring no initial matches
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                let gemType;
                do {
                    gemType = this.getRandomGemType();
                } while (this.wouldCreateMatch(row, col, gemType));
                
                this.board[row][col] = gemType;
                this.createGemElement(row, col, gemType);
            }
        }
    }
    
    createGemElement(row, col, gemType) {
        const gem = document.createElement('div');
        gem.className = `gem ${gemType}`;
        gem.dataset.row = row;
        gem.dataset.col = col;
        gem.textContent = this.gemEmojis[gemType];
        
        // Add touch and click events
        gem.addEventListener('click', () => this.handleGemClick(row, col));
        gem.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleGemClick(row, col);
        });
        
        document.getElementById('game-board').appendChild(gem);
    }
    
    getRandomGemType() {
        return this.gemTypes[Math.floor(Math.random() * this.gemTypes.length)];
    }
    
    wouldCreateMatch(row, col, gemType) {
        // Check horizontal matches
        let count = 1;
        // Check left
        for (let c = col - 1; c >= 0 && this.board[row][c] === gemType; c--) {
            count++;
        }
        // Check right
        for (let c = col + 1; c < this.gridSize && this.board[row][c] === gemType; c++) {
            count++;
        }
        if (count >= 3) return true;
        
        // Check vertical matches
        count = 1;
        // Check up
        for (let r = row - 1; r >= 0 && this.board[r][col] === gemType; r--) {
            count++;
        }
        // Check down
        for (let r = row + 1; r < this.gridSize && this.board[r][col] === gemType; r++) {
            count++;
        }
        return count >= 3;
    }
    
    handleGemClick(row, col) {
        if (this.isAnimating || this.isPaused || this.moves <= 0) return;
        
        const clickedGem = { row, col };
        
        if (!this.selectedGem) {
            this.selectGem(clickedGem);
        } else if (this.selectedGem.row === row && this.selectedGem.col === col) {
            this.deselectGem();
        } else if (this.areAdjacent(this.selectedGem, clickedGem)) {
            this.attemptSwap(this.selectedGem, clickedGem);
        } else {
            this.deselectGem();
            this.selectGem(clickedGem);
        }
    }
    
    selectGem(gem) {
        this.selectedGem = gem;
        const gemElement = this.getGemElement(gem.row, gem.col);
        gemElement.classList.add('selected');
    }
    
    deselectGem() {
        if (this.selectedGem) {
            const gemElement = this.getGemElement(this.selectedGem.row, this.selectedGem.col);
            gemElement.classList.remove('selected');
            this.selectedGem = null;
        }
    }
    
    areAdjacent(gem1, gem2) {
        const rowDiff = Math.abs(gem1.row - gem2.row);
        const colDiff = Math.abs(gem1.col - gem2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    async attemptSwap(gem1, gem2) {
        this.isAnimating = true;
        this.deselectGem();
        
        // Perform swap
        this.swapGems(gem1, gem2);
        
        // Check for matches
        const matches = this.findMatches();
        
        if (matches.length > 0) {
            this.moves--;
            await this.processMatches(matches);
            await this.dropGems();
            await this.fillBoard();
            
            // Continue processing matches until no more exist
            let newMatches;
            do {
                newMatches = this.findMatches();
                if (newMatches.length > 0) {
                    await this.processMatches(newMatches);
                    await this.dropGems();
                    await this.fillBoard();
                }
            } while (newMatches.length > 0);
            
            this.checkGameState();
        } else {
            // No matches, swap back
            await this.animateSwapBack(gem1, gem2);
            this.swapGems(gem1, gem2);
        }
        
        this.isAnimating = false;
        this.updateUI();
    }
    
    swapGems(gem1, gem2) {
        const temp = this.board[gem1.row][gem1.col];
        this.board[gem1.row][gem1.col] = this.board[gem2.row][gem2.col];
        this.board[gem2.row][gem2.col] = temp;
        
        // Update visual elements
        this.updateGemElement(gem1.row, gem1.col);
        this.updateGemElement(gem2.row, gem2.col);
    }
    
    updateGemElement(row, col) {
        const gemElement = this.getGemElement(row, col);
        const gemType = this.board[row][col];
        gemElement.className = `gem ${gemType}`;
        gemElement.textContent = this.gemEmojis[gemType];
    }
    
    getGemElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    findMatches() {
        const matches = [];
        
        // Find horizontal matches
        for (let row = 0; row < this.gridSize; row++) {
            let count = 1;
            let currentMatch = [{ row, col: 0 }];
            
            for (let col = 1; col < this.gridSize; col++) {
                if (this.board[row][col] === this.board[row][col - 1]) {
                    count++;
                    currentMatch.push({ row, col });
                } else {
                    if (count >= 3) {
                        matches.push(...currentMatch);
                    }
                    count = 1;
                    currentMatch = [{ row, col }];
                }
            }
            if (count >= 3) {
                matches.push(...currentMatch);
            }
        }
        
        // Find vertical matches
        for (let col = 0; col < this.gridSize; col++) {
            let count = 1;
            let currentMatch = [{ row: 0, col }];
            
            for (let row = 1; row < this.gridSize; row++) {
                if (this.board[row][col] === this.board[row - 1][col]) {
                    count++;
                    currentMatch.push({ row, col });
                } else {
                    if (count >= 3) {
                        matches.push(...currentMatch);
                    }
                    count = 1;
                    currentMatch = [{ row, col }];
                }
            }
            if (count >= 3) {
                matches.push(...currentMatch);
            }
        }
        
        // Remove duplicates
        return matches.filter((match, index, self) => 
            index === self.findIndex(m => m.row === match.row && m.col === match.col)
        );
    }
    
    async processMatches(matches) {
        if (matches.length === 0) return;
        
        // Calculate score
        const matchGroups = this.groupMatches(matches);
        let scoreGain = 0;
        
        matchGroups.forEach(group => {
            const multiplier = this.scoreMultipliers[group.length] || this.scoreMultipliers[6];
            scoreGain += multiplier;
        });
        
        this.score += scoreGain;
        
        // Animate matches
        matches.forEach(match => {
            const gemElement = this.getGemElement(match.row, match.col);
            gemElement.classList.add('matching');
        });
        
        // Wait for animation
        await this.wait(300);
        
        // Remove matched gems
        matches.forEach(match => {
            this.board[match.row][match.col] = null;
            const gemElement = this.getGemElement(match.row, match.col);
            gemElement.style.opacity = '0';
        });
    }
    
    groupMatches(matches) {
        const groups = [];
        const processed = new Set();
        
        matches.forEach(match => {
            const key = `${match.row},${match.col}`;
            if (processed.has(key)) return;
            
            const group = [match];
            processed.add(key);
            
            // Find connected matches
            const queue = [match];
            while (queue.length > 0) {
                const current = queue.shift();
                const adjacent = matches.filter(m => 
                    !processed.has(`${m.row},${m.col}`) &&
                    this.areAdjacent(current, m)
                );
                
                adjacent.forEach(adj => {
                    const adjKey = `${adj.row},${adj.col}`;
                    if (!processed.has(adjKey)) {
                        group.push(adj);
                        processed.add(adjKey);
                        queue.push(adj);
                    }
                });
            }
            
            groups.push(group);
        });
        
        return groups;
    }
    
    async dropGems() {
        let gemsDropped = false;
        
        for (let col = 0; col < this.gridSize; col++) {
            const column = [];
            
            // Collect non-null gems from bottom to top
            for (let row = this.gridSize - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    column.push(this.board[row][col]);
                }
            }
            
            // Clear column
            for (let row = 0; row < this.gridSize; row++) {
                this.board[row][col] = null;
            }
            
            // Place gems from bottom up
            for (let i = 0; i < column.length; i++) {
                const row = this.gridSize - 1 - i;
                this.board[row][col] = column[i];
                
                // Animate falling
                const gemElement = this.getGemElement(row, col);
                gemElement.classList.add('falling');
                this.updateGemElement(row, col);
                gemsDropped = true;
            }
        }
        
        if (gemsDropped) {
            await this.wait(300);
            // Remove falling animation class
            document.querySelectorAll('.gem.falling').forEach(gem => {
                gem.classList.remove('falling');
            });
        }
    }
    
    async fillBoard() {
        let gemsFilled = false;
        
        for (let col = 0; col < this.gridSize; col++) {
            for (let row = 0; row < this.gridSize; row++) {
                if (this.board[row][col] === null) {
                    let gemType;
                    do {
                        gemType = this.getRandomGemType();
                    } while (this.wouldCreateMatch(row, col, gemType));
                    
                    this.board[row][col] = gemType;
                    const gemElement = this.getGemElement(row, col);
                    gemElement.style.opacity = '1';
                    gemElement.classList.add('falling');
                    this.updateGemElement(row, col);
                    gemsFilled = true;
                }
            }
        }
        
        if (gemsFilled) {
            await this.wait(300);
            document.querySelectorAll('.gem.falling').forEach(gem => {
                gem.classList.remove('falling');
            });
        }
    }
    
    async animateSwapBack(gem1, gem2) {
        await this.wait(200);
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    checkGameState() {
        if (this.score >= this.targetScore) {
            this.levelComplete();
        } else if (this.moves <= 0) {
            this.gameOver();
        }
    }
    
    levelComplete() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');
        const finalScore = document.getElementById('final-score');
        
        title.textContent = 'Level Complete! 🎉';
        message.textContent = `Amazing! You've completed level ${this.level}!`;
        finalScore.textContent = this.score;
        
        modal.classList.remove('hidden');
    }
    
    gameOver() {
        const modal = document.getElementById('game-over-modal');
        const title = document.getElementById('game-over-title');
        const message = document.getElementById('game-over-message');
        const finalScore = document.getElementById('final-score');
        const nextLevelBtn = document.getElementById('next-level-btn');
        
        title.textContent = 'Game Over 😔';
        message.textContent = 'No more moves! Try again to reach the target score.';
        finalScore.textContent = this.score;
        nextLevelBtn.style.display = 'none';
        
        modal.classList.remove('hidden');
    }
    
    nextLevel() {
        this.level++;
        this.moves = Math.max(25, 30 - this.level);
        this.targetScore = this.targetScore + (this.level * 500);
        this.hideModal('game-over-modal');
        this.createBoard();
        this.updateUI();
    }
    
    restartGame() {
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.targetScore = 1000;
        this.hideModal('game-over-modal');
        this.createBoard();
        this.updateUI();
    }
    
    shuffleBoard() {
        if (this.isAnimating || this.moves <= 0) return;
        
        const gems = [];
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                gems.push(this.board[row][col]);
            }
        }
        
        // Fisher-Yates shuffle
        for (let i = gems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [gems[i], gems[j]] = [gems[j], gems[i]];
        }
        
        // Redistribute gems
        let index = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.board[row][col] = gems[index++];
                this.updateGemElement(row, col);
            }
        }
        
        this.moves = Math.max(1, this.moves - 1);
        this.updateUI();
    }
    
    showHint() {
        if (this.isAnimating) return;
        
        // Find possible moves
        const possibleMoves = this.findPossibleMoves();
        
        if (possibleMoves.length > 0) {
            const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            const gem1Element = this.getGemElement(randomMove.gem1.row, randomMove.gem1.col);
            const gem2Element = this.getGemElement(randomMove.gem2.row, randomMove.gem2.col);
            
            gem1Element.classList.add('highlighted');
            gem2Element.classList.add('highlighted');
            
            setTimeout(() => {
                gem1Element.classList.remove('highlighted');
                gem2Element.classList.remove('highlighted');
            }, 2000);
        }
    }
    
    findPossibleMoves() {
        const moves = [];
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                // Check right
                if (col < this.gridSize - 1) {
                    const gem1 = { row, col };
                    const gem2 = { row, col: col + 1 };
                    
                    this.swapGems(gem1, gem2);
                    if (this.findMatches().length > 0) {
                        moves.push({ gem1, gem2 });
                    }
                    this.swapGems(gem1, gem2); // Swap back
                }
                
                // Check down
                if (row < this.gridSize - 1) {
                    const gem1 = { row, col };
                    const gem2 = { row: row + 1, col };
                    
                    this.swapGems(gem1, gem2);
                    if (this.findMatches().length > 0) {
                        moves.push({ gem1, gem2 });
                    }
                    this.swapGems(gem1, gem2); // Swap back
                }
            }
        }
        
        return moves;
    }
    
    pauseGame() {
        this.isPaused = true;
        document.getElementById('pause-modal').classList.remove('hidden');
    }
    
    resumeGame() {
        this.isPaused = false;
        this.hideModal('pause-modal');
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('moves').textContent = this.moves;
        document.getElementById('target-score').textContent = `Target: ${this.targetScore}`;
        
        // Update progress bar
        const progress = Math.min(100, (this.score / this.targetScore) * 100);
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Update button states
        document.getElementById('shuffle-btn').disabled = this.moves <= 0 || this.isAnimating;
        document.getElementById('hint-btn').disabled = this.moves <= 0 || this.isAnimating;
    }
    
    bindEvents() {
        // Control buttons
        document.getElementById('shuffle-btn').addEventListener('click', () => this.shuffleBoard());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        
        // Modal buttons
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-game-btn').addEventListener('click', () => this.restartGame());
        
        // Prevent context menu on long press
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = new Date().getTime();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FortuneTiger();
});