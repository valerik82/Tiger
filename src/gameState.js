// Game State Management
export class GameState {
    constructor() {
        // Player resources
        this.tickets = 0;
        this.stars = 0;
        
        // Current game state
        this.currentLevel = 1;
        this.score = 0;
        this.movesLeft = 20;
        this.wheelCharges = 2;
        this.gameMode = 'story'; // story, daily, endless
        
        // Power-ups inventory
        this.powerUps = {
            'directors-cut': 3,
            'clapboard': 2,
            'spotlight': 2,
            'reshoot': 1
        };
        
        // Active modifiers
        this.activeModifiers = {
            doubleScore: false,
            timeFrozen: false,
            mistakesAllowed: 0
        };
        
        // Meta progression
        this.unlockedMovies = [];
        this.staffCards = [];
        this.dailyStreak = 0;
        this.lastPlayDate = null;
        
        // Settings
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.vibrationEnabled = true;
        
        // Statistics
        this.stats = {
            totalScore: 0,
            tilesCleared: 0,
            loopsCreated: 0,
            perfectLevels: 0,
            moviesCompleted: 0,
            miniGamesPlayed: 0,
            wheelSpins: 0
        };
        
        // Daily challenges
        this.dailyChallenges = this.generateDailyChallenges();
        
        // Time-limited data
        this.timeLimit = null;
        this.timeFrozen = false;
    }
    
    generateDailyChallenges() {
        const challenges = [
            { name: 'Score Master', target: 10000, current: 0, reward: 50 },
            { name: 'Tile Crusher', target: 500, current: 0, reward: 30 },
            { name: 'Loop Expert', target: 5, current: 0, reward: 40 },
            { name: 'Perfect Run', target: 3, current: 0, reward: 60 }
        ];
        
        // Pick 3 random challenges for the day
        const selected = [];
        while (selected.length < 3) {
            const challenge = challenges[Math.floor(Math.random() * challenges.length)];
            if (!selected.includes(challenge)) {
                selected.push({...challenge});
            }
        }
        
        return selected;
    }
    
    updateDailyChallenge(type, value) {
        this.dailyChallenges.forEach(challenge => {
            if (challenge.name.toLowerCase().includes(type)) {
                challenge.current += value;
                
                // Check if completed
                if (challenge.current >= challenge.target && !challenge.completed) {
                    challenge.completed = true;
                    this.tickets += challenge.reward;
                    return challenge;
                }
            }
        });
        return null;
    }
    
    checkDailyStreak() {
        const today = new Date().toDateString();
        const lastPlay = this.lastPlayDate ? new Date(this.lastPlayDate).toDateString() : null;
        
        if (lastPlay !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastPlay === yesterday.toDateString()) {
                this.dailyStreak++;
            } else {
                this.dailyStreak = 1;
            }
            
            this.lastPlayDate = today;
            
            // Streak rewards
            if (this.dailyStreak % 7 === 0) {
                this.stars += 10;
                this.powerUps['directors-cut'] += 2;
                return { type: 'weekly', stars: 10, powerups: 2 };
            } else if (this.dailyStreak % 3 === 0) {
                this.tickets += 100;
                return { type: 'threeday', tickets: 100 };
            }
        }
        
        return null;
    }
    
    applyMovieBuff(movie) {
        // Apply passive buffs from completed movies
        switch(movie.genre) {
            case 'Action':
                // +10% score permanently
                this.stats.scoreMultiplier = (this.stats.scoreMultiplier || 1) * 1.1;
                break;
            case 'Romance':
                // +2 starting moves
                this.movesLeft += 2;
                break;
            case 'Sci-Fi':
                // +1 wheel charge at start
                this.wheelCharges += 1;
                break;
            case 'Comedy':
                // +15% tickets
                this.stats.ticketMultiplier = (this.stats.ticketMultiplier || 1) * 1.15;
                break;
            case 'Thriller':
                // Extra power-up at start
                Object.keys(this.powerUps).forEach(key => {
                    this.powerUps[key] += 1;
                });
                break;
        }
    }
    
    reset() {
        this.score = 0;
        this.movesLeft = 20;
        this.wheelCharges = 2;
        this.activeModifiers = {
            doubleScore: false,
            timeFrozen: false,
            mistakesAllowed: 0
        };
    }
    
    save() {
        const saveData = {
            tickets: this.tickets,
            stars: this.stars,
            currentLevel: this.currentLevel,
            powerUps: this.powerUps,
            unlockedMovies: this.unlockedMovies,
            staffCards: this.staffCards,
            dailyStreak: this.dailyStreak,
            lastPlayDate: this.lastPlayDate,
            stats: this.stats,
            settings: {
                soundEnabled: this.soundEnabled,
                musicEnabled: this.musicEnabled,
                vibrationEnabled: this.vibrationEnabled
            }
        };
        
        return JSON.stringify(saveData);
    }
    
    load(saveData) {
        try {
            const data = JSON.parse(saveData);
            
            this.tickets = data.tickets || 0;
            this.stars = data.stars || 0;
            this.currentLevel = data.currentLevel || 1;
            this.powerUps = data.powerUps || this.powerUps;
            this.unlockedMovies = data.unlockedMovies || [];
            this.staffCards = data.staffCards || [];
            this.dailyStreak = data.dailyStreak || 0;
            this.lastPlayDate = data.lastPlayDate;
            this.stats = data.stats || this.stats;
            
            if (data.settings) {
                this.soundEnabled = data.settings.soundEnabled !== false;
                this.musicEnabled = data.settings.musicEnabled !== false;
                this.vibrationEnabled = data.settings.vibrationEnabled !== false;
            }
            
            return true;
        } catch (e) {
            console.error('Failed to load save data:', e);
            return false;
        }
    }
}