// Audio Manager - Handles all game sounds
export class AudioManager {
    constructor() {
        this.sounds = {
            click: document.getElementById('audio-click'),
            combo: document.getElementById('audio-combo'),
            wheel: document.getElementById('audio-wheel'),
            win: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSl+0Oy9diMFl2+z5cp2IwVWq8Pm6aoqCg==')
        };
        
        this.musicEnabled = true;
        this.soundEnabled = true;
        
        // Create background music
        this.createBackgroundMusic();
        
        // Initialize volumes
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = 0.3;
            }
        });
    }
    
    createBackgroundMusic() {
        // Create a simple looping background track using Web Audio API
        this.audioContext = null;
        this.musicGain = null;
        this.musicSource = null;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create gain node for volume control
            this.musicGain = this.audioContext.createGain();
            this.musicGain.gain.value = 0.2;
            this.musicGain.connect(this.audioContext.destination);
            
            // Create a simple melody pattern
            this.playBackgroundMusic();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playBackgroundMusic() {
        if (!this.audioContext || !this.musicEnabled) return;
        
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale
        const pattern = [0, 2, 4, 5, 4, 2, 0, 1, 3, 5, 4, 2]; // Simple melody pattern
        let noteIndex = 0;
        
        const playNote = () => {
            if (!this.musicEnabled) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.musicGain);
            
            oscillator.frequency.value = notes[pattern[noteIndex]];
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
            
            noteIndex = (noteIndex + 1) % pattern.length;
            
            // Schedule next note
            setTimeout(playNote, 300);
        };
        
        // Start playing
        playNote();
    }
    
    playSound(soundName) {
        if (!this.soundEnabled) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Clone and play for overlapping sounds
            const clone = sound.cloneNode();
            clone.volume = 0.3;
            clone.play().catch(e => {
                // Handle autoplay restrictions
                console.log('Sound play failed:', e);
            });
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (this.musicGain) {
            this.musicGain.gain.value = this.musicEnabled ? 0.2 : 0;
        }
        
        if (this.musicEnabled && this.audioContext) {
            this.playBackgroundMusic();
        }
        
        return this.musicEnabled;
    }
    
    setVolume(volume) {
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        
        Object.values(this.sounds).forEach(sound => {
            if (sound) {
                sound.volume = normalizedVolume * 0.3;
            }
        });
        
        if (this.musicGain) {
            this.musicGain.gain.value = normalizedVolume * 0.2;
        }
    }
    
    vibrate(pattern = [50]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}