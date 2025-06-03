# Changes to route.ts in api/simulate-episode

## 1. Update request parameters
```typescript
interface SimulationRequest {
  queens: Queen[]
  songs: Song[]
  episodeNumber: number
  usedChallenges?: string[]
  usedSongs?: string[]
  seasonFormat: "regular" | "legacy" // New parameter
  relationships?: {[key: string]: {[key: string]: RelationshipData}} // Include current relationships
}
```

## 2. Add new functions for legacy format
```typescript
function calculateLipstickChoices(
  topQueens: Queen[],
  bottomQueens: Queen[],
  allQueens: Queen[],
  episodeNumber: number,
  performances: {[queenName: string]: number},
  relationships: {[key: string]: {[key: string]: RelationshipData}}
): {[queenName: string]: string} {
  const choices: {[queenName: string]: string} = {}
  
  for (const topQueen of topQueens) {
    // Calculate which bottom queen this top queen would eliminate
    
    // Base scores for bottom queens - higher means more likely to eliminate
    const scoreMap: {[queenName: string]: number} = {}
    
    for (const bottomQueen of bottomQueens) {
      let score = 0
      
      // 1. Performance in this episode (70% base weight)
      // Worse performance = higher elimination chance
      const performanceScore = 10 - performances[bottomQueen.name]
      score += performanceScore * 7
      
      // 2. Track record factor (weaker record = higher chance)
      // This would require additional parameters or calculation
      // Placeholder for now
      score += 10 // Placeholder
      
      // 3. Relationship factor
      const relationship = relationships?.[topQueen.name]?.[bottomQueen.name]
      
      if (relationship) {
        if (relationship.type === "alliance") {
          // Alliances protect queens (subtract from score)
          const protectionFactor = relationship.strength * 10 * (topQueen.loyalty / 10)
          score -= protectionFactor
        } else if (relationship.type === "rivalry") {
          // Rivalries increase elimination chance
          const rivalryFactor = relationship.strength * 10 * ((10 - topQueen.congeniality) / 10)
          score += rivalryFactor
        }
      }
      
      // 4. Strategy factor - congeniality vs strategy
      if (topQueen.congeniality < 5 && topQueen.conflictResilience > 7) {
        // Strategic queens may eliminate stronger competitors
        const competitorStrength = calculateQueenStrength(bottomQueen)
        score += competitorStrength * 5
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
    
    choices[topQueen.name] = chosenQueen
  }
  
  return choices
}

function simulateLegacyLipSync(queen1: Queen, queen2: Queen): Queen {
  // Similar to existing lipSync, but with more emphasis on entertainment value
  
  const queen1Score = queen1.lipSyncProwess * 0.6 + queen1.starPower * 0.4
  const queen2Score = queen2.lipSyncProwess * 0.6 + queen2.starPower * 0.4
  
  // Add randomness
  const randomFactor1 = 0.8 + Math.random() * 0.4
  const randomFactor2 = 0.8 + Math.random() * 0.4
  
  return queen1Score * randomFactor1 > queen2Score * randomFactor2 ? queen1 : queen2
}
```

## 3. Update main handler
```typescript
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
    }: SimulationRequest = await request.json()

    // Existing code for challenge selection, etc.
    // ...

    // Calculate performances as before
    const performanceResults = queens.map(queen => {
      // Existing performance calculation
      // ...
      
      return {
        queen,
        score: totalScore
      }
    })
    
    // Sort by performance (highest first)
    performanceResults.sort((a, b) => b.score - a.score)
    
    if (seasonFormat === "legacy") {
      // Legacy format logic
      const top2 = performanceResults.slice(0, 2).map(r => r.queen)
      const bottom2 = performanceResults.slice(-2).map(r => r.queen)
      
      // Winner, high, low, etc.
      const winner = top2[0]
      const high = performanceResults.slice(2, 4).map(r => r.queen.name)
      const safe = performanceResults.slice(4, -2).map(r => r.queen.name)
      const low = bottom2[0].name
      
      // Get performances as a map for easy lookup
      const performances = Object.fromEntries(
        performanceResults.map(r => [r.queen.name, r.score])
      )
      
      // Calculate lipstick choices
      const lipstickChoices = calculateLipstickChoices(
        top2,
        bottom2,
        queens,
        episodeNumber,
        performances,
        relationships
      )
      
      // Simulate the lipsync between top 2
      const lipSyncWinner = simulateLegacyLipSync(top2[0], top2[1])
      const eliminatedQueen = bottom2.find(q => q.name === lipstickChoices[lipSyncWinner.name])!
      
      // Return the results
      return NextResponse.json({
        episodeNumber,
        challenge: selectedChallenge,
        challengeScores: Object.fromEntries(performanceResults.map(p => [p.queen.name, p.score])),
        runwayScores: Object.fromEntries(queens.map(q => [q.name, runwayScores[q.name] || 5])),
        winner: lipSyncWinner.name,
        lipSyncWinner: lipSyncWinner.name,
        top2: top2.map(q => q.name),
        high,
        safe, 
        low,
        bottom2: bottom2.map(q => q.name),
        eliminated: eliminatedQueen.name,
        eliminatedBy: lipSyncWinner.name,
        lipstickChoices,
        seasonFormat: "legacy",
        // Additional fields needed for the UI
      })
    } else {
      // Existing regular format logic
      // ...
    }
  } catch (error) {
    // Error handling
    // ...
  }
}
```
