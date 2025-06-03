# Changes to narrative-simulation.tsx

## 1. Update component props
```tsx
interface NarrativeSimulationProps {
  queens: Queen[]
  songs: Song[]
  onComplete: (result: any) => void
  isQuickMode?: boolean
  seasonFormat: "regular" | "legacy" // New prop
}
```

## 2. Add new simulation steps for legacy format
```tsx
// Add these to the SimulationStep type
type SimulationStep =
  | "intro"
  | "challenge-performance"
  // ...existing steps...
  | "top-two-announcement" // New step for legacy format
  | "legacy-lipsync" // New step for legacy format
  | "lipstick-selection" // New step for legacy format
  | "elimination-legacy" // New step for legacy format
  | "losing-queen-choice-reveal" // New step to reveal who the losing queen would have chosen
```

## 3. New state variables
```tsx
// For legacy format
const [topTwoQueens, setTopTwoQueens] = useState<string[]>([])
const [legacyLipSyncWinner, setLegacyLipSyncWinner] = useState<string>("")
const [bottomQueens, setBottomQueens] = useState<string[]>([])
const [lipstickChoices, setLipstickChoices] = useState<{[queenName: string]: string}>({})
```

## 4. Modify episode simulation and flow
```tsx
// In determineEpisodeResults:
if (props.seasonFormat === "legacy") {
  // For legacy format, get top 2 and bottom queens
  const top2 = sortedQueens.slice(0, 2).map(q => q.queen.name)
  const bottom = sortedQueens.slice(-2).map(q => q.queen.name)
  setTopTwoQueens(top2)
  setBottomQueens(bottom)
  
  // Set episode steps for legacy format
  setSteps([
    "intro",
    "challenge-announcement",
    "challenge-performance",
    "runway-performance",
    "top-two-announcement", // Instead of critiques and bottom 2
    "legacy-lipsync",
    "lipstick-selection",
    "elimination-legacy",
    "losing-queen-choice-reveal", // New step
    "relationships-update",
    "episode-complete"
  ])
} else {
  // Regular format steps (existing code)
}
```

## 5. New step rendering functions
```tsx
const renderTopTwoAnnouncement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Two Queens</CardTitle>
        <CardDescription>The two top performing queens of the week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-lg">
            "Condragulations {topTwoQueens.join(' and ')}! You are the top two queens of the week.
            You will lipsync for your legacy, and the winner will decide which of the bottom queens
            will sashay away."
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            {topTwoQueens.map(name => (
              <div key={name} className="text-center">
                <h3 className="text-xl font-bold">{name}</h3>
                {/* Display the queen's performance details */}
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <p className="text-lg">
              "And now, I'm sorry my dears, but you are the bottom two queens of the week..."
            </p>
            
            <div className="grid grid-cols-2 gap-6 mt-4">
              {bottomQueens.map(name => (
                <div key={name} className="text-center">
                  <h3 className="text-xl font-bold">{name}</h3>
                  {/* Display the queen's performance details */}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const renderLegacyLipSync = () => {
  // Similar to existing lip sync render, but for top 2 queens
}

const renderLipstickSelection = () => {
  // Once lipstick is chosen, show the decision
  return (
    <Card className="bg-gradient-to-r from-pink-600 to-purple-600 text-white">
      <CardHeader>
        <CardTitle>The Decision</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-lg">
            "{legacyLipSyncWinner}, you're a winner baby! You've won a cash tip of $10,000 and the power to eliminate one of the bottom queens."
          </p>
          
          <div className="flex flex-col items-center justify-center my-6">
            <p className="text-xl font-bold mb-6">
              "With great power comes great responsibility. Which queen have you chosen to eliminate?"
            </p>
            
            <div className="w-40 h-40 rounded-full bg-black flex items-center justify-center border-4 border-pink-300">
              <p className="text-3xl font-bold text-white">{lipstickChoices[legacyLipSyncWinner]}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const renderLosingQueenChoiceReveal = () => {
  // Show who the losing queen would have chosen
  const losingQueen = topTwoQueens.find(name => name !== legacyLipSyncWinner)!
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>The Road Not Taken</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg mb-4">
          "Before we say goodbye, let's hear from {losingQueen}. If you had won the lipsync, which queen would you have chosen to eliminate?"
        </p>
        
        <div className="text-center">
          <p className="text-xl font-bold my-4">
            "{lipstickChoices[losingQueen]}"
          </p>
        </div>
        
        {/* Show relationship impact based on choice */}
      </CardContent>
    </Card>
  )
}
```

## 6. Update nextStep function
```tsx
const nextStep = () => {
  // Existing code
  
  // Handle legacy format specific transitions
  if (currentStep === "top-two-announcement") {
    setCurrentStep("legacy-lipsync")
  } else if (currentStep === "legacy-lipsync") {
    // Calculate the winner of the legacy lipsync
    const queen1 = queens.find(q => q.name === topTwoQueens[0])!
    const queen2 = queens.find(q => q.name === topTwoQueens[1])!
    
    const winner = calculateLegacyLipSyncWinner(queen1, queen2)
    setLegacyLipSyncWinner(winner.name)
    
    // Calculate lipstick choices for both queens
    const choices = calculateLipstickChoices(
      topTwoQueens,
      bottomQueens,
      currentEpisode,
      relationshipManager
    )
    setLipstickChoices(choices)
    
    setCurrentStep("lipstick-selection")
  } else if (currentStep === "lipstick-selection") {
    // Set the eliminated queen
    setEliminatedQueen(lipstickChoices[legacyLipSyncWinner])
    setCurrentStep("elimination-legacy")
  } else if (currentStep === "elimination-legacy") {
    setCurrentStep("losing-queen-choice-reveal")
  } else if (currentStep === "losing-queen-choice-reveal") {
    // Update relationships based on choices
    updateRelationshipsAfterLegacyElimination(
      topTwoQueens,
      bottomQueens,
      legacyLipSyncWinner,
      lipstickChoices,
      relationshipManager
    )
    
    setCurrentStep("relationships-update")
  }
}
```

## 7. Helper functions for legacy format
```tsx
// Calculate winner of legacy lipsync
function calculateLegacyLipSyncWinner(queen1: Queen, queen2: Queen): Queen {
  // Similar to existing lipsync calculation, but with more emphasis on performance
  const score1 = queen1.lipSyncProwess * (0.9 + Math.random() * 0.2)
  const score2 = queen2.lipSyncProwess * (0.9 + Math.random() * 0.2)
  return score1 > score2 ? queen1 : queen2
}

// Calculate lipstick choices for top queens
function calculateLipstickChoices(
  topQueens: string[],
  bottomQueens: string[],
  currentEpisode: number,
  relationshipManager: any
): {[queenName: string]: string} {
  const choices: {[queenName: string]: string} = {}
  
  for (const topQueen of topQueens) {
    const queen = queens.find(q => q.name === topQueen)!
    
    // Factors to consider
    // 1. Challenge performance
    // 2. Track record
    // 3. Relationships (alliances/rivalries)
    // 4. Strategy based on queen's stats
    
    const bottomChoices = bottomQueens.map(bottomQueen => {
      let score = 0
      
      // Performance factor
      const bottomPerformance = episodeScores[bottomQueen] || 5
      const performanceFactor = (10 - bottomPerformance) * (queen.congeniality / 10)
      score += performanceFactor
      
      // Track record factor
      const trackRecord = calculateTrackRecord(bottomQueen, currentEpisode - 1)
      score += (queen.congeniality / 10) * (5 - trackRecord) // Worse track record = higher score
      
      // Relationship factor
      const relationship = relationshipManager.getRelationship(topQueen, bottomQueen)
      if (relationship.type === "alliance") {
        score -= relationship.strength * (queen.loyalty / 10)
      } else if (relationship.type === "rivalry") {
        score += relationship.strength * ((10 - queen.congeniality) / 10)
      }
      
      // Strategy factor - eliminate strong competitors?
      if (queen.congeniality < 5 && queen.conflictResilience > 7) {
        const competitorStrength = calculateCompetitorStrength(bottomQueen)
        score += competitorStrength * 0.5
      }
      
      return {
        name: bottomQueen,
        score
      }
    })
    
    // Choose queen with highest elimination score
    bottomChoices.sort((a, b) => b.score - a.score)
    choices[topQueen] = bottomChoices[0].name
  }
  
  return choices
}

// Update relationships after elimination
function updateRelationshipsAfterLegacyElimination(
  topQueens: string[],
  bottomQueens: string[],
  winner: string,
  choices: {[queenName: string]: string},
  relationshipManager: any
) {
  const loser = topQueens.find(q => q !== winner)!
  const eliminated = choices[winner]
  const loserWouldEliminate = choices[loser]
  
  // Improve relationship between winner and saved queen
  const saved = bottomQueens.find(q => q !== eliminated)!
  relationshipManager.updateRelationship(winner, saved, 20, "alliance")
  
  // Potential damage to relationship between loser and who they'd eliminate
  if (loserWouldEliminate === eliminated) {
    // Both agreed on elimination - no significant change
  } else {
    // Loser would have eliminated someone else - could damage relationship
    const loserQueen = queens.find(q => q.name === loser)!
    
    // Higher congeniality = less damage
    const damageFactor = Math.max(5, 15 - loserQueen.congeniality)
    relationshipManager.updateRelationship(loser, loserWouldEliminate, -damageFactor, null)
    
    // Possibility of damaging relationship with winner
    if (loserQueen.congeniality < 6) {
      relationshipManager.updateRelationship(loser, winner, -5, null)
    }
  }
}
```
