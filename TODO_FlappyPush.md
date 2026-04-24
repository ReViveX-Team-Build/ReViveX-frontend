# Flappy Push - Game Development Plan

## 1. Information Gathered

### Existing Codebase Analysis
- **Project Type**: Next.js 14 with React, TypeScript, Firebase
- **Game Framework**: HTML5 Canvas with custom game engine in `util/game-core/`
- **Existing Game**: Synapse Racer at `app/(immersive)/game/level-1/page.tsx`
- **Game Component**: `components/GameCanvas/page.tsx` - Main game loop and rendering
- **Player Physics**: `util/game-core/SynapsePlayer.ts` - Fish movement with pressure/squeeze control
- **Cognitive Elements**: `util/game-core/SynapseCognitive.ts` - Pearls for cognitive tasks
- **Metrics**: `util/game-core/MetricsCalculator.ts` - Accuracy and endurance calculations

### Key Patterns Identified
1. Full-screen immersive game with hidden UI overlays
2. Pressure sensor integration via Web Serial API
3. Keyboard fallback (SPACE for swimming)
4. Firebase session saving with clinical metrics
5. Menu → Playing → Soft Fail game states
6. Particle effects for visual feedback
7. Countdown system for game start

---

## 2. Plan: Flappy Push Game

### Game Concept
**"Navigate obstacles while memorising colour sequences. Combines fine motor control with working memory training. Designed for TBI and post-surgical cognitive rehabilitation."**

### Core Mechanics
1. **Flappy Bird Physics**: Tap/Click/Squeeze to jump, gravity pulls down
2. **Memory Gates**: Colored gates (Red/Green/Blue/Yellow) that flash a sequence
3. **Player must recall sequence**: Pass through gates in correct order
4. **Scoring**: +100 for correct sequence, -50 for wrong, streak bonuses

### Visual Theme
- Underwater coral/seaweed aesthetic (reuse SynapseBackground, SynapseCorals, SeaGrass)
- Different player character (maybe a submarine or diver)
- Memory gates as glowing coral arches with color indicators

### Difficulty Progression
- **Level 1**: 2 colors, 2-sequence length
- **Level 2**: 3 colors, 3-sequence length  
- **Level 3**: 4 colors, 4-sequence length, faster scrolling

---

## 3. Files to Create

### New Files
1. **`app/(immersive)/game/memory-diver/page.tsx`** - Game page wrapper
2. **`util/game-core/SynapseMemoryDiver.ts`** - Player character (diver/submarine)
3. **`util/game-core/SynapseMemoryGate.ts`** - Memory gate obstacles
4. **`util/game-core/SynapseMemorySequence.ts`** - Color sequence logic

### Modified Files
1. **`app/(pages)/patients/levels/page.tsx`** - Add link to new game

---

## 4. Implementation Steps

### Step 1: Create Memory Diver Player Class
- Similar to SynapsePlayer but with diver sprite
- Standard Flappy Bird physics (gravity + jump velocity)
- Rotation based on velocity

### Step 2: Create Memory Gate System
- Gate types: entry gate shows sequence, checkpoints verify
- Visual states: waiting, showing sequence, player passing, passed/failed
- Color palette: Red (#EF4444), Green (#22C55E), Blue (#3B82F6), Yellow (#FACC15)

### Step 3: Create Game Canvas Component
- Similar structure to existing GameCanvas
- States: MENU, COUNTDOWN, SHOWING_SEQUENCE, PLAYING, GATE_RESULT, GAME_OVER
- Memory HUD showing current sequence progress

### Step 4: Create Page Route
- Wrap game canvas in Next.js page
- Add to levels page navigation

### Step 5: Metrics & Session Saving
- Track: sequence accuracy, reaction time, motor consistency
- Save to Firebase like existing game

---

## 5. Follow-up Steps

After implementation:
1. Test with keyboard controls
2. Test with pressure sensor device
3. Verify Firebase session saving
4. Add to patient levels navigation

---

## 6. Estimated Components

| Component | Description |
|-----------|-------------|
| Player | Diver sprite with physics |
| Gates | Memory sequence obstacles |
| Background | Reuse existing SynapseBackground |
| Foreground | Reuse SeaGrass, Corals |
| Particles | Reuse SynapseParticles |
| HUD | Sequence display, score, health |
| Menu | Game title, instructions, start |

