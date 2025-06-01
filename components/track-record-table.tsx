"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Queen } from "@/app/page"

interface TrackRecordTableProps {
  queens: Queen[]
  episodes: any[]
  currentEpisode: number
}

export function TrackRecordTable({ queens, episodes, currentEpisode }: TrackRecordTableProps) {
  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case "WIN":
        return "bg-yellow-500 text-white"
      case "HIGH":
        return "bg-blue-500 text-white"
      case "SAFE":
        return "bg-green-500 text-white"
      case "LOW":
        return "bg-orange-500 text-white"
      case "BTM2":
        return "bg-red-500 text-white"
      case "ELIM":
        return "bg-gray-800 text-white"
      case "RUN":
        return "bg-gray-400 text-white"
      case "WINNER":
        return "bg-yellow-400 text-black font-bold"
      case "TOP2":
        return "bg-gray-400 text-white" // Updated to match RUN style
      case "3RD":
        return "bg-amber-600 text-white"
      case "4TH":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-200 text-gray-800"
    }
  }

  const getPlacementText = (placement: string) => {
    switch (placement) {
      case "WIN":
        return "WIN"
      case "HIGH":
        return "HIGH"
      case "SAFE":
        return "SAFE"
      case "LOW":
        return "LOW"
      case "BTM2":
        return "BTM2"
      case "ELIM":
        return "ELIM"
      case "RUN":
        return "RUN"
      case "WINNER":
        return "WINNER"
      case "TOP2":
        return "RUN" // Changed from "RUNNER-UP" to "RUN"
      case "3RD":
        return "3RD"
      case "4TH":
        return "4TH"
      default:
        return ""
    }
  }

  // Build track record for each queen
  // Normalize queen objects (some might be coming from different sources with different structures)
  const normalizedQueens = queens.map(queen => {
    // Make sure we have a proper name property
    if (typeof queen === 'string') {
      return { name: queen, id: queen, imageUrl: undefined };
    } else if (queen && typeof queen === 'object') {
      return { 
        ...queen,
        name: queen.name || "Unknown", 
        id: queen.id || queen.name || Math.random().toString(),
        imageUrl: 'imageUrl' in queen ? queen.imageUrl : undefined
      };
    }
    return { name: "Unknown", id: "unknown-" + Math.random(), imageUrl: undefined };
  });
  
  const trackRecords = normalizedQueens.map((queen: { name: string; id: string; imageUrl?: string; [key: string]: any }) => {
    const record: string[] = []
    let isEliminated = false
    let eliminationEpisode = -1
    let finalPlacement = -1

    for (let i = 0; i < currentEpisode; i++) {
      const episode = episodes[i]
      if (!episode || isEliminated) {
        if (isEliminated && i === eliminationEpisode) {
          record.push("ELIM")
        } else if (isEliminated) {
          record.push("")
        } else {
          record.push("")
        }
        continue
      }

      // Handle finale episode separately
      if (episode.challenge === "Finale") {
        // Get the winner name handling both string and object types
        const winnerName = typeof episode.winner === 'string' ? 
          episode.winner : 
          (episode.winner as any)?.name || '';
        
        // Get the bottom2/top2 names handling both string and object types
        interface QueenObject {
          name: string;
          [key: string]: any;
        }

        type QueenReference = string | QueenObject;

        const bottom2Names: string[] = ((episode.bottom2 || []) as QueenReference[]).map((queen: QueenReference) => 
          typeof queen === 'string' ? queen : (queen.name || '')
        );
        
        // Check if this queen is the winner
        if (winnerName === queen.name) {
          record.push("WINNER")
          finalPlacement = 1
        } 
        // Check if queen is runner-up (in top 2)
        else if (bottom2Names.includes(queen.name)) {
          record.push("TOP2")
          finalPlacement = 2
        } 
        // Check for 3rd/4th placers from finale details
        else if (episode.details?.placements?.[queen.name] === "3RD") {
          record.push("3RD")
          finalPlacement = 3
        }
        else if (episode.details?.placements?.[queen.name] === "4TH") {
          record.push("4TH")
          finalPlacement = 4
        }
        continue
      }

      const placement = episode.details?.placements?.[queen.name] || "SAFE"

      // Handle episode.eliminated which might be a string or an object with a name property
      const eliminatedName = typeof episode.eliminated === 'string' ? 
        episode.eliminated : 
        (episode.eliminated as any)?.name || '';
        
      if (eliminatedName === queen.name) {
        record.push("ELIM")
        isEliminated = true
        eliminationEpisode = i
      } else {
        record.push(placement)
      }
    }

    return {
      queen,
      record,
      isEliminated,
      eliminationEpisode,
      finalPlacement
    }
  })

  // Sort by finale placement first, then elimination order
  const sortedRecords = trackRecords.sort((a, b) => {
    // If both have finale placements, sort by placement
    if (a.finalPlacement > 0 && b.finalPlacement > 0) {
      return a.finalPlacement - b.finalPlacement
    }
    
    // Finalists first
    if (a.finalPlacement > 0 && b.finalPlacement < 0) return -1
    if (a.finalPlacement < 0 && b.finalPlacement > 0) return 1
    
    // Then sort by elimination order
    if (a.isEliminated && !b.isEliminated) return 1
    if (!a.isEliminated && b.isEliminated) return -1
    if (a.isEliminated && b.isEliminated) {
      return b.eliminationEpisode - a.eliminationEpisode // Later eliminations first
    }
    return 0
  })

  // Calculate proper rankings - for eliminated queens and finalists
  const getRanking = (record: any, index: number) => {
    // If queen has a final placement from finale, use it
    if (record.finalPlacement > 0) {
      return `${record.finalPlacement}${getOrdinalSuffix(record.finalPlacement)}`
    }
    
    // For eliminated queens, calculate based on elimination order
    if (record.isEliminated) {
      // Count how many queens were remaining when this queen was eliminated
      const episodeOfElimination = record.eliminationEpisode
      const remainingAtElimination = queens.length - episodeOfElimination
      return `${remainingAtElimination}${getOrdinalSuffix(remainingAtElimination)}`
    }
    
    return "" // Should not reach here in normal cases
  }

  const getOrdinalSuffix = (num: number) => {
    const j = num % 10
    const k = num % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }

  return (
    <Card>
      <CardContent className="p-3">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-center font-medium w-12">Rank</th>
                <th className="border border-gray-300 p-2 text-center font-medium w-48">Contestant</th>
                {Array.from({ length: currentEpisode }, (_, i) => (
                  <th 
                    key={i} 
                    className="border border-gray-300 p-1 text-center font-medium w-14 relative group cursor-help"
                    title={episodes[i]?.challenge || `Episode ${i + 1}`}
                  >
                    <span>Ep. {i + 1}</span>
                    {episodes[i]?.challenge && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded py-1 px-2 w-max opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                        {episodes[i].challenge}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record, index) => (
                <tr key={record.queen.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 text-center font-medium">{getRanking(record, index)}</td>
                  <td className="border border-gray-300 py-1 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden border border-gray-200">
                        <img
                          src={
                            (record.queen.imageUrl !== undefined ? record.queen.imageUrl : 
                            `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(record.queen.name?.charAt(0) || "")}`)
                          }
                          alt={record.queen.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(record.queen.name?.charAt(0) || "Q")}`
                          }}
                        />
                      </div>
                      <p className="font-medium text-left truncate">{record.queen.name}</p>
                    </div>
                  </td>
                  {record.record.map((placement, episodeIndex) => (
                    <td key={episodeIndex} className="border border-gray-300 p-1 text-center w-14">
                      {placement && (
                        <div
                          className={`${getPlacementColor(placement)} text-xs font-bold rounded-md py-1 px-1 w-full h-full flex items-center justify-center min-h-[32px]`}
                        >
                          {getPlacementText(placement)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="bg-yellow-400 text-black font-bold text-xs rounded-md px-2 py-1">WINNER</div>
            <span>Season Winner</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-gray-400 text-white text-xs rounded-md px-2 py-1">RUN</div>
            <span>Runner-up</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-amber-600 text-white text-xs rounded-md px-2 py-1">3RD</div>
            <span>Third Place</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-gray-500 text-white text-xs rounded-md px-2 py-1">4TH</div>
            <span>Fourth Place</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-yellow-500 text-white text-xs rounded-md px-2 py-1">WIN</div>
            <span>Challenge Win</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-blue-500 text-white text-xs rounded-md px-2 py-1">HIGH</div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-green-500 text-white text-xs rounded-md px-2 py-1">SAFE</div>
            <span>Safe</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-orange-500 text-white text-xs rounded-md px-2 py-1">LOW</div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-red-500 text-white text-xs rounded-md px-2 py-1">BTM2</div>
            <span>Bottom</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="bg-gray-800 text-white text-xs rounded-md px-2 py-1">ELIM</div>
            <span>Eliminated</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
