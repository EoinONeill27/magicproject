import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const originalDateNow = Date.now;
let mockNow = 1000000;

// We'll test the timer effect from App.tsx
describe('Timer Functionality', () => {
  let mockSetTurnTimer;
  let mockClearInterval;
  let mockSetInterval;
  let timerCallback;
  
  beforeEach(() => {
    // Reset mocks
    mockSetTurnTimer = jest.fn();
    mockClearInterval = jest.fn();
    mockSetInterval = jest.fn((callback, ms) => {
      timerCallback = callback;
      return 123; // Mock interval ID
    });
    
    // Mock Date.now to return predictable values
    Date.now = jest.fn(() => mockNow);
    
    // Mock setInterval and clearInterval
    global.setInterval = mockSetInterval;
    global.clearInterval = mockClearInterval;
  });
  
  afterEach(() => {
    // Restore Date.now
    Date.now = originalDateNow;
  });
  
  describe('Timer useEffect', () => {
    function simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime) {
      // This function simulates the timer effect from App.tsx
      let interval;
      if (isGameStarted && !isPaused && allDecksSelected) {
        interval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
          const minutes = Math.floor(elapsed / 60);
          const seconds = elapsed % 60;
          mockSetTurnTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
      }
      
      // Return cleanup function
      return () => {
        if (interval) clearInterval(interval);
      };
    }
    
    it('should not start timer when game is not started', () => {
      
      const isGameStarted = false;
      const isPaused = false;
      const allDecksSelected = true;
      const turnStartTime = 900000;
      
      
      simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      
      
      expect(mockSetInterval).not.toHaveBeenCalled();
    });
    
    it('should not start timer when game is paused', () => {
      
      const isGameStarted = true;
      const isPaused = true;
      const allDecksSelected = true;
      const turnStartTime = 900000;
      
      
      simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      
      
      expect(mockSetInterval).not.toHaveBeenCalled();
    });
    
    it('should not start timer when all decks are not selected', () => {
      
      const isGameStarted = true;
      const isPaused = false;
      const allDecksSelected = false;
      const turnStartTime = 900000;
      
      
      simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      
      
      expect(mockSetInterval).not.toHaveBeenCalled();
    });
    
    it('should start timer when conditions are met', () => {
      
      const isGameStarted = true;
      const isPaused = false;
      const allDecksSelected = true;
      const turnStartTime = 900000;
      
      
      simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      
      
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
    });
    
    it('should clear interval on cleanup', () => {
      
      const isGameStarted = true;
      const isPaused = false;
      const allDecksSelected = true;
      const turnStartTime = 900000;
      
      
      const cleanup = simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      cleanup();
      
      
      expect(mockClearInterval).toHaveBeenCalledWith(123);
    });
    
    it('should calculate elapsed time correctly', () => {
      
      const isGameStarted = true;
      const isPaused = false;
      const allDecksSelected = true;
      const turnStartTime = 990000; // 10 seconds ago
      mockNow = 1000000;
      
      
      simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      timerCallback(); // Call the callback manually
      
      
      expect(mockSetTurnTimer).toHaveBeenCalledWith('0:10');
    });
    
    it('should format timer with minutes and seconds correctly', () => {
      
      const isGameStarted = true;
      const isPaused = false;
      const allDecksSelected = true;
      const turnStartTime = 880000; // 2 minutes ago
      mockNow = 1000000;
      
      
      simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      timerCallback(); // Call the callback manually
      
      
      expect(mockSetTurnTimer).toHaveBeenCalledWith('2:00');
    });
    
    it('should pad seconds with leading zero', () => {
      
      const isGameStarted = true;
      const isPaused = false;
      const allDecksSelected = true;
      const turnStartTime = 993000; // 7 seconds ago
      mockNow = 1000000;
      
      
      simulateTimerEffect(isGameStarted, isPaused, allDecksSelected, turnStartTime);
      timerCallback(); // Call the callback manually
      
      
      expect(mockSetTurnTimer).toHaveBeenCalledWith('0:07');
    });
  });
  
  describe('Timer-related functions', () => {
    function mockTogglePause(isPaused, turnTimer, turnStartTime, gameStartTime, activeGameTime, lastPauseTime) {
      const now = Date.now();
      
      let newIsPaused, newTurnStartTime, newActiveGameTime, newLastPauseTime;
      
      if (isPaused) {
        // When unpausing, adjust the start time to maintain the correct elapsed time
        const [minutes, seconds] = turnTimer.split(':').map(Number);
        const elapsedSeconds = minutes * 60 + seconds;
        newTurnStartTime = now - elapsedSeconds * 1000;
        newIsPaused = false;
      } else {
        // When pausing, update the active game time
        const pauseDuration = now - (gameStartTime || now);
        newActiveGameTime = activeGameTime + pauseDuration;
        newLastPauseTime = now;
        newIsPaused = true;
      }
      
      return {
        isPaused: newIsPaused,
        turnStartTime: newTurnStartTime,
        activeGameTime: newActiveGameTime,
        lastPauseTime: newLastPauseTime
      };
    }
    
    it('should adjust turn start time when unpausing', () => {
      
      const isPaused = true;
      const turnTimer = '2:30';
      const turnStartTime = 900000;
      const gameStartTime = 850000;
      const activeGameTime = 50000;
      const lastPauseTime = 950000;
      mockNow = 1000000;
      
      
      const result = mockTogglePause(isPaused, turnTimer, turnStartTime, gameStartTime, activeGameTime, lastPauseTime);
      
      
      expect(result.isPaused).toBe(false);
      expect(result.turnStartTime).toBe(850000); // 1000000 - (2*60 + 30)*1000
    });
    
    it('should update active game time when pausing', () => {
      
      const isPaused = false;
      const turnTimer = '0:10';
      const turnStartTime = 990000;
      const gameStartTime = 900000;
      const activeGameTime = 0;
      const lastPauseTime = null;
      mockNow = 1000000;
      
      
      const result = mockTogglePause(isPaused, turnTimer, turnStartTime, gameStartTime, activeGameTime, lastPauseTime);
      
      
      expect(result.isPaused).toBe(true);
      expect(result.activeGameTime).toBe(100000); // 1000000 - 900000
      expect(result.lastPauseTime).toBe(1000000);
    });
  });
}); 