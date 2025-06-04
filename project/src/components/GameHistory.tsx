import React, { useState, useEffect } from 'react';
import { Trophy, RotateCw, Timer, ArrowLeft, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { GameResult, User, PlayerGameStats } from '../types';
import api from '../services/api';
import { formatDate, formatDuration } from '../utils/formatters';

interface GameHistoryProps {
  user: User;
  onBack: () => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({ user, onBack }) => {
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedGames, setExpandedGames] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWins, setFilterWins] = useState<boolean | null>(null);
  const [sortField, setSortField] = useState<'date' | 'turnCount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage, setGamesPerPage] = useState(10);
  
  const fetchGameHistory = async () => {
    try {
      setLoading(true);
      
      if (user.gameHistory && user.gameHistory.length > 0) {
        setGameHistory(user.gameHistory);
      } else {
        const freshHistory = await api.getUserGameHistory();
        setGameHistory(freshHistory);
      }
    } catch (error) {
      console.error('Error fetching game history:', error);
      setError('Failed to load game history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGameHistory();
  }, [user.gameHistory]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterWins, sortField, sortDirection]);

  // Generate a unique identifier for each game (MongoDB _id or fallback)
  const getGameIdentifier = (game: GameResult, index: number) => {
    // If game has an _id, use it
    if (game._id) return game._id;
    
    // Otherwise, create a unique identifier using date and index
    const dateStr = new Date(game.date).getTime().toString();
    return `game-${dateStr}-${index}`;
  };

  // Toggle expanded game details
  const toggleGameDetails = (gameId: string) => {
    const newExpandedGames = new Set(expandedGames);
    
    if (expandedGames.has(gameId)) {
      newExpandedGames.delete(gameId);
    } else {
      newExpandedGames.add(gameId);
    }
    
    setExpandedGames(newExpandedGames);
  };

  // Toggle sort field and direction
  const toggleSort = (field: 'date' | 'turnCount') => {
    if (sortField === field) {
      // If same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If different field, set it with default descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort games
  const filteredAndSortedGames = gameHistory
    .filter(game => {
      // Filter by search query
      const searchMatch = game.players.some(player => 
        player.toLowerCase().includes(searchQuery.toLowerCase())
      ) || game.winner.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by wins/losses if set
      const matchesWinFilter = filterWins === null ? true : 
        filterWins ? game.winner === user.username : game.winner !== user.username;
      
      return searchMatch && matchesWinFilter;
    })
    .sort((a, b) => {
      // Sort by selected field
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else {
        return sortDirection === 'asc' 
          ? a.turnCount - b.turnCount 
          : b.turnCount - a.turnCount;
      }
    });
  
  // Calculate pagination values
  const totalGames = filteredAndSortedGames.length;
  const totalPages = Math.ceil(totalGames / gamesPerPage);
  
  // Get current page of games
  const indexOfLastGame = currentPage * gamesPerPage;
  const indexOfFirstGame = indexOfLastGame - gamesPerPage;
  const currentGames = filteredAndSortedGames.slice(indexOfFirstGame, indexOfLastGame);
  
  // Page navigation functions
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };
  
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Helper function to safely display player stats, even if data is incomplete
  const renderPlayerStats = (stats: PlayerGameStats) => {
    if (!stats) {
      return <div className="text-red-400">No stats available</div>;
    }
    
    return (
      <div className="text-sm text-white/80">
        <div><span className="text-indigo-300">Damage:</span> {stats.damageDealt}</div>
        <div><span className="text-purple-300">Commander Damage:</span> {stats.commanderDamageDealt}</div>
        <div><span className="text-yellow-300">Eliminations:</span> {stats.eliminations}</div>
        {/* Show detailed interactions if available */}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="text-white text-xl">Loading game history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4 flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    );
  }

  if (!gameHistory || gameHistory.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4 flex flex-col items-center justify-center">
        <div className="text-white text-xl mb-8">No games recorded yet. Play some games first!</div>
        <button
          onClick={onBack}
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Main Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4 relative z-0">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl font-bold text-white">Game History</h1>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search players..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterWins(null)}
                className={`px-4 py-2 rounded-lg ${
                  filterWins === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                All Games
              </button>
              <button
                onClick={() => setFilterWins(true)}
                className={`px-4 py-2 rounded-lg ${
                  filterWins === true
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Wins
              </button>
              <button
                onClick={() => setFilterWins(false)}
                className={`px-4 py-2 rounded-lg ${
                  filterWins === false
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Losses
              </button>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-4">
            <button
              onClick={() => toggleSort('date')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                sortField === 'date'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Date
              {sortField === 'date' && (
                sortDirection === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />
              )}
            </button>
            <button
              onClick={() => toggleSort('turnCount')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                sortField === 'turnCount'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Turn Count
              {sortField === 'turnCount' && (
                sortDirection === 'asc' ? <ChevronUp size={18} /> : <ChevronDown size={18} />
              )}
            </button>
            
            {/* Games Per Page Selector */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-white/60 text-sm">Games per page:</span>
              <select
                value={gamesPerPage}
                onChange={(e) => {
                  setGamesPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
                className="bg-white/10 text-white border border-white/20 rounded-lg px-2 py-1"
              >
                <option value={10} className="bg-white text-black hover:bg-gray-100">10</option>
                <option value={20} className="bg-white text-black hover:bg-gray-100">20</option>
                <option value={50} className="bg-white text-black hover:bg-gray-100">50</option>
              </select>
            </div>
          </div>
        </div>

        {filteredAndSortedGames.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
            <Filter className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white text-lg">No games match your search criteria.</p>
          </div>
        ) : (
          <>
            {/* Pagination Info */}
            <div className="text-white/70 mb-4 text-sm">
              Showing {indexOfFirstGame + 1}-{Math.min(indexOfLastGame, totalGames)} of {totalGames} games
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {currentGames.filter((_, index) => index % 2 === 0).map((game, index) => (
                  <div 
                    key={getGameIdentifier(game, indexOfFirstGame + index)}
                    className="relative bg-white/10 backdrop-blur-lg rounded-xl p-6 cursor-pointer transition-all hover:bg-white/15 group"
                    onClick={() => toggleGameDetails(getGameIdentifier(game, indexOfFirstGame + index))}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className={game.winner === user.username ? "text-yellow-400" : "text-white/40"} size={24} />
                        <div>
                          <span className={`font-bold text-xl ${
                            game.winner === user.username ? "text-yellow-400" : "text-white"
                          }`}>
                            {game.winner === user.username ? "Victory!" : "Defeat"}
                          </span>
                          <div className="text-white/60 text-sm">
                            Winner: {game.winner}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/80 text-sm">{formatDate(game.date)}</div>
                        <div className="text-white/60 text-xs flex flex-col items-end">
                          <span>{game.playerCount} Players</span>
                          {game.playgroupName && (
                            <span className="text-indigo-300">{game.playgroupName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-white/80">
                        <RotateCw size={18} />
                        <span>Turn {game.turnCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Timer size={18} />
                        <span>{formatDuration(game.duration)}</span>
                      </div>
                    </div>
                    
                    {expandedGames.has(getGameIdentifier(game, indexOfFirstGame + index)) && (
                      <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-xl p-6 border-t border-white/10">
                        <h3 className="text-white text-lg font-medium mb-3">Player Details</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {game.players.map((player, idx) => {
                            // Defensive check if playerStats might be missing
                            const playerStat = game.playerStats && game.playerStats.length > idx 
                              ? game.playerStats[idx] 
                              : null;
                              
                            console.log(`Rendering player ${idx} (${player}) stats:`, playerStat);
                            
                            // Find deck info for this player
                            const playerDeck = game.playerDecks?.find(d => d.playerName === player);
                              
                            return (
                              <div 
                                key={idx} 
                                className={`bg-white/5 rounded-lg p-3 text-white transition-all ${
                                  player === game.winner 
                                    ? 'bg-yellow-500/10 border border-yellow-500/20' 
                                    : player === user.username
                                    ? 'bg-indigo-500/10 border border-indigo-500/20'
                                    : ''
                                }`}
                              >
                                <div className="font-medium mb-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {player} 
                                    {player === game.winner && (
                                      <Trophy size={16} className="text-yellow-400" />
                                    )}
                                    {player === user.username && (
                                      <span className="text-xs bg-indigo-500/20 px-2 py-1 rounded-full">You</span>
                                    )}
                                    {playerDeck && (
                                      <span className="text-xs bg-gray-600/80 px-2 py-1 rounded-full">
                                        {playerDeck.deckName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {playerStat 
                                  ? renderPlayerStats(playerStat) 
                                  : (
                                    <div className="text-red-400 text-sm">
                                      Player statistics unavailable
                                    </div>
                                  )
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-6">
                {currentGames.filter((_, index) => index % 2 === 1).map((game, index) => (
                  <div 
                    key={getGameIdentifier(game, indexOfFirstGame + index * 2 + 1)}
                    className="relative bg-white/10 backdrop-blur-lg rounded-xl p-6 cursor-pointer transition-all hover:bg-white/15 group"
                    onClick={() => toggleGameDetails(getGameIdentifier(game, indexOfFirstGame + index * 2 + 1))}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Trophy className={game.winner === user.username ? "text-yellow-400" : "text-white/40"} size={24} />
                        <div>
                          <span className={`font-bold text-xl ${
                            game.winner === user.username ? "text-yellow-400" : "text-white"
                          }`}>
                            {game.winner === user.username ? "Victory!" : "Defeat"}
                          </span>
                          <div className="text-white/60 text-sm">
                            Winner: {game.winner}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/80 text-sm">{formatDate(game.date)}</div>
                        <div className="text-white/60 text-xs flex flex-col items-end">
                          <span>{game.playerCount} Players</span>
                          {game.playgroupName && (
                            <span className="text-indigo-300">{game.playgroupName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-white/80">
                        <RotateCw size={18} />
                        <span>Turn {game.turnCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Timer size={18} />
                        <span>{formatDuration(game.duration)}</span>
                      </div>
                    </div>
                    
                    {expandedGames.has(getGameIdentifier(game, indexOfFirstGame + index * 2 + 1)) && (
                      <div className="mt-4 bg-white/10 backdrop-blur-lg rounded-xl p-6 border-t border-white/10">
                        <h3 className="text-white text-lg font-medium mb-3">Player Details</h3>
                        <div className="grid grid-cols-1 gap-3">
                          {game.players.map((player, idx) => {
                            // Defensive check if playerStats might be missing
                            const playerStat = game.playerStats && game.playerStats.length > idx 
                              ? game.playerStats[idx] 
                              : null;
                              
                            console.log(`Rendering player ${idx} (${player}) stats:`, playerStat);
                            
                            // Find deck info for this player
                            const playerDeck = game.playerDecks?.find(d => d.playerName === player);
                              
                            return (
                              <div 
                                key={idx} 
                                className={`bg-white/5 rounded-lg p-3 text-white transition-all ${
                                  player === game.winner 
                                    ? 'bg-yellow-500/10 border border-yellow-500/20' 
                                    : player === user.username
                                    ? 'bg-indigo-500/10 border border-indigo-500/20'
                                    : ''
                                }`}
                              >
                                <div className="font-medium mb-2 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {player} 
                                    {player === game.winner && (
                                      <Trophy size={16} className="text-yellow-400" />
                                    )}
                                    {player === user.username && (
                                      <span className="text-xs bg-indigo-500/20 px-2 py-1 rounded-full">You</span>
                                    )}
                                    {playerDeck && (
                                      <span className="text-xs bg-gray-600/80 px-2 py-1 rounded-full">
                                        {playerDeck.deckName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {playerStat 
                                  ? renderPlayerStats(playerStat) 
                                  : (
                                    <div className="text-red-400 text-sm">
                                      Player statistics unavailable
                                    </div>
                                  )
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                
                {/* Page Numbers */}
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Logic to show appropriate page numbers
                    let pageNum;
                    if (totalPages <= 5) {
                      // If 5 or fewer pages, show all
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      // Near the start
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      // Near the end
                      pageNum = totalPages - 4 + i;
                    } else {
                      // In the middle
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {/* Show ellipsis if needed */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="text-white/60 px-2 flex items-center">...</span>
                  )}
                  
                  {/* Always show last page if there are many pages */}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/10 text-white hover:bg-white/20"
                    >
                      {totalPages}
                    </button>
                  )}
                </div>
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${
                    currentPage === totalPages
                      ? 'bg-white/5 text-white/30 cursor-not-allowed'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GameHistory; 