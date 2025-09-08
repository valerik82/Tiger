// Hollywood Crazy Wheel - Mini-games System

class MinigameManager {
    constructor() {
        this.currentMinigame = null;
        this.minigameCanvas = document.getElementById('minigame-canvas');
        this.minigameScreen = document.getElementById('minigame-screen');
        this.minigameTitle = document.getElementById('minigame-title');
        this.minigameInstructions = document.getElementById('minigame-instructions');
        this.minigameTimer = document.getElementById('minigame-timer');
        
        this.ctx = this.minigameCanvas.getContext('2d');
        this.isActive = false;
        this.timeLeft = 0;
        this.score = 0;
        this.onComplete = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const isTouchDevice = Utils.isTouchDevice();
        
        if (isTouchDevice) {
            this.minigameCanvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.minigameCanvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.minigameCanvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        } else {
            this.minigameCanvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.minigameCanvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.minigameCanvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        }
    }

    startMinigame(type, callback) {
        if (this.isActive) return false;
        
        this.onComplete = callback;
        this.isActive = true;
        this.score = 0;
        this.timeLeft = GAME_CONFIG.MINIGAME_DURATION;
        
        switch (type) {
            case 'red_carpet':
                this.currentMinigame = new RedCarpetRunner(this.ctx, this.minigameCanvas);
                this.minigameTitle.textContent = 'Red Carpet Runner';
                this.minigameInstructions.textContent = 'Swipe to dodge paparazzi and grab stars!';
                break;
            case 'casting_call':
                this.currentMinigame = new CastingCall(this.ctx, this.minigameCanvas);
                this.minigameTitle.textContent = 'Casting Call';
                this.minigameInstructions.textContent = 'Tap matching faces quickly!';
                break;
            default:
                return false;
        }
        
        this.showMinigameScreen();
        audioManager.playSound('minigame_start');
        
        return true;
    }

    showMinigameScreen() {
        this.minigameScreen.classList.add('active');
    }

    hideMinigameScreen() {
        this.minigameScreen.classList.remove('active');
    }

    update(deltaTime) {
        if (!this.isActive || !this.currentMinigame) return;
        
        this.timeLeft -= deltaTime;
        this.minigameTimer.textContent = Math.ceil(this.timeLeft / 1000);
        
        if (this.timeLeft <= 0) {
            this.endMinigame();
            return;
        }
        
        this.currentMinigame.update(deltaTime);
        this.score = this.currentMinigame.getScore();
    }

    render() {
        if (!this.isActive || !this.currentMinigame) return;
        
        this.currentMinigame.render();
    }

    endMinigame() {
        if (!this.isActive) return;
        
        this.isActive = false;
        const finalScore = this.score;
        const rewards = this.calculateRewards(finalScore);
        
        this.hideMinigameScreen();
        
        if (this.onComplete) {
            this.onComplete(finalScore, rewards);
        }
        
        this.currentMinigame = null;
        audioManager.playSound('level_complete');
    }

    calculateRewards(score) {
        const baseTickets = Math.floor(score / 10);
        const bonusTickets = score > 100 ? 20 : score > 50 ? 10 : 0;
        
        return {
            tickets: baseTickets + bonusTickets,
            stars: score > 150 ? 1 : 0
        };
    }

    handleTouchStart(event) {
        event.preventDefault();
        if (this.currentMinigame) {
            const touch = event.touches[0];
            const pos = Utils.getCanvasPosition(this.minigameCanvas, touch.clientX, touch.clientY);
            this.currentMinigame.handleInput('touchstart', pos.x, pos.y);
        }
    }

    handleTouchMove(event) {
        event.preventDefault();
        if (this.currentMinigame) {
            const touch = event.touches[0];
            const pos = Utils.getCanvasPosition(this.minigameCanvas, touch.clientX, touch.clientY);
            this.currentMinigame.handleInput('touchmove', pos.x, pos.y);
        }
    }

    handleTouchEnd(event) {
        event.preventDefault();
        if (this.currentMinigame) {
            this.currentMinigame.handleInput('touchend');
        }
    }

    handleMouseDown(event) {
        if (this.currentMinigame) {
            const pos = Utils.getCanvasPosition(this.minigameCanvas, event.clientX, event.clientY);
            this.currentMinigame.handleInput('mousedown', pos.x, pos.y);
        }
    }

    handleMouseMove(event) {
        if (this.currentMinigame) {
            const pos = Utils.getCanvasPosition(this.minigameCanvas, event.clientX, event.clientY);
            this.currentMinigame.handleInput('mousemove', pos.x, pos.y);
        }
    }

    handleMouseUp(event) {
        if (this.currentMinigame) {
            this.currentMinigame.handleInput('mouseup');
        }
    }
}

// Red Carpet Runner Mini-game
class RedCarpetRunner {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Player
        this.player = {
            x: this.width / 2,
            y: this.height - 60,
            width: 30,
            height: 40,
            speed: 200,
            targetX: this.width / 2
        };
        
        // Game objects
        this.paparazzi = [];
        this.stars = [];
        this.particles = [];
        
        // Spawn timers
        this.paparazziSpawnTimer = 0;
        this.starSpawnTimer = 0;
        
        // Game state
        this.score = 0;
        this.lives = 3;
        
        // Background
        this.carpetOffset = 0;
    }

    update(deltaTime) {
        this.updatePlayer(deltaTime);
        this.updateBackground(deltaTime);
        this.spawnObjects(deltaTime);
        this.updatePaparazzi(deltaTime);
        this.updateStars(deltaTime);
        this.updateParticles(deltaTime);
        this.checkCollisions();
    }

    updatePlayer(deltaTime) {
        // Smooth movement towards target
        const dx = this.player.targetX - this.player.x;
        if (Math.abs(dx) > 1) {
            this.player.x += dx * deltaTime * 0.008;
        }
        
        // Keep player in bounds
        this.player.x = Utils.clamp(this.player.x, this.player.width / 2, this.width - this.player.width / 2);
    }

    updateBackground(deltaTime) {
        this.carpetOffset += deltaTime * 0.1;
        if (this.carpetOffset > 50) {
            this.carpetOffset = 0;
        }
    }

    spawnObjects(deltaTime) {
        // Spawn paparazzi
        this.paparazziSpawnTimer += deltaTime;
        if (this.paparazziSpawnTimer > 1500) { // Every 1.5 seconds
            this.spawnPaparazzi();
            this.paparazziSpawnTimer = 0;
        }
        
        // Spawn stars
        this.starSpawnTimer += deltaTime;
        if (this.starSpawnTimer > 2000) { // Every 2 seconds
            this.spawnStar();
            this.starSpawnTimer = 0;
        }
    }

    spawnPaparazzi() {
        const paparazzi = {
            x: Utils.random(30, this.width - 30),
            y: -30,
            width: 25,
            height: 30,
            speed: Utils.random(80, 120),
            flashTimer: 0,
            isFlashing: false
        };
        this.paparazzi.push(paparazzi);
    }

    spawnStar() {
        const star = {
            x: Utils.random(30, this.width - 30),
            y: -20,
            width: 20,
            height: 20,
            speed: Utils.random(60, 100),
            rotation: 0,
            collected: false
        };
        this.stars.push(star);
    }

    updatePaparazzi(deltaTime) {
        this.paparazzi = this.paparazzi.filter(p => {
            p.y += p.speed * deltaTime * 0.001;
            p.flashTimer += deltaTime;
            
            if (p.flashTimer > 500) { // Flash every 0.5 seconds
                p.isFlashing = !p.isFlashing;
                p.flashTimer = 0;
            }
            
            return p.y < this.height + 50;
        });
    }

    updateStars(deltaTime) {
        this.stars = this.stars.filter(star => {
            if (!star.collected) {
                star.y += star.speed * deltaTime * 0.001;
                star.rotation += deltaTime * 0.005;
            }
            
            return star.y < this.height + 30 && !star.collected;
        });
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => Utils.updateParticle(particle, deltaTime));
    }

    checkCollisions() {
        // Check paparazzi collisions
        this.paparazzi.forEach(p => {
            if (this.isColliding(this.player, p)) {
                this.lives--;
                this.createExplosionEffect(this.player.x, this.player.y, COLORS.RUBY);
                Utils.vibrate([200]);
                
                // Remove the paparazzi
                const index = this.paparazzi.indexOf(p);
                if (index > -1) {
                    this.paparazzi.splice(index, 1);
                }
            }
        });
        
        // Check star collisions
        this.stars.forEach(star => {
            if (!star.collected && this.isColliding(this.player, star)) {
                star.collected = true;
                this.score += 10;
                this.createStarEffect(star.x, star.y);
                audioManager.playSound('score_increment');
                Utils.vibrate([50]);
            }
        });
    }

    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    createExplosionEffect(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = Utils.random(100, 200);
            const particle = Utils.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                Utils.random(3, 6),
                Utils.random(0.5, 1.0)
            );
            this.particles.push(particle);
        }
    }

    createStarEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const speed = Utils.random(50, 100);
            const particle = Utils.createParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                COLORS.GOLD,
                Utils.random(2, 4),
                Utils.random(0.3, 0.6)
            );
            this.particles.push(particle);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.renderBackground();
        this.renderPaparazzi();
        this.renderStars();
        this.renderPlayer();
        this.renderParticles();
        this.renderHUD();
    }

    renderBackground() {
        // Red carpet
        this.ctx.fillStyle = COLORS.RUBY;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Carpet pattern
        this.ctx.strokeStyle = COLORS.GOLD;
        this.ctx.lineWidth = 2;
        for (let y = -50 + this.carpetOffset; y < this.height; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    renderPaparazzi() {
        this.paparazzi.forEach(p => {
            this.ctx.save();
            
            if (p.isFlashing) {
                this.ctx.fillStyle = COLORS.WHITE;
                this.ctx.fillRect(p.x - 5, p.y - 5, p.width + 10, p.height + 10);
            }
            
            this.ctx.fillStyle = COLORS.BLACK;
            this.ctx.fillRect(p.x, p.y, p.width, p.height);
            
            // Camera
            this.ctx.fillStyle = COLORS.GRAY;
            this.ctx.fillRect(p.x + 5, p.y + 5, 15, 10);
            
            // Flash
            if (p.isFlashing) {
                this.ctx.fillStyle = COLORS.WHITE;
                this.ctx.beginPath();
                this.ctx.arc(p.x + 12, p.y + 10, 8, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }

    renderStars() {
        this.stars.forEach(star => {
            if (!star.collected) {
                this.ctx.save();
                this.ctx.translate(star.x + star.width / 2, star.y + star.height / 2);
                this.ctx.rotate(star.rotation);
                
                this.ctx.fillStyle = COLORS.GOLD;
                this.ctx.font = '20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⭐', 0, 0);
                
                this.ctx.restore();
            }
        });
    }

    renderPlayer() {
        this.ctx.fillStyle = COLORS.PURPLE;
        this.ctx.fillRect(this.player.x - this.player.width / 2, this.player.y, this.player.width, this.player.height);
        
        // Player icon
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText('🎭', this.player.x, this.player.y + this.player.height / 2);
    }

    renderParticles() {
        this.particles.forEach(particle => Utils.drawParticle(this.ctx, particle));
    }

    renderHUD() {
        // Score
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText(`Score: ${this.score}`, 10, 10);
        
        // Lives
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 35);
    }

    handleInput(type, x, y) {
        if (type === 'touchstart' || type === 'mousedown') {
            this.player.targetX = x;
        } else if (type === 'touchmove' || type === 'mousemove') {
            this.player.targetX = x;
        }
    }

    getScore() {
        return this.score;
    }
}

// Casting Call Mini-game
class CastingCall {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.score = 0;
        this.targetFace = null;
        this.faces = [];
        this.faceTypes = ['😀', '😎', '🤩', '😍', '🥳', '😊', '🤗', '😋'];
        
        this.generateRound();
    }

    generateRound() {
        // Choose target face
        this.targetFace = this.faceTypes[Utils.randomInt(0, this.faceTypes.length - 1)];
        
        // Generate faces grid
        this.faces = [];
        const cols = 4;
        const rows = 3;
        const faceSize = 60;
        const padding = 20;
        
        const startX = (this.width - (cols * faceSize + (cols - 1) * padding)) / 2;
        const startY = 60;
        
        // Add correct faces (2-3 of them)
        const correctCount = Utils.randomInt(2, 3);
        const positions = [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                positions.push({
                    x: startX + col * (faceSize + padding),
                    y: startY + row * (faceSize + padding),
                    col,
                    row
                });
            }
        }
        
        const shuffledPositions = Utils.shuffle(positions);
        
        // Place correct faces
        for (let i = 0; i < correctCount; i++) {
            const pos = shuffledPositions[i];
            this.faces.push({
                x: pos.x,
                y: pos.y,
                size: faceSize,
                face: this.targetFace,
                isCorrect: true,
                clicked: false,
                scale: 1
            });
        }
        
        // Fill remaining positions with wrong faces
        for (let i = correctCount; i < shuffledPositions.length; i++) {
            const pos = shuffledPositions[i];
            let wrongFace;
            do {
                wrongFace = this.faceTypes[Utils.randomInt(0, this.faceTypes.length - 1)];
            } while (wrongFace === this.targetFace);
            
            this.faces.push({
                x: pos.x,
                y: pos.y,
                size: faceSize,
                face: wrongFace,
                isCorrect: false,
                clicked: false,
                scale: 1
            });
        }
    }

    update(deltaTime) {
        // Update face animations
        this.faces.forEach(face => {
            if (face.scale !== 1) {
                face.scale = Utils.lerp(face.scale, 1, deltaTime * 0.005);
            }
        });
        
        // Check if round is complete
        const correctFaces = this.faces.filter(f => f.isCorrect);
        const clickedCorrectFaces = correctFaces.filter(f => f.clicked);
        
        if (clickedCorrectFaces.length === correctFaces.length) {
            // All correct faces found, generate new round
            setTimeout(() => {
                this.generateRound();
            }, 500);
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.renderBackground();
        this.renderTarget();
        this.renderFaces();
        this.renderHUD();
    }

    renderBackground() {
        // Gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, COLORS.PURPLE);
        gradient.addColorStop(1, COLORS.BACKGROUND);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    renderTarget() {
        // Target face display
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText('Find this face:', this.width / 2, 25);
        
        // Target face
        this.ctx.font = '40px Arial';
        this.ctx.fillText(this.targetFace, this.width / 2, 50);
    }

    renderFaces() {
        this.faces.forEach(face => {
            this.ctx.save();
            
            const centerX = face.x + face.size / 2;
            const centerY = face.y + face.size / 2;
            
            this.ctx.translate(centerX, centerY);
            this.ctx.scale(face.scale, face.scale);
            
            // Face background
            if (face.clicked) {
                this.ctx.fillStyle = face.isCorrect ? COLORS.GOLD : COLORS.RUBY;
            } else {
                this.ctx.fillStyle = COLORS.WHITE;
            }
            this.ctx.fillRect(-face.size / 2, -face.size / 2, face.size, face.size);
            
            // Face border
            this.ctx.strokeStyle = COLORS.BLACK;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-face.size / 2, -face.size / 2, face.size, face.size);
            
            // Face emoji
            this.ctx.font = '36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = COLORS.BLACK;
            this.ctx.fillText(face.face, 0, 0);
            
            this.ctx.restore();
        });
    }

    renderHUD() {
        // Score
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillStyle = COLORS.WHITE;
        this.ctx.fillText(`Score: ${this.score}`, 10, this.height - 10);
    }

    handleInput(type, x, y) {
        if (type === 'touchstart' || type === 'mousedown') {
            // Check if any face was clicked
            this.faces.forEach(face => {
                if (!face.clicked &&
                    x >= face.x && x <= face.x + face.size &&
                    y >= face.y && y <= face.y + face.size) {
                    
                    face.clicked = true;
                    face.scale = 1.2;
                    
                    if (face.isCorrect) {
                        this.score += 20;
                        audioManager.playSound('score_increment');
                        Utils.vibrate([100]);
                    } else {
                        this.score = Math.max(0, this.score - 5);
                        Utils.vibrate([200, 100, 200]);
                    }
                }
            });
        }
    }

    getScore() {
        return this.score;
    }
}

// Create global minigame manager
const minigameManager = new MinigameManager();