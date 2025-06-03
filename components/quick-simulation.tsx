"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
import { Loader2, Trophy, Crown } from "lucide-react"
import type { Queen, Song } from "@/lib/types"
import { TrackRecordTable } from "@/components/track-record-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface QuickSimulationProps {
  queens: Queen[]
  songs: Song[]
  onComplete: (result: any) => void
  seasonFormat?: "regular" | "legacy" // Season format determines elimination method
}

export function QuickSimulation({ queens, songs, onComplete, seasonFormat = "regular" }: QuickSimulationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState("Starting simulation...")
  const [simulationResult, setSimulationResult] = useState<any | null>(null)
  const [hasSimulated, setHasSimulated] = useState(false)
    
  // Run simulation on component mount
  useEffect(() => {
    // Prevent double simulation runs
    if (hasSimulated) return
    
    const runSimulation = async () => {
      try {
        setHasSimulated(true)
        const result = await simulateEntireSeason(queens, songs, seasonFormat)
        setSimulationResult(result)
        setIsLoading(false)
        // Pass the result back up to the parent component
        onComplete(result)
      } catch (error) {
        console.error("Simulation failed:", error)
        setProgressText("Simulation failed. Please try again.")
      }
    }
    
    runSimulation()
  }, [hasSimulated, queens, songs, seasonFormat, onComplete])  // This function runs the entire season simulation
  const simulateEntireSeason = async (queens: Queen[], songs: Song[], seasonFormat: "regular" | "legacy" = "regular") => {
    let currentQueens = [...queens]
    let episodeNumber = 1
    let allEpisodes: any[] = []
    let usedChallenges = new Set<string>()
    let usedSongs = new Set<string>()
    // Track relationships between queens across episodes
    let relationships = {}
    
    // Continue simulating episodes until we have 4 queens left
    while (currentQueens.length > 4) {
      setProgressText(`Simulating episode ${episodeNumber}...`)
      setProgress(Math.min(80, ((queens.length - currentQueens.length) / (queens.length - 4)) * 100))
      
      // Convert sets to arrays for serialization
      const usedChallengesArray = Array.from(usedChallenges)
      const usedSongsArray = Array.from(usedSongs)
        // Simulate one episode
      const response = await fetch("/api/simulate-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queens: currentQueens,
          songs,
          episodeNumber,
          usedChallenges: usedChallengesArray,
          usedSongs: usedSongsArray,
          seasonFormat: seasonFormat,
          relationships: relationships,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to simulate episode")
      }
        const episodeData = await response.json()
      
      // Update tracking sets
      if (episodeData.challenge) {
        usedChallenges.add(episodeData.challenge)
      }
      
      if (episodeData.lipSyncSongId) {
        usedSongs.add(episodeData.lipSyncSongId)
      }
      
      // Update relationships if they were returned from the API
      if (episodeData.relationships) {
        relationships = episodeData.relationships;
      }
      
      // Add episode to collection
      allEpisodes.push(episodeData)
      
      // Remove eliminated queen
      currentQueens = currentQueens.filter(q => q.name !== episodeData.eliminated)
      
      // Increment episode counter
      episodeNumber++
    }
    
    // Simulate finale
    setProgressText("Simulating finale...")
    setProgress(90)
    
    // Get the final 4 queens' names
    const finalFour = currentQueens.map(q => q.name)
    
    // Create semifinal pairs
    const semifinalPairs = [
      [finalFour[0], finalFour[1]],
      [finalFour[2], finalFour[3]]
    ]
    
    // Determine semifinal winners based on lipsync prowess
    const semifinalWinners = semifinalPairs.map(pair => {
      const queen1 = queens.find(q => q.name === pair[0])!
      const queen2 = queens.find(q => q.name === pair[1])!
      
      const queen1Score = queen1.lipSyncProwess * (0.9 + Math.random() * 0.2)
      const queen2Score = queen2.lipSyncProwess * (0.9 + Math.random() * 0.2)
      
      return queen1Score > queen2Score ? pair[0] : pair[1]
    })
    
    // Final lipsync
    const queen1 = queens.find(q => q.name === semifinalWinners[0])!
    const queen2 = queens.find(q => q.name === semifinalWinners[1])!
    
    const queen1Score = queen1.lipSyncProwess + queen1.starPower * 0.5
    const queen2Score = queen2.lipSyncProwess + queen2.starPower * 0.5
    
    // Final winner
    const winner = queen1Score > queen2Score ? semifinalWinners[0] : semifinalWinners[1]
    const runnerUp = queen1Score > queen2Score ? semifinalWinners[1] : semifinalWinners[0]
    
    // Create a finale episode
    const finaleEpisode = {
      episodeNumber,
      challenge: "Finale",
      winner: winner,
      eliminated: null,
      remaining: [winner, runnerUp],
      details: {
        finalistPairs: semifinalPairs,
        semifinalWinners,
        finalLipsync: [semifinalWinners[0], semifinalWinners[1]],
        placements: {
          [winner]: "WINNER",
          [runnerUp]: "TOP2",
        }
      },
      standings: {
        [winner]: 1,
        [runnerUp]: 2,
      }
    }
    
    // Add 3rd and 4th places
    const thirdFourth = finalFour.filter(
      name => !semifinalWinners.includes(name)
    )
    
    if (thirdFourth.length >= 1) {
      finaleEpisode.standings[thirdFourth[0]] = 3
      finaleEpisode.details.placements[thirdFourth[0]] = "3RD"
    }
    
    if (thirdFourth.length >= 2) {
      finaleEpisode.standings[thirdFourth[1]] = 4
      finaleEpisode.details.placements[thirdFourth[1]] = "4TH"
    }
    
    // Add finale episode
    allEpisodes.push(finaleEpisode)
      // Create placements object for all queens
    const placements: {[queenName: string]: string} = {}
    
    // Add eliminated queens with their positions
    queens.forEach(queen => {
      if (!finalFour.includes(queen.name)) {
        // Find which episode this queen was eliminated in
        const eliminationEpisode = allEpisodes.find(ep => ep.eliminated === queen.name)
        if (eliminationEpisode) {
          const position = queens.length - allEpisodes.indexOf(eliminationEpisode)
          placements[queen.name] = `${position}TH`
        }
      }
    })
    
    // Add finalists
    placements[winner] = "WINNER"
    placements[runnerUp] = "TOP2"
    if (thirdFourth.length >= 1) placements[thirdFourth[0]] = "3RD"
    if (thirdFourth.length >= 2) placements[thirdFourth[1]] = "4TH"
    
    // Ensure the finale episode has properly formatted details/placements
    finaleEpisode.details.placements = placements
    
    setProgress(100)
    
    // Return the final simulation results
    return {
      episodes: allEpisodes,
      winner,
      runnerUp, 
      finalFour,
      placements,
      relationships // Include the final relationships state
    }
  }  // Display winner screen with track record
  if (!isLoading && simulationResult) {
    const finalEpisode = simulationResult.episodes[simulationResult.episodes.length - 1]
    
    return (
      <div className="space-y-6">
        <Card className="text-center py-8 border-2 border-yellow-400">
          <CardHeader>
            <CardTitle className="text-2xl flex flex-col items-center">
              <Crown className="h-16 w-16 text-yellow-500 mb-4 animate-pulse" />
              <span className="text-3xl font-bold">{simulationResult.winner} Wins!</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Season completed in {simulationResult.episodes.length} episodes with {queens.length} queens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <p className="text-xl font-semibold">Runner-up: {simulationResult.runnerUp}</p>
              <div className="flex gap-2 flex-wrap justify-center">
                {simulationResult.finalFour?.map((queen: string) => (
                  <Badge key={queen} variant={queen === simulationResult.winner ? "default" : "outline"} 
                    className={queen === simulationResult.winner ? "bg-yellow-500" : ""}>
                    {queen}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Season Results</h3>
              <TrackRecordTable 
                queens={queens} 
                episodes={simulationResult.episodes} 
                currentEpisode={simulationResult.episodes.length} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading screen
  return (
    <div className="space-y-6">
      <Card className="text-center py-16">
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-16 w-16 text-purple-500 animate-spin" />
            <h2 className="text-xl font-semibold">{progressText}</h2>
            <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-purple-500 h-2.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
