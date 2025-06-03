# Implementation Plan: Lipsync for Your Legacy Mode

## Step 1: UI Components
1. Create `components/ui/radio-group.tsx` for the season format selector UI (completed)
2. Create `components/season-format-selector.tsx` component (completed)

## Step 2: Update SimulationRunner
1. Add state for season format: `const [seasonFormat, setSeasonFormat] = useState<"regular" | "legacy">("regular")`
2. Import the SeasonFormatSelector component
3. Add it to the UI before simulation starts
4. Pass the format to child simulation components

## Step 3: Create Relationship Manager
1. Create a new file `lib/relationship-manager.ts` with the RelationshipManager class
2. Implement methods for tracking and updating relationships between queens
3. Include special logic for legacy format

## Step 4: Update API Route
1. Modify `app/api/simulate-episode/route.ts` to accept seasonFormat parameter
2. Add lipstick selection logic for legacy format
3. Create function to calculate relationships
4. Return different response structure for legacy mode

## Step 5: Update NarrativeSimulation Component
1. Update props to include seasonFormat
2. Add new steps for legacy format
3. Create UI for top 2 announcement, legacy lipsync, and lipstick selection
4. Implement the nextStep logic to handle legacy format steps
5. Add state to track top/bottom queens and lipstick choices

## Step 6: Update QuickSimulation Component
1. Update props to include seasonFormat
2. Pass format to API calls
3. Track relationships throughout episodes
4. Update UI to show format information

## Step 7: Testing
1. Test the regular format still works correctly
2. Test the legacy format with different queen configurations
3. Validate relationship impacts and alliance/rivalry behavior
4. Ensure format selection persists

## Key Areas to Focus On

### Relationship Logic
- Ensure relationships evolve realistically throughout the season
- Alliances and rivalries should significantly impact elimination decisions
- Make different congeniality/loyalty stats create distinct patterns

### UI/UX
- Make it clear to users which format they're playing
- Create dramatic moments for the lipstick reveals
- Show the losing queen's hypothetical choice for drama

### Narrative Quality
- Craft dialogue that makes sense for the legacy format
- Emphasize the importance of alliances and strategy
- Create compelling storylines around relationships

## Future Enhancements
1. Add visual cues for alliances and rivalries
2. Create "Group Alliances" feature for more complex dynamics
3. Allow queens to "break alliances" under pressure
4. Add more season formats (teams, points-based, etc.)
5. Create a relationship/alliance viewer in the UI

## Timeline
1. Core UI Components: 1 day
2. Relationship Manager: 1-2 days
3. API Route Updates: 1 day
4. Narrative Simulation Updates: 2-3 days
5. Quick Simulation Updates: 1 day
6. Testing and Refinement: 1-2 days

Total: 7-10 days for complete implementation
