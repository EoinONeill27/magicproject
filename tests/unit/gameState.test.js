import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Game State Management', () => {
  let mockPlayers;
  let mockHistory;
  let mockSetPlayers;
  let mockSetHistory;
  let mockSetTurnCount;
  let mockSetCurrentTurn;
  let mockCurrentTurn;

  beforeEach(() => {
    mockPlayers = [
      {
        id: 1,
        life: 40,
        name: 'Player 1',
        commanderDamage: {},
        counters: { poison: 0, experience: 0, energy: 0 },
        stats: {
          damageDealt: 0,
          commanderDamageDealt: 0,
          eliminations: new Set(),
          turnTimes: [],
          damageInteractions: [],
          commanderDamageInteractions: [],
          eliminationInteractions: []
        }
      },
      {
        id: 2,
        life: 40,
        name: 'Player 2',
        commanderDamage: {},
        counters: { poison: 0, experience: 0, energy: 0 },
        stats: {
          damageDealt: 0,
          commanderDamageDealt: 0,
          eliminations: new Set(),
          turnTimes: [],
          damageInteractions: [],
          commanderDamageInteractions: [],
          eliminationInteractions: []
        }
      }
    ];

    mockHistory = [{
      players: [...mockPlayers],
      currentTurn: 1,
      turnCount: 1
    }];

    mockSetPlayers = jest.fn();
    mockSetHistory = jest.fn();
    mockSetTurnCount = jest.fn();
    mockSetCurrentTurn = jest.fn();
    mockCurrentTurn = 1;
  });

  describe('Player State Management', () => {
    it('should correctly update player life totals', () => {
      const updatePlayerLife = (playerId, newLife) => {
        const updatedPlayers = mockPlayers.map(player => 
          player.id === playerId ? { ...player, life: newLife } : player
        );
        mockSetPlayers(updatedPlayers);
      };

      updatePlayerLife(1, 30);
      expect(mockSetPlayers).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, life: 30 }),
        expect.objectContaining({ id: 2, life: 40 })
      ]);
    });

    it('should track damage interactions', () => {
      const recordDamage = (attackerId, defenderId, amount) => {
        const updatedPlayers = mockPlayers.map(player => {
          if (player.id === defenderId) {
            return {
              ...player,
              life: player.life - amount,
              stats: {
                ...player.stats,
                damageInteractions: [...player.stats.damageInteractions, { attackerId, amount }]
              }
            };
          }
          return player;
        });
        mockSetPlayers(updatedPlayers);
      };

      recordDamage(1, 2, 5);
      expect(mockSetPlayers).toHaveBeenCalledWith([
        expect.objectContaining({ id: 1, life: 40 }),
        expect.objectContaining({ 
          id: 2, 
          life: 35,
          stats: expect.objectContaining({
            damageInteractions: [{ attackerId: 1, amount: 5 }]
          })
        })
      ]);
    });
  });

  describe('Game History Management', () => {
    it('should save game state to history', () => {
      const saveToHistory = () => {
        mockSetHistory([...mockHistory, {
          players: [...mockPlayers],
          currentTurn: 2,
          turnCount: 2
        }]);
      };

      saveToHistory();
      expect(mockSetHistory).toHaveBeenCalledWith([
        ...mockHistory,
        expect.objectContaining({
          players: mockPlayers,
          currentTurn: 2,
          turnCount: 2
        })
      ]);
    });

    it('should restore game state from history', () => {
      const restoreFromHistory = (historyIndex) => {
        const historyEntry = mockHistory[historyIndex];
        mockSetPlayers(historyEntry.players);
        mockSetCurrentTurn(historyEntry.currentTurn);
        mockSetTurnCount(historyEntry.turnCount);
      };

      restoreFromHistory(0);
      expect(mockSetPlayers).toHaveBeenCalledWith(mockPlayers);
      expect(mockSetCurrentTurn).toHaveBeenCalledWith(1);
      expect(mockSetTurnCount).toHaveBeenCalledWith(1);
    });
  });

  describe('Turn Management', () => {
    it('should correctly increment turn count', () => {
      const incrementTurn = () => {
        mockSetTurnCount(prev => prev + 1);
        mockSetCurrentTurn(prev => prev + 1);
      };

      incrementTurn();
      expect(mockSetTurnCount).toHaveBeenCalled();
      expect(mockSetCurrentTurn).toHaveBeenCalled();
    });

    it('should handle turn order with multiple players', () => {
      const passTurn = () => {
        const alivePlayers = mockPlayers.filter(p => !p.isDead).map(p => p.id);
        const currentIndex = alivePlayers.indexOf(mockCurrentTurn);
        const nextIndex = (currentIndex + 1) % alivePlayers.length;
        const nextPlayer = alivePlayers[nextIndex];
        mockSetCurrentTurn(nextPlayer);
      };

      passTurn();
      expect(mockSetCurrentTurn).toHaveBeenCalledWith(2);
    });
  });

  describe('Game End Conditions', () => {
    it('should detect when a player is eliminated', () => {
      const checkElimination = () => {
        const eliminatedPlayers = mockPlayers.filter(player => player.life <= 0);
        return eliminatedPlayers.length > 0;
      };

      mockPlayers[0].life = 0;
      expect(checkElimination()).toBe(true);
    });

    it('should track player eliminations', () => {
      const recordElimination = (eliminatorId, eliminatedId) => {
        const updatedPlayers = mockPlayers.map(player => {
          if (player.id === eliminatorId) {
            return {
              ...player,
              stats: {
                ...player.stats,
                eliminations: new Set([...player.stats.eliminations, eliminatedId])
              }
            };
          }
          return player;
        });
        mockSetPlayers(updatedPlayers);
      };

      recordElimination(1, 2);
      expect(mockSetPlayers).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 1,
          stats: expect.objectContaining({
            eliminations: new Set([2])
          })
        }),
        expect.objectContaining({ id: 2 })
      ]);
    });
  });
}); 