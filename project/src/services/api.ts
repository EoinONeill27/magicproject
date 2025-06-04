import axios from 'axios';
import { User, GameResult, Playgroup, PlayerGameStats, Deck } from '../types';

// API URL from environment variable or fallback to localhost
// Replace process.env with import.meta.env for Vite projects
const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api';

const api = {
  // Auth functions
  registerUser: async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        password
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      return {
        id: response.data.user.id,
        username: response.data.user.username,
        gameHistory: []
      };
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  },

  loginUser: async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      
      // Fetch game history
      const history = await api.getUserGameHistory();
      
      const userData = {
        id: response.data.user.id,
        username: response.data.user.username,
        gameHistory: history
      };
      
      return userData;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  logoutUser: () => {
    localStorage.removeItem('token');
  },

  // Game history functions
  saveGameResult: async (gameResult: GameResult) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      await axios.post(`${API_URL}/games`, gameResult, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  },

  getUserGameHistory: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${API_URL}/games/history`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching game history:', error);
      return [];
    }
  },

  // Playgroup functions
  createPlaygroup: async (name: string, password?: string, isPrivate?: boolean) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(`${API_URL}/playgroups`, 
        { 
          name, 
          password, 
          confirmPassword: password,
          isPrivate 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating playgroup:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  getPlaygroups: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${API_URL}/playgroups`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // For each playgroup, fetch its members
      const playgroups = await Promise.all(response.data.map(async (playgroup: any) => {
        const members = await api.getPlaygroupMembers(playgroup._id);
        return {
          ...playgroup,
          members
        };
      }));
      
      return playgroups;
    } catch (error) {
      console.error('Error fetching playgroups:', error);
      return [];
    }
  },

  joinPlaygroup: async (playgroupId: string, password?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(`${API_URL}/playgroups/${playgroupId}/join`, 
        { password },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error joining playgroup:', error);
      throw error;
    }
  },

  leavePlaygroup: async (playgroupId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(`${API_URL}/playgroups/${playgroupId}/leave`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error leaving playgroup:', error);
      throw error;
    }
  },
  
  getPlaygroupMembers: async (playgroupId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${API_URL}/playgroups/${playgroupId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching playgroup members:', error);
      return [];
    }
  },

  kickPlaygroupMember: async (playgroupId: string, memberUsername: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(
        `${API_URL}/playgroups/${playgroupId}/kick`,
        { memberUsername },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error kicking playgroup member:', error);
      throw error;
    }
  },

  deletePlaygroup: async (playgroupId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.delete(
        `${API_URL}/playgroups/${playgroupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error deleting playgroup:', error);
      throw error;
    }
  },

  // Deck functions
  createDeck: async (name: string, commander?: string, partnerCommander?: string, color?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(`${API_URL}/decks`, 
        { name, commander, partnerCommander, color },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating deck:', error);
      // Extract detailed error message from response if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  getDecks: async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${API_URL}/decks`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching decks:', error);
      return [];
    }
  },

  updateDeck: async (deckId: string, updates: { name?: string, commander?: string, partnerCommander?: string, color?: string }) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.put(`${API_URL}/decks/${deckId}`, updates, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating deck:', error);
      // Extract detailed error message from response if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  deleteDeck: async (deckId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.delete(`${API_URL}/decks/${deckId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error deleting deck:', error);
      throw error;
    }
  },

  incrementDeckWin: async (deckId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(`${API_URL}/decks/${deckId}/win`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error incrementing deck win count:', error);
      throw error;
    }
  },

  incrementDeckPlay: async (deckId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(`${API_URL}/decks/${deckId}/play`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error incrementing deck play count:', error);
      throw error;
    }
  },

  getDecksByUsername: async (username: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.get(`${API_URL}/decks/user/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching decks for user ${username}:`, error);
      return [];
    }
  },

  createDeckForUser: async (username: string, name: string, commander?: string, partnerCommander?: string, color?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await axios.post(`${API_URL}/decks/for-user/${username}`, 
        { name, commander, partnerCommander, color },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error: any) {
      console.error(`Error creating deck for ${username}:`, error);
      // Extract detailed error message from response if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },
};

export default api; 