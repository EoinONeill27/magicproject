import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

const updateLife = jest.fn((playerIds, amount, players) => {
  const playerIdsArray = Array.isArray(playerIds) ? playerIds : [playerIds];
  return players.map(player => 
    playerIdsArray.includes(player.id) 
      ? { ...player, life: player.life + amount } 
      : player
  );
});

const dealCommanderDamage = jest.fn((targetId, sourceId, amount, players) => {
  return players.map(player => {
    if (player.id === targetId) {
      const currentDamage = player.commanderDamage[sourceId] || 0;
      return {
        ...player,
        commanderDamage: {
          ...player.commanderDamage,
          [sourceId]: currentDamage + amount
        }
      };
    }
    return player;
  });
});

const updateCounters = jest.fn((playerId, counterType, amount, players) => {
  return players.map(player => {
    if (player.id === playerId) {
      const currentValue = player.counters[counterType] || 0;
      const newValue = Math.max(0, currentValue + amount);
      return {
        ...player,
        counters: {
          ...player.counters,
          [counterType]: newValue
        }
      };
    }
    return player;
  });
});

const passTurn = jest.fn(gameState => {
  const alivePlayers = gameState.players.filter(p => !p.isDead).map(p => p.id);
  const currentIndex = alivePlayers.indexOf(gameState.currentTurn);
  const nextIndex = (currentIndex + 1) % alivePlayers.length;
  const nextPlayer = alivePlayers[nextIndex];
  
  return {
    ...gameState,
    currentTurn: nextPlayer
  };
});

const resetGame = jest.fn(gameState => {
  return {
    ...gameState,
    players: gameState.players.map(player => ({
      ...player,
      life: 40,
      commanderDamage: {},
      counters: { poison: 0, experience: 0, energy: 0 }
    })),
    currentTurn: 1,
    isStarted: false
  };
});

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children }) => children,
  Navigate: ({ to }) => `Redirect to ${to}`,
}));

jest.mock('react', () => {
  const original = jest.requireActual('react');
  return {
    ...original,
    useState: jest.fn((initial) => [initial, jest.fn()]),
  };
});

describe('Game Logic Tests', () => {
  let mockPlayers;
  let mockGameState;

  beforeEach(() => {
    mockPlayers = [
      { id: 1, name: 'Player 1', life: 40, commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 } },
      { id: 2, name: 'Player 2', life: 40, commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 } },
      { id: 3, name: 'Player 3', life: 40, commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 } }
    ];

    mockGameState = {
      players: [...mockPlayers],
      currentTurn: 1,
      isStarted: false,
      isPaused: false,
      turnTimes: [],
      gameStartTime: null
    };

    updateLife.mockClear();
    dealCommanderDamage.mockClear();
    updateCounters.mockClear();
    passTurn.mockClear();
    resetGame.mockClear();
  });

  describe('Life Total Management', () => {
    it('should correctly update a single player\'s life total', () => {
      const updatedPlayers = updateLife(1, -5, mockPlayers);
      expect(updatedPlayers[0].life).toBe(35);
    });

    it('should correctly update multiple players\' life totals', () => {
      const updatedPlayers = updateLife([1, 2], -5, mockPlayers);
      expect(updatedPlayers[0].life).toBe(35);
      expect(updatedPlayers[1].life).toBe(35);
    });

    it('should handle healing (positive life changes)', () => {
      const updatedPlayers = updateLife(1, 5, mockPlayers);
      expect(updatedPlayers[0].life).toBe(45);
    });
  });

  describe('Commander Damage Tracking', () => {
    it('should correctly track commander damage between players', () => {
      const updatedPlayers = dealCommanderDamage(2, 1, 5, mockPlayers);
      expect(updatedPlayers[1].commanderDamage[1]).toBe(5);
    });

    it('should accumulate commander damage from the same source', () => {
      let updatedPlayers = dealCommanderDamage(2, 1, 5, mockPlayers);
      updatedPlayers = dealCommanderDamage(2, 1, 5, updatedPlayers);
      expect(updatedPlayers[1].commanderDamage[1]).toBe(10);
    });
  });

  describe('Counter Management', () => {
    it('should correctly update poison counters', () => {
      const updatedPlayers = updateCounters(1, 'poison', 1, mockPlayers);
      expect(updatedPlayers[0].counters.poison).toBe(1);
    });

    it('should correctly update experience counters', () => {
      const updatedPlayers = updateCounters(1, 'experience', 2, mockPlayers);
      expect(updatedPlayers[0].counters.experience).toBe(2);
    });

    it('should prevent negative counter values', () => {
      const updatedPlayers = updateCounters(1, 'poison', -1, mockPlayers);
      expect(updatedPlayers[0].counters.poison).toBe(0);
    });
  });

  describe('Turn Management', () => {
    it('should correctly pass turn to next player', () => {
      const updatedState = passTurn(mockGameState);
      expect(updatedState.currentTurn).toBe(2);
    });

    it('should wrap around to first player after last player', () => {
      mockGameState.currentTurn = 3;
      const updatedState = passTurn(mockGameState);
      expect(updatedState.currentTurn).toBe(1);
    });
  });

  describe('Game State Transitions', () => {
    it('should correctly reset game state', () => {
      mockGameState.players[0].life = 30;
      mockGameState.players[1].commanderDamage[1] = 10;
      mockGameState.players[2].counters.poison = 5;
      mockGameState.currentTurn = 2;
      mockGameState.isStarted = true;

      const resetState = resetGame(mockGameState);

      expect(resetState.players[0].life).toBe(40);
      expect(resetState.players[1].commanderDamage[1]).toBe(undefined);
      expect(resetState.players[2].counters.poison).toBe(0);
      expect(resetState.currentTurn).toBe(1);
      expect(resetState.isStarted).toBe(false);
    });

    it('should maintain player order during reset', () => {
      const resetState = resetGame(mockGameState);
      expect(resetState.players.map(p => p.id)).toEqual([1, 2, 3]);
    });
  });
}); 