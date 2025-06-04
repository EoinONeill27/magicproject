import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('Playgroup Feature', () => {
  describe('Playgroup Creation', () => {
    let mockPlaygroups;
    let mockCurrentUser;
    
    beforeEach(() => {
      mockCurrentUser = {
        id: 'user1',
        username: 'Player1'
      };
      
      mockPlaygroups = [
        {
          _id: 'group1',
          name: 'Group A',
          members: ['user1', 'user2'],
          createdBy: 'user1'
        },
        {
          _id: 'group2',
          name: 'Group B',
          members: ['user3', 'user4'],
          createdBy: 'user3'
        }
      ];
    });
    
    it('should create a new playgroup with creator as member', () => {
      const createPlaygroup = (name, currentUser) => {
        return {
          _id: 'new-group',
          name,
          members: [currentUser.id],
          createdBy: currentUser.id
        };
      };

      const newPlaygroup = createPlaygroup('New Group', mockCurrentUser);

      expect(newPlaygroup).toEqual({
        _id: 'new-group',
        name: 'New Group',
        members: ['user1'],
        createdBy: 'user1'
      });
    });
    
    it('should prevent duplicate playgroup names', () => {
      const isNameUnique = (name, playgroups) => {
        return !playgroups.some(group => group.name === name);
      };

      const isUnique = isNameUnique('Group A', mockPlaygroups);

      expect(isUnique).toBe(false);
    });
  });
  
  describe('Playgroup Membership', () => {
    let mockPlaygroup;
    
    beforeEach(() => {
      mockPlaygroup = {
        _id: 'group1',
        name: 'Group A',
        members: ['user1', 'user2'],
        createdBy: 'user1'
      };
    });
    
    it('should allow user to join playgroup', () => {
      const joinPlaygroup = (playgroup, userId) => {
        if (!playgroup.members.includes(userId)) {
          return {
            ...playgroup,
            members: [...playgroup.members, userId]
          };
        }
        return playgroup;
      };

      const updatedPlaygroup = joinPlaygroup(mockPlaygroup, 'user3');

      expect(updatedPlaygroup.members).toHaveLength(3);
      expect(updatedPlaygroup.members).toContain('user3');
    });
    
    it('should prevent duplicate memberships', () => {
      const joinPlaygroup = (playgroup, userId) => {
        if (!playgroup.members.includes(userId)) {
          return {
            ...playgroup,
            members: [...playgroup.members, userId]
          };
        }
        return playgroup;
      };

      const updatedPlaygroup = joinPlaygroup(mockPlaygroup, 'user1');
      expect(updatedPlaygroup.members).toHaveLength(2);
    });
    
    it('should allow user to leave playgroup', () => {
      const leavePlaygroup = (playgroup, userId) => {
        return {
          ...playgroup,
          members: playgroup.members.filter(member => member !== userId)
        };
      };
      
      const updatedPlaygroup = leavePlaygroup(mockPlaygroup, 'user2');
      
      expect(updatedPlaygroup.members).toHaveLength(1);
      expect(updatedPlaygroup.members).not.toContain('user2');
    });
    
    it('should not allow creator to leave playgroup', () => {
      const leavePlaygroup = (playgroup, userId) => {
        if (playgroup.createdBy === userId) {
          return playgroup; // Creator cannot leave
        }
        return {
          ...playgroup,
          members: playgroup.members.filter(member => member !== userId)
        };
      };
      
      const updatedPlaygroup = leavePlaygroup(mockPlaygroup, 'user1');
      
      expect(updatedPlaygroup.members).toHaveLength(2);
      expect(updatedPlaygroup.members).toContain('user1');
    });
  });
  
  describe('Playgroup Member Management', () => {
    let mockPlaygroup;
    
    beforeEach(() => {
      mockPlaygroup = {
        _id: 'group1',
        name: 'Group A',
        members: ['user1', 'user2', 'user3'],
        createdBy: 'user1'
      };
    });
    
    it('should allow creator to kick members', () => {
      const kickMember = (playgroup, creatorId, memberId) => {
        if (playgroup.createdBy === creatorId && memberId !== creatorId) {
          return {
            ...playgroup,
            members: playgroup.members.filter(member => member !== memberId)
          };
        }
        return playgroup;
      };
      
      const updatedPlaygroup = kickMember(mockPlaygroup, 'user1', 'user2');
      
      
      expect(updatedPlaygroup.members).toHaveLength(2);
      expect(updatedPlaygroup.members).not.toContain('user2');
    });
    
    it('should not allow non-creators to kick members', () => {
      const kickMember = (playgroup, requesterId, memberId) => {
        if (playgroup.createdBy === requesterId && memberId !== requesterId) {
          return {
            ...playgroup,
            members: playgroup.members.filter(member => member !== memberId)
          };
        }
        return playgroup;
      };
      
      const updatedPlaygroup = kickMember(mockPlaygroup, 'user2', 'user3');
      
      
      expect(updatedPlaygroup.members).toHaveLength(3);
    });
    
    it('should not allow kicking the creator', () => {
      const kickMember = (playgroup, requesterId, memberId) => {
        if (playgroup.createdBy === requesterId && memberId !== requesterId) {
          return {
            ...playgroup,
            members: playgroup.members.filter(member => member !== memberId)
          };
        }
        return playgroup;
      };
      
      const updatedPlaygroup = kickMember(mockPlaygroup, 'user1', 'user1');
      
      
      expect(updatedPlaygroup.members).toHaveLength(3);
      expect(updatedPlaygroup.members).toContain('user1');
    });
  });
  
  describe('Playgroup Game Settings', () => {
    let mockPlaygroup;
    
    beforeEach(() => {
      mockPlaygroup = {
        _id: 'group1',
        name: 'Group A',
        members: ['user1', 'user2', 'user3'],
        createdBy: 'user1',
        defaultSettings: {
          startingLife: 40,
          randomizeFirstPlayer: true
        }
      };
    });
    
    it('should apply default game settings', () => {
      const getGameSettings = (playgroup, overrideSettings = {}) => {
        return {
          ...playgroup.defaultSettings,
          ...overrideSettings
        };
      };
      
      const settings = getGameSettings(mockPlaygroup);
      
      
      expect(settings).toEqual({
        startingLife: 40,
        randomizeFirstPlayer: true
      });
    });
    
    it('should allow overriding default settings', () => {
      const getGameSettings = (playgroup, overrideSettings = {}) => {
        return {
          ...playgroup.defaultSettings,
          ...overrideSettings
        };
      };
      
      const settings = getGameSettings(mockPlaygroup, {
        startingLife: 30,
        randomizeFirstPlayer: false
      });
      
      
      expect(settings).toEqual({
        startingLife: 30,
        randomizeFirstPlayer: false
      });
    });
    
    it('should validate game settings', () => {
      const validateSettings = (settings) => {
        const valid = {
          startingLife: typeof settings.startingLife === 'number' && settings.startingLife > 0,
          randomizeFirstPlayer: typeof settings.randomizeFirstPlayer === 'boolean'
        };
        return Object.values(valid).every(v => v);
      };
      
      const validSettings = validateSettings({
        startingLife: 40,
        randomizeFirstPlayer: true
      });
      
      const invalidSettings = validateSettings({
        startingLife: -10,
        randomizeFirstPlayer: 'true'
      });
      
      
      expect(validSettings).toBe(true);
      expect(invalidSettings).toBe(false);
    });
  });
}); 