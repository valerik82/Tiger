// Hollywood Crazy Wheel - Main Entry Point

// Global game instance will be created by game.js
window.game = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Hollywood Crazy Wheel - Starting up...');
    
    // Check for mobile device
    if (Utils.isMobile()) {
        document.body.classList.add('mobile');
        console.log('📱 Mobile device detected');
    }
    
    // Set up viewport for mobile
    setupMobileViewport();
    
    // Initialize service worker for PWA support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(console.warn);
    }
    
    // Prevent context menu on long press (mobile)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Prevent zoom on double tap (mobile)
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            if (window.game && window.game.board) {
                // Recalculate board dimensions if needed
                window.game.board.canvas.style.width = '100%';
                window.game.board.canvas.style.height = 'auto';
            }
        }, 100);
    });
    
    // Keyboard shortcuts for development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setupDebugKeys();
    }
    
    console.log('🎮 Game initialization complete!');
});

function setupMobileViewport() {
    // Prevent viewport scaling
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
    }
    
    // Handle safe areas for notched devices
    if (CSS.supports('padding-top: env(safe-area-inset-top)')) {
        document.body.style.paddingTop = 'env(safe-area-inset-top)';
        document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
        document.body.style.paddingLeft = 'env(safe-area-inset-left)';
        document.body.style.paddingRight = 'env(safe-area-inset-right)';
    }
}

function setupDebugKeys() {
    document.addEventListener('keydown', function(event) {
        if (!window.game) return;
        
        // Debug shortcuts (only in development)
        switch(event.code) {
            case 'KeyC':
                if (event.ctrlKey) {
                    // Add currency
                    economyManager.addDebugCurrency();
                    console.log('💰 Added debug currency');
                }
                break;
                
            case 'KeyL':
                if (event.ctrlKey) {
                    // Unlock all levels
                    levelManager.unlockAllLevels();
                    console.log('🔓 Unlocked all levels');
                }
                break;
                
            case 'KeyP':
                if (event.ctrlKey) {
                    // Add all powerups
                    Object.keys(powerupManager.powerups).forEach(powerupId => {
                        powerupManager.addPowerup(powerupId, 5);
                    });
                    console.log('⚡ Added all powerups');
                }
                break;
                
            case 'KeyW':
                if (event.ctrlKey && window.game.wheel) {
                    // Force wheel spin
                    window.game.wheelSpinsLeft = 1;
                    window.game.spinWheel();
                    console.log('🎡 Forced wheel spin');
                }
                break;
                
            case 'KeyN':
                if (event.ctrlKey && window.game.currentLevel) {
                    // Complete current level
                    window.game.completeLevel();
                    console.log('✅ Force completed level');
                }
                break;
                
            case 'Escape':
                // Toggle pause
                if (window.game.state === 'playing') {
                    window.game.pauseGame();
                } else {
                    window.game.resumeGame();
                }
                break;
        }
    });
    
    console.log('🛠️ Debug keys enabled:');
    console.log('  Ctrl+C: Add currency');
    console.log('  Ctrl+L: Unlock all levels');
    console.log('  Ctrl+P: Add all powerups');
    console.log('  Ctrl+W: Force wheel spin');
    console.log('  Ctrl+N: Complete level');
    console.log('  Escape: Toggle pause');
}

// Performance monitoring
let performanceStats = {
    frameCount: 0,
    lastTime: performance.now(),
    fps: 60
};

function updatePerformanceStats() {
    const now = performance.now();
    const deltaTime = now - performanceStats.lastTime;
    
    performanceStats.frameCount++;
    
    if (deltaTime >= 1000) {
        performanceStats.fps = Math.round((performanceStats.frameCount * 1000) / deltaTime);
        performanceStats.frameCount = 0;
        performanceStats.lastTime = now;
        
        // Log performance warnings
        if (performanceStats.fps < 30) {
            console.warn(`⚠️ Low FPS detected: ${performanceStats.fps}`);
        }
    }
    
    requestAnimationFrame(updatePerformanceStats);
}

// Start performance monitoring in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    requestAnimationFrame(updatePerformanceStats);
}

// Error handling
window.addEventListener('error', function(event) {
    console.error('🚨 Game Error:', event.error);
    
    // Try to recover gracefully
    if (window.game) {
        try {
            window.game.showNotification('An error occurred. Game state saved.', 'error');
            
            // Save current progress
            if (window.game.levels) {
                window.game.levels.saveProgress();
            }
            if (window.game.economy) {
                window.game.economy.saveCurrencies();
            }
            if (window.game.powerups) {
                window.game.powerups.savePowerups();
            }
        } catch (e) {
            console.error('🚨 Failed to save game state:', e);
        }
    }
});

// Handle visibility change (tab switching, app backgrounding)
document.addEventListener('visibilitychange', function() {
    if (window.game) {
        if (document.hidden) {
            // Game going to background
            if (window.game.state === 'playing') {
                window.game.pauseGame();
            }
            
            // Save game state
            try {
                window.game.levels.saveProgress();
                window.game.economy.saveCurrencies();
                window.game.powerups.savePowerups();
            } catch (e) {
                console.warn('Failed to save on background:', e);
            }
        } else {
            // Game coming to foreground
            if (audioManager) {
                audioManager.resumeAudioContext();
            }
        }
    }
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.game) {
        try {
            // Final save
            window.game.levels.saveProgress();
            window.game.economy.saveCurrencies();
            window.game.powerups.savePowerups();
        } catch (e) {
            console.warn('Failed to save on unload:', e);
        }
    }
});

// Expose game API for external integrations
window.HollywoodCrazyWheel = {
    // Game state
    getGameState: () => window.game ? window.game.state : 'loading',
    getCurrentLevel: () => window.game ? window.game.currentLevel : null,
    getScore: () => window.game ? window.game.score : 0,
    
    // Currency
    getCurrency: (type) => economyManager.getCurrency(type),
    addCurrency: (type, amount) => economyManager.addCurrency(type, amount),
    
    // Levels
    getCurrentLevelId: () => levelManager.currentLevel,
    getMaxLevel: () => levelManager.maxLevel,
    getTotalStars: () => levelManager.getTotalStars(),
    
    // Powerups
    getPowerupCount: (id) => powerupManager.getPowerupCount(id),
    addPowerup: (id, count) => powerupManager.addPowerup(id, count),
    
    // Events (for external integrations like analytics)
    on: (event, callback) => {
        document.addEventListener(`game_${event}`, callback);
    },
    
    // Ad integration hooks
    showRewardedAd: (adType) => economyManager.watchRewardedAd(adType),
    hasNoAds: () => economyManager.hasNoAds(),
    
    // Development/testing
    dev: {
        unlockAllLevels: () => levelManager.unlockAllLevels(),
        addDebugCurrency: () => economyManager.addDebugCurrency(),
        completeLevel: () => window.game && window.game.completeLevel(),
        setLevel: (id) => levelManager.setCurrentLevel(id)
    }
};

// Analytics events (placeholder for real implementation)
function trackEvent(eventName, properties = {}) {
    console.log(`📊 Analytics: ${eventName}`, properties);
    
    // Dispatch custom event for external listeners
    document.dispatchEvent(new CustomEvent(`game_${eventName}`, { 
        detail: properties 
    }));
}

// Track key game events
document.addEventListener('DOMContentLoaded', () => {
    trackEvent('game_start', { timestamp: Date.now() });
});

// Welcome message
console.log(`
🎬 HOLLYWOOD CRAZY WHEEL 🎡
===========================
Welcome to the most glamorous puzzle game!

🎮 Game Features:
• Link-3 puzzle mechanics with Hollywood theme
• Crazy Wheel with 8 different effects
• 30+ handcrafted levels across 3 movies
• 2 exciting mini-games
• 4 powerful power-ups
• Daily challenges and rewards
• Movie collection system

🛠️ Technical Info:
• HTML5 Canvas-based rendering
• Responsive design for mobile & desktop
• Local storage for game progress
• Web Audio API for sound effects
• Progressive Web App ready

Enjoy the show! 🌟
`);

// Game is ready!
console.log('🎬 Lights, Camera, Action! Game ready to play!');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.HollywoodCrazyWheel;
}