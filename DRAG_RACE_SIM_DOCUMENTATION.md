# Drag Race Simulator: Code Documentation

This document provides a detailed explanation of the Drag Race Simulator codebase, including its components, simulation logic, and API endpoints.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Data Structures](#core-data-structures)
3. [App Structure](#app-structure)
4. [Simulation Logic](#simulation-logic)
5. [Components](#components)
6. [API Endpoints](#api-endpoints)
7. [Simulation Algorithm Details](#simulation-algorithm-details)

---

## Project Overview

The Drag Race Simulator is a web application that simulates a drag competition similar to RuPaul's Drag Race. Users can create custom drag queens with unique statistics, add songs for lip sync battles, and run simulations with narrative or quick modes.

The application is built using:
- Next.js for the framework
- React for UI components
- TypeScript for type safety
- Tailwind CSS for styling

---

## Core Data Structures

### Queen

The `Queen` interface represents a contestant with various statistics that influence their performance:

```typescript
interface Queen {
  id: string
  name: string
  imageUrl?: string
  // Charisma
  congeniality: number
  loyalty: number
  // Uniqueness
  novelty: number
  conceptualDepth: number
  // Nerve
  riskTolerance: number
  conflictResilience: number
  // Talent
  designVision: number
  comedyChops: number
  lipSyncProwess: number
  runwayPresence: number
  actingAbility: number
  vocalMusicality: number
  // Additional
  versatility: number
  adaptability: number
  starPower: number
}
```

### Song

The `Song` interface represents a song used for lip sync battles:

```typescript
interface Song {
  id: string
  title: string
  artist: string
  genre: string
}
```

### Episode

The `Episode` interface represents the data for a single episode of the competition:

```typescript
interface Episode {
  episodeNumber: number
  challenge: string
  winner: string
  bottom2: string[]
  lipSyncSong: string
  eliminated: string
  remaining: string[]
  standings: { [queenName: string]: number }
  details: {
    challengeScores: { [queenName: string]: number }
    runwayScores: { [queenName: string]: number }
    riskTaking: { [queenName: string]: number }
    pressureState: { [queenName: string]: string }
    lipSyncScores?: { [queenName: string]: number }
    placements: { [queenName: string]: string }
  }
}
```

---

## App Structure

The application is structured as follows:

- `app/`: Next.js app router
  - `page.tsx`: Main app page with tabs for queen creation, song management, simulation, and results
  - `api/`: API routes for simulation
    - `simulate/route.ts`: Simulates a full season at once
    - `simulate-episode/route.ts`: Simulates a single episode for narrative mode
- `components/`: React components
  - `queen-creator.tsx`: Interface for creating and managing queens
  - `song-manager.tsx`: Interface for managing lip sync songs
  - `simulation-runner.tsx`: Component to run and control simulations
  - `narrative-simulation.tsx`: Step-by-step narrative view of the simulation
  - `track-record-table.tsx`: Displays queen performance across episodes
  - `episode-details.tsx`: Shows detailed information about an episode
  - `saved-sessions.tsx`: Manages saved simulation results

---

## Simulation Logic

The simulation works by calculating scores for each queen based on:

1. **Base Stats**: Queen's intrinsic abilities
2. **Challenge Type**: Different challenges prioritize different skills
3. **Runway Performance**: A separate score affecting overall judgment
4. **Pressure State**: How well the queen handles competition stress
5. **Risk Taking**: Strategic decisions that can help or hurt performance
6. **Random Factors**: Adding unpredictability to make each run unique

### Simulation Process

1. For each episode:
   - Select a random challenge type
   - Calculate pressure states for each queen based on previous placements
   - Calculate runway scores
   - Calculate risk-taking values
   - Calculate challenge scores considering all factors
   - Determine placements (WIN, HIGH, SAFE, LOW, BTM2)
   - Select a random song for the lip sync battle
   - Simulate the lip sync between the bottom two queens
   - Eliminate the lip sync loser
   - Update records and progress to next episode

2. Once there are 4 queens left:
   - Simulate a finale with semifinal and final lip syncs
   - Crown a winner based on the final lip sync outcome

---

## Components

### QueenCreator

The `QueenCreator` component allows users to:
- Create new queens with customizable stats
- Edit existing queens
- Delete queens
- Randomize stats
- Import/export queens as JSON
- Save and load presets

Queen statistics are organized into categories inspired by Charisma, Uniqueness, Nerve, and Talent.

### SongManager

The `SongManager` component lets users:
- Add new songs
- Edit existing songs
- Delete songs
- Import/export song libraries

### SimulationRunner

The `SimulationRunner` component:
- Validates that there are enough queens (≥6) and songs (≥5)
- Offers quick or narrative simulation modes
- Sends data to the appropriate API endpoint
- Displays results or loads narrative mode

### NarrativeSimulation

The `NarrativeSimulation` component provides a step-by-step experience:
- Episodes are divided into stages (challenge, runway, deliberation, etc.)
- Each step reveals new information about the competition
- Allows users to progress through the story at their own pace
- Simulates episodes one by one rather than all at once
- Handles the finale format differently than regular episodes

### TrackRecordTable

The `TrackRecordTable` component:
- Displays each queen's performance across all episodes
- Color-codes placements (WIN, HIGH, SAFE, LOW, BTM2, ELIM)
- Sorts queens by performance/elimination order
- Shows statistics like wins, highs, bottoms, etc.

### EpisodeDetails

The `EpisodeDetails` component:
- Shows detailed information about a specific episode
- Includes challenge and runway scores for each queen
- Displays pressure states and risk-taking values
- Shows lip sync scores for the bottom queens
- Visualizes placements and relative standings

---

## API Endpoints

### /api/simulate

This endpoint simulates a complete season in one go:

- **Input**: Queens and songs
- **Output**: All episode data and the final winner
- **Process**: Iteratively simulates episodes until there are 4 queens left, then simulates a finale

### /api/simulate-episode

This endpoint simulates a single episode for narrative mode:

- **Input**: Current queens, songs, and episode number
- **Output**: Single episode data
- **Process**: Simulates one episode with all the calculations and returns detailed results

---

## Simulation Algorithm Details

### Challenge Score Calculation

The challenge score is calculated using a weighted formula based on the challenge type:

```typescript
function calculateChallengeScore(
  queen: Queen,
  challengeType: string,
  runwayScore: number,
  pressureState: string,
  riskTaking: number,
): number {
  // Determine base score from queen stats based on challenge type
  let baseScore = 0

  switch (challengeType) {
    case "Design Challenge":
    case "Ball Challenge":
      baseScore =
        queen.designVision * 0.4 +
        queen.runwayPresence * 0.3 +
        queen.novelty * 0.2 +
        queen.conceptualDepth * 0.1
      break;
    // ... other challenge types

    default:
      baseScore = 
        queen.versatility * 0.3 + 
        queen.starPower * 0.3 + 
        queen.adaptability * 0.2 + 
        queen.riskTolerance * 0.2
  }

  // Add runway impact (15% of total score)
  const runwayImpact = runwayScore * 0.15

  // Apply pressure state multiplier
  let pressureMultiplier = 1.0
  if (pressureState === "Pressured") {
    pressureMultiplier = 0.9
  } else if (pressureState === "Determined") {
    pressureMultiplier = 1.1
  } else if (pressureState === "Confident") {
    pressureMultiplier = 1.05
  }

  // Apply risk impact
  const riskImpact = (riskTaking - 5) * 0.05

  // Calculate final score with randomness
  const finalScore = (baseScore + runwayImpact) * pressureMultiplier * (1 + riskImpact)
  const randomFactor = 0.9 + Math.random() * 0.2
  
  return Math.max(1, Math.min(10, finalScore * randomFactor))
}
```

### Runway Score Calculation

```typescript
function calculateRunwayScore(queen: Queen): number {
  const baseScore = 
    queen.runwayPresence * 0.4 + 
    queen.designVision * 0.3 + 
    queen.novelty * 0.2 + 
    queen.starPower * 0.1
  
  const randomFactor = 0.85 + Math.random() * 0.3
  return Math.max(1, Math.min(10, baseScore * randomFactor))
}
```

### Pressure State Calculation

```typescript
function calculatePressureState(queen: Queen, previousPlacements: string[]): string {
  const recentLow = previousPlacements.slice(-2).includes("LOW") || previousPlacements.slice(-2).includes("BTM2")
  const recentHigh = previousPlacements.slice(-2).includes("WIN") || previousPlacements.slice(-2).includes("HIGH")

  if (recentLow && queen.conflictResilience < 6) {
    return "Pressured"
  } else if (recentLow && queen.conflictResilience >= 8) {
    return "Determined"
  } else if (recentHigh) {
    return "Confident"
  } else {
    return Math.random() > 0.5 ? "Confident" : "Nervous"
  }
}
```

### Lip Sync Score Calculation

```typescript
function calculateLipSyncScore(queen: Queen): number {
  const baseScore =
    queen.lipSyncProwess * 0.4 + 
    queen.starPower * 0.2 + 
    queen.conflictResilience * 0.2 + 
    queen.runwayPresence * 0.2

  const randomFactor = 0.8 + Math.random() * 0.4
  return Math.max(1, Math.min(10, baseScore * randomFactor))
}

function simulateLipSync(queen1: Queen, queen2: Queen): Queen {
  const score1 = calculateLipSyncScore(queen1)
  const score2 = calculateLipSyncScore(queen2)

  return score1 > score2 ? queen1 : queen2
}
```

### Placement Determination

Placements are determined based on the combined challenge and runway scores:

- With 8+ queens:
  - Top queen: WIN
  - Next 2 queens: HIGH
  - Bottom 3 queens: LOW (1) and BTM2 (2)
  - Everyone else: SAFE

- With fewer queens: 
  - Adjusts the number of HIGH placements
  - Still has a winner and bottom 2
  - May or may not have LOW placement depending on queen count

### Finale Format

The finale follows a tournament bracket:
1. Four queens are split into two pairs
2. Each pair performs a lip sync
3. Winners of the first two lip syncs face off in the final lip sync
4. The winner of the final lip sync is crowned the winner

---

This documentation provides a comprehensive overview of the Drag Race Simulator codebase, explaining the components, data structures, and simulation logic that make it work.
