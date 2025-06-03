"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Music, Trophy, ChevronRight, X, Maximize2, Minimize2 } from "lucide-react"
import type { Queen, Song } from "@/lib/types"
import { EpisodeDetails } from "@/components/episode-details"
import { TrackRecordTable } from "@/components/track-record-table"
import { generateConfetti } from "@/lib/confetti-utils"
import { Label } from "@/components/ui/label" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Fisher-Yates shuffle algorithm to randomize array order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Add challenges array
const challenges = [
  "Design Challenge",
  "Acting Challenge",
  "Comedy Challenge",
  "Singing Challenge",
  "Dance Challenge",
  "Improv Challenge",
  "Roast Challenge",
  "Snatch Game",
  "Ball Challenge",
  "Makeover Challenge",
  "Commercial Challenge",
  "Rusical",
  "Girl Groups",
]

const challengeDescriptions = {
  "Design Challenge":
    "Create a stunning look from unconventional materials. You'll need to showcase your creativity, construction skills, and ability to make fashion from the unexpected.",
  "Acting Challenge":
    "Step into character and deliver a memorable performance. Your acting ability, comedic timing, and stage presence will be put to the test.",
  "Comedy Challenge":
    "Make the judges laugh with your wit and humor. Whether it's stand-up, improv, or sketch comedy, you'll need to bring the funny.",
  "Singing Challenge":
    "Show off your vocal talents in a live performance. You'll need to hit the right notes while serving charisma and stage presence.",
  "Dance Challenge":
    "Choreograph and perform a dance routine that showcases your rhythm, creativity, and performance skills.",
  "Improv Challenge":
    "Think on your feet in this improvisational challenge. Quick wit, adaptability, and comedic timing are essential.",
  "Roast Challenge":
    "Serve up some savage reads and hilarious burns. You'll need sharp wit and the nerve to deliver cutting comedy.",
  "Snatch Game":
    "Impersonate a celebrity in this iconic challenge. Bring humor, accuracy, and quick improvisation to win over the judges.",
  "Ball Challenge":
    "Serve three distinct looks in different categories. This is your chance to showcase versatility, creativity, and runway excellence.",
  "Makeover Challenge":
    "Transform your partner into a drag superstar. You'll need to share your skills while creating a cohesive family resemblance.",
  "Commercial Challenge":
    "Create and star in a commercial that sells a product. Acting, creativity, and marketing savvy are all required.",
  Rusical:
    "Sing, dance, and act in this musical theater challenge. You'll need to master choreography, vocals, and character work.",
  "Girl Groups":
    "Split into groups to write lyrics, choreograph, and perform your own verse in a music video. You'll need singing ability, dance moves, and teamwork to shine.",
}

interface NarrativeSimulationProps {
  queens: Queen[]
  songs: Song[]
  onComplete: (result: any) => void
  isQuickMode?: boolean // Keeping for backwards compatibility but no longer used
  seasonFormat?: "regular" | "legacy" // Season format determines elimination method
}

interface EpisodeData {
  episodeNumber: number
  challenge: string
  challengeScores: { [queenName: string]: number }
  runwayScores: { [queenName: string]: number }
  winner: string
  high: string[]
  low: string
  bottom2: string[]
  lipSyncSong: string
  lipSyncSongId?: string // Added to track songs
  eliminated: string
  remaining: string[]
  details: any
  standings: { [queenName: string]: number }
  groups?: { [group: string]: string[] } // For Girl Groups challenge
  
  // Legacy format properties
  top2?: string[] // Top 2 queens for legacy format
  lipstickChoices?: { [queenName: string]: string } // Which queen chose which lipstick
  loserWouldHaveChosen?: string // Who the loser would have eliminated
}

type SimulationStep =
  | "intro"
  | "challenge-performance"
  | "girl-groups-team-selection"  // New step for Girl Groups team selection
  | "girl-groups-performance"     // New step for Girl Groups performance
  | "top-two-announcement"        // For legacy format: announcing top 2
  | "legacy-lipsync"              // For legacy format: top 2 lip sync
  | "lipstick-selection"          // For legacy format: winner reveals lipstick
  | "losing-queen-choice-reveal"  // For legacy format: loser reveals who they would have eliminated
  | "runway-performance"
  | "deliberation"
  | "winner-announcement"
  | "bottom-announcement"
  | "safe-announcement"
  | "lipsync"
  | "elimination"
  | "relationships-update"        // New step to show relationship changes
  | "episode-complete"
  | "finale-intro"
  | "finale-first-pair"
  | "finale-first-lipsync"
  | "finale-first-result"
  | "finale-second-pair"
  | "finale-second-lipsync"
  | "finale-second-result"
  | "finale-final-lipsync"
  | "finale-crowning"

// Import relationship types from the shared library
import { RelationshipType, RelationshipData as RelationshipLibData } from "@/lib/relationship-manager";

// Local interface for backwards compatibility
interface Relationship extends RelationshipLibData {
  formed: number;   // Episode when the relationship was formed/updated
}

interface SpotifySong {
  title: string;
  artist: string;
  album_image?: string;
  preview_url?: string;
}

export function NarrativeSimulation({ queens, songs, onComplete, isQuickMode = false, seasonFormat = "regular" }: NarrativeSimulationProps) {
  const [currentStep, setCurrentStep] = useState<SimulationStep>("intro")
  const [currentEpisode, setCurrentEpisode] = useState<EpisodeData | null>(null)
  const [remainingQueens, setRemainingQueens] = useState<Queen[]>(queens)
  const [episodeNumber, setEpisodeNumber] = useState(1)
  const [allEpisodes, setAllEpisodes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionName, setSessionName] = useState("")
  
  // Legacy format state
  const [topTwoQueens, setTopTwoQueens] = useState<string[]>([])
  const [legacyLipSyncWinner, setLegacyLipSyncWinner] = useState<string>("")
  const [bottomQueens, setBottomQueens] = useState<string[]>([])
  const [lipstickChoices, setLipstickChoices] = useState<{[queenName: string]: string}>({})
  const [loserChoice, setLoserChoice] = useState<string>("")
  
  // Relationship system
  const [relationships, setRelationships] = useState<{[queenName: string]: {[targetName: string]: Relationship}}>({})
  const [newRelationships, setNewRelationships] = useState<{queen1: string, queen2: string, type: RelationshipType}[]>([])

  // Girl Groups challenge state
  const [girlGroups, setGirlGroups] = useState<{[group: string]: string[]}>({})
  const [groupCaptains, setGroupCaptains] = useState<string[]>([])
  const [currentPicking, setCurrentPicking] = useState<string>("")
  
  const [finaleFirstPair, setFinaleFirstPair] = useState<string[]>([])
  const [finaleSecondPair, setFinaleSecondPair] = useState<string[]>([])
  const [finaleFirstWinner, setFinaleFirstWinner] = useState<string>("")
  const [finaleSecondWinner, setFinaleSecondWinner] = useState<string>("")
  const [finalWinner, setFinalWinner] = useState<string>("")
  const [finaleSongs, setFinaleSongs] = useState<string[]>([])

  // Floating player state
  const [currentSpotifySong, setCurrentSpotifySong] = useState<SpotifySong | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [showFloatingPlayer, setShowFloatingPlayer] = useState(false);
  // Track used challenges and songs
  const [usedChallenges, setUsedChallenges] = useState<Set<string>>(new Set());
  const [usedSongs, setUsedSongs] = useState<Set<string>>(new Set());  
  
  // Handle auto-advancing functionality - removed as requested  // Auto-advancing functionality removed as requested

  const generateEpisode = async () => {
    setIsLoading(true)
    try {
      // Convert Set to Array for JSON serialization
      const usedChallengesArray = Array.from(usedChallenges);
      const usedSongsArray = Array.from(usedSongs);      const response = await fetch("/api/simulate-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queens: remainingQueens,
          songs,
          episodeNumber,
          usedChallenges: usedChallengesArray,
          usedSongs: usedSongsArray,
          seasonFormat: seasonFormat,
          relationships: relationships,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate episode")

      const episodeData = await response.json()
        // Update the tracking sets with newly used challenges and songs
      if (episodeData.challenge) {
        setUsedChallenges(prev => new Set([...prev, episodeData.challenge]));
      }
      
      // Extract song ID from the lip sync song
      if (episodeData.lipSyncSongId) {
        setUsedSongs(prev => new Set([...prev, episodeData.lipSyncSongId]));
      }
      
      // Update relationships if they were returned from the API
      if (episodeData.relationships) {
        setRelationships(episodeData.relationships);
      }
      
      // For legacy format, set up the additional state
      if (seasonFormat === "legacy" && episodeData.top2 && episodeData.lipstickChoices) {
        setTopTwoQueens(episodeData.top2);
        setBottomQueens(episodeData.bottom2);
        setLegacyLipSyncWinner(episodeData.winner);
        setLipstickChoices(episodeData.lipstickChoices);
        setLoserChoice(episodeData.loserWouldHaveChosen);
      }
      
      setCurrentEpisode(episodeData)
    } catch (error) {
      console.error("Episode generation error:", error)
    } finally {
      setIsLoading(false)
    }
  }
  const getPlacementColor = (placement: any): string => {
    switch (placement) {
      case "WIN":
        return "bg-yellow-500 text-white"
      case "TOP2":
        return "bg-gradient-to-r from-gray-300 to-gray-400 text-white shadow-sm" // Silver color for legacy format runner-up
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
      case "WINNER":
        return "bg-yellow-400 text-black font-bold"
      case "3RD":
        return "bg-amber-600 text-white"
      case "4TH":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-300"
    }
  }

  const nextStep = () => {
    switch (currentStep) {
      case "intro":
        // Special handling for Girl Groups challenge
        if (currentEpisode?.challenge === "Girl Groups" && remainingQueens.length >= 6 && remainingQueens.length % 2 === 0) {
          // Setup girl groups for this challenge
          setupGirlGroups();
          setCurrentStep("girl-groups-team-selection");
        } else {
          // Skip Girl Groups steps if not enough queens or odd number
          setCurrentStep("challenge-performance");
        }
        break
      case "girl-groups-team-selection":
        setCurrentStep("girl-groups-performance");
        break
      case "girl-groups-performance":
        setCurrentStep("runway-performance");
        break
      case "challenge-performance":
        setCurrentStep("runway-performance");
        break
      case "runway-performance":
        setCurrentStep("deliberation");
        break
      case "winner-announcement":
        if (seasonFormat === "legacy") {
          // In legacy mode, after winner announcement go to bottom announcement
          setCurrentStep("bottom-announcement")
        } else {
          setCurrentStep("bottom-announcement")
        }
        break
      case "bottom-announcement":
        if (seasonFormat === "legacy") {
          setTopTwoQueens(currentEpisode?.top2 || [])
          setBottomQueens(currentEpisode?.bottom2 || [])
          setCurrentStep("safe-announcement")
        } else {
          setCurrentStep("safe-announcement")
        }
        break
      case "top-two-announcement":
        setCurrentStep("legacy-lipsync")
        break
      case "legacy-lipsync":
        if (currentEpisode) {
          setLegacyLipSyncWinner(currentEpisode.winner || "")
          setLipstickChoices(currentEpisode.lipstickChoices || {})
          setLoserChoice(currentEpisode.loserWouldHaveChosen || "")
        }
        setCurrentStep("lipstick-selection")
        break
      case "lipstick-selection":
        setCurrentStep("elimination")
        break
      case "deliberation":
        if (seasonFormat === "legacy") {
          // For legacy format, skip winner announcement and go directly to bottom announcement
          setCurrentStep("bottom-announcement")
        } else {
          setCurrentStep("winner-announcement")
        }
        break
      case "winner-announcement":
        setCurrentStep("bottom-announcement")
        break
      case "bottom-announcement":
        setCurrentStep("safe-announcement")
        break
      case "safe-announcement":
        if (seasonFormat === "legacy") {
          // In legacy format, we need to announce the top 2 queens
          setCurrentStep("top-two-announcement")
        } else {
          // Regular format: go to lipsync
          setCurrentStep("lipsync")
        }
        break
      case "lipsync":
        setCurrentStep("elimination")
        break
      case "elimination":
        setCurrentStep("relationships-update")
        updateRelationships() // Generate new relationships after each episode
        break
      case "relationships-update":
        setCurrentStep("episode-complete")
        break
      case "episode-complete":
        // Check if we should go to finale - FIXED: Check remaining queens after elimination
        const queensAfterElimination = remainingQueens.filter((q) => q.name !== currentEpisode?.eliminated)
        console.log("Queens after elimination:", queensAfterElimination.length) // Debug log
        console.log(
          "Queens after elimination names:",
          queensAfterElimination.map((q) => q.name),
        ) // Debug log

        if (queensAfterElimination.length === 4) {
          console.log("Starting finale with 4 queens") // Debug log
          startFinale()
        } else if (queensAfterElimination.length > 4) {
          startNextEpisode()
        } else {
          onComplete({ episodes: allEpisodes, winner: queensAfterElimination[0]?.name })
        }
        break
      case "finale-intro":
        setCurrentStep("finale-first-pair")
        break
      case "finale-first-pair":
        setCurrentStep("finale-first-lipsync")
        break
      case "finale-first-lipsync":
        // Simulate the first lip sync with win consideration 
        const firstPairQueens = remainingQueens.filter((q) => finaleFirstPair.includes(q.name))
        const firstWinner = simulateLipSync(firstPairQueens[0], firstPairQueens[1], true) // true = finale mode
        setFinaleFirstWinner(firstWinner.name)
        setCurrentStep("finale-first-result")
        break
      case "finale-first-result":
        setCurrentStep("finale-second-pair")
        break
      case "finale-second-pair":
        setCurrentStep("finale-second-lipsync")
        break
      case "finale-second-lipsync":
        // Simulate the second lip sync with win consideration
        const secondPairQueens = remainingQueens.filter((q) => finaleSecondPair.includes(q.name))
        const secondWinner = simulateLipSync(secondPairQueens[0], secondPairQueens[1], true) // true = finale mode
        setFinaleSecondWinner(secondWinner.name)
        setCurrentStep("finale-second-result")
        break
      case "finale-second-result":
        setCurrentStep("finale-final-lipsync")
        break
      case "finale-final-lipsync":
        // Simulate final lip sync with wins factored in
        const finalTwoQueens = remainingQueens.filter((q) => [finaleFirstWinner, finaleSecondWinner].includes(q.name))
        const crownWinner = simulateLipSync(finalTwoQueens[0], finalTwoQueens[1], true) // true = finale mode
        setFinalWinner(crownWinner.name)
        setCurrentStep("finale-crowning")
        break
      case "finale-crowning":
        // Complete the season        // Get the third and fourth placers
        const thirdPlacer = finaleFirstPair.find((name) => name !== finaleFirstWinner) ?? "Unknown";
        const fourthPlacer = finaleSecondPair.find((name) => name !== finaleSecondWinner) ?? "Unknown";
        const runnerUp = finaleFirstWinner === finalWinner ? finaleSecondWinner : finaleFirstWinner;

        // Log information for debugging
        console.log("Finale results:", {
          winner: finalWinner,
          runnerUp: runnerUp,
          thirdPlacer: thirdPlacer,
          fourthPlacer: fourthPlacer,
          firstPair: finaleFirstPair,
          secondPair: finaleSecondPair,
          firstWinner: finaleFirstWinner,
          secondWinner: finaleSecondWinner
        });
          // Create a properly structured finale episode that includes all finalists
        const finaleEpisode = {
          episodeNumber: episodeNumber,
          challenge: "Finale",
          winner: finalWinner,
          bottom2: [finaleFirstWinner, finaleSecondWinner], // This represents the top 2 finalists
          lipSyncSong: finaleSongs[2] || "Final Song",
          lipSyncSongId: "", // Add this to avoid undefined errors
          eliminated: "None (Finale)",          remaining: [finalWinner],
          high: [],
          low: "",
          challengeScores: {},
          runwayScores: {},
          standings: {
            [finalWinner as string]: 1,
            [runnerUp as string]: 2,
            [thirdPlacer as string]: 3,
            [fourthPlacer as string]: 4
          },
          details: {
            challengeScores: {},
            runwayScores: {},
            riskTaking: {},
            pressureState: {},
            lipSyncScores: {
              [finalWinner]: 9.5, // Winner score
              [runnerUp]: 8.8,    // Runner-up score 
              [thirdPlacer]: 7.8, // Third place score
              [fourthPlacer]: 7.5 // Fourth place score
            },
            placements: {
              [finalWinner]: "WINNER",
              [runnerUp]: "TOP2",
              [thirdPlacer]: "3RD",
              [fourthPlacer]: "4TH"
            }
          }
        };        // Create the final result with correctly formatted data for the track record
        // Important: In quick mode, we need to ensure this finale episode is properly constructed
        const finalResult = {
          episodes: [...allEpisodes, finaleEpisode],
          winner: finalWinner,
          finalFour: [finalWinner, runnerUp, thirdPlacer, fourthPlacer],
          runnerUp: runnerUp,
          placements: {
            [finalWinner as string]: "WINNER",
            [runnerUp as string]: "TOP2",
            [thirdPlacer as string]: "3RD",
            [fourthPlacer as string]: "4TH"
          }
        }
        onComplete(finalResult)
        break
    }
  }

  const startNextEpisode = () => {
    if (currentEpisode) {
      // Remove eliminated queen
      const newRemaining = remainingQueens.filter((q) => q.name !== currentEpisode?.eliminated)
      setRemainingQueens(newRemaining)
      setAllEpisodes([...allEpisodes, currentEpisode])
      setEpisodeNumber(episodeNumber + 1)
      
      // Update challenge tracking
      if (currentEpisode.challenge) {
        setUsedChallenges(prev => {
          const newSet = new Set(prev);
          newSet.add(currentEpisode.challenge);
          return newSet;
        });
      }
      
      // Update song tracking if we have the ID
      if (currentEpisode.lipSyncSongId) {
        setUsedSongs(prev => {
          const newSet = new Set(prev);
          newSet.add(currentEpisode.lipSyncSongId as string);
          return newSet;
        });
      }
      
      setCurrentStep("intro")
      setCurrentEpisode(null)
    }
  }

  useEffect(() => {
    if (currentStep === "intro" && !currentEpisode) {
      generateEpisode()
    }
  }, [currentStep, currentEpisode])
  const startFinale = () => {
    // Add current episode to allEpisodes before starting finale
    if (currentEpisode) {
      setAllEpisodes([...allEpisodes, currentEpisode])
    }

    // Ensure we're using exactly the top 4 queens for the finale
    let finalFourQueens = [...remainingQueens];
    
    // Filter out the eliminated queen from the current episode if needed
    if (currentEpisode?.eliminated) {
      finalFourQueens = finalFourQueens.filter((q) => q.name !== currentEpisode.eliminated);
    }
    
    // If we have more than 4 queens, filter to just the top 4
    // This can happen when skipToFinale is triggered but some elimination logic isn't completed
    if (finalFourQueens.length > 4) {
      console.log("More than 4 queens detected for finale, filtering to top 4");
      finalFourQueens = finalFourQueens.slice(0, 4);
    }
    
    // If we somehow have less than 4, log an error but continue 
    // (this shouldn't happen but we want to be robust)
    if (finalFourQueens.length < 4) {
      console.error("Less than 4 queens available for finale:", finalFourQueens.map(q => q.name));
    }
    
    // Update remaining queens to be exactly our finalists
    setRemainingQueens(finalFourQueens);

    // Randomly select pairs for finale lip syncs
    const shuffledQueens = [...finalFourQueens].sort(() => Math.random() - 0.5)
    const firstPair = [shuffledQueens[0]?.name || "Unknown", shuffledQueens[1]?.name || "Unknown"]
    const secondPair = [shuffledQueens[2]?.name || "Unknown", shuffledQueens[3]?.name || "Unknown"]

    setFinaleFirstPair(firstPair)
    setFinaleSecondPair(secondPair)

    // Select 3 random songs for the finale, preferring unused songs
    // If we've used too many songs already, reset the tracking
    if (usedSongs.size >= songs.length - 3) {
      setUsedSongs(new Set());
    }
    
    // Filter to get unused songs
    const availableSongs = songs.filter(song => !usedSongs.has(song.id));
    
    // Use available songs, or all songs if we've used too many
    const songPool = availableSongs.length >= 3 ? availableSongs : songs;
    
    const selectedSongs = songPool
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((song) => `${song.title} by ${song.artist}`);
      
    // Track the used song IDs
    const selectedSongIds = songPool
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(song => song.id);
    
    // Update used songs tracking
    setUsedSongs(prev => {
      const newSet = new Set(prev);
      selectedSongIds.forEach(id => {
        if (id) newSet.add(id);
      });
      return newSet;
    });
    
    setFinaleSongs(selectedSongs)

    setCurrentStep("finale-intro")
  }

  // New function to update relationships between queens after each episode
  const updateRelationships = () => {
    if (!currentEpisode) return;
    
    const newRels: {queen1: string, queen2: string, type: RelationshipType}[] = [];
    const updatedRelationships = {...relationships};
    const remainingNames = remainingQueens.map(q => q.name);
    
    // Each queen has a chance to form a new relationship
    remainingNames.forEach(queenName => {
      // Initialize relationships object for this queen if it doesn't exist
      if (!updatedRelationships[queenName]) {
        updatedRelationships[queenName] = {};
      }
      
      // Chance to form a relationship depends on episode count and existing relationships
      const existingRelationshipCount = Object.keys(updatedRelationships[queenName] || {}).length;
      const chanceToFormNewRelationship = 0.3 + (0.1 * episodeNumber) - (0.05 * existingRelationshipCount);
      
      if (Math.random() < chanceToFormNewRelationship) {
        // Select a random queen to form a relationship with
        const potentialTargets = remainingNames.filter(name => 
          name !== queenName && 
          (!updatedRelationships[queenName]?.[name] || 
           episodeNumber - (updatedRelationships[queenName][name]?.formed || 0) > 2)
        );
        
        if (potentialTargets.length) {
          const targetName = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
          const queen = remainingQueens.find(q => q.name === queenName)!;
          const targetQueen = remainingQueens.find(q => q.name === targetName)!;
          
          // Determine relationship type based on queen attributes
          let type: RelationshipType = "neutral";
          const loyaltyDiff = Math.abs(queen.loyalty - targetQueen.loyalty);
          const congenialityDiff = Math.abs(queen.congeniality - targetQueen.congeniality);
            // Queens with similar values are more likely to form alliances
          if (loyaltyDiff < 3 && congenialityDiff < 3 && Math.random() < 0.7) {
            type = "alliance";
          } 
          // Queens with very different values might become rivals or be in conflict
          else if ((loyaltyDiff > 5 || congenialityDiff > 5) && Math.random() < 0.6) {
            type = Math.random() < 0.5 ? "rivalry" : "conflict";
          } 
          // Queens with moderate differences might become friends
          else if (Math.random() < 0.3) {
            type = "friendship";
          }
          // Otherwise neutral
          
          // Create relationship strength based on queen attributes
          const strength = Math.floor(
            5 + // Base value
            (type === "alliance" ? 2 : 0) + // Alliances tend to be stronger
            (10 - Math.min(loyaltyDiff + congenialityDiff, 10)) * 0.3 + // Similar queens have stronger relationships
            (Math.random() * 3) // Random factor
          );
          
          // Update relationships in both directions
          updatedRelationships[queenName][targetName] = {
            type,
            strength: Math.min(10, Math.max(1, strength)),
            formed: episodeNumber
          };
          
          if (!updatedRelationships[targetName]) {
            updatedRelationships[targetName] = {};
          }
          
          updatedRelationships[targetName][queenName] = {
            type,
            strength: Math.min(10, Math.max(1, strength)),
            formed: episodeNumber
          };
          
          // Add to new relationships for display
          newRels.push({queen1: queenName, queen2: targetName, type});
        }
      }
    });
    
    setRelationships(updatedRelationships);
    setNewRelationships(newRels);
  };
  
  // Count the number of wins a queen has had in previous episodes
  // This includes both regular wins and TOP2 placements (which count as wins for production bias)
  const getQueenWinCount = (queenName: string): number => {
    return allEpisodes.filter(episode => {
      // Count regular wins
      if (episode.winner === queenName) return true;
      
      // Count TOP2 placements as wins for production bias purposes
      if (episode.details?.placements?.[queenName] === "TOP2") return true;
      
      return false;
    }).length;
  }

  const simulateLipSync = (queen1: Queen, queen2: Queen, isFinale: boolean = false): Queen => {
    // Base scores from queen attributes
    let score1 =
      queen1.lipSyncProwess * 0.4 +
      queen1.starPower * 0.2 +
      queen1.conflictResilience * 0.2 +
      queen1.runwayPresence * 0.2;
    
    let score2 =
      queen2.lipSyncProwess * 0.4 +
      queen2.starPower * 0.2 +
      queen2.conflictResilience * 0.2 +
      queen2.runwayPresence * 0.2;
    
    // Get win and bottom counts for track record  
    const winCount1 = getQueenWinCount(queen1.name);
    const winCount2 = getQueenWinCount(queen2.name);
    
    // Get bottom counts from all previous episodes
    const bottomCount1 = allEpisodes.filter(episode => episode.bottom2?.includes(queen1.name)).length;
    const bottomCount2 = allEpisodes.filter(episode => episode.bottom2?.includes(queen2.name)).length;
    
    // Calculate production bias based on track record
    // Better performing queens (more wins, fewer bottoms) get a production advantage
    const trackRecord1 = winCount1 * 0.8 - bottomCount1 * 0.4;
    const trackRecord2 = winCount2 * 0.8 - bottomCount2 * 0.4;
    
    // Apply production bias - this represents production favoring queens with better track records
    score1 += trackRecord1 * 0.6; // Production bias factor
    score2 += trackRecord2 * 0.6;
    
    // For finale lip syncs, add even more emphasis on track record
    if (isFinale) {
      // Additional finale bonus based on wins
      score1 += winCount1 * 0.4; // Extra finale emphasis
      score2 += winCount2 * 0.4;
      
      console.log(`${queen1.name}: ${winCount1} wins, ${bottomCount1} bottoms, bias: ${trackRecord1 * 0.6}`);
      console.log(`${queen2.name}: ${winCount2} wins, ${bottomCount2} bottoms, bias: ${trackRecord2 * 0.6}`);
    }
    
    // Add randomness factor
    score1 += Math.random() * 2;
    score2 += Math.random() * 2;
    
    return score1 > score2 ? queen1 : queen2;
  }
  
  // Function to generate dynamic commentary based on the queen's actual performance
  const getQueenChallengeComment = (queen: Queen, episode: EpisodeData | null): string => {
    if (!episode) return "Preparing for the challenge...";
    
    // Get the queen's score from episode data
    const challengeScore = episode.challengeScores[queen.name] || 0;
    const runwayScore = episode.runwayScores[queen.name] || 0;
    const rawAbilityScore = getRawAbilityScore(queen, episode.challenge); // Base score without randomness
    
    // Determine if they overperformed or underperformed based on their stats
    const scoreDifference = challengeScore - rawAbilityScore;
    const overperformed = scoreDifference > 1;
    const underperformed = scoreDifference < -1;
    const placement = episode.details?.placements?.[queen.name];
    
    // Generate commentary based on scores, stats, and placement
    if (placement === "HIGH" || placement === "WIN") {
      if (overperformed) {
        return "Really stepped up their game and surprised the judges with an unexpectedly strong performance.";
      } else {
        return "Shined brightly as expected with a polished and well-executed performance worthy of high praise.";
      }
    } else if (placement === "SAFE") {
      if (overperformed) {
        return "Delivered more than expected, showing real growth and keeping themselves safe from the bottom.";
      } else if (underperformed) {
        return "Struggled a bit but managed to pull it together enough to stay safe this week.";
      } else {
        return "Gave a solid middle-of-the-pack expectable performance without major highs or lows.";
      }
    } else if (placement === "LOW" || placement === "BTM2") {
      if (underperformed) {
        return "Had a surprisingly rough time with this challenge despite it seemingly being in their wheelhouse.";
      } else {
        return "Hit some obstacles during the challenge that landed them in a vulnerable position.";
      }
    }
    
    // Default responses based on score ranges
    if (challengeScore >= 8.5) {
      return "Delivered an outstanding performance that truly showcased their unique talents.";
    } else if (challengeScore >= 7) {
      return "Put together a solid performance with some impressive creative choices.";
    } else if (challengeScore >= 5) {
      return "Showed some good ideas but struggled with the execution in places.";
    } else {
      return "Had difficulty connecting with the challenge concept and couldn't quite deliver what the judges wanted.";
    }
  }
  
  // Helper function to calculate a queen's raw ability score for a challenge type
  const getRawAbilityScore = (queen: Queen, challengeType: string): number => {
    switch (challengeType) {
      case "Design Challenge":
      case "Ball Challenge":
        return queen.designVision * 0.4 + queen.runwayPresence * 0.3 + queen.novelty * 0.2 + queen.conceptualDepth * 0.1;
      case "Acting Challenge":
      case "Commercial Challenge":
        return queen.actingAbility * 0.4 + queen.versatility * 0.2 + queen.conflictResilience * 0.2 + queen.starPower * 0.2;
      case "Comedy Challenge":
      case "Roast Challenge":
      case "Snatch Game":
        return queen.comedyChops * 0.4 + queen.riskTolerance * 0.2 + queen.starPower * 0.2 + queen.adaptability * 0.2;
      case "Singing Challenge":
      case "Rusical":
        return queen.vocalMusicality * 0.4 + queen.runwayPresence * 0.2 + queen.starPower * 0.2 + queen.versatility * 0.2;
      case "Dance Challenge":
        return queen.runwayPresence * 0.3 + queen.lipSyncProwess * 0.3 + queen.starPower * 0.2 + queen.riskTolerance * 0.2;
      case "Improv Challenge":
        return queen.comedyChops * 0.3 + queen.adaptability * 0.3 + queen.riskTolerance * 0.2 + queen.versatility * 0.2;
      case "Makeover Challenge":
        return queen.designVision * 0.3 + queen.congeniality * 0.3 + queen.versatility * 0.2 + queen.adaptability * 0.2;
      default:
        return queen.versatility * 0.3 + queen.starPower * 0.3 + queen.adaptability * 0.2 + queen.riskTolerance * 0.2;
    }
  }
  
  // Function to get runway commentary based on queen's actual runway score
  const getQueenRunwayComment = (queen: Queen, episode: EpisodeData | null): string => {
    if (!episode) return "Preparing the runway look...";
    
    const runwayScore = episode.runwayScores[queen.name] || 0;
    const rawRunwayAbility = queen.runwayPresence * 0.4 + queen.designVision * 0.3 + queen.novelty * 0.2 + queen.starPower * 0.1;
    
    // Determine if they overperformed or underperformed based on their stats
    const scoreDifference = runwayScore - rawRunwayAbility;
    const overperformed = scoreDifference > 1;
    const underperformed = scoreDifference < -1;
    const placement = episode.details?.placements?.[queen.name];
    
    // General commentary based on score ranges and performance compared to ability
    if (runwayScore >= 9) {
      if (overperformed) {
        return "Unexpectedly turned out one of the best looks of the night, showing incredible growth in their runway presentation.";
      } else {
        return "Stunned the judges with impeccable runway styling that showcased their signature brand of drag excellence.";
      }
    } else if (runwayScore >= 7.5) {
      if (overperformed) {
        return "Really stepped up their runway game with a look that exceeded expectations and showed their growth.";
      } else if (underperformed) {
        return "Delivered a good runway look, though it felt somewhat restrained compared to what they're capable of.";
      } else {
        return "Served a polished, well-executed runway look that represented their aesthetic well.";
      }
    } else if (runwayScore >= 6) {
      if (underperformed) {
        return "Presented a underwhelming runway look that didn't fully showcase their usual runway prowess.";
      } else {
        return "Brought an acceptable look to the runway that met the brief but didn't particularly stand out.";
      }
    } else {
      if (underperformed) {
        return "Really missed the mark on the runway with a look that fell far below their usual standards.";
      } else {
        return "Struggled with the runway presentation, delivering a look that didn't connect with the judges.";
      }
    }
  }

  // Set up the girl groups for the challenge
  // This is only called when there are at least 6 queens and an even number of queens
  const setupGirlGroups = () => {
    // Create a copy of remaining queens to work with
    const availableQueens = [...remainingQueens];
    
    // Randomly select two captains based on their leadership qualities (star power + confidence)
    availableQueens.sort((a, b) => {
      const aScore = a.starPower + a.conflictResilience;
      const bScore = b.starPower + b.conflictResilience;
      return (bScore - aScore) + (Math.random() * 4 - 2); // Add some randomness
    });
    
    const captains = [availableQueens[0].name, availableQueens[1].name];
    setGroupCaptains(captains);
    
    // Initialize groups with captains
    const groups: {[group: string]: string[]} = {
      "Group 1": [captains[0]],
      "Group 2": [captains[1]]
    };
    
    // Remove captains from available queens
    const remainingAvailableQueens = availableQueens.filter(
      q => !captains.includes(q.name)
    );
      // Alternate selection based on relationship preferences and congeniality
    let currentCaptain = 0;
    let pickedCaptain = captains[currentCaptain]; // Local tracking variable
    
    while (remainingAvailableQueens.length > 0) {
      const captain = captains[currentCaptain];
      const captainQueen = availableQueens.find(q => q.name === captain)!;
      
      // Find relationships if they exist
      const captainRelationships = relationships[captain] || {};
      
      // Score remaining queens based on relationships and stats
      const scoredQueens = remainingAvailableQueens.map(queen => {
        let score = 0;
          // Relationship score
        if (captainRelationships[queen.name]) {
          const rel = captainRelationships[queen.name];
          if (rel.type === "alliance" || rel.type === "friendship") {
            score += rel.strength * 2; // Strong preference for allies and friends
          } else if (rel.type === "rivalry" || rel.type === "conflict") {
            score -= rel.strength * 2; // Strong avoidance for rivals and conflicts
          }
        }
        
        // Similar congeniality & loyalty preferences
        score += 10 - Math.abs(captainQueen.congeniality - queen.congeniality);
        score += 10 - Math.abs(captainQueen.loyalty - queen.congeniality);
        
        // Value performance abilities
        score += queen.vocalMusicality * 0.5;
        score += queen.lipSyncProwess * 0.5;
        score += queen.starPower * 0.3;
        
        return {queen, score};
      });
      
      // Sort queens by score and pick the top one
      scoredQueens.sort((a, b) => b.score - a.score);
      const selectedQueen = scoredQueens[0].queen;
      
      // Add to appropriate group
      const groupName = currentCaptain === 0 ? "Group 1" : "Group 2";
      groups[groupName].push(selectedQueen.name);
      
      // Remove selected queen from available pool
      const newRemainingQueens = remainingAvailableQueens.filter(
        q => q.name !== selectedQueen.name
      );
        // Update for next iteration
      currentCaptain = (currentCaptain + 1) % 2;
      pickedCaptain = captains[currentCaptain]; // Update local variable
      
      // If we've processed all queens, exit loop
      if (newRemainingQueens.length === 0) break;
      
      // Update the remaining queens
      remainingAvailableQueens.splice(0, remainingAvailableQueens.length, ...newRemainingQueens);
    }
      // Save the final groups
    setGirlGroups(groups);
    
    // Set the current picking captain at the end, after all calculations
    setCurrentPicking(pickedCaptain);
    
    // Update the episode data with the group information
    if (currentEpisode) {
      const updatedEpisode = {
        ...currentEpisode,
        groups: groups
      };
      setCurrentEpisode(updatedEpisode);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "intro":
        return (
          <Card className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Episode {episodeNumber}</CardTitle>
              <CardDescription className="text-pink-100 text-lg">
                "Gentlemen, start your engines, and may the best drag queen win!"
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 relative">
                  <Crown className="w-16 h-16 text-yellow-300 absolute inset-0 animate-pulse-slow" />
                  <Crown className="w-16 h-16 text-yellow-400 absolute inset-0 opacity-50" style={{ filter: 'blur(4px)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2">Today's Challenge:</h2>
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg mb-3 shadow-lg card-gradient-hover">
                  <p className="text-lg font-bold">{currentEpisode?.challenge}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <p className="text-pink-100 text-sm">
                    {challengeDescriptions[currentEpisode?.challenge as keyof typeof challengeDescriptions] ||
                      "A unique challenge that will test your drag skills and creativity."}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {remainingQueens.map((queen) => (
                  <div key={queen.id} className="text-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white mx-auto mb-2">
                      <img
                        src={
                          queen.imageUrl ||
                          `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(queen.name?.charAt(0) || "Q")}`
                        }
                        alt={queen.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium">{queen.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "girl-groups-team-selection":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-6 h-6 text-pink-500" />
                Girl Groups Team Selection
              </CardTitle>
              <CardDescription>"Time to split into teams for the Girl Groups challenge!"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <p className="text-lg">"For this challenge, you will be split into two groups to create, choreograph, and perform your own verses for a brand new song!"</p>
                  <p className="text-sm text-gray-600 mt-2">The team captains will take turns selecting their members.</p>
                </div>
                
                {/* Team captains section */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Team Captains</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {groupCaptains.map((captainName, index) => {
                      const captain = remainingQueens.find(q => q.name === captainName);
                      return (
                        <div key={captainName} className={`text-center p-3 rounded-lg ${currentPicking === captainName ? 'bg-pink-100 border border-pink-300' : 'bg-white border'}`}>
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-pink-400 mx-auto mb-2">
                            <img
                              src={captain?.imageUrl || `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(captainName?.charAt(0) || "Q")}`}
                              alt={captainName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="font-medium">{captainName}</p>
                          <p className="text-sm text-gray-600">Team {index + 1} Captain</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Team formations section */}
                <div className="grid grid-cols-2 gap-6">
                  {Object.entries(girlGroups).map(([groupName, members], groupIndex) => (
                    <div key={groupName} className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-3 text-center">{groupName}</h3>
                      <div className="space-y-2">
                        {members.map((memberName, index) => {
                          const member = remainingQueens.find(q => q.name === memberName);
                          const isCaptain = groupCaptains[groupIndex] === memberName;
                          
                          return (
                            <div key={memberName} className={`flex items-center gap-3 p-2 ${isCaptain ? 'bg-pink-50' : 'bg-white'} border rounded-lg`}>
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                                <img
                                  src={member?.imageUrl || `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(memberName?.charAt(0) || "Q")}`}
                                  alt={memberName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{memberName}</p>
                                {isCaptain && <p className="text-xs text-pink-600">Captain</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "girl-groups-performance":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-6 h-6 text-purple-500" />
                Girl Groups Performance
              </CardTitle>
              <CardDescription>"It's time to see how the groups performed in their challenge!"</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(girlGroups).map(([groupName, members]) => {
                  // Calculate average score for this group
                  const groupScores = members.map(member => currentEpisode?.challengeScores?.[member] || 0);
                  const avgScore = groupScores.reduce((sum, score) => sum + score, 0) / groupScores.length;
                  
                  // Determine performance quality based on average score
                  let performanceQuality = "poor";
                  if (avgScore >= 8) performanceQuality = "excellent";
                  else if (avgScore >= 6.5) performanceQuality = "good";
                  else if (avgScore >= 5) performanceQuality = "mixed";
                  
                  const performanceComments = {
                    excellent: "delivered a showstopping performance with tight choreography, memorable lyrics, and great group cohesion.",
                    good: "put on a solid performance with good energy and some standout moments.",
                    mixed: "had some highlights but struggled with consistency and group chemistry.",
                    poor: "faced significant challenges with timing, coordination, and overall execution."
                  };
                  
                  return (
                    <div key={groupName} className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-xl font-medium mb-3">{groupName} Performance</h3>
                      <p className="mb-4 text-gray-700">
                        {groupName} {performanceComments[performanceQuality as keyof typeof performanceComments]}
                      </p>
                      
                      <h4 className="font-medium mb-2 text-gray-800">Individual Performances</h4>
                      <div className="space-y-3">
                        {members.map(memberName => {
                          const member = remainingQueens.find(q => q.name === memberName);
                          const score = currentEpisode?.challengeScores?.[memberName] || 0;
                          
                          // Generate comment based on individual score
                          let comment = "";
                          if (score >= 8.5) comment = "absolutely slayed their verse and choreography, commanding the stage with star power.";
                          else if (score >= 7) comment = "performed well with strong vocals and solid stage presence.";
                          else if (score >= 6) comment = "delivered a decent performance but lacked some polish or energy.";
                          else comment = "struggled to keep up with choreography and had issues with their verse delivery.";
                          
                          return (
                            <div key={memberName} className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                                <img
                                  src={member?.imageUrl || `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(memberName.charAt(0))}`}
                                  alt={memberName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-medium">{memberName}</p>
                                <p className="text-sm text-gray-600">{memberName} {comment}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )

      case "challenge-performance":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Challenge Performance
              </CardTitle>
              <CardDescription>"Let's see how our queens tackled today's challenge..."</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {remainingQueens.map((queen) => (
                  <div key={queen.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={
                          queen.imageUrl ||
                          `/placeholder.svg?height=48&width=48&text=${encodeURIComponent(queen.name?.charAt(0) || "Q")}`
                        }
                        alt={queen.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{queen.name}</p>
                      <p className="text-sm text-gray-600">
                        {getQueenChallengeComment(queen, currentEpisode)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "runway-performance":
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-purple-500" />
                Runway Presentation
              </CardTitle>
              <CardDescription>"Now let's see how they served it on the runway..."</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {remainingQueens.map((queen) => (
                  <div key={queen.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200">
                      <img
                        src={
                          queen.imageUrl ||
                          `/placeholder.svg?height=48&width=48&text=${encodeURIComponent(queen.name?.charAt(0) || "Q")}`
                        }
                        alt={queen.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{queen.name}</p>
                      <p className="text-sm text-gray-600">
                        {getQueenRunwayComment(queen, currentEpisode)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case "deliberation":
        // Combine tops and bottoms into one shuffled array
        // Include top2 if mode is legacy format, but not if normal mode
        const potentialTops = [...(currentEpisode?.high || [])]

        if (seasonFormat === "legacy") {
          potentialTops.push(...(currentEpisode?.top2 || []))
        } else if (seasonFormat === "regular") {
          potentialTops.push(currentEpisode?.winner || ""); // Include winner only if not legacy format
        }
        
        const potentialBottoms = [currentEpisode?.low, ...(currentEpisode?.bottom2 || [])]
        const allCritiqued = [...potentialTops, ...potentialBottoms].sort(() => Math.random() - 0.5)

        return (
          <Card className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Judges' Deliberation</CardTitle>
              <CardDescription className="text-gray-300">"The judges have made their decisions..."</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <p className="text-lg mb-4">
                  "Based on tonight's challenge and runway presentation, these queens will receive critiques:"
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {allCritiqued.map((queenName) => {
                    const queen = remainingQueens.find((q) => q.name === queenName)
                    return (
                      <div key={queenName} className="text-center">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-400 mx-auto mb-2">
                          <img
                            src={
                              queen?.imageUrl ||
                              `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(
                                queenName?.charAt(0) || "Q",
                              )}`
                            }
                            alt={queenName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="font-medium">{queenName}</p>
                        <p className="text-gray-400 text-sm">Up for critique</p>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-6 bg-white/10 rounded-lg p-4">
                  <p className="text-sm text-gray-300">
                    The remaining queens performed well enough to be safe from critique this week.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case "winner-announcement":
        const winner = remainingQueens.find((q) => q.name === currentEpisode?.winner)
        return (
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Challenge Winner</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mx-auto mb-4">
                  <img
                    src={
                      winner?.imageUrl ||
                      `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(currentEpisode?.winner?.charAt(0) || "Q")}`
                    }
                    alt={currentEpisode?.winner}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2">{currentEpisode?.winner}</h2>
                <p className="text-yellow-100 text-lg">
                  "Condragulations! You are the winner of this week's challenge!"
                </p>
              </div>
              <div className="bg-white/20 rounded-lg p-4">
                <p className="text-sm">"You've shown excellence in both the challenge and on the runway. Well done!"</p>
              </div>
            </CardContent>
          </Card>
        )

      case "bottom-announcement":
        return (
          <Card className="bg-gradient-to-r from-red-500 to-red-700 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Bottom Queens</CardTitle>
              <CardDescription className="text-red-100">
                "I'm sorry my dears, but you are the bottom queens of the week."
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...shuffleArray([currentEpisode?.low, ...(currentEpisode?.bottom2 || [])])].map((queenName) => {
                  const queen = remainingQueens.find((q) => q.name === queenName)
                  return (
                    <div key={queenName} className="text-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white mx-auto mb-2">
                        <img
                          src={
                            queen?.imageUrl ||
                            `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                          }
                          alt={queenName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-medium">{queenName}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )

      case "safe-announcement":
        const safeQueen = remainingQueens.find((q) => q.name === currentEpisode?.low)
        return (
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">You Are Safe</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white mx-auto mb-4">
                <img
                  src={
                    safeQueen?.imageUrl ||
                    `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(currentEpisode?.low?.charAt(0) || "Q")}`
                  }
                  alt={currentEpisode?.low}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold mb-2">{currentEpisode?.low}</h2>
              <p className="text-orange-100">
                "You are safe, but you need to step up your game. You may step to the back of the stage."
              </p>
            </CardContent>
          </Card>
        )

      case "lipsync":
        // Find the full song details if available from the selected song
        const songInfo = songs.find(song => {
          // Extract just the title and artist parts from the lip sync song string
          const lipSyncTitle = currentEpisode?.lipSyncSong.split(" by ")[0]?.trim();
          const lipSyncArtist = currentEpisode?.lipSyncSong.split(" by ")[1]?.trim();
          
          return song.title === lipSyncTitle && song.artist === lipSyncArtist;
        });
        
        return (
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Lip Sync For Your Life</CardTitle>
              <CardDescription className="text-purple-100">
                "Two queens stand before me. This is your last chance to impress me and save yourself from elimination."
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                {songInfo?.album_image ? (
                  <div className="w-24 h-24 mx-auto mb-4 rounded overflow-hidden border-2 border-pink-300 shadow-glow p-1 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                    <img 
                      src={songInfo.album_image} 
                      alt={`${songInfo.title} album art`} 
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ) : (
                  <Music className="w-12 h-12 mx-auto mb-4 text-pink-200" />
                )}
                <p className="text-lg font-bold mb-2">Tonight's Lip Sync Song:</p>
                <p className="text-xl">{currentEpisode?.lipSyncSong}</p>
                
                {/* Spotify preview player if available */}
                {songInfo?.preview_url && (
                  <div className="mt-4 mx-auto max-w-[300px]">
                    <div className="bg-white/20 rounded-full p-2">
                      <audio 
                        src={songInfo.preview_url} 
                        controls 
                        className="w-full h-8"
                        autoPlay={false}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentSpotifySong({
                          title: songInfo.title,
                          artist: songInfo.artist,
                          album_image: songInfo.album_image,
                          preview_url: songInfo.preview_url
                        });
                        setShowFloatingPlayer(true);
                        setIsPlayerMinimized(false);
                      }}
                      className="mt-2 text-xs text-pink-200 hover:text-white transition-colors w-full text-center"
                    >
                      Keep playing in floating player
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-6">
                {currentEpisode?.bottom2.map((queenName) => {
                  const queen = remainingQueens.find((q) => q.name === queenName)
                  return (
                    <div key={queenName} className="text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white mx-auto mb-3">
                        <img
                          src={
                            queen?.imageUrl ||
                            `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                          }
                          alt={queenName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-bold text-lg">{queenName}</p>
                      <p className="text-purple-100 text-sm">Fighting for their life</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>          </Card>
        );      case "top-two-announcement":
        if (!currentEpisode) return null;
        return (
          <Card className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-gold-600 text-white shadow-2xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Crown className="w-8 h-8 text-yellow-200" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Top Two of the Week</CardTitle>
              <CardDescription className="text-yellow-100 text-lg font-medium">
                "Condragulations! You are the top two queens of the week!"
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Show high queens first */}
              {currentEpisode.high && currentEpisode.high.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4 mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-yellow-200">High Performers</h3>
                  <div className="flex justify-center gap-4">
                    {currentEpisode.high.map((queenName) => {
                      const queen = remainingQueens.find((q) => q.name === queenName);
                      return (
                        <div key={queenName} className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-200 mb-2">
                            <img
                              src={
                                queen?.imageUrl ||
                                `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                              }
                              alt={queenName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-sm font-medium">{queenName}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Top 2 Queens */}
              <div className="grid grid-cols-2 gap-8 my-8">
                {currentEpisode.top2?.map((queenName, index) => {
                  const queen = remainingQueens.find((q) => q.name === queenName);
                  return (
                    <div key={queenName} className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto mb-4">
                          <img
                            src={
                              queen?.imageUrl ||
                              `/placeholder.svg?height=112&width=112&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                            }
                            alt={queenName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold mb-3">{queenName}</h2>
      
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );      case "legacy-lipsync":
        if (!currentEpisode) return null;
        // Find the full song details if available
        const legacySongInfo = songs.find(song => {
          const lipSyncTitle = currentEpisode?.lipSyncSong.split(" by ")[0]?.trim();
          const lipSyncArtist = currentEpisode?.lipSyncSong.split(" by ")[1]?.trim();
          return song.title === lipSyncTitle && song.artist === lipSyncArtist;
        });
        
        return (
          <Card className="bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Music className="w-8 h-8 text-pink-200" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">Lip Sync For Your Legacy</CardTitle>
              <CardDescription className="text-purple-100 text-lg font-medium">
                "Two queens stand before me. This is your chance to impress me and earn the power of elimination."
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Song Information */}
              <div className="text-center bg-white/10 rounded-xl p-6">
                {legacySongInfo?.album_image ? (
                  <div className="w-28 h-28 mx-auto mb-4 rounded-lg overflow-hidden border-4 border-pink-300 shadow-2xl">
                    <img 
                      src={legacySongInfo.album_image} 
                      alt={`${legacySongInfo.title} album art`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <Music className="w-16 h-16 mx-auto mb-4 text-pink-200" />
                )}
                <p className="text-xl font-bold mb-2 text-pink-200">Tonight's Lip Sync Song:</p>
                <p className="text-2xl font-bold">{currentEpisode?.lipSyncSong}</p>
                
                {/* Spotify preview player if available */}
                {legacySongInfo?.preview_url && (
                  <div className="mt-6 mx-auto max-w-[350px]">
                    <div className="bg-white/20 rounded-full p-3">
                      <audio 
                        src={legacySongInfo.preview_url} 
                        controls 
                        className="w-full h-8"
                        autoPlay={false}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentSpotifySong({
                          title: legacySongInfo.title,
                          artist: legacySongInfo.artist,
                          album_image: legacySongInfo.album_image,
                          preview_url: legacySongInfo.preview_url
                        });
                        setShowFloatingPlayer(true);
                        setIsPlayerMinimized(false);
                      }}
                      className="mt-3 text-sm text-pink-200 hover:text-white transition-colors w-full text-center bg-white/10 rounded-lg py-2"
                    >
                      🎵 Keep playing in floating player
                    </button>
                  </div>
                )}
              </div>
              
              {/* Lip Sync Battle */}
              <div className="grid grid-cols-2 gap-8">
                {currentEpisode?.top2?.map((queenName, index) => {
                  const queen = remainingQueens.find((q) => q.name === queenName);
                  const isWinner = queenName === currentEpisode.winner;
                  return (
                    <div key={queenName} className={`text-center p-6 rounded-xl border-2 ${isWinner ? 'border-yellow-400 bg-yellow-500/20' : 'border-white/30 bg-white/10'} transition-all duration-300`}>
                      <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mx-auto shadow-lg">
                          <img
                            src={
                              queen?.imageUrl ||
                              `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                            }
                            alt={queenName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {isWinner && (
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center">
                            <Crown className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      
                      <p className="font-bold text-xl mb-3">{queenName}</p>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-pink-100 leading-relaxed">
                          {isWinner ? 
                            `Delivers an unforgettable performance, commanding the stage with precision, passion, and undeniable charisma.` :
                            `Gives a strong performance but struggles to fully capture the essence and energy of the song.`}
                        </p>
                      </div>
                      
                      {isWinner && (
                        <div className="space-y-2">
                          <Badge className="bg-yellow-400 text-black font-bold px-3 py-1">WINNER</Badge>
                          <p className="text-sm text-yellow-200">💰 Wins $10,000 + Elimination Power</p>
                        </div>
                      )}
                      
                      {!isWinner && (
                        <Badge className="bg-gray-400 text-white font-bold px-3 py-1">TOP2</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Winner Announcement */}
              <div className="text-center bg-gradient-to-r from-yellow-500/30 to-gold-500/30 rounded-xl p-6 border border-yellow-400/50">
                <div className="flex items-center justify-center mb-3">
                  <Crown className="w-6 h-6 mr-2 text-yellow-400" />
                  <p className="text-2xl font-bold text-yellow-200">
                    {currentEpisode.winner}, you're a winner baby!
                  </p>
                </div>
                <p className="text-lg text-yellow-100">
                  With great power comes great responsibility...
                </p>
              </div>
            
            </CardContent>
          </Card>
        );case "lipstick-selection":
        if (!currentEpisode) return null;
        
        // Check if decision was based primarily on track record or relationships
        const decisionCriteria = () => {
          const eliminatedQueen = currentEpisode.eliminated;
          const bottomQueens = currentEpisode.bottom2 || [];
          
          // Check if there are any relationships between winner and bottom queens
          const winnerRelationships = relationships[currentEpisode.winner] || {};
            // Check for negative relationships (rivalry/conflict) with eliminated queen
          const hasNegativeRelationship = winnerRelationships[eliminatedQueen]?.type === 'rivalry' || 
                                         winnerRelationships[eliminatedQueen]?.type === 'conflict';
          
          // Check for positive relationships (alliance/friendship) with saved queen
          const savedQueen = bottomQueens.find(queen => queen !== eliminatedQueen);
          const hasPositiveRelationship = savedQueen && 
                                        (winnerRelationships[savedQueen]?.type === 'alliance' || 
                                         winnerRelationships[savedQueen]?.type === 'friendship');
          
          // If there's a strong relationship influence, return "relationship-based"
          if (hasNegativeRelationship || hasPositiveRelationship) {
            return "relationship-based";
          }
          
          // Otherwise, assume it was based on challenge performance
          return "track-record-based";
        };
        
        const decision = decisionCriteria();
        const eliminatedQueen = remainingQueens.find(q => q.name === currentEpisode.eliminated);
        const winnerQueen = remainingQueens.find(q => q.name === currentEpisode.winner);
        const loserQueen = remainingQueens.find(q => q.name === currentEpisode.top2?.find(queen => queen !== currentEpisode.winner));
        const savedQueen = remainingQueens.find(q => q.name === currentEpisode.bottom2?.find(queen => queen !== currentEpisode.eliminated));
        
        return (
          <Card className="bg-gradient-to-br from-red-700 via-purple-800 to-black text-white shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/30 rounded-full flex items-center justify-center">
                  <X className="w-8 h-8 text-red-300" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold">The Elimination Decision</CardTitle>
              <CardDescription className="text-pink-100 text-lg">
                "The time has come for you to reveal which queen you have chosen to eliminate..."
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              
              {/* Winner Section */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-gold-500/20 rounded-xl p-6 mb-8">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-yellow-400 mx-auto mb-4 shadow-lg">
                  <img
                    src={
                      winnerQueen?.imageUrl ||
                      `/placeholder.svg?height=128&width=128&text=${encodeURIComponent(currentEpisode.winner?.charAt(0) || "Q")}`
                    }
                    alt={currentEpisode.winner}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xl font-medium mb-3 text-yellow-200">
                  "{currentEpisode.winner}, with great power comes great responsibility."
                </div>
                <div className="text-lg text-yellow-100 mb-4">
                  "Which queen have you chosen to eliminate?"
                </div>
                
                {/* Decision Criteria Indicator */}
                <Badge className={`text-white text-sm ${decision === "relationship-based" ? "bg-pink-600" : "bg-blue-600"}`}>
                  {decision === "relationship-based" 
                    ? "🤝 Decision influenced by relationships" 
                    : "📊 Decision based on challenge performance"}
                </Badge>
              </div>
              
              {/* Elimination Reveal */}
              <div className="bg-gradient-to-r from-red-600/30 to-red-800/30 rounded-xl p-8 border border-red-500/50">
                <div className="text-2xl font-bold mb-4 text-red-300">
                  "I've chosen to eliminate..."
                </div>
                
                {/* Eliminated Queen */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-400 mb-4 shadow-lg grayscale">
                    <img
                      src={
                        eliminatedQueen?.imageUrl ||
                        `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(currentEpisode.eliminated?.charAt(0) || "Q")}`
                      }
                      alt={currentEpisode.eliminated}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-4xl font-bold text-red-400 mb-2">
                    {currentEpisode.eliminated}
                  </div>
                  <Badge className="bg-red-600 text-white">ELIMINATED</Badge>
                </div>
              </div>
              
              {/* Show what the other queen would have chosen */}
              {currentEpisode.loserWouldHaveChosen && loserQueen && (
                <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-lg font-semibold mb-4 text-purple-200">Alternative Choice</h3>
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40">
                      <img
                        src={
                          loserQueen?.imageUrl ||
                          `/placeholder.svg?height=48&width=48&text=${encodeURIComponent(loserQueen?.name?.charAt(0) || "Q")}`
                        }
                        alt={loserQueen?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-lg italic text-purple-100">
                        "{currentEpisode.loserWouldHaveChosen === currentEpisode.eliminated 
                          ? `I would have chosen the same queen.`
                          : `I would have chosen ${currentEpisode.loserWouldHaveChosen}.`}" 
                      </p>
                      <p className="text-sm text-purple-300 mt-1">- {loserQueen?.name}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show saved queen */}
              {savedQueen && (
                <div className="bg-green-600/20 rounded-xl p-4 border border-green-500/30">
                  <h3 className="text-lg font-semibold mb-3 text-green-200">Safe This Week</h3>
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-green-400">
                      <img
                        src={
                          savedQueen?.imageUrl ||
                          `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(savedQueen?.name?.charAt(0) || "Q")}`
                        }
                        alt={savedQueen?.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-green-100">{savedQueen?.name}</p>
                      <Badge className="bg-green-600 text-white">SAVED</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
        
      case "relationships-update":
        return (
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Relationships in the Werk Room</CardTitle>
              <CardDescription className="text-purple-100">
                "After this episode's drama, the queens' relationships have evolved..."
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newRelationships.length > 0 ? (
                <div className="space-y-4">
                  {newRelationships.map((rel, index) => {
                    const queen1 = remainingQueens.find(q => q.name === rel.queen1);
                    const queen2 = remainingQueens.find(q => q.name === rel.queen2);                    const relationshipColor = 
                      rel.type === "alliance" ? "bg-green-500" : 
                      (rel.type === "rivalry" || rel.type === "conflict") ? "bg-red-500" : 
                      "bg-blue-500";
                    
                    return (
                      <div key={index} className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                              <img
                                src={
                                  queen1?.imageUrl ||
                                  `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(
                                    rel.queen1.charAt(0),
                                  )}`
                                }
                                alt={rel.queen1}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white -ml-2">
                              <img
                                src={
                                  queen2?.imageUrl ||
                                  `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(
                                    rel.queen2.charAt(0),
                                  )}`
                                }
                                alt={rel.queen2}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          
                          <div className="flex-1">                            <p className="font-medium">
                              <span className="font-bold">{rel.queen1}</span> and <span className="font-bold">{rel.queen2}</span> have formed a {" "}
                              <Badge className={`${relationshipColor}`}>
                                {rel.type === "alliance" ? "friendship" : (rel.type === "rivalry" || rel.type === "conflict") ? "rivalry" : "connection"}
                              </Badge>
                            </p>
                            <p className="text-sm text-purple-100 mt-1">
                              {rel.type === "alliance" 
                                ? "They seem to have bonded in the Werk Room and might support each other going forward." 
                                : (rel.type === "rivalry" || rel.type === "conflict")
                                ? "There's some tension between them that could lead to drama in future episodes."
                                : "They've been getting to know each other better after this week's challenge."}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center bg-white/10 p-4 rounded-lg">
                  <p>No new significant relationships formed this episode.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case "episode-complete":
        // Calculate combined scores for final ranking (only show in summary)
        const combinedScores = Object.entries(currentEpisode?.challengeScores || {})
          .map(([queenName, challengeScore]) => ({
            queenName,
            combinedScore: challengeScore * 0.7 + (currentEpisode?.runwayScores?.[queenName] ?? 0) * 0.3,
            challengeScore,
            runwayScore: currentEpisode?.runwayScores?.[queenName],
          }))
          .sort((a, b) => b.combinedScore - a.combinedScore)

        const queensAfterElimination = remainingQueens.filter((q) => q.name !== currentEpisode?.eliminated)

        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Episode {episodeNumber} Complete</CardTitle>
                <CardDescription className="text-center">
                  {queensAfterElimination.length === 4
                    ? "🏆 FINAL FOUR! Ready for the finale!"
                    : queensAfterElimination.length > 4
                      ? `${queensAfterElimination.length} queens remain in the competition`
                      : "Season complete!"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Episode Summary with Scores */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Episode Summary</h3>

                  {/* Episode Placements */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Episode Placements</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(currentEpisode?.details?.placements || {}).map(([queenName, placement]) => {
                        const queen = remainingQueens.find((q) => q.name === queenName)
                        return (
                          <div key={queenName} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                              <img
                                src={
                                  queen?.imageUrl ||
                                  `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                                }
                                alt={queenName}
                                className="w-full h-full object-cover"
                              />
                            </div>                            <div className="flex-1">
                              <p className="font-medium">{queenName}</p>
                              <Badge className={`text-sm ${getPlacementColor(placement)}`}>
                                {placement as string}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Expandable Challenge Scores */}
                  <details className="mb-4">
                    <summary className="cursor-pointer font-medium mb-2 hover:text-purple-600">
                      📊 Challenge Scores (Click to expand)
                    </summary>
                    <div className="space-y-2 ml-4">
                      {combinedScores.map(({ queenName, challengeScore }) => {
                        const queen = remainingQueens.find((q) => q.name === queenName)
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
                            <span className="flex-1">{queenName}</span>
                            <Badge variant="outline">{challengeScore.toFixed(1)}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </details>

                  {/* Expandable Runway Scores */}
                  <details className="mb-4">
                    <summary className="cursor-pointer font-medium mb-2 hover:text-purple-600">
                      ✨ Runway Scores (Click to expand)
                    </summary>
                    <div className="space-y-2 ml-4">
                      {combinedScores.map(({ queenName, runwayScore }) => {
                        const queen = remainingQueens.find((q) => q.name === queenName)
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
                            <span className="flex-1">{queenName}</span>
                            <Badge variant="outline">{runwayScore?.toFixed(1)}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                </div>

                {/* Remaining Queens */}
                <div className="text-center mb-6">
                  <h4 className="font-medium mb-3">
                    {queensAfterElimination.length === 4 ? "FINAL FOUR" : "Remaining Queens"}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {queensAfterElimination.map((queen) => (
                      <div key={queen.id} className="text-center">
                        <div
                          className={`w-16 h-16 rounded-full overflow-hidden border-2 ${queensAfterElimination.length === 4 ? "border-yellow-400" : "border-gray-200"} mx-auto mb-2`}
                        >
                          <img
                            src={
                              queen.imageUrl ||
                              `/placeholder.svg?height=64&width=64&text=${encodeURIComponent(queen.name?.charAt(0) || "Q")}`
                            }
                            alt={queen.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm font-medium">{queen.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BUTTONS SECTION - ALWAYS VISIBLE */}
                <div className="flex flex-col gap-4 items-center">
                  <div className="flex gap-4 justify-center">
                    {currentEpisode && <EpisodeDetails episode={currentEpisode} />}
                  </div>

                  {/* FINALE BUTTON - LARGE AND PROMINENT */}
                  {queensAfterElimination.length === 4 && (
                    <div className="w-full text-center">
                      <Button
                        onClick={nextStep}
                        size="lg"
                        className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold text-xl px-8 py-4 h-auto"
                      >
                        <Crown className="w-6 h-6 mr-3" />
                        START THE FINALE!
                        <Crown className="w-6 h-6 ml-3" />
                      </Button>
                      <p className="text-sm text-gray-600 mt-2">The final four will compete for the crown!</p>
                    </div>
                  )}

                  {/* CONTINUE BUTTON */}
                  {queensAfterElimination.length > 4 && (
                    <div className="w-full text-center">
                      <Button
                        onClick={nextStep}
                        variant="default"
                        className="bg-pink-500 hover:bg-pink-600"
                      >
                        Continue to Episode {episodeNumber + 1}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Track Record Table */}
            <TrackRecordTable
              queens={queens}
              episodes={[...allEpisodes, currentEpisode]}
              currentEpisode={episodeNumber}
            />
          </div>
        )

      case "finale-intro":
        return (
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">🏆 FINALE EPISODE 🏆</CardTitle>
              <CardDescription className="text-yellow-100 text-xl">
                "Four queens stand before me. This is your final chance to impress me and earn the crown!"
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <Crown className="w-20 h-20 mx-auto mb-4 text-yellow-200" />
                <h2 className="text-2xl font-bold mb-4">The Final Four</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {remainingQueens.map((queen) => (
                    <div key={queen.id} className="text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-yellow-200 mx-auto mb-3">
                        <img
                          src={
                            queen.imageUrl ||
                            `/placeholder.svg?height=80&width=80&text=${encodeURIComponent(queen.name?.charAt(0) || "Q")}`
                          }
                          alt={queen.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-bold text-lg">{queen.name}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <p className="text-lg mb-4">
                  "Tonight, you will compete in three lip sync battles. Two semi-final battles will determine our top 2,
                  and then those two queens will battle for the crown in the ultimate lip sync for your life!"
                </p>
                <p className="text-yellow-100">"The time has come... for you to lip sync... FOR THE CROWN!"</p>
              </div>
            </CardContent>
          </Card>
        )

      case "finale-first-pair":
        return (
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">First Semi-Final Battle</CardTitle>
              <CardDescription className="text-pink-100">"The first two queens to compete are..."</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <Music className="w-12 h-12 mx-auto mb-4 text-pink-200" />
                <p className="text-lg font-bold mb-2">Lip Sync Song:</p>
                <p className="text-xl mb-6">{finaleSongs[0]}</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {finaleFirstPair.map((queenName) => {
                  const queen = remainingQueens.find((q) => q.name === queenName)
                  const winCount = getQueenWinCount(queenName)
                  return (
                    <div key={queenName} className="text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mx-auto mb-4 relative">
                        <img
                          src={
                            queen?.imageUrl ||
                            `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                          }
                          alt={queenName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-bold text-xl">{queenName}</p>
                      <p className="text-purple-100">
                        Fighting for the crown
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )

      case "finale-first-lipsync":
        // Find the full song details if available
        const firstSongInfo = songs.find(song => {
          const lipSyncTitle = finaleSongs[0]?.split(" by ")[0]?.trim();
          const lipSyncArtist = finaleSongs[0]?.split(" by ")[1]?.trim();
          return song.title === lipSyncTitle && song.artist === lipSyncArtist;
        });
        
        return (
          <Card className="bg-gradient-to-r from-gray-800 to-purple-900 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">The Battle Begins!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                {firstSongInfo?.album_image ? (
                  <div className="w-24 h-24 mx-auto mb-4 rounded overflow-hidden border-2 border-pink-300 shadow-glow p-1 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                    <img 
                      src={firstSongInfo.album_image} 
                      alt={`${firstSongInfo.title} album art`} 
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                ) : (
                  <Music className="w-16 h-16 mx-auto mb-4 text-purple-300 animate-pulse" />
                )}
                <p className="text-lg mb-4">The queens are giving it their all on stage...</p>
                <p className="text-purple-200">Every move, every emotion, every beat matters!</p>
                
                {/* Spotify preview player if available */}
                {firstSongInfo?.preview_url && (
                  <div className="mt-6 mx-auto max-w-[300px]">
                    <div className="bg-white/20 rounded-full p-2">
                      <audio 
                        src={firstSongInfo.preview_url} 
                        controls 
                        className="w-full h-8"
                        autoPlay={false}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentSpotifySong({
                          title: firstSongInfo.title,
                          artist: firstSongInfo.artist,
                          album_image: firstSongInfo.album_image,
                          preview_url: firstSongInfo.preview_url
                        });
                        setShowFloatingPlayer(true);
                        setIsPlayerMinimized(false);
                      }}
                      className="mt-2 text-xs text-pink-200 hover:text-white transition-colors w-full text-center"
                    >
                      Keep playing in floating player
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm">"This is what we've been waiting for - pure drag excellence!"</p>
              </div>
            </CardContent>
          </Card>
        )

      case "finale-first-result":
        const firstLoser = finaleFirstPair.find((name) => name !== finaleFirstWinner)
        return (
          <Card className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">First Semi-Final Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-300 mx-auto mb-4">
                    <img
                      src={
                        remainingQueens.find((q) => q.name === finaleFirstWinner)?.imageUrl ||
                        `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(finaleFirstWinner?.charAt(0) || "Q")}`
                      }
                      alt={finaleFirstWinner}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-bold text-xl text-green-200">{finaleFirstWinner}</p>
                  <p className="text-green-300">Advances to Final!</p>
                </div>
                <div className="text-center opacity-75">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-400 mx-auto mb-4">
                    <img
                      src={
                        remainingQueens.find((q) => q.name === firstLoser)?.imageUrl ||
                        `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(firstLoser?.charAt(0) || "Q")}`
                      }
                      alt={firstLoser}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-bold text-xl text-gray-300">{firstLoser}</p>
                  <p className="text-gray-400">Eliminated</p>
                </div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-4">
                <p className="text-lg">
                  "{finaleFirstWinner}, you have secured your spot in the final lip sync for the crown!"
                </p>
              </div>
            </CardContent>
          </Card>
        )

      case "finale-second-pair":
        return (
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Second Semi-Final Battle</CardTitle>
              <CardDescription className="text-purple-100">"Now for our second semi-final..."</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <Music className="w-12 h-12 mx-auto mb-4 text-pink-200" />
                <p className="text-lg font-bold mb-2">Lip Sync Song:</p>
                <p className="text-xl mb-6">{finaleSongs[1]}</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                {finaleSecondPair.map((queenName) => {
                  const queen = remainingQueens.find((q) => q.name === queenName)
                  const winCount = getQueenWinCount(queenName)
                  return (
                    <div key={queenName} className="text-center">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white mx-auto mb-4 relative">
                        <img
                          src={
                            queen?.imageUrl ||
                            `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                          }
                          alt={queenName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="font-bold text-xl">{queenName}</p>
                      <p className="text-purple-100">
                        Fighting for the crown
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )

      case "finale-second-lipsync":
        // Find the full song details if available
        const secondSongInfo = songs.find(song => {
          const lipSyncTitle = finaleSongs[1]?.split(" by ")[0]?.trim();
          const lipSyncArtist = finaleSongs[1]?.split(" by ")[1]?.trim();
          return song.title === lipSyncTitle && song.artist === lipSyncArtist;
        });
        
        return (
          <Card className="bg-gradient-to-r from-gray-800 to-purple-900 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">The Second Battle!</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                {secondSongInfo?.album_image ? (
                  <div className="w-24 h-24 mx-auto mb-4 rounded overflow-hidden border-2 border-pink-300 shadow-glow p-1 bg-gradient-to-br from-purple-900/50 to-pink-900/50 relative animate-pulse-slow">
                    <img 
                      src={secondSongInfo.album_image} 
                      alt={`${secondSongInfo.title} album art`} 
                      className="w-full h-full object-cover rounded"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 to-transparent"></div>
                  </div>
                ) : (
                  <Music className="w-16 h-16 mx-auto mb-4 text-purple-300 animate-pulse" />
                )}
                <p className="text-lg mb-4">Another fierce battle is underway...</p>
                <p className="text-purple-200">Who will join {finaleFirstWinner} in the final?</p>
                
                {/* Spotify preview player if available */}
                {secondSongInfo?.preview_url && (
                  <div className="mt-6 mx-auto max-w-[300px]">
                    <div className="bg-white/20 rounded-full p-2">
                      <audio 
                        src={secondSongInfo.preview_url} 
                        controls 
                        className="w-full h-8"
                        autoPlay={false}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentSpotifySong({
                          title: secondSongInfo.title,
                          artist: secondSongInfo.artist,
                          album_image: secondSongInfo.album_image,
                          preview_url: secondSongInfo.preview_url
                        });
                        setShowFloatingPlayer(true);
                        setIsPlayerMinimized(false);
                      }}
                      className="mt-2 text-xs text-pink-200 hover:text-white transition-colors w-full text-center"
                    >
                      Keep playing in floating player
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-sm">"The energy is electric! Both queens are leaving everything on the stage!"</p>
              </div>
            </CardContent>
          </Card>
        )

      case "finale-second-result":
        const secondLoser = finaleSecondPair.find((name) => name !== finaleSecondWinner)
        return (
          <Card className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Second Semi-Final Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8 mb-6">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-300 mx-auto mb-4">
                    <img
                      src={
                        remainingQueens.find((q) => q.name === finaleSecondWinner)?.imageUrl ||
                        `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(finaleSecondWinner?.charAt(0) || "Q")}`
                      }
                      alt={finaleSecondWinner}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-bold text-xl text-green-200">{finaleSecondWinner}</p>
                  <p className="text-green-300">Advances to Final!</p>
                </div>
                <div className="text-center opacity-75">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-400 mx-auto mb-4">
                    <img
                      src={
                        remainingQueens.find((q) => q.name === secondLoser)?.imageUrl ||
                        `/placeholder.svg?height=96&width=96&text=${encodeURIComponent(secondLoser?.charAt(0) || "Q")}`
                      }
                      alt={secondLoser}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-bold text-xl text-gray-300">{secondLoser}</p>
                  <p className="text-gray-400">Eliminated</p>
                </div>
              </div>
              <div className="text-center bg-white/10 rounded-lg p-4">
                <p className="text-lg">
                  "{finaleSecondWinner}, you have secured your spot in the final lip sync for the crown!"
                </p>
                <p className="text-green-200 mt-2">
                  Our final two: {finaleFirstWinner} vs {finaleSecondWinner}
                </p>
              </div>
            </CardContent>
          </Card>
        )

      case "finale-final-lipsync":
        // Find the full song details if available
        const finalSongInfo = songs.find(song => {
          const lipSyncTitle = finaleSongs[2]?.split(" by ")[0]?.trim();
          const lipSyncArtist = finaleSongs[2]?.split(" by ")[1]?.trim();
          return song.title === lipSyncTitle && song.artist === lipSyncArtist;
        });
        
        return (
          <Card className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">🏆 FINAL LIP SYNC FOR THE CROWN 🏆</CardTitle>
              <CardDescription className="text-yellow-100 text-lg">
                "This is it - the moment we've all been waiting for!"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                {finalSongInfo?.album_image ? (
                  <div className="w-32 h-32 mx-auto mb-4 rounded overflow-hidden border-4 border-yellow-200 shadow-glow p-1.5 bg-gradient-to-br from-yellow-900/50 to-amber-900/50 relative">
                    <img 
                      src={finalSongInfo.album_image} 
                      alt={`${finalSongInfo.title} album art`} 
                      className="w-full h-full object-cover rounded"
                    />
                    <Crown className="w-12 h-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 drop-shadow-lg animate-pulse" />
                  </div>
                ) : (
                  <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-200 animate-bounce" />
                )}
                <p className="text-xl font-bold mb-2">Final Song:</p>
                <p className="text-2xl mb-6">{finaleSongs[2]}</p>
                
                {/* Spotify preview player if available */}
                {finalSongInfo?.preview_url && (
                  <div className="mt-4 mx-auto max-w-[300px]">
                    <div className="bg-yellow-600/30 rounded-full p-2 shadow-glow-yellow">
                      <audio 
                        src={finalSongInfo.preview_url} 
                        controls 
                        className="w-full h-8"
                        autoPlay={false}
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setCurrentSpotifySong({
                          title: finalSongInfo.title,
                          artist: finalSongInfo.artist,
                          album_image: finalSongInfo.album_image,
                          preview_url: finalSongInfo.preview_url
                        });
                        setShowFloatingPlayer(true);
                        setIsPlayerMinimized(false);
                      }}
                      className="mt-2 text-xs text-yellow-200 hover:text-white transition-colors w-full text-center"
                    >
                      Keep playing in floating player
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-8 mb-6">
                {[finaleFirstWinner, finaleSecondWinner].map((queenName) => {
                  const queen = remainingQueens.find((q) => q.name === queenName)
                  const winCount = getQueenWinCount(queenName)
                  return (
                    <div key={queenName} className="text-center">
                      <div className="w-28 h-28 rounded-full border-4 border-yellow-200 mx-auto mb-4 relative">
                        <img
                          src={
                            queen?.imageUrl ||
                            `/placeholder.svg?height=112&width=112&text=${encodeURIComponent(queenName?.charAt(0) || "Q")}`
                          }
                          alt={queenName}
                          className="w-full h-full object-cover rounded-full"
                        />
                        {winCount > 0 && (
                          <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full w-10 h-10 flex items-center justify-center border-2 border-white text-white text-xs font-bold z-30 shadow-md">
                            {winCount}
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-2xl">{queenName}</p>
                      <p className="text-yellow-200">
                        {winCount > 0 ? 
                          `${winCount} Challenge ${winCount === 1 ? 'Win' : 'Wins'}` : 
                          'Fighting for the crown'}
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="bg-white/20 rounded-lg p-6">
                <p className="text-lg text-center">
                  "Two queens, one crown. This is the ultimate battle for the title of America's Next Drag Superstar!"
                </p>
                <p className="mt-2 text-center text-yellow-100">
                  "Everything counts in this final performance - your track record, your growth, and especially those challenge wins!"
                </p>
              </div>
            </CardContent>
          </Card>
        )

      case "finale-crowning":
        const runnerUp = [finaleFirstWinner, finaleSecondWinner].find((name) => name !== finalWinner)

        // Get the third and fourth placers
        const thirdPlacer = finaleFirstPair.find((name) => name !== finaleFirstWinner) ?? "Unknown";
        const fourthPlacer = finaleSecondPair.find((name) => name !== finaleSecondWinner) ?? "Unknown";
        
        // Create the finale episode for the complete season record
        const finaleEpisode = {
          episodeNumber: episodeNumber,
          challenge: "Finale",
          winner: finalWinner,
          bottom2: [finaleFirstWinner, finaleSecondWinner],
          lipSyncSong: finaleSongs[2] || "Final Song",          eliminated: "None (Finale)",
          remaining: [finalWinner],
          standings: {
            [finalWinner as string]: 1,
            [runnerUp as string]: 2,
            [thirdPlacer as string]: 3,
            [fourthPlacer as string]: 4
          },
          details: {
            challengeScores: {},
            runwayScores: {},
            riskTaking: {},
            pressureState: {},
            lipSyncScores: {
              [finalWinner as string]: 8.8,
              [runnerUp as string]: 8.7,
              [thirdPlacer as string]: 8.0,
              [fourthPlacer as string]: 7.5
            },
            placements: {
              [finalWinner as string]: "WINNER",
              [runnerUp as string]: "TOP2",
              [thirdPlacer as string]: "3RD",
              [fourthPlacer as string]: "4TH",
            },
          },
        }

        const completeEpisodes = [...allEpisodes, finaleEpisode]
        const getPlacementColorFinale = (place: number) => {
          if (place === 1) return "bg-yellow-500"
          if (place === 2) return "bg-gray-400"
          if (place === 3) return "bg-amber-600"
          return "bg-gray-300"
        }

        return (
          <div className="space-y-6">
            {/* Winner Announcement */}
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg shadow-xl overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/crown-pattern.svg')] opacity-10 mix-blend-overlay"></div>
                    
                    <div className="md:grid md:grid-cols-2 items-center">
                      {/* Left column - Visual elements */}
                      <div className="relative">
                        <div className="aspect-square overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-900/80 to-purple-900/40 p-6">
                          {remainingQueens.find((q) => q.name === finalWinner)?.imageUrl ? (
                            <div className="relative w-full h-full max-w-[300px] max-h-[300px] mx-auto">
                              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 rounded-full animate-spin-slow opacity-70 blur-md"></div>
                              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-yellow-400 rounded-full animate-pulse"></div>
                              <img
                                src={
                                  remainingQueens.find((q) => q.name === finalWinner)?.imageUrl ||
                                  `/placeholder.svg?height=300&width=300&text=${encodeURIComponent(finalWinner?.charAt(0) || "Q")}`
                                }
                                alt={finalWinner}
                                className="w-full h-full object-cover rounded-full border-4 border-white relative z-10"
                              />
                            </div>
                          ) : (
                            <div className="relative w-64 h-64 flex items-center justify-center">
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
                              <Crown key={`winner-crown-${i}`} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <div className="inline-block px-3 py-1 bg-pink-500/20 backdrop-blur-sm rounded-full text-sm font-medium mb-2">
                            Season Winner
                          </div>
                          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-white drop-shadow-sm break-words">
                            {finalWinner}
                          </h1>
                          <div className="flex items-center gap-2 mb-4 text-pink-200">
                            <Crown className="w-5 h-5" />
                            <span className="uppercase tracking-wider text-xs font-bold">America's Next Drag Superstar</span>
                          </div>
                          {getQueenWinCount(finalWinner) > 0 && (
                            <div className="inline-flex items-center px-3 py-1 bg-yellow-500/20 rounded-full text-yellow-200 text-sm font-medium">
                              <Crown className="w-4 h-4 mr-1" />
                              {getQueenWinCount(finalWinner)} Challenge {getQueenWinCount(finalWinner) === 1 ? 'Win' : 'Wins'}
                            </div>
                          )}
                        </div>
                        
                        <div className="relative mb-6 pl-4 border-l-2 border-pink-400">
                          <p className="text-lg italic text-white/90">"Condragulations {finalWinner}! You have shown charisma, uniqueness, nerve, and talent throughout this competition. You are a star!"</p>
                        </div>
                        
                        <Button 
                          className="mt-2 bg-white text-pink-600 hover:bg-white/90 hover:text-pink-700 font-medium"
                          onClick={() => generateConfetti()}
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Celebrate
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>

            {/* Final Four */}
            <Card className="overflow-hidden border-none shadow-lg">
              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-4">
                  {[
                    finalWinner,
                    runnerUp,
                    finaleFirstPair.find((name) => name !== finaleFirstWinner),
                    finaleSecondPair.find((name) => name !== finaleSecondWinner),
                  ].map((queenName, index) => {
                    const queen =
                      remainingQueens.find((q) => q.name === queenName) || queens.find((q) => q.name === queenName);
                    const placementColors = [
                      "from-yellow-500 to-amber-400", // 1st place gradient
                      "from-gray-400 to-gray-300",    // 2nd place gradient
                      "from-amber-700 to-amber-500",  // 3rd place gradient
                      "from-gray-600 to-gray-500"     // 4th place gradient
                    ];
                    
                    return (
                      <div key={queenName} className="relative group">
                        <div className={`h-full p-5 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-purple-50 transition-colors duration-300 border-r border-gray-100 flex flex-col items-center justify-center text-center`}>
                          <div className="mb-3 relative">
                            <div className={`absolute -inset-1 rounded-full bg-gradient-to-br ${placementColors[index]} blur-sm opacity-70`}></div>
                            {queen?.imageUrl ? (
                              <img 
                                src={queen.imageUrl}
                                alt={queenName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white relative z-10"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center relative z-10 border-2 border-white">
                                <span className="text-xl font-bold text-gray-400">{queenName?.charAt(0)}</span>
                              </div>
                            )}
                            {/* Placement number badge */}
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-gradient-to-r from-pink-500 to-purple-500 text-xs font-bold text-white rounded-full w-6 h-6 flex items-center justify-center border border-white">
                              {index + 1}
                            </div>
                            {/* Win count badge */}
                            {queenName && getQueenWinCount(queenName) > 0 && (
                              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white text-white text-xs font-bold z-30 shadow-md">
                                {getQueenWinCount(queenName)}
                              </div>
                            )}
                          </div>
                          <p className="font-medium text-gray-800">{queenName}</p>
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
                  {completeEpisodes.map((episode, index) => (
                    <Card key={`finale-episode-${index}-${episode.episodeNumber}`} className="border-l-4 border-l-purple-500">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Episode {episode.episodeNumber}: {episode.challenge}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-4 h-4 text-yellow-500" />
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
                                {episode.bottom2.map((queen: string) => (
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
                          {episode && <EpisodeDetails episode={episode} />}
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
                  episodes={completeEpisodes}
                  currentEpisode={completeEpisodes.length}
                />
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
                    <div className="text-2xl font-bold text-yellow-500">{completeEpisodes.length}</div>
                    <p className="text-sm text-gray-600">Total Episodes</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">{queens.length}</div>
                    <p className="text-sm text-gray-600">Total Queens</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-pink-500">
                      {completeEpisodes.filter((ep) => ep.challenge !== "Finale").length}
                    </div>
                    <p className="text-sm text-gray-600">Competition Episodes</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">Challenge Winners</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      completeEpisodes.reduce(
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

            <div className="py-8">      
              <div className="text-center py-4">
                <p className="text-lg text-gray-600">"Thank you for an incredible season of drag excellence!"</p>
                <p className="text-sm text-gray-500 mt-2">🏆 Season Complete 🏆</p>
              </div>
            </div>
          </div>
        )
      
      
      default:
        return null
    }
  }
  return (
    <div className="space-y-6">
      {renderStep()}      {currentStep !== "episode-complete" && currentStep !== "finale-crowning" && (
        <div className="flex justify-center items-center mt-8">
          <Button onClick={nextStep} className="px-12 py-3 text-lg w-1/3 mx-auto">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            ) : (
              <>Next</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
