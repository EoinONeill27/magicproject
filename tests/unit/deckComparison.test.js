import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const processGameHistory = (decks, games) => {
  const result = {};

  // Initialize stats for each deck
  decks.forEach(deck => {
    result[deck._id] = {
      _id: deck._id,
      name: deck.name,
      commander: deck.commander,
      partnerCommander: deck.partnerCommander,
      color: deck.color,
      winCount: 0,
      playCount: 0,
      winRate: 0,
      avgGameTurns: 0,
      avgGameDuration: 0,
      totalDamageDealt: 0,
      avgDamagePerGame: 0,
      totalCommanderDamageDealt: 0,
      avgCommanderDamagePerGame: 0,
      matchups: {}
    };
  });

  // Process each game
  games.forEach(game => {
    if (!game.playerDecks || !Array.isArray(game.playerDecks)) return;

    // Track decks in this game for matchup tracking
    const decksInGame = game.playerDecks.map(pd => pd.deckId);
    
    // Update stats for each deck in the game
    game.playerDecks.forEach((playerDeck, index) => {
      const deckId = playerDeck.deckId;
      const deckStats = result[deckId];
      if (!deckStats) return;
      
      // Update basic stats
      deckStats.playCount++;
      if (game.winner && game.players[index] === game.winner) {
        deckStats.winCount++;
      }
      
      // Update damage stats if available
      if (game.playerStats && game.playerStats[index]) {
        deckStats.totalDamageDealt += game.playerStats[index].damageDealt || 0;
        deckStats.totalCommanderDamageDealt += game.playerStats[index].commanderDamageDealt || 0;
      }
      
      // Update matchup data
      decksInGame.forEach(opponentDeckId => {
        if (opponentDeckId === deckId) return; // Skip self
        
        // Initialize matchup if it doesn't exist
        if (!deckStats.matchups[opponentDeckId]) {
          deckStats.matchups[opponentDeckId] = {
            deckId: opponentDeckId,
            deckName: decks.find(d => d._id === opponentDeckId)?.name || 'Unknown Deck',
            wins: 0,
            losses: 0,
            totalGames: 0,
            winRate: 0
          };
        }
        
        deckStats.matchups[opponentDeckId].totalGames++;
        if (game.winner && game.players[index] === game.winner) {
          deckStats.matchups[opponentDeckId].wins++;
        } else if (game.winner) {
          // Only count as a loss if there was a declared winner and it wasn't this deck
          deckStats.matchups[opponentDeckId].losses++;
        }
      });
    });
    
    // Update average game stats for all decks in the game
    decksInGame.forEach(deckId => {
      const deckStats = result[deckId];
      if (!deckStats) return;
      
      // These values will be averaged after all games are processed
      deckStats.avgGameTurns += game.turnCount || 0;
      deckStats.avgGameDuration += game.duration || 0;
    });
  });
  
  // Calculate averages and derived stats
  Object.values(result).forEach(deckStats => {
    if (deckStats.playCount > 0) {
      deckStats.winRate = (deckStats.winCount / deckStats.playCount) * 100;
      deckStats.avgGameTurns = deckStats.avgGameTurns / deckStats.playCount;
      deckStats.avgGameDuration = deckStats.avgGameDuration / deckStats.playCount;
      deckStats.avgDamagePerGame = deckStats.totalDamageDealt / deckStats.playCount;
      deckStats.avgCommanderDamagePerGame = deckStats.totalCommanderDamageDealt / deckStats.playCount;
      
      // Calculate matchup win rates
      Object.values(deckStats.matchups).forEach(matchup => {
        matchup.winRate = matchup.totalGames > 0 ? (matchup.wins / matchup.totalGames) * 100 : 0;
      });
    }
  });
  
  return result;
};

const getDeckMatchupData = (deckId, deckStats) => {
  const deck = deckStats[deckId];
  if (!deck) return [];
  
  // Convert matchups object to array and sort by win rate
  return Object.values(deck.matchups)
    .sort((a, b) => b.winRate - a.winRate);
};

describe('Deck Comparison Tests', () => {
  let mockDecks;
  let mockGames;

  beforeEach(() => {
    // Mock decks data
    mockDecks = [
      { _id: 'deck1', name: 'Deck One', commander: 'Commander1' },
      { _id: 'deck2', name: 'Deck Two', commander: 'Commander2' },
      { _id: 'deck3', name: 'Deck Three', commander: 'Commander3' }
    ];

    // Mock games data
    mockGames = [
      {
        _id: 'game1',
        date: '2024-01-01',
        winner: 'player1',
        players: ['player1', 'player2', 'player3'],
        playerDecks: [
          { playerId: 1, deckId: 'deck1', deckName: 'Deck One' },
          { playerId: 2, deckId: 'deck2', deckName: 'Deck Two' },
          { playerId: 3, deckId: 'deck3', deckName: 'Deck Three' }
        ],
        playerStats: [
          { damageDealt: 20, commanderDamageDealt: 10, eliminations: 1 },
          { damageDealt: 15, commanderDamageDealt: 5, eliminations: 0 },
          { damageDealt: 10, commanderDamageDealt: 0, eliminations: 0 }
        ],
        turnCount: 10,
        duration: 1800
      },
      {
        _id: 'game2',
        date: '2024-01-02',
        winner: 'player2',
        players: ['player1', 'player2', 'player3'],
        playerDecks: [
          { playerId: 1, deckId: 'deck1', deckName: 'Deck One' },
          { playerId: 2, deckId: 'deck2', deckName: 'Deck Two' },
          { playerId: 3, deckId: 'deck3', deckName: 'Deck Three' }
        ],
        playerStats: [
          { damageDealt: 15, commanderDamageDealt: 5, eliminations: 0 },
          { damageDealt: 25, commanderDamageDealt: 15, eliminations: 2 },
          { damageDealt: 10, commanderDamageDealt: 0, eliminations: 0 }
        ],
        turnCount: 12,
        duration: 2100
      }
    ];
  });

  describe('Deck Statistics Calculation', () => {
    it('should correctly calculate deck statistics from game history', () => {
      const stats = processGameHistory(mockDecks, mockGames);
      
      expect(stats).toBeDefined();
      expect(stats['deck1']).toBeDefined();
      expect(stats['deck1'].winCount).toBe(1);
      expect(stats['deck1'].playCount).toBe(2);
      expect(stats['deck1'].winRate).toBe(50);
      expect(stats['deck1'].avgGameTurns).toBe(11);
      expect(stats['deck1'].avgGameDuration).toBe(1950);
    });

    it('should handle decks with no games played', () => {
      const newDeck = { _id: 'deck4', name: 'Deck Four', commander: 'Commander4' };
      const stats = processGameHistory([...mockDecks, newDeck], mockGames);
      
      expect(stats['deck4']).toBeDefined();
      expect(stats['deck4'].winCount).toBe(0);
      expect(stats['deck4'].playCount).toBe(0);
      expect(stats['deck4'].winRate).toBe(0);
    });

    it('should correctly calculate total damage and averages', () => {
      const stats = processGameHistory(mockDecks, mockGames);
      
      expect(stats['deck1'].totalDamageDealt).toBe(35);
      expect(stats['deck1'].avgDamagePerGame).toBe(17.5);
      expect(stats['deck1'].totalCommanderDamageDealt).toBe(15);
      expect(stats['deck1'].avgCommanderDamagePerGame).toBe(7.5);
    });
  });

  describe('Matchup Data Processing', () => {
    it('should correctly calculate matchup statistics', () => {
      const stats = processGameHistory(mockDecks, mockGames);
      const matchupData = getDeckMatchupData('deck1', stats);
      
      expect(matchupData).toBeDefined();
      expect(matchupData.length).toBe(2); // Should have matchups against deck2 and deck3
      
      const deck2Matchup = matchupData.find(m => m.deckId === 'deck2');
      expect(deck2Matchup).toBeDefined();
      expect(deck2Matchup.wins).toBe(1);
      expect(deck2Matchup.losses).toBe(1);
      expect(deck2Matchup.winRate).toBe(50);
    });

    it('should handle decks with no matchups', () => {
      const newDeck = { _id: 'deck4', name: 'Deck Four', commander: 'Commander4' };
      const stats = processGameHistory([...mockDecks, newDeck], mockGames);
      const matchupData = getDeckMatchupData('deck4', stats);
      
      expect(matchupData).toBeDefined();
      expect(matchupData.length).toBe(0);
    });

    it('should correctly sort matchups by win rate', () => {
      const stats = processGameHistory(mockDecks, mockGames);
      const matchupData = getDeckMatchupData('deck1', stats);
      
      // Verify sorting by win rate (descending)
      for (let i = 0; i < matchupData.length - 1; i++) {
        expect(matchupData[i].winRate).toBeGreaterThanOrEqual(matchupData[i + 1].winRate);
      }
    });
  });

  describe('Win Rate Calculations', () => {
    it('should correctly calculate win rates for decks', () => {
      const stats = processGameHistory(mockDecks, mockGames);
      
      expect(stats['deck1'].winRate).toBe(50);
      expect(stats['deck2'].winRate).toBe(50);
      expect(stats['deck3'].winRate).toBe(0);
    });

    it('should handle edge cases in win rate calculation', () => {
      const stats = processGameHistory(mockDecks, []);
      
      expect(stats['deck1'].winRate).toBe(0);
      expect(stats['deck1'].playCount).toBe(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should correctly calculate average game turns', () => {
      const stats = processGameHistory(mockDecks, mockGames);
      
      expect(stats['deck1'].avgGameTurns).toBe(11);
      expect(stats['deck2'].avgGameTurns).toBe(11);
      expect(stats['deck3'].avgGameTurns).toBe(11);
    });

    it('should correctly calculate average game duration', () => {
      const stats = processGameHistory(mockDecks, mockGames);
      
      expect(stats['deck1'].avgGameDuration).toBe(1950);
      expect(stats['deck2'].avgGameDuration).toBe(1950);
      expect(stats['deck3'].avgGameDuration).toBe(1950);
    });
  });
}); 