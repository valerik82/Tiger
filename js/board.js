// Hollywood Crazy Wheel - Game Board System

class GameBoard {
    constructor(canvas, cols = GAME_CONFIG.BOARD_COLS, rows = GAME_CONFIG.BOARD_ROWS) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cols = cols;
        this.rows = rows;
        this.tileSize = GAME_CONFIG.TILE_SIZE;
        this.tilePadding = GAME_CONFIG.TILE_PADDING;
        
        // Calculate board dimensions and positioning
        this.boardWidth = cols * (this.tileSize + this.tilePadding) - this.tilePadding;
        this.boardHeight = rows * (this.tileSize + this.tilePadding) - this.tilePadding;
        this.offsetX = (canvas.width - this.boardWidth) / 2;
        this.offsetY = (canvas.height - this.boardHeight) / 2;
        
        // Board state
        this.tiles = [];
        this.selectedTiles = [];
        this.chainPath = [];
        this.isDrawing = false;
        this.lastHoveredTile = null;
        
        // Animations
        this.animations = [];
        this.particles = [];
        this.fallingTiles = [];
        
        // Event handling
        this.setupEventListeners();
        
        // Initialize empty board
        this.initializeBoard();
    }

    initializeBoard() {
        this.tiles = [];
        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.tiles[row][col] = this.createRandomTile(col, row);
            }
        }
        
        // Ensure no initial matches
        this.removeInitialMatches();
    }

    createRandomTile(col, row) {
        const tileTypes = Object.values(TILE_TYPES).filter(t => t.id < 4); // Exclude WILD and PROP for random generation
        const type = tileTypes[Utils.randomInt(0, tileTypes.length - 1)];
        
        return {
            col,
            row,
            type,
            x: this.offsetX + col * (this.tileSize + this.tilePadding),
            y: this.offsetY + row * (this.tileSize + this.tilePadding),
            scale: 1,
            rotation: 0,
            alpha: 1,
            isSelected: false,
            isMatched: false,
            isWild: type.id === TILE_TYPES.WILD.id,
            isProp: type.id === TILE_TYPES.PROP.id,
            animation: null
        };
    }

    removeInitialMatches() {
        let hasMatches = true;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (hasMatches && attempts < maxAttempts) {
            hasMatches = false;
            attempts++;
            
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    const tile = this.tiles[row][col];
                    if (this.hasMatchAt(col, row)) {
                        tile.type = this.getRandomNonMatchingType(col, row);
                        hasMatches = true;
                    }
                }
            }
        }
    }

    hasMatchAt(col, row) {
        const tile = this.tiles[row][col];
        if (!tile || tile.isWild || tile.isProp) return false;
        
        // Check horizontal match
        let horizontalCount = 1;
        for (let c = col - 1; c >= 0 && this.tiles[row][c].type.id === tile.type.id; c--) {
            horizontalCount++;
        }
        for (let c = col + 1; c < this.cols && this.tiles[row][c].type.id === tile.type.id; c++) {
            horizontalCount++;
        }
        
        // Check vertical match
        let verticalCount = 1;
        for (let r = row - 1; r >= 0 && this.tiles[r][col].type.id === tile.type.id; r--) {
            verticalCount++;
        }
        for (let r = row + 1; r < this.rows && this.tiles[r][col].type.id === tile.type.id; r++) {
            verticalCount++;
        }
        
        return horizontalCount >= 3 || verticalCount >= 3;
    }

    getRandomNonMatchingType(col, row) {
        const tileTypes = Object.values(TILE_TYPES).filter(t => t.id < 4);
        const excludeTypes = [];
        
        // Check adjacent tiles to avoid creating matches
        const adjacentPositions = [
            [col - 1, row], [col + 1, row],
            [col, row - 1], [col, row + 1]
        ];
        
        adjacentPositions.forEach(([c, r]) => {
            if (c >= 0 && c < this.cols && r >= 0 && r < this.rows) {
                const adjacentTile = this.tiles[r][c];
                if (adjacentTile && !excludeTypes.includes(adjacentTile.type.id)) {
                    excludeTypes.push(adjacentTile.type.id);
                }
            }
        });
        
        const availableTypes = tileTypes.filter(t => !excludeTypes.includes(t.id));
        return availableTypes.length > 0 ? 
            availableTypes[Utils.randomInt(0, availableTypes.length - 1)] : 
            tileTypes[0];
    }

    setupEventListeners() {
        const isTouchDevice = Utils.isTouchDevice();
        
        if (isTouchDevice) {
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        } else {
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        }
    }

    handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const pos = Utils.getCanvasPosition(this.canvas, touch.clientX, touch.clientY);
        this.startChain(pos.x, pos.y);
    }

    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const pos = Utils.getCanvasPosition(this.canvas, touch.clientX, touch.clientY);
        this.updateChain(pos.x, pos.y);
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.endChain();
    }

    handleMouseDown(event) {
        const pos = Utils.getCanvasPosition(this.canvas, event.clientX, event.clientY);
        this.startChain(pos.x, pos.y);
    }

    handleMouseMove(event) {
        const pos = Utils.getCanvasPosition(this.canvas, event.clientX, event.clientY);
        this.updateChain(pos.x, pos.y);
    }

    handleMouseUp(event) {
        this.endChain();
    }

    handleMouseLeave(event) {
        this.endChain();
    }

    startChain(x, y) {
        const tile = this.getTileAt(x, y);
        if (!tile || tile.isProp) return;
        
        this.isDrawing = true;
        this.selectedTiles = [tile];
        this.chainPath = [{ x: tile.x + this.tileSize / 2, y: tile.y + this.tileSize / 2 }];
        tile.isSelected = true;
        this.lastHoveredTile = tile;
        
        audioManager.playSound('tile_select');
        Utils.vibrate([50]);
    }

    updateChain(x, y) {
        if (!this.isDrawing) return;
        
        const tile = this.getTileAt(x, y);
        
        if (tile && tile !== this.lastHoveredTile) {
            if (this.canAddToChain(tile)) {
                this.addTileToChain(tile);
            } else if (this.canRemoveFromChain(tile)) {
                this.removeTileFromChain();
            }
        }
        
        // Update chain path end point
        if (this.chainPath.length > 0) {
            this.chainPath[this.chainPath.length - 1] = { x, y };
        }
    }

    canAddToChain(tile) {
        if (!tile || tile.isProp || tile.isSelected) return false;
        
        const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
        if (!lastTile) return false;
        
        // Check if tiles are adjacent
        const dx = Math.abs(tile.col - lastTile.col);
        const dy = Math.abs(tile.row - lastTile.row);
        const isAdjacent = (dx <= 1 && dy <= 1) && (dx + dy > 0);
        
        if (!isAdjacent) return false;
        
        // Check if tile types match (or if either is wild)
        return tile.isWild || lastTile.isWild || tile.type.id === lastTile.type.id;
    }

    canRemoveFromChain(tile) {
        if (this.selectedTiles.length <= 1) return false;
        
        const secondLastTile = this.selectedTiles[this.selectedTiles.length - 2];
        return tile === secondLastTile;
    }

    addTileToChain(tile) {
        this.selectedTiles.push(tile);
        this.chainPath.push({ x: tile.x + this.tileSize / 2, y: tile.y + this.tileSize / 2 });
        tile.isSelected = true;
        this.lastHoveredTile = tile;
        
        audioManager.playSound('tile_select');
        Utils.vibrate([30]);
        
        // Add scale animation
        this.addTileAnimation(tile, 'scale', 1.2, 0.1);
    }

    removeTileFromChain() {
        if (this.selectedTiles.length <= 1) return;
        
        const removedTile = this.selectedTiles.pop();
        this.chainPath.pop();
        removedTile.isSelected = false;
        
        this.lastHoveredTile = this.selectedTiles[this.selectedTiles.length - 1];
        
        // Reset scale
        this.addTileAnimation(removedTile, 'scale', 1, 0.1);
    }

    endChain() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.selectedTiles.length >= GAME_CONFIG.CHAIN_MIN_LENGTH) {
            this.executeChain();
        } else {
            this.clearSelection();
        }
        
        this.chainPath = [];
    }

    executeChain() {
        const chainLength = this.selectedTiles.length;
        const baseScore = this.calculateChainScore();
        
        // Check for closed loop (Director's Cut)
        const isClosedLoop = this.isChainClosedLoop();
        
        // Mark tiles for removal
        this.selectedTiles.forEach(tile => {
            tile.isMatched = true;
            this.addTileAnimation(tile, 'scale', 0, 0.3);
            this.createParticleEffect(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, tile.type.color);
        });
        
        // Handle closed loop special effect
        if (isClosedLoop) {
            this.executeDirectorsCut();
        }
        
        // Create wild cameras for long chains
        if (chainLength >= 5) {
            this.createWildCamera();
        }
        
        // Play sound and vibration
        audioManager.playSound('chain_complete');
        Utils.vibrate([100, 50, 100]);
        
        // Schedule tile removal and refill
        setTimeout(() => {
            this.removeTiles();
            this.applyGravity();
            this.refillBoard();
            this.clearSelection();
        }, 300);
        
        // Trigger game events
        if (window.game) {
            window.game.onChainComplete(chainLength, baseScore, isClosedLoop);
        }
    }

    isChainClosedLoop() {
        if (this.selectedTiles.length < 4) return false;
        
        const firstTile = this.selectedTiles[0];
        const lastTile = this.selectedTiles[this.selectedTiles.length - 1];
        
        // Check if first and last tiles are adjacent
        const dx = Math.abs(firstTile.col - lastTile.col);
        const dy = Math.abs(firstTile.row - lastTile.row);
        
        return (dx <= 1 && dy <= 1) && (dx + dy > 0);
    }

    executeDirectorsCut() {
        // Find tiles inside the loop and mark them for removal
        const loopTiles = this.findTilesInsideLoop();
        loopTiles.forEach(tile => {
            if (!tile.isMatched) {
                tile.isMatched = true;
                this.addTileAnimation(tile, 'scale', 0, 0.3);
                this.createParticleEffect(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, COLORS.GOLD);
            }
        });
        
        // Bonus score for Director's Cut
        if (window.game) {
            window.game.addScore(loopTiles.length * 100);
        }
    }

    findTilesInsideLoop() {
        // Simple implementation: find tiles surrounded by selected tiles
        const insideTiles = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (!tile.isSelected && this.isTileInsideLoop(tile)) {
                    insideTiles.push(tile);
                }
            }
        }
        
        return insideTiles;
    }

    isTileInsideLoop(tile) {
        // Ray casting algorithm to determine if point is inside polygon
        const point = { x: tile.col, y: tile.row };
        const polygon = this.selectedTiles.map(t => ({ x: t.col, y: t.row }));
        
        let inside = false;
        let j = polygon.length - 1;
        
        for (let i = 0; i < polygon.length; i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            if (((yi > point.y) !== (yj > point.y)) && 
                (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
            j = i;
        }
        
        return inside;
    }

    createWildCamera() {
        // Find a good position for wild camera
        const availablePositions = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (!tile.isMatched && !tile.isWild) {
                    availablePositions.push({ col, row });
                }
            }
        }
        
        if (availablePositions.length > 0) {
            const pos = availablePositions[Utils.randomInt(0, availablePositions.length - 1)];
            const tile = this.tiles[pos.row][pos.col];
            tile.type = TILE_TYPES.WILD;
            tile.isWild = true;
            
            this.addTileAnimation(tile, 'scale', 1.5, 0.3);
            this.createParticleEffect(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, COLORS.WHITE);
        }
    }

    calculateChainScore() {
        const baseScore = this.selectedTiles.length * 10;
        const typeBonus = this.getChainTypeBonus();
        const lengthMultiplier = Math.max(1, this.selectedTiles.length - 2);
        
        return Math.floor(baseScore * lengthMultiplier * typeBonus);
    }

    getChainTypeBonus() {
        // Bonus for chaining specific tile types
        const uniqueTypes = new Set(this.selectedTiles.map(t => t.type.id));
        if (uniqueTypes.size === 1) return 1.5; // Same type bonus
        if (uniqueTypes.has(TILE_TYPES.WILD.id)) return 1.3; // Wild bonus
        return 1.0;
    }

    removeTiles() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.tiles[row][col].isMatched) {
                    this.tiles[row][col] = null;
                }
            }
        }
    }

    applyGravity() {
        for (let col = 0; col < this.cols; col++) {
            let writeIndex = this.rows - 1;
            
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.tiles[row][col] !== null) {
                    if (writeIndex !== row) {
                        this.tiles[writeIndex][col] = this.tiles[row][col];
                        this.tiles[row][col] = null;
                        
                        // Update tile position
                        const tile = this.tiles[writeIndex][col];
                        tile.row = writeIndex;
                        tile.y = this.offsetY + writeIndex * (this.tileSize + this.tilePadding);
                        
                        // Add falling animation
                        this.addTileAnimation(tile, 'y', tile.y, 0.3);
                    }
                    writeIndex--;
                }
            }
        }
    }

    refillBoard() {
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows; row++) {
                if (this.tiles[row][col] === null) {
                    this.tiles[row][col] = this.createRandomTile(col, row);
                    
                    // Start tiles above the board and animate them falling
                    const tile = this.tiles[row][col];
                    tile.y = this.offsetY - (this.rows - row) * (this.tileSize + this.tilePadding);
                    this.addTileAnimation(tile, 'y', this.offsetY + row * (this.tileSize + this.tilePadding), 0.5);
                }
            }
        }
    }

    clearSelection() {
        this.selectedTiles.forEach(tile => {
            tile.isSelected = false;
            this.addTileAnimation(tile, 'scale', 1, 0.1);
        });
        this.selectedTiles = [];
        this.lastHoveredTile = null;
    }

    getTileAt(x, y) {
        const col = Math.floor((x - this.offsetX) / (this.tileSize + this.tilePadding));
        const row = Math.floor((y - this.offsetY) / (this.tileSize + this.tilePadding));
        
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const tile = this.tiles[row][col];
            if (tile) {
                // Check if click is within tile bounds
                const tileX = tile.x;
                const tileY = tile.y;
                if (x >= tileX && x <= tileX + this.tileSize && 
                    y >= tileY && y <= tileY + this.tileSize) {
                    return tile;
                }
            }
        }
        
        return null;
    }

    addTileAnimation(tile, property, targetValue, duration) {
        // Remove existing animation for this property
        tile.animation = tile.animation || {};
        
        tile.animation[property] = {
            startValue: tile[property],
            targetValue,
            duration,
            elapsed: 0
        };
    }

    createParticleEffect(x, y, color) {
        for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / GAME_CONFIG.PARTICLE_COUNT;
            const speed = Utils.random(50, 150);
            const particle = Utils.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                Utils.random(2, 4),
                Utils.random(0.5, 1.0)
            );
            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        // Update tile animations
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile && tile.animation) {
                    this.updateTileAnimations(tile, deltaTime);
                }
            }
        }
        
        // Update particles
        this.particles = this.particles.filter(particle => Utils.updateParticle(particle, deltaTime));
    }

    updateTileAnimations(tile, deltaTime) {
        for (const property in tile.animation) {
            const anim = tile.animation[property];
            anim.elapsed += deltaTime;
            
            const progress = Math.min(anim.elapsed / anim.duration, 1);
            const easedProgress = Utils.easeOutCubic(progress);
            
            tile[property] = Utils.lerp(anim.startValue, anim.targetValue, easedProgress);
            
            if (progress >= 1) {
                tile[property] = anim.targetValue;
                delete tile.animation[property];
            }
        }
        
        // Clean up empty animation object
        if (Object.keys(tile.animation).length === 0) {
            tile.animation = null;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw board background
        this.drawBoardBackground();
        
        // Draw tiles
        this.drawTiles();
        
        // Draw chain path
        this.drawChainPath();
        
        // Draw particles
        this.drawParticles();
    }

    drawBoardBackground() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(
            this.offsetX - 10,
            this.offsetY - 10,
            this.boardWidth + 20,
            this.boardHeight + 20
        );
    }

    drawTiles() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile) {
                    this.drawTile(tile);
                }
            }
        }
    }

    drawTile(tile) {
        this.ctx.save();
        
        const centerX = tile.x + this.tileSize / 2;
        const centerY = tile.y + this.tileSize / 2;
        
        this.ctx.translate(centerX, centerY);
        this.ctx.scale(tile.scale, tile.scale);
        this.ctx.rotate(tile.rotation);
        this.ctx.globalAlpha = tile.alpha;
        
        // Draw tile background
        this.ctx.fillStyle = tile.isSelected ? COLORS.GOLD : tile.type.color;
        this.ctx.fillRect(-this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);
        
        // Draw tile border
        this.ctx.strokeStyle = tile.isSelected ? COLORS.WHITE : COLORS.DARK_GRAY;
        this.ctx.lineWidth = tile.isSelected ? 3 : 1;
        this.ctx.strokeRect(-this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize);
        
        // Draw tile icon
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText(tile.type.icon, 0, 0);
        
        this.ctx.restore();
    }

    drawChainPath() {
        if (this.chainPath.length < 2) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = COLORS.GOLD;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.chainPath[0].x, this.chainPath[0].y);
        
        for (let i = 1; i < this.chainPath.length; i++) {
            this.ctx.lineTo(this.chainPath[i].x, this.chainPath[i].y);
        }
        
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawParticles() {
        this.particles.forEach(particle => Utils.drawParticle(this.ctx, particle));
    }

    // Power-up methods
    executeDirectorsCutPowerup(centerCol, centerRow) {
        const affectedTiles = [];
        
        for (let row = Math.max(0, centerRow - 1); row <= Math.min(this.rows - 1, centerRow + 1); row++) {
            for (let col = Math.max(0, centerCol - 1); col <= Math.min(this.cols - 1, centerCol + 1); col++) {
                const tile = this.tiles[row][col];
                if (tile && !tile.isMatched) {
                    tile.isMatched = true;
                    affectedTiles.push(tile);
                    this.addTileAnimation(tile, 'scale', 0, 0.3);
                    this.createParticleEffect(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, COLORS.GOLD);
                }
            }
        }
        
        setTimeout(() => {
            this.removeTiles();
            this.applyGravity();
            this.refillBoard();
        }, 300);
        
        return affectedTiles.length;
    }

    executeClapboardSmash(tileType) {
        const affectedTiles = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile && tile.type.id === tileType && !tile.isMatched) {
                    tile.isMatched = true;
                    affectedTiles.push(tile);
                    this.addTileAnimation(tile, 'scale', 0, 0.3);
                    this.createParticleEffect(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, tile.type.color);
                }
            }
        }
        
        setTimeout(() => {
            this.removeTiles();
            this.applyGravity();
            this.refillBoard();
        }, 300);
        
        return affectedTiles.length;
    }

    executeSpotlightBeam(col, row, isHorizontal) {
        const affectedTiles = [];
        
        if (isHorizontal) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.tiles[row][c];
                if (tile && !tile.isMatched) {
                    tile.isMatched = true;
                    affectedTiles.push(tile);
                    this.addTileAnimation(tile, 'scale', 0, 0.3);
                    this.createParticleEffect(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, COLORS.WHITE);
                }
            }
        } else {
            for (let r = 0; r < this.rows; r++) {
                const tile = this.tiles[r][col];
                if (tile && !tile.isMatched) {
                    tile.isMatched = true;
                    affectedTiles.push(tile);
                    this.addTileAnimation(tile, 'scale', 0, 0.3);
                    this.createParticleEffect(tile.x + this.tileSize / 2, tile.y + this.tileSize / 2, COLORS.WHITE);
                }
            }
        }
        
        setTimeout(() => {
            this.removeTiles();
            this.applyGravity();
            this.refillBoard();
        }, 300);
        
        return affectedTiles.length;
    }

    shuffleBoard() {
        const allTiles = [];
        
        // Collect all non-null tiles
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile) {
                    allTiles.push(tile.type);
                }
            }
        }
        
        // Shuffle tile types
        const shuffledTypes = Utils.shuffle(allTiles);
        let typeIndex = 0;
        
        // Reassign shuffled types to tiles
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile && typeIndex < shuffledTypes.length) {
                    tile.type = shuffledTypes[typeIndex];
                    tile.isWild = tile.type.id === TILE_TYPES.WILD.id;
                    tile.isProp = tile.type.id === TILE_TYPES.PROP.id;
                    
                    // Add shuffle animation
                    this.addTileAnimation(tile, 'scale', 0.8, 0.2);
                    setTimeout(() => {
                        this.addTileAnimation(tile, 'scale', 1, 0.2);
                    }, 200);
                    
                    typeIndex++;
                }
            }
        }
    }
}