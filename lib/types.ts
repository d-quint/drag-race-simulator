// Shared types that can be used both client-side and server-side

export interface Queen {
  id: string
  name: string
  imageUrl?: string
  // Charisma
  congeniality: number
  loyalty: number
  // Uniqueness
  novelty: number
  conceptualDepth: number
  // Nerve
  riskTolerance: number
  conflictResilience: number
  // Talent
  designVision: number
  comedyChops: number
  lipSyncProwess: number
  runwayPresence: number
  actingAbility: number
  vocalMusicality: number
  // Additional
  versatility: number
  adaptability: number
  starPower: number
}

export interface Song {
  id: string
  title: string
  artist: string
  genre: string
  album_image?: string
  preview_url?: string
  spotify_uri?: string
  hasPreview?: boolean
}

export interface SimulationResult {
  winner: Queen
  topQueens: Queen[]
  episodes: any[]
  finalFour?: Queen[]
  runnerUp?: string
  placements?: {[queenName: string]: string}
}

export interface SimulationSession {
  id: string
  name: string
  timestamp: number
  result: SimulationResult
  queens: Queen[]
  songs: Song[]
}
