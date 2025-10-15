# 888: Merge Rush

A satisfying number-merge puzzle game where you combine tiles to reach 8 → 88 → 888!

## How to Play

### Objective
Merge tiles with the same numbers to create higher values. Reach 888 to trigger spectacular blast effects!

### Controls
- **Desktop**: Click to select tiles, click adjacent tiles to merge
- **Mobile**: Tap to select, tap adjacent tiles to merge, or swipe from one tile to another
- **Keyboard**: Arrow keys to navigate, Enter/Space to select/merge

### Game Rules
1. **Merging**: Combine two tiles of the same value (1+1→2, 2+2→3, etc.)
2. **Special Merges**: 8+8→88, 88+88→888
3. **888 Blast**: Creates a 3×3 explosion and removes all 1s and 2s from the board
4. **Combo System**: Chain merges within 8 seconds for multiplier bonuses (up to x8)
5. **Obstacles**: 
   - Stone 8s: Immovable, destroyed after 3 adjacent merges
   - Locked tiles: Unlock when any 8+ tile is created

### Game Modes
- **Classic**: Endless play until the board fills
- **Time Attack**: Score as much as possible in 88 seconds
- **Daily 8**: Special daily challenge with preset obstacles

### Boosters
- **Flip 8** (🔄): Rotate a 3×3 area around selected tile
- **Split** (✂️): Downgrade selected tile by 1 value
- **Shockwave** (💥): Clear the bottom row

### Scoring
- Base points = tile value squared (8 = 64 points, 88 = 7,744 points)
- Combo bonus = +10% per chain step
- 888 blast = massive score burst + 5-second x8 multiplier

## How to Run

1. Open `index.html` in any modern web browser
2. Or serve via local web server:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```
3. Navigate to `http://localhost:8000`

## Features

✅ **Mobile Responsive**: Optimized for touch devices  
✅ **Accessibility**: Keyboard navigation and high contrast mode  
✅ **Progressive Web App**: Can be installed on mobile devices  
✅ **Offline Play**: Works without internet connection  
✅ **Local Storage**: Saves high scores and settings  
✅ **Sound Effects**: Audio feedback for merges  
✅ **Haptic Feedback**: Vibration on supported devices  

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers (iOS Safari, Chrome Mobile)

## File Structure

```
888-merge-rush/
├── index.html          # Main game file
├── style.css          # All styling and responsive design
├── game.js           # Complete game logic
└── README_GAME.md   # This file
```

## Technical Details

- **Framework**: Vanilla JavaScript (no dependencies)
- **Storage**: localStorage for persistence
- **Audio**: Web Audio API for sound effects
- **Graphics**: CSS animations and transforms
- **Touch**: Touch events with gesture recognition

Enjoy playing 888: Merge Rush! 🎮