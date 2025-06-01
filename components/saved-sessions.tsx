"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Trash2, Eye, Calendar, Crown, Users, Music, Star, Trophy } from "lucide-react"
import type { SimulationSession } from "@/app/page"
import { TrackRecordTable } from "@/components/track-record-table"

// Add local type augmentation to handle different shapes of SimulationResult
type SimulationResult = SimulationSession['result'] & {
  // These fields may or may not exist depending on how the session was saved
  episodes?: Array<{
    episodeNumber: number;
    challenge: string;
    // Various properties might be either strings or objects with name property
    winner: string | { name: string; [key: string]: any };
    lipSyncSong: string;
    bottom2: Array<string | { name: string; [key: string]: any }>;
    eliminated: string | { name: string; [key: string]: any };
    remaining: Array<string | { name: string; [key: string]: any }>;
    standings: { [queenName: string]: number }
  }>;
  winner: string | {
    name: string;
    [key: string]: any;
  };
  // finalFour can be either string array or queen object array
  finalFour?: Array<string | { name: string; [key: string]: any }>;
  // topQueens might also exist from narrative simulation
  topQueens?: Array<{ name: string; [key: string]: any }>;
}
import { EpisodeDetails } from "@/components/episode-details"

export function SavedSessions() {
  const [sessions, setSessions] = useState<SimulationSession[]>([])
  const [selectedSession, setSelectedSession] = useState<SimulationSession | null>(null)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = () => {
    const saved = localStorage.getItem("dragRaceSimulations")
    if (saved) {
      setSessions(JSON.parse(saved))
    }
  }

  const deleteSession = (sessionId: string) => {
    const updatedSessions = sessions.filter((session) => session.id !== sessionId)
    setSessions(updatedSessions)
    localStorage.setItem("dragRaceSimulations", JSON.stringify(updatedSessions))
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No saved simulations yet. Run a simulation with a session name to save it!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                {session.name}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(session.timestamp)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Winner:
                  </span>
                  <Badge className="bg-yellow-500">
                    {typeof session.result.winner === 'string' 
                      ? session.result.winner 
                      : session.result.winner?.name || 'Unknown'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Queens:
                  </span>
                  <span>{session.queens.length}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Episodes:</span>
                  <span>{(session.result as SimulationResult).episodes?.length || 'N/A'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    Songs:
                  </span>
                  <span>{session.songs.length}</span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{session.name}</DialogTitle>
                        <DialogDescription>Simulation results from {formatDate(session.timestamp)}</DialogDescription>
                      </DialogHeader>

                      {selectedSession && (
                        <div className="space-y-6">
                          {/* Winner */}
                          <Card className="border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50">
                            <CardHeader className="text-center">
                              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                                <Crown className="w-8 h-8 text-yellow-500" />
                                Winner: {typeof selectedSession.result.winner === 'string' 
                                  ? selectedSession.result.winner 
                                  : selectedSession.result.winner?.name || 'Unknown'}
                                <Crown className="w-8 h-8 text-yellow-500" />
                              </CardTitle>
                            </CardHeader>
                          </Card>

                          {/* Track Record Table */}
                          {(selectedSession.result as SimulationResult).episodes?.length && selectedSession.queens?.length ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Trophy className="w-5 h-5 text-purple-500" />
                                  Track Record
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <TrackRecordTable 
                                  queens={selectedSession.queens} 
                                  episodes={(selectedSession.result as SimulationResult).episodes || []} 
                                  currentEpisode={(selectedSession.result as SimulationResult).episodes?.length || 0} 
                                />
                              </CardContent>
                            </Card>
                          ) : null}
                          
                          {/* Challenge Winners Statistics */}
                          {(selectedSession.result as SimulationResult).episodes?.length ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Star className="w-5 h-5 text-yellow-500" />
                                  Challenge Winners
                                </CardTitle>
                                <CardDescription>
                                  Queens ranked by number of challenge wins
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {Object.entries(
                                    ((selectedSession.result as SimulationResult).episodes || []).reduce(
                                      (acc, episode) => {
                                        if (episode.challenge !== "Finale") {
                                          // Handle episode.winner regardless of whether it's a string or object
                                          const winnerName = typeof episode.winner === 'string' ? 
                                            episode.winner : 
                                            (episode.winner as any)?.name || '';
                                          
                                          if (winnerName) {
                                            acc[winnerName] = (acc[winnerName] || 0) + 1;
                                          }
                                        }
                                        return acc;
                                      },
                                      {} as Record<string, number>,
                                    ),
                                  )
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([queenName, wins]) => {
                                      const queen = selectedSession.queens.find((q) => q.name === queenName);
                                      // Ensure wins is treated as a number
                                      const winCount = Number(wins);
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
                                              onError={(e) => {
                                                e.currentTarget.src = `/placeholder.svg?height=32&width=32&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                                              }}
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
                              </CardContent>
                            </Card>
                          ) : null}

                          {/* Final Four */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Final Four</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(selectedSession.result as SimulationResult).finalFour ? 
                                  (selectedSession.result as SimulationResult).finalFour?.map((queen, index: number) => {
                                    // Get queen's name whether it's a string or object
                                    const queenName = typeof queen === 'string' ? queen : queen.name;
                                    
                                    return (
                                      <div key={queenName} className="text-center">
                                        <div
                                          className={`w-12 h-12 rounded-full ${
                                            index === 0
                                              ? "bg-yellow-500"
                                              : index === 1
                                              ? "bg-gray-400"
                                              : index === 2
                                                ? "bg-amber-600"
                                                : "bg-gray-300"
                                          } flex items-center justify-center text-white font-bold mx-auto mb-2`}
                                        >
                                          {index + 1}
                                        </div>
                                        <p className="font-medium">{queenName}</p>
                                      </div>
                                    );
                                  })
                                : <div className="col-span-4 text-center text-gray-500">No finalists data available</div>
                                }
                              </div>
                            </CardContent>
                          </Card>

                          {/* Challenge Winners Stats */}
                          {(selectedSession.result as SimulationResult).episodes?.length ? (
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Star className="w-5 h-5 text-yellow-500" />
                                  Challenge Winners
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {Object.entries(
                                    ((selectedSession.result as SimulationResult).episodes || []).reduce(
                                      (acc, episode) => {
                                        if (episode.challenge !== "Finale") {
                                          // Handle episode.winner regardless of whether it's a string or object
                                          const winnerName = typeof episode.winner === 'string' ? 
                                            episode.winner : 
                                            (episode.winner as any)?.name || '';
                                          
                                          if (winnerName) {
                                            acc[winnerName] = (acc[winnerName] || 0) + 1;
                                          }
                                        }
                                        return acc;
                                      },
                                      {} as Record<string, number>,
                                    ),
                                  )
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([queenName, wins]) => {
                                      const queen = selectedSession.queens.find((q) => q.name === queenName);
                                      // Ensure wins is treated as a number
                                      const winCount = Number(wins);
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
                                              onError={(e) => {
                                                e.currentTarget.src = `/placeholder.svg?height=32&width=32&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                                              }}
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
                              </CardContent>
                            </Card>
                          ) : null}

                          {/* Episodes Details - Full breakdown instead of just summary */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Episodes Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {(selectedSession.result as SimulationResult).episodes?.length ? 
                                  (selectedSession.result as SimulationResult).episodes?.map((episode) => (
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
                                              <span className="font-medium">Challenge Winner:</span>
                                              <Badge variant="default">
                                                {typeof episode.winner === 'string' ? episode.winner : episode.winner?.name || 'Unknown'}
                                              </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 mb-2">
                                              <Music className="w-4 h-4 text-purple-500" />
                                              <span className="font-medium">Lip Sync Song:</span>
                                              <span className="text-sm">{episode.lipSyncSong}</span>
                                            </div>
                                          </div>
                                          <div>
                                            {episode.bottom2 && episode.bottom2.length > 0 && (
                                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="font-medium">
                                                  {episode.episodeNumber === (selectedSession.result as SimulationResult).episodes?.length
                                                    ? "Top 2:"
                                                    : "Bottom 2:"}
                                                </span>
                                                {episode.bottom2.map((queen) => {
                                                  const queenName = typeof queen === 'string' ? queen : queen?.name || 'Unknown';
                                                  return (
                                                    <Badge key={queenName} variant="outline">
                                                      {queenName}
                                                    </Badge>
                                                  );
                                                })}
                                              </div>
                                            )}
                                            {episode.eliminated && episode.eliminated !== "None (Finale)" && (
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">Eliminated:</span>
                                                <Badge variant="destructive">
                                                  {typeof episode.eliminated === 'string' ? episode.eliminated : episode.eliminated?.name || 'Unknown'}
                                                </Badge>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="mt-4">
                                          <p className="text-sm text-gray-600 mb-2">
                                            Remaining Queens: {episode.remaining ? 
                                              episode.remaining.map(queen => 
                                                typeof queen === 'string' ? queen : queen.name
                                              ).join(", ") 
                                              : "N/A"}
                                          </p>
                                          <EpisodeDetails episode={{
                                            ...episode, 
                                            standings: episode.standings || {},
                                            // Normalize properties that might be objects
                                            winner: typeof episode.winner === 'string' ? episode.winner : episode.winner?.name || '',
                                            eliminated: typeof episode.eliminated === 'string' ? episode.eliminated : episode.eliminated?.name || '',
                                            bottom2: (episode.bottom2 || []).map(queen => 
                                              typeof queen === 'string' ? queen : queen.name
                                            )
                                          }} />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))
                                : <div className="text-center text-gray-500 py-8">No episode data available</div>
                                }
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button variant="destructive" size="sm" onClick={() => deleteSession(session.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
