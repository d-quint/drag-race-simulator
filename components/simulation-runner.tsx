"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Play, Crown, Music, Users, AlertCircle, Trophy, Star, Sparkles } from "lucide-react"
import { generateConfetti } from "@/lib/confetti-utils"
import type { Queen, Song, SimulationSession } from "@/app/page"
import { EpisodeDetails } from "@/components/episode-details"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NarrativeSimulation } from "@/components/narrative-simulation"
import { TrackRecordTable } from "@/components/track-record-table"

interface SimulationRunnerProps {
  queens: Queen[]
  songs: Song[]
}

// Using a local interface that matches the current implementation
interface SimulationResult {
  winner: string
  episodes: Episode[]
  finalFour: string[]
  topQueens: string[]
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
}

export function SimulationRunner({ queens, songs }: SimulationRunnerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [sessionName, setSessionName] = useState("")
  const [simulationMode, setSimulationMode] = useState<"narrative" | "quick" | null>(null)

  const canRunSimulation = queens.length >= 6 && songs.length >= 5

  const runQuickSimulation = async () => {
    if (!canRunSimulation) return

    setIsRunning(true)
    setError(null)
    setResult(null)
    setCurrentEpisode(0)

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queens,
          songs,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Simulation failed with status: ${response.status}`);
      }

      const simulationResult = await response.json()
      setResult(simulationResult)

      // Save session if name provided
      if (sessionName.trim()) {
        const newSession: SimulationSession = {
          id: Date.now().toString(),
          name: sessionName.trim(),
          timestamp: Date.now(),
          result: simulationResult,
          queens,
          songs,
        }

        const savedSessions = JSON.parse(localStorage.getItem("dragRaceSimulations") || "[]")
        savedSessions.push(newSession)
        localStorage.setItem("dragRaceSimulations", JSON.stringify(savedSessions))

        setSessionName("")
      }
    } catch (err) {
      setError("Failed to run simulation. Make sure the backend is running.")
      console.error("Simulation error:", err)
    } finally {
      setIsRunning(false)
    }
  }

  const startNarrativeSimulation = () => {
    setSimulationMode("narrative")
  }

  const handleNarrativeComplete = (narrativeResult: any) => {
    setResult(narrativeResult)
    setSimulationMode(null)

    // Save session if name provided
    if (sessionName.trim()) {
      // Create a properly typed session object
      const newSession: SimulationSession = {
        id: Date.now().toString(),
        name: sessionName.trim(),
        timestamp: Date.now(),
        // Make a copy with just the required properties from SimulationResult
        result: {
          winner: narrativeResult.winner,
          topQueens: narrativeResult.topQueens || []
        } as any, // Use type assertion for now
        queens,
        songs,
      };
      
      // Add additional properties that aren't in the SimulationResult interface
      if (narrativeResult.episodes) {
        (newSession.result as any).episodes = narrativeResult.episodes;
      }
      if (narrativeResult.finalFour) {
        (newSession.result as any).finalFour = narrativeResult.finalFour;
      }

      const savedSessions = JSON.parse(localStorage.getItem("dragRaceSimulations") || "[]")
      savedSessions.push(newSession)
      localStorage.setItem("dragRaceSimulations", JSON.stringify(savedSessions))

      setSessionName("")
    }
  }

  const getPlacementColor = (place: number) => {
    if (place === 1) return "bg-yellow-500"
    if (place === 2) return "bg-gray-400"
    if (place === 3) return "bg-amber-600"
    return "bg-gray-300"
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
            <CardDescription>Experience the drama episode by episode</CardDescription>
          </CardHeader>
        </Card>
        <NarrativeSimulation queens={queens} songs={songs} onComplete={handleNarrativeComplete} />
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
      </Card>

      {/* Simulation Mode Selection */}
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
                <CardDescription>Get results instantly without the drama</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={runQuickSimulation}
                  disabled={!canRunSimulation || isRunning}
                  className="w-full h-12 text-lg bg-purple-500 hover:bg-purple-600"
                >
                  {isRunning ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Quick Simulation
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600 mt-2">See the complete season results immediately</p>
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

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Winner Announcement */}
          <div className="relative overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-xl shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-[url('/crown-pattern.svg')] opacity-10 mix-blend-overlay"></div>
              
              <div className="md:grid md:grid-cols-2 items-center">
                {/* Left column - Visual elements */}
                <div className="relative">
                  <div className="aspect-square overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-900/80 to-purple-900/40 p-6">
                    {queens.find(q => q.name === result.winner)?.imageUrl ? (
                      <div className="relative w-full h-full max-w-[300px] max-h-[300px] mx-auto" onLoad={() => generateConfetti()}>
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 rounded-full animate-spin-slow opacity-70 blur-md"></div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 rounded-full animate-pulse"></div>
                        <img 
                          src={queens.find(q => q.name === result.winner)?.imageUrl} 
                          alt={result.winner}
                          className="w-full h-full object-cover rounded-full border-4 border-white relative z-10"
                        />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                          <Crown className="w-12 h-12 text-yellow-400 drop-shadow-md" />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-64 h-64 flex items-center justify-center" onLoad={() => generateConfetti()}>
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 rounded-full animate-spin-slow opacity-70 blur-md"></div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 rounded-full animate-pulse"></div>
                        <div className="w-full h-full rounded-full bg-white/90 flex items-center justify-center relative z-10">
                          <Crown className="w-24 h-24 text-yellow-400 drop-shadow-md" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
                  </div>
                </div>
                
                {/* Right column - Text content */}
                <div className="p-8 md:p-10 relative">
                  <div className="absolute top-4 right-4">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={`winner-star-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="inline-block px-3 py-1 bg-pink-500/20 backdrop-blur-sm rounded-full text-sm font-medium mb-2">
                      Season Winner
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-white drop-shadow-sm break-words">
                      {result.winner}
                    </h1>
                    <div className="flex items-center gap-2 mb-4 text-pink-200">
                      <Sparkles className="w-5 h-5" />
                      <span className="uppercase tracking-wider text-xs font-bold">America's Next Drag Superstar</span>
                    </div>
                  </div>
                  
                  <div className="relative mb-6 pl-4 border-l-2 border-pink-400">
                    <p className="text-lg italic text-white/90">"Condragulations {result.winner}! You have shown charisma, uniqueness, nerve, and talent throughout this competition. You are a star!"</p>
                  </div>
                  
                  <Button 
                    className="mt-2 bg-white text-pink-600 hover:bg-white/90 hover:text-pink-700 font-medium"
                    onClick={() => generateConfetti()}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Celebrate
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Final Four */}
          <Card className="overflow-hidden border-none shadow-lg">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4">
                {result.finalFour.map((queen, index) => {
                  // Get the queen object to access imageUrl
                  const queenObject = queens.find(q => q.name === queen);
                  const placementColors = [
                    "from-yellow-500 to-amber-400", // 1st place gradient
                    "from-gray-400 to-gray-300",    // 2nd place gradient
                    "from-amber-700 to-amber-500",  // 3rd place gradient
                    "from-gray-600 to-gray-500"     // 4th place gradient
                  ];
                  
                  return (
                    <div key={queen} className="relative group">
                      <div className={`h-full p-5 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-purple-50 transition-colors duration-300 border-r border-gray-100 flex flex-col items-center justify-center text-center`}>
                        <div className="mb-3 relative">
                          <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${placementColors[index]} blur-sm opacity-70`}></div>
                          {queenObject?.imageUrl ? (
                            <img 
                              src={queenObject.imageUrl}
                              alt={queen}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white relative z-10"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center relative z-10 border-2 border-white">
                              <span className="text-xl font-bold text-gray-400">{queen.charAt(0)}</span>
                            </div>
                          )}
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-20 bg-gradient-to-r from-pink-500 to-purple-500 text-xs font-bold text-white rounded-full w-6 h-6 flex items-center justify-center border border-white">
                            {index + 1}
                          </div>
                        </div>
                        <p className="font-medium text-gray-800">{queen}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {index === 0 ? "Winner" : 
                           index === 1 ? "Runner-Up" : 
                           `${index + 1}${index === 2 ? 'rd' : 'th'} Place`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Complete Season Episode Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Season Breakdown</CardTitle>
              <CardDescription>Every episode from premiere to finale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.episodes &&
                  result.episodes.map((episode) => (
                    <Card key={episode.episodeNumber} className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Episode {episode.episodeNumber}: {episode.challenge}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="font-medium">
                                {episode.challenge === "Finale" ? "Season Winner:" : "Challenge Winner:"}
                              </span>
                              <Badge variant="default">{episode.winner}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Music className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">Lip Sync Song:</span>
                              <span className="text-sm">{episode.lipSyncSong}</span>
                            </div>
                          </div>
                          <div>
                            {episode.bottom2 && episode.bottom2.length > 0 && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                  {episode.challenge === "Finale" ? "Top 2:" : "Bottom 2:"}
                                </span>
                                {episode.bottom2.map((queen) => (
                                  <Badge key={queen} variant="outline">
                                    {queen}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {episode.eliminated && episode.eliminated !== "None (Finale)" && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Eliminated:</span>
                                <Badge variant="destructive">{episode.eliminated}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Remaining Queens: {episode.remaining ? episode.remaining.join(", ") : "N/A"}
                          </p>
                          <EpisodeDetails episode={episode} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Complete Season Track Record */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Complete Season Track Record</CardTitle>
              <CardDescription>Full competition progression from premiere to finale</CardDescription>
            </CardHeader>
            <CardContent>
              <TrackRecordTable
                queens={queens}
                episodes={result.episodes}
                currentEpisode={result.episodes.length}
              />
            </CardContent>
          </Card>
          
          {/* Session Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Save This Season</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  id="saveSessionName"
                  placeholder="Enter a name for this session"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={() => {
                    if (sessionName.trim()) {
                      const winnerQueen = queens.find(q => q.name === result.winner);
                      const topQueens = result.finalFour.map(name => queens.find(q => q.name === name) || queens[0]);
                      
                      // Create the session with correctly typed result
                      const newSession: SimulationSession = {
                        id: Date.now().toString(),
                        name: sessionName.trim(),
                        timestamp: Date.now(),
                        // Use type assertion to satisfy the compiler
                        result: {
                          winner: winnerQueen || queens[0],
                          topQueens: topQueens
                        } as any, // Using any to bypass type checking for now
                        queens,
                        songs,
                      };
                      
                      // Store the additional data after creating the session
                      (newSession.result as any).episodes = result.episodes;
                      (newSession.result as any).finalFour = result.finalFour;
                      
                      const savedSessions = JSON.parse(localStorage.getItem("dragRaceSimulations") || "[]");
                      savedSessions.push(newSession);
                      localStorage.setItem("dragRaceSimulations", JSON.stringify(savedSessions));
                      
                      alert("Session saved successfully!");
                      setSessionName("");
                    } else {
                      alert("Please enter a name for your session");
                    }
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Save Season
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Save this season to view it later in the Saved Simulations tab
              </p>
            </CardContent>
          </Card>
          
          {/* Season Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Season Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{result.episodes.length}</div>
                  <p className="text-sm text-gray-600">Total Episodes</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{queens.length}</div>
                  <p className="text-sm text-gray-600">Total Queens</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-500">
                    {result.episodes.filter((ep) => ep.challenge !== "Finale").length}
                  </div>
                  <p className="text-sm text-gray-600">Competition Episodes</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Challenge Winners</h4>
                <div className="space-y-2">
                  {Object.entries(
                    result.episodes.reduce(
                      (acc, episode) => {
                        if (episode.challenge !== "Finale") {
                          acc[episode.winner] = (acc[episode.winner] || 0) + 1
                        }
                        return acc
                      },
                      {} as Record<string, number>,
                    ),
                  )
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([queenName, wins]) => {
                      const queen = queens.find((q) => q.name === queenName)
                      // Ensure wins is treated as a number
                      const winCount = Number(wins)
                      return (
                        <div key={queenName} className="flex items-center gap-3 p-2 border rounded">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                            <img
                              src={
                                queen?.imageUrl ||
                                `/placeholder.svg?height=32&width=32&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                              }
                              alt={queenName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Badge className="bg-yellow-500 text-white">
                            {winCount} win{winCount !== 1 ? "s" : ""}
                          </Badge>
                          <span className="text-gray-800">{queenName}</span>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
