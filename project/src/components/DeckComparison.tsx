import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Swords, ArrowDownUp, Trophy } from 'lucide-react';
import api from '../services/api';
import { Deck, GameResult, Playgroup } from '../types';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';

interface DeckComparisonProps {
  onBack: () => void;
  username: string;
  gameHistory: GameResult[];
}

// Interface for deck vs deck matchup statistics
interface MatchupStat {
  deckId: string;
  deckName: string;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
}

// Interface for processed deck stats
interface DeckStat {
  _id: string;
  name: string;
  commander?: string;
  partnerCommander?: string;
  color?: string;
  winCount: number;
  playCount: number;
  winRate: number;
  avgGameTurns: number;
  avgGameDuration: number;
  matchups: Record<string, MatchupStat>;
  totalDamageDealt: number;
  avgDamagePerGame: number;
}

const CustomBarTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/80 backdrop-blur-sm p-3 rounded-lg border border-white/30 text-white">
        <p className="font-bold">{payload[0].payload.name}</p>
        <p className="text-sm"><span className="text-purple-400">Win Rate:</span> {payload[0].value}%</p>
        <p className="text-sm"><span className="text-green-400">Games Played:</span> {payload[1].value}</p>
      </div>
    );
  }
  return null;
};

const DeckComparison: React.FC<DeckComparisonProps> = ({ onBack, username, gameHistory }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckStats, setDeckStats] = useState<DeckStat[]>([]);
  const [playgroups, setPlaygroups] = useState<Playgroup[]>([]);
  const [selectedPlaygroup, setSelectedPlaygroup] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'overview' | 'matchups' | 'playgroups'>('overview');
  const [sortBy, setSortBy] = useState<'winRate' | 'playCount' | 'avgGameTurns' | 'avgDamagePerGame'>('winRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [selectedComparisonDeck, setSelectedComparisonDeck] = useState<string>('');
  const [userDeckIds, setUserDeckIds] = useState<string[]>([]);
  const [isChangingPlaygroup, setIsChangingPlaygroup] = useState(false);
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];
  
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setIsChangingPlaygroup(true);
      
      // Fetch user's own decks first
      const userDecks = await api.getDecks();
      // Store user's deck IDs for use in dropdown grouping
      const userDeckIds = userDecks.map((deck: Deck) => deck._id);
      
      // Fetch playgroups the user is a member of
      const fetchedPlaygroups = await api.getPlaygroups();
      const userPlaygroups = fetchedPlaygroups.filter(playgroup => 
        playgroup.members.includes(username)
      );
      
      // Initialise with user's decks
      const allPlaygroupDecks = [...userDecks];
      
      // Only fetch other players' decks if not in overview tab
      if (selectedPlaygroup !== 'all') {
        const selectedGroup = userPlaygroups.find(group => group.name === selectedPlaygroup);
        if (selectedGroup) {
          // Fetch decks for all members of the selected playgroup
          const memberDecksPromises = selectedGroup.members
            .filter((member: string) => member !== username)
            .map((member: string) => api.getDecksByUsername(member).catch(error => {
              console.error(`Error fetching decks for ${member}:`, error);
              return [];
            }));
          
          const memberDecksResults = await Promise.all(memberDecksPromises);
          allPlaygroupDecks.push(...memberDecksResults.flat());
        }
      } else {
        // For "all" view, fetch decks from all playgroups the user is in
        const allMemberDecksPromises = userPlaygroups.flatMap(group => 
          group.members
            .filter((member: string) => member !== username)
            .map((member: string) => api.getDecksByUsername(member).catch(error => {
              console.error(`Error fetching decks for ${member}:`, error);
              return [];
            }))
        );
        
        const allMemberDecksResults = await Promise.all(allMemberDecksPromises);
        allPlaygroupDecks.push(...allMemberDecksResults.flat());
      }
      
      // Remove duplicates
      const uniqueDecks = Array.from(new Map(allPlaygroupDecks.map(deck => 
        [deck._id, deck]
      )).values());
      
      setDecks(uniqueDecks);
      setPlaygroups(userPlaygroups);
      setUserDeckIds(userDeckIds);
      
      // Process game history to extract deck stats
      processGameHistory(uniqueDecks, gameHistory);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load deck comparison data');
    } finally {
      setLoading(false);
      setIsChangingPlaygroup(false);
    }
  }, [username, selectedPlaygroup, gameHistory]);
  
  const processGameHistory = (deckList: Deck[], games: GameResult[]) => {
    // Filter games based on selected playgroup and user's decks
    const filteredGames = selectedPlaygroup === 'all' 
      ? games.filter(game => 
          game.playerDecks?.some(deck => 
            deckList.some(userDeck => userDeck._id === deck.deckId)
          )
        )
      : games.filter(game => 
          game.playgroupName === selectedPlaygroup && 
          game.playerDecks?.some(deck => 
            deckList.some(userDeck => userDeck._id === deck.deckId)
          )
        );

    const stats: Record<string, DeckStat> = {};
    
    // Initialise stats for each deck
    deckList.forEach(deck => {
      stats[deck._id] = {
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
        matchups: {},
        totalDamageDealt: 0,
        avgDamagePerGame: 0
      };
    });

    // Track which games have been processed for each deck to avoid double counting
    const processedGames: Record<string, Set<string>> = {};
    // Track which matchups have been processed to avoid double counting
    const processedMatchups: Record<string, Record<string, Set<string>>> = {};
    
    // Process each game
    filteredGames.forEach(game => {
      // Skip games without playerDecks data
      if (!game.playerDecks || game.playerDecks.length === 0) return;
      
      // Create a unique game ID
      const gameId = game._id || `game-${game.date}-${game.winner}`;

      // Process each player's deck in the game
      game.playerDecks.forEach(playerDeck => {
        const deckId = playerDeck.deckId;
        if (!stats[deckId]) return;
        
        // Initialise the set of processed games for this deck if not exists
        if (!processedGames[deckId]) {
          processedGames[deckId] = new Set();
        }
        
        // Skip if this game has already been processed for this deck
        if (processedGames[deckId].has(gameId)) return;
        
        // Mark this game as processed for this deck
        processedGames[deckId].add(gameId);

        const deckStat = stats[deckId];
        deckStat.playCount++;
        
        if (playerDeck.playerName === game.winner) {
          deckStat.winCount++;
        }

        // Update win rate
        deckStat.winRate = (deckStat.winCount / deckStat.playCount) * 100;

        // Update game duration and turn count
        deckStat.avgGameTurns = ((deckStat.avgGameTurns * (deckStat.playCount - 1)) + game.turnCount) / deckStat.playCount;
        deckStat.avgGameDuration = ((deckStat.avgGameDuration * (deckStat.playCount - 1)) + game.duration) / deckStat.playCount;

        // Process damage dealt
        const playerIndex = game.players.indexOf(playerDeck.playerName);
        if (playerIndex !== -1 && game.playerStats && game.playerStats[playerIndex]) {
          const playerStat = game.playerStats[playerIndex];
          deckStat.totalDamageDealt += playerStat.damageDealt;
          deckStat.avgDamagePerGame = deckStat.totalDamageDealt / deckStat.playCount;
        }

        // Process matchups with other decks in this game
        if (game.playerDecks) {
          // Initialise the processed matchups tracking for this deck
          if (!processedMatchups[deckId]) {
            processedMatchups[deckId] = {};
          }
          
          // Get all opponent decks in this game (excluding the current deck)
          const opponentDecks = game.playerDecks.filter(d => d.deckId !== deckId);
          
          // Process each opponent deck matchup
          opponentDecks.forEach(opponentDeck => {
            // Initialise matchup tracking if needed
            if (!processedMatchups[deckId][opponentDeck.deckId]) {
              processedMatchups[deckId][opponentDeck.deckId] = new Set();
            }
            
            // Skip if this matchup has already been processed for this game
            if (processedMatchups[deckId][opponentDeck.deckId].has(gameId)) return;
            
            // Mark this matchup as processed for this game
            processedMatchups[deckId][opponentDeck.deckId].add(gameId);
            
            // Initialise the matchup stats if needed
            if (!deckStat.matchups[opponentDeck.deckId]) {
              deckStat.matchups[opponentDeck.deckId] = {
                deckId: opponentDeck.deckId,
                deckName: opponentDeck.deckName,
                wins: 0,
                losses: 0,
                totalGames: 0, // Will be calculated as wins + losses
                winRate: 0
              };
            }
            
            const matchup = deckStat.matchups[opponentDeck.deckId];
            
            // If this deck's player is the winner, it's a win for this matchup
            if (playerDeck.playerName === game.winner) {
              matchup.wins++;
              matchup.totalGames = matchup.wins + matchup.losses; // Update total games
            } 
            // If the opponent's player is the winner, it's a loss for this matchup
            else if (opponentDeck.playerName === game.winner) {
              matchup.losses++;
              matchup.totalGames = matchup.wins + matchup.losses; // Update total games
            }
            // Otherwise, it's a draw or other result that doesn't count as win/loss
            
            // Calculate win rate based on total games played (wins + losses)
            matchup.winRate = matchup.totalGames > 0 ? (matchup.wins / matchup.totalGames) * 100 : 0;
          });
        }
      });
    });

    setDeckStats(Object.values(stats));
  };
  
  // Handle playgroup selection change
  const handlePlaygroupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    setSelectedPlaygroup(newValue);
    // Reset state data that depends on playgroup selection
    setSelectedDeck('');
    setSelectedComparisonDeck('');
  };
  
  // Add useEffect to fetch data on component mount and when selected playgroup changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Sort deck stats
  const getSortedDeckStats = () => {
    return [...deckStats].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'winRate':
          comparison = a.winRate - b.winRate;
          break;
        case 'playCount':
          comparison = a.playCount - b.playCount;
          break;
        case 'avgGameTurns':
          comparison = a.avgGameTurns - b.avgGameTurns;
          break;
        case 'avgDamagePerGame':
          comparison = a.avgDamagePerGame - b.avgDamagePerGame;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };
  
  // Get data for win rate chart
  const getWinRateChartData = () => {
    return getSortedDeckStats().map(deck => ({
      name: deck.name,
      winRate: parseFloat(deck.winRate.toFixed(1)),
      playCount: deck.playCount
    }));
  };
  
  // Get data for most played chart
  const getMostPlayedChartData = () => {
    return [...deckStats]
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5)
      .map(deck => ({
        name: deck.name,
        value: deck.playCount
      }));
  };
  
  // Get matchup data for a specific deck
  const getDeckMatchupData = (deckId: string) => {
    const deck = deckStats.find(d => d._id === deckId);
    if (!deck) return [];
    
    return Object.values(deck.matchups)
      .sort((a, b) => b.winRate - a.winRate)
      .map(matchup => {
        // Make sure total games is consistent with wins + losses
        const totalGames = matchup.wins + matchup.losses;
        const winRate = totalGames > 0 ? (matchup.wins / totalGames) * 100 : 0;
        
        return {
          name: matchup.deckName,
          winRate: parseFloat(winRate.toFixed(1)),
          wins: matchup.wins,
          losses: matchup.losses,
          totalGames: totalGames
        };
      });
  };
  
  // Compare two decks head-to-head
  const getHeadToHeadStats = (deck1Id: string, deck2Id: string) => {
    const deck1 = deckStats.find(d => d._id === deck1Id);
    const deck2 = deckStats.find(d => d._id === deck2Id);
    
    if (!deck1 || !deck2) return null;
    
    const matchup1 = deck1.matchups[deck2Id];
    const matchup2 = deck2.matchups[deck1Id];
    
    if (!matchup1 || !matchup2) return null;
    
    return {
      deck1: {
        name: deck1.name,
        wins: matchup1.wins,
        losses: matchup1.losses,
        winRate: matchup1.winRate
      },
      deck2: {
        name: deck2.name,
        wins: matchup2.wins,
        losses: matchup2.losses,
        winRate: matchup2.winRate
      },
      totalGames: matchup1.totalGames
    };
  };
  
  // Format values for display
  const formatValue = (value: number, type: 'percent' | 'integer' | 'decimal' | 'time') => {
    switch (type) {
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'integer':
        return Math.round(value).toString();
      case 'decimal':
        return value.toFixed(1);
      case 'time':
        return `${value.toFixed(1)} min`;
      default:
        return value.toString();
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-5xl">
          <div className="text-center text-white">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">Loading deck statistics...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <button
                  onClick={onBack}
                  className="text-white mr-4 hover:bg-white/10 rounded-full p-2"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-white text-2xl font-bold">Deck Comparison</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Add playgroup dropdown for Overview tab */}
                {view === 'overview' && (
                  <div className="w-auto mr-4 relative">
                    <select
                      value={selectedPlaygroup}
                      onChange={handlePlaygroupChange}
                      className="bg-white border border-gray-300 rounded px-3 py-2 text-black w-64 hover:bg-gray-100"
                      disabled={isChangingPlaygroup}
                    >
                      <option value="all">All Playgroups</option>
                      {playgroups.map(group => (
                        <option key={group._id} value={group.name}>{group.name}</option>
                      ))}
                    </select>
                    {isChangingPlaygroup && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-white/10 rounded-lg p-1 flex">
                  <button
                    onClick={() => setView('overview')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      view === 'overview' ? 'bg-indigo-600 text-white' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setView('matchups')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      view === 'matchups' ? 'bg-indigo-600 text-white' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    Matchups
                  </button>
                  <button
                    onClick={() => setView('playgroups')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      view === 'playgroups' ? 'bg-indigo-600 text-white' : 'text-white/80 hover:bg-white/5'
                    }`}
                  >
                    Playgroups
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Show mini loading indicator during playgroup changes */}
          {isChangingPlaygroup && !loading && (
            <div className="bg-indigo-500/20 border border-indigo-500 text-white p-2 rounded-lg mb-4 flex items-center">
              <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full mr-2"></div>
              <span>Updating deck statistics...</span>
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          {deckStats.length === 0 ? (
            <div className="text-center text-white p-8">
              <p className="text-lg mb-2">No deck data available</p>
              <p className="text-white/60">Play some games with your decks to start collecting statistics.</p>
            </div>
          ) : (
            <>
              {/* Overview View */}
              {view === 'overview' && (
                <div className="space-y-6">
                  {/* Win Rate Chart */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-white text-lg font-medium mb-3">Deck Win Rates</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getWinRateChartData()} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} />
                          <YAxis type="category" dataKey="name" width={120} />
                          <Tooltip content={<CustomBarTooltip />} />
                          <Legend />
                          <Bar dataKey="winRate" name="Win Rate" fill="#8884d8" barSize={20} />
                          <Bar dataKey="playCount" name="Games Played" fill="#82ca9d" barSize={20} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Most Played Decks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white text-lg font-medium mb-3">Top 5 Most Played Decks</h3>
                      <div className="h-64 mt-12">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getMostPlayedChartData()}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              nameKey="name"
                              label={(entry: {name: string}) => entry.name}
                            >
                              {getMostPlayedChartData().map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} games`, 'Played']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Deck Stats Table */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-white text-lg font-medium">Deck Performance</h3>
                        <div className="flex items-center gap-1 text-sm text-white/60">
                          <span>Sort by:</span>
                          <select 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-white border border-gray-300 rounded px-2 py-1 text-black text-sm hover:bg-gray-100"
                          >
                            <option value="winRate">Win Rate</option>
                            <option value="playCount">Games Played</option>
                            <option value="avgGameTurns">Avg Turns</option>
                            <option value="avgDamagePerGame">Avg Damage</option>
                          </select>
                          <button 
                            onClick={toggleSortOrder}
                            className="ml-1 p-1 hover:bg-white/10 rounded"
                          >
                            <ArrowDownUp size={16} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                          </button>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="text-left text-white/60 text-sm">
                              <th className="py-2 px-3 border-b border-white/10">Deck</th>
                              <th className="py-2 px-3 border-b border-white/10 text-right">Win %</th>
                              <th className="py-2 px-3 border-b border-white/10 text-right">W-L</th>
                              <th className="py-2 px-3 border-b border-white/10 text-right">Avg Damage</th>
                              <th className="py-2 px-3 border-b border-white/10 text-right">Avg Turns</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getSortedDeckStats().map(deck => (
                              <tr key={deck._id} className="text-white hover:bg-white/5">
                                <td className="py-2 px-3 border-b border-white/10">{deck.name}</td>
                                <td className="py-2 px-3 border-b border-white/10 text-right">
                                  {formatValue(deck.winRate, 'percent')}
                                </td>
                                <td className="py-2 px-3 border-b border-white/10 text-right">
                                  {deck.winCount}-{deck.playCount - deck.winCount}
                                </td>
                                <td className="py-2 px-3 border-b border-white/10 text-right">
                                  {formatValue(deck.avgDamagePerGame, 'integer')}
                                </td>
                                <td className="py-2 px-3 border-b border-white/10 text-right">
                                  {formatValue(deck.avgGameTurns, 'decimal')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Matchups View */}
              {view === 'matchups' && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-white text-lg font-medium mb-2">Deck Matchups</h3>
                    <p className="text-white/60">Select a deck to see detailed matchup statistics.</p>
                    
                    <div className="mt-4">
                      <select
                        value={selectedDeck}
                        onChange={(e) => setSelectedDeck(e.target.value)}
                        className="bg-white border border-gray-300 rounded px-3 py-2 text-black w-full max-w-md hover:bg-gray-100"
                      >
                        <option value="">Select a deck</option>
                        {/* Group user's decks */}
                        <optgroup label="Your Decks">
                          {deckStats
                            .filter(deck => userDeckIds.includes(deck._id))
                            .map(deck => (
                              <option key={deck._id} value={deck._id}>{deck.name}</option>
                            ))}
                        </optgroup>
                        {/* Group other players' decks */}
                        <optgroup label="Other Players' Decks">
                          {deckStats
                            .filter(deck => !userDeckIds.includes(deck._id))
                            .map(deck => (
                              <option key={deck._id} value={deck._id}>{deck.name}</option>
                            ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                  
                  {selectedDeck && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-white text-lg font-medium mb-3">
                        {deckStats.find(d => d._id === selectedDeck)?.name} - Matchup Details
                      </h3>
                      
                      {/* Add head-to-head comparison section */}
                      <div className="mb-4">
                        <h4 className="text-white text-md font-medium mb-2">Head-to-Head Comparison</h4>
                        <div className="flex gap-2 items-end mb-4">
                          <div className="flex-1">
                            <label className="block text-white/60 text-sm mb-1">Compare with:</label>
                            <select
                              value={selectedComparisonDeck}
                              onChange={(e) => setSelectedComparisonDeck(e.target.value)}
                              className="bg-white border border-gray-300 rounded px-3 py-2 text-black w-full hover:bg-gray-100"
                            >
                              <option value="">Select a deck</option>
                              {deckStats
                                .filter(deck => deck._id !== selectedDeck)
                                .map(deck => (
                                  <option key={deck._id} value={deck._id}>{deck.name}</option>
                                ))}
                            </select>
                          </div>
                        </div>
                        
                        {selectedDeck && selectedComparisonDeck && (
                          <div className="bg-indigo-900/20 rounded-lg p-3 my-3">
                            {(() => {
                              const headToHead = getHeadToHeadStats(selectedDeck, selectedComparisonDeck);
                              if (!headToHead) {
                                return <p className="text-white/60 text-center">No head-to-head data available</p>;
                              }
                              
                              return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-indigo-600/20 rounded-lg p-3 text-center">
                                    <h5 className="text-white font-medium">{headToHead.deck1.name}</h5>
                                    <p className="text-lg text-indigo-300 font-bold">{formatValue(headToHead.deck1.winRate, 'percent')}</p>
                                    <p className="text-white/60 text-sm">{headToHead.deck1.wins} wins, {headToHead.deck1.losses} losses</p>
                                  </div>
                                  
                                  <div className="bg-white/10 rounded-lg p-3 text-center flex flex-col justify-center">
                                    <p className="text-white text-sm">Total Games</p>
                                    <p className="text-xl font-bold text-white">{headToHead.totalGames}</p>
                                    <div className="mt-1 flex gap-1 justify-center">
                                      <Swords size={16} className="text-yellow-400" />
                                    </div>
                                  </div>
                                  
                                  <div className="bg-purple-600/20 rounded-lg p-3 text-center">
                                    <h5 className="text-white font-medium">{headToHead.deck2.name}</h5>
                                    <p className="text-lg text-purple-300 font-bold">{formatValue(headToHead.deck2.winRate, 'percent')}</p>
                                    <p className="text-white/60 text-sm">{headToHead.deck2.wins} wins, {headToHead.deck2.losses} losses</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      
                      {getDeckMatchupData(selectedDeck).length === 0 ? (
                        <p className="text-white/60 text-center py-4">
                          No matchup data available for this deck
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="text-left text-white/60 text-sm">
                                <th className="py-2 px-3 border-b border-white/10">Opponent Deck</th>
                                <th className="py-2 px-3 border-b border-white/10 text-right">Win Rate</th>
                                <th className="py-2 px-3 border-b border-white/10 text-right">Wins</th>
                                <th className="py-2 px-3 border-b border-white/10 text-right">Losses</th>
                                <th className="py-2 px-3 border-b border-white/10 text-right">Total Games</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getDeckMatchupData(selectedDeck).map(matchup => (
                                <tr key={matchup.name} className="text-white hover:bg-white/5">
                                  <td className="py-2 px-3 border-b border-white/10">{matchup.name}</td>
                                  <td className="py-2 px-3 border-b border-white/10 text-right">
                                    {formatValue(matchup.winRate, 'percent')}
                                  </td>
                                  <td className="py-2 px-3 border-b border-white/10 text-right">{matchup.wins}</td>
                                  <td className="py-2 px-3 border-b border-white/10 text-right">{matchup.losses}</td>
                                  <td className="py-2 px-3 border-b border-white/10 text-right">{matchup.totalGames}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Playgroups View */}
              {view === 'playgroups' && (
                <div className="space-y-6">
                  <div className="mb-4">
                    <h3 className="text-white text-lg font-medium mb-2">Playgroup Deck Performance</h3>
                    <p className="text-white/60">Select a playgroup to see deck performance statistics within that group.</p>
                    
                    <div className="mt-4">
                      <select
                        value={selectedPlaygroup}
                        onChange={(e) => setSelectedPlaygroup(e.target.value)}
                        className="bg-white border border-gray-300 rounded px-3 py-2 text-black w-full max-w-md hover:bg-gray-100"
                      >
                        <option value="all">All Playgroups</option>
                        {playgroups.map(group => (
                          <option key={group._id} value={group.name}>{group.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {deckStats
                      .sort((a, b) => b.winRate - a.winRate)
                      .map(deck => (
                        <div key={deck._id} className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white font-medium">{deck.name}</h4>
                              <p className="text-white/60 text-sm">{deck.commander || "No Commander"}</p>
                            </div>
                            <div className="bg-indigo-600/20 rounded-full p-2 flex items-center justify-center">
                              <Trophy size={20} className="text-yellow-400" />
                            </div>
                          </div>
                          
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/60 text-xs mb-1">Win Rate</p>
                              <p className="text-white font-bold text-lg">{formatValue(deck.winRate, 'percent')}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/60 text-xs mb-1">W-L Record</p>
                              <p className="text-white font-bold text-lg">{deck.winCount}-{deck.playCount - deck.winCount}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/60 text-xs mb-1">Avg Damage</p>
                              <p className="text-white font-bold text-lg">{formatValue(deck.avgDamagePerGame, 'integer')}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-2">
                              <p className="text-white/60 text-xs mb-1">Avg Game</p>
                              <p className="text-white font-bold text-lg">{formatValue(deck.avgGameTurns, 'decimal')} turns</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-white/60 text-xs mb-1">Best Matchup</p>
                            {Object.values(deck.matchups).length > 0 ? (
                              <div className="bg-white/5 rounded-lg p-2">
                                {Object.values(deck.matchups)
                                  .sort((a, b) => b.winRate - a.winRate)
                                  .slice(0, 1)
                                  .map(matchup => (
                                    <div key={matchup.deckId} className="flex justify-between">
                                      <p className="text-white">{matchup.deckName}</p>
                                      <p className="text-green-400 font-medium">{formatValue(matchup.winRate, 'percent')}</p>
                                    </div>
                                  ))
                                }
                              </div>
                            ) : (
                              <p className="text-white/40 text-sm">No matchup data</p>
                            )}
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckComparison; 