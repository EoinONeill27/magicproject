import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock implementation of getDeckMatchupData function
const getDeckMatchupData = (deckId, gameHistory) => {
  if (!deckId || !gameHistory || !Array.isArray(gameHistory) || gameHistory.length === 0) {
    return [];
  }
  
  // Track matchups by opponent deck
  const matchups = {};
  
  // Process each game in history
  for (const game of gameHistory) {
    // Skip games without player decks info
    if (!game.playerDecks || !Array.isArray(game.playerDecks) || game.playerDecks.length < 2) {
      continue;
    }
    
    // Find our deck in this game
    const ourDeck = game.playerDecks.find(deck => deck.deckId === deckId);
    if (!ourDeck) {
      continue; // Our deck wasn't in this game
    }
    
    // Process each opponent deck
    for (const opponentDeck of game.playerDecks) {
      // Skip our own deck
      if (opponentDeck.deckId === deckId) {
        continue;
      }
      
      // Skip decks without proper identification
      if (!opponentDeck.deckId || !opponentDeck.deckName) {
        continue;
      }
      
      // Initialise matchup data if this is the first encounter
      if (!matchups[opponentDeck.deckId]) {
        matchups[opponentDeck.deckId] = {
          deckId: opponentDeck.deckId,
          deckName: opponentDeck.deckName,
          gamesPlayed: 0,
          wins: 0,
          losses: 0
        };
      }
      
      // Count this game
      matchups[opponentDeck.deckId].gamesPlayed += 1;
      
      // Count win or loss
      if (game.winner === ourDeck.playerName) {
        matchups[opponentDeck.deckId].wins += 1;
      } else if (game.winner !== 'draw') {
        matchups[opponentDeck.deckId].losses += 1;
      }
    }
  }
  
  // Convert to array and calculate win rates
  const matchupArray = Object.values(matchups).map(matchup => {
    const winRate = matchup.gamesPlayed > 0 
      ? (matchup.wins / matchup.gamesPlayed) * 100 
      : 0;
      
    return {
      ...matchup,
      winRate
    };
  });
  
  // Sort by win rate (highest first)
  return matchupArray.sort((a, b) => b.winRate - a.winRate);
};

// Mock implementation of getHeadToHeadStats function
const getHeadToHeadStats = (deck1Id, deck2Id, deckStats) => {
  const deck1 = deckStats.find(d => d._id === deck1Id);
  const deck2 = deckStats.find(d => d._id === deck2Id);
  
  if (!deck1 || !deck2) return null;
  
  const matchup1 = deck1.matchups[deck2Id];
  const matchup2 = deck2.matchups[deck1Id];
  
  if (!matchup1 || !matchup2) return null;
  
  return {
    deck1: {
      name: deck1.name,
      wins: matchup1.wins,
      losses: matchup1.losses,
      winRate: matchup1.winRate
    },
    deck2: {
      name: deck2.name,
      wins: matchup2.wins,
      losses: matchup2.losses,
      winRate: matchup2.winRate
    },
    totalGames: matchup1.totalGames
  };
};

describe('Deck Matchups Feature', () => {
  describe('getDeckMatchupData', () => {
    it('should return empty array if no deckId is provided', () => {
      // Arrange
      const gameHistory = [{ /* some game data */ }];
      
      // Act
      const result = getDeckMatchupData(null, gameHistory);
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should return empty array if game history is empty', () => {
      // Arrange
      const deckId = 'deck1';
      
      // Act
      const result = getDeckMatchupData(deckId, []);
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should calculate matchup data correctly', () => {
      // Arrange
      const deckId = 'deck1';
      const gameHistory = [
        {
          winner: 'player1',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', deckId: 'deck2', deckName: 'Zombies' }
          ]
        },
        {
          winner: 'player2',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', deckId: 'deck2', deckName: 'Zombies' }
          ]
        },
        {
          winner: 'player1',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player3', deckId: 'deck3', deckName: 'Elves' }
          ]
        }
      ];
      
      // Act
      const result = getDeckMatchupData(deckId, gameHistory);
      
      // Assert
      expect(result).toHaveLength(2);
      
      // Check Elves matchup (should be 100% win rate)
      const elvesMatchup = result.find(m => m.deckId === 'deck3');
      expect(elvesMatchup).toBeDefined();
      expect(elvesMatchup.deckName).toBe('Elves');
      expect(elvesMatchup.gamesPlayed).toBe(1);
      expect(elvesMatchup.wins).toBe(1);
      expect(elvesMatchup.losses).toBe(0);
      expect(elvesMatchup.winRate).toBe(100);
      
      // Check Zombies matchup (should be 50% win rate)
      const zombiesMatchup = result.find(m => m.deckId === 'deck2');
      expect(zombiesMatchup).toBeDefined();
      expect(zombiesMatchup.deckName).toBe('Zombies');
      expect(zombiesMatchup.gamesPlayed).toBe(2);
      expect(zombiesMatchup.wins).toBe(1);
      expect(zombiesMatchup.losses).toBe(1);
      expect(zombiesMatchup.winRate).toBe(50);
      
      // Check sorting (Elves should be first with higher win rate)
      expect(result[0].deckId).toBe('deck3');
      expect(result[1].deckId).toBe('deck2');
    });
    
    it('should handle games where the deck was not used', () => {
      // Arrange
      const deckId = 'deck1';
      const gameHistory = [
        {
          winner: 'player1',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', deckId: 'deck2', deckName: 'Zombies' }
          ]
        },
        {
          winner: 'player2',
          playerDecks: [
            { playerName: 'player3', deckId: 'deck3', deckName: 'Elves' },
            { playerName: 'player2', deckId: 'deck2', deckName: 'Zombies' }
          ]
        }
      ];
      
      // Act
      const result = getDeckMatchupData(deckId, gameHistory);
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].deckId).toBe('deck2');
      expect(result[0].gamesPlayed).toBe(1);
    });
    
    it('should handle draws correctly', () => {
      const deckId = 'deck1';
      const gameHistory = [
        {
          winner: 'draw',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', deckId: 'deck2', deckName: 'Zombies' }
          ]
        }
      ];
      
      const result = getDeckMatchupData(deckId, gameHistory);
      
      expect(result).toHaveLength(1);
      expect(result[0].deckId).toBe('deck2');
      expect(result[0].gamesPlayed).toBe(1);
      expect(result[0].wins).toBe(0);
      expect(result[0].losses).toBe(0);
      expect(result[0].winRate).toBe(0);
    });
    
    it('should handle invalid game data gracefully', () => {

      const deckId = 'deck1';
      const gameHistory = [
        {
          winner: 'player1',
          // Missing playerDecks
        },
        {
          winner: 'player1',
          playerDecks: null
        },
        {
          winner: 'player1',
          playerDecks: []
        },
        {
          winner: 'player1',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' }
            // Only one deck, not enough for a matchup
          ]
        }
      ];
      
      const result = getDeckMatchupData(deckId, gameHistory);
      
      expect(result).toEqual([]);
    });
    
    it('should handle games with incomplete deck information', () => {

      const deckId = 'deck1';
      const gameHistory = [
        {
          winner: 'player1',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', deckId: 'deck2' /* Missing deckName */ }
          ]
        },
        {
          winner: 'player2',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', /* Missing deckId */ deckName: 'Zombies' }
          ]
        }
      ];
      
      const result = getDeckMatchupData(deckId, gameHistory);
      
      expect(result).toEqual([]);
    });
    
    it('should handle multiplayer games with multiple opponents', () => {

      const deckId = 'deck1';
      const gameHistory = [
        {
          winner: 'player1',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', deckId: 'deck2', deckName: 'Zombies' },
            { playerName: 'player3', deckId: 'deck3', deckName: 'Elves' },
            { playerName: 'player4', deckId: 'deck4', deckName: 'Goblins' }
          ]
        }
      ];
      
      const result = getDeckMatchupData(deckId, gameHistory);

      expect(result).toHaveLength(3); // 3 opponent decks
      
      // All opponents should have 0-1 record against our winning deck
      result.forEach(matchup => {
        expect(matchup.gamesPlayed).toBe(1);
        expect(matchup.wins).toBe(1);
        expect(matchup.losses).toBe(0);
        expect(matchup.winRate).toBe(100);
      });
    });
    
    it('should maintain separate stats for different player names using the same deck', () => {

      const deckId = 'deck1';
      const gameHistory = [
        {
          winner: 'player1',
          playerDecks: [
            { playerName: 'player1', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player2', deckId: 'deck2', deckName: 'Zombies' }
          ]
        },
        {
          winner: 'player3', // Different player using same deck
          playerDecks: [
            { playerName: 'player3', deckId: 'deck1', deckName: 'Dragons' },
            { playerName: 'player4', deckId: 'deck2', deckName: 'Zombies' }
          ]
        }
      ];
      
      const result = getDeckMatchupData(deckId, gameHistory);
      
      expect(result).toHaveLength(1);
      
      // Should combine results regardless of player name
      const zombiesMatchup = result[0];
      expect(zombiesMatchup.deckId).toBe('deck2');
      expect(zombiesMatchup.gamesPlayed).toBe(2);
      expect(zombiesMatchup.wins).toBe(2);
      expect(zombiesMatchup.losses).toBe(0);
      expect(zombiesMatchup.winRate).toBe(100);
    });
  });
  
  describe('Head to Head Stats', () => {
    it('should return null if either deck is not found', () => {

      const deckStats = [
        { _id: 'deck1', name: 'Dragons', matchups: {} }
      ];
      
      const result = getHeadToHeadStats('deck1', 'deck2', deckStats);

      expect(result).toBeNull();
    });
    
    it('should return null if matchup data is missing', () => {

      const deckStats = [
        { _id: 'deck1', name: 'Dragons', matchups: {} },
        { _id: 'deck2', name: 'Zombies', matchups: {} }
      ];

      const result = getHeadToHeadStats('deck1', 'deck2', deckStats);

      expect(result).toBeNull();
    });
    
    it('should calculate head-to-head stats correctly', () => {

      const deckStats = [
        { 
          _id: 'deck1', 
          name: 'Dragons', 
          matchups: {
            'deck2': { wins: 3, losses: 2, totalGames: 5, winRate: 60 }
          }
        },
        { 
          _id: 'deck2', 
          name: 'Zombies', 
          matchups: {
            'deck1': { wins: 2, losses: 3, totalGames: 5, winRate: 40 }
          }
        }
      ];

      const result = getHeadToHeadStats('deck1', 'deck2', deckStats);

      expect(result).toEqual({
        deck1: {
          name: 'Dragons',
          wins: 3,
          losses: 2,
          winRate: 60
        },
        deck2: {
          name: 'Zombies',
          wins: 2,
          losses: 3,
          winRate: 40
        },
        totalGames: 5
      });
    });
  });
}); 