import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Player Interactions', () => {
  describe('Life Changes', () => {
    let mockSetHistory;
    let mockSetPlayers;
    let mockGetWinner;
    let players;
    
    beforeEach(() => {
      mockSetHistory = jest.fn();
      mockSetPlayers = jest.fn();
      mockGetWinner = jest.fn(() => null);
      
      players = [
        { 
          id: 1, 
          name: 'Player 1', 
          life: 40,
          stats: {
            damageDealt: 0,
            damageInteractions: [],
          }
        },
        { 
          id: 2, 
          name: 'Player 2', 
          life: 40,
          stats: {
            damageDealt: 0,
            damageInteractions: [],
          }
        },
        { 
          id: 3, 
          name: 'Player 3', 
          life: 40,
          stats: {
            damageDealt: 0,
            damageInteractions: [],
          }
        },
      ];
    });
    
    function mockUpdateLife(playerIds, amount, sourcePlayerId) {
      // Save history first
      mockSetHistory(prev => [...prev, {
        players: players,
        // Other history properties would be here
      }]);
      
      // Handle single ID or array of IDs
      const targetIds = Array.isArray(playerIds) ? playerIds : [playerIds];
      
      // Update players
      mockSetPlayers(prev => {
        const updated = [...prev];
        
        // Update target players' life totals
        targetIds.forEach(targetId => {
          const targetIndex = updated.findIndex(p => p.id === targetId);
          if (targetIndex >= 0) {
            updated[targetIndex] = {
              ...updated[targetIndex],
              life: Math.max(0, updated[targetIndex].life + amount),
              lastDamagedBy: amount < 0 ? sourcePlayerId : undefined
            };
            
            // Check for player elimination
            if (updated[targetIndex].life <= 0 && !updated[targetIndex].isDead) {
              updated[targetIndex].isDead = true;
              
              // Update source player's elimination stats
              if (sourcePlayerId) {
                const sourceIndex = updated.findIndex(p => p.id === sourcePlayerId);
                if (sourceIndex >= 0) {
                  const sourceEliminations = new Set(updated[sourceIndex].stats.eliminations || []);
                  sourceEliminations.add(targetId);
                  
                  updated[sourceIndex] = {
                    ...updated[sourceIndex],
                    stats: {
                      ...updated[sourceIndex].stats,
                      eliminations: sourceEliminations,
                      eliminationInteractions: [
                        ...(updated[sourceIndex].stats.eliminationInteractions || []),
                        { eliminatedPlayer: updated[targetIndex].name }
                      ]
                    }
                  };
                }
              }
            }
          }
        });
        
        // If damage was dealt, update source player's damage stats
        if (amount < 0 && sourcePlayerId) {
          const sourceIndex = updated.findIndex(p => p.id === sourcePlayerId);
          if (sourceIndex >= 0) {
            updated[sourceIndex] = {
              ...updated[sourceIndex],
              stats: {
                ...updated[sourceIndex].stats,
                damageDealt: updated[sourceIndex].stats.damageDealt + (-amount * targetIds.length),
                damageInteractions: [
                  ...(updated[sourceIndex].stats.damageInteractions || []),
                  ...targetIds.map(targetId => {
                    const targetPlayer = updated.find(p => p.id === targetId);
                    return {
                      targetPlayer: targetPlayer.name,
                      amount: -amount
                    };
                  })
                ]
              }
            };
          }
        }
        
        return updated;
      });
      
      // Check for winner after updates
      mockGetWinner();
    }
    
    it('should reduce player life when negative amount is passed', () => {
      mockUpdateLife(1, -5);
      
      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].life).toBe(35); // Player 1's life reduced by 5
      expect(result[1].life).toBe(40); // Player 2's life unchanged
      expect(result[2].life).toBe(40); // Player 3's life unchanged
    });
    
    it('should increase player life when positive amount is passed', () => {
      mockUpdateLife(1, 5);
      
      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].life).toBe(45); // Player 1's life increased by 5
      expect(result[1].life).toBe(40); // Player 2's life unchanged
      expect(result[2].life).toBe(40); // Player 3's life unchanged
    });
    
    it('should update multiple players when array of ids is passed', () => {
      mockUpdateLife([1, 2], -3);
      
      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].life).toBe(37); // Player 1's life reduced by 3
      expect(result[1].life).toBe(37); // Player 2's life reduced by 3
      expect(result[2].life).toBe(40); // Player 3's life unchanged
    });
    
    it('should set lastDamagedBy when damage is dealt', () => {
      mockUpdateLife(1, -5, 2);

      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].lastDamagedBy).toBe(2); // Player 1 damaged by Player 2
    });
    
    it('should eliminate player when life reaches 0', () => {
      players[0].life = 5;

      mockUpdateLife(1, -5, 2);

      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].life).toBe(0);
      expect(result[0].isDead).toBe(true);
    });
    
    it('should update source player stats when dealing damage', () => {
      mockUpdateLife(1, -5, 2);

      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[1].stats.damageDealt).toBe(5);
      expect(result[1].stats.damageInteractions.length).toBe(1);
      expect(result[1].stats.damageInteractions[0]).toEqual({
        targetPlayer: 'Player 1',
        amount: 5
      });
    });
    
    it('should update eliminations when a player is eliminated', () => {

      players[0].life = 5;
      
      mockUpdateLife(1, -5, 2);
      
      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[1].stats.eliminations).toContain(1);
      expect(result[1].stats.eliminationInteractions.length).toBe(1);
      expect(result[1].stats.eliminationInteractions[0]).toEqual({
        eliminatedPlayer: 'Player 1'
      });
    });
  });
  
  describe('Commander Damage', () => {
    let mockSetHistory;
    let mockSetPlayers;
    let mockGetWinner;
    let players;
    
    beforeEach(() => {
      mockSetHistory = jest.fn();
      mockSetPlayers = jest.fn();
      mockGetWinner = jest.fn(() => null);
      
      players = [
        { 
          id: 1, 
          name: 'Player 1', 
          life: 40,
          commanderDamage: {},
          stats: {
            commanderDamageDealt: 0,
            commanderDamageInteractions: []
          }
        },
        { 
          id: 2, 
          name: 'Player 2', 
          life: 40,
          commanderDamage: {},
          stats: {
            commanderDamageDealt: 0,
            commanderDamageInteractions: []
          }
        },
        { 
          id: 3, 
          name: 'Player 3', 
          life: 40,
          commanderDamage: {},
          stats: {
            commanderDamageDealt: 0,
            commanderDamageInteractions: []
          }
        },
      ];
    });
    
    function mockDealCommanderDamage(targetId, sourceId, amount) {
      // Save history first
      mockSetHistory(prev => [...prev, {
        players: players,
        // Other history properties would be here
      }]);
      
      // Update players
      mockSetPlayers(prev => {
        const updated = [...prev];
        
        const targetIndex = updated.findIndex(p => p.id === targetId);
        const sourceIndex = updated.findIndex(p => p.id === sourceId);
        
        if (targetIndex >= 0 && sourceIndex >= 0) {
          // Initialize commander damage object if needed
          const commanderDamage = { ...updated[targetIndex].commanderDamage };
          if (!commanderDamage[sourceId]) {
            commanderDamage[sourceId] = 0;
          }
          
          // Calculate new commander damage value (minimum 0)
          const newDamage = Math.max(0, commanderDamage[sourceId] - amount);
          
          // Calculate actual damage dealt
          const damageDiff = commanderDamage[sourceId] - newDamage;
          
          // Update commander damage
          commanderDamage[sourceId] = newDamage;
          
          // Update target player's life total based on commander damage
          const newLife = Math.max(0, updated[targetIndex].life + amount);
          
          // Update target player
          updated[targetIndex] = {
            ...updated[targetIndex],
            life: newLife,
            commanderDamage,
            lastDamagedBy: amount < 0 ? sourceId : undefined
          };
          
          // Check if the player is dead from commander damage (21 or more)
          if (newDamage >= 21 && !updated[targetIndex].isDead) {
            updated[targetIndex].isDead = true;
            
            // Update source player's elimination stats
            const sourceEliminations = new Set(updated[sourceIndex].stats.eliminations || []);
            sourceEliminations.add(targetId);
            
            updated[sourceIndex] = {
              ...updated[sourceIndex],
              stats: {
                ...updated[sourceIndex].stats,
                eliminations: sourceEliminations,
                eliminationInteractions: [
                  ...(updated[sourceIndex].stats.eliminationInteractions || []),
                  { eliminatedPlayer: updated[targetIndex].name }
                ]
              }
            };
          }
          
          // Check if the player is dead from life total
          if (newLife <= 0 && !updated[targetIndex].isDead) {
            updated[targetIndex].isDead = true;
            
            // Update source player's elimination stats
            const sourceEliminations = new Set(updated[sourceIndex].stats.eliminations || []);
            sourceEliminations.add(targetId);
            
            updated[sourceIndex] = {
              ...updated[sourceIndex],
              stats: {
                ...updated[sourceIndex].stats,
                eliminations: sourceEliminations,
                eliminationInteractions: [
                  ...(updated[sourceIndex].stats.eliminationInteractions || []),
                  { eliminatedPlayer: updated[targetIndex].name }
                ]
              }
            };
          }
          
          // Update source player's commander damage stats
          if (amount < 0) {
            updated[sourceIndex] = {
              ...updated[sourceIndex],
              stats: {
                ...updated[sourceIndex].stats,
                commanderDamageDealt: updated[sourceIndex].stats.commanderDamageDealt + (-amount),
                commanderDamageInteractions: [
                  ...(updated[sourceIndex].stats.commanderDamageInteractions || []),
                  {
                    targetPlayer: updated[targetIndex].name,
                    amount: -amount
                  }
                ]
              }
            };
          }
        }
        
        return updated;
      });
      
      // Check for winner after updates
      mockGetWinner();
    }
    
    it('should add commander damage when negative amount is passed', () => {

      mockDealCommanderDamage(1, 2, -5);

      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].commanderDamage[2]).toBe(5);
      expect(result[0].life).toBe(35);
    });
    
    it('should remove commander damage when positive amount is passed', () => {
      players[0].commanderDamage[2] = 10;

      mockDealCommanderDamage(1, 2, 3);

      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].commanderDamage[2]).toBe(7);
      expect(result[0].life).toBe(43);
    });
    
    it('should eliminate player when commander damage reaches 21', () => {
      players[0].commanderDamage[2] = 20;

      mockDealCommanderDamage(1, 2, -1);

      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[0].commanderDamage[2]).toBe(21);
      expect(result[0].isDead).toBe(true);
    });
    
    it('should update source player stats when dealing commander damage', () => {

      mockDealCommanderDamage(1, 2, -5);

      expect(mockSetPlayers).toHaveBeenCalled();
      const setPlayersCallback = mockSetPlayers.mock.calls[0][0];
      const result = setPlayersCallback(players);
      
      expect(result[1].stats.commanderDamageDealt).toBe(5);
      expect(result[1].stats.commanderDamageInteractions.length).toBe(1);
      expect(result[1].stats.commanderDamageInteractions[0]).toEqual({
        targetPlayer: 'Player 1',
        amount: 5
      });
    });
  });
}); 