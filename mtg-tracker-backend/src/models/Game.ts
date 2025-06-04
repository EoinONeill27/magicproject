import mongoose from 'mongoose';

// Schema for tracking damage dealt to specific players
const damageInteractionSchema = new mongoose.Schema({
  targetPlayer: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, { _id: false });

// Schema for tracking commander damage dealt to specific players
const commanderDamageInteractionSchema = new mongoose.Schema({
  targetPlayer: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
}, { _id: false });

// Schema for tracking who eliminated whom
const eliminationInteractionSchema = new mongoose.Schema({
  eliminatedPlayer: {
    type: String,
    required: true
  }
}, { _id: false });

const playerStatsSchema = new mongoose.Schema({
  damageDealt: {
    type: Number,
    default: 0
  },
  commanderDamageDealt: {
    type: Number,
    default: 0
  },
  eliminations: {
    type: Number,
    default: 0
  },
  totalTurnTime: {
    type: Number,
    default: 0
  },
  saltinessRating: {
    type: String,
    enum: ['notSalty', 'somewhatSalty', 'extremelySalty'],
    default: null
  },
  // New fields for detailed interactions
  damageInteractions: [damageInteractionSchema],
  commanderDamageInteractions: [commanderDamageInteractionSchema],
  eliminationInteractions: [eliminationInteractionSchema]
}, { _id: false });

// Schema for tracking player deck information
const playerDeckSchema = new mongoose.Schema({
  playerId: {
    type: Number,
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  deckId: {
    type: String,
    required: true
  },
  deckName: {
    type: String,
    required: true
  }
}, { _id: false });

const gameSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  winner: {
    type: String,
    required: true
  },
  players: [{
    type: String,
    required: true
  }],
  playerCount: {
    type: Number,
    required: true
  },
  turnCount: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  activeDuration: {
    type: Number,
    required: false
  },
  avgTurnTime: {
    type: Number,
    default: 0
  },
  playgroupName: {
    type: String,
    required: false
  },
  playerStats: [playerStatsSchema],
  playerDecks: [playerDeckSchema]
});

export default mongoose.model('Game', gameSchema); 