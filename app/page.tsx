"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QueenCreator } from "@/components/queen-creator"
import { SongManager } from "@/components/song-manager"
import { SimulationRunner } from "@/components/simulation-runner"
import { Crown, Music, Users, Play } from "lucide-react"
import { SavedSessions } from "@/components/saved-sessions"
import { Queen, Song, SimulationResult } from "@/lib/types"

export interface SimulationSession {
  id: string
  name: string
  timestamp: number
  result: SimulationResult
  queens: Queen[]
  songs: Song[]
}

export default function DragRaceSimulator() {
  const [queens, setQueens] = useState<Queen[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [activeTab, setActiveTab] = useState("queens")
  const [savedSessions, setSavedSessions] = useState<SimulationSession[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("dragRaceSimulations")
    if (saved) {
      setSavedSessions(JSON.parse(saved))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="https://raw.githubusercontent.com/d-quint/drag-race-simulator/refs/heads/master/res/logo.png"
              alt="Drag Race Simulator"
              className="h-20 w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image fails to load
                e.currentTarget.style.display = 'none';
                const fallback = document.createElement('h1');
                fallback.className = 'text-4xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent';
                fallback.textContent = 'Drag Race Simulator';
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          </div>
          <p className="text-gray-600 text-lg">
            Create your queens, curate your songs, and simulate the ultimate drag competition
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="queens" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Queens ({queens.length})
            </TabsTrigger>
            <TabsTrigger value="songs" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Songs ({songs.length})
            </TabsTrigger>
            <TabsTrigger value="simulation" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Simulation
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="queens">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Queen Management
                </CardTitle>
                <CardDescription>
                  Create and manage your drag queens with detailed stats for Charisma, Uniqueness, Nerve, and Talent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QueenCreator queens={queens} setQueens={setQueens} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="songs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Song Library
                </CardTitle>
                <CardDescription>Build your collection of lip sync songs for the competition</CardDescription>
              </CardHeader>
              <CardContent>
                <SongManager songs={songs} setSongs={setSongs} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Run Simulation
                </CardTitle>
                <CardDescription>Start the competition with your created queens and songs</CardDescription>
              </CardHeader>
              <CardContent>
                <SimulationRunner queens={queens} songs={songs} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Saved Simulations
                </CardTitle>
                <CardDescription>View and manage your saved drag race simulations</CardDescription>
              </CardHeader>
              <CardContent>
                <SavedSessions />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
