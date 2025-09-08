// Level Manager - Handles level objectives and progression
export class LevelManager {
    constructor(game) {
        this.game = game;
        this.currentObjective = null;
        this.bonusObjectives = [];
        this.levelData = this.generateLevelData();
    }
    
    generateLevelData() {
        const levels = [];
        
        // Generate 200 levels with increasing difficulty
        for (let i = 1; i <= 200; i++) {
            const movieIndex = Math.floor((i - 1) / 10);
            const levelInMovie = ((i - 1) % 10) + 1;
            
            // Base values that increase with level
            const baseScore = 1000 + (i * 50);
            const baseMoves = Math.max(15, 25 - Math.floor(i / 20));
            
            // Different objective types
            const objectiveTypes = [
                {
                    type: 'score',
                    text: `Score ${baseScore} points`,
                    target: baseScore,
                    current: 0
                },
                {
                    type: 'tiles',
                    text: `Clear ${30 + i} tiles`,
                    target: 30 + i,
                    current: 0
                },
                {
                    type: 'props',
                    text: `Clear ${15 + Math.floor(i / 10)} props`,
                    target: 15 + Math.floor(i / 10),
                    current: 0,
                    props: ['🎬', '🎭', '🎪']
                },
                {
                    type: 'time',
                    text: `Beat in ${60 + Math.floor(i / 5)} seconds`,
                    target: 60 + Math.floor(i / 5),
                    current: 0,
                    isTimer: true
                },
                {
                    type: 'perfect',
                    text: 'Complete with no mistakes',
                    target: 1,
                    current: 1,
                    allowMistakes: false
                },
                {
                    type: 'loops',
                    text: `Create ${2 + Math.floor(i / 30)} loops`,
                    target: 2 + Math.floor(i / 30),
                    current: 0
                }
            ];
            
            // Boss levels every 10 levels
            if (levelInMovie === 10) {
                levels.push({
                    level: i,
                    name: `Movie Premiere ${movieIndex + 1}`,
                    objectives: [
                        {
                            type: 'score',
                            text: `Score ${baseScore * 2} points`,
                            target: baseScore * 2,
                            current: 0
                        },
                        {
                            type: 'tiles',
                            text: `Clear ${50 + i} tiles in phase 2`,
                            target: 50 + i,
                            current: 0,
                            phase: 2
                        }
                    ],
                    moves: baseMoves + 10,
                    isBoss: true,
                    wheelSpins: 3
                });
            } else {
                // Regular level with 1-2 objectives
                const numObjectives = i > 50 ? 2 : 1;
                const selectedObjectives = [];
                
                for (let j = 0; j < numObjectives; j++) {
                    const objective = {...objectiveTypes[Math.floor(Math.random() * objectiveTypes.length)]};
                    selectedObjectives.push(objective);
                }
                
                levels.push({
                    level: i,
                    name: `Scene ${i}`,
                    objectives: selectedObjectives,
                    moves: baseMoves,
                    wheelSpins: 2
                });
            }
        }
        
        return levels;
    }
    
    loadLevel(levelNumber) {
        const level = this.levelData[levelNumber - 1];
        if (!level) {
            // Endless mode - generate random level
            this.generateEndlessLevel(levelNumber);
            return;
        }
        
        this.currentObjective = level.objectives[0];
        this.bonusObjectives = level.objectives.slice(1);
        
        // Set game state
        this.game.state.movesLeft = level.moves;
        this.game.state.wheelCharges = level.wheelSpins;
        
        // Reset objective progress
        this.currentObjective.current = this.currentObjective.type === 'perfect' ? 1 : 0;
        this.bonusObjectives.forEach(obj => {
            obj.current = obj.type === 'perfect' ? 1 : 0;
        });
        
        // Start timer if needed
        if (this.currentObjective.isTimer) {
            this.startTimer();
        }
    }
    
    generateEndlessLevel(levelNumber) {
        // Endless mode gets progressively harder
        const difficulty = Math.floor(levelNumber / 5);
        const baseScore = 1000 + (difficulty * 200);
        
        this.currentObjective = {
            type: 'score',
            text: `Score ${baseScore} points`,
            target: baseScore,
            current: 0
        };
        
        this.bonusObjectives = [];
        this.game.state.movesLeft = Math.max(10, 20 - difficulty);
        this.game.state.wheelCharges = 1;
    }
    
    getCurrentObjective() {
        return this.currentObjective;
    }
    
    updateObjective(type, value) {
        // Update main objective
        if (this.currentObjective && this.currentObjective.type === type) {
            if (type === 'perfect' && value === 'mistake') {
                this.currentObjective.current = 0;
            } else {
                this.currentObjective.current += value;
            }
        }
        
        // Update bonus objectives
        this.bonusObjectives.forEach(obj => {
            if (obj.type === type) {
                if (type === 'perfect' && value === 'mistake') {
                    obj.current = 0;
                } else {
                    obj.current += value;
                }
            }
        });
        
        // Check for specific prop types
        if (type === 'props' && this.currentObjective.type === 'props') {
            // This would need to be integrated with the board to track specific tile types
        }
    }
    
    isLevelComplete() {
        if (!this.currentObjective) return false;
        
        // Check main objective
        const mainComplete = this.currentObjective.current >= this.currentObjective.target;
        
        // Check bonus objectives
        const bonusComplete = this.bonusObjectives.every(obj => obj.current >= obj.target);
        
        return mainComplete && bonusComplete;
    }
    
    addBonusObjective() {
        // Add a sudden new objective (Crazy Wheel challenge)
        const bonusTypes = [
            { type: 'score', text: 'Bonus: +500 points', target: 500, current: 0 },
            { type: 'tiles', text: 'Bonus: Clear 20 tiles', target: 20, current: 0 },
            { type: 'loops', text: 'Bonus: Create 1 loop', target: 1, current: 0 }
        ];
        
        const bonus = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
        this.bonusObjectives.push(bonus);
        
        // Update UI to show new objective
        this.game.updateUI();
    }
    
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        let timeLeft = this.currentObjective.target;
        
        this.timerInterval = setInterval(() => {
            if (this.game.isPaused || this.game.state.timeFrozen) return;
            
            timeLeft--;
            this.currentObjective.current = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.game.failLevel();
            }
            
            this.game.updateUI();
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
}