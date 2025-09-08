// Hollywood Crazy Wheel - Economy System

class EconomyManager {
    constructor() {
        this.currencies = {
            tickets: 0,  // Soft currency
            stars: 0     // Hard currency (premium)
        };
        
        this.prices = {
            powerups: {
                'directors-cut': { tickets: 100 },
                'clapboard-smash': { tickets: 80 },
                'spotlight-beam': { tickets: 150 },
                're-shoot': { tickets: 50 }
            },
            moves: { tickets: 20 },
            time: { tickets: 30 },
            wheelSpin: { tickets: 50 },
            starterPack: { stars: 5 },
            noAds: { stars: 10 }
        };
        
        this.loadCurrencies();
        this.updateCurrencyDisplay();
    }

    // Currency management
    getCurrency(type) {
        return this.currencies[type] || 0;
    }

    addCurrency(type, amount) {
        if (this.currencies.hasOwnProperty(type)) {
            this.currencies[type] += amount;
            this.saveCurrencies();
            this.updateCurrencyDisplay();
            this.showCurrencyGain(type, amount);
            return true;
        }
        return false;
    }

    spendCurrency(type, amount) {
        if (this.canAfford(type, amount)) {
            this.currencies[type] -= amount;
            this.saveCurrencies();
            this.updateCurrencyDisplay();
            return true;
        }
        return false;
    }

    canAfford(type, amount) {
        return this.getCurrency(type) >= amount;
    }

    // Reward system
    rewardLevelCompletion(level, stars, score) {
        const rewards = this.calculateLevelRewards(level, stars, score);
        
        this.addCurrency('tickets', rewards.tickets);
        
        if (rewards.stars > 0) {
            this.addCurrency('stars', rewards.stars);
        }
        
        return rewards;
    }

    calculateLevelRewards(level, stars, score) {
        const baseTickets = 50;
        const levelBonus = level * 5;
        const starBonus = stars * 20;
        const scoreBonus = Math.floor(score / 100);
        
        const totalTickets = baseTickets + levelBonus + starBonus + scoreBonus;
        const starReward = stars >= 3 ? 1 : 0;
        
        return {
            tickets: totalTickets,
            stars: starReward
        };
    }

    rewardChainCompletion(chainLength, score) {
        const ticketReward = Math.max(1, Math.floor(chainLength / 2));
        this.addCurrency('tickets', ticketReward);
        
        // Bonus for very long chains
        if (chainLength >= 8) {
            this.addCurrency('tickets', 5);
        }
        
        return ticketReward;
    }

    rewardMinigameCompletion(score, performance) {
        const baseTickets = 20;
        const scoreBonus = Math.floor(score / 10);
        const performanceBonus = performance === 'excellent' ? 30 : 
                                performance === 'good' ? 15 : 0;
        
        const totalTickets = baseTickets + scoreBonus + performanceBonus;
        this.addCurrency('tickets', totalTickets);
        
        return totalTickets;
    }

    rewardDailyBonus() {
        const dailyTickets = 100;
        const dailyStars = 1;
        
        this.addCurrency('tickets', dailyTickets);
        this.addCurrency('stars', dailyStars);
        
        return { tickets: dailyTickets, stars: dailyStars };
    }

    // Shop system
    purchasePowerup(powerupId, quantity = 1) {
        const price = this.prices.powerups[powerupId];
        if (!price) return false;
        
        const totalCost = price.tickets * quantity;
        
        if (this.canAfford('tickets', totalCost)) {
            this.spendCurrency('tickets', totalCost);
            
            // Add powerup to inventory
            if (window.powerupManager) {
                window.powerupManager.addPowerup(powerupId, quantity);
            }
            
            this.trackPurchase('powerup', powerupId, quantity, totalCost);
            return true;
        }
        
        return false;
    }

    purchaseExtraMoves(quantity = 5) {
        const totalCost = this.prices.moves.tickets;
        
        if (this.canAfford('tickets', totalCost)) {
            this.spendCurrency('tickets', totalCost);
            
            // Add moves to current game
            if (window.game) {
                window.game.addMoves(quantity);
            }
            
            this.trackPurchase('moves', quantity, 1, totalCost);
            return true;
        }
        
        return false;
    }

    purchaseExtraTime(seconds = 30) {
        const totalCost = this.prices.time.tickets;
        
        if (this.canAfford('tickets', totalCost)) {
            this.spendCurrency('tickets', totalCost);
            
            // Add time to current game
            if (window.game) {
                window.game.addTime(seconds * 1000);
            }
            
            this.trackPurchase('time', seconds, 1, totalCost);
            return true;
        }
        
        return false;
    }

    purchaseWheelSpin() {
        const totalCost = this.prices.wheelSpin.tickets;
        
        if (this.canAfford('tickets', totalCost)) {
            this.spendCurrency('tickets', totalCost);
            
            // Add wheel spin to current game
            if (window.game) {
                window.game.addWheelSpin();
            }
            
            this.trackPurchase('wheel_spin', 1, 1, totalCost);
            return true;
        }
        
        return false;
    }

    // Premium purchases
    purchaseStarterPack() {
        const price = this.prices.starterPack.stars;
        
        if (this.canAfford('stars', price)) {
            this.spendCurrency('stars', price);
            
            // Give starter pack contents
            this.addCurrency('tickets', 500);
            
            if (window.powerupManager) {
                window.powerupManager.addPowerup('directors-cut', 3);
                window.powerupManager.addPowerup('clapboard-smash', 3);
                window.powerupManager.addPowerup('spotlight-beam', 2);
                window.powerupManager.addPowerup('re-shoot', 5);
            }
            
            // 7 days of no ads
            this.activateNoAds(7);
            
            this.trackPurchase('starter_pack', 1, 1, price, 'stars');
            return true;
        }
        
        return false;
    }

    purchaseNoAds(days = 30) {
        const price = this.prices.noAds.stars;
        
        if (this.canAfford('stars', price)) {
            this.spendCurrency('stars', price);
            this.activateNoAds(days);
            
            this.trackPurchase('no_ads', days, 1, price, 'stars');
            return true;
        }
        
        return false;
    }

    activateNoAds(days) {
        const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
        Utils.saveToLocalStorage('no_ads_expires', expiresAt);
    }

    hasNoAds() {
        const expiresAt = Utils.loadFromLocalStorage('no_ads_expires', 0);
        return Date.now() < expiresAt;
    }

    // Ad rewards
    watchRewardedAd(adType) {
        // Simulate ad watching (in real implementation, this would integrate with ad SDK)
        return new Promise((resolve) => {
            setTimeout(() => {
                const reward = this.getAdReward(adType);
                this.giveAdReward(reward);
                resolve(reward);
            }, 1000);
        });
    }

    getAdReward(adType) {
        const rewards = {
            'extra_moves': { type: 'moves', amount: 5 },
            'extra_time': { type: 'time', amount: 30 },
            'wheel_spin': { type: 'wheel_spin', amount: 1 },
            'currency': { type: 'tickets', amount: 50 },
            'powerup': { type: 'powerup', powerupId: this.getRandomPowerup() }
        };
        
        return rewards[adType] || rewards.currency;
    }

    giveAdReward(reward) {
        switch (reward.type) {
            case 'tickets':
                this.addCurrency('tickets', reward.amount);
                break;
            case 'stars':
                this.addCurrency('stars', reward.amount);
                break;
            case 'moves':
                if (window.game) {
                    window.game.addMoves(reward.amount);
                }
                break;
            case 'time':
                if (window.game) {
                    window.game.addTime(reward.amount * 1000);
                }
                break;
            case 'wheel_spin':
                if (window.game) {
                    window.game.addWheelSpin();
                }
                break;
            case 'powerup':
                if (window.powerupManager) {
                    window.powerupManager.addPowerup(reward.powerupId, 1);
                }
                break;
        }
        
        this.trackAdView(reward.type, reward.amount);
    }

    getRandomPowerup() {
        const powerups = ['directors-cut', 'clapboard-smash', 'spotlight-beam', 're-shoot'];
        return powerups[Utils.randomInt(0, powerups.length - 1)];
    }

    // Daily rewards
    claimDailyReward() {
        const lastClaimDate = Utils.loadFromLocalStorage('last_daily_claim', '');
        const today = new Date().toDateString();
        
        if (lastClaimDate !== today) {
            const streak = this.getDailyStreak();
            const reward = this.calculateDailyReward(streak);
            
            this.addCurrency('tickets', reward.tickets);
            if (reward.stars > 0) {
                this.addCurrency('stars', reward.stars);
            }
            
            // Give powerups
            if (reward.powerups && window.powerupManager) {
                reward.powerups.forEach(powerup => {
                    window.powerupManager.addPowerup(powerup.id, powerup.count);
                });
            }
            
            Utils.saveToLocalStorage('last_daily_claim', today);
            this.updateDailyStreak();
            
            return reward;
        }
        
        return null;
    }

    getDailyStreak() {
        const streak = Utils.loadFromLocalStorage('daily_streak', 0);
        const lastClaimDate = Utils.loadFromLocalStorage('last_daily_claim', '');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Reset streak if more than 1 day gap
        if (lastClaimDate !== yesterday.toDateString() && lastClaimDate !== '') {
            return 0;
        }
        
        return streak;
    }

    updateDailyStreak() {
        const currentStreak = this.getDailyStreak();
        Utils.saveToLocalStorage('daily_streak', currentStreak + 1);
    }

    calculateDailyReward(streak) {
        const baseReward = {
            tickets: 100,
            stars: 0,
            powerups: []
        };
        
        // Streak bonuses
        const streakBonus = Math.min(streak, 7) * 20;
        baseReward.tickets += streakBonus;
        
        // Special rewards for streak milestones
        if (streak >= 3) {
            baseReward.powerups.push({ id: 're-shoot', count: 2 });
        }
        
        if (streak >= 5) {
            baseReward.stars = 1;
            baseReward.powerups.push({ id: 'directors-cut', count: 1 });
        }
        
        if (streak >= 7) {
            baseReward.stars = 2;
            baseReward.powerups.push({ id: 'spotlight-beam', count: 1 });
        }
        
        return baseReward;
    }

    // Analytics and tracking
    trackPurchase(itemType, itemId, quantity, cost, currency = 'tickets') {
        const purchase = {
            itemType,
            itemId,
            quantity,
            cost,
            currency,
            timestamp: Date.now()
        };
        
        const purchases = Utils.loadFromLocalStorage('purchases', []);
        purchases.push(purchase);
        Utils.saveToLocalStorage('purchases', purchases);
    }

    trackAdView(rewardType, amount) {
        const adView = {
            rewardType,
            amount,
            timestamp: Date.now()
        };
        
        const adViews = Utils.loadFromLocalStorage('ad_views', []);
        adViews.push(adView);
        Utils.saveToLocalStorage('ad_views', adViews);
    }

    getSpendingStats() {
        const purchases = Utils.loadFromLocalStorage('purchases', []);
        const stats = {
            totalTicketsSpent: 0,
            totalStarsSpent: 0,
            purchaseCount: purchases.length,
            favoriteItem: null
        };
        
        const itemCounts = {};
        
        purchases.forEach(purchase => {
            if (purchase.currency === 'tickets') {
                stats.totalTicketsSpent += purchase.cost;
            } else if (purchase.currency === 'stars') {
                stats.totalStarsSpent += purchase.cost;
            }
            
            const key = `${purchase.itemType}_${purchase.itemId}`;
            itemCounts[key] = (itemCounts[key] || 0) + purchase.quantity;
        });
        
        // Find most purchased item
        let maxCount = 0;
        for (const [item, count] of Object.entries(itemCounts)) {
            if (count > maxCount) {
                maxCount = count;
                stats.favoriteItem = item;
            }
        }
        
        return stats;
    }

    // UI updates
    updateCurrencyDisplay() {
        const ticketsElement = document.getElementById('tickets-count');
        const starsElement = document.getElementById('stars-count');
        
        if (ticketsElement) {
            ticketsElement.textContent = Utils.formatNumber(this.currencies.tickets);
        }
        
        if (starsElement) {
            starsElement.textContent = Utils.formatNumber(this.currencies.stars);
        }
    }

    showCurrencyGain(type, amount) {
        const icon = type === 'tickets' ? '🎟️' : '⭐';
        const color = type === 'tickets' ? COLORS.TEAL : COLORS.GOLD;
        
        if (window.game) {
            window.game.showFloatingText(
                `+${amount} ${icon}`,
                window.innerWidth / 2,
                100,
                color
            );
        }
    }

    // Save/Load
    saveCurrencies() {
        Utils.saveToLocalStorage('currencies', this.currencies);
    }

    loadCurrencies() {
        const saved = Utils.loadFromLocalStorage('currencies');
        if (saved) {
            this.currencies = { ...this.currencies, ...saved };
        }
    }

    // Debug methods
    addDebugCurrency() {
        this.addCurrency('tickets', 1000);
        this.addCurrency('stars', 10);
    }

    resetCurrencies() {
        this.currencies = { tickets: 0, stars: 0 };
        this.saveCurrencies();
        this.updateCurrencyDisplay();
    }

    // Special offers and events
    getSpecialOffers() {
        const offers = [];
        const now = Date.now();
        
        // Weekend bonus offer
        const weekend = new Date().getDay();
        if (weekend === 0 || weekend === 6) {
            offers.push({
                id: 'weekend_bonus',
                title: 'Weekend Special',
                description: 'Double tickets from level completion!',
                discount: 0,
                multiplier: 2,
                expiresAt: this.getNextMondayMidnight()
            });
        }
        
        // New player offer (first 24 hours)
        const firstPlayTime = Utils.loadFromLocalStorage('first_play_time', now);
        if (now - firstPlayTime < 24 * 60 * 60 * 1000) {
            offers.push({
                id: 'new_player',
                title: 'Welcome Bonus',
                description: 'Starter pack 50% off!',
                discount: 0.5,
                originalPrice: { stars: 5 },
                discountedPrice: { stars: 3 },
                expiresAt: firstPlayTime + (24 * 60 * 60 * 1000)
            });
        }
        
        return offers;
    }

    getNextMondayMidnight() {
        const date = new Date();
        const daysUntilMonday = (1 + 7 - date.getDay()) % 7;
        date.setDate(date.getDate() + daysUntilMonday);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }

    // Seasonal events
    getSeasonalMultipliers() {
        const now = new Date();
        const month = now.getMonth();
        const day = now.getDate();
        
        // Halloween (October)
        if (month === 9) {
            return { tickets: 1.5, description: 'Halloween Bonus!' };
        }
        
        // Christmas season (December 15-31)
        if (month === 11 && day >= 15) {
            return { tickets: 2.0, description: 'Holiday Bonus!' };
        }
        
        // New Year (January 1-7)
        if (month === 0 && day <= 7) {
            return { tickets: 1.8, description: 'New Year Bonus!' };
        }
        
        return { tickets: 1.0, description: null };
    }
}

// Create global economy manager
const economyManager = new EconomyManager();