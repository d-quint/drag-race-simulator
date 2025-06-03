import { Queen } from "@/lib/types"

// Relationship types
export type RelationshipType = "alliance" | "friendship" | "neutral" | "rivalry" | "conflict"

// Relationship data structure
export interface RelationshipData {
  type: RelationshipType
  strength: number // 1-10 scale
  events?: RelationshipEvent[] // Optional event history
}

// Event that affected a relationship
export interface RelationshipEvent {
  episodeNumber: number
  description: string
  change: number // Positive or negative value
}

// Relationship map - nested structure for queen-to-queen relationships
export type RelationshipMap = {
  [queenName: string]: {
    [otherQueenName: string]: RelationshipData
  }
}

/**
 * Manages the dynamic relationships between queens throughout the competition
 */
export class RelationshipManager {
  relationships: RelationshipMap = {}
  
  constructor(queens: Queen[]) {
    // Initialize neutral relationships between all queens
    for (const queen1 of queens) {
      this.relationships[queen1.name] = {}
      
      for (const queen2 of queens) {
        if (queen1.name !== queen2.name) {
          // Random initial relationships
          const initialStrength = Math.max(1, Math.min(10, 
            Math.floor(Math.random() * 3) + // 0-2 base
            (queen1.congeniality / 4) // 0-2.5 congeniality boost
          ));
          
          let initialType: RelationshipType = "neutral";
          
          // 10% chance of starting friendship for congenial queens
          if (Math.random() < 0.1 * (queen1.congeniality / 10) * (queen2.congeniality / 10)) {
            initialType = "friendship";
          }
          
          // 5% chance of starting rivalry for low congeniality queens  
          if (Math.random() < 0.05 * ((10 - queen1.congeniality) / 10) * ((10 - queen2.congeniality) / 10)) {
            initialType = "rivalry";
          }
          
          this.relationships[queen1.name][queen2.name] = {
            type: initialType,
            strength: initialStrength
          };
        }
      }
    }
  }
  
  /**
   * Get the relationship between two queens
   */
  getRelationship(queen1: string, queen2: string): RelationshipData {
    if (!this.relationships[queen1] || !this.relationships[queen1][queen2]) {
      return { type: "neutral", strength: 1 };
    }
    
    return this.relationships[queen1][queen2];
  }
  
  /**
   * Get all relationships for a specific queen
   */
  getQueenRelationships(queenName: string): {[otherQueenName: string]: RelationshipData} {
    return this.relationships[queenName] || {};
  }
  
  /**
   * Update the relationship between two queens
   */
  updateRelationship(
    queen1: string, 
    queen2: string, 
    changeValue: number, 
    newType?: RelationshipType | null,
    episodeNumber?: number,
    description?: string
  ): void {
    if (!this.relationships[queen1]) {
      this.relationships[queen1] = {};
    }
    
    if (!this.relationships[queen1][queen2]) {
      this.relationships[queen1][queen2] = { type: "neutral", strength: 1 };
    }
    
    const relationship = this.relationships[queen1][queen2];
    
    // Update strength (clamped between 1-10)
    relationship.strength = Math.max(1, Math.min(10, relationship.strength + changeValue));
    
    // Update type if specified
    if (newType) {
      relationship.type = newType;
    } else {
      // Auto-determine type based on strength
      if (relationship.strength >= 8) {
        relationship.type = "alliance";
      } else if (relationship.strength >= 6) {
        relationship.type = "friendship";
      } else if (relationship.strength <= 2) {
        relationship.type = "conflict";
      } else if (relationship.strength <= 4) {
        relationship.type = "rivalry";
      } else {
        relationship.type = "neutral";
      }
    }
    
    // Record the event if episode info provided
    if (episodeNumber !== undefined && description) {
      if (!relationship.events) {
        relationship.events = [];
      }
      
      relationship.events.push({
        episodeNumber,
        description,
        change: changeValue
      });
    }
    
    // Update the relationship in the map
    this.relationships[queen1][queen2] = relationship;
    
    // Also update the reverse relationship (but with half the strength change)
    this.updateReciprocalRelationship(queen2, queen1, changeValue / 2, null, episodeNumber, description);
  }
  
  /**
   * Update the reciprocal relationship (avoiding infinite recursion)
   */
  private updateReciprocalRelationship(
    queen1: string,
    queen2: string,
    changeValue: number,
    newType: RelationshipType | null,
    episodeNumber?: number,
    description?: string
  ): void {
    if (!this.relationships[queen1]) {
      this.relationships[queen1] = {};
    }
    
    if (!this.relationships[queen1][queen2]) {
      this.relationships[queen1][queen2] = { type: "neutral", strength: 1 };
    }
    
    const relationship = this.relationships[queen1][queen2];
    
    // Update strength (clamped between 1-10)
    relationship.strength = Math.max(1, Math.min(10, relationship.strength + changeValue));
    
    // Update type if specified
    if (newType) {
      relationship.type = newType;
    } else {
      // Auto-determine type based on strength
      if (relationship.strength >= 8) {
        relationship.type = "alliance";
      } else if (relationship.strength >= 6) {
        relationship.type = "friendship";
      } else if (relationship.strength <= 2) {
        relationship.type = "conflict";
      } else if (relationship.strength <= 4) {
        relationship.type = "rivalry";
      } else {
        relationship.type = "neutral";
      }
    }
    
    // Record the event if episode info provided
    if (episodeNumber !== undefined && description) {
      if (!relationship.events) {
        relationship.events = [];
      }
      
      relationship.events.push({
        episodeNumber,
        description,
        change: changeValue
      });
    }
    
    // Update the relationship in the map
    this.relationships[queen1][queen2] = relationship;
  }
  
  /**
   * Special method for legacy format: update relationships after lipstick choices
   */
  updateRelationshipsAfterLegacy(
    winner: string,
    loser: string, 
    eliminated: string,
    saved: string,
    loserChoice: string,
    episodeNumber: number,
    queens: Queen[]
  ): void {
    // Find queen objects
    const winnerQueen = queens.find(q => q.name === winner);
    const loserQueen = queens.find(q => q.name === loser);
    
    if (!winnerQueen || !loserQueen) return;
    
    // 1. Winner saves a queen - positive relationship
    this.updateRelationship(
      winner,
      saved,
      15 + (winnerQueen.congeniality / 2),
      "friendship",
      episodeNumber,
      `${winner} saved ${saved} from elimination`
    );
    
    // 2. Potential negative relationship with eliminated queen
    this.updateRelationship(
      winner,
      eliminated,
      -10 - ((10 - winnerQueen.congeniality) / 2),
      null,
      episodeNumber,
      `${winner} eliminated ${eliminated}`
    );
    
    // 3. If loser would have chosen differently, potential strain
    if (loserChoice !== eliminated) {
      // The loser would have sent home someone else - might create tension
      
      // Saved by winner but would be eliminated by loser - potential rivalry
      this.updateRelationship(
        loser,
        saved,
        -8 * ((10 - loserQueen.congeniality) / 10),
        null,
        episodeNumber,
        `${loser} would have eliminated ${saved} instead`
      );
      
      // Loser might be annoyed with winner over disagreement
      if (loserQueen.congeniality < 6) {
        this.updateRelationship(
          loser,
          winner,
          -5 * ((10 - loserQueen.congeniality) / 10),
          null,
          episodeNumber,
          `${loser} disagreed with ${winner}'s elimination choice`
        );
      }
      
      // Loser might have preferred their own choice
      if (loserQueen.conflictResilience > 7) {
        this.updateRelationship(
          loser,
          loserChoice,
          -6,
          null,
          episodeNumber,
          `${loser} would have eliminated ${loserChoice}`
        );
      }
    } else {
      // Loser agreed with winner's choice - potential alliance
      this.updateRelationship(
        loser,
        winner,
        5,
        null,
        episodeNumber,
        `${loser} agreed with ${winner}'s elimination choice`
      );
    }
  }
}
