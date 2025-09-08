// Hollywood Crazy Wheel - Levels System

class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.maxLevel = 1;
        this.levels = this.createLevels();
        this.currentObjective = null;
        this.progress = {};
        
        this.loadProgress();
    }

    createLevels() {
        const levels = [];
        
        // Tutorial levels (1-5)
        levels.push(...this.createTutorialLevels());
        
        // Regular levels (6-30)
        levels.push(...this.createRegularLevels());
        
        return levels;
    }

    createTutorialLevels() {
        return [
            {
                id: 1,
                name: "First Take",
                movie: "Action Adventure",
                objective: {
                    type: 'score',
                    target: 500,
                    description: 'Score 500 points'
                },
                moves: 15,
                timeLimit: null,
                specialTiles: [],
                wheelSpins: 1,
                difficulty: 'easy',
                rewards: {
                    tickets: 50,
                    stars: 0,
                    powerups: []
                }
            },
            {
                id: 2,
                name: "Camera Ready",
                movie: "Action Adventure",
                objective: {
                    type: 'score',
                    target: 800,
                    description: 'Score 800 points'
                },
                moves: 20,
                timeLimit: null,
                specialTiles: [],
                wheelSpins: 1,
                difficulty: 'easy',
                rewards: {
                    tickets: 60,
                    stars: 0,
                    powerups: ['re-shoot']
                }
            },
            {
                id: 3,
                name: "Props Master",
                movie: "Action Adventure",
                objective: {
                    type: 'clear_props',
                    target: 5,
                    description: 'Clear 5 prop tiles'
                },
                moves: 18,
                timeLimit: null,
                specialTiles: [
                    { type: TILE_TYPES.PROP, positions: [[1,1], [3,2], [5,3], [2,5], [4,6]] }
                ],
                wheelSpins: 1,
                difficulty: 'easy',
                rewards: {
                    tickets: 70,
                    stars: 0,
                    powerups: []
                }
            },
            {
                id: 4,
                name: "Beat the Clock",
                movie: "Action Adventure",
                objective: {
                    type: 'timed',
                    target: 1000,
                    description: 'Score 1000 points in 60 seconds'
                },
                moves: null,
                timeLimit: 60,
                specialTiles: [],
                wheelSpins: 2,
                difficulty: 'easy',
                rewards: {
                    tickets: 80,
                    stars: 0,
                    powerups: ['directors-cut']
                }
            },
            {
                id: 5,
                name: "Perfect Take",
                movie: "Action Adventure",
                objective: {
                    type: 'no_mistakes',
                    target: 800,
                    description: 'Score 800 points without invalid moves'
                },
                moves: 25,
                timeLimit: null,
                specialTiles: [],
                wheelSpins: 2,
                difficulty: 'medium',
                rewards: {
                    tickets: 100,
                    stars: 1,
                    powerups: ['clapboard-smash']
                }
            }
        ];
    }

    createRegularLevels() {
        const levels = [];
        const movies = [
            { name: "Romantic Comedy", genre: "romance", color: COLORS.RUBY },
            { name: "Sci-Fi Epic", genre: "scifi", color: COLORS.TEAL },
            { name: "Horror Thriller", genre: "horror", color: COLORS.PURPLE }
        ];
        
        for (let i = 6; i <= 30; i++) {
            const movieIndex = Math.floor((i - 6) / 8);
            const movie = movies[movieIndex] || movies[0];
            const levelInMovie = ((i - 6) % 8) + 1;
            
            const level = this.generateLevel(i, movie, levelInMovie);
            levels.push(level);
        }
        
        return levels;
    }

    generateLevel(id, movie, levelInMovie) {
        const difficulty = this.getDifficulty(id);
        const objectives = this.getObjectiveTypes();
        const objectiveType = objectives[Utils.randomInt(0, objectives.length - 1)];
        
        const baseLevel = {
            id,
            name: this.generateLevelName(movie.genre, levelInMovie),
            movie: movie.name,
            difficulty,
            wheelSpins: Math.min(3, Math.floor(id / 5) + 1),
            rewards: this.calculateRewards(id, difficulty)
        };
        
        // Generate objective based on type
        switch (objectiveType) {
            case 'score':
                return {
                    ...baseLevel,
                    objective: {
                        type: 'score',
                        target: this.calculateScoreTarget(id, difficulty),
                        description: `Score ${this.calculateScoreTarget(id, difficulty)} points`
                    },
                    moves: this.calculateMoves(id, difficulty),
                    timeLimit: null,
                    specialTiles: this.generateSpecialTiles(id, difficulty)
                };
                
            case 'clear_props':
                const propCount = Math.min(15, Math.floor(id / 3) + 3);
                return {
                    ...baseLevel,
                    objective: {
                        type: 'clear_props',
                        target: propCount,
                        description: `Clear ${propCount} prop tiles`
                    },
                    moves: this.calculateMoves(id, difficulty) + 5,
                    timeLimit: null,
                    specialTiles: [
                        { type: TILE_TYPES.PROP, count: propCount }
                    ]
                };
                
            case 'timed':
                return {
                    ...baseLevel,
                    objective: {
                        type: 'timed',
                        target: this.calculateScoreTarget(id, difficulty),
                        description: `Score ${this.calculateScoreTarget(id, difficulty)} points in ${this.calculateTimeLimit(id)} seconds`
                    },
                    moves: null,
                    timeLimit: this.calculateTimeLimit(id),
                    specialTiles: this.generateSpecialTiles(id, difficulty)
                };
                
            case 'limited_moves':
                return {
                    ...baseLevel,
                    objective: {
                        type: 'limited_moves',
                        target: this.calculateScoreTarget(id, difficulty) * 0.8,
                        description: `Score ${Math.floor(this.calculateScoreTarget(id, difficulty) * 0.8)} points in ${this.calculateMoves(id, difficulty) - 5} moves`
                    },
                    moves: this.calculateMoves(id, difficulty) - 5,
                    timeLimit: null,
                    specialTiles: this.generateSpecialTiles(id, difficulty)
                };
                
            default:
                return baseLevel;
        }
    }

    getDifficulty(levelId) {
        if (levelId <= 5) return 'tutorial';
        if (levelId <= 15) return 'easy';
        if (levelId <= 25) return 'medium';
        return 'hard';
    }

    getObjectiveTypes() {
        return ['score', 'clear_props', 'timed', 'limited_moves'];
    }

    generateLevelName(genre, levelInMovie) {
        const names = {
            action: ['Explosive Start', 'Chase Scene', 'Final Showdown', 'Stunt Double', 'Car Chase', 'Rooftop Battle', 'Rescue Mission', 'Epic Finale'],
            romance: ['Meet Cute', 'First Date', 'Misunderstanding', 'Grand Gesture', 'Airport Scene', 'Wedding Bells', 'Happy Ending', 'Love Story'],
            scifi: ['Space Station', 'Alien Encounter', 'Time Warp', 'Robot Uprising', 'Distant Planet', 'Wormhole', 'Final Frontier', 'Galaxy Quest'],
            horror: ['Dark Forest', 'Haunted House', 'Jump Scare', 'Final Girl', 'Monster Reveal', 'Creepy Basement', 'Midnight Hour', 'Survival']
        };
        
        const genreNames = names[genre] || names.action;
        return genreNames[Math.min(levelInMovie - 1, genreNames.length - 1)];
    }

    calculateScoreTarget(levelId, difficulty) {
        const baseScore = 500;
        const levelMultiplier = levelId * 100;
        const difficultyMultiplier = {
            'tutorial': 0.5,
            'easy': 0.8,
            'medium': 1.2,
            'hard': 1.6
        };
        
        return Math.floor((baseScore + levelMultiplier) * difficultyMultiplier[difficulty]);
    }

    calculateMoves(levelId, difficulty) {
        const baseMoves = 20;
        const difficultyAdjustment = {
            'tutorial': 5,
            'easy': 3,
            'medium': 0,
            'hard': -3
        };
        
        return baseMoves + difficultyAdjustment[difficulty] + Math.floor(levelId / 10);
    }

    calculateTimeLimit(levelId) {
        return Math.max(45, 90 - Math.floor(levelId / 5) * 5);
    }

    generateSpecialTiles(levelId, difficulty) {
        const specialTiles = [];
        
        // Add wild tiles for higher levels
        if (levelId > 10 && Utils.random(0, 1) < 0.3) {
            specialTiles.push({
                type: TILE_TYPES.WILD,
                count: Math.min(3, Math.floor(levelId / 10))
            });
        }
        
        // Add prop obstacles
        if (difficulty !== 'tutorial' && Utils.random(0, 1) < 0.4) {
            specialTiles.push({
                type: TILE_TYPES.PROP,
                count: Math.min(8, Math.floor(levelId / 5) + 2)
            });
        }
        
        return specialTiles;
    }

    calculateRewards(levelId, difficulty) {
        const baseTickets = 50;
        const levelBonus = levelId * 10;
        const difficultyBonus = {
            'tutorial': 0,
            'easy': 20,
            'medium': 40,
            'hard': 80
        };
        
        const tickets = baseTickets + levelBonus + difficultyBonus[difficulty];
        const stars = levelId % 5 === 0 ? 1 : 0; // Stars for every 5th level
        const powerups = this.calculatePowerupRewards(levelId);
        
        return { tickets, stars, powerups };
    }

    calculatePowerupRewards(levelId) {
        const powerups = [];
        
        // Tutorial levels get specific powerups
        if (levelId === 2) powerups.push('re-shoot');
        if (levelId === 4) powerups.push('directors-cut');
        if (levelId === 5) powerups.push('clapboard-smash');
        
        // Regular powerup rewards
        if (levelId % 10 === 0) {
            powerups.push('spotlight-beam');
        }
        
        if (levelId % 15 === 0) {
            powerups.push('directors-cut', 'clapboard-smash');
        }
        
        return powerups;
    }

    getCurrentLevel() {
        return this.levels.find(level => level.id === this.currentLevel);
    }

    getLevel(levelId) {
        return this.levels.find(level => level.id === levelId);
    }

    isLevelUnlocked(levelId) {
        return levelId <= this.maxLevel;
    }

    completeLevel(levelId, score, stars) {
        const level = this.getLevel(levelId);
        if (!level) return false;
        
        // Update progress
        if (!this.progress[levelId]) {
            this.progress[levelId] = {};
        }
        
        this.progress[levelId].completed = true;
        this.progress[levelId].bestScore = Math.max(this.progress[levelId].bestScore || 0, score);
        this.progress[levelId].stars = Math.max(this.progress[levelId].stars || 0, stars);
        this.progress[levelId].completedAt = Date.now();
        
        // Unlock next level
        if (levelId === this.maxLevel && levelId < this.levels.length) {
            this.maxLevel = levelId + 1;
        }
        
        this.saveProgress();
        return true;
    }

    getLevelProgress(levelId) {
        return this.progress[levelId] || {
            completed: false,
            bestScore: 0,
            stars: 0,
            completedAt: null
        };
    }

    getTotalStars() {
        return Object.values(this.progress).reduce((total, progress) => {
            return total + (progress.stars || 0);
        }, 0);
    }

    getCompletedLevels() {
        return Object.keys(this.progress).filter(levelId => 
            this.progress[levelId].completed
        ).length;
    }

    getMovieProgress(movieName) {
        const movieLevels = this.levels.filter(level => level.movie === movieName);
        const completedCount = movieLevels.filter(level => 
            this.progress[level.id] && this.progress[level.id].completed
        ).length;
        
        return {
            total: movieLevels.length,
            completed: completedCount,
            percentage: Math.floor((completedCount / movieLevels.length) * 100)
        };
    }

    getMovieNames() {
        const movieNames = new Set();
        this.levels.forEach(level => movieNames.add(level.movie));
        return Array.from(movieNames);
    }

    getLevelsByMovie(movieName) {
        return this.levels.filter(level => level.movie === movieName);
    }

    // Boss level system (every 10th level)
    isBossLevel(levelId) {
        return levelId % 10 === 0 && levelId > 0;
    }

    createBossLevel(levelId) {
        const baseLevel = this.getLevel(levelId);
        if (!baseLevel) return null;
        
        return {
            ...baseLevel,
            name: `${baseLevel.name} - PREMIERE`,
            objective: {
                type: 'boss',
                phase1: {
                    type: 'score',
                    target: baseLevel.objective.target,
                    description: `Phase 1: ${baseLevel.objective.description}`
                },
                phase2: {
                    type: 'clear_props',
                    target: 10,
                    description: 'Phase 2: Clear 10 special tiles'
                }
            },
            moves: baseLevel.moves + 10,
            wheelSpins: baseLevel.wheelSpins + 1,
            rewards: {
                tickets: baseLevel.rewards.tickets * 2,
                stars: baseLevel.rewards.stars + 1,
                powerups: [...baseLevel.rewards.powerups, 'spotlight-beam']
            }
        };
    }

    // Daily challenge system
    generateDailyChallenge() {
        const today = new Date().toDateString();
        const challengeId = `daily_${today}`;
        
        // Use date as seed for consistent daily challenges
        const seed = this.hashCode(today);
        const random = this.seededRandom(seed);
        
        const objectives = ['score', 'timed', 'limited_moves'];
        const objective = objectives[Math.floor(random() * objectives.length)];
        
        return {
            id: challengeId,
            name: 'Daily Premiere',
            type: 'daily',
            objective: {
                type: objective,
                target: 2000 + Math.floor(random() * 1000),
                description: this.getDailyChallengeDescription(objective)
            },
            moves: objective === 'limited_moves' ? 15 : 25,
            timeLimit: objective === 'timed' ? 90 : null,
            modifiers: this.getDailyChallengeModifiers(random),
            rewards: {
                tickets: 200,
                stars: 2,
                powerups: ['directors-cut', 'clapboard-smash', 're-shoot']
            },
            expiresAt: this.getTomorrowMidnight()
        };
    }

    getDailyChallengeDescription(objective) {
        const descriptions = {
            score: 'Achieve a high score with special modifiers!',
            timed: 'Race against time with bonus effects!',
            limited_moves: 'Make every move count!'
        };
        return descriptions[objective] || 'Complete the daily challenge!';
    }

    getDailyChallengeModifiers(random) {
        const allModifiers = [
            'double_score_chance',
            'extra_wilds',
            'no_props',
            'rainbow_tiles',
            'chain_bonus'
        ];
        
        const modifierCount = 2 + Math.floor(random() * 2);
        const selectedModifiers = [];
        
        for (let i = 0; i < modifierCount; i++) {
            const modifier = allModifiers[Math.floor(random() * allModifiers.length)];
            if (!selectedModifiers.includes(modifier)) {
                selectedModifiers.push(modifier);
            }
        }
        
        return selectedModifiers;
    }

    getTomorrowMidnight() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    saveProgress() {
        const saveData = {
            currentLevel: this.currentLevel,
            maxLevel: this.maxLevel,
            progress: this.progress
        };
        Utils.saveToLocalStorage('level_progress', saveData);
    }

    loadProgress() {
        const saveData = Utils.loadFromLocalStorage('level_progress');
        if (saveData) {
            this.currentLevel = saveData.currentLevel || 1;
            this.maxLevel = saveData.maxLevel || 1;
            this.progress = saveData.progress || {};
        }
    }

    resetProgress() {
        this.currentLevel = 1;
        this.maxLevel = 1;
        this.progress = {};
        this.saveProgress();
    }

    // Debug methods
    unlockAllLevels() {
        this.maxLevel = this.levels.length;
        this.saveProgress();
    }

    setCurrentLevel(levelId) {
        if (levelId >= 1 && levelId <= this.levels.length) {
            this.currentLevel = levelId;
            this.saveProgress();
        }
    }
}

// Level objectives handler
class LevelObjective {
    constructor(objective) {
        this.type = objective.type;
        this.target = objective.target;
        this.description = objective.description;
        this.current = 0;
        this.completed = false;
        this.failed = false;
        
        // Special objective properties
        this.phase1 = objective.phase1;
        this.phase2 = objective.phase2;
        this.currentPhase = 1;
        this.mistakes = 0;
    }

    update(gameState) {
        switch (this.type) {
            case 'score':
                this.current = gameState.score;
                this.completed = this.current >= this.target;
                break;
                
            case 'clear_props':
                this.current = gameState.propsCleared || 0;
                this.completed = this.current >= this.target;
                break;
                
            case 'timed':
                this.current = gameState.score;
                this.completed = this.current >= this.target;
                this.failed = gameState.timeLeft <= 0 && !this.completed;
                break;
                
            case 'limited_moves':
                this.current = gameState.score;
                this.completed = this.current >= this.target;
                this.failed = gameState.movesLeft <= 0 && !this.completed;
                break;
                
            case 'no_mistakes':
                this.current = gameState.score;
                this.mistakes = gameState.mistakes || 0;
                this.completed = this.current >= this.target && this.mistakes === 0;
                this.failed = this.mistakes > 0;
                break;
                
            case 'boss':
                this.updateBossObjective(gameState);
                break;
        }
    }

    updateBossObjective(gameState) {
        if (this.currentPhase === 1 && this.phase1) {
            const phase1Complete = gameState.score >= this.phase1.target;
            if (phase1Complete) {
                this.currentPhase = 2;
                // Trigger phase 2 changes in game
                if (window.game) {
                    window.game.startBossPhase2();
                }
            }
        } else if (this.currentPhase === 2 && this.phase2) {
            const phase2Complete = (gameState.propsCleared || 0) >= this.phase2.target;
            this.completed = phase2Complete;
        }
    }

    getProgress() {
        if (this.type === 'boss') {
            if (this.currentPhase === 1) {
                return Math.min(1, this.current / this.phase1.target);
            } else {
                return Math.min(1, (gameState.propsCleared || 0) / this.phase2.target);
            }
        }
        
        return Math.min(1, this.current / this.target);
    }

    getCurrentDescription() {
        if (this.type === 'boss') {
            if (this.currentPhase === 1) {
                return this.phase1.description;
            } else {
                return this.phase2.description;
            }
        }
        
        return this.description;
    }

    getProgressText() {
        if (this.type === 'boss') {
            if (this.currentPhase === 1) {
                return `${this.current}/${this.phase1.target}`;
            } else {
                return `${gameState.propsCleared || 0}/${this.phase2.target}`;
            }
        }
        
        return `${this.current}/${this.target}`;
    }
}

// Create global level manager
const levelManager = new LevelManager();