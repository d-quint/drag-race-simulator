import { type NextRequest, NextResponse } from "next/server"

interface Queen {
  id: string
  name: string
  congeniality: number
  loyalty: number
  novelty: number
  conceptualDepth: number
  riskTolerance: number
  conflictResilience: number
  designVision: number
  comedyChops: number
  lipSyncProwess: number
  runwayPresence: number
  actingAbility: number
  vocalMusicality: number
  versatility: number
  adaptability: number
  starPower: number
}

interface Song {
  id: string
  title: string
  artist: string
  genre: string
}

// Add new interfaces for detailed episode data
interface EpisodeDetails {
  challengeScores: { [queenName: string]: number }
  runwayScores: { [queenName: string]: number }
  riskTaking: { [queenName: string]: number }
  pressureState: { [queenName: string]: string }
  lipSyncScores?: { [queenName: string]: number }
  placements: { [queenName: string]: string }
}

interface Episode {
  episodeNumber: number
  challenge: string
  winner: string
  bottom2: string[]
  lipSyncSong: string
  eliminated: string
  remaining: string[]
  standings: { [queenName: string]: number }
  details: EpisodeDetails
}

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

// Add function to calculate runway score
function calculateRunwayScore(queen: Queen): number {
  const baseScore = queen.runwayPresence * 0.4 + queen.designVision * 0.3 + queen.novelty * 0.2 + queen.starPower * 0.1
  const randomFactor = 0.85 + Math.random() * 0.3
  return Math.max(1, Math.min(10, baseScore * randomFactor))
}

// Add function to calculate risk taking
function calculateRiskTaking(queen: Queen, pressureState: string): number {
  let baseRisk = queen.riskTolerance

  // Adjust based on pressure state
  if (pressureState === "Pressured") {
    baseRisk *= 1.2 // Take more risks when pressured
  } else if (pressureState === "Confident") {
    baseRisk *= 0.9 // Take fewer risks when confident
  }

  // Higher risk tolerance means more variance in the outcome
  // Low risk queens get a small random factor (0.8 to 1.2)
  // High risk queens get a larger random factor (0.6 to 1.4)
  const riskVariance = 0.2 + (queen.riskTolerance / 10) * 0.4; // Maps from 0.2 to 0.6
  const randomFactor = (1 - riskVariance) + (Math.random() * riskVariance * 2);
  
  return Math.max(1, Math.min(10, baseRisk * randomFactor))
}

// Add function to determine pressure state
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

// Update calculateChallengeScore to include runway impact and pressure
function calculateChallengeScore(
  queen: Queen,
  challengeType: string,
  runwayScore: number,
  pressureState: string,
  riskTaking: number,
): number {
  let baseScore = 0

  // Original challenge scoring logic...
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
    pressureMultiplier = 0.9 // Perform worse under pressure
  } else if (pressureState === "Determined") {
    pressureMultiplier = 1.1 // Perform better when determined
  } else if (pressureState === "Confident") {
    pressureMultiplier = 1.05 // Slight boost when confident
  }

  // Risk taking can boost or hurt performance
  const riskImpact = (riskTaking - 5) * 0.05 // -0.25 to +0.25 multiplier

  const finalScore = (baseScore + runwayImpact) * pressureMultiplier * (1 + riskImpact)

  // Add some randomness (±10%)
  const randomFactor = 0.9 + Math.random() * 0.2
  return Math.max(1, Math.min(10, finalScore * randomFactor))
}

// Add function to determine placements
function determinePlacements(
  scores: Array<{ queen: Queen; score: number }>,
  remainingCount: number,
): { [queenName: string]: string } {
  const placements: { [queenName: string]: string } = {}

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score)

  if (remainingCount >= 8) {
    // 8+ queens: 1 WIN, 2 HIGH, rest SAFE except 1 LOW and 2 BTM2
    placements[scores[0].queen.name] = "WIN"
    placements[scores[1].queen.name] = "HIGH"
    placements[scores[2].queen.name] = "HIGH"

    // Bottom 2 are the lowest scores
    placements[scores[scores.length - 1].queen.name] = "BTM2"
    placements[scores[scores.length - 2].queen.name] = "BTM2"

    // Second to last non-bottom is LOW
    placements[scores[scores.length - 3].queen.name] = "LOW"

    // Everyone else is SAFE
    for (let i = 3; i < scores.length - 3; i++) {
      placements[scores[i].queen.name] = "SAFE"
    }
  } else {
    // Fewer queens: adjust accordingly
    placements[scores[0].queen.name] = "WIN"

    if (remainingCount >= 6) {
      placements[scores[1].queen.name] = "HIGH"
      if (remainingCount >= 7) {
        placements[scores[2].queen.name] = "HIGH"
      }
    }

    // Bottom 2
    placements[scores[scores.length - 1].queen.name] = "BTM2"
    placements[scores[scores.length - 2].queen.name] = "BTM2"

    // LOW if enough queens
    if (remainingCount >= 5) {
      placements[scores[scores.length - 3].queen.name] = "LOW"
    }

    // Rest are SAFE
    for (const score of scores) {
      if (!placements[score.queen.name]) {
        placements[score.queen.name] = "SAFE"
      }
    }
  }

  return placements
}

function calculateLipSyncScore(queen: Queen, bottomCount: number = 0, moraleFactor: number = 0): number {
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
  
  // Apply morale factor - this tracks how the queen feels about their overall performance
  // Negative morale can make a queen give up, positive morale can give them an edge
  let moraleAdjustment = 0;
  if (moraleFactor !== 0) {
    moraleAdjustment = moraleFactor * (queen.adaptability / 10); // Queens with high adaptability respond better to morale shifts
  }

  // Add randomness for lip sync battles
  const randomFactor = 0.8 + Math.random() * 0.4
  
  // Calculate final score with all factors
  return Math.max(1, Math.min(10, (baseScore + pressureFactor + moraleAdjustment) * randomFactor))
}

function simulateLipSync(queen1: Queen, queen2: Queen, bottomCounts: {[key: string]: number} = {}, moraleFactors: {[key: string]: number} = {}, winCounts: {[key: string]: number} = {}): Queen {
  const queen1BottomCount = bottomCounts[queen1.name] || 0
  const queen2BottomCount = bottomCounts[queen2.name] || 0
  
  const queen1Morale = moraleFactors[queen1.name] || 0
  const queen2Morale = moraleFactors[queen2.name] || 0
  
  const queen1WinCount = winCounts[queen1.name] || 0
  const queen2WinCount = winCounts[queen2.name] || 0
  
  // Calculate base scores
  let score1 = calculateLipSyncScore(queen1, queen1BottomCount, queen1Morale)
  let score2 = calculateLipSyncScore(queen2, queen2BottomCount, queen2Morale)
  
  // Calculate production bias based on track record
  // Better performing queens (more wins, fewer bottoms) get a production advantage
  const trackRecord1 = queen1WinCount * 0.8 - queen1BottomCount * 0.4
  const trackRecord2 = queen2WinCount * 0.8 - queen2BottomCount * 0.4
  
  // Apply production bias - this represents production favoring queens with better track records
  score1 += trackRecord1 * 0.6
  score2 += trackRecord2 * 0.6

  return score1 > score2 ? queen1 : queen2
}

export async function POST(request: NextRequest) {
  try {
    const { queens, songs }: { queens: Queen[]; songs: Song[] } = await request.json()

    if (queens.length < 6) {
      return NextResponse.json({ error: "Need at least 6 queens" }, { status: 400 })
    }

    if (songs.length < 5) {
      return NextResponse.json({ error: "Need at least 5 songs" }, { status: 400 })
    }

    let remainingQueens = [...queens]
    const episodes: Episode[] = []
    const usedSongs = new Set<string>()
    let episodeNumber = 1

    // Track queen placement history for pressure calculation
    const queenPlacementHistory: { [queenName: string]: string[] } = {}
    
    // Track how many times queens have been in the bottom and their general morale
    const bottomCounts: { [queenName: string]: number } = {}
    const moraleFactors: { [queenName: string]: number } = {}
    
    remainingQueens.forEach((queen) => {
      queenPlacementHistory[queen.name] = []
      bottomCounts[queen.name] = 0
      moraleFactors[queen.name] = 0
    })

    // Track used challenges to avoid repeats until all challenges have been used
    const usedChallenges = new Set<string>();
    
    // Regular episodes until 4 queens remain
    while (remainingQueens.length > 4) {
      // Reset usedChallenges if we've used all available challenges
      if (usedChallenges.size >= challenges.length) {
        usedChallenges.clear();
      }
      
      // Filter out Girl Groups challenge if conditions aren't met
      // (need an even number of queens and at least 6 queens)
      const availableChallenges = challenges.filter(challenge => {
        // Filter out already used challenges and check conditions for Girl Groups
        if (usedChallenges.has(challenge)) {
          return false;
        }
        
        if (challenge === "Girl Groups") {
          return remainingQueens.length >= 6 && remainingQueens.length % 2 === 0;
        }
        return true;
      });
      
      // If all challenges were filtered out (unlikely but possible edge case), reset and use any challenge
      const challengePool = availableChallenges.length > 0 ? availableChallenges : challenges;
      const challengeType = challengePool[Math.floor(Math.random() * challengePool.length)];
      
      // Mark this challenge as used
      usedChallenges.add(challengeType);

      // Calculate pressure states
      const pressureStates: { [queenName: string]: string } = {}
      remainingQueens.forEach((queen) => {
        pressureStates[queen.name] = calculatePressureState(queen, queenPlacementHistory[queen.name] || [])
      })

      // Calculate runway scores
      const runwayScores: { [queenName: string]: number } = {}
      remainingQueens.forEach((queen) => {
        runwayScores[queen.name] = calculateRunwayScore(queen)
      })

      // Calculate risk taking
      const riskTaking: { [queenName: string]: number } = {}
      remainingQueens.forEach((queen) => {
        riskTaking[queen.name] = calculateRiskTaking(queen, pressureStates[queen.name])
      })

      // Calculate challenge scores with all factors
      const scores = remainingQueens.map((queen) => ({
        queen,
        score: calculateChallengeScore(
          queen,
          challengeType,
          runwayScores[queen.name],
          pressureStates[queen.name],
          riskTaking[queen.name],
        ),
      }))

      // Determine placements
      const placements = determinePlacements(scores, remainingQueens.length)

      // Update placement history
      Object.entries(placements).forEach(([queenName, placement]) => {
        if (!queenPlacementHistory[queenName]) {
          queenPlacementHistory[queenName] = []
        }
        queenPlacementHistory[queenName].push(placement)
      })

      // Sort by score for winner and bottom 2
      scores.sort((a, b) => b.score - a.score)
      const winner = scores[0].queen

      // Bottom 2 are the two lowest scoring queens
      const bottom2 = [scores[scores.length - 1].queen, scores[scores.length - 2].queen]

      // Select random song for lip sync
      // If all songs have been used, reset the used songs tracking
      if (usedSongs.size >= songs.length) {
        usedSongs.clear();
      }
      
      // Get available songs that haven't been used
      const availableSongs = songs.filter((song) => !usedSongs.has(song.id))
      
      // If no available songs (should never happen now), use any song
      const songPool = availableSongs.length > 0 ? availableSongs : songs;
      const selectedSong = songPool[Math.floor(Math.random() * songPool.length)]
      usedSongs.add(selectedSong.id)

      // Update bottom counts for queens in the bottom
      bottom2.forEach(queen => {
        bottomCounts[queen.name] = (bottomCounts[queen.name] || 0) + 1
      });
      
      // Update morale factors based on episode performance:
      // Winner gets a boost, bottom queens get decreased morale
      moraleFactors[winner.name] = Math.min(moraleFactors[winner.name] + 0.2, 0.6); // Boost winner's morale
      bottom2.forEach(queen => {
        moraleFactors[queen.name] = Math.max(moraleFactors[queen.name] - 0.15, -0.5); // Lower bottom 2 morale
      });
      
      // Track win counts for production bias in lip syncs
      const winCounts: { [queenName: string]: number } = {}
      // Add win for this episode's winner
      winCounts[winner.name] = 1
      
      // Add wins from previous episodes for track record
      for (let i = 0; i < episodes.length; i++) {
        const prevEp = episodes[i];
        if (prevEp.winner) {
          winCounts[prevEp.winner] = (winCounts[prevEp.winner] || 0) + 1;
        }
      }
      
      // Lip sync battle with track records considered
      const lipSyncWinner = simulateLipSync(bottom2[0], bottom2[1], bottomCounts, moraleFactors, winCounts)
      const eliminated = bottom2.find((queen) => queen.id !== lipSyncWinner.id)!
      
      // Surviving queen gets a small morale boost from surviving
      moraleFactors[lipSyncWinner.name] = Math.min(moraleFactors[lipSyncWinner.name] + 0.1, 0.6);

      // Calculate lip sync scores
      const lipSyncScores: { [queenName: string]: number } = {}
      bottom2.forEach((queen) => {
        lipSyncScores[queen.name] = calculateLipSyncScore(queen, bottomCounts[queen.name], moraleFactors[queen.name])
      })

      // Remove eliminated queen
      remainingQueens = remainingQueens.filter((queen) => queen.id !== eliminated.id)

      // Create standings
      const standings: { [queenName: string]: number } = {}
      scores.forEach((score, index) => {
        if (score.queen.id !== eliminated.id) {
          standings[score.queen.name] = index + 1
        }
      })

      // Create challenge scores object
      const challengeScores: { [queenName: string]: number } = {}
      scores.forEach((score) => {
        challengeScores[score.queen.name] = score.score
      })

      episodes.push({
        episodeNumber,
        challenge: challengeType,
        winner: winner.name,
        bottom2: bottom2.map((q) => q.name),
        lipSyncSong: `${selectedSong.title} by ${selectedSong.artist}`,
        eliminated: eliminated.name,
        remaining: remainingQueens.map((q) => q.name),
        standings,
        details: {
          challengeScores,
          runwayScores,
          riskTaking,
          pressureState: pressureStates,
          lipSyncScores,
          placements,
        },
      })

      episodeNumber++
    }

    // Update the finale episode section:
    // Finale episode with final 4
    const finalFour = [...remainingQueens]

    // Calculate finale challenge scores to determine top 2
    const finaleScores = finalFour.map((queen) => ({
      queen,
      score: calculateChallengeScore(
        queen,
        "Finale Challenge",
        calculateRunwayScore(queen),
        calculatePressureState(queen, queenPlacementHistory[queen.name] || []),
        calculateRiskTaking(queen, calculatePressureState(queen, queenPlacementHistory[queen.name] || [])),
      ),
    }))

    // Sort by score to get top 2
    finaleScores.sort((a, b) => b.score - a.score)
    const top2 = [finaleScores[0].queen, finaleScores[1].queen]

    // Final lip sync for the crown
    // Make sure we have at least one song available for the finale
    if (usedSongs.size >= songs.length) {
      usedSongs.clear();
    }
    const availableSongs = songs.filter((song) => !usedSongs.has(song.id))
    const songPool = availableSongs.length > 0 ? availableSongs : songs;
    const finalSong = songPool[Math.floor(Math.random() * songPool.length)]

    // For finale, track records and morale throughout the competition are key factors
    // Add a finale bonus for queens who've shown growth
    top2.forEach(queen => {
      // Check for growth in the competition (comparing early vs late placements)
      const placements = queenPlacementHistory[queen.name] || [];
      if (placements.length >= 4) {
        const earlyPlacements = placements.slice(0, Math.floor(placements.length/2));
        const latePlacements = placements.slice(Math.floor(placements.length/2));
        
        const hadEarlyStruggles = earlyPlacements.some(p => p === "BTM2" || p === "LOW");
        const hadLateSuccess = latePlacements.some(p => p === "WIN" || p === "HIGH");
        
        if (hadEarlyStruggles && hadLateSuccess) {
          // Boost for growth narrative
          moraleFactors[queen.name] += 0.2;
        }
      }
    });

    // Compile win counts for finale production bias
    const finaleWinCounts: { [queenName: string]: number } = {}
    // Count all wins throughout the season
    episodes.forEach(episode => {
      if (episode.winner) {
        finaleWinCounts[episode.winner] = (finaleWinCounts[episode.winner] || 0) + 1;
      }
    });
    
    // Apply strong production bias in the finale based on track record
    const winner = simulateLipSync(top2[0], top2[1], bottomCounts, moraleFactors, finaleWinCounts)
    const runnerUp = top2[0].id === winner.id ? top2[1] : top2[0]

    // Create finale episode
    episodes.push({
      episodeNumber,
      challenge: "Finale",
      winner: winner.name,
      bottom2: [top2[0].name, top2[1].name], // This represents the top 2 who lip sync
      lipSyncSong: `${finalSong.title} by ${finalSong.artist}`,
      eliminated: "None (Finale)",
      remaining: [winner.name, runnerUp.name],
      standings: {
        [winner.name]: 1,
        [runnerUp.name]: 2,
        [finaleScores[2].queen.name]: 3,
        [finaleScores[3].queen.name]: 4,
      },
      details: {
        challengeScores: {
          [finaleScores[0].queen.name]: finaleScores[0].score,
          [finaleScores[1].queen.name]: finaleScores[1].score,
          [finaleScores[2].queen.name]: finaleScores[2].score,
          [finaleScores[3].queen.name]: finaleScores[3].score,
        },
        runwayScores: {
          [finalFour[0].name]: calculateRunwayScore(finalFour[0]),
          [finalFour[1].name]: calculateRunwayScore(finalFour[1]),
          [finalFour[2].name]: calculateRunwayScore(finalFour[2]),
          [finalFour[3].name]: calculateRunwayScore(finalFour[3]),
        },
        riskTaking: {
          [finalFour[0].name]: calculateRiskTaking(
            finalFour[0],
            calculatePressureState(finalFour[0], queenPlacementHistory[finalFour[0].name] || []),
          ),
          [finalFour[1].name]: calculateRiskTaking(
            finalFour[1],
            calculatePressureState(finalFour[1], queenPlacementHistory[finalFour[1].name] || []),
          ),
          [finalFour[2].name]: calculateRiskTaking(
            finalFour[2],
            calculatePressureState(finalFour[2], queenPlacementHistory[finalFour[2].name] || []),
          ),
          [finalFour[3].name]: calculateRiskTaking(
            finalFour[3],
            calculatePressureState(finalFour[3], queenPlacementHistory[finalFour[3].name] || []),
          ),
        },
        pressureState: {
          [finalFour[0].name]: calculatePressureState(finalFour[0], queenPlacementHistory[finalFour[0].name] || []),
          [finalFour[1].name]: calculatePressureState(finalFour[1], queenPlacementHistory[finalFour[1].name] || []),
          [finalFour[2].name]: calculatePressureState(finalFour[2], queenPlacementHistory[finalFour[2].name] || []),
          [finalFour[3].name]: calculatePressureState(finalFour[3], queenPlacementHistory[finalFour[3].name] || []),
        },
        placements: {
          [top2[0].name]: "TOP2",
          [top2[1].name]: "TOP2",
          [finaleScores[2].queen.name]: "3RD",
          [finaleScores[3].queen.name]: "4TH",
        },
      },
    })

    return NextResponse.json({
      winner: winner.name,
      episodes,
      finalFour: [winner.name, runnerUp.name, finaleScores[2].queen.name, finaleScores[3].queen.name],
    })
  } catch (error) {
    console.error("Simulation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
