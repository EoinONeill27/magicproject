import { useState, useEffect } from 'react';
import { Heart, HeartCrack, RotateCcw, Users, Trophy, Undo2, Clock, RotateCw, Timer, Pause, Play, Menu, UserPlus, LogOut, Droplets, X, Box, Check, BarChart4 } from 'lucide-react';
import { Player, HistoryEntry, User, Playgroup, GameResult } from './types';
import { deepClone } from './utils';
import AuthScreen from './components/Auth/AuthScreen';
import PlayerCard from './components/PlayerCard';
import api from './services/api';
import GameHistory from './components/GameHistory';
import PlaygroupSelector from './components/PlaygroupSelector';
import UserStats from './components/UserStats';
import SaltinessRating from './components/SaltinessRating';
import DeckManager from './components/DeckManager';
import DeckSelector from './components/DeckSelector';
import DeckComparison from './components/DeckComparison';
import { updatePageTitle } from './main.tsx';

function App() {
  // Authentication state
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [playgroups, setPlaygroups] = useState<Playgroup[]>([]);
  
  // Game state
  const [turnCount, setTurnCount] = useState<number>(1);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [playerCount, setPlayerCount] = useState<2 | 4>(4);
  const [players, setPlayers] = useState<Player[]>([
    { 
      id: 1, 
      life: playerCount === 2 ? 20 : 40, 
      name: 'Player 1', 
      commanderDamage: {}, 
      counters: { poison: 0, experience: 0, energy: 0 },
      stats: { 
        damageDealt: 0, 
        commanderDamageDealt: 0, 
        eliminations: new Set<number>(), 
        turnTimes: [],
        damageInteractions: [],
        commanderDamageInteractions: [],
        eliminationInteractions: []
      } 
    },
    { 
      id: 2, 
      life: playerCount === 2 ? 20 : 40, 
      name: 'Player 2', 
      commanderDamage: {}, 
      counters: { poison: 0, experience: 0, energy: 0 },
      stats: { 
        damageDealt: 0, 
        commanderDamageDealt: 0, 
        eliminations: new Set<number>(), 
        turnTimes: [],
        damageInteractions: [],
        commanderDamageInteractions: [],
        eliminationInteractions: []
      } 
    },
    { 
      id: 3, 
      life: 40, 
      name: 'Player 3', 
      commanderDamage: {}, 
      counters: { poison: 0, experience: 0, energy: 0 },
      stats: { 
        damageDealt: 0, 
        commanderDamageDealt: 0, 
        eliminations: new Set<number>(), 
        turnTimes: [],
        damageInteractions: [],
        commanderDamageInteractions: [],
        eliminationInteractions: []
      } 
    },
    { 
      id: 4, 
      life: 40, 
      name: 'Player 4', 
      commanderDamage: {}, 
      counters: { poison: 0, experience: 0, energy: 0 },
      stats: { 
        damageDealt: 0, 
        commanderDamageDealt: 0, 
        eliminations: new Set<number>(), 
        turnTimes: [],
        damageInteractions: [],
        commanderDamageInteractions: [],
        eliminationInteractions: []
      } 
    }
  ].slice(0, playerCount));
  
  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([{
    players: [
      { id: 1, life: playerCount === 2 ? 20 : 40, name: 'Player 1', commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 }, stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] } },
      { id: 2, life: playerCount === 2 ? 20 : 40, name: 'Player 2', commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 }, stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] } },
    ].slice(0, playerCount),
    currentTurn: 1,
    turnCount: 1
  }]);

  // Timer states
  const [turnStartTime, setTurnStartTime] = useState<number>(0);
  const [turnTimer, setTurnTimer] = useState<string>('0:00');

  // UI states
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [showGameHistory, setShowGameHistory] = useState<boolean>(false);
  const [showUserStats, setShowUserStats] = useState<boolean>(false);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const [selectedPlaygroup, setSelectedPlaygroup] = useState<Playgroup | null>(null);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [showPlaygroupSelector, setShowPlaygroupSelector] = useState<boolean>(false);
  const [showWinnerSelector, setShowWinnerSelector] = useState<boolean>(false);

  // New state variables
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [currentPlaygroup, setCurrentPlaygroup] = useState<Playgroup | null>(null);

  // Add new state for poison elimination tracking
  const [showPoisonEliminationSelector, setShowPoisonEliminationSelector] = useState<boolean>(false);
  const [poisonEliminatedPlayer, setPoisonEliminatedPlayer] = useState<Player | null>(null);

  // Add state for saltiness ratings
  const [playerSaltinessRatings, setPlayerSaltinessRatings] = useState<{[playerId: number]: 'notSalty' | 'somewhatSalty' | 'extremelySalty'}>({});

  // New state for notifications
  const [notification, setNotification] = useState<{message: string, visible: boolean}>({message: '', visible: false});

  // Add state variable for first player
  const [firstPlayer, setFirstPlayer] = useState<number>(1);

  // Add state for active playtime tracking
  const [activeGameTime, setActiveGameTime] = useState<number>(0);
  const [lastPauseTime, setLastPauseTime] = useState<number>(0);

  // Add new state variable to show/hide DeckManager
  const [showDeckManager, setShowDeckManager] = useState<boolean>(false);

  // Add state for deck selection
  const [showDeckSelector, setShowDeckSelector] = useState<boolean>(false);
  const [deckSelectorPlayerId, setDeckSelectorPlayerId] = useState<number | null>(null);
  const [deckCreationPlayerName, setDeckCreationPlayerName] = useState<string | null>(null);
  // Track borrowed decks to prevent multiple players from using the same deck
  const [borrowedDeckIds, setBorrowedDeckIds] = useState<string[]>([]);

  // Add state for showing deck comparison
  const [showDeckComparison, setShowDeckComparison] = useState<boolean>(false);

  // Add new state for deck selection completion
  const [allDecksSelected, setAllDecksSelected] = useState<boolean>(false);

  // Add state to save pause state before deck selection
  const [preDeckSelectionPauseState, setPreDeckSelectionPauseState] = useState<boolean>(false);

  // Add an effect to log when showDeckManager changes
  useEffect(() => {
    if (showDeckManager) {
      console.log('showDeckManager state changed to true');
    }
  }, [showDeckManager]);

  // Update title when game starts or ends
  useEffect(() => {
    if (isGameStarted) {
      updatePageTitle('Active Game');
    } else {
      updatePageTitle('');
    }
  }, [isGameStarted]);

  // Update title when showing user stats
  useEffect(() => {
    if (showUserStats) {
      updatePageTitle('User Statistics');
    }
  }, [showUserStats]);

  // Update title when showing game history
  useEffect(() => {
    if (showGameHistory) {
      updatePageTitle('Game History');
    }
  }, [showGameHistory]);

  // Update title when showing playgroup selector
  useEffect(() => {
    if (showPlaygroupSelector) {
      updatePageTitle('Select Playgroup');
    }
  }, [showPlaygroupSelector]);

  // Update title when showing deck manager
  useEffect(() => {
    if (showDeckManager) {
      updatePageTitle('Deck Manager');
    }
  }, [showDeckManager]);

  // Fetch playgroups when component mounts or currentUser changes
  useEffect(() => {
    const fetchPlaygroups = async () => {
      if (currentUser) {
        try {
          const fetchedPlaygroups = await api.getPlaygroups();
          setPlaygroups(fetchedPlaygroups);
        } catch (error) {
          console.error('Error fetching playgroups:', error);
        }
      }
    };

    fetchPlaygroups();
  }, [currentUser]);

  // Helper functions
  const getWinner = () => {
    const alivePlayers = players.filter(player => !player.isDead);
    return alivePlayers.length === 1 ? alivePlayers[0] : null;
  };

  // Save users to localStorage when they change
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Save initial state to history when component mounts
  useEffect(() => {
    setHistory([{
      players: deepClone(players),
      currentTurn,
      turnCount
    }]);
  }, [playerCount]);

  // Clear damage indicators after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setPlayers(players.map(player => ({
        ...player,
        lastDamagedBy: undefined
      })));
    }, 1000);

    return () => clearTimeout(timer);
  }, [players]);

  // Update timer effect to respect pause state and game start
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGameStarted && !isPaused && allDecksSelected) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - turnStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        setTurnTimer(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGameStarted, isPaused, turnStartTime, allDecksSelected]);

  // Update winner logic to save game result
  useEffect(() => {
    const winner = getWinner();
    if (winner && !winner.gameSaved) {
      // Instead of saving automatically, show the winner selector with saltiness ratings
      setShowWinnerSelector(true);
      
      // Mark the winner as saved to prevent duplicate detection
      setPlayers(players.map(p => 
        p.id === winner.id ? { ...p, gameSaved: true } : p
      ));
    }
  }, [players]);

  // Handle user authentication
  const handleAuthenticated = (user: User) => {
    console.log('handleAuthenticated called with user:', user);
    
    // Set current user
    setCurrentUser(user);
    console.log('Current user set');
    
    // Initialise player names with the authenticated user
    const newNames = [...playerNames];
    newNames[0] = user.username;
    setPlayerNames(newNames);
    console.log('Player names initialised:', newNames);
    
    // Reset game state
    setIsGameStarted(false);
    setTurnCount(1);
    setCurrentTurn(1);
    setTurnStartTime(0);
    console.log('Game state reset');
    
    // Reset players to initial state
    const initialPlayers = [
      { id: 1, life: 20, name: user.username, commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 }, stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] } },
      { id: 2, life: 20, name: 'Player 2', commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 }, stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] } },
      { id: 3, life: 40, name: 'Player 3', commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 }, stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] } },
      { id: 4, life: 40, name: 'Player 4', commanderDamage: {}, counters: { poison: 0, experience: 0, energy: 0 }, stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] } }
    ].slice(0, playerCount);
    
    setPlayers(initialPlayers);
    console.log('Players initialised:', initialPlayers);
    
    // Reset history
    setHistory([]);
    console.log('History reset');
    
    // Force a re-render
    console.log('All state updates completed');
  };

  const updateLife = (playerIds: number | number[], amount: number, sourcePlayerId?: number) => {
    setHistory(prev => [...prev, {
      players: deepClone(players),
      currentTurn,
      turnCount
    }]);

    if (amount >= 0 || !sourcePlayerId) {
      const updatedPlayers = players.map(player => {
        const newLife = Array.isArray(playerIds) ? 
          (playerIds.includes(player.id) ? Math.max(0, player.life + amount) : player.life) :
          (player.id === playerIds ? Math.max(0, player.life + amount) : player.life);
        
        // Mark player as dead if life reaches 0
        const isDead = newLife === 0;
        return {
          ...player,
          life: newLife,
          isDead: isDead || player.isDead // Keep existing isDead state if already dead
        };
      });

      setPlayers(updatedPlayers);
      return;
    }

    // Handle damage and eliminations
    const updatedPlayers = [...players];
    const sourcePlayer = updatedPlayers.find(p => p.id === sourcePlayerId);
    
    if (sourcePlayer) {
      // Process each target
      const targetIds = Array.isArray(playerIds) ? playerIds : [playerIds];
      
      // Track total damage dealt in this action
      let totalDamageDealt = 0;
      
      targetIds.forEach(targetId => {
        const targetPlayer = updatedPlayers.find(p => p.id === targetId);
        if (targetPlayer && !targetPlayer.isDead) {
          const newLife = Math.max(0, targetPlayer.life + amount);
          const damageDealt = Math.abs(amount);
          
          // Mark player as dead if life reaches 0
          if (newLife === 0 && !targetPlayer.isDead) {
            targetPlayer.isDead = true;
            sourcePlayer.stats.eliminations.add(targetId);
            // Add elimination interaction
            sourcePlayer.stats.eliminationInteractions.push({
              eliminatedPlayer: targetPlayer.name
            });
          }

          targetPlayer.life = newLife;
          targetPlayer.lastDamagedBy = sourcePlayerId;
          
          // Add damage interaction
          sourcePlayer.stats.damageInteractions.push({
            targetPlayer: targetPlayer.name,
            amount: damageDealt
          });
          
          // Add damage to total for this action
          totalDamageDealt += damageDealt;
        }
      });

      // Update source player's damage dealt stats once for all targets
      sourcePlayer.stats.damageDealt += totalDamageDealt;
    }

    setPlayers(updatedPlayers);
  };

  const passTurn = () => {
    if (!allDecksSelected) {
      showNotification('Please wait for all players to select their decks before taking game actions');
      return;
    }
    
    // Calculate turn duration for the current player
    const turnDuration = Math.floor((Date.now() - turnStartTime) / 1000);
    
    // Update current player's stats with their turn time
    setPlayers(prevPlayers => prevPlayers.map(player =>
      player.id === currentTurn
        ? {
            ...player,
            stats: {
              ...player.stats,
              turnTimes: [...(player.stats.turnTimes || []), turnDuration]
            }
          }
        : player
    ));

    // Save current state before passing turn
    setHistory(prev => [...prev, {
      players: deepClone(players),
      currentTurn,
      turnCount
    }]);

    const alivePlayers = players.filter(p => !p.isDead).map(p => p.id);
    const currentIndex = alivePlayers.indexOf(currentTurn);
    const nextIndex = (currentIndex + 1) % alivePlayers.length;
    const nextPlayer = alivePlayers[nextIndex];
    
    // Update firstPlayer if the current firstPlayer is eliminated
    if (!alivePlayers.includes(firstPlayer)) {
      setFirstPlayer(alivePlayers[0]);
    }
    
    // When we complete a full cycle, increment the turn count
    // Only check if we return to the first player, NOT based on array index
    if (nextPlayer === firstPlayer) {
      setTurnCount(prev => prev + 1);
    }
    
    setCurrentTurn(nextPlayer);
    setTurnStartTime(Date.now()); // Reset timer for new turn
  };

  const undo = () => {
    if (history.length > 1) { // Change condition to check for more than 1 state
      const previousState = history[history.length - 2]; // Get second-to-last state
      
      if (previousState.currentTurn !== currentTurn) {
        setTurnStartTime(Date.now());
      }

      const restoredPlayers = previousState.players.map(p => deepClone(p));
      
      setPlayers(restoredPlayers);
      setCurrentTurn(previousState.currentTurn);
      setTurnCount(previousState.turnCount);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  // Reset the game state for a new game
  const resetGame = () => {
    // Reset turn count but maintain first player
    setTurnCount(1);
    setCurrentTurn(firstPlayer);
    
    // Reset players
    setPlayers(players.map(p => ({
      ...p,
      life: playerCount === 2 ? 20 : 40,
      commanderDamage: {},
      isDead: false,
      lastDamagedBy: undefined,
      counters: { poison: 0, experience: 0, energy: 0 },
      deckId: undefined,
      deckName: undefined,
      stats: {
        damageDealt: 0,
        commanderDamageDealt: 0,
        eliminations: new Set<number>(),
        turnTimes: [],
        damageInteractions: [],
        commanderDamageInteractions: [],
        eliminationInteractions: []
      }
    })));
    
    // Clear history by setting a new initial state with resetted players
    const initializedPlayers = players.map(p => ({
      ...p,
      life: playerCount === 2 ? 20 : 40,
      commanderDamage: {},
      isDead: false,
      lastDamagedBy: undefined,
      counters: { poison: 0, experience: 0, energy: 0 },
      deckId: undefined,
      deckName: undefined,
      stats: {
        damageDealt: 0,
        commanderDamageDealt: 0,
        eliminations: new Set<number>(),
        turnTimes: [],
        damageInteractions: [],
        commanderDamageInteractions: [],
        eliminationInteractions: []
      }
    }));
    
    setHistory([{
      players: initializedPlayers,
      currentTurn: firstPlayer,
      turnCount: 1
    }]);
    
    // Reset time tracking
    const now = Date.now();
    setTurnStartTime(now);
    setTurnTimer('0:00');
    setActiveGameTime(0);
    setGameStartTime(now);
    
    // Clear borrowed decks
    setBorrowedDeckIds([]);
    
    // Reset saltiness ratings
    setPlayerSaltinessRatings({});
    
    // Show notification about who is going first
    const firstPlayerName = players.find(p => p.id === firstPlayer)?.name || `Player ${firstPlayer}`;
    showNotification(`Game reset! ${firstPlayerName} will go first.`);
  };

  // Add this new effect to clear borrowed decks when a game ends
  useEffect(() => {
    if (!isGameStarted) {
      setBorrowedDeckIds([]);
      // Also reset the deck selection state when the game ends
      setAllDecksSelected(false);
    }
  }, [isGameStarted]);

  // Add toggle pause function
  const togglePause = () => {
    const now = Date.now();
    
    if (isPaused) {
      // When unpausing, adjust the start time to maintain the correct elapsed time
      const [minutes, seconds] = turnTimer.split(':').map(Number);
      const elapsedSeconds = minutes * 60 + seconds;
      setTurnStartTime(now - elapsedSeconds * 1000);
    } else {
      // When pausing, update the active game time
      const pauseDuration = now - (gameStartTime || now);
      setActiveGameTime(prev => prev + pauseDuration);
      setLastPauseTime(now);
    }
    
    setIsPaused(!isPaused);
  };

  const dealCommanderDamage = (targetId: number, sourceId: number, amount: number) => {
    setHistory(prev => [...prev, {
      players: deepClone(players),
      currentTurn,
      turnCount
    }]);

    const updatedPlayers = [...players];
    const targetPlayer = updatedPlayers.find(p => p.id === targetId);
    const sourcePlayer = updatedPlayers.find(p => p.id === sourceId);

    if (targetPlayer && sourcePlayer && amount < 0) {
      const currentCommanderDamage = targetPlayer.commanderDamage[sourceId] || 0;
      const newCommanderDamage = Math.max(0, currentCommanderDamage + 1);
      const wasAlreadyDead = targetPlayer.isDead;
      const isNewlyDead = newCommanderDamage >= 21 && !wasAlreadyDead;

      // Update commander damage
      targetPlayer.commanderDamage[sourceId] = newCommanderDamage;
      
      // Add commander damage interaction
      sourcePlayer.stats.commanderDamageInteractions.push({
        targetPlayer: targetPlayer.name,
        amount: 1
      });
      
      // Update life and death status
      const newLife = Math.max(0, targetPlayer.life + amount);
      targetPlayer.life = newLife;

      // Check if player should be eliminated (either from commander damage or life total)
      if ((isNewlyDead || newLife === 0) && !wasAlreadyDead) {
        targetPlayer.isDead = true;
        sourcePlayer.stats.eliminations.add(targetId);
        // Add elimination interaction
        sourcePlayer.stats.eliminationInteractions.push({
          eliminatedPlayer: targetPlayer.name
        });
      }

      // Update source player's stats
      sourcePlayer.stats.commanderDamageDealt += 1;
      targetPlayer.lastDamagedBy = sourceId;
    }

    setPlayers(updatedPlayers);
  };

  // Add function to format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Update calculateTotalTurnTime to handle undefined/empty arrays
  const calculateTotalTurnTime = (times: number[]) => {
    if (!times || times.length === 0) return 0;
    return times.reduce((a, b) => a + b, 0);
  };

  const startGame = () => {
    if (!allDecksSelected) {
      showNotification('Please wait for all players to select their decks before starting the game');
      return;
    }
    
    // Initialise players with custom names
    const initializedPlayers = playerNames.slice(0, playerCount).map((name, index) => ({
      id: index + 1,
      life: playerCount === 2 ? 20 : 40,
      name: name || `Player ${index + 1}`, // Default name if empty
      commanderDamage: {},
      counters: { poison: 0, experience: 0, energy: 0 },
      stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] }
    }));

    setPlayers(initializedPlayers);
    
    // Initialise history with new players to prevent undo from previous games
    setHistory([{
      players: initializedPlayers,
      currentTurn: 1,
      turnCount: 1
    }]);
    
    // Always reset current turn to 1 when starting a new game
    setCurrentTurn(1);
    
    setIsGameStarted(true);
    const now = Date.now();
    setGameStartTime(now); // Set game start time when game starts
    setTurnStartTime(now); // Start the timer when game starts
    setTurnTimer('0:00'); // Reset turn timer display
    setIsPaused(false);
  };

  // Update game over to save game history
  const saveGameResult = async (winner: Player) => {
    if (!currentUser) return;
    
    console.log("Saving game result with winner:", winner);
    console.log("Current players state:", players);
    console.log("Saltiness ratings:", playerSaltinessRatings);
    
    // Calculate winner's total turn time
    const winnerTurnTime = calculateTotalTurnTime(players.find(p => p.id === winner.id)?.stats.turnTimes || []);
    
    // Calculate average turn time across all players
    const allTurnTimes = players.reduce((total, player) => {
      return total + calculateTotalTurnTime(player.stats.turnTimes);
    }, 0);
    
    const avgTurnTime = Math.round(allTurnTimes / players.length);
    
    // Calculate active play time (excluding pauses)
    let totalActiveTime = activeGameTime;
    
    // If game is not paused when ended, add the final active segment
    if (!isPaused) {
      totalActiveTime += Math.floor((Date.now() - (lastPauseTime || gameStartTime)) / 1000);
    }
    
    // Create player stats array in the same order as players array
    const playerStats = players.map(player => {
      // Log the raw data from the player
      console.log(`Raw player stats for ${player.name}:`, {
        damageDealt: player.stats.damageDealt,
        commanderDamageDealt: player.stats.commanderDamageDealt,
        eliminations: Array.from(player.stats.eliminations),
        eliminationInteractions: player.stats.eliminationInteractions,
        damageInteractions: player.stats.damageInteractions,
        commanderDamageInteractions: player.stats.commanderDamageInteractions
      });
      
      // Make sure all interaction arrays are initialised
      const damageInteractions = Array.isArray(player.stats.damageInteractions) 
        ? player.stats.damageInteractions 
        : [];
        
      const commanderDamageInteractions = Array.isArray(player.stats.commanderDamageInteractions) 
        ? player.stats.commanderDamageInteractions 
        : [];
        
      const eliminationInteractions = Array.isArray(player.stats.eliminationInteractions) 
        ? player.stats.eliminationInteractions 
        : [];
      
      // Log what we're returning
      const playerGameStats = {
        damageDealt: player.stats.damageDealt,
        commanderDamageDealt: player.stats.commanderDamageDealt,
        eliminations: player.stats.eliminations.size, // Convert Set to number
        totalTurnTime: calculateTotalTurnTime(player.stats.turnTimes),
        saltinessRating: playerSaltinessRatings[player.id],
        // Include interaction arrays
        damageInteractions,
        commanderDamageInteractions,
        eliminationInteractions
      };
      
      console.log(`Processed player stats for ${player.name}:`, playerGameStats);
      return playerGameStats;
    });

    // Add deck information to save with the game
    const playerDecks = players
      .filter(player => player.deckId && player.deckName)
      .map(player => ({
        playerId: player.id,
        playerName: player.name,
        deckId: player.deckId!,
        deckName: player.deckName!
      }));

    const gameResult: GameResult = {
      date: new Date().toISOString(),
      winner: winner.name,
      players: players.map(p => p.name),
      playerCount: players.length,
      turnCount,
      duration: Math.floor((Date.now() - gameStartTime) / 1000),
      activeDuration: totalActiveTime,
      avgTurnTime,
      playgroupName: currentPlaygroup?.name,
      playerStats,
      playerDecks: playerDecks.length > 0 ? playerDecks : undefined
    };

    console.log("Final game result object:", JSON.stringify(gameResult, null, 2));

    try {
      await api.saveGameResult(gameResult);
      console.log("Game result saved successfully");
      
      // Update local state for current user
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          gameHistory: [gameResult, ...currentUser.gameHistory]
        };
        setCurrentUser(updatedUser);
      }

      // Update deck stats if winner has a deck assigned
      const winnerDeck = winner.deckId;
      if (winnerDeck) {
        try {
          await api.incrementDeckWin(winnerDeck);
          console.log(`Updated win count for deck ${winnerDeck}`);
        } catch (error) {
          console.error('Error incrementing deck win count:', error);
        }
      }

      // Update play count for all decks used in the game
      for (const player of players) {
        if (player.deckId && player.id !== winner.id) {
          try {
            await api.incrementDeckPlay(player.deckId);
            console.log(`Updated play count for deck ${player.deckId}`);
          } catch (error) {
            console.error('Error incrementing deck play count:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error saving game result:', error);
    }
  };

  // Show a temporary notification
  const showNotification = (message: string) => {
    setNotification({message, visible: true});
    setTimeout(() => {
      setNotification({message: '', visible: false});
    }, 3000);
  };

  // Update handleSelectPlaygroupMembers to handle any number of players and random first player selection
  const handleSelectPlaygroupMembers = (members: string[], playgroup: Playgroup, startingLife: number = 40, randomizeFirstPlayer: boolean = false) => {
    // Set player count first
    setPlayerCount(members.length as 2 | 4);
    
    // Set both playgroup states
    setSelectedPlaygroup(playgroup);
    setCurrentPlaygroup(playgroup);
    
    // Create a new array with the selected members, padding with empty strings if needed
    const newPlayerNames = [...members];
    while (newPlayerNames.length < 4) {
      newPlayerNames.push('');
    }
    
    // Set player names
    setPlayerNames(newPlayerNames);
    
    // Initialise players with the correct count and names
    const initializedPlayers = newPlayerNames.slice(0, members.length).map((name, index) => ({
      id: index + 1,
      life: startingLife, // Use the provided starting life total
      name: name || `Player ${index + 1}`,
      commanderDamage: {},
      counters: { poison: 0, experience: 0, energy: 0 },
      stats: { damageDealt: 0, commanderDamageDealt: 0, eliminations: new Set<number>(), turnTimes: [], damageInteractions: [], commanderDamageInteractions: [], eliminationInteractions: [] }
    }));
    
    setPlayers(initializedPlayers);
    
    // Always reset turn count when starting new game
    setTurnCount(1);
    
    // Initialise the history with the new players to prevent undo from previous games
    setHistory([{
      players: initializedPlayers,
      currentTurn: 1,
      turnCount: 1
    }]);
    
    setIsGameStarted(true);
    const now = Date.now();
    setGameStartTime(now); // Set game start time when game starts
    setTurnStartTime(now); // Start the timer when game starts
    setTurnTimer('0:00'); // Reset turn timer display
    
    // Reset saltiness ratings
    setPlayerSaltinessRatings({});
    
    // Reset borrowed decks
    setBorrowedDeckIds([]);

    let firstPlayerId = 1; // Default first player

    // If random first player is enabled, set a random player as the first player
    if (randomizeFirstPlayer && members.length > 0) {
      const randomIndex = Math.floor(Math.random() * members.length);
      firstPlayerId = randomIndex + 1; // Player IDs are 1-based
      setCurrentTurn(firstPlayerId);
      
      // Show notification about random selection
      showNotification(`${newPlayerNames[randomIndex]} was randomly selected to go first!`);
    } else {
      // Make sure to set current turn if not randomising
      setCurrentTurn(1);
    }

    // Set the first player so we can track when we complete a full turn
    setFirstPlayer(firstPlayerId);
  };

  // Update handleManualGameEnd to check if there's already a winner
  const handleManualGameEnd = async (winner: Player, openPlaygroupSelector: boolean = false) => {
    console.log("handleManualGameEnd called with winner:", winner);
    
    // If this was from auto-detection (single player left), we need to verify it's the right player
    if (getWinner() && winner.id !== getWinner()?.id) {
      console.log("Selected winner differs from auto-detected winner, resetting gameSaved flag");
      // If the selected winner is not the last player alive, reset the gameSaved flag
      setPlayers(players.map(p => ({...p, gameSaved: false})));
    }
    
    // Log detailed player stats before saving
    console.log("Players before saving:", players.map(p => ({
      id: p.id,
      name: p.name,
      stats: {
        damageDealt: p.stats.damageDealt,
        commanderDamageDealt: p.stats.commanderDamageDealt,
        eliminations: Array.from(p.stats.eliminations),
        eliminationInteractions: p.stats.eliminationInteractions,
        damageInteractions: p.stats.damageInteractions,
        commanderDamageInteractions: p.stats.commanderDamageInteractions,
      }
    })));
    
    await saveGameResult(winner);
    console.log("Game result saved successfully");
    
    // Fetch fresh game history
    try {
      console.log("Fetching fresh game history...");
      const freshHistory = await api.getUserGameHistory();
      console.log("Fresh game history retrieved:", freshHistory);
      
      if (freshHistory && freshHistory.length > 0) {
        console.log("Most recent game data:", freshHistory[0]);
        console.log("Most recent game playerStats:", freshHistory[0].playerStats);
      }
      
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          gameHistory: freshHistory
        };
        console.log("Updating currentUser with fresh history");
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      console.error('Error fetching updated game history:', error);
    }
    
    setShowWinnerSelector(false);
    setIsMenuOpen(false);
    
    // Reset saltiness ratings for next game
    setPlayerSaltinessRatings({});
    
    if (openPlaygroupSelector) {
      resetGame();
      setShowPlaygroupSelector(true);
    } else {
      setIsGameStarted(false); // End the game
      setTurnStartTime(0); // Reset the timer
      setTurnTimer('0:00'); // Reset the timer display
      setAllDecksSelected(false); // Ensure deck selection state is reset
    }
  };

  // Update the updateCounter function to track poison eliminations
  const updateCounter = (playerId: number, counterType: 'poison' | 'experience' | 'energy', amount: number) => {
    setHistory(prev => [...prev, {
      players: deepClone(players),
      currentTurn,
      turnCount
    }]);

    const updatedPlayers = [...players];
    const targetPlayer = updatedPlayers.find(p => p.id === playerId);
    
    if (targetPlayer) {
      // Update the counter
      const newValue = Math.max(0, targetPlayer.counters[counterType] + amount);
      targetPlayer.counters[counterType] = newValue;
      
      // If poison reaches 10 or more, player dies
      if (counterType === 'poison' && newValue >= 10 && !targetPlayer.isDead) {
        targetPlayer.isDead = true;
        
        // If player is killed by poison, trigger selection of who poisoned them
        if (!poisonEliminatedPlayer) {
          setPoisonEliminatedPlayer(targetPlayer);
          setShowPoisonEliminationSelector(true);
          // The actual elimination interaction will be added after user selects the source
        }
      }

      setPlayers(updatedPlayers);
    }
  };

  // Add new function to handle poison elimination attribution
  const handlePoisonElimination = (sourcePlayerId: number) => {
    if (!poisonEliminatedPlayer) return;
    
    const updatedPlayers = [...players];
    const sourcePlayer = updatedPlayers.find(p => p.id === sourcePlayerId);
    const targetPlayer = updatedPlayers.find(p => p.id === poisonEliminatedPlayer.id);
    
    if (sourcePlayer && targetPlayer) {
      // Record the elimination
      sourcePlayer.stats.eliminations.add(targetPlayer.id);
      
      // Make sure eliminationInteractions is initialised
      if (!Array.isArray(sourcePlayer.stats.eliminationInteractions)) {
        sourcePlayer.stats.eliminationInteractions = [];
      }
      
      // Add elimination interaction
      sourcePlayer.stats.eliminationInteractions.push({
        eliminatedPlayer: targetPlayer.name
      });
      
      setPlayers(updatedPlayers);
    }
    
    // Reset selector state
    setPoisonEliminatedPlayer(null);
    setShowPoisonEliminationSelector(false);
  };

  // Add new function to handle saltiness ratings
  const handleSaltinessRating = (playerId: number, rating: 'notSalty' | 'somewhatSalty' | 'extremelySalty') => {
    setPlayerSaltinessRatings(prev => ({
      ...prev,
      [playerId]: rating
    }));
  };

  // Add handler for deck selection
  const handleSelectDeck = (playerId: number) => {
    // Save current pause state
    setPreDeckSelectionPauseState(isPaused);
    
    // Remove this player's deck from borrowedDeckIds before opening selector
    const currentPlayer = players.find(p => p.id === playerId);
    if (currentPlayer && currentPlayer.deckId) {
      setBorrowedDeckIds(prevIds => 
        prevIds.filter(id => id !== currentPlayer.deckId)
      );
    }
    
    setDeckSelectorPlayerId(playerId);
    setShowDeckSelector(true);
  };

  // Add handler for setting the selected deck to a player
  const handleDeckSelected = (playerId: number, deckId: string, deckName: string) => {
    setPlayers(prevPlayers => {
      const updatedPlayers = prevPlayers.map(player =>
        player.id === playerId
          ? {
              ...player,
              deckId,
              deckName
            }
          : player
      );
      
      // Check if all players have selected decks
      const allHaveDecks = updatedPlayers.every(player => player.deckId && player.deckName);
      
      // If this is the first time all decks are selected, reset the timer
      if (allHaveDecks && !allDecksSelected) {
        const now = Date.now();
        setTurnStartTime(now);
        setGameStartTime(now);
        setTurnTimer('0:00');
      }
      
      setAllDecksSelected(allHaveDecks);
      
      // Always restore the previous pause state (don't automatically pause)
      setIsPaused(preDeckSelectionPauseState);
      
      // Update borrowed deck IDs when a deck is selected
      setBorrowedDeckIds(prevBorrowedDeckIds => {
        // Get all deck IDs from players except the one for the current player
        const otherPlayerDeckIds = updatedPlayers
          .filter(p => p.id !== playerId && p.deckId)
          .map(p => p.deckId as string);
        
        // Add the newly selected deck ID
        return [...otherPlayerDeckIds, deckId];
      });
      
      return updatedPlayers;
    });
    setShowDeckSelector(false);
    setDeckSelectorPlayerId(null);
  };

  // Add this function before the return statement
  const getPlayerGridClasses = (): string => {
    const count = Number(playerCount);
    if (count <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid-cols-1 md:grid-cols-3';
    if (count === 4) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4';
    if (count <= 6) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  // Add function to determine user's favorite deck and its win rate
  const getFavoriteDeckInfo = () => {
    if (!currentUser?.gameHistory || currentUser.gameHistory.length === 0) {
      return null;
    }

    type DeckStats = {
      [deckId: string]: {
        name: string;
        plays: number;
        wins: number;
      }
    };

    // Track deck usage statistics
    const deckStats: DeckStats = {};
    
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
      
      // Initialise deck stats if this is the first time seeing this deck
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

  // If user is not authenticated, show auth screen
  if (!currentUser) {
  return (
      <AuthScreen 
        onAuthenticated={handleAuthenticated}
        users={users}
        setUsers={setUsers}
      />
    );
  }

  // If showing game history, render the GameHistory component
  if (showGameHistory && currentUser) {
    console.log('Rendering GameHistory with user:', currentUser);
    console.log('User game history:', currentUser.gameHistory);
    
    return (
      <GameHistory 
        user={currentUser} 
        onBack={() => {
          console.log('GameHistory onBack called');
          setShowGameHistory(false);
        }} 
      />
    );
  }

  // If showing user stats, render the UserStats component
  if (showUserStats && currentUser) {
    return (
      <UserStats
        username={currentUser.username}
        gameHistory={currentUser.gameHistory || []}
        onBack={() => setShowUserStats(false)}
        playgroups={playgroups}
      />
    );
  }

  // If showing deck manager, render the DeckManager component
  if (showDeckManager && currentUser) {
    console.log('Rendering DeckManager as separate view', deckCreationPlayerName ? `for player: ${deckCreationPlayerName}` : '');
    return (
      <DeckManager
        onBack={() => {
          console.log('DeckManager onBack called');
          setShowDeckManager(false);
          setDeckCreationPlayerName(null); // Reset when returning
        }}
        forPlayerName={deckCreationPlayerName}
      />
    );
  }

  // If showing deck comparison, render the DeckComparison component
  if (showDeckComparison && currentUser) {
    return (
      <DeckComparison 
        onBack={() => setShowDeckComparison(false)}
        username={currentUser.username}
        gameHistory={currentUser.gameHistory || []}
      />
    );
  }

  // Render the main menu if the game hasn't started
  if (!isGameStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
        {/* Mobile-friendly top bar that reverts to original corner positioning on desktop */}
        <div className="w-full flex justify-between items-center mb-6 sm:mb-20 sm:absolute sm:top-8 sm:left-0 sm:right-0 sm:px-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-lg rounded-lg px-3 py-2 sm:absolute sm:left-4">
            <Users size={18} className="text-white" />
            <span className="text-white font-medium">{currentUser.username}</span>
          </div>

          <button
            onClick={() => {
              api.logoutUser();
              setCurrentUser(null);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-3 py-2 rounded-lg flex items-center gap-1 sm:absolute sm:right-4"
            aria-label="Log Out"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Log Out</span>
          </button>
        </div>

        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 flex items-center justify-center gap-2">
            <Heart className="text-red-500 w-6 h-6 sm:w-8 sm:h-8" />
            <span>ManaLog</span>
            <HeartCrack className="text-red-500 w-6 h-6 sm:w-8 sm:h-8" />
          </h1>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto px-2">
            Welcome back, {currentUser.username}! Track your Magic: The Gathering games and compete with your playgroup.
          </p>
        </div>

        {/* Responsive grid with better mobile layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl mb-8 sm:mb-8 pb-24 sm:pb-0">
          {/* Quick Stats */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Trophy className="text-yellow-400" />
              Your Stats
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between text-white">
                <span>Games Played</span>
                <span className="font-bold">{currentUser.gameHistory?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-white">
                <span>Wins</span>
                <span className="font-bold">
                  {currentUser.gameHistory?.filter(game => game.winner === currentUser.username).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-white">
                <span>Win Rate</span>
                <span className="font-bold">
                  {currentUser.gameHistory?.length 
                    ? `${((currentUser.gameHistory.filter(game => game.winner === currentUser.username).length / currentUser.gameHistory.length) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              {/* Add Favorite Deck Stat */}
              {(() => {
                const favoriteDeck = getFavoriteDeckInfo();
                if (!favoriteDeck) return null;
                
                return (
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-white mb-1">
                      <span>Favorite Deck</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 truncate max-w-[70%]">{favoriteDeck.name}</span>
                      <span className="text-indigo-300 font-bold">
                        {favoriteDeck.winRate.toFixed(1)}% WR
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Quick Actions - Larger touch targets */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Users className="text-blue-400" />
              Quick Actions
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={() => setShowPlaygroupSelector(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 touch-manipulation"
              >
                <UserPlus size={18} />
                <span>Manage Playgroups</span>
              </button>
              <button
                onClick={() => {
                  if (currentUser) {
                    setShowGameHistory(true);
                  }
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 touch-manipulation"
              >
                <Clock size={18} />
                <span>Game History</span>
              </button>
              <button
                onClick={() => setShowUserStats(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 touch-manipulation"
              >
                <Trophy size={18} />
                <span>Detailed Personal Stats</span>
              </button>
              <button
                onClick={() => {
                  setShowDeckManager(true);
                  setIsMenuOpen(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 touch-manipulation"
              >
                <Box size={18} />
                <span>My Decks</span>
              </button>
              <button
                onClick={() => {
                  setShowDeckComparison(true);
                  setIsMenuOpen(false);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 touch-manipulation"
              >
                <BarChart4 size={18} />
                <span>Deck Stats</span>
              </button>
            </div>
          </div>

          {/* Recent Activity - Mobile optimised */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 flex items-center gap-2">
              <Clock className="text-green-400" />
              Recent Activity
            </h2>
            <div className="space-y-2 sm:space-y-3">
              {currentUser.gameHistory
                ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 5)
                .map((game, index) => (
                <div key={index} className="text-white/80 text-sm border-b border-white/10 pb-2 last:border-0">
                  <div className="flex items-center justify-between">
                    <span>{new Date(game.date).toLocaleDateString()}</span>
                    <span className="font-bold">{game.winner} won</span>
                  </div>
                  <div className="text-white/60 text-xs">
                    {game.playerCount} players • {game.turnCount} turns
                  </div>
                </div>
              ))}
              {(!currentUser.gameHistory || currentUser.gameHistory.length === 0) && (
                <p className="text-white/60 text-sm">No recent games</p>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action - Fixed at bottom for mobile */}
        <div className="fixed bottom-0 left-0 w-full bg-black/30 backdrop-blur-sm p-4 z-10 sm:static sm:bg-transparent sm:backdrop-blur-none">
          <button
            onClick={() => setShowPlaygroupSelector(true)}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-6 py-4 rounded-lg flex items-center justify-center gap-2 mx-auto text-lg shadow-lg touch-manipulation"
          >
            <UserPlus size={24} />
            Start a Game
          </button>
        </div>
        
        {showPlaygroupSelector && (
          <PlaygroupSelector
            currentUser={currentUser}
            onSelectMembers={handleSelectPlaygroupMembers}
            onBack={() => setShowPlaygroupSelector(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4 relative">
      {isPaused && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md mx-4">
            <Pause className="w-24 h-24 text-white mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Game Paused</h2>
            <button
              onClick={togglePause}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Play size={20} />
              Resume Game
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <div className="relative flex justify-end mb-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg"
            >
              <Menu size={24} />
            </button>
            
            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg shadow-lg overflow-hidden z-50">
                  {!isGameStarted ? (
                    <button
                      onClick={() => {
                        api.logoutUser();
                        setCurrentUser(null);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-white hover:bg-red-500/20 flex items-center gap-2"
                    >
                      <LogOut size={18} />
                      Log Out
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          resetGame();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-white hover:bg-white/20 flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Reset Game
          </button>
                      <button
                        onClick={() => {
                          togglePause();
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        {isPaused ? <Play size={18} /> : <Pause size={18} />}
                        {isPaused ? 'Resume Game' : 'Pause Game'}
                      </button>
                      <button
                        onClick={() => {
                          setShowWinnerSelector(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        <Trophy size={18} />
                        End Game & Select Winner
                      </button>
                      <button
                        onClick={() => {
                          setShowUserStats(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        <Trophy size={18} />
                        View My Stats
                      </button>
                      <button
                        onClick={() => {
                          setShowDeckManager(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        <Box size={18} />
                        View My Decks
                      </button>
                      <button
                        onClick={() => {
                          setShowDeckComparison(true);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-white hover:bg-white/20 flex items-center gap-2"
                      >
                        <BarChart4 size={18} />
                        Deck Statistics
                      </button>
                      <button
                        onClick={() => {
                          api.logoutUser();
                          setCurrentUser(null);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-white hover:bg-red-500/20 flex items-center gap-2"
                      >
                        <LogOut size={18} />
                        Log Out
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Heart className="text-red-500" />
            ManaLog
            <HeartCrack className="text-red-500" />
          </h1>
          <div className="text-white mb-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <RotateCw className="text-yellow-500" size={18} />
              <span>Turn {turnCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="text-yellow-500" size={18} />
              <span>{turnTimer}</span>
            </div>
          </div>
          <div className="flex justify-center gap-4 mb-4 flex-wrap">
          <button
              onClick={undo}
              disabled={history.length === 0}
              className={`text-white px-4 py-2 rounded-lg flex items-center gap-2 ${
                history.length === 0 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <Undo2 size={18} />
              Undo
          </button>
          <button
              onClick={passTurn}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
              <Clock size={18} />
              Pass Turn
          </button>
          </div>
        </header>

        <div className="flex flex-col items-center gap-4">
          {!allDecksSelected && (
            <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 p-3 rounded-lg text-center max-w-md">
              <p className="font-medium">All players must select decks before the game can begin</p>
              <p className="text-sm opacity-80 mt-1">The game timer and most actions will be disabled until all decks are selected</p>
            </div>
          )}

          <div className={`grid gap-3 w-full max-w-[1800px] mx-auto ${getPlayerGridClasses()}`}>
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                players={players}
                currentTurn={currentTurn}
                turnTimer={turnTimer}
                playerCount={playerCount}
                updateLife={updateLife}
                dealCommanderDamage={dealCommanderDamage}
                updateCounter={updateCounter}
                onSelectDeck={handleSelectDeck}
                allDecksSelected={allDecksSelected}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Winner selector with saltiness ratings */}
      {(showWinnerSelector || getWinner()) && isGameStarted && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {getWinner() ? (
              <div className="mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">Game Over!</h2>
                <div className="bg-indigo-500/20 rounded-lg p-3 text-white text-center mb-4">
                  <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-2 animate-bounce" />
                  <span className="font-medium text-xl text-yellow-400">{getWinner()?.name}</span> is the winner!
                </div>
                
                {/* Player Stats */}
                <h3 className="text-lg font-bold text-white mb-3">Game Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {players.map(player => (
                    <div key={player.id} className="text-white text-left bg-white/5 p-3 rounded-lg">
                      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                        {player.name}
                        {player.id === getWinner()?.id && (
                          <Trophy className="h-4 w-4 text-yellow-400" />
                        )}
                      </h3>
                      <ul className="space-y-1 text-sm">
                        <li>Damage Dealt: {player.stats.damageDealt}</li>
                        <li>Commander Damage: {player.stats.commanderDamageDealt}</li>
                        <li>Eliminations: {player.stats.eliminations.size}</li>
                        <li>Total Turn Time: {formatDuration(calculateTotalTurnTime(player.stats.turnTimes))}</li>
                        {player.stats.eliminations.size > 0 && (
                          <li>Eliminated: {Array.from(player.stats.eliminations).map(id => 
                            players.find(p => p.id === id)?.name
                          ).join(', ')}</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">Select the Winner</h2>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {players.map(player => (
            <div
              key={player.id}
                  className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-colors ${
                    !player.isDead 
                      ? `bg-${player.id === getWinner()?.id ? 'green' : 'indigo'}-600 hover:bg-${player.id === getWinner()?.id ? 'green' : 'indigo'}-700 text-white ${player.id === getWinner()?.id ? 'ring-2 ring-green-400' : ''}` 
                      : 'bg-gray-700 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span className="text-lg font-medium">{player.name}</span>
                  <span className="text-sm opacity-80">Life: {player.life}</span>
                  {player.id === getWinner()?.id && (
                    <span className="text-xs bg-green-500/50 px-2 py-1 rounded-full">Last Standing</span>
                  )}
                  {!player.isDead && player.id !== getWinner()?.id && (
                    <button
                      onClick={() => {
                        // Update all players to have gameSaved=false
                        const updatedPlayers = players.map(p => ({...p, gameSaved: false, isDead: p.id !== player.id && p.id !== getWinner()?.id}));
                        
                        // Mark this player as the winner
                        const winner = updatedPlayers.find(p => p.id === player.id);
                        if (winner) {
                          winner.gameSaved = true;
                          
                          // Set all other players as "dead" to make this the last player standing
                          updatedPlayers.forEach(p => {
                            if (p.id !== player.id) {
                              p.isDead = true;
                            }
                          });
                        }
                        
                        // Update the players state
                        setPlayers(updatedPlayers);
                      }}
                      className="mt-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm"
                    >
                      Select as Winner
                    </button>
                  )}
              </div>
              ))}
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 text-center">Rate Your Saltiness</h2>
            
            <div className="grid grid-cols-1 gap-4 mb-6">
              {players.map(player => (
                <SaltinessRating 
                  key={player.id}
                  playerId={player.id}
                  playerName={player.name}
                  onRatingSelect={handleSaltinessRating}
                />
              ))}
            </div>
            
              <div className="flex justify-center gap-4">
                <button
                onClick={() => setShowWinnerSelector(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                <X size={18} />
                Cancel
                </button>
                <button
                onClick={() => {
                  // Find the winner
                  const winner = getWinner();
                  if (winner) {
                    // Complete the game end handling
                    handleManualGameEnd(winner, false);
                    setShowWinnerSelector(false);
                  } else {
                    // No winner selected yet
                    alert("Please select a winner first");
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                <Check size={18} />
                Finish Game
                </button>
                <button
                onClick={async () => {
                  // First, save the current game data
                  const winner = getWinner();
                  if (winner) {
                    // Save the game result before resetting
                    await saveGameResult(winner);
                    
                    // Then reset the game state
                    resetGame();
                    setShowWinnerSelector(false);
                    // Keep the game started but reset it
                    setIsGameStarted(true);
                    // Make sure decks need to be selected again
                    setAllDecksSelected(false);
                  } else {
                    // No winner selected, show an alert
                    alert("Please select a winner first");
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                <RotateCcw size={18} />
                Play Again
                </button>
                <button
                onClick={() => {
                  resetGame();
                  setShowPlaygroupSelector(true);
                  setIsGameStarted(false); // Make sure the game interface is hidden
                  setShowWinnerSelector(false); // Hide the game over screen
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <UserPlus size={18} />
                New Players
                </button>
              </div>
            </div>
        </div>
      )}
      
      {/* Show PlaygroupSelector when needed, even in game interface */}
      {showPlaygroupSelector && (
        <PlaygroupSelector
          currentUser={currentUser}
          onSelectMembers={handleSelectPlaygroupMembers}
          onBack={() => setShowPlaygroupSelector(false)}
        />
      )}

      {/* Add Poison Elimination Selection Modal */}
      {showPoisonEliminationSelector && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-4">
            <Droplets className="w-24 h-24 text-green-400 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">Poison Elimination</h2>
            <p className="text-white/80 mb-6">
              {poisonEliminatedPlayer?.name} was eliminated by poison counters. 
              Select which player delivered the lethal poison.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {players
                .filter(p => !p.isDead && p.id !== poisonEliminatedPlayer?.id)
                .map(player => (
                <button
                    key={player.id}
                    onClick={() => handlePoisonElimination(player.id)}
                    className="bg-green-900/30 hover:bg-green-900/50 text-white p-4 rounded-lg transition-colors flex flex-col items-center"
                >
                    <h3 className="font-bold text-lg mb-2">{player.name}</h3>
                    <Droplets className="h-12 w-12 text-green-400 mb-2" />
                </button>
          ))}
        </div>
 
            <div className="flex gap-4 justify-center">
                <button
                onClick={() => setShowPoisonEliminationSelector(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
                >
                Cancel
                </button>
      </div>
            </div>
        </div>
      )}

      {notification.visible && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {notification.message}
      </div>
      )}

      {/* Deck Selector Modal */}
      {showDeckSelector && deckSelectorPlayerId && (
        <DeckSelector
          playerId={deckSelectorPlayerId}
          playerName={players.find(p => p.id === deckSelectorPlayerId)?.name || ''}
          borrowedDeckIds={borrowedDeckIds}
          onSelectDeck={handleDeckSelected}
          onCancel={() => {
            setShowDeckSelector(false);
            setDeckSelectorPlayerId(null);
            // Restore previous pause state when canceling
            setIsPaused(preDeckSelectionPauseState);
          }}
          onCreateNew={() => {
            // Close deck selector
            setShowDeckSelector(false);
            // Set player name for deck creation
            const playerName = players.find(p => p.id === deckSelectorPlayerId)?.name || '';
            setDeckCreationPlayerName(playerName || null);
            // Open deck manager
            setShowDeckManager(true);
            // Restore previous pause state when going to deck manager
            setIsPaused(preDeckSelectionPauseState);
          }}
        />
      )}
    </div>
  );
}

export default App;