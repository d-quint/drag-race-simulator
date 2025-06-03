# Drag Race Simulator: Code Documentation

This document provides a detailed explanation of the Drag Race Simulator codebase, including its components, simulation logic, and API endpoints. It is up-to-date with the latest features and UI/UX flows.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Data Structures](#core-data-structures)
3. [App Structure](#app-structure)
4. [Reusable UI Components](#reusable-ui-components)
5. [Simulation Logic](#simulation-logic)
6. [Components](#components)
7. [API Endpoints](#api-endpoints)
8. [Simulation Algorithm Details](#simulation-algorithm-details)

---

## Project Overview

 Drag Race Simulator is a web application that simulates a drag competition similar to RuPaul's Drag Race. Users can create custom drag queens with unique statistics, add songs for lip sync battles (including Spotify integration), and run simulations in narrative or quick modes. The app features advanced statistics, a relationship system, and a detailed, step-by-step narrative mode.

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

The `Song` interface represents a song used for lip sync battles. Songs can be added manually or imported from Spotify:

```typescript
interface Song {
  id: string
  title: string
  artist: string
  genre: string
  album_image?: string // (optional, for Spotify)
  preview_url?: string // (optional, for Spotify)
  spotify_uri?: string // (optional, for Spotify)
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
  groups?: { [group: string]: string[] } // For Girl Groups challenge
  
  // Legacy format properties
  top2?: string[] // Top 2 queens for legacy format
  lipstickChoices?: { [queenName: string]: string } // Which queen chose which lipstick
  loserWouldHaveChosen?: string // Who the loser would have eliminated
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
  - `song-manager.tsx`: Interface for managing lip sync songs (with Spotify integration)
  - `simulation-runner.tsx`: Component to run and control simulations
  - `narrative-simulation.tsx`: Step-by-step narrative view of the simulation, including relationships and girl groups
  - `track-record-table.tsx`: Displays queen performance across episodes
  - `episode-details.tsx`: Shows detailed information about an episode
  - `saved-sessions.tsx`: Manages saved simulation results
  - `ui/`: Reusable UI components (see below)

---

## Reusable UI Components

The `components/ui/` folder contains reusable, styled UI primitives used throughout the app:

- **Button**: Consistent, accessible button component with variants (default, outline, destructive, etc.)
- **Input**: Styled input fields for forms
- **Label**: Accessible form labels
- **Card**: Card layout for grouping content
- **Dialog**: Modal dialogs for details, confirmations, and forms
- **Slider**: Used for stat selection in queen creation
- **Tabs**: For tabbed navigation in the main app
- **Badge**: For status indicators (placements, wins, etc.)
- **Select**: Custom dropdown select menus
- **Alert**: For warnings, errors, and info messages

These components are styled with Tailwind CSS and Radix UI, and are used to ensure a consistent, modern look and feel.

---

## Simulation Logic

The simulation works by calculating scores for each queen based on:

1. **Base Stats**: Queen's intrinsic abilities
2. **Challenge Type**: Different challenges prioritize different skills
3. **Runway Performance**: A separate score affecting overall judgment
4. **Pressure State**: How well the queen handles competition stress
5. **Risk Taking**: Strategic decisions that can help or hurt performance
6. **Random Factors**: Adding unpredictability to make each run unique
7. **Relationships**: Alliances and rivalries can affect team challenges
8. **Track Record**: Past wins and bottoms influence lip sync outcomes, especially in the finale

### Simulation Process

1. For each episode:
   - Select a random challenge type (including special ones like Girl Groups)
   - Calculate pressure states for each queen based on previous placements
   - Calculate runway scores
   - Calculate risk-taking values
   - Calculate challenge scores considering all factors
   - Determine placements based on the season format:
     - **Regular Format**: WIN, HIGH, SAFE, LOW, BTM2
     - **Legacy Format**: TOP2, HIGH, SAFE, LOW, BTM2 (with two winners instead of one)
   - Select a random song for the lip sync battle
   - Simulate the lip sync:
     - **Regular Format**: Between bottom two queens, loser is eliminated
     - **Legacy Format**: Between top two queens, winner chooses who to eliminate from bottom queens
   - Update relationships (alliances/enemies may form or change)
   - Update records and progress to next episode

2. Once there are 4 queens left:
   - Simulate a finale with semifinal and final lip syncs (track record is heavily weighted)
   - Crown a winner based on the final lip sync outcome

---

## Components

### QueenCreator

The `QueenCreator` component allows users to:
- Create new queens with customizable stats (Charisma, Uniqueness, Nerve, Talent, and more)
- Edit existing queens
- Delete queens
- Randomize stats and generate random queens
- Import/export queens as JSON
- Save and load queen presets (localStorage)
- View and manage saved casts
- Image preview and placeholder support

### SongManager

The `SongManager` component lets users:
- Add new songs manually (title, artist, genre)
- Edit and delete songs
- Import/export song libraries as JSON
- Generate a set of random sample songs
- **Spotify Integration**:
  - Connect to Spotify and import songs from user playlists
  - Import songs directly from a Spotify playlist URL
  - Preview songs with album art and audio snippets
  - Configure Spotify API credentials

### SeasonFormatSelector

The `SeasonFormatSelector` component allows users to select the format for the season:
- Uses a Select dropdown component to choose between different season formats
- Displays the format name and description
- Supports two formats:
  - **Regular Format**: Bottom two queens lipsync for their life, and the loser is eliminated
  - **Legacy Format**: Top two queens lipsync for the win, and the winner decides who to eliminate from the bottom queens
- Uses the modern UI/Card component design pattern consistent with the rest of the application

### SimulationRunner

The `SimulationRunner` component:
- Validates that there are enough queens (≥6) and songs (≥5)
- Offers quick or narrative simulation modes
- Lets users select a season format (regular or legacy)
- Lets users name and save simulation sessions
- Sends data to the appropriate API endpoint
- Displays results, including:
  - Winner and final four
  - Complete episode breakdown
  - Track record table
  - Challenge win statistics
  - Season statistics (episodes, queens, etc.)
- Integrates with `NarrativeSimulation` for step-by-step mode

### NarrativeSimulation

The `NarrativeSimulation` component provides a step-by-step, story-driven experience:
- Episodes are divided into stages (challenge, runway, deliberation, etc.)
- Each step reveals new information about the competition
- Simulates episodes one by one, not all at once
- Handles the finale format differently than regular episodes
- **Season Format Support**:
  - **Regular Format**: Traditional bottom two queens lipsync, loser goes home
  - **Legacy Format**: Top two queens lipsync for the win, winner chooses which bottom queen to eliminate
  - Different UI flows and steps based on the selected format
  - Decision-making logic for legacy lipstick choices based on relationships and track records
- **Relationship System**:
  - Queens can form alliances or become enemies based on their stats and episode events
  - Relationships affect team challenges (e.g., Girl Groups)
  - In Legacy Format, relationships influence elimination decisions
- **Girl Groups Challenge**:
  - Teams are selected based on leadership, relationships, and stats
  - Team performance is influenced by group dynamics
- **Floating Spotify Player**:
  - When a song with a preview is played, a floating audio player appears for continuous listening
- **Advanced Commentary**:
  - Dynamic commentary is generated for challenge and runway performances
- **Track Record and Statistics**:
  - Track record table and statistics are shown after each episode and at the end of the season

### TrackRecordTable

The `TrackRecordTable` component:
- Displays each queen's performance across all episodes in a color-coded table
- Handles all placement types (WIN, HIGH, SAFE, LOW, BTM2, ELIM, WINNER, RUNNER-UP, etc.)
- Sorts queens by finale placement and elimination order
- Shows rankings, statistics, and placement legends

### EpisodeDetails

The `EpisodeDetails` component:
- Shows detailed information about a specific episode
- Includes challenge and runway scores for each queen
- Displays pressure states and risk-taking values
- Shows lip sync scores for the bottom queens
- Visualizes placements and relative standings
- Uses a modal dialog for detailed breakdowns

### SavedSessions

The `SavedSessions` component:
- Allows users to view, load, and delete past simulation results (saved in localStorage)
- Displays winner, queens, episodes, and songs for each session
- Shows full episode breakdowns, track record, challenge win stats, and final four
- Handles both quick and narrative simulation results

---

## API Endpoints

### /api/simulate

This endpoint simulates a complete season in one go:

- **Input**: Queens, songs, and season format (regular or legacy)
- **Output**: All episode data and the final winner
- **Process**: Iteratively simulates episodes until there are 4 queens left, then simulates a finale

### /api/simulate-episode

This endpoint simulates a single episode for narrative mode:

- **Input**: Current queens, songs, episode number, and season format
- **Output**: Single episode data with format-specific details
- **Process**: Simulates one episode with all the calculations and returns detailed results
- **Format Support**: Returns different data structures based on selected format:
  - Regular format: Standard winner, bottom queens, and elimination
  - Legacy format: Top two queens, lipstick choices, and winner's elimination decision

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
    case "Acting Challenge":
    case "Commercial Challenge":
      baseScore =
        queen.actingAbility * 0.4 +
        queen.versatility * 0.2 +
        queen.conflictResilience * 0.2 +
        queen.starPower * 0.2
      break;
    case "Comedy Challenge":
    case "Roast Challenge":
    case "Snatch Game":
      baseScore =
        queen.comedyChops * 0.4 +
        queen.riskTolerance * 0.2 +
        queen.starPower * 0.2 +
        queen.adaptability * 0.2
      break;
    case "Singing Challenge":
    case "Rusical":
      baseScore =
        queen.vocalMusicality * 0.4 +
        queen.runwayPresence * 0.2 +
        queen.starPower * 0.2 +
        queen.versatility * 0.2
      break;
    case "Dance Challenge":
      baseScore =
        queen.runwayPresence * 0.3 +
        queen.lipSyncProwess * 0.3 +
        queen.starPower * 0.2 +
        queen.riskTolerance * 0.2
      break;
    case "Improv Challenge":
      baseScore =
        queen.comedyChops * 0.3 +
        queen.adaptability * 0.3 +
        queen.riskTolerance * 0.2 +
        queen.versatility * 0.2
      break;
    case "Makeover Challenge":
      baseScore =
        queen.designVision * 0.3 +
        queen.congeniality * 0.3 +
        queen.versatility * 0.2 +
        queen.adaptability * 0.2
      break;
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

function simulateLipSync(queen1: Queen, queen2: Queen, isFinale = false): Queen {
  // Track record and finale bonuses are factored in narrative mode
  // ...see NarrativeSimulation for details
  // (see code for full logic)
  // Returns the winning Queen
}
```

### Placement Determination

Placements are determined based on the combined challenge and runway scores, and vary depending on the season format:

#### Regular Format:

- With 8+ queens:
  - Top queen: WIN
  - Next 2 queens: HIGH
  - Bottom 3 queens: LOW (1) and BTM2 (2)
  - Everyone else: SAFE

- With fewer queens: 
  - Adjusts the number of HIGH placements
  - Still has a winner and bottom 2
  - May or may not have LOW placement depending on queen count

#### Legacy Format:

- With 8+ queens:
  - Top 2 queens: TOP2 (who will lipsync for the win)
  - Next 1-2 queens: HIGH
  - Bottom 3 queens: LOW (1) and BTM2 (2)
  - Everyone else: SAFE

- With fewer queens:
  - Still has top 2 queens and bottom 2 queens
  - Adjusts the number of HIGH placements
  - May or may not have LOW placement depending on queen count

### Finale Format

The finale follows a tournament bracket:
1. Four queens are split into two pairs
2. Each pair performs a lip sync
3. Winners of the first two lip syncs face off in the final lip sync
4. The winner of the final lip sync is crowned the winner

---

This documentation provides a comprehensive, up-to-date overview of the Drag Race Simulator codebase, explaining the components, data structures, simulation logic, and advanced features that make it work.
