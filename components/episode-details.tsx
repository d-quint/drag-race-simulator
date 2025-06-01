"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Star, Music, Trophy, Target } from "lucide-react"

interface EpisodeDetailsProps {
  episode: {
    episodeNumber: number
    challenge: string
    winner: string | { name: string; [key: string]: any }
    bottom2: Array<string | { name: string; [key: string]: any }>
    lipSyncSong: string
    eliminated: string | { name: string; [key: string]: any }
    remaining: Array<string | { name: string; [key: string]: any }>
    standings: { [queenName: string]: number }
    details?: {
      challengeScores: { [queenName: string]: number }
      runwayScores: { [queenName: string]: number }
      riskTaking: { [queenName: string]: number }
      pressureState: { [queenName: string]: string }
      lipSyncScores?: { [queenName: string]: number }
      placements: { [queenName: string]: string }
    }
  }
}

export function EpisodeDetails({ episode }: EpisodeDetailsProps) {
  const [open, setOpen] = useState(false)

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case "WIN":
        return "bg-yellow-500 text-white"
      case "HIGH":
        return "bg-green-500 text-white"
      case "SAFE":
        return "bg-blue-500 text-white"
      case "LOW":
        return "bg-orange-500 text-white"
      case "BTM2":
        return "bg-red-500 text-white"
      case "ELIM":
        return "bg-gray-800 text-white"
      default:
        return "bg-gray-300"
    }
  }

  const getPlacementIcon = (placement: string) => {
    switch (placement) {
      case "WIN":
        return <Trophy className="w-4 h-4" />
      case "HIGH":
        return <Star className="w-4 h-4" />
      case "SAFE":
        return <Target className="w-4 h-4" />
      case "LOW":
        return <Target className="w-4 h-4" />
      case "BTM2":
        return <Music className="w-4 h-4" />
      case "ELIM":
        return <Music className="w-4 h-4" />
      default:
        return null
    }
  }

  // Generate mock details if not provided with proper null checks
  const details = episode.details || {
    challengeScores: Object.fromEntries(
      Object.keys(episode.standings || {}).map((queen) => [queen, Math.random() * 10]),
    ),
    runwayScores: Object.fromEntries(Object.keys(episode.standings || {}).map((queen) => [queen, Math.random() * 10])),
    riskTaking: Object.fromEntries(Object.keys(episode.standings || {}).map((queen) => [queen, Math.random() * 10])),
    pressureState: Object.fromEntries(
      Object.keys(episode.standings || {}).map((queen) => [
        queen,
        ["Confident", "Pressured", "Determined", "Nervous"][Math.floor(Math.random() * 4)],
      ]),
    ),
    lipSyncScores:
      episode.bottom2 && episode.bottom2.length > 0
        ? Object.fromEntries(episode.bottom2.map((queen) => [queen, Math.random() * 10]))
        : {},
    placements: Object.fromEntries(
      Object.entries(episode.standings || {}).map(([queen, standing]) => {
        if (queen === episode.winner) return [queen, "WIN"]
        if (episode.bottom2 && episode.bottom2.includes(queen)) {
          return [queen, queen === episode.eliminated ? "ELIM" : "BTM2"]
        }
        if (standing <= 2) return [queen, "HIGH"]
        if (standing >= Object.keys(episode.standings || {}).length - 2) return [queen, "LOW"]
        return [queen, "SAFE"]
      }),
    ),
  }

  // Ensure all required properties exist with defaults
  const safeDetails = {
    challengeScores: details.challengeScores || {},
    runwayScores: details.runwayScores || {},
    riskTaking: details.riskTaking || {},
    pressureState: details.pressureState || {},
    lipSyncScores: details.lipSyncScores || {},
    placements: details.placements || {},
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-1" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Episode {episode.episodeNumber}: {episode.challenge}
          </DialogTitle>
          <DialogDescription>Detailed breakdown of challenge performance and placements</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Episode Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Episode Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-medium">Challenge Winner:</span>
                    <Badge className="bg-yellow-500">
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
                  {episode.bottom2.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">
                        {episode.episodeNumber === episode.remaining.length + 1 ? "Top 2:" : "Bottom 2:"}
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
                  {episode.eliminated !== "None (Finale)" && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Eliminated:</span>
                      <Badge variant="destructive">
                        {typeof episode.eliminated === 'string' ? episode.eliminated : episode.eliminated?.name || 'Unknown'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Challenge Scores */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Challenge Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(safeDetails.challengeScores)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([queen, score]) => (
                    <div key={queen} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge className={getPlacementColor(safeDetails.placements[queen] || "SAFE")}>
                          <span className="flex items-center gap-1">
                            {getPlacementIcon(safeDetails.placements[queen] || "SAFE")}
                            {safeDetails.placements[queen] || "SAFE"}
                          </span>
                        </Badge>
                        <span className="font-medium">{queen}</span>
                      </div>
                      <div className="text-right">                          <div className="font-bold text-lg">{(score as number).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Challenge Score</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Runway Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-500" />
                Runway Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(safeDetails.runwayScores)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([queen, score]) => (
                    <div key={queen} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{queen}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{(score as number).toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Runway Score</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Taking & Mental State */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-3">Risk Taking</h4>
                  <div className="space-y-2">
                    {Object.entries(safeDetails.riskTaking)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([queen, risk]) => (
                        <div key={queen} className="flex items-center justify-between text-sm">
                          <span>{queen}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full"
                                style={{ width: `${(risk / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{(risk as number).toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Mental State</h4>
                  <div className="space-y-2">
                    {Object.entries(safeDetails.pressureState).map(([queen, state]) => (
                      <div key={queen} className="flex items-center justify-between text-sm">
                        <span>{queen}</span>
                        <Badge
                          variant="outline"
                          className={
                            state === "Confident"
                              ? "border-green-500 text-green-700"
                              : state === "Pressured"
                                ? "border-red-500 text-red-700"
                                : state === "Determined"
                                  ? "border-blue-500 text-blue-700"
                                  : "border-yellow-500 text-yellow-700"
                          }
                        >
                          {state}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lip Sync Scores */}
          {Object.keys(safeDetails.lipSyncScores).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Lip Sync Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(safeDetails.lipSyncScores)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([queen, score]) => (
                      <div key={queen} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge className={queen === episode.eliminated ? "bg-red-500" : "bg-green-500"}>
                            {queen === episode.eliminated ? "LOST" : "WON"}
                          </Badge>
                          <span className="font-medium">{queen}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{(score as number).toFixed(2)}</div>
                          <div className="text-sm text-gray-500">Lip Sync Score</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Remaining Queens */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Remaining Queens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {episode.remaining.map((queen) => {
                  const queenName = typeof queen === 'string' ? queen : queen?.name || 'Unknown';
                  return (
                    <Badge key={queenName} variant="outline" className="text-sm">
                      {queenName}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
