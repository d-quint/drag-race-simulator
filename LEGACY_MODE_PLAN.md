# Implementation Plan: Lipsync for Your Legacy Mode

## Components to Modify:

### 1. `simulation-runner.tsx`
- Add state for season format
- Integrate format selector component
- Pass format to simulation components

### 2. `narrative-simulation.tsx`
- Major changes needed for episode flow
- New relationship calculations for alliances/rivalries
- Implement lipstick selection logic
- Different elimination logic

### 3. `quick-simulation.tsx`
- Update to support legacy format
- Modify episode simulation API calls

### 4. API Routes
- `simulate-episode` route needs updating to handle legacy format
- Add elimination decision logic

## New Components to Create:
1. `season-format-selector.tsx` - UI for selecting format
2. `lipstick-selection.tsx` - Component to show lipstick selection

## Logic for Lipstick Selection:

### Factors influencing elimination decision:
1. **Challenge Performance**: 
   - Higher weight for queens with high congeniality
   - Base chance to eliminate worst performer: 70%

2. **Track Record**:
   - Secondary consideration
   - Queens who consistently performed poorly are targeted

3. **Relationships**:
   - Alliances protect queens regardless of performance
   - Rivalries increase elimination chance
   - Relationship strength multiplier: 
     - Strong alliance: 90% protection
     - Moderate alliance: 60% protection
     - Strong rivalry: 80% elimination chance

4. **Queen Stats Impact**:
   - High congeniality: More likely to eliminate based on performance
   - High nerve: More willing to make strategic eliminations
   - Low congeniality + high nerve: Most likely to eliminate strong competitors

### Relationship Changes:
- Being saved increases relationship with saving queen (+15-25 points)
- Being targeted for elimination by losing queen can damage relationship (-10-20 points)
- Relationship changes affected by congeniality/loyalty stats

## Implementation Steps:

1. Add season format selector to the UI
2. Update simulation-runner to pass format to child components
3. Modify narrative-simulation to implement different formats:
   - Create new steps for top 2 lipsync and decision
   - Add "who would you have chosen" dialog for losing queen
4. Update API route to calculate winner and lipstick selection
5. Implement relationship impact logic
6. Update quick-simulation to handle both formats
7. Test and finalize

## Data Structure Changes:

### Episode Data:
```typescript
interface EpisodeData {
  // Existing fields
  // ...
  
  // New fields for legacy format
  isLegacyFormat: boolean;
  top2: string[];
  lipSyncWinner: string;
  bottomQueens: string[];
  eliminatedBy: string;
  lipstickChoices: {
    [queenName: string]: string; // Which bottom queen each top queen would eliminate
  };
}
```
