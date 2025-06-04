import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock implementations of the functions to test
const handleSelectDeck = (
  playerId, 
  isPaused, 
  players, 
  setPreDeckSelectionPauseState, 
  setBorrowedDeckIds, 
  setDeckSelectorPlayerId, 
  setShowDeckSelector
) => {
  // Save the current pause state
  setPreDeckSelectionPauseState(isPaused);
  
  // Set the player ID for the deck selector
  setDeckSelectorPlayerId(playerId);
  
  // If this player already has a deck, remove it from the borrowed list
  const currentPlayer = players.find(p => p.id === playerId);
  if (currentPlayer?.deckId) {
    setBorrowedDeckIds(prev => prev.filter(id => id !== currentPlayer.deckId));
  }
  
  // Show the deck selector
  setShowDeckSelector(true);
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
  // Update the player with the selected deck
  setPlayers(prevPlayers => {
    const updatedPlayers = prevPlayers.map(player => 
      player.id === playerId 
      ? { ...player, deckId, deckName } 
      : player
    );
    
    // Check if all players have now selected decks
    const allSelected = updatedPlayers.every(player => player.deckId && player.deckName);
    setAllDecksSelected(allSelected);
    
    // If all decks are now selected and weren't before, reset the timer
    if (allSelected && !allDecksSelected) {
      const now = Date.now();
      setTurnStartTime(now);
      setGameStartTime(now);
      setTurnTimer('0:00');
    }
    
    return updatedPlayers;
  });
  
  // Add the deck to the list of borrowed decks
  setBorrowedDeckIds(prev => [...prev, deckId]);
  
  // Hide the deck selector
  setShowDeckSelector(false);
  setDeckSelectorPlayerId(null);
  
  // Restore the pause state from before deck selection
  setIsPaused(preDeckSelectionPauseState);
};

// Mock the API
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children }) => children,
}));

// Mock the React useState hook
jest.mock('react', () => {
  const original = jest.requireActual('react');
  return {
    ...original,
    useState: jest.fn((initial) => [initial, jest.fn()]),
  };
});

describe('Deck Selection', () => {
  let mockSetPlayers;
  let mockSetAllDecksSelected;
  let mockSetBorrowedDeckIds;
  let mockSetShowDeckSelector;
  let mockSetDeckSelectorPlayerId;
  let mockSetPreDeckSelectionPauseState;
  let mockSetIsPaused;
  let mockSetTurnStartTime;
  let mockSetGameStartTime;
  let mockSetTurnTimer;
  
  const mockPlayers = [
    { id: 1, name: 'Player 1' },
    { id: 2, name: 'Player 2', deckId: 'deck-2', deckName: 'Goblin Tribal' },
    { id: 3, name: 'Player 3' },
    { id: 4, name: 'Player 4', deckId: 'deck-4', deckName: 'Elf Tribal' }
  ];
  
  beforeEach(() => {
    mockSetPlayers = jest.fn();
    mockSetAllDecksSelected = jest.fn();
    mockSetBorrowedDeckIds = jest.fn();
    mockSetShowDeckSelector = jest.fn();
    mockSetDeckSelectorPlayerId = jest.fn();
    mockSetPreDeckSelectionPauseState = jest.fn();
    mockSetIsPaused = jest.fn();
    mockSetTurnStartTime = jest.fn();
    mockSetGameStartTime = jest.fn();
    mockSetTurnTimer = jest.fn();
    
    // Reset mocks between tests
    jest.resetAllMocks();
  });

  describe('handleSelectDeck', () => {
    it('should save pause state before opening deck selector', () => {

      const isPaused = true;
      const playerId = 1;

      handleSelectDeck(playerId, isPaused, mockPlayers, mockSetPreDeckSelectionPauseState, 
                      mockSetBorrowedDeckIds, mockSetDeckSelectorPlayerId, mockSetShowDeckSelector);

      expect(mockSetPreDeckSelectionPauseState).toHaveBeenCalledWith(isPaused);
      expect(mockSetDeckSelectorPlayerId).toHaveBeenCalledWith(playerId);
      expect(mockSetShowDeckSelector).toHaveBeenCalledWith(true);
    });

    it('should remove player\'s previous deck from borrowed decks list', () => {

      const playerId = 2; // Player with existing deck
      const isPaused = false;

      handleSelectDeck(playerId, isPaused, mockPlayers, mockSetPreDeckSelectionPauseState,
                      mockSetBorrowedDeckIds, mockSetDeckSelectorPlayerId, mockSetShowDeckSelector);

      expect(mockSetBorrowedDeckIds).toHaveBeenCalled();
      // Verify the callback function removes the correct deck ID
      const borrowedDeckIdsCallback = mockSetBorrowedDeckIds.mock.calls[0][0];
      expect(borrowedDeckIdsCallback(['deck-2', 'deck-4'])).toEqual(['deck-4']);
    });
  });

  describe('handleDeckSelected', () => {
    it('should update player with selected deck', () => {

      const playerId = 1;
      const deckId = 'new-deck-1';
      const deckName = 'Dragon Tribal';
      const preDeckSelectionPauseState = false;
      const allDecksSelected = false;

      handleDeckSelected(playerId, deckId, deckName, mockPlayers, mockSetPlayers, 
                         mockSetAllDecksSelected, preDeckSelectionPauseState, mockSetIsPaused, 
                         mockSetBorrowedDeckIds, mockSetShowDeckSelector, mockSetDeckSelectorPlayerId,
                         mockSetTurnStartTime, mockSetGameStartTime, mockSetTurnTimer, allDecksSelected);

      expect(mockSetPlayers).toHaveBeenCalled();
      // Verify the callback correctly updates the player
      const playersCallback = mockSetPlayers.mock.calls[0][0];
      const updatedPlayers = playersCallback(mockPlayers);
      expect(updatedPlayers.find(p => p.id === playerId).deckId).toBe(deckId);
      expect(updatedPlayers.find(p => p.id === playerId).deckName).toBe(deckName);
    });

    it('should check if all players have selected decks', () => {

      const playerId = 3; // Last player without a deck
      const deckId = 'new-deck-3';
      const deckName = 'Wizard Tribal';
      const preDeckSelectionPauseState = false;
      const allDecksSelected = false;

      handleDeckSelected(playerId, deckId, deckName, mockPlayers, mockSetPlayers, 
                         mockSetAllDecksSelected, preDeckSelectionPauseState, mockSetIsPaused, 
                         mockSetBorrowedDeckIds, mockSetShowDeckSelector, mockSetDeckSelectorPlayerId,
                         mockSetTurnStartTime, mockSetGameStartTime, mockSetTurnTimer, allDecksSelected);

      expect(mockSetPlayers).toHaveBeenCalled();
      // Check if setAllDecksSelected is called properly
      const playersCallback = mockSetPlayers.mock.calls[0][0];
      playersCallback(mockPlayers);
      expect(mockSetAllDecksSelected).toHaveBeenCalled();
    });

    it('should reset timer when all decks are selected for the first time', () => {

      const playerId = 3; // Last player without a deck
      const deckId = 'new-deck-3';
      const deckName = 'Wizard Tribal';
      const preDeckSelectionPauseState = false;
      const allDecksSelected = false;
      const now = Date.now();
      // Mock Date.now
      const originalNow = Date.now;
      Date.now = jest.fn(() => now);

      handleDeckSelected(playerId, deckId, deckName, mockPlayers, mockSetPlayers, 
                         mockSetAllDecksSelected, preDeckSelectionPauseState, mockSetIsPaused, 
                         mockSetBorrowedDeckIds, mockSetShowDeckSelector, mockSetDeckSelectorPlayerId,
                         mockSetTurnStartTime, mockSetGameStartTime, mockSetTurnTimer, allDecksSelected);

      const playersCallback = mockSetPlayers.mock.calls[0][0];
      const updatedPlayers = playersCallback([
        { id: 1, deckId: 'deck-1', deckName: 'Deck 1' },
        { id: 2, deckId: 'deck-2', deckName: 'Deck 2' },
        { id: 3, deckId: null, deckName: null },
        { id: 4, deckId: 'deck-4', deckName: 'Deck 4' }
      ]);
      
      // Check if the timer was reset
      expect(mockSetTurnStartTime).toHaveBeenCalledWith(now);
      expect(mockSetGameStartTime).toHaveBeenCalledWith(now);
      expect(mockSetTurnTimer).toHaveBeenCalledWith('0:00');
      
      // Restore original Date.now
      Date.now = originalNow;
    });

    it('should update borrowedDeckIds with the newly selected deck', () => {

      const playerId = 1;
      const deckId = 'new-deck-1';
      const deckName = 'Dragon Tribal';
      const preDeckSelectionPauseState = false;
      const allDecksSelected = false;

      handleDeckSelected(playerId, deckId, deckName, mockPlayers, mockSetPlayers, 
                         mockSetAllDecksSelected, preDeckSelectionPauseState, mockSetIsPaused, 
                         mockSetBorrowedDeckIds, mockSetShowDeckSelector, mockSetDeckSelectorPlayerId,
                         mockSetTurnStartTime, mockSetGameStartTime, mockSetTurnTimer, allDecksSelected);

      expect(mockSetBorrowedDeckIds).toHaveBeenCalled();
      
      // Test the callback function
      const borrowedDeckIdsCallback = mockSetBorrowedDeckIds.mock.calls[0][0];
      const updatedBorrowedDeckIds = borrowedDeckIdsCallback(['deck-2', 'deck-4']);
      
      // Should contain the other deck IDs plus the new one
      expect(updatedBorrowedDeckIds).toContain('deck-2');
      expect(updatedBorrowedDeckIds).toContain('deck-4');
      expect(updatedBorrowedDeckIds).toContain(deckId);
    });
  });
}); 