# Changes to simulation-runner.tsx

```tsx
// Add new state for season format
const [seasonFormat, setSeasonFormat] = useState<"regular" | "legacy">("regular")

// Add format selector to the UI in the initial view (before simulation starts)
{!result && !simulationMode && (
  <div className="space-y-6">
    {/* Existing requirements check */}
    
    {/* Add Season Format Selector */}
    <SeasonFormatSelector
      selectedFormat={seasonFormat}
      onFormatChange={(format) => setSeasonFormat(format as "regular" | "legacy")}
    />

    {/* Existing session name input */}
    
    {/* Existing mode selection */}
  </div>
)}

// Pass the format to the simulation components
<NarrativeSimulation 
  queens={queens} 
  songs={songs} 
  onComplete={handleSimulationComplete} 
  isQuickMode={false}
  seasonFormat={seasonFormat}
/>

<QuickSimulation 
  queens={queens} 
  songs={songs} 
  onComplete={handleSimulationComplete}
  seasonFormat={seasonFormat}
/>
```
