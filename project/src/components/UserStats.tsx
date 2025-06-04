import React, { useState } from 'react';
import { Trophy, Clock, Target, Timer, Award, Swords, Skull, RotateCw, Droplet, AlertTriangle, ThumbsUp } from 'lucide-react';
import { GameResult, Playgroup } from '../types';
import { 
  LineChart, Line, PieChart, Pie, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, BarChart, Bar
} from 'recharts';

interface UserStatsProps {
  username: string;
  gameHistory: GameResult[];
  onBack: () => void;
  playgroups: Playgroup[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Add type for chart data
interface WinRateData {
  date: string;
  winRate: number;
}

interface DamageData {
  name: string;
  value: number;
}

interface PerformanceData {
  date: string;
  damage: number;
  commanderDamage: number;
  eliminations: number;
}

interface OpponentData {
  opponent: string;
  eliminations: number;
  eliminatedBy: number;
}

const UserStats: React.FC<UserStatsProps> = ({ username, gameHistory, onBack, playgroups }) => {
  const [selectedPlaygroup, setSelectedPlaygroup] = useState<string>('all');
  
  // Filter playgroups to only include those the user is a member of
  const userPlaygroups = playgroups.filter(playgroup => 
    playgroup.members.includes(username)
  );

  // Calculate overall statistics
  const totalGames = gameHistory.length;
  const wins = gameHistory.filter(game => game.winner === username).length;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : 0;
  
  // Calculate average turn duration
  const totalTurnTime = gameHistory.reduce((sum, game) => sum + (game.avgTurnTime || 0), 0);
  const avgTurnDuration = totalGames > 0 ? Math.round(totalTurnTime / totalGames) : 0;
  
  // Calculate total playtime (using activeDuration to exclude pauses)
  const totalPlaytime = gameHistory.reduce((sum, game) => {
    console.log('Processing game:', {
      date: game.date,
      duration: game.duration,
      activeDuration: game.activeDuration,
      currentSum: sum
    });
    
    // Use activeDuration if available, otherwise fall back to duration
    // This ensures backwards compatibility with games saved before this feature
    const gameDuration = game.activeDuration !== undefined ? game.activeDuration : game.duration || 0;
    return sum + gameDuration;
  }, 0);
  console.log('Total playtime calculated:', totalPlaytime);
  const hoursPlayed = Math.floor(totalPlaytime / 3600);
  const minutesPlayed = Math.floor((totalPlaytime % 3600) / 60);
  
  // Calculate average number of turns
  const totalTurns = gameHistory.reduce((sum, game) => sum + game.turnCount, 0);
  const avgTurns = totalGames > 0 ? (totalTurns / totalGames).toFixed(1) : 0;
  
  // Calculate damage and elimination stats
  const playerStats = gameHistory.flatMap(game => 
    game.playerStats?.filter(stat => 
      game.playerStats && game.players[game.playerStats.indexOf(stat)] === username
    ) || []
  );
  
  const totalDamageDealt = playerStats.reduce((sum, stat) => sum + stat.damageDealt, 0);
  const totalEliminations = playerStats.reduce((sum, stat) => sum + stat.eliminations, 0);
  const avgDamagePerGame = totalGames > 0 ? Math.round(totalDamageDealt / totalGames) : 0;
  const avgEliminationsPerGame = totalGames > 0 ? (totalEliminations / totalGames).toFixed(1) : 0;

  // Calculate damage interactions
  const damageInteractionsMap = new Map<string, number>();
  const commanderDamageInteractionsMap = new Map<string, number>();
  const eliminationInteractionsMap = new Map<string, number>();
  const eliminatedByMap = new Map<string, number>();

  playerStats.forEach(stat => {
    // Aggregate damage interactions
    stat.damageInteractions?.forEach(interaction => {
      damageInteractionsMap.set(
        interaction.targetPlayer,
        (damageInteractionsMap.get(interaction.targetPlayer) || 0) + interaction.amount
      );
    });

    // Aggregate commander damage interactions
    stat.commanderDamageInteractions?.forEach(interaction => {
      commanderDamageInteractionsMap.set(
        interaction.targetPlayer,
        (commanderDamageInteractionsMap.get(interaction.targetPlayer) || 0) + interaction.amount
      );
    });

    // Aggregate elimination interactions
    stat.eliminationInteractions?.forEach(interaction => {
      eliminationInteractionsMap.set(
        interaction.eliminatedPlayer,
        (eliminationInteractionsMap.get(interaction.eliminatedPlayer) || 0) + 1
      );
    });
  });

  // Calculate times eliminated by each opponent
  gameHistory.forEach(game => {
    const playerIndex = game.players.indexOf(username);
    if (playerIndex === -1) return;

    game.playerStats?.forEach((stat, index) => {
      if (index === playerIndex) return; // Skip the current player's stats
      
      stat.eliminationInteractions?.forEach(interaction => {
        if (interaction.eliminatedPlayer === username) {
          const opponent = game.players[index];
          eliminatedByMap.set(
            opponent,
            (eliminatedByMap.get(opponent) || 0) + 1
          );
        }
      });
    });
  });

  // Find most damaged opponent
  const mostDamagedOpponent = Array.from(damageInteractionsMap.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Find most commander damaged opponent
  const mostCommanderDamagedOpponent = Array.from(commanderDamageInteractionsMap.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Find most eliminated opponent
  const mostEliminatedOpponent = Array.from(eliminationInteractionsMap.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Find most eliminated by opponent
  const mostEliminatedByOpponent = Array.from(eliminatedByMap.entries())
    .sort((a, b) => b[1] - a[1])[0];

  // Update damage data for pie chart to use actual interactions
  const damageData: DamageData[] = Array.from(damageInteractionsMap.entries())
    .map(([opponent, damage]) => ({
      name: opponent,
      value: damage
    }))
    .sort((a, b) => b.value - a.value);

  // Update opponent data to use actual elimination interactions and eliminated by stats
  const opponentData: OpponentData[] = Array.from(new Set([
    ...eliminationInteractionsMap.keys(),
    ...eliminatedByMap.keys()
  ])).map(opponent => ({
    opponent,
    eliminations: eliminationInteractionsMap.get(opponent) || 0,
    eliminatedBy: eliminatedByMap.get(opponent) || 0
  }));

  // Calculate best and worst performances
  const bestGame = playerStats.reduce((best, stat, index) => {
    if (!best || stat.damageDealt > best.damageDealt) {
      return { ...stat, gameIndex: index };
    }
    return best;
  }, null as (typeof playerStats[0] & { gameIndex: number }) | null);
  
  const worstGame = playerStats.reduce((worst, stat, index) => {
    if (!worst || stat.damageDealt < worst.damageDealt) {
      return { ...stat, gameIndex: index };
    }
    return worst;
  }, null as (typeof playerStats[0] & { gameIndex: number }) | null);

  // Update data preparation with proper types
  const winRateData: WinRateData[] = gameHistory
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((game, index) => {
      const gamesSoFar = gameHistory.slice(0, index + 1);
      const winsSoFar = gamesSoFar.filter(g => g.winner === username).length;
      return {
        date: new Date(game.date).toLocaleDateString(),
        winRate: (winsSoFar / (index + 1)) * 100
      };
    });

  const performanceData: PerformanceData[] = gameHistory
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(game => {
      const playerIndex = game.players.indexOf(username);
      const stats = game.playerStats?.[playerIndex];
      return {
        date: new Date(game.date).toLocaleDateString(),
        damage: stats?.damageDealt || 0,
        commanderDamage: stats?.commanderDamageDealt || 0,
        eliminations: stats?.eliminations || 0
      };
    });

  // Calculate saltiness statistics
  const gamesWithSaltiness = playerStats.filter(stat => stat.saltinessRating);
  const notSaltyCount = playerStats.filter(stat => stat.saltinessRating === 'notSalty').length;
  const somewhatSaltyCount = playerStats.filter(stat => stat.saltinessRating === 'somewhatSalty').length;
  const extremelySaltyCount = playerStats.filter(stat => stat.saltinessRating === 'extremelySalty').length;
  
  // Calculate the dominant saltiness level
  let dominantSaltiness = 'No Data';
  let dominantSaltinessIcon = null;
  
  if (gamesWithSaltiness.length > 0) {
    if (notSaltyCount >= somewhatSaltyCount && notSaltyCount >= extremelySaltyCount) {
      dominantSaltiness = 'Not Salty';
      dominantSaltinessIcon = <ThumbsUp className="text-green-400" />;
    } else if (somewhatSaltyCount >= notSaltyCount && somewhatSaltyCount >= extremelySaltyCount) {
      dominantSaltiness = 'Somewhat Salty';
      dominantSaltinessIcon = <Droplet className="text-yellow-400" />;
    } else {
      dominantSaltiness = 'Extremely Salty';
      dominantSaltinessIcon = <AlertTriangle className="text-red-400" />;
    }
  }
  
  // Filter games by selected playgroup
  const filteredGameHistory = selectedPlaygroup === 'all' 
    ? gameHistory 
    : gameHistory.filter(game => game.playgroupName === selectedPlaygroup);

  // Update the playgroupSaltinessMap calculation to use filtered games
  const playgroupSaltinessMap = new Map<string, { 
    total: number,
    notSalty: number,
    somewhatSalty: number,
    extremelySalty: number,
    saltinessScore: number
  }>();
  
  // Initialie the current user's saltiness data with filtered games
  const filteredGamesWithSaltiness = filteredGameHistory.filter(game => 
    game.playerStats?.some(stat => stat.saltinessRating)
  );
  
  playgroupSaltinessMap.set(username, {
    total: filteredGamesWithSaltiness.length,
    notSalty: filteredGamesWithSaltiness.filter(game => 
      game.playerStats?.find(stat => 
        game.players[game.playerStats.indexOf(stat)] === username
      )?.saltinessRating === 'notSalty'
    ).length,
    somewhatSalty: filteredGamesWithSaltiness.filter(game => 
      game.playerStats?.find(stat => 
        game.players[game.playerStats.indexOf(stat)] === username
      )?.saltinessRating === 'somewhatSalty'
    ).length,
    extremelySalty: filteredGamesWithSaltiness.filter(game => 
      game.playerStats?.find(stat => 
        game.players[game.playerStats.indexOf(stat)] === username
      )?.saltinessRating === 'extremelySalty'
    ).length,
    saltinessScore: 0
  });

  // Process filtered games for each player's saltiness data
  filteredGameHistory.forEach(game => {
    game.players.forEach((player, index) => {
      if (player === username) return; // Skip the current user as we've already processed them
      
      const playerStat = game.playerStats?.[index];
      if (!playerStat || !playerStat.saltinessRating) return;
      
      const playerData = playgroupSaltinessMap.get(player) || {
        total: 0,
        notSalty: 0,
        somewhatSalty: 0,
        extremelySalty: 0,
        saltinessScore: 0
      };
      
      playerData.total++;
      
      if (playerStat.saltinessRating === 'notSalty') {
        playerData.notSalty++;
      } else if (playerStat.saltinessRating === 'somewhatSalty') {
        playerData.somewhatSalty++;
      } else if (playerStat.saltinessRating === 'extremelySalty') {
        playerData.extremelySalty++;
      }
      
      // Calculate a saltiness score (0 = never salty, 1 = always somewhat salty, 2 = always extremely salty)
      playerData.saltinessScore = (playerData.somewhatSalty + playerData.extremelySalty * 2) / playerData.total;
      
      playgroupSaltinessMap.set(player, playerData);
    });
  });
  
  // Prepare comparison data for chart
  const playgroupSaltinessData = Array.from(playgroupSaltinessMap.entries())
    .filter(([_, data]) => data.total > 0) // Only include players with saltiness data
    .map(([player, data]) => ({
      player,
      saltinessScore: parseFloat((data.saltinessScore * 100 / 2).toFixed(1)), // Convert to percentage of max score
      notSaltyPercentage: parseFloat(((data.notSalty / data.total) * 100).toFixed(1)),
      somewhatSaltyPercentage: parseFloat(((data.somewhatSalty / data.total) * 100).toFixed(1)),
      extremelySaltyPercentage: parseFloat(((data.extremelySalty / data.total) * 100).toFixed(1)),
      isCurrentUser: player === username
    }))
    .sort((a, b) => a.saltinessScore - b.saltinessScore); // Sort by saltiness score (least to most salty)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">{username}'s Statistics</h1>
          <button
            onClick={onBack}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Overall Stats */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Overall Performance</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="text-yellow-400" />
                <span>Win Rate: {winRate}% ({wins}/{totalGames})</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Clock className="text-blue-400" />
                <span>Average Turn: {avgTurnDuration}s</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Timer className="text-green-400" />
                <span>Time Played: {hoursPlayed}h {minutesPlayed}m</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <RotateCw className="text-purple-400" />
                <span>Average Turns: {avgTurns}</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Skull className="text-orange-400" />
                <span>Total Eliminations: {totalEliminations}</span>
              </div>
            </div>
          </div>

          {/* Averages */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Per Game Averages</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Award className="text-yellow-400" />
                <span>Damage per Game: {avgDamagePerGame}</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Skull className="text-orange-400" />
                <span>Eliminations per Game: {avgEliminationsPerGame}</span>
              </div>
            </div>
          </div>

          {/* Arch Nemesis Stats */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Arch Nemesis</h2>
            <div className="space-y-4">
              {mostDamagedOpponent && (
                <div className="flex items-center gap-2 text-white">
                  <Swords className="text-red-400" />
                  <span>Most Damaged: {mostDamagedOpponent[0]} ({mostDamagedOpponent[1]} damage)</span>
                </div>
              )}
              {mostCommanderDamagedOpponent && (
                <div className="flex items-center gap-2 text-white">
                  <Target className="text-purple-400" />
                  <span>Most Commander Damage: {mostCommanderDamagedOpponent[0]} ({mostCommanderDamagedOpponent[1]} damage)</span>
                </div>
              )}
              {mostEliminatedOpponent && (
                <div className="flex items-center gap-2 text-white">
                  <Skull className="text-orange-400" />
                  <span>Most Eliminated: {mostEliminatedOpponent[0]} ({mostEliminatedOpponent[1]} times)</span>
                </div>
              )}
              {mostEliminatedByOpponent && (
                <div className="flex items-center gap-2 text-white">
                  <Skull className="text-red-400" />
                  <span>Most Eliminated By: {mostEliminatedByOpponent[0]} ({mostEliminatedByOpponent[1]} times)</span>
                </div>
              )}
            </div>
          </div>

          {/* Best Game */}
          {bestGame && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Best Performance</h2>
              <div className="space-y-2 text-white">
                <p>Damage Dealt: {bestGame.damageDealt}</p>
                <p>Commander Damage: {bestGame.commanderDamageDealt}</p>
                <p>Eliminations: {bestGame.eliminations}</p>
                <p className="text-sm text-gray-300">
                  Game Date: {new Date(gameHistory[bestGame.gameIndex].date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Worst Game */}
          {worstGame && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Worst Performance</h2>
              <div className="space-y-2 text-white">
                <p>Damage Dealt: {worstGame.damageDealt}</p>
                <p>Commander Damage: {worstGame.commanderDamageDealt}</p>
                <p>Eliminations: {worstGame.eliminations}</p>
                <p className="text-sm text-gray-300">
                  Game Date: {new Date(gameHistory[worstGame.gameIndex].date).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Saltiness Stats */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Saltiness Profile</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white">
                {dominantSaltinessIcon}
                <span>Typical Mood: {dominantSaltiness}</span>
              </div>
              {gamesWithSaltiness.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-white">
                    <ThumbsUp className="text-green-400" />
                    <span>Not Salty: {notSaltyCount} ({((notSaltyCount / gamesWithSaltiness.length) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Droplet className="text-yellow-400" />
                    <span>Somewhat Salty: {somewhatSaltyCount} ({((somewhatSaltyCount / gamesWithSaltiness.length) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <AlertTriangle className="text-red-400" />
                    <span>Extremely Salty: {extremelySaltyCount} ({((extremelySaltyCount / gamesWithSaltiness.length) * 100).toFixed(1)}%)</span>
                  </div>
                </>
              )}
              {gamesWithSaltiness.length === 0 && (
                <div className="text-white/60 text-sm">
                  No saltiness data recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win Rate Trend */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Win Rate Trend</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff80" />
                  <YAxis 
                    stroke="#ffffff80"
                    tickFormatter={(value: number) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number | string) => [`${Number(value).toFixed(1)}%`, 'Win Rate']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Damage Distribution */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Damage Distribution by Opponent</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={damageData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {damageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff !important'
                    }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number, name: string) => [`${value} damage`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Over Time */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Performance Over Time</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="date" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="damage" 
                    stackId="1" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="commanderDamage" 
                    stackId="2" 
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saltiness Comparison with Playgroup */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Playgroup Saltiness Comparison</h2>
              <select
                value={selectedPlaygroup}
                onChange={(e) => setSelectedPlaygroup(e.target.value)}
                className="bg-white border border-gray-300 rounded px-3 py-2 text-black hover:bg-gray-100"
              >
                <option value="all">All Playgroups</option>
                {userPlaygroups.map(group => (
                  <option key={group._id} value={group.name}>{group.name}</option>
                ))}
              </select>
            </div>
            
            {playgroupSaltinessData.length > 1 ? (
              <>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={playgroupSaltinessData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis 
                        type="number" 
                        stroke="#ffffff80" 
                        domain={[0, 100]}
                        tickFormatter={(value: number) => `${Math.round(value)}%`}
                      />
                      <YAxis 
                        dataKey="player" 
                        type="category" 
                        stroke="#ffffff80" 
                        tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                          const isCurrentUser = playgroupSaltinessData.find(d => d.player === payload.value)?.isCurrentUser;
                          return (
                            <text x={x} y={y} dy={3} textAnchor="end" fill={isCurrentUser ? "#FFD700" : "#ffffff"} fontWeight={isCurrentUser ? "bold" : "normal"}>
                              {payload.value}
                            </text>
                          );
                        }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          border: 'none',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fff' }}
                        formatter={(value: number, name: string) => {
                          switch(name) {
                            case 'notSaltyPercentage':
                              return [`${value}%`, 'Not Salty'];
                            case 'somewhatSaltyPercentage':
                              return [`${value}%`, 'Somewhat Salty'];
                            case 'extremelySaltyPercentage':
                              return [`${value}%`, 'Extremely Salty'];
                            default:
                              return [`${value}%`, name];
                          }
                        }}
                      />
                      <Legend 
                        payload={[
                          { value: 'Not Salty', type: 'square', color: '#10B981' },
                          { value: 'Somewhat Salty', type: 'square', color: '#FBBF24' },
                          { value: 'Extremely Salty', type: 'square', color: '#EF4444' }
                        ]}
                      />
                      <Bar dataKey="notSaltyPercentage" stackId="a" fill="#10B981" />
                      <Bar dataKey="somewhatSaltyPercentage" stackId="a" fill="#FBBF24" />
                      <Bar dataKey="extremelySaltyPercentage" stackId="a" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm text-white/80 mt-2 text-center">
                  Players ranked from least salty to most salty. Your name is highlighted in gold.
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-white/70 mb-4">No saltiness data available for comparison.</p>
                <p className="text-white/50 text-sm">
                  Saltiness data is collected when players rate their mood after games.
                  Play more games and rate your saltiness to see how you compare with others!
                </p>
              </div>
            )}
          </div>

          {/* Opponent Performance Matrix */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Opponent Performance Matrix</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={opponentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="opponent" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: 'none',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="eliminations" fill="#8884d8" name="Eliminations" />
                  <Bar dataKey="eliminatedBy" fill="#82ca9d" name="Eliminated By" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats; 