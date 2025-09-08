// Game Board - Link-3 Mechanics
export class GameBoard {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('game-board');
        this.ctx = this.canvas.getContext('2d');
        
        this.rows = 9;
        this.cols = 7;
        this.tileSize = 60;
        this.tiles = [];
        this.selectedTiles = [];
        this.isDrawing = false;
        this.powerUpMode = null;
        this.foggedTiles = new Set();
        this.lastMove = null;
        
        this.tileTypes = ['🎬', '🎭', '🎪', '🎨', '🎯', '⭐'];
        this.wildTile = '🌟';
        
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        // Set canvas size
        this.canvas.width = this.cols * this.tileSize;
        this.canvas.height = this.rows * this.tileSize;
        
        // High DPI support
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleEnd());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleStart(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.handleEnd());
    }
    
    init() {
        this.tiles = [];
        this.selectedTiles = [];
        this.foggedTiles.clear();
        
        // Generate initial board
        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.tiles[row][col] = {
                    type: this.getRandomTileType(),
                    x: col * this.tileSize,
                    y: row * this.tileSize,
                    row: row,
                    col: col,
                    scale: 1,
                    rotation: 0,
                    falling: false,
                    matched: false
                };
            }
        }
        
        this.draw();
    }
    
    getRandomTileType() {
        return this.tileTypes[Math.floor(Math.random() * this.tileTypes.length)];
    }
    
    handleStart(e) {
        if (this.game.isPaused) return;
        
        const pos = this.getMousePos(e);
        const tile = this.getTileAt(pos.x, pos.y);
        
        if (tile) {
            if (this.powerUpMode) {
                this.handlePowerUpClick(tile);
            } else {
                this.isDrawing = true;
                this.selectedTiles = [tile];
                tile.selected = true;
                this.draw();
            }
        }
    }
    
    handleMove(e) {
        if (!this.isDrawing || this.game.isPaused) return;
        
        const pos = this.getMousePos(e);
        const tile = this.getTileAt(pos.x, pos.y);
        
        if (tile && !tile.selected) {
            const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
            
            // Check if adjacent and same type (or wild)
            if (this.isAdjacent(lastTile, tile) && this.canConnect(lastTile, tile)) {
                this.selectedTiles.push(tile);
                tile.selected = true;
                
                // Check for loop
                if (this.selectedTiles.length >= 4) {
                    const firstTile = this.selectedTiles[0];
                    if (this.isAdjacent(tile, firstTile)) {
                        this.completeLoop();
                    }
                }
                
                this.draw();
            }
        }
    }
    
    handleEnd() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.selectedTiles.length >= 3) {
            const isLoop = this.checkLoop();
            this.lastMove = [...this.selectedTiles];
            this.game.handleMove(this.selectedTiles, isLoop);
            this.clearSelectedTiles(isLoop);
        } else {
            // Reset selection
            this.selectedTiles.forEach(tile => {
                tile.selected = false;
            });
            this.selectedTiles = [];
            this.draw();
        }
    }
    
    handlePowerUpClick(tile) {
        this.game.applyPowerUpEffect([tile]);
        this.powerUpMode = null;
        this.canvas.style.cursor = 'default';
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }
    
    getTileAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.tiles[row][col];
        }
        return null;
    }
    
    isAdjacent(tile1, tile2) {
        const dx = Math.abs(tile1.col - tile2.col);
        const dy = Math.abs(tile1.row - tile2.row);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }
    
    canConnect(tile1, tile2) {
        return tile1.type === tile2.type || 
               tile1.type === this.wildTile || 
               tile2.type === this.wildTile;
    }
    
    checkLoop() {
        if (this.selectedTiles.length < 4) return false;
        
        const first = this.selectedTiles[0];
        const last = this.selectedTiles[this.selectedTiles.length - 1];
        return this.isAdjacent(first, last);
    }
    
    completeLoop() {
        // Mark all tiles inside the loop for clearing
        const loopTiles = new Set(this.selectedTiles.map(t => `${t.row},${t.col}`));
        
        // Find min/max bounds
        let minRow = this.rows, maxRow = 0;
        let minCol = this.cols, maxCol = 0;
        
        this.selectedTiles.forEach(tile => {
            minRow = Math.min(minRow, tile.row);
            maxRow = Math.max(maxRow, tile.row);
            minCol = Math.min(minCol, tile.col);
            maxCol = Math.max(maxCol, tile.col);
        });
        
        // Mark tiles inside the loop
        for (let row = minRow; row <= maxRow; row++) {
            for (let col = minCol; col <= maxCol; col++) {
                if (this.isInsideLoop(row, col, loopTiles)) {
                    const tile = this.tiles[row][col];
                    if (tile && !tile.selected) {
                        this.selectedTiles.push(tile);
                        tile.selected = true;
                    }
                }
            }
        }
    }
    
    isInsideLoop(row, col, loopTiles) {
        // Simple point-in-polygon test
        let inside = false;
        let intersections = 0;
        
        // Cast ray to the right and count intersections
        for (let c = col + 1; c < this.cols; c++) {
            if (loopTiles.has(`${row},${c}`)) {
                intersections++;
            }
        }
        
        return intersections % 2 === 1;
    }
    
    clearSelectedTiles(isLoop) {
        // Animate tile removal
        this.selectedTiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.matched = true;
                tile.scale = 0;
                this.draw();
            }, index * 30);
        });
        
        // After animation, drop tiles and refill
        setTimeout(() => {
            this.dropTiles();
            this.refillBoard();
            this.selectedTiles = [];
            this.draw();
        }, this.selectedTiles.length * 30 + 200);
    }
    
    dropTiles() {
        for (let col = 0; col < this.cols; col++) {
            let emptyRow = this.rows - 1;
            
            for (let row = this.rows - 1; row >= 0; row--) {
                const tile = this.tiles[row][col];
                
                if (!tile.matched) {
                    if (row !== emptyRow) {
                        this.tiles[emptyRow][col] = tile;
                        tile.row = emptyRow;
                        tile.y = emptyRow * this.tileSize;
                        tile.falling = true;
                    }
                    emptyRow--;
                }
            }
            
            // Clear empty spaces
            for (let row = emptyRow; row >= 0; row--) {
                this.tiles[row][col] = null;
            }
        }
    }
    
    refillBoard() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.tiles[row][col]) {
                    this.tiles[row][col] = {
                        type: this.getRandomTileType(),
                        x: col * this.tileSize,
                        y: row * this.tileSize,
                        row: row,
                        col: col,
                        scale: 0,
                        rotation: 0,
                        falling: true,
                        matched: false,
                        selected: false
                    };
                    
                    // Animate new tiles
                    setTimeout(() => {
                        this.tiles[row][col].scale = 1;
                        this.tiles[row][col].falling = false;
                        this.draw();
                    }, (row + 1) * 50);
                }
            }
        }
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let row = 0; row <= this.rows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.tileSize);
            this.ctx.lineTo(this.cols * this.tileSize, row * this.tileSize);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= this.cols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.tileSize, 0);
            this.ctx.lineTo(col * this.tileSize, this.rows * this.tileSize);
            this.ctx.stroke();
        }
        
        // Draw connection lines
        if (this.selectedTiles.length > 1) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.ctx.beginPath();
            this.selectedTiles.forEach((tile, index) => {
                const x = tile.x + this.tileSize / 2;
                const y = tile.y + this.tileSize / 2;
                
                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });
            this.ctx.stroke();
        }
        
        // Draw tiles
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile && !tile.matched) {
                    this.drawTile(tile);
                }
            }
        }
    }
    
    drawTile(tile) {
        const x = tile.x + this.tileSize / 2;
        const y = tile.y + this.tileSize / 2;
        const size = this.tileSize * 0.8 * tile.scale;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(tile.rotation);
        
        // Draw tile background
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        
        if (tile.selected) {
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(1, '#FFA500');
        } else if (tile.type === this.wildTile) {
            gradient.addColorStop(0, '#FF69B4');
            gradient.addColorStop(1, '#8B008B');
        } else {
            gradient.addColorStop(0, '#8B4789');
            gradient.addColorStop(1, '#663399');
        }
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw tile icon
        this.ctx.font = `${size * 0.6}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(tile.type, 0, 0);
        
        // Draw fog if applicable
        if (this.foggedTiles.has(`${tile.row},${tile.col}`)) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    // Power-up effects
    clearArea(centerTile, radius) {
        const tiles = [];
        const centerRow = centerTile.row;
        const centerCol = centerTile.col;
        
        for (let row = Math.max(0, centerRow - radius + 1); 
             row < Math.min(this.rows, centerRow + radius); row++) {
            for (let col = Math.max(0, centerCol - radius + 1); 
                 col < Math.min(this.cols, centerCol + radius); col++) {
                const tile = this.tiles[row][col];
                if (tile && !tile.matched) {
                    tiles.push(tile);
                    tile.selected = true;
                }
            }
        }
        
        this.clearSelectedTiles(false);
    }
    
    clearType(type) {
        const tiles = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile && tile.type === type && !tile.matched) {
                    tiles.push(tile);
                    tile.selected = true;
                }
            }
        }
        
        this.selectedTiles = tiles;
        this.clearSelectedTiles(false);
    }
    
    clearLine(tile) {
        const tiles = [];
        const isHorizontal = Math.random() > 0.5;
        
        if (isHorizontal) {
            for (let col = 0; col < this.cols; col++) {
                const t = this.tiles[tile.row][col];
                if (t && !t.matched) {
                    tiles.push(t);
                    t.selected = true;
                }
            }
        } else {
            for (let row = 0; row < this.rows; row++) {
                const t = this.tiles[row][tile.col];
                if (t && !t.matched) {
                    tiles.push(t);
                    t.selected = true;
                }
            }
        }
        
        this.selectedTiles = tiles;
        this.clearSelectedTiles(false);
    }
    
    undoMove() {
        if (this.lastMove) {
            // Restore tiles from last move
            // This is a simplified undo - in a real game you'd store the full board state
            this.init();
        }
    }
    
    addWildTiles(count) {
        const positions = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col] && !this.tiles[row][col].matched) {
                    positions.push({row, col});
                }
            }
        }
        
        // Randomly select tiles to convert to wild
        for (let i = 0; i < Math.min(count, positions.length); i++) {
            const index = Math.floor(Math.random() * positions.length);
            const pos = positions.splice(index, 1)[0];
            this.tiles[pos.row][pos.col].type = this.wildTile;
        }
        
        this.draw();
    }
    
    applyFog(duration) {
        // Randomly fog some tiles
        const count = Math.floor(this.rows * this.cols * 0.3);
        
        for (let i = 0; i < count; i++) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            this.foggedTiles.add(`${row},${col}`);
        }
        
        this.draw();
        
        // Clear fog after duration
        setTimeout(() => {
            this.foggedTiles.clear();
            this.draw();
        }, duration);
    }
    
    shuffleBoard() {
        const allTiles = [];
        
        // Collect all tiles
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col] && !this.tiles[row][col].matched) {
                    allTiles.push(this.tiles[row][col].type);
                }
            }
        }
        
        // Shuffle
        for (let i = allTiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
        }
        
        // Reassign
        let index = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col] && !this.tiles[row][col].matched) {
                    this.tiles[row][col].type = allTiles[index++];
                }
            }
        }
        
        this.draw();
    }
    
    setPowerUpMode(mode) {
        this.powerUpMode = mode;
        this.canvas.style.cursor = 'crosshair';
    }
}