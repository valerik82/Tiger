// Hollywood Crazy Wheel - Utility Functions

class Utils {
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static shuffle(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    static easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static getCanvasPosition(canvas, clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    static isPointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    }

    static isPointInRect(px, py, rx, ry, width, height) {
        return px >= rx && px <= rx + width && py >= ry && py <= ry + height;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
            return false;
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
            return defaultValue;
        }
    }

    static vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static createParticle(x, y, vx, vy, color, size, life) {
        return {
            x, y, vx, vy, color, size, life,
            maxLife: life,
            alpha: 1
        };
    }

    static updateParticle(particle, deltaTime) {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        particle.life -= deltaTime;
        particle.alpha = particle.life / particle.maxLife;
        return particle.life > 0;
    }

    static drawParticle(ctx, particle) {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Color palette for the game
const COLORS = {
    GOLD: '#FFD700',
    PURPLE: '#6A0572',
    RUBY: '#A0027D',
    TEAL: '#008B8B',
    WHITE: '#FFFFFF',
    BLACK: '#000000',
    GRAY: '#CCCCCC',
    DARK_GRAY: '#333333',
    BACKGROUND: '#1A1A2E',
    ACCENT: '#FFED4E'
};

// Game constants
const GAME_CONFIG = {
    BOARD_COLS: 7,
    BOARD_ROWS: 9,
    TILE_SIZE: 40,
    TILE_PADDING: 5,
    CHAIN_MIN_LENGTH: 3,
    WHEEL_SECTORS: 8,
    POWERUP_TYPES: 4,
    MINIGAME_DURATION: 10000, // 10 seconds
    ANIMATION_DURATION: 300,
    PARTICLE_COUNT: 20
};

// Tile types
const TILE_TYPES = {
    CAMERA: { id: 0, color: COLORS.GOLD, icon: '📷', name: 'Camera' },
    FILM: { id: 1, color: COLORS.PURPLE, icon: '🎬', name: 'Film' },
    STAR: { id: 2, color: COLORS.RUBY, icon: '⭐', name: 'Star' },
    TICKET: { id: 3, color: COLORS.TEAL, icon: '🎟️', name: 'Ticket' },
    WILD: { id: 4, color: COLORS.WHITE, icon: '🌟', name: 'Wild' },
    PROP: { id: 5, color: COLORS.GRAY, icon: '🎭', name: 'Prop' }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, COLORS, GAME_CONFIG, TILE_TYPES };
}