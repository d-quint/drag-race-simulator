"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Play, Music, Users, AlertCircle, Sparkles } from "lucide-react"
import type { Queen, Song, SimulationSession } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NarrativeSimulation } from "@/components/narrative-simulation"
import { QuickSimulation } from "@/components/quick-simulation"
import { SeasonFormatSelector, seasonFormatOptions } from "@/components/season-format-selector"

interface SimulationRunnerProps {
  queens: Queen[]
  songs: Song[]
}

export function SimulationRunner({ queens, songs }: SimulationRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState("")
  const [simulationMode, setSimulationMode] = useState<"narrative" | "quick" | null>(null)
  const [seasonFormat, setSeasonFormat] = useState<"regular" | "legacy">("regular")

  const canRunSimulation = queens.length >= 6 && songs.length >= 5

  const startNarrativeSimulation = () => {
    setSimulationMode("narrative")
  }
    const startQuickSimulation = () => {
    setSimulationMode("quick")
  }
  
  const handleSimulationComplete = (simulationResult: any) => {
    console.log("Simulation completed:", {
      winner: simulationResult.winner,
      finalFour: simulationResult.finalFour,
      episodeCount: simulationResult.episodes?.length,
      runnerUp: simulationResult.runnerUp,
      placements: simulationResult.placements
    });
    
    // Ensure the finale episode has the proper structure
    // This is especially important for quick mode to show correct track records
    if (simulationResult.episodes && simulationResult.episodes.length > 0) {
      const finaleEpisode = simulationResult.episodes[simulationResult.episodes.length - 1];
      
      // Ensure we have proper placements in the details
      if (finaleEpisode && finaleEpisode.challenge === "Finale") {
        // Make sure we have a details object with placements
        if (!finaleEpisode.details) {
          finaleEpisode.details = {};
        }
        
        if (!finaleEpisode.details.placements && simulationResult.placements) {
          finaleEpisode.details.placements = simulationResult.placements;
        }
        
        // Make sure the standings are correct
        if (!finaleEpisode.standings && simulationResult.finalFour && simulationResult.winner && simulationResult.runnerUp) {
          const thirdFourth = simulationResult.finalFour.filter(
            (name: string) => name !== simulationResult.winner && name !== simulationResult.runnerUp
          );
          
          finaleEpisode.standings = {
            [simulationResult.winner]: 1,
            [simulationResult.runnerUp]: 2
          };
          
          if (thirdFourth.length >= 1) {
            finaleEpisode.standings[thirdFourth[0]] = 3;
          }
          
          if (thirdFourth.length >= 2) {
            finaleEpisode.standings[thirdFourth[1]] = 4;
          }
        }
      }
    }
    
    // Always store the simulation result
    setResult(simulationResult)
    
    // Only reset simulation mode for narrative mode
    // Quick mode should continue showing the result screen
    if (simulationMode === "narrative") {
      setSimulationMode(null)
    }

    // Save session if name provided
    if (sessionName.trim()) {
      // Create a properly typed session object
      const newSession: SimulationSession = {
        id: Date.now().toString(),
        name: sessionName.trim(),
        timestamp: Date.now(),
        // Make a copy with just the required properties from SimulationResult
        result: {
          winner: simulationResult.winner,
          topQueens: simulationResult.finalFour || []
        } as any, // Use type assertion for now
        queens,
        songs,
      };
      
      // Add additional properties that aren't in the SimulationResult interface
      if (simulationResult.episodes) {
        (newSession.result as any).episodes = simulationResult.episodes;
      }
      if (simulationResult.finalFour) {
        (newSession.result as any).finalFour = simulationResult.finalFour;
      }
      if (simulationResult.placements) {
        (newSession.result as any).placements = simulationResult.placements;
      }
      if (simulationResult.runnerUp) {
        (newSession.result as any).runnerUp = simulationResult.runnerUp;
      }

      const savedSessions = JSON.parse(localStorage.getItem("dragRaceSimulations") || "[]")
      savedSessions.push(newSession)
      localStorage.setItem("dragRaceSimulations", JSON.stringify(savedSessions))

      setSessionName("")
    }
  }
  if (simulationMode === "narrative") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              Narrative Simulation Mode
            </CardTitle>
            <CardDescription>
              Experience the drama episode by episode
            </CardDescription>
          </CardHeader>
        </Card>        <NarrativeSimulation 
          queens={queens} 
          songs={songs} 
          onComplete={handleSimulationComplete} 
          isQuickMode={false}
          seasonFormat={seasonFormat}
        />
      </div>
    )
  }
    if (simulationMode === "quick") {
    // If we already have results from quick simulation, show them
    if (result) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-purple-500" />
                Quick Simulation Complete
              </CardTitle>
              <CardDescription>
                Season simulated in {result.episodes?.length || 0} episodes
              </CardDescription>
            </CardHeader>
          </Card>          <QuickSimulation 
            queens={queens} 
            songs={songs} 
            onComplete={handleSimulationComplete}
            seasonFormat={seasonFormat} 
          />
          <Button 
            onClick={() => {
              setResult(null);
              setSimulationMode(null);
            }}
            className="w-full"
          >
            Return to Mode Selection
          </Button>
        </div>
      )
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-500" />
              Quick Simulation Mode
            </CardTitle>
            <CardDescription>
              Quickly simulate the entire season with the same system
            </CardDescription>
          </CardHeader>        </Card>
        <QuickSimulation 
          queens={queens} 
          songs={songs} 
          onComplete={handleSimulationComplete}
          seasonFormat={seasonFormat}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Requirements Check */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Requirements</CardTitle>
          <CardDescription>Make sure you have enough queens and songs to run the simulation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>Queens: {queens.length}/6 minimum</span>
              {queens.length >= 6 ? (
                <Badge variant="default" className="bg-green-500">
                  ✓
                </Badge>
              ) : (
                <Badge variant="destructive">✗</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              <span>Songs: {songs.length}/5 minimum</span>
              {songs.length >= 5 ? (
                <Badge variant="default" className="bg-green-500">
                  ✓
                </Badge>
              ) : (
                <Badge variant="destructive">✗</Badge>
              )}
            </div>
          </div>

          {!canRunSimulation && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>You need at least 6 queens and 5 songs to run a simulation.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>      {/* Simulation Mode Selection */}
      {!result && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="sessionName">Session Name (Optional)</Label>
            <Input
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter a name to save this simulation"
            />
          </div>
          
          {/* Season Format Selector */}
          <SeasonFormatSelector
            selectedFormat={seasonFormat}
            onFormatChange={(format) => setSeasonFormat(format as "regular" | "legacy")}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                  Narrative Mode
                </CardTitle>
                <CardDescription>Experience the drama step-by-step like the real show</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={startNarrativeSimulation}
                  disabled={!canRunSimulation}
                  className="w-full h-12 text-lg bg-pink-500 hover:bg-pink-600"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Narrative Simulation
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Follow Mama Ru through each episode with suspense and drama
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-purple-500" />
                  Quick Mode
                </CardTitle>
                <CardDescription>Skip straight to the Top 4 and finale</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={startQuickSimulation}
                  disabled={!canRunSimulation}
                  className="w-full h-12 text-lg bg-purple-500 hover:bg-purple-600"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Quick Simulation
                </Button>
                <p className="text-sm text-gray-600 mt-2">Skip directly to the Top 4 finale</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}