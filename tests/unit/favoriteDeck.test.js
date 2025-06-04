import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock implementation of getFavoriteDeckInfo function
const getFavoriteDeckInfo = (currentUser) => {
  if (!currentUser?.gameHistory || currentUser.gameHistory.length === 0) {
    return null;
  }

  // Track deck usage statistics
  const deckStats = {};
  
  // Process each game in the history
  for (const game of currentUser.gameHistory) {
    // Skip games without deck info
    if (!game.playerDecks || !Array.isArray(game.playerDecks)) {
      continue;
    }
    
    // Find the user's deck in this game
    const userDeck = game.playerDecks.find(
      deck => deck.playerName === currentUser.username
    );
    
    // Skip if user didn't play with a deck in this game
    if (!userDeck || !userDeck.deckId || !userDeck.deckName) {
      continue;
    }
    
    // Initialize deck stats if this is the first time seeing this deck
    if (!deckStats[userDeck.deckId]) {
      deckStats[userDeck.deckId] = {
        name: userDeck.deckName,
        plays: 0,
        wins: 0
      };
    }
    
    // Count this game
    deckStats[userDeck.deckId].plays += 1;
    
    // Count win if user was the winner
    if (game.winner === currentUser.username) {
      deckStats[userDeck.deckId].wins += 1;
    }
  }
  
  // Find most played deck
  let favoriteDeckId = '';
  let maxPlays = 0;
  
  for (const [deckId, stats] of Object.entries(deckStats)) {
    if (stats.plays > maxPlays) {
      favoriteDeckId = deckId;
      maxPlays = stats.plays;
    }
  }
  
  // If no decks played, return null
  if (!favoriteDeckId || maxPlays === 0) {
    return null;
  }
  
  const favorite = deckStats[favoriteDeckId];
  const winRate = (favorite.wins / favorite.plays) * 100;
  
  return {
    name: favorite.name,
    winRate: winRate
  };
};

describe('Favorite Deck Feature', () => {
  describe('getFavoriteDeckInfo', () => {
    it('should return null if user has no game history', () => {

      const user = { username: 'testUser', gameHistory: [] };

      const result = getFavoriteDeckInfo(user);

      expect(result).toBeNull();
    });
    
    it('should return null if no games have deck information', () => {

      const user = {
        username: 'testUser',
        gameHistory: [
          { winner: 'testUser', playerDecks: [] },
          { winner: 'testUser', playerDecks: null }
        ]
      };

      const result = getFavoriteDeckInfo(user);

      expect(result).toBeNull();
    });
    
    it('should correctly identify the most played deck', () => {

      const user = {
        username: 'testUser',
        gameHistory: [
          {
            winner: 'testUser',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' },
              { playerName: 'opponent', deckId: 'deckA', deckName: 'Zombies' }
            ]
          },
          {
            winner: 'opponent',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' },
              { playerName: 'opponent', deckId: 'deckB', deckName: 'Angels' }
            ]
          },
          {
            winner: 'testUser',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck2', deckName: 'Goblins' },
              { playerName: 'opponent', deckId: 'deckC', deckName: 'Elves' }
            ]
          }
        ]
      };

      const result = getFavoriteDeckInfo(user);

      expect(result).not.toBeNull();
      expect(result.name).toBe('Dragons'); // Deck1 was played twice
      expect(result.winRate).toBe(50); // 1 win out of 2 games = 50%
    });
    
    it('should calculate win rate correctly', () => {

      const user = {
        username: 'testUser',
        gameHistory: [
          {
            winner: 'testUser',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' }
            ]
          },
          {
            winner: 'testUser',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' }
            ]
          },
          {
            winner: 'opponent',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' }
            ]
          }
        ]
      };

      const result = getFavoriteDeckInfo(user);

      expect(result).not.toBeNull();
      expect(result.name).toBe('Dragons');
      expect(result.winRate).toBeCloseTo(66.66666666666667, 10); // 2 wins out of 3 games
    });
    
    it('should only count games where the user used the deck', () => {

      const user = {
        username: 'testUser',
        gameHistory: [
          {
            winner: 'testUser',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' },
              { playerName: 'opponent', deckId: 'deck2', deckName: 'Goblins' }
            ]
          },
          {
            winner: 'opponent',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' },
              { playerName: 'opponent', deckId: 'deck2', deckName: 'Goblins' }
            ]
          },
          {
            winner: 'opponent',
            playerDecks: [
              { playerName: 'otherPlayer', deckId: 'deck1', deckName: 'Dragons' }, // Borrowed by another player
              { playerName: 'opponent', deckId: 'deck3', deckName: 'Elves' }
            ]
          }
        ]
      };

      const result = getFavoriteDeckInfo(user);

      expect(result).not.toBeNull();
      expect(result.name).toBe('Dragons');
      expect(result.winRate).toBe(50); // Only 1 win out of 2 games where the user used the deck
    });
    
    it('should handle tied play counts by selecting the first one found', () => {

      const user = {
        username: 'testUser',
        gameHistory: [
          {
            winner: 'testUser',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck1', deckName: 'Dragons' }
            ]
          },
          {
            winner: 'opponent',
            playerDecks: [
              { playerName: 'testUser', deckId: 'deck2', deckName: 'Goblins' }
            ]
          }
        ]
      };

      const result = getFavoriteDeckInfo(user);

      expect(result).not.toBeNull();
      expect(result.name).toBe('Dragons'); // First found with 1 play
      expect(result.winRate).toBe(100); // 1 win out of 1 game
    });
  });
}); 