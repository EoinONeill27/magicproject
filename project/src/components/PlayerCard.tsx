import { Heart, Plus, Minus, Swords, Skull, Clock, Zap, Droplets, Award, X, Box } from 'lucide-react';
import { Player } from '../types';
import { useState, useEffect } from 'react';

interface PlayerCardProps {
  player: Player;
  players: Player[];
  currentTurn: number;
  turnTimer: string;
  playerCount: number;
  updateLife: (playerIds: number | number[], amount: number, sourcePlayerId?: number) => void;
  dealCommanderDamage: (targetId: number, sourceId: number, amount: number) => void;
  updateCounter: (playerId: number, counterType: 'poison' | 'experience' | 'energy', amount: number) => void;
  onSelectDeck?: (playerId: number) => void; // Optional callback to select a deck
  allDecksSelected: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  players, 
  currentTurn, 
  turnTimer, 
  playerCount, 
  updateLife, 
  dealCommanderDamage,
  updateCounter,
  onSelectDeck,
  allDecksSelected
}) => {
  const [isGlowing, setIsGlowing] = useState(false);
  const [glowKey, setGlowKey] = useState(0);
  const [healAmount, setHealAmount] = useState<number | null>(null);
  const [showCounters, setShowCounters] = useState(false);
  const [lifelink, setLifelink] = useState(false);

  // Determine if we should use compact mode for games with many players
  const isCompact = playerCount > 4;

  const handleHeal = (amount: number) => {
    updateLife(player.id, amount);
    setIsGlowing(true);
    setHealAmount(amount);
    setGlowKey(prev => prev + 1); // Force animation to replay
  };

  useEffect(() => {
    if (isGlowing) {
      const timer = setTimeout(() => {
        setIsGlowing(false);
        setHealAmount(null);
      }, 1500); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isGlowing]);

  const handleCounterChange = (counterType: 'poison' | 'experience' | 'energy', amount: number) => {
    updateCounter(player.id, counterType, amount);
  };

  // Handle damage with lifelink
  const handleDamageWithLifelink = (targetId: number, amount: number, isCommanderDamage = false) => {
    // First deal damage
    if (isCommanderDamage) {
      dealCommanderDamage(targetId, player.id, amount);
    } else {
      updateLife(targetId, amount, player.id);
    }
    
    // If lifelink is active, heal this player by the absolute value of the damage amount
    if (lifelink && amount < 0) {
      const healValue = Math.abs(amount);
      handleHeal(healValue);
    }
  };

  // Handle damage to all other players with lifelink
  const handleDamageAllWithLifelink = () => {
    const otherPlayerIds = players
      .filter(otherPlayer => 
        otherPlayer.id !== player.id && 
        !otherPlayer.isDead
      )
      .map(p => p.id);
      
    if (otherPlayerIds.length > 0) {
      updateLife(otherPlayerIds, -1, player.id);
      
      // If lifelink is active, heal this player by the amount of damage dealt to all players
      if (lifelink) {
        handleHeal(otherPlayerIds.length);
      }
    }
  };

  // Determine the appropriate grid layout based on player count and screen size
  const getCounterGridLayout = () => {
    // For smaller screens, games with many players, or 4-player games, use a single column layout
    if (window.innerWidth < 640 || playerCount >= 4) {
      return "grid-cols-1";
    }
    
    // For 3-player games, use a 2-column layout which works better for the space
    if (playerCount === 3) {
      return "grid-cols-1 sm:grid-cols-2 gap-4";
    }
    
    // For 2-player games, there's enough space for 3 columns
    return "grid-cols-1 sm:grid-cols-3 gap-4";
  };

  return (
    <div
      key={glowKey} // Force re-render to replay animation
      className={`bg-white/10 backdrop-blur-lg rounded-xl ${isCompact ? 'p-3' : 'p-6'} text-center transition-all duration-1000 relative
        ${player.isDead ? 'opacity-50 scale-95 grayscale' : ''}
        ${player.lastDamagedBy ? 'ring-4 ring-red-500 ring-opacity-50' : ''}
        ${isGlowing ? 'animate-glow ring-4 ring-green-500 ring-opacity-75 z-50' : ''}
        ${currentTurn === player.id ? 'ring-4 ring-yellow-500 ring-opacity-75 z-10' : ''}`}
    >
      {currentTurn === player.id && !player.isDead && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <Clock size={12} />
          <span>Turn ({turnTimer})</span>
        </div>
      )}
      {player.lastDamagedBy && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
          From {players.find(p => p.id === player.lastDamagedBy)?.name}
        </div>
      )}
      {healAmount !== null && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded-full text-xs animate-fade-out">
          +{healAmount}
        </div>
      )}
      {player.isDead && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skull className={`${isCompact ? 'w-16 h-16' : 'w-24 h-24'} text-red-500 animate-bounce`} />
        </div>
      )}

      {/* Counter Management Overlay - Responsive layout*/}
      {showCounters && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 rounded-xl flex flex-col justify-center items-center overflow-auto">
          <button 
            onClick={() => setShowCounters(false)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
          
          <h3 className="text-white font-medium my-3 text-lg sticky top-0 bg-black/50 backdrop-blur-sm w-full text-center py-2">
            {player.name} - Counters
          </h3>
          
          <div className={`grid ${getCounterGridLayout()} gap-3 w-full px-3 pb-3`}>
            {/* Poison counters */}
            <div className="bg-green-900/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-green-400" />
                  <span className="text-green-400 text-sm font-medium">Poison</span>
                </div>
                <span className="text-white text-base font-bold">{player.counters.poison}/10</span>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleCounterChange('poison', -1)}
                  className="bg-green-500/30 hover:bg-green-500/50 text-white p-1 rounded-lg w-9 h-9 flex items-center justify-center"
                  disabled={player.counters.poison <= 0 || !allDecksSelected}
                >
                  <Minus size={16} />
                </button>
                <div className="bg-green-900/50 px-3 py-1 rounded-lg text-green-400 font-bold text-xl w-14 text-center">
                  {player.counters.poison}
                </div>
                <button
                  onClick={() => handleCounterChange('poison', 1)}
                  className="bg-green-500/50 hover:bg-green-500/70 text-white p-1 rounded-lg w-9 h-9 flex items-center justify-center"
                  disabled={!allDecksSelected}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-xs text-white/70 mt-2 text-center">
                {player.counters.poison >= 10 ? 
                  "Player is dead from poison!" : 
                  `${10 - player.counters.poison} more to die from poison`}
              </div>
            </div>
            
            {/* Experience counters */}
            <div className="bg-purple-900/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-purple-400" />
                  <span className="text-purple-400 text-sm font-medium">Experience</span>
                </div>
                <span className="text-white text-base font-bold">{player.counters.experience}</span>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleCounterChange('experience', -1)}
                  className="bg-purple-500/30 hover:bg-purple-500/50 text-white p-1 rounded-lg w-9 h-9 flex items-center justify-center"
                  disabled={player.counters.experience <= 0 || !allDecksSelected}
                >
                  <Minus size={16} />
                </button>
                <div className="bg-purple-900/50 px-3 py-1 rounded-lg text-purple-400 font-bold text-xl w-14 text-center">
                  {player.counters.experience}
                </div>
                <button
                  onClick={() => handleCounterChange('experience', 1)}
                  className="bg-purple-500/50 hover:bg-purple-500/70 text-white p-1 rounded-lg w-9 h-9 flex items-center justify-center"
                  disabled={!allDecksSelected}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            {/* Energy counters */}
            <div className="bg-blue-900/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-blue-400" />
                  <span className="text-blue-400 text-sm font-medium">Energy</span>
                </div>
                <span className="text-white text-base font-bold">{player.counters.energy}</span>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => handleCounterChange('energy', -1)}
                  className="bg-blue-500/30 hover:bg-blue-500/50 text-white p-1 rounded-lg w-9 h-9 flex items-center justify-center"
                  disabled={player.counters.energy <= 0 || !allDecksSelected}
                >
                  <Minus size={16} />
                </button>
                <div className="bg-blue-900/50 px-3 py-1 rounded-lg text-blue-400 font-bold text-xl w-14 text-center">
                  {player.counters.energy}
                </div>
                <button
                  onClick={() => handleCounterChange('energy', 1)}
                  className="bg-blue-500/50 hover:bg-blue-500/70 text-white p-1 rounded-lg w-9 h-9 flex items-center justify-center"
                  disabled={!allDecksSelected}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`transition-opacity duration-1000 ${player.isDead ? 'opacity-30' : ''}`}>
        <h2 className={`${isCompact ? 'text-xl' : 'text-2xl'} font-bold text-white mb-1`}>{player.name}</h2>
        
        {/* Display deck information if available */}
        {player.deckName && (
          <div className="text-indigo-300 text-xs mb-2 flex items-center justify-center gap-1">
            <Box size={12} />
            <span>{player.deckName}</span>
          </div>
        )}
        
        {/* Add deck selection button if onSelectDeck is provided */}
        {onSelectDeck && !player.deckName && (
          <div className="mb-2">
            <div className="text-yellow-400 text-xs mb-1 text-center">
              Select deck to start
            </div>
            <button
              onClick={() => onSelectDeck(player.id)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded-lg text-xs transition-colors flex items-center gap-1 mx-auto"
            >
              <Box size={12} />
              Select Deck
            </button>
          </div>
        )}
        
        <div className={`${isCompact ? 'text-5xl mb-3' : 'text-6xl mb-6'} font-bold text-white`}>
          {player.life}
        </div>
        
        {/* Counters display */}
        <div className="mb-2 flex justify-center gap-2">
          <div className="bg-green-900/30 px-2 py-1 rounded-full flex items-center gap-1" title="Poison Counters">
            <Droplets size={14} className="text-green-400" />
            <span className="text-green-400 font-bold">{player.counters.poison}</span>
          </div>
          <div className="bg-purple-900/30 px-2 py-1 rounded-full flex items-center gap-1" title="Experience Counters">
            <Award size={14} className="text-purple-400" />
            <span className="text-purple-400 font-bold">{player.counters.experience}</span>
          </div>
          <div className="bg-blue-900/30 px-2 py-1 rounded-full flex items-center gap-1" title="Energy Counters">
            <Zap size={14} className="text-blue-400" />
            <span className="text-blue-400 font-bold">{player.counters.energy}</span>
          </div>
        </div>
        
        {/* Toggle counters button and Lifelink toggle */}
        <div className="mb-2 flex justify-center gap-2">
          <button 
            onClick={() => setShowCounters(true)}
            className="bg-indigo-500/30 hover:bg-indigo-500/50 text-white px-2 py-1 rounded-lg text-xs transition-colors"
          >
            Manage Counters
          </button>
          
          <div 
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer ${
              lifelink 
                ? 'bg-pink-600/50 hover:bg-pink-600/40' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
            onClick={() => setLifelink(!lifelink)}
            title="Gain life equal to damage dealt"
          >
            <Heart size={14} className={lifelink ? 'text-pink-300' : 'text-white/60'} />
            <span className={lifelink ? 'text-pink-300' : 'text-white/60'}>Lifelink</span>
          </div>
        </div>
        
        <div className="flex justify-center gap-2 flex-wrap">
          <div className="w-full flex flex-col gap-2">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleHeal(1)}
                className={`bg-green-500 hover:bg-green-600 text-white p-1 rounded-full flex items-center justify-center ${isCompact ? 'w-10 h-10' : 'w-9 h-9'} transition-colors`}
                disabled={!allDecksSelected}
              >
                <Plus size={isCompact ? 18 : 16} />
              </button>
              <button
                onClick={() => handleHeal(5)}
                className={`bg-green-700 hover:bg-green-800 text-white p-1 rounded-full flex items-center justify-center ${isCompact ? 'w-10 h-10' : 'w-9 h-9'} transition-colors`}
                disabled={!allDecksSelected}
              >
                <span className="text-sm font-bold">+5</span>
              </button>
              <button
                onClick={() => updateLife(player.id, -1)}
                className={`bg-red-500 hover:bg-red-600 text-white p-1 rounded-full flex items-center justify-center ${isCompact ? 'w-10 h-10' : 'w-9 h-9'} transition-colors`}
                disabled={!allDecksSelected}
              >
                <Minus size={isCompact ? 18 : 16} />
              </button>
            </div>

            <div className="w-full flex flex-wrap justify-center gap-1">
              {playerCount > 2 && (
                <button
                  onClick={handleDamageAllWithLifelink}
                  className={`bg-orange-600 hover:bg-orange-700 text-white ${isCompact ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} rounded-lg flex items-center gap-1 ${lifelink ? 'ring-1 ring-pink-400' : ''}`}
                  disabled={!allDecksSelected}
                >
                  <Swords size={isCompact ? 14 : 12} />
                  All Others (-1)
                  {lifelink && <Heart size={isCompact ? 12 : 10} className="text-pink-300" />}
                </button>
              )}
              
              {/* Show damage buttons in a more compact way for many players */}
              {isCompact ? (
                <div className="w-full">
                  <div className="text-white/60 text-xs mb-1 text-center">Target Players:</div>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {players
                      .filter(targetPlayer => targetPlayer.id !== player.id && !targetPlayer.isDead)
                      .map(targetPlayer => (
                        <div key={targetPlayer.id} className="flex flex-col gap-1 items-center mb-1">
                          <div className="text-xs text-white/70">
                            {targetPlayer.commanderDamage[player.id] ? 
                              `CMD: ${targetPlayer.commanderDamage[player.id]}/21` : ''}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDamageWithLifelink(targetPlayer.id, -1)}
                              className={`bg-orange-600 hover:bg-orange-700 text-white px-2 py-1.5 rounded-lg text-sm font-medium min-w-[32px] h-8 ${lifelink ? 'ring-1 ring-pink-400' : ''}`}
                              disabled={!allDecksSelected}
                              title={`Deal damage to ${targetPlayer.name}${lifelink ? ' (with lifelink)' : ''}`}
                            >
                              {targetPlayer.name.substring(0, 2)}
                              {lifelink && <Heart size={10} className="inline ml-1 text-pink-300" />}
                            </button>
                            <button
                              onClick={() => handleDamageWithLifelink(targetPlayer.id, -1, true)}
                              className={`bg-purple-600 hover:bg-purple-700 text-white px-2 py-1.5 rounded-lg text-sm font-medium min-w-[32px] h-8 ${lifelink ? 'ring-1 ring-pink-400' : ''}`}
                              disabled={!allDecksSelected}
                              title={`Deal commander damage to ${targetPlayer.name} (${targetPlayer.commanderDamage[player.id] || 0}/21)${lifelink ? ' with lifelink' : ''}`}
                            >
                              CMD
                              {lifelink && <Heart size={10} className="inline ml-1 text-pink-300" />}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                // Original view for 4 or fewer players
                players
                  .filter(targetPlayer => targetPlayer.id !== player.id && !targetPlayer.isDead)
                  .map(targetPlayer => (
                    <div key={targetPlayer.id} className="flex flex-col items-center gap-1">
                      <div className="text-white text-xs">
                        CMD: {targetPlayer.commanderDamage[player.id] || 0}/21
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDamageWithLifelink(targetPlayer.id, -1)}
                          className={`bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${lifelink ? 'ring-1 ring-pink-400' : ''}`}
                          disabled={!allDecksSelected}
                        >
                          <Swords size={12} />
                          {targetPlayer.name}
                          {lifelink && <Heart size={10} className="text-pink-300" />}
                        </button>
                        <button
                          onClick={() => handleDamageWithLifelink(targetPlayer.id, -1, true)}
                          className={`bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${lifelink ? 'ring-1 ring-pink-400' : ''}`}
                          disabled={!allDecksSelected}
                        >
                          <Swords size={12} />
                          CMD
                          {lifelink && <Heart size={10} className="text-pink-300" />}
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard; 