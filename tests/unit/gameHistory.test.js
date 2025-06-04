import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Game History Feature', () => {
  describe('Game History Sorting', () => {
    let mockGames;
    
    beforeEach(() => {
      mockGames = [
        {
          _id: '1',
          date: '2024-03-15T10:00:00Z',
          turnCount: 15,
          winner: 'Player1',
          players: ['Player1', 'Player2', 'Player3'],
          playerStats: [
            { damageDealt: 20, commanderDamageDealt: 10, eliminations: 1 },
            { damageDealt: 15, commanderDamageDealt: 5, eliminations: 0 },
            { damageDealt: 10, commanderDamageDealt: 0, eliminations: 0 }
          ]
        },
        {
          _id: '2',
          date: '2024-03-14T15:30:00Z',
          turnCount: 20,
          winner: 'Player2',
          players: ['Player1', 'Player2', 'Player3'],
          playerStats: [
            { damageDealt: 25, commanderDamageDealt: 0, eliminations: 0 },
            { damageDealt: 30, commanderDamageDealt: 15, eliminations: 2 },
            { damageDealt: 15, commanderDamageDealt: 5, eliminations: 0 }
          ]
        },
        {
          _id: '3',
          date: '2024-03-13T09:15:00Z',
          turnCount: 12,
          winner: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          playerStats: [
            { damageDealt: 10, commanderDamageDealt: 0, eliminations: 0 },
            { damageDealt: 20, commanderDamageDealt: 10, eliminations: 0 },
            { damageDealt: 35, commanderDamageDealt: 20, eliminations: 2 }
          ]
        }
      ];
    });
    
    it('should sort games by date in descending order', () => {

      const sortGames = (games, field, order) => {
        return [...games].sort((a, b) => {
          const aValue = new Date(a[field]).getTime();
          const bValue = new Date(b[field]).getTime();
          return order === 'desc' ? bValue - aValue : aValue - bValue;
        });
      };

      const sortedGames = sortGames(mockGames, 'date', 'desc');

      expect(sortedGames[0]._id).toBe('1');
      expect(sortedGames[1]._id).toBe('2');
      expect(sortedGames[2]._id).toBe('3');
    });
    
    it('should sort games by turn count in ascending order', () => {

      const sortGames = (games, field, order) => {
        return [...games].sort((a, b) => {
          return order === 'desc' ? b[field] - a[field] : a[field] - b[field];
        });
      };

      const sortedGames = sortGames(mockGames, 'turnCount', 'asc');

      expect(sortedGames[0]._id).toBe('3');
      expect(sortedGames[1]._id).toBe('1');
      expect(sortedGames[2]._id).toBe('2');
    });
  });
  
  describe('Game Details', () => {
    it('should calculate player statistics correctly', () => {

      const game = {
        _id: '1',
        winner: 'Player1',
        players: ['Player1', 'Player2', 'Player3'],
        playerStats: [
          { damageDealt: 20, commanderDamageDealt: 10, eliminations: 1 },
          { damageDealt: 15, commanderDamageDealt: 5, eliminations: 0 },
          { damageDealt: 10, commanderDamageDealt: 0, eliminations: 0 }
        ]
      };

      const calculateStats = (game) => {
        return game.players.map((player, index) => {
          const stats = game.playerStats?.[index] || {};
          return {
            player,
            isWinner: game.winner === player,
            damageDealt: stats.damageDealt || 0,
            commanderDamageDealt: stats.commanderDamageDealt || 0,
            eliminations: stats.eliminations || 0
          };
        });
      };
      
      const stats = calculateStats(game);

      expect(stats).toHaveLength(3);
      expect(stats[0]).toEqual({
        player: 'Player1',
        isWinner: true,
        damageDealt: 20,
        commanderDamageDealt: 10,
        eliminations: 1
      });
      expect(stats[1].isWinner).toBe(false);
      expect(stats[2].isWinner).toBe(false);
    });
    
    it('should handle missing player stats gracefully', () => {

      const game = {
        _id: '1',
        winner: 'Player1',
        players: ['Player1', 'Player2', 'Player3'],
        playerStats: [
          { damageDealt: 20, commanderDamageDealt: 10, eliminations: 1 },
          undefined, // Missing stats for Player2
          { damageDealt: 10, commanderDamageDealt: 0, eliminations: 0 }
        ]
      };

      const calculateStats = (game) => {
        return game.players.map((player, index) => {
          const stats = game.playerStats?.[index] || {};
          return {
            player,
            isWinner: game.winner === player,
            damageDealt: stats.damageDealt || 0,
            commanderDamageDealt: stats.commanderDamageDealt || 0,
            eliminations: stats.eliminations || 0
          };
        });
      };
      
      const stats = calculateStats(game);

      expect(stats).toHaveLength(3);
      expect(stats[1]).toEqual({
        player: 'Player2',
        isWinner: false,
        damageDealt: 0,
        commanderDamageDealt: 0,
        eliminations: 0
      });
    });
  });
  
  describe('Pagination', () => {
    let mockGames;
    
    beforeEach(() => {
      mockGames = Array.from({ length: 15 }, (_, i) => ({
        _id: String(i + 1),
        date: `2024-03-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
        turnCount: 10 + i,
        winner: `Player${(i % 3) + 1}`,
        players: ['Player1', 'Player2', 'Player3'],
        playerStats: [
          { damageDealt: 20, commanderDamageDealt: 10, eliminations: 1 },
          { damageDealt: 15, commanderDamageDealt: 5, eliminations: 0 },
          { damageDealt: 10, commanderDamageDealt: 0, eliminations: 0 }
        ]
      }));
    });
    
    it('should paginate games correctly', () => {
      const paginateGames = (games, page, pageSize) => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return games.slice(start, end);
      };

      const page1 = paginateGames(mockGames, 1, 5);
      const page2 = paginateGames(mockGames, 2, 5);
      const page3 = paginateGames(mockGames, 3, 5);

      expect(page1).toHaveLength(5);
      expect(page1[0]._id).toBe('1');
      expect(page1[4]._id).toBe('5');
      
      expect(page2).toHaveLength(5);
      expect(page2[0]._id).toBe('6');
      expect(page2[4]._id).toBe('10');
      
      expect(page3).toHaveLength(5);
      expect(page3[0]._id).toBe('11');
      expect(page3[4]._id).toBe('15');
    });
    
    it('should handle last page with fewer items', () => {

      const paginateGames = (games, page, pageSize) => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return games.slice(start, end);
      };

      const page = paginateGames(mockGames, 4, 5);

      expect(page).toHaveLength(0);
    });
    
    it('should calculate total pages correctly', () => {

      const calculateTotalPages = (totalItems, pageSize) => {
        return Math.ceil(totalItems / pageSize);
      };

      const totalPages = calculateTotalPages(mockGames.length, 5);

      expect(totalPages).toBe(3);
    });
  });
  
  describe('Game History Filtering', () => {
    let mockGames;
    
    beforeEach(() => {
      mockGames = [
        {
          _id: '1',
          date: '2024-03-15T10:00:00Z',
          winner: 'Player1',
          players: ['Player1', 'Player2', 'Player3'],
          playgroupName: 'Group A'
        },
        {
          _id: '2',
          date: '2024-03-14T15:30:00Z',
          winner: 'Player2',
          players: ['Player1', 'Player2', 'Player3'],
          playgroupName: 'Group B'
        },
        {
          _id: '3',
          date: '2024-03-13T09:15:00Z',
          winner: 'Player3',
          players: ['Player1', 'Player2', 'Player3'],
          playgroupName: 'Group A'
        }
      ];
    });
    
    it('should filter games by playgroup', () => {

      const filterGames = (games, playgroup) => {
        return games.filter(game => game.playgroupName === playgroup);
      };

      const groupAGames = filterGames(mockGames, 'Group A');
      const groupBGames = filterGames(mockGames, 'Group B');

      expect(groupAGames).toHaveLength(2);
      expect(groupAGames[0]._id).toBe('1');
      expect(groupAGames[1]._id).toBe('3');
      
      expect(groupBGames).toHaveLength(1);
      expect(groupBGames[0]._id).toBe('2');
    });
    
    it('should filter games by winner', () => {
      const filterGames = (games, winner) => {
        return games.filter(game => game.winner === winner);
      };

      const player1Wins = filterGames(mockGames, 'Player1');
      const player2Wins = filterGames(mockGames, 'Player2');
      const player3Wins = filterGames(mockGames, 'Player3');

      expect(player1Wins).toHaveLength(1);
      expect(player1Wins[0]._id).toBe('1');
      
      expect(player2Wins).toHaveLength(1);
      expect(player2Wins[0]._id).toBe('2');
      
      expect(player3Wins).toHaveLength(1);
      expect(player3Wins[0]._id).toBe('3');
    });
    
    it('should filter games by date range', () => {

      const filterGames = (games, startDate, endDate) => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return games.filter(game => {
          const gameDate = new Date(game.date).getTime();
          return gameDate >= start && gameDate <= end;
        });
      };

      const filteredGames = filterGames(
        mockGames,
        '2024-03-14T00:00:00Z',
        '2024-03-15T23:59:59Z'
      );
      

      expect(filteredGames).toHaveLength(2);
      expect(filteredGames[0]._id).toBe('1');
      expect(filteredGames[1]._id).toBe('2');
    });
  });
}); 