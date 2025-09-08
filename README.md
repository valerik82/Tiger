# 🎬 Hollywood Crazy Wheel

A glamorous arcade-puzzle game with a chaos wheel that adds wild modifiers, mini-games, and power-ups!

## 🎮 Game Features

### Core Gameplay
- **Link-3 Mechanics**: Draw paths to connect 3+ matching tiles (like Two Dots)
- **7x9 Grid Board**: Optimized for mobile-friendly gameplay
- **Director's Cut**: Close loops to clear inside tiles for bonus points
- **Wild Cameras**: Long chains (5+ tiles) create wild tiles

### The Crazy Wheel 🎡
- **8 Sectors**: 4 boosts, 2 challenges, 2 mini-games
- **Boosts**: Double Score, +5 Moves, Time Freeze, Rainbow Wilds
- **Challenges**: Paparazzi Fog, Script Rewrite (board shuffle)
- **Mini-games**: Red Carpet Runner, Casting Call

### Power-ups ⚡
- **Director's Cut**: Clear a 3x3 area
- **Clapboard Smash**: Clear all tiles of selected type
- **Spotlight Beam**: Clear entire row or column
- **Re-Shoot**: Undo last move

### Progression System
- **30+ Levels** across 3 movies (Action, Romance, Sci-Fi)
- **Movie Collection**: Build posters and earn passive buffs
- **Star Rating**: Up to 3 stars per level based on performance
- **Boss Levels**: Two-phase "Premiere" levels every 10th level

### Game Modes
- **Story Mode**: 30+ handcrafted levels with progression
- **Daily Premiere**: Special daily challenges with rotating modifiers
- **After Party**: Endless mode for high score chasing

## 🎯 Level Objectives

1. **Score Target**: Reach a specific score
2. **Clear Props**: Remove prop tiles (clapperboards, reels, mics)
3. **Beat the Clock**: Score target within time limit
4. **No Mistakes**: Complete without invalid moves
5. **Limited Moves**: Achieve score with move restriction
6. **Boss Premiere**: Two-phase challenges

## 💰 Economy & Monetization

### Currencies
- **Tickets** (soft): Earned from gameplay, used for power-ups
- **Stars** (hard): Premium currency for special purchases

### Fair Monetization
- **Rewarded Ads**: Extra spins, moves, time, second chances
- **Starter Pack**: Premium bundle with power-ups and ad-free period
- **Season Pass**: Exclusive content and bonuses

## 🎨 Art & Audio

### Visual Style
- **Hollywood Glam**: Gold, purple, ruby color palette
- **Awards Night** aesthetic with sparkling effects
- **Neon-rimmed wheel** with marquee styling

### Audio Design
- **Crowd murmur** on wins
- **Camera shutters** on combos
- **Drum roll** before wheel results
- **Synthesized sound effects** using Web Audio API

## 🛠️ Technical Implementation

### Technologies Used
- **HTML5 Canvas** for high-performance rendering
- **Web Audio API** for dynamic sound generation
- **Local Storage** for game progress persistence
- **Progressive Web App** with service worker
- **Responsive Design** for mobile and desktop

### Architecture
- **Modular Design**: Separate systems for board, wheel, mini-games, etc.
- **Event-Driven**: Clean separation between game logic and UI
- **Performance Optimized**: 60fps gameplay with efficient animations
- **Mobile-First**: Touch controls and mobile-optimized UI

## 🚀 Getting Started

1. **Open `index.html`** in a modern web browser
2. **No build process required** - runs directly in browser
3. **Mobile friendly** - works on phones and tablets
4. **PWA ready** - can be installed as an app

### Development Features
- **Debug keys** available in localhost
- **Performance monitoring** for optimization
- **Error handling** with graceful recovery
- **Analytics hooks** for external integration

## 🎯 MVP Scope (2 weeks)

### Week 1 ✅
- [x] Core link-3 board mechanics
- [x] 8-sector Crazy Wheel system
- [x] 4 power-ups with interactive selection
- [x] 2 mini-games (Red Carpet Runner, Casting Call)
- [x] Basic level progression (30 levels)
- [x] Movie collection meta-system
- [x] Soft economy with ticket rewards

### Week 2 ✅
- [x] Level objectives system (score, props, time, moves)
- [x] Boss levels with two-phase mechanics
- [x] Daily challenges with modifiers
- [x] Rewarded ad integration hooks
- [x] Hollywood glam styling and animations
- [x] Web Audio API sound system
- [x] PWA support with service worker

## 🎮 Controls

### Desktop
- **Mouse**: Click and drag to draw chains
- **Keyboard**: Debug shortcuts (development only)

### Mobile
- **Touch**: Tap and drag to draw chains
- **Gestures**: Optimized for one-handed play
- **Haptic Feedback**: Vibration on key actions

## 🏆 Achievements & Retention

### Daily Features
- **Daily Wheel**: Special rewards
- **Login Streaks**: Increasing bonuses
- **Limited-time Events**: Seasonal content

### Social Features
- **High Score Sharing**: Compare with friends
- **Movie Collection**: Show off completed posters
- **Achievement System**: Unlock special rewards

## 📊 Analytics & Metrics

### Key Metrics
- **Retention**: D1, D7, D30 player return rates
- **Engagement**: Session length and frequency
- **Monetization**: Ad views and IAP conversion
- **Progression**: Level completion rates

### A/B Testing Ready
- **Difficulty scaling** parameters
- **Reward balancing** values
- **UI/UX variations** for optimization

## 🎭 Sample Data Structure

```json
{
  "level": {
    "id": 1,
    "name": "First Take",
    "movie": "Action Adventure",
    "objective": {
      "type": "score",
      "target": 500,
      "description": "Score 500 points"
    },
    "moves": 15,
    "wheelSpins": 1,
    "rewards": {
      "tickets": 50,
      "powerups": ["re-shoot"]
    }
  },
  "wheelSector": {
    "id": "double_score",
    "type": "boost",
    "name": "Double Score",
    "description": "Next chain scores double points!",
    "weight": 15
  },
  "powerup": {
    "id": "directors-cut",
    "name": "Director's Cut",
    "description": "Clear a 3x3 area",
    "cost": 100
  }
}
```

## 🎬 That's a Wrap!

Hollywood Crazy Wheel delivers a unique blend of puzzle mechanics and Hollywood glamour, with the Crazy Wheel system providing endless variety and excitement. The game is designed to be:

- **Easy to learn, hard to master**
- **Highly replayable** with wheel randomness
- **Monetization-friendly** without being predatory
- **Technically solid** with modern web standards
- **Scalable** for future content updates

Ready for the red carpet! 🌟

---

*"Lights, Camera, Action!"* - Start your Hollywood journey today!