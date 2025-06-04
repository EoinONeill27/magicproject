import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import Deck from '../models/Deck';
import mongoose from 'mongoose';

// Extended request interface with userId
interface AuthRequest extends ExpressRequest {
  userId?: string;
}

const router = express.Router();

// Create a new deck
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, commander, partnerCommander, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Deck name is required' });
    }

    // Check if the user already has a deck with this name
    const existingDeck = await Deck.findOne({ 
      user: req.userId,
      name
    });

    if (existingDeck) {
      return res.status(400).json({ 
        message: `A deck named "${name}" already exists in your collection. Please choose a different name for your new deck.`,
        code: 'DUPLICATE_DECK_NAME',
        suggestedAction: 'Choose a unique deck name'
      });
    }

    const deck = new Deck({
      user: req.userId,
      name,
      commander,
      partnerCommander,
      color,
      winCount: 0,
      playCount: 0
    });

    await deck.save();
    res.status(201).json(deck);
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all decks for the current user
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.get('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const decks = await Deck.find({ user: req.userId })
      .sort({ updatedAt: -1 });
    
    res.json(decks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific deck
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.get('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deck = await Deck.findOne({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a deck
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.put('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, commander, partnerCommander, color } = req.body;
    
    if (name) {
      // Check if another deck already has this name
      const existingDeck = await Deck.findOne({ 
        user: req.userId,
        name,
        _id: { $ne: req.params.id }
      });

      if (existingDeck) {
        return res.status(400).json({ 
          message: `A deck named "${name}" already exists in your collection. Please choose a different name for this deck.`,
          code: 'DUPLICATE_DECK_NAME',
          suggestedAction: 'Choose a unique deck name'
        });
      }
    }

    const updatedDeck = await Deck.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { 
        name,
        commander,
        partnerCommander,
        color,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedDeck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    res.json(updatedDeck);
  } catch (error) {
    console.error('Error updating deck:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a deck
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.delete('/:id', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deck = await Deck.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Increment win count for a deck
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/:id/win', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deck = await Deck.findOneAndUpdate(
      { _id: req.params.id },
      { $inc: { winCount: 1, playCount: 1 }, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    console.error('Error incrementing win count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Increment play count for a deck (without win)
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/:id/play', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deck = await Deck.findOneAndUpdate(
      { _id: req.params.id },
      { $inc: { playCount: 1 }, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }
    
    res.json(deck);
  } catch (error) {
    console.error('Error incrementing play count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get decks by username (for selecting decks for other players)
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.get('/user/:username', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Find the user by username
    const user = await mongoose.model('User').findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all decks for this user
    const decks = await Deck.find({ user: user._id })
      .sort({ updatedAt: -1 });
    
    res.json(decks);
  } catch (error) {
    console.error('Error fetching decks by username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new deck for a specific user (by username)
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/for-user/:username', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, commander, partnerCommander, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Deck name is required' });
    }

    // Find the user by username
    const user = await mongoose.model('User').findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user already has a deck with this name
    const existingDeck = await Deck.findOne({ 
      user: user._id,
      name
    });

    if (existingDeck) {
      return res.status(400).json({ 
        message: `${req.params.username} already has a deck named "${name}". Please choose a different name for this deck.`,
        code: 'DUPLICATE_DECK_NAME',
        suggestedAction: 'Choose a unique deck name'
      });
    }

    const deck = new Deck({
      user: user._id,
      name,
      commander,
      partnerCommander,
      color,
      winCount: 0,
      playCount: 0
    });

    await deck.save();
    res.status(201).json(deck);
  } catch (error) {
    console.error('Error creating deck for user:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 