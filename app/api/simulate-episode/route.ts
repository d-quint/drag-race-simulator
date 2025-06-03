import { type NextRequest, NextResponse } from "next/server"
import { RelationshipManager, RelationshipMap } from "@/lib/relationship-manager"
import { Queen, Song } from "@/lib/types"

const challenges = [
  "Design Challenge",
  "Acting Challenge",
  "Comedy Challenge",
  "Singing Challenge",
  "Dance Challenge",
  "Improv Challenge",
  "Roast Challenge",
  "Snatch Game",
  "Ball Challenge",
  "Makeover Challenge",
  "Commercial Challenge",
  "Rusical",
  "Girl Groups",
]

// Use the same calculation functions from the main simulation
function calculateRunwayScore(queen: Queen): number {
  const baseScore = queen.runwayPresence * 0.4 + queen.designVision * 0.3 + queen.novelty * 0.2 + queen.starPower * 0.1
  const randomFactor = 0.85 + Math.random() * 0.3
  return Math.max(1, Math.min(10, baseScore * randomFactor))
}

function calculateRiskTaking(queen: Queen, pressureState: string): number {
  let baseRisk = queen.riskTolerance

  if (pressureState === "Pressured") {
    baseRisk *= 1.2
  } else if (pressureState === "Confident") {
    baseRisk *= 0.9
  }

  // Higher risk tolerance means more variance in the outcome
  // Low risk queens get a small random factor (0.8 to 1.2)
  // High risk queens get a larger random factor (0.6 to 1.4)
  const riskVariance = 0.2 + (queen.riskTolerance / 10) * 0.4; // Maps from 0.2 to 0.6
  const randomFactor = (1 - riskVariance) + (Math.random() * riskVariance * 2);
  
  return Math.max(1, Math.min(10, baseRisk * randomFactor))
}

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

function calculateChallengeScore(
  queen: Queen,
  challengeType: string,
  runwayScore: number,
  pressureState: string,
  riskTaking: number,
): number {
  let baseScore = 0

  switch (challengeType) {
    case "Design Challenge":
    case "Ball Challenge":
      baseScore =
        queen.designVision * 0.4 + queen.runwayPresence * 0.3 + queen.novelty * 0.2 + queen.conceptualDepth * 0.1
      break
    case "Acting Challenge":
    case "Commercial Challenge":
      baseScore =
        queen.actingAbility * 0.4 + queen.versatility * 0.2 + queen.conflictResilience * 0.2 + queen.starPower * 0.2
      break
    case "Comedy Challenge":
    case "Roast Challenge":
    case "Snatch Game":
      baseScore = queen.comedyChops * 0.4 + queen.riskTolerance * 0.2 + queen.starPower * 0.2 + queen.adaptability * 0.2
      break
    case "Singing Challenge":
    case "Rusical":
      baseScore =
        queen.vocalMusicality * 0.4 + queen.runwayPresence * 0.2 + queen.starPower * 0.2 + queen.versatility * 0.2
      break
    case "Girl Groups":
      baseScore = 
        queen.vocalMusicality * 0.3 + queen.lipSyncProwess * 0.3 + queen.starPower * 0.2 + queen.adaptability * 0.2
      break
    case "Dance Challenge":
      baseScore =
        queen.runwayPresence * 0.3 + queen.lipSyncProwess * 0.3 + queen.starPower * 0.2 + queen.riskTolerance * 0.2
      break
    case "Improv Challenge":
      baseScore =
        queen.comedyChops * 0.3 + queen.adaptability * 0.3 + queen.riskTolerance * 0.2 + queen.versatility * 0.2
      break
    case "Makeover Challenge":
      baseScore =
        queen.designVision * 0.3 + queen.congeniality * 0.3 + queen.versatility * 0.2 + queen.adaptability * 0.2
      break
    default:
      baseScore = queen.versatility * 0.3 + queen.starPower * 0.3 + queen.adaptability * 0.2 + queen.riskTolerance * 0.2
  }

  // Add runway impact (10% of total score)
  const runwayImpact = runwayScore * 0.1

  // Add pressure state impact
  let pressureMultiplier = 1.0
  if (pressureState === "Pressured") {
    pressureMultiplier = 0.9
  } else if (pressureState === "Determined") {
    pressureMultiplier = 1.1
  } else if (pressureState === "Confident") {
    pressureMultiplier = 1.05
  }

  // Risk taking can boost or hurt performance
  const riskImpact = (riskTaking - 5) * 0.05

  const finalScore = (baseScore + runwayImpact) * pressureMultiplier * (1 + riskImpact)

  // Add some randomness (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2
  return Math.max(1, Math.min(10, finalScore * randomFactor))
}

function determinePlacements(
  scores: Array<{ queen: Queen; score: number }>,
  remainingCount: number,
): { [queenName: string]: string } {
  const placements: { [queenName: string]: string } = {}

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score)

  if (remainingCount >= 8) {
    placements[scores[0].queen.name] = "WIN"
    placements[scores[1].queen.name] = "HIGH"
    placements[scores[2].queen.name] = "HIGH"

    placements[scores[scores.length - 1].queen.name] = "BTM2"
    placements[scores[scores.length - 2].queen.name] = "BTM2"
    placements[scores[scores.length - 3].queen.name] = "LOW"

    for (let i = 3; i < scores.length - 3; i++) {
      placements[scores[i].queen.name] = "SAFE"
    }
  } else {
    placements[scores[0].queen.name] = "WIN"

    if (remainingCount >= 6) {
      placements[scores[1].queen.name] = "HIGH"
      if (remainingCount >= 7) {
        placements[scores[2].queen.name] = "HIGH"
      }
    }

    placements[scores[scores.length - 1].queen.name] = "BTM2"
    placements[scores[scores.length - 2].queen.name] = "BTM2"

    if (remainingCount >= 5) {
      placements[scores[scores.length - 3].queen.name] = "LOW"
    }

    for (const score of scores) {
      if (!placements[score.queen.name]) {
        placements[score.queen.name] = "SAFE"
      }
    }
  }

  return placements
}

function calculateLipSyncScore(queen: Queen, bottomCount: number = 0): number {
  // Base ability score from queen's stats
  const baseScore =
    queen.lipSyncProwess * 0.4 + queen.starPower * 0.2 + queen.conflictResilience * 0.2 + queen.runwayPresence * 0.2
  
  // Track record pressure factor - the more times a queen has been in the bottom, 
  // the more pressure they feel
  let pressureFactor = 0;
  
  if (bottomCount > 0) {
    // If queen has high nerve/resilience, they perform better under pressure
    if (queen.conflictResilience >= 8) {
      // High resilience queens get a boost when they're fighting for their life
      pressureFactor = Math.min(bottomCount * 0.1, 0.3); // Up to +0.3 boost (capped)
    } else if (queen.conflictResilience <= 4) {
      // Low resilience queens get nervous and perform worse
      pressureFactor = -Math.min(bottomCount * 0.15, 0.4); // Up to -0.4 penalty (capped)
    }
    // Queens with moderate resilience (5-7) aren't significantly affected
  }

  // Random factor - represents the unpredictability of a live performance
  const randomFactor = 0.8 + Math.random() * 0.4
  
  // Calculate final score with all factors
  return Math.max(1, Math.min(10, (baseScore + pressureFactor) * randomFactor))
}

function simulateLipSync(queen1: Queen, queen2: Queen, bottomCounts: {[key: string]: number} = {}, winCounts: {[key: string]: number} = {}): Queen {
  const queen1BottomCount = bottomCounts[queen1.name] || 0
  const queen2BottomCount = bottomCounts[queen2.name] || 0
  
  const queen1WinCount = winCounts[queen1.name] || 0
  const queen2WinCount = winCounts[queen2.name] || 0

  // Calculate base scores
  let score1 = calculateLipSyncScore(queen1, queen1BottomCount)
  let score2 = calculateLipSyncScore(queen2, queen2BottomCount)
  
  // Calculate production bias based on track record
  // Better performing queens (more wins, fewer bottoms) get a production advantage
  const trackRecord1 = queen1WinCount * 0.8 - queen1BottomCount * 0.4
  const trackRecord2 = queen2WinCount * 0.8 - queen2BottomCount * 0.4
  
  // Apply production bias - this represents production favoring queens with better track records
  score1 += trackRecord1 * 0.6
  score2 += trackRecord2 * 0.6

  return score1 > score2 ? queen1 : queen2
}

// Function to calculate which bottom queen a top queen would eliminate
function calculateLipstickChoice(
  topQueen: Queen, 
  bottomQueens: Queen[],
  episodeScores: {[queenName: string]: number},
  relationships?: {[queenName: string]: {[queenName: string]: any}}
): string {
  // Base scores for bottom queens - higher means more likely to eliminate
  const scoreMap: {[queenName: string]: number} = {}
  
  for (const bottomQueen of bottomQueens) {
    let score = 0
    
    // 1. Performance in this episode (70% base weight)
    // Worse performance = higher elimination chance
    const performanceScore = 10 - (episodeScores[bottomQueen.name] || 5)
    score += performanceScore * 7
    
    // 2. Strategy factor - congeniality vs strategy
    if (topQueen.congeniality < 5 && topQueen.conflictResilience > 7) {
      // Strategic queens may eliminate stronger competitors
      const competitorStrength = bottomQueen.starPower * 0.4 + 
        bottomQueen.versatility * 0.3 + 
        bottomQueen.adaptability * 0.3
      score += competitorStrength * 5
    }
    
    // 3. Relationship factor
    if (relationships && relationships[topQueen.name] && relationships[topQueen.name][bottomQueen.name]) {
      const relationship = relationships[topQueen.name][bottomQueen.name]
      
      if (relationship.type === "alliance" || relationship.type === "friendship") {
        // Alliances protect queens (subtract from score)
        const protectionFactor = relationship.strength * 10 * (topQueen.loyalty / 10)
        score -= protectionFactor
      } else if (relationship.type === "rivalry" || relationship.type === "conflict") {
        // Rivalries increase elimination chance
        const rivalryFactor = relationship.strength * 10 * ((10 - topQueen.congeniality) / 10)
        score += rivalryFactor
      }
    }
    
    // Store the score
    scoreMap[bottomQueen.name] = score
  }
  
  // Find the queen with the highest elimination score
  let highestScore = -1
  let chosenQueen = ""
  
  for (const [queenName, score] of Object.entries(scoreMap)) {
    if (score > highestScore) {
      highestScore = score
      chosenQueen = queenName
    }
  }
  
  return chosenQueen || bottomQueens[0].name
}

// Legacy format lipsync function
function simulateLegacyLipSync(queen1: Queen, queen2: Queen): Queen {
  // Use the same comprehensive scoring system as regular lip syncs
  // In legacy format, top 2 queens typically haven't been in the bottom before, so bottomCount = 0
  const queen1Score = calculateLipSyncScore(queen1, 0)
  const queen2Score = calculateLipSyncScore(queen2, 0)
  
  return queen1Score > queen2Score ? queen1 : queen2
}

export async function POST(request: NextRequest) {
  try {
    const { 
      queens, 
      songs, 
      episodeNumber, 
      usedChallenges = [], 
      usedSongs = [],
      seasonFormat = "regular",
      relationships = {}
    }: { 
      queens: Queen[]; 
      songs: Song[]; 
      episodeNumber: number; 
      usedChallenges?: string[];
      usedSongs?: string[];
      seasonFormat?: "regular" | "legacy";
      relationships?: RelationshipMap;
    } = await request.json()

    if (queens.length < 4) {
      return NextResponse.json({ error: "Need at least 4 queens" }, { status: 400 })
    }

    if (songs.length < 1) {
      return NextResponse.json({ error: "Need at least 1 song" }, { status: 400 })
    }

    // Convert arrays to Sets for faster lookup
    const usedChallengesSet = new Set(usedChallenges);
    const usedSongsSet = new Set(usedSongs);

    // Reset usedChallenges if we've used all available challenges
    if (usedChallengesSet.size >= challenges.length) {
      usedChallengesSet.clear();
    }

    // Filter out used challenges and Girl Groups challenge if conditions aren't met
    const availableChallenges = challenges.filter(challenge => {
      // Filter out already used challenges
      if (usedChallengesSet.has(challenge)) {
        return false;
      }
      
      // Check conditions for Girl Groups
      if (challenge === "Girl Groups") {
        return queens.length >= 6 && queens.length % 2 === 0;
      }
      return true;
    });

    // If all challenges were filtered out, reset and use any challenge except Girl Groups if not valid
    const challengePool = availableChallenges.length > 0 ? availableChallenges : challenges.filter(challenge => {
      if (challenge === "Girl Groups") {
        return queens.length >= 6 && queens.length % 2 === 0;
      }
      return true;
    });
    
    const challengeType = challengePool[Math.floor(Math.random() * challengePool.length)]

    // Mock placement history for pressure calculation
    const queenPlacementHistory: { [queenName: string]: string[] } = {}
    queens.forEach((queen) => {
      queenPlacementHistory[queen.name] = []
    })

    // Calculate pressure states
    const pressureStates: { [queenName: string]: string } = {}
    queens.forEach((queen) => {
      pressureStates[queen.name] = calculatePressureState(queen, queenPlacementHistory[queen.name] || [])
    })

    // Calculate runway scores
    const runwayScores: { [queenName: string]: number } = {}
    queens.forEach((queen) => {
      runwayScores[queen.name] = calculateRunwayScore(queen)
    })

    // Calculate risk taking
    const riskTaking: { [queenName: string]: number } = {}
    queens.forEach((queen) => {
      riskTaking[queen.name] = calculateRiskTaking(queen, pressureStates[queen.name])
    })

    // Calculate challenge scores with all factors
    const challengeScores: { [queenName: string]: number } = {}
    queens.forEach((queen) => {
      challengeScores[queen.name] = calculateChallengeScore(
        queen,
        challengeType,
        runwayScores[queen.name],
        pressureStates[queen.name],
        riskTaking[queen.name],
      )
    })

    // Calculate combined scores for placements
    const scores = queens.map((queen) => ({
      queen,
      score: challengeScores[queen.name] * 0.7 + runwayScores[queen.name] * 0.3,
    }))

    // Determine placements
    const placements = determinePlacements(scores, queens.length)

    // Sort by score for winner and bottom 2
    scores.sort((a, b) => b.score - a.score)
    const winner = scores[0].queen

    // Get placements
    const winnerName = winner.name
    const highQueens = Object.entries(placements)
      .filter(([, placement]) => placement === "HIGH")
      .map(([name]) => name)
    const lowQueen = Object.entries(placements)
      .filter(([, placement]) => placement === "LOW")
      .map(([name]) => name)[0]
    const bottom2Queens = Object.entries(placements)
      .filter(([, placement]) => placement === "BTM2")
      .map(([name]) => name)

    // Check if all songs have been used, and reset if needed
    if (usedSongsSet.size >= songs.length) {
      usedSongsSet.clear();
    }
    
    // Get available songs that haven't been used
    const availableSongs = songs.filter((song) => !usedSongsSet.has(song.id))
    
    // If no available songs (should never happen now), use any song
    const songPool = availableSongs.length > 0 ? availableSongs : songs;
    const selectedSong = songPool[Math.floor(Math.random() * songPool.length)]

    // Track how many times each queen has been in the bottom
    // For episodic format we can extract this from the previous placements in this episode
    const bottomCounts: { [queenName: string]: number } = {}
    bottom2Queens.forEach(name => {
      // Count this appearance in the bottom + any previous episode's bottom appearances
      // In a real competition, track record matters - this simulates queens who are constantly
      // in the bottom feeling more pressure
      bottomCounts[name] = 1 // For narrative mode, we'd need to track across episodes
    })
    
    // Track win counts for production bias in lip syncs
    const winCounts: { [queenName: string]: number } = {}
    // Set win count for the winner of this episode
    winCounts[winner.name] = 1
    
    // Check for episodeNumber to determine if we should account for previous episodes
    // We would need to add episodePlacements as a parameter in the request
    // This is a simplified version that works without previous episodes data
    if (episodeNumber > 1) {
      // This is where we would add previous episode data if available
      // For now, we'll just work with the current winner
      console.log(`Episode ${episodeNumber}: using winner ${winner.name} for production bias`)
    }

    // Lip sync battle
    const bottom2QueenObjects = queens.filter((q) => bottom2Queens.includes(q.name))
    const lipSyncWinner = simulateLipSync(bottom2QueenObjects[0], bottom2QueenObjects[1], bottomCounts, winCounts)
    const eliminated = bottom2QueenObjects.find((queen) => queen.id !== lipSyncWinner.id)!

    const remaining = queens.filter((q) => q.name !== eliminated.name).map((q) => q.name)

    // Calculate lip sync scores
    const lipSyncScores: { [queenName: string]: number } = {}
    bottom2QueenObjects.forEach((queen) => {
      lipSyncScores[queen.name] = calculateLipSyncScore(queen, bottomCounts[queen.name] || 0)
    })    // Handle different formats
    if (seasonFormat === "legacy") {
      // For legacy format, top 2 queens lip sync for their legacy
      const top2QueenObjects = [scores[0].queen, scores[1].queen]
      const top2Names = top2QueenObjects.map(q => q.name)
      
      // Get bottom queens
      const bottomQueenObjects = [
        scores[scores.length - 1].queen,
        scores[scores.length - 2].queen
      ]
      const bottomNames = bottomQueenObjects.map(q => q.name)
      
      // Legacy lipsync
      const legacyLipSyncWinner = simulateLegacyLipSync(top2QueenObjects[0], top2QueenObjects[1])
      const legacyLipSyncLoser = top2QueenObjects.find(q => q.id !== legacyLipSyncWinner.id)!
      
      // Calculate which queen each top queen would eliminate
      const lipstickChoices: {[queenName: string]: string} = {}
      
      top2QueenObjects.forEach(queen => {
        lipstickChoices[queen.name] = calculateLipstickChoice(
          queen,
          bottomQueenObjects,
          challengeScores,
          relationships
        )
      })
      
      // The winner chooses who to eliminate
      const eliminated = lipstickChoices[legacyLipSyncWinner.name]
      const saved = bottomNames.find(name => name !== eliminated)!
      const remaining = queens.filter(q => q.name !== eliminated).map(q => q.name)
      
      // Initialize or use the relationship manager
      let relationshipManager: RelationshipManager;
      
      if (Object.keys(relationships).length > 0) {
        // If relationships data exists, create manager with existing data
        relationshipManager = new RelationshipManager([]);
        relationshipManager.relationships = relationships as RelationshipMap;
      } else {
        // Create a new relationship manager if none exists
        relationshipManager = new RelationshipManager(queens);
      }
      
      // Update relationships based on the elimination decisions
      relationshipManager.updateRelationshipsAfterLegacy(
        legacyLipSyncWinner.name, // winner
        legacyLipSyncLoser.name, // loser
        eliminated, // eliminated queen
        saved, // saved queen
        lipstickChoices[legacyLipSyncLoser.name], // who loser would have chosen
        episodeNumber,
        queens
      );
        // Updated relationships after this episode's events
      const updatedRelationships = relationshipManager.relationships;
      
      // Update placements for legacy format to reflect lip sync results
      const legacyPlacements = { ...placements };
      // The legacy lip sync winner gets the WIN placement
      legacyPlacements[legacyLipSyncWinner.name] = "WIN";
      // The legacy lip sync loser gets the TOP2 placement (silver runner-up)
      legacyPlacements[legacyLipSyncLoser.name] = "TOP2";
      
      // Create detailed episode data for legacy format
      const episodeData = {
        episodeNumber,
        challenge: challengeType,
        challengeScores,
        runwayScores,
        winner: legacyLipSyncWinner.name, // Winner of the lipsync
        maxi_challenge_winner: winnerName, // Top performer in the challenge
        top2: top2Names,
        high: highQueens.filter(name => !top2Names.includes(name)), // High excludes top 2
        safe: queens.map(q => q.name).filter(name => 
          !top2Names.includes(name) && 
          !highQueens.includes(name) && 
          name !== lowQueen &&
          !bottomNames.includes(name)
        ),
        low: lowQueen,
        bottom2: bottomNames,
        lipSyncSong: `${selectedSong.title} by ${selectedSong.artist}`,
        lipSyncSongId: selectedSong.id,
        eliminated,
        eliminatedBy: legacyLipSyncWinner.name,
        lipstickChoices,
        loserWouldHaveChosen: lipstickChoices[legacyLipSyncLoser.name],
        remaining,
        seasonFormat: "legacy",
        relationships: updatedRelationships, // Include updated relationships
        details: {
          challengeScores,
          runwayScores,
          riskTaking,
          pressureState: pressureStates,
          placements: legacyPlacements, // Use updated placements with TOP2
          lipstickChoices
        },
      }
      
      return NextResponse.json(episodeData)    } else {
      // Regular format - we'll still pass back relationships even though they don't change much
      // This keeps the API response consistent between formats
      const relationshipMap = relationships as RelationshipMap;
      
      const episodeData = {
        episodeNumber,
        challenge: challengeType,
        challengeScores,
        runwayScores,
        winner: winnerName,
        high: highQueens,
        low: lowQueen,
        bottom2: bottom2Queens,
        lipSyncSong: `${selectedSong.title} by ${selectedSong.artist}`,
        lipSyncSongId: selectedSong.id, // Add the song ID for tracking
        eliminated: eliminated.name,
        remaining,
        seasonFormat: "regular",
        relationships: relationshipMap, // Include existing relationships without major changes
        details: {
          challengeScores,
          runwayScores,
          riskTaking,
          pressureState: pressureStates,
          lipSyncScores,
          placements,
        },
      }
      
      return NextResponse.json(episodeData)
    }
  } catch (error) {
    console.error("Episode simulation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
