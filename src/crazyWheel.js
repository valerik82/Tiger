// Crazy Wheel System
export class CrazyWheel {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('wheel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.wheel = document.getElementById('crazy-wheel');
        
        this.sectors = [
            { type: 'boost', value: 'doubleScore', label: '2X Score', color: '#FFD700' },
            { type: 'boost', value: 'extraMoves', label: '+5 Moves', color: '#17B5A6' },
            { type: 'challenge', value: 'budgetCut', label: '-3 Moves', color: '#E0115F' },
            { type: 'minigame', value: 'redCarpet', label: 'Red Carpet', color: '#8B4789' },
            { type: 'boost', value: 'timeFreeze', label: 'Freeze Time', color: '#4169E1' },
            { type: 'challenge', value: 'paparazziFog', label: 'Paparazzi', color: '#696969' },
            { type: 'boost', value: 'rainbowWild', label: 'Wild Cards', color: '#FF69B4' },
            { type: 'minigame', value: 'castingCall', label: 'Casting', color: '#FF8C00' },
            { type: 'boost', value: 'stuntDouble', label: 'Stunt Double', color: '#32CD32' },
            { type: 'challenge', value: 'scriptRewrite', label: 'Rewrite', color: '#DC143C' },
            { type: 'minigame', value: 'soundCheck', label: 'Sound Check', color: '#00CED1' },
            { type: 'challenge', value: 'suddenCameo', label: 'New Goal', color: '#9370DB' }
        ];
        
        this.currentRotation = 0;
        this.isSpinning = false;
        this.autoSpinTimer = null;
    }
    
    init() {
        this.drawWheel();
        this.scheduleAutoSpin();
    }
    
    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const anglePerSector = (Math.PI * 2) / this.sectors.length;
        
        this.sectors.forEach((sector, index) => {
            const startAngle = index * anglePerSector - Math.PI / 2;
            const endAngle = startAngle + anglePerSector;
            
            // Draw sector
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            
            // Gradient fill
            const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, this.lightenColor(sector.color));
            gradient.addColorStop(1, sector.color);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Draw border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + anglePerSector / 2);
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 3;
            
            // Split text into lines if needed
            const lines = sector.label.split(' ');
            lines.forEach((line, lineIndex) => {
                this.ctx.fillText(line, radius * 0.65, (lineIndex - (lines.length - 1) / 2) * 12);
            });
            
            this.ctx.restore();
        });
        
        // Draw center circle
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
        const centerGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 20);
        centerGradient.addColorStop(0, '#FFD700');
        centerGradient.addColorStop(1, '#FFA500');
        this.ctx.fillStyle = centerGradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw center star
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⭐', centerX, centerY);
    }
    
    lightenColor(color) {
        // Simple color lightening
        const colors = {
            '#FFD700': '#FFED4E',
            '#17B5A6': '#3FD5C6',
            '#E0115F': '#FF317F',
            '#8B4789': '#AB67A9',
            '#4169E1': '#6189FF',
            '#696969': '#898989',
            '#FF69B4': '#FF89D4',
            '#FF8C00': '#FFAC20',
            '#32CD32': '#52ED52',
            '#DC143C': '#FC345C',
            '#00CED1': '#20EEF1',
            '#9370DB': '#B390FB'
        };
        return colors[color] || color;
    }
    
    spin() {
        if (this.isSpinning) return;
        
        this.isSpinning = true;
        this.game.audio.playSound('wheel');
        
        // Calculate random spin
        const minSpins = 3;
        const maxSpins = 5;
        const spins = minSpins + Math.random() * (maxSpins - minSpins);
        const targetRotation = spins * 360 + Math.random() * 360;
        
        // Animate spin
        const startRotation = this.currentRotation;
        const duration = 3000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for realistic spin
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.currentRotation = startRotation + targetRotation * easeOut;
            this.wheel.style.transform = `rotate(${this.currentRotation}deg)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.handleSpinResult();
                this.scheduleAutoSpin();
            }
        };
        
        animate();
    }
    
    handleSpinResult() {
        // Calculate which sector the pointer is on
        const normalizedRotation = (360 - (this.currentRotation % 360)) % 360;
        const sectorAngle = 360 / this.sectors.length;
        const sectorIndex = Math.floor(normalizedRotation / sectorAngle);
        const sector = this.sectors[sectorIndex];
        
        // Show result notification
        this.showWheelResult(sector);
        
        // Apply effect
        setTimeout(() => {
            this.game.applyWheelEffect(sector);
        }, 1000);
    }
    
    showWheelResult(sector) {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'wheel-result';
        resultDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 40px;
            background: linear-gradient(135deg, ${sector.color}, ${this.lightenColor(sector.color)});
            color: white;
            font-size: 1.8rem;
            font-weight: bold;
            border-radius: 20px;
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
            z-index: 1500;
            animation: wheel-result-pop 2s ease-out;
            text-align: center;
            min-width: 200px;
        `;
        
        // Add icon based on type
        let icon = '';
        if (sector.type === 'boost') icon = '⬆️ ';
        else if (sector.type === 'challenge') icon = '⚠️ ';
        else if (sector.type === 'minigame') icon = '🎮 ';
        
        resultDiv.textContent = icon + sector.label;
        
        document.getElementById('game-screen').appendChild(resultDiv);
        
        setTimeout(() => {
            resultDiv.remove();
        }, 2000);
    }
    
    scheduleAutoSpin() {
        // Clear existing timer
        if (this.autoSpinTimer) {
            clearTimeout(this.autoSpinTimer);
        }
        
        // Schedule next auto spin (every 30-60 seconds during gameplay)
        const delay = 30000 + Math.random() * 30000;
        this.autoSpinTimer = setTimeout(() => {
            if (!this.game.isPaused && this.game.currentScreen === 'game-screen') {
                this.spin();
            }
        }, delay);
    }
}

// Add wheel result animation to styles
const style = document.createElement('style');
style.textContent = `
    @keyframes wheel-result-pop {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);
        }
        20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2) rotate(5deg);
        }
        40% {
            transform: translate(-50%, -50%) scale(1) rotate(-2deg);
        }
        60% {
            transform: translate(-50%, -50%) scale(1.05) rotate(1deg);
        }
        80% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
        }
    }
`;
document.head.appendChild(style);