import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const startGame = (
  allDecksSelected,
  showNotification,
  setIsGameStarted,
  setGameStartTime,
  setTurnStartTime,
  setTurnTimer,
  setIsPaused
) => {
  if (!allDecksSelected) {
    showNotification('Please wait for all players to select their decks before starting the game');
    return false;
  }
  
  setIsGameStarted(true);
  const now = Date.now();
  setGameStartTime(now);
  setTurnStartTime(now);
  setTurnTimer('0:00');
  setIsPaused(false);
  return true;
};

const handleDeckSelected = (
  playerId,
  deckId,
  deckName,
  players,
  setPlayers,
  setAllDecksSelected,
  preDeckSelectionPauseState,
  setIsPaused,
  setBorrowedDeckIds,
  setShowDeckSelector,
  setDeckSelectorPlayerId,
  setTurnStartTime,
  setGameStartTime,
  setTurnTimer,
  allDecksSelected
) => {
  setPlayers(prevPlayers => {
    const updatedPlayers = prevPlayers.map(player => 
      player.id === playerId 
        ? { ...player, deckId, deckName } 
        : player
    );

    const allSelected = updatedPlayers.every(player => player.deckId && player.deckName);
    setAllDecksSelected(allSelected);

    if (allSelected && !allDecksSelected) {
      const now = Date.now();
      setTurnStartTime(now);
      setGameStartTime(now);
      setTurnTimer('0:00');
    }
    
    return updatedPlayers;
  });

  setBorrowedDeckIds(prev => [...prev, deckId]);
  
  setShowDeckSelector(false);
  setDeckSelectorPlayerId(null);

  setIsPaused(preDeckSelectionPauseState);
};

describe('Game Start Requirements', () => {
  describe('Deck Selection Validation', () => {
    it('should identify when all players have selected decks', () => {
      const players = [
        { id: 1, name: 'Player 1', deckId: 'deck-1', deckName: 'Dragons' },
        { id: 2, name: 'Player 2', deckId: 'deck-2', deckName: 'Zombies' },
        { id: 3, name: 'Player 3', deckId: 'deck-3', deckName: 'Elves' },
      ];

      const allDecksSelected = players.every(player => player.deckId && player.deckName);

      expect(allDecksSelected).toBe(true);
    });
    
    it('should identify when a player has no deck selected', () => {

      const players = [
        { id: 1, name: 'Player 1', deckId: 'deck-1', deckName: 'Dragons' },
        { id: 2, name: 'Player 2', deckId: null, deckName: null },
        { id: 3, name: 'Player 3', deckId: 'deck-3', deckName: 'Elves' },
      ];

      const allDecksSelected = players.every(player => player.deckId && player.deckName);

      expect(allDecksSelected).toBe(false);
    });
    
    it('should identify when a player has deckId but no deckName', () => {

      const players = [
        { id: 1, name: 'Player 1', deckId: 'deck-1', deckName: 'Dragons' },
        { id: 2, name: 'Player 2', deckId: 'deck-2', deckName: '' },
        { id: 3, name: 'Player 3', deckId: 'deck-3', deckName: 'Elves' },
      ];

      const allDecksSelected = players.every(player => player.deckId && player.deckName);

      expect(allDecksSelected).toBe(false);
    });
  });
  
  describe('Game Start Function', () => {
    let mockShowNotification;
    let mockSetIsGameStarted;
    let mockSetGameStartTime;
    let mockSetTurnStartTime;
    let mockSetTurnTimer;
    let mockSetIsPaused;
    let mockDateNow;
    
    beforeEach(() => {
      mockShowNotification = jest.fn();
      mockSetIsGameStarted = jest.fn();
      mockSetGameStartTime = jest.fn();
      mockSetTurnStartTime = jest.fn();
      mockSetTurnTimer = jest.fn();
      mockSetIsPaused = jest.fn();
      mockDateNow = 1000000;
      
      Date.now = jest.fn(() => mockDateNow);
    });
    
    it('should not start game when decks are not all selected', () => {
      const result = startGame(
        false,
        mockShowNotification,
        mockSetIsGameStarted,
        mockSetGameStartTime,
        mockSetTurnStartTime,
        mockSetTurnTimer,
        mockSetIsPaused
      );

      expect(result).toBe(false);
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Please wait for all players to select their decks before starting the game'
      );
      expect(mockSetIsGameStarted).not.toHaveBeenCalled();
      expect(mockSetGameStartTime).not.toHaveBeenCalled();
      expect(mockSetTurnStartTime).not.toHaveBeenCalled();
      expect(mockSetTurnTimer).not.toHaveBeenCalled();
      expect(mockSetIsPaused).not.toHaveBeenCalled();
    });
    
    it('should start game when all decks are selected', () => {
      const result = startGame(
        true,
        mockShowNotification,
        mockSetIsGameStarted,
        mockSetGameStartTime,
        mockSetTurnStartTime,
        mockSetTurnTimer,
        mockSetIsPaused
      );

      expect(result).toBe(true);
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(mockSetIsGameStarted).toHaveBeenCalledWith(true);
      expect(mockSetGameStartTime).toHaveBeenCalledWith(mockDateNow);
      expect(mockSetTurnStartTime).toHaveBeenCalledWith(mockDateNow);
      expect(mockSetTurnTimer).toHaveBeenCalledWith('0:00');
      expect(mockSetIsPaused).toHaveBeenCalledWith(false);
    });
  });
  
  describe('Pass Turn Function', () => {
    let mockShowNotification;
    let mockSetHistory;
    let mockSetCurrentTurn;
    let mockSetTurnCount;
    let mockSetTurnStartTime;
    let mockPlayers;
    let mockCurrentTurn;
    let mockTurnCount;
    let mockFirstPlayer;
    let mockSetFirstPlayer;
    let mockDateNow;
    
    beforeEach(() => {
      mockShowNotification = jest.fn();
      mockSetHistory = jest.fn();
      mockSetCurrentTurn = jest.fn();
      mockSetTurnCount = jest.fn();
      mockSetTurnStartTime = jest.fn();
      mockSetFirstPlayer = jest.fn();
      mockPlayers = [
        { id: 1, name: 'Player 1', isDead: false },
        { id: 2, name: 'Player 2', isDead: false },
        { id: 3, name: 'Player 3', isDead: false },
      ];
      mockCurrentTurn = 1;
      mockTurnCount = 1;
      mockFirstPlayer = 1;
      mockDateNow = 1000000;
      
      Date.now = jest.fn(() => mockDateNow);
    });
    
    function mockPassTurn(allDecksSelected) {
      if (!allDecksSelected) {
        mockShowNotification('Please wait for all players to select their decks before taking game actions');
        return;
      }

      mockSetHistory(prev => [...prev, {
        players: mockPlayers,
        currentTurn: mockCurrentTurn,
        turnCount: mockTurnCount
      }]);
      
      const alivePlayers = mockPlayers.filter(p => !p.isDead).map(p => p.id);
      const currentIndex = alivePlayers.indexOf(mockCurrentTurn);
      const nextIndex = (currentIndex + 1) % alivePlayers.length;
      const nextPlayer = alivePlayers[nextIndex];

      if (!alivePlayers.includes(mockFirstPlayer)) {
        mockSetFirstPlayer(alivePlayers[0]);
      }

      if (nextPlayer === mockFirstPlayer) {
        mockSetTurnCount(prev => prev + 1);
      }
      
      mockSetCurrentTurn(nextPlayer);
      mockSetTurnStartTime(Date.now());
      
      return nextPlayer;
    }
    
    it('should not pass turn when decks are not all selected', () => {
      const result = mockPassTurn(false);

      expect(result).toBeUndefined();
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Please wait for all players to select their decks before taking game actions'
      );
      expect(mockSetHistory).not.toHaveBeenCalled();
      expect(mockSetCurrentTurn).not.toHaveBeenCalled();
      expect(mockSetTurnCount).not.toHaveBeenCalled();
      expect(mockSetTurnStartTime).not.toHaveBeenCalled();
    });
    
    it('should pass turn when all decks are selected', () => {
      const result = mockPassTurn(true);

      expect(result).toBe(2); // Next player's ID
      expect(mockShowNotification).not.toHaveBeenCalled();
      expect(mockSetHistory).toHaveBeenCalled();
      expect(mockSetCurrentTurn).toHaveBeenCalledWith(2);
      expect(mockSetTurnStartTime).toHaveBeenCalledWith(mockDateNow);
    });
    
    it('should increment turn count when cycle completes', () => {
      mockCurrentTurn = 3;
      mockPassTurn(true);
      expect(mockSetTurnCount).toHaveBeenCalled();
    });
    
    it('should skip dead players when passing turn', () => {
      mockPlayers = [
        { id: 1, name: 'Player 1', isDead: false },
        { id: 2, name: 'Player 2', isDead: true },
        { id: 3, name: 'Player 3', isDead: false },
      ];
      
      const result = mockPassTurn(true);
      
      expect(result).toBe(3);
      expect(mockSetCurrentTurn).toHaveBeenCalledWith(3);
    });
  });
}); 