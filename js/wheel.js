// Hollywood Crazy Wheel - Wheel System

class CrazyWheel {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;
        this.radius = Math.min(canvas.width, canvas.height) / 2 - 10;
        
        // Wheel state
        this.rotation = 0;
        this.isSpinning = false;
        this.spinSpeed = 0;
        this.targetRotation = 0;
        this.spinDuration = 0;
        this.spinElapsed = 0;
        
        // Sectors
        this.sectors = this.createSectors();
        this.sectorAngle = (Math.PI * 2) / this.sectors.length;
        
        // Animation
        this.glowIntensity = 0;
        this.glowDirection = 1;
        
        // Callbacks
        this.onSpinComplete = null;
    }

    createSectors() {
        return [
            // Boosts (4 sectors)
            {
                id: 'double_score',
                type: 'boost',
                name: 'Double Score',
                description: 'Next chain scores double points!',
                color: COLORS.GOLD,
                icon: '2️⃣',
                weight: 15
            },
            {
                id: 'extra_moves',
                type: 'boost',
                name: '+5 Moves',
                description: 'Gain 5 extra moves!',
                color: COLORS.TEAL,
                icon: '➕',
                weight: 20
            },
            {
                id: 'time_freeze',
                type: 'boost',
                name: 'Time Freeze',
                description: 'Stop the timer for 10 seconds!',
                color: COLORS.PURPLE,
                icon: '❄️',
                weight: 10
            },
            {
                id: 'rainbow_wilds',
                type: 'boost',
                name: 'Rainbow Wilds',
                description: '3 random tiles become wild!',
                color: COLORS.WHITE,
                icon: '🌈',
                weight: 12
            },
            
            // Challenges (2 sectors)
            {
                id: 'paparazzi_fog',
                type: 'challenge',
                name: 'Paparazzi Fog',
                description: 'Some tiles hidden for 10 seconds!',
                color: COLORS.GRAY,
                icon: '📸',
                weight: 8
            },
            {
                id: 'script_rewrite',
                type: 'challenge',
                name: 'Script Rewrite',
                description: 'Board gets shuffled!',
                color: COLORS.RUBY,
                icon: '📝',
                weight: 10
            },
            
            // Mini-games (2 sectors)
            {
                id: 'red_carpet',
                type: 'minigame',
                name: 'Red Carpet',
                description: 'Dodge paparazzi for bonus tickets!',
                color: COLORS.RUBY,
                icon: '🎭',
                weight: 8
            },
            {
                id: 'casting_call',
                type: 'minigame',
                name: 'Casting Call',
                description: 'Find matching faces quickly!',
                color: COLORS.PURPLE,
                icon: '🎬',
                weight: 7
            }
        ];
    }

    spin(callback) {
        if (this.isSpinning) return false;
        
        this.isSpinning = true;
        this.onSpinComplete = callback;
        
        // Calculate spin parameters
        const minSpins = 3;
        const maxSpins = 6;
        const spins = Utils.random(minSpins, maxSpins);
        
        // Select random sector based on weights
        const selectedSector = this.selectRandomSector();
        const sectorIndex = this.sectors.indexOf(selectedSector);
        const sectorAngle = sectorIndex * this.sectorAngle;
        
        // Calculate target rotation
        this.targetRotation = this.rotation + (spins * Math.PI * 2) + (Math.PI * 2 - sectorAngle) + this.sectorAngle / 2;
        
        // Set spin duration
        this.spinDuration = Utils.random(2000, 3000); // 2-3 seconds
        this.spinElapsed = 0;
        
        // Play spin sound
        audioManager.playSound('wheel_spin');
        Utils.vibrate([200, 100, 200]);
        
        return true;
    }

    selectRandomSector() {
        const totalWeight = this.sectors.reduce((sum, sector) => sum + sector.weight, 0);
        let random = Utils.random(0, totalWeight);
        
        for (const sector of this.sectors) {
            random -= sector.weight;
            if (random <= 0) {
                return sector;
            }
        }
        
        return this.sectors[0]; // Fallback
    }

    update(deltaTime) {
        if (this.isSpinning) {
            this.spinElapsed += deltaTime;
            const progress = Math.min(this.spinElapsed / this.spinDuration, 1);
            
            // Ease out cubic for natural deceleration
            const easedProgress = Utils.easeOutCubic(progress);
            this.rotation = Utils.lerp(this.rotation, this.targetRotation, easedProgress);
            
            if (progress >= 1) {
                this.rotation = this.targetRotation;
                this.isSpinning = false;
                this.handleSpinComplete();
            }
        }
        
        // Update glow animation
        this.glowIntensity += this.glowDirection * deltaTime * 2;
        if (this.glowIntensity >= 1) {
            this.glowIntensity = 1;
            this.glowDirection = -1;
        } else if (this.glowIntensity <= 0) {
            this.glowIntensity = 0;
            this.glowDirection = 1;
        }
    }

    handleSpinComplete() {
        const selectedSector = this.getSelectedSector();
        
        if (this.onSpinComplete) {
            this.onSpinComplete(selectedSector);
        }
        
        // Play result sound
        audioManager.playSound('powerup_activate');
        Utils.vibrate([300]);
    }

    getSelectedSector() {
        // The pointer points up, so we need to find which sector is at the top
        const normalizedRotation = (this.rotation % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const pointerAngle = Math.PI * 1.5; // Pointing up
        const relativeSectorAngle = (pointerAngle - normalizedRotation + Math.PI * 2) % (Math.PI * 2);
        const sectorIndex = Math.floor(relativeSectorAngle / this.sectorAngle);
        
        return this.sectors[sectorIndex] || this.sectors[0];
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.rotation);
        
        // Draw sectors
        for (let i = 0; i < this.sectors.length; i++) {
            this.drawSector(this.sectors[i], i);
        }
        
        this.ctx.restore();
        
        // Draw wheel border and glow
        this.drawWheelBorder();
        
        // Draw center hub
        this.drawCenterHub();
    }

    drawSector(sector, index) {
        const startAngle = index * this.sectorAngle;
        const endAngle = (index + 1) * this.sectorAngle;
        
        // Draw sector background
        this.ctx.fillStyle = sector.color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, this.radius, startAngle, endAngle);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw sector border
        this.ctx.strokeStyle = COLORS.WHITE;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw sector content
        const midAngle = startAngle + this.sectorAngle / 2;
        const textRadius = this.radius * 0.7;
        const iconRadius = this.radius * 0.5;
        
        this.ctx.save();
        this.ctx.rotate(midAngle);
        
        // Draw icon
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText(sector.icon, 0, -iconRadius);
        
        // Draw name
        this.ctx.font = 'bold 10px Arial';
        this.ctx.fillText(sector.name, 0, -textRadius);
        
        this.ctx.restore();
    }

    drawWheelBorder() {
        // Outer glow
        const glowRadius = this.radius + 10 + this.glowIntensity * 5;
        const gradient = this.ctx.createRadialGradient(
            this.centerX, this.centerY, this.radius,
            this.centerX, this.centerY, glowRadius
        );
        gradient.addColorStop(0, COLORS.GOLD + '80');
        gradient.addColorStop(1, COLORS.GOLD + '00');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main border
        this.ctx.strokeStyle = COLORS.GOLD;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }

    drawCenterHub() {
        // Hub background
        const hubRadius = 20;
        this.ctx.fillStyle = COLORS.GOLD;
        this.ctx.beginPath();
        this.ctx.arc(this.centerX, this.centerY, hubRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Hub border
        this.ctx.strokeStyle = COLORS.WHITE;
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Hub icon
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = COLORS.BLACK;
        this.ctx.fillText('🎬', this.centerX, this.centerY);
    }

    // Wheel effect methods
    applyWheelEffect(sector) {
        switch (sector.id) {
            case 'double_score':
                return this.applyDoubleScore();
            case 'extra_moves':
                return this.applyExtraMoves();
            case 'time_freeze':
                return this.applyTimeFreeze();
            case 'rainbow_wilds':
                return this.applyRainbowWilds();
            case 'paparazzi_fog':
                return this.applyPaparazziFog();
            case 'script_rewrite':
                return this.applyScriptRewrite();
            case 'red_carpet':
                return this.startRedCarpetMinigame();
            case 'casting_call':
                return this.startCastingCallMinigame();
            default:
                return { success: false, message: 'Unknown effect' };
        }
    }

    applyDoubleScore() {
        if (window.game) {
            window.game.activateDoubleScore(30000); // 30 seconds
            return { 
                success: true, 
                message: 'Next chains will score double points for 30 seconds!' 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    applyExtraMoves() {
        if (window.game) {
            window.game.addMoves(5);
            return { 
                success: true, 
                message: 'You gained 5 extra moves!' 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    applyTimeFreeze() {
        if (window.game) {
            window.game.freezeTimer(10000); // 10 seconds
            return { 
                success: true, 
                message: 'Timer frozen for 10 seconds!' 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    applyRainbowWilds() {
        if (window.game && window.game.board) {
            const wildCount = this.createRandomWilds(3);
            return { 
                success: true, 
                message: `${wildCount} tiles became wild!` 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    createRandomWilds(count) {
        const board = window.game.board;
        const availablePositions = [];
        
        // Find available positions
        for (let row = 0; row < board.rows; row++) {
            for (let col = 0; col < board.cols; col++) {
                const tile = board.tiles[row][col];
                if (tile && !tile.isWild && !tile.isProp && !tile.isMatched) {
                    availablePositions.push({ row, col });
                }
            }
        }
        
        // Convert random tiles to wild
        const positions = Utils.shuffle(availablePositions).slice(0, count);
        positions.forEach(pos => {
            const tile = board.tiles[pos.row][pos.col];
            tile.type = TILE_TYPES.WILD;
            tile.isWild = true;
            
            // Add sparkle effect
            board.addTileAnimation(tile, 'scale', 1.3, 0.3);
            board.createParticleEffect(
                tile.x + board.tileSize / 2, 
                tile.y + board.tileSize / 2, 
                COLORS.WHITE
            );
        });
        
        return positions.length;
    }

    applyPaparazziFog() {
        if (window.game) {
            window.game.activatePaparazziFog(10000); // 10 seconds
            return { 
                success: true, 
                message: 'Paparazzi are flashing! Some tiles are hidden!' 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    applyScriptRewrite() {
        if (window.game && window.game.board) {
            window.game.board.shuffleBoard();
            return { 
                success: true, 
                message: 'The script has been rewritten! Board shuffled!' 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    startRedCarpetMinigame() {
        if (window.game) {
            window.game.startMinigame('red_carpet');
            return { 
                success: true, 
                message: 'Red Carpet Runner mini-game!' 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    startCastingCallMinigame() {
        if (window.game) {
            window.game.startMinigame('casting_call');
            return { 
                success: true, 
                message: 'Casting Call mini-game!' 
            };
        }
        return { success: false, message: 'Game not available' };
    }

    // Utility methods
    canSpin() {
        return !this.isSpinning;
    }

    forceStop() {
        if (this.isSpinning) {
            this.spinElapsed = this.spinDuration;
            this.rotation = this.targetRotation;
            this.isSpinning = false;
            this.handleSpinComplete();
        }
    }

    reset() {
        this.rotation = 0;
        this.isSpinning = false;
        this.spinSpeed = 0;
        this.targetRotation = 0;
        this.spinDuration = 0;
        this.spinElapsed = 0;
        this.onSpinComplete = null;
    }

    // Get sector information
    getSectorInfo(sectorId) {
        return this.sectors.find(sector => sector.id === sectorId);
    }

    getAllSectors() {
        return [...this.sectors];
    }

    getSectorsByType(type) {
        return this.sectors.filter(sector => sector.type === type);
    }
}