// Hollywood Crazy Wheel - Audio Manager

class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.volume = Utils.loadFromLocalStorage('audio_volume', 0.7);
        this.musicVolume = Utils.loadFromLocalStorage('music_volume', 0.5);
        this.sfxEnabled = Utils.loadFromLocalStorage('sfx_enabled', true);
        this.musicEnabled = Utils.loadFromLocalStorage('music_enabled', true);
        this.currentMusic = null;
        
        this.initAudioContext();
        this.createSounds();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volume;
        } catch (e) {
            console.warn('Web Audio API not supported, falling back to HTML5 audio');
            this.audioContext = null;
        }
    }

    createSounds() {
        // Create synthetic sounds using Web Audio API or fallback to HTML5 audio
        this.createSound('tile_select', this.generateTileSelectSound());
        this.createSound('chain_complete', this.generateChainCompleteSound());
        this.createSound('wheel_spin', this.generateWheelSpinSound());
        this.createSound('powerup_activate', this.generatePowerupSound());
        this.createSound('level_complete', this.generateLevelCompleteSound());
        this.createSound('button_click', this.generateButtonClickSound());
        this.createSound('minigame_start', this.generateMinigameStartSound());
        this.createSound('score_increment', this.generateScoreIncrementSound());
        this.createSound('crowd_cheer', this.generateCrowdCheerSound());
        this.createSound('camera_shutter', this.generateCameraShutterSound());
    }

    createSound(name, audioBuffer) {
        if (this.audioContext && audioBuffer) {
            this.sounds[name] = audioBuffer;
        } else {
            // Fallback to HTML5 audio with data URLs for simple sounds
            this.sounds[name] = this.createFallbackSound(name);
        }
    }

    createFallbackSound(name) {
        const audio = new Audio();
        // Create simple beep sounds using data URLs
        const frequency = this.getSoundFrequency(name);
        const duration = this.getSoundDuration(name);
        audio.src = this.generateBeepDataURL(frequency, duration);
        return audio;
    }

    getSoundFrequency(name) {
        const frequencies = {
            'tile_select': 800,
            'chain_complete': 1200,
            'wheel_spin': 400,
            'powerup_activate': 1500,
            'level_complete': 2000,
            'button_click': 600,
            'minigame_start': 1000,
            'score_increment': 900,
            'crowd_cheer': 500,
            'camera_shutter': 300
        };
        return frequencies[name] || 440;
    }

    getSoundDuration(name) {
        const durations = {
            'tile_select': 0.1,
            'chain_complete': 0.5,
            'wheel_spin': 2.0,
            'powerup_activate': 0.3,
            'level_complete': 1.0,
            'button_click': 0.1,
            'minigame_start': 0.5,
            'score_increment': 0.1,
            'crowd_cheer': 1.5,
            'camera_shutter': 0.2
        };
        return durations[name] || 0.2;
    }

    generateBeepDataURL(frequency, duration) {
        const sampleRate = 22050;
        const samples = sampleRate * duration;
        const buffer = new ArrayBuffer(44 + samples * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples * 2, true);
        
        // Generate sine wave
        for (let i = 0; i < samples; i++) {
            const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
            const envelope = Math.max(0, 1 - (i / samples)); // Fade out
            view.setInt16(44 + i * 2, sample * envelope * 32767, true);
        }
        
        const blob = new Blob([buffer], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
    }

    generateTileSelectSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 10) * 0.3;
        }
        
        return buffer;
    }

    generateChainCompleteSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 600 + Math.sin(t * 20) * 200;
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 2) * 0.4;
        }
        
        return buffer;
    }

    generateWheelSpinSound() {
        if (!this.audioContext) return null;
        
        const duration = 2.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 200 + Math.sin(t * 15) * 100;
            const noise = (Math.random() - 0.5) * 0.1;
            data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.2 + noise) * (1 - t / duration);
        }
        
        return buffer;
    }

    generatePowerupSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 1000 + t * 500;
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3) * 0.5;
        }
        
        return buffer;
    }

    generateLevelCompleteSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.0;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        const notes = [523, 659, 784, 1047]; // C, E, G, C
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t * 4) % notes.length;
            const freq = notes[noteIndex];
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 1) * 0.4;
        }
        
        return buffer;
    }

    generateMinigameStartSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 800 + Math.sin(t * 10) * 200;
            data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t / duration) * 0.4;
        }
        
        return buffer;
    }

    generateScoreIncrementSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * 900 * t) * Math.exp(-t * 20) * 0.2;
        }
        
        return buffer;
    }

    generateCrowdCheerSound() {
        if (!this.audioContext) return null;
        
        const duration = 1.5;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() - 0.5) * 0.5;
            const lowFreq = Math.sin(2 * Math.PI * 200 * t) * 0.1;
            data[i] = (noise + lowFreq) * (1 - t / duration) * 0.3;
        }
        
        return buffer;
    }

    generateCameraShutterSound() {
        if (!this.audioContext) return null;
        
        const duration = 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = (Math.random() - 0.5) * 0.8;
            const click = Math.sin(2 * Math.PI * 2000 * t) * Math.exp(-t * 50);
            data[i] = (noise * 0.3 + click) * 0.4;
        }
        
        return buffer;
    }

    playSound(name, volume = 1.0) {
        if (!this.sfxEnabled || !this.sounds[name]) return;
        
        try {
            if (this.audioContext && this.sounds[name] instanceof AudioBuffer) {
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();
                
                source.buffer = this.sounds[name];
                gainNode.gain.value = volume * this.volume;
                
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                source.start();
            } else if (this.sounds[name] instanceof Audio) {
                const audio = this.sounds[name].cloneNode();
                audio.volume = volume * this.volume;
                audio.play().catch(e => console.warn('Failed to play sound:', e));
            }
        } catch (e) {
            console.warn('Failed to play sound:', e);
        }
    }

    playMusic(name, loop = true) {
        if (!this.musicEnabled) return;
        
        this.stopMusic();
        
        if (this.music[name]) {
            this.currentMusic = this.music[name];
            this.currentMusic.volume = this.musicVolume;
            this.currentMusic.loop = loop;
            this.currentMusic.play().catch(e => console.warn('Failed to play music:', e));
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    setVolume(volume) {
        this.volume = Utils.clamp(volume, 0, 1);
        Utils.saveToLocalStorage('audio_volume', this.volume);
        
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Utils.clamp(volume, 0, 1);
        Utils.saveToLocalStorage('music_volume', this.musicVolume);
        
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume;
        }
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        Utils.saveToLocalStorage('sfx_enabled', this.sfxEnabled);
        return this.sfxEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        Utils.saveToLocalStorage('music_enabled', this.musicEnabled);
        
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        
        return this.musicEnabled;
    }

    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Create global audio manager instance
const audioManager = new AudioManager();