// Mini-Games System
export class MiniGames {
    constructor(game) {
        this.game = game;
        this.currentGame = null;
        this.callback = null;
        this.score = 0;
        this.timer = null;
    }
    
    start(gameType, callback) {
        this.callback = callback;
        this.score = 0;
        
        // Show minigame container
        document.getElementById('minigame-container').classList.add('active');
        
        // Hide all minigames
        document.querySelectorAll('.minigame').forEach(g => {
            g.classList.remove('active');
            g.style.display = 'none';
        });
        
        switch(gameType) {
            case 'redCarpet':
                this.startRedCarpetRunner();
                break;
            case 'castingCall':
                this.startCastingCall();
                break;
            case 'soundCheck':
                this.startSoundCheck();
                break;
        }
    }
    
    end(reward) {
        // Hide minigame container
        document.getElementById('minigame-container').classList.remove('active');
        
        // Clear any timers
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Call callback with reward
        if (this.callback) {
            this.callback(reward);
        }
    }
    
    // Red Carpet Runner - Swipe to dodge and collect stars
    startRedCarpetRunner() {
        const container = document.getElementById('red-carpet-game');
        container.style.display = 'flex';
        container.classList.add('active');
        
        const canvas = document.getElementById('red-carpet-canvas');
        const ctx = canvas.getContext('2d');
        
        // Game state
        const player = { x: canvas.width / 2, y: canvas.height - 100, size: 30 };
        const stars = [];
        const obstacles = [];
        let gameTime = 0;
        let starsCollected = 0;
        
        // Touch/mouse controls
        let touchX = player.x;
        
        const handleMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            touchX = (e.clientX || e.touches[0].clientX) - rect.left;
        };
        
        canvas.addEventListener('mousemove', handleMove);
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMove(e);
        });
        
        // Game loop
        const gameLoop = setInterval(() => {
            gameTime++;
            
            // Move player smoothly towards touch position
            player.x += (touchX - player.x) * 0.2;
            
            // Spawn stars and obstacles
            if (gameTime % 30 === 0) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: -20,
                    size: 20,
                    speed: 3 + Math.random() * 2
                });
            }
            
            if (gameTime % 45 === 0) {
                obstacles.push({
                    x: Math.random() * (canvas.width - 40),
                    y: -30,
                    width: 40,
                    height: 30,
                    speed: 4
                });
            }
            
            // Update and draw
            ctx.fillStyle = '#1a0a1f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw red carpet
            const carpetGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            carpetGradient.addColorStop(0, '#8B0000');
            carpetGradient.addColorStop(0.5, '#DC143C');
            carpetGradient.addColorStop(1, '#8B0000');
            ctx.fillStyle = carpetGradient;
            ctx.fillRect(50, 0, canvas.width - 100, canvas.height);
            
            // Update and draw stars
            stars.forEach((star, index) => {
                star.y += star.speed;
                
                // Draw star
                ctx.fillStyle = '#FFD700';
                ctx.font = '24px Arial';
                ctx.fillText('⭐', star.x - 12, star.y);
                
                // Check collision with player
                const dist = Math.sqrt(Math.pow(star.x - player.x, 2) + Math.pow(star.y - player.y, 2));
                if (dist < player.size + star.size) {
                    starsCollected++;
                    stars.splice(index, 1);
                    document.getElementById('carpet-stars').textContent = starsCollected;
                    this.game.audio.playSound('combo');
                }
                
                // Remove if off screen
                if (star.y > canvas.height) {
                    stars.splice(index, 1);
                }
            });
            
            // Update and draw obstacles
            ctx.fillStyle = '#696969';
            obstacles.forEach((obs, index) => {
                obs.y += obs.speed;
                
                // Draw paparazzi camera
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#696969';
                
                // Check collision
                if (player.x > obs.x - player.size && 
                    player.x < obs.x + obs.width + player.size &&
                    player.y > obs.y && 
                    player.y < obs.y + obs.height + player.size) {
                    // Hit obstacle - reduce stars
                    starsCollected = Math.max(0, starsCollected - 1);
                    obstacles.splice(index, 1);
                    document.getElementById('carpet-stars').textContent = starsCollected;
                }
                
                // Remove if off screen
                if (obs.y > canvas.height) {
                    obstacles.splice(index, 1);
                }
            });
            
            // Draw player (celebrity)
            const playerGradient = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.size);
            playerGradient.addColorStop(0, '#FFD700');
            playerGradient.addColorStop(1, '#FFA500');
            ctx.fillStyle = playerGradient;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw celebrity emoji
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🌟', player.x, player.y);
            
            // End game after 10 seconds
            if (gameTime > 600) {
                clearInterval(gameLoop);
                canvas.removeEventListener('mousemove', handleMove);
                
                const reward = {
                    tickets: starsCollected * 10,
                    wilds: Math.floor(starsCollected / 3)
                };
                
                setTimeout(() => {
                    this.end(reward);
                }, 1000);
            }
        }, 1000 / 60);
    }
    
    // Casting Call - Tap the matching faces quickly
    startCastingCall() {
        const container = document.getElementById('casting-call-game');
        container.style.display = 'flex';
        container.classList.add('active');
        
        const facesGrid = document.getElementById('faces-grid');
        const targetDisplay = document.getElementById('target-face');
        const timerDisplay = document.getElementById('casting-timer');
        
        const faces = ['😀', '😎', '🤩', '😍', '🥳', '🤠', '🧐', '🤓', '😊', '😄', '🤗', '😋'];
        let targetFace = '';
        let score = 0;
        let timeLeft = 12;
        
        const generateRound = () => {
            facesGrid.innerHTML = '';
            targetFace = faces[Math.floor(Math.random() * faces.length)];
            targetDisplay.textContent = targetFace;
            
            // Create grid of faces
            const gridFaces = [];
            const targetCount = 2 + Math.floor(Math.random() * 3);
            
            // Add target faces
            for (let i = 0; i < targetCount; i++) {
                gridFaces.push(targetFace);
            }
            
            // Add random faces
            while (gridFaces.length < 16) {
                const randomFace = faces[Math.floor(Math.random() * faces.length)];
                if (randomFace !== targetFace) {
                    gridFaces.push(randomFace);
                }
            }
            
            // Shuffle
            gridFaces.sort(() => Math.random() - 0.5);
            
            // Create buttons
            gridFaces.forEach(face => {
                const btn = document.createElement('button');
                btn.className = 'face-btn';
                btn.textContent = face;
                btn.addEventListener('click', () => {
                    if (face === targetFace) {
                        btn.classList.add('correct');
                        score++;
                        this.game.audio.playSound('combo');
                        setTimeout(() => {
                            btn.style.visibility = 'hidden';
                        }, 300);
                        
                        // Check if all targets found
                        const remaining = Array.from(facesGrid.children).filter(b => 
                            b.textContent === targetFace && b.style.visibility !== 'hidden'
                        );
                        
                        if (remaining.length === 0) {
                            setTimeout(generateRound, 500);
                        }
                    } else {
                        btn.classList.add('wrong');
                        setTimeout(() => {
                            btn.classList.remove('wrong');
                        }, 500);
                    }
                });
                facesGrid.appendChild(btn);
            });
        };
        
        generateRound();
        
        // Timer
        this.timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(this.timer);
                
                const reward = {
                    tickets: score * 15,
                    moves: Math.floor(score / 3)
                };
                
                setTimeout(() => {
                    this.end(reward);
                }, 1000);
            }
        }, 1000);
    }
    
    // Sound Check - Simon Says style memory game
    startSoundCheck() {
        const container = document.getElementById('sound-check-game');
        container.style.display = 'flex';
        container.classList.add('active');
        
        const buttons = document.querySelectorAll('.sound-btn');
        const statusDisplay = document.querySelector('.minigame-status');
        
        const tones = [
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+0Oy9diMFl2+z5cp2IwVWq8Pm6aoqCg=='),
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+0Oy9diMFl2+z5cp2IwVWq8Pm6aoqCg=='),
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+0Oy9diMFl2+z5cp2IwVWq8Pm6aoqCg=='),
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+0Oy9diMFl2+z5cp2IwVWq8Pm6aoqCg==')
        ];
        
        // Adjust pitch for different tones
        tones.forEach((tone, i) => {
            tone.playbackRate = 0.8 + (i * 0.2);
        });
        
        let sequence = [];
        let playerSequence = [];
        let round = 0;
        let isPlayerTurn = false;
        
        const playSequence = () => {
            isPlayerTurn = false;
            statusDisplay.textContent = 'Watch & Listen!';
            
            // Add new tone to sequence
            sequence.push(Math.floor(Math.random() * 4));
            
            // Play sequence
            sequence.forEach((toneIndex, i) => {
                setTimeout(() => {
                    buttons[toneIndex].classList.add('active');
                    tones[toneIndex].play();
                    
                    setTimeout(() => {
                        buttons[toneIndex].classList.remove('active');
                    }, 400);
                    
                    // Enable player input after sequence
                    if (i === sequence.length - 1) {
                        setTimeout(() => {
                            isPlayerTurn = true;
                            playerSequence = [];
                            statusDisplay.textContent = 'Your Turn!';
                        }, 600);
                    }
                }, i * 600);
            });
        };
        
        // Button handlers
        buttons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                if (!isPlayerTurn) return;
                
                // Play tone
                btn.classList.add('active');
                tones[index].play();
                
                setTimeout(() => {
                    btn.classList.remove('active');
                }, 300);
                
                // Check sequence
                playerSequence.push(index);
                
                if (playerSequence[playerSequence.length - 1] !== sequence[playerSequence.length - 1]) {
                    // Wrong sequence
                    statusDisplay.textContent = 'Oops! Game Over';
                    isPlayerTurn = false;
                    
                    const reward = {
                        tickets: round * 20,
                        wilds: Math.floor(round / 2)
                    };
                    
                    setTimeout(() => {
                        this.end(reward);
                    }, 1500);
                } else if (playerSequence.length === sequence.length) {
                    // Correct sequence
                    round++;
                    statusDisplay.textContent = `Round ${round + 1}!`;
                    isPlayerTurn = false;
                    
                    if (round >= 5) {
                        // Max rounds reached
                        statusDisplay.textContent = 'Perfect Score!';
                        
                        const reward = {
                            tickets: 100,
                            wilds: 3,
                            moves: 2
                        };
                        
                        setTimeout(() => {
                            this.end(reward);
                        }, 1500);
                    } else {
                        setTimeout(playSequence, 1500);
                    }
                }
            });
        });
        
        // Start game
        setTimeout(playSequence, 1000);
    }
}