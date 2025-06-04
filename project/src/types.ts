export interface Player {
  id: number;
  life: number;
  name: string;
  isDead?: boolean;
  lastDamagedBy?: number;
  commanderDamage: { [key: number]: number };
  gameSaved?: boolean;
  counters: {
    poison: number;
    experience: number;
    energy: number;
  };
  stats: PlayerStats;
  deckId?: string;
  deckName?: string;
}

export interface HistoryEntry {
  players: Array<Player>;
  currentTurn: number;
  turnCount: number;
}

export interface PlayerStats {
  damageDealt: number;
  commanderDamageDealt: number;
  eliminations: Set<number>;
  turnTimes: number[];
  damageInteractions: Array<{
    targetPlayer: string;
    amount: number;
  }>;
  commanderDamageInteractions: Array<{
    targetPlayer: string;
    amount: number;
  }>;
  eliminationInteractions: Array<{
    eliminatedPlayer: string;
  }>;
  averageTurnTime?: number;
}

export interface GameResult {
  _id?: string;
  date: string | Date;
  winner: string;
  players: string[];
  playerCount: number;
  turnCount: number;
  duration: number;
  activeDuration?: number;
  avgTurnTime: number;
  playgroupName?: string;
  playerStats: PlayerGameStats[];
  playerDecks?: {
    playerId: number;
    playerName: string;
    deckId: string;
    deckName: string;
  }[];
}

export interface PlayerGameStats {
  damageDealt: number;
  commanderDamageDealt: number;
  eliminations: number;
  totalTurnTime: number;
  saltinessRating?: 'notSalty' | 'somewhatSalty' | 'extremelySalty';
  damageInteractions: Array<{
    targetPlayer: string;
    amount: number;
  }>;
  commanderDamageInteractions: Array<{
    targetPlayer: string;
    amount: number;
  }>;
  eliminationInteractions: Array<{
    eliminatedPlayer: string;
  }>;
}

export interface User {
  id: number;
  username: string;
  password?: string;
  gameHistory: GameResult[];
}

export interface Playgroup {
  _id: string;
  name: string;
  members: string[];
  createdBy: {
    _id: string;
    username: string;
  };
  password?: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Deck {
  _id: string;
  name: string;
  commander?: string;
  partnerCommander?: string;
  color?: string;
  winCount: number;
  playCount: number;
  createdAt: string;
  updatedAt: string;
} 