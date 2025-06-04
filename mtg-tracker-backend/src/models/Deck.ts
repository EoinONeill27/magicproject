import mongoose from 'mongoose';

const deckSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  commander: {
    type: String,
    required: false
  },
  partnerCommander: {
    type: String,
    required: false
  },
  color: {
    type: String,
    required: false,
    default: "#6366f1" // Default indigo color
  },
  winCount: {
    type: Number,
    default: 0
  },
  playCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can't have duplicate deck names
deckSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Deck', deckSchema); 