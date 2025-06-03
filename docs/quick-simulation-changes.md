# Changes to quick-simulation.tsx

## 1. Update component props
```tsx
interface QuickSimulationProps {
  queens: Queen[]
  songs: Song[]
  onComplete: (result: any) => void
  seasonFormat: "regular" | "legacy" // New prop
}
```

## 2. Update simulation API calls
```tsx
// Modify the API call to include season format
const response = await fetch("/api/simulate-episode", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    queens: currentQueens,
    songs,
    episodeNumber,
    usedChallenges: usedChallengesArray,
    usedSongs: usedSongsArray,
    seasonFormat: props.seasonFormat, // Pass the season format
    relationships: currentRelationships, // Need to track relationships
  }),
})
```

## 3. Track relationships
```tsx
// Add state for tracking relationships
const [currentRelationships, setCurrentRelationships] = useState<{
  [key: string]: { [key: string]: RelationshipData }
}>({})

// After each episode, update relationships
if (props.seasonFormat === "legacy") {
  // Update relationships based on episode results
  const updatedRelationships = {...currentRelationships}
  
  // Handle saved queen relationship improvement
  const winner = episodeData.lipSyncWinner
  const eliminated = episodeData.eliminated
  const saved = episodeData.bottom2.find(name => name !== eliminated)
  
  if (saved && winner) {
    if (!updatedRelationships[winner]) {
      updatedRelationships[winner] = {}
    }
    
    if (!updatedRelationships[winner][saved]) {
      updatedRelationships[winner][saved] = {
        type: "neutral",
        strength: 0
      }
    }
    
    // Improve relationship
    const rel = updatedRelationships[winner][saved]
    rel.strength += 2
    if (rel.strength >= 3) {
      rel.type = "alliance"
    }
    
    updatedRelationships[winner][saved] = rel
  }
  
  setCurrentRelationships(updatedRelationships)
}
```

## 4. Update the winner screen for Legacy format
```tsx
// Add format information to the winner screen
<CardDescription className="text-lg">
  Season completed in {simulationResult.episodes.length} episodes with {queens.length} queens
  {props.seasonFormat === "legacy" && (
    <span className="ml-2 inline-block">
      <Badge variant="secondary">Lipsync for Your Legacy</Badge>
    </span>
  )}
</CardDescription>
```
