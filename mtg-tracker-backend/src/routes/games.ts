import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import Game from '../models/Game';
import User from '../models/User';

// Extended request interface with userId
interface AuthRequest extends ExpressRequest {
  userId?: string;
}

const router = express.Router();

// Save game result
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { date, winner, players, playerCount, turnCount, duration, activeDuration, avgTurnTime, playerStats, playgroupName, playerDecks } = req.body;
    
    // Validate required fields
    if (!winner || !players || !playerCount || !turnCount || !duration) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['winner', 'players', 'playerCount', 'turnCount', 'duration']
      });
    }

    // Validate playerStats structure and ensure it matches players array length
    const validatedPlayerStats = playerStats?.map((stat: any) => {
      return {
        damageDealt: Math.max(0, Number(stat.damageDealt) || 0),
        commanderDamageDealt: Math.max(0, Number(stat.commanderDamageDealt) || 0),
        eliminations: Math.max(0, Number(stat.eliminations) || 0),
        totalTurnTime: Math.max(0, Number(stat.totalTurnTime) || 0),
        saltinessRating: 
          stat.saltinessRating && 
          ['notSalty', 'somewhatSalty', 'extremelySalty'].includes(stat.saltinessRating) 
            ? stat.saltinessRating 
            : null,
        // Include interaction arrays with validation
        damageInteractions: Array.isArray(stat.damageInteractions) 
          ? stat.damageInteractions.map((interaction: any) => ({
              targetPlayer: String(interaction.targetPlayer || ''),
              amount: Math.max(0, Number(interaction.amount) || 0)
            }))
          : [],
        commanderDamageInteractions: Array.isArray(stat.commanderDamageInteractions)
          ? stat.commanderDamageInteractions.map((interaction: any) => ({
              targetPlayer: String(interaction.targetPlayer || ''),
              amount: Math.max(0, Number(interaction.amount) || 0)
            }))
          : [],
        eliminationInteractions: Array.isArray(stat.eliminationInteractions)
          ? stat.eliminationInteractions.map((interaction: any) => ({
              eliminatedPlayer: String(interaction.eliminatedPlayer || '')
            }))
          : []
      };
    }) || [];

    // Ensure playerStats array length matches players array length
    if (validatedPlayerStats.length !== players.length) {
      // Pad or truncate stats array to match players array
      while (validatedPlayerStats.length < players.length) {
        validatedPlayerStats.push({
          damageDealt: 0,
          commanderDamageDealt: 0,
          eliminations: 0,
          totalTurnTime: 0,
          damageInteractions: [],
          commanderDamageInteractions: [],
          eliminationInteractions: []
        });
      }
      validatedPlayerStats.length = players.length;
    }

    // Find all user IDs for the players in the game
    const userDocs = await User.find({ username: { $in: players } });
    const userIds = userDocs.map(user => user._id);

    // Create game entries for each player
    const gamePromises = userIds.map(userId => {
      const gameData = {
        user: userId,
        date: date || new Date(),
        winner,
        players,
        playerCount,
        turnCount,
        duration,
        activeDuration,
        avgTurnTime: avgTurnTime || 0,
        playerStats: validatedPlayerStats,
        playgroupName,
        playerDecks
      };
      
      const game = new Game(gameData);
      return game.save();
    });

    // Save all game entries
    const savedGames = await Promise.all(gamePromises);
    
    res.status(201).json({ message: 'Game saved for all players' });
  } catch (error) {
    console.error('Error saving game:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's game history
// @ts-ignore - Express route handler type compatibility issue with AuthRequest
router.get('/history', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const games = await Game.find({ user: req.userId })
      .sort({ date: -1 })
      .lean()
      .exec();
    
    res.json(games);
  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 