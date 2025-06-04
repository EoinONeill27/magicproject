import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, ArrowLeft, Check, X, Box } from 'lucide-react';
import api from '../services/api';
import { Deck } from '../types';

interface DeckManagerProps {
  onBack: () => void;
  forPlayerName?: string | null; // Optional parameter for the player we're creating a deck for
}

const DeckManager: React.FC<DeckManagerProps> = ({ onBack, forPlayerName }) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New deck form state
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckCommander, setNewDeckCommander] = useState('');
  const [newDeckPartner, setNewDeckPartner] = useState('');
  const [newDeckColor, setNewDeckColor] = useState('');
  
  // Edit deck state
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editDeckName, setEditDeckName] = useState('');
  const [editDeckCommander, setEditDeckCommander] = useState('');
  const [editDeckPartner, setEditDeckPartner] = useState('');
  const [editDeckColor, setEditDeckColor] = useState('');
  
  // Fetch decks on initial load
  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setLoading(true);
        
        let fetchedDecks;
        if (forPlayerName) {
          fetchedDecks = await api.getDecksByUsername(forPlayerName);
        } else {
          fetchedDecks = await api.getDecks();
        }
        
        setDecks(fetchedDecks);
        setError(null);
      } catch (err) {
        console.error('Error fetching decks:', err);
        setError('Failed to load decks');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDecks();
    
    // Cleanup function that runs when component unmounts
    return () => {
    };
  }, [forPlayerName]);
  
  // Handle create new deck
  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newDeckName.trim()) {
      setError('Deck name is required');
      return;
    }
    
    try {
      setLoading(true);
      let newDeck;
      
      if (forPlayerName) {
        // Create deck for specific player
        newDeck = await api.createDeckForUser(
          forPlayerName,
          newDeckName,
          newDeckCommander || undefined,
          newDeckPartner || undefined,
          newDeckColor
        );
      } else {
        // Create deck for current user
        newDeck = await api.createDeck(
          newDeckName,
          newDeckCommander || undefined,
          newDeckPartner || undefined,
          newDeckColor
        );
      }
      
      setDecks(prevDecks => [...prevDecks, newDeck]);
      setShowNewDeckForm(false);
      setNewDeckName('');
      setNewDeckCommander('');
      setNewDeckPartner('');
      setNewDeckColor('');
      setError(null);
    } catch (err: any) {
      console.error('Error creating deck:', err);
      setError(err.message || 'Failed to create deck');
    } finally {
      setLoading(false);
    }
  };
  
  // Start editing deck
  const startEditingDeck = (deck: Deck) => {
    setEditingDeckId(deck._id);
    setEditDeckName(deck.name);
    setEditDeckCommander(deck.commander || '');
    setEditDeckPartner(deck.partnerCommander || '');
    setEditDeckColor(deck.color || '');
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingDeckId(null);
  };
  
  // Save deck edits
  const saveDeckEdit = async (deckId: string) => {
    if (!editDeckName.trim()) {
      setError('Deck name is required');
      return;
    }
    
    try {
      setLoading(true);
      const updatedDeck = await api.updateDeck(deckId, {
        name: editDeckName,
        commander: editDeckCommander || undefined,
        partnerCommander: editDeckPartner || undefined,
        color: editDeckColor
      });
      
      setDecks(prevDecks => 
        prevDecks.map(deck => 
          deck._id === deckId ? updatedDeck : deck
        )
      );
      
      setEditingDeckId(null);
      setError(null);
    } catch (err: any) {
      console.error('Error updating deck:', err);
      setError(err.message || 'Failed to update deck');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete deck
  const deleteDeck = async (deckId: string) => {
    if (!window.confirm('Are you sure you want to delete this deck?')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.deleteDeck(deckId);
      
      setDecks(prevDecks => 
        prevDecks.filter(deck => deck._id !== deckId)
      );
      
      setError(null);
    } catch (err: any) {
      console.error('Error deleting deck:', err);
      setError(err.message || 'Failed to delete deck');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate win rate for a deck
  const calculateWinRate = (deck: Deck): string => {
    // Handle case where playCount is 0 or undefined
    if (!deck.playCount || deck.playCount === 0) return '0%';

    // Handle case where winCount is undefined
    const wins = deck.winCount || 0;

    // Ensure winCount is not greater than playCount (data integrity)
    const validWins = Math.min(wins, deck.playCount);

    // Calculate and round the win rate
    return `${Math.round((validWins / deck.playCount) * 100)}%`;
  };

  const getColorFromIdentity = (colorIdentity: string): string => {
    if (!colorIdentity) return '#6366f1'; // Default indigo
    
    // Standard color combinations
    if (colorIdentity === 'WUBRG') return '#85764d'; // 5-color gold
    if (colorIdentity.length >= 3) return '#d4af37'; // Gold for 3+ colors
    
    // Two-color combinations
    if (colorIdentity.includes('W') && colorIdentity.includes('U')) return '#aab0e5'; // Azorius
    if (colorIdentity.includes('U') && colorIdentity.includes('B')) return '#3a5874'; // Dimir
    if (colorIdentity.includes('B') && colorIdentity.includes('R')) return '#5c4e47'; // Rakdos
    if (colorIdentity.includes('R') && colorIdentity.includes('G')) return '#a2582b'; // Gruul
    if (colorIdentity.includes('G') && colorIdentity.includes('W')) return '#636c3f'; // Selesnya
    if (colorIdentity.includes('W') && colorIdentity.includes('B')) return '#756468'; // Orzhov
    if (colorIdentity.includes('U') && colorIdentity.includes('R')) return '#5a4588'; // Izzet
    if (colorIdentity.includes('B') && colorIdentity.includes('G')) return '#294a30'; // Golgari
    if (colorIdentity.includes('R') && colorIdentity.includes('W')) return '#ab493f'; // Boros
    if (colorIdentity.includes('G') && colorIdentity.includes('U')) return '#427069'; // Simic
    
    // Single colors
    if (colorIdentity === 'W') return '#e9e7e0'; // White
    if (colorIdentity === 'U') return '#0e68ab'; // Blue
    if (colorIdentity === 'B') return '#3d3042'; // Black
    if (colorIdentity === 'R') return '#d32029'; // Red
    if (colorIdentity === 'G') return '#26714a'; // Green
    
    // Colorless
    if (colorIdentity === 'C' || colorIdentity === '') return '#a9a9a9'; // Gray for colorless
    
    return '#6366f1'; // Default indigo
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl font-bold text-white">
              {forPlayerName ? `${forPlayerName}'s Decks` : 'My Decks'}
            </h1>
          </div>
          
          <button
            onClick={() => setShowNewDeckForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            disabled={showNewDeckForm}
          >
            <Plus size={20} />
            {forPlayerName ? `New Deck for ${forPlayerName}` : 'New Deck'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg mb-6 relative">
            <div className="flex items-start">
              <div className="flex-1 pr-8">
                <h3 className="font-bold text-lg mb-1">Error</h3>
                <p>{error}</p>
                {error.includes('deck name') && (
                  <p className="mt-2 text-sm text-red-200">
                    Please choose a different name for your deck.
                  </p>
                )}
              </div>
              <button 
                onClick={() => setError(null)} 
                className="absolute right-3 top-3 text-white/60 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
        
        {/* New Deck Form */}
        {showNewDeckForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">
              {forPlayerName ? `Create New Deck for ${forPlayerName}` : 'Create New Deck'}
            </h2>
            
            <form onSubmit={handleCreateDeck}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/80 mb-2 text-sm font-medium">
                    Deck Name *
                  </label>
                  <input
                    type="text"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    placeholder="My Commander Deck"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 mb-2 text-sm font-medium">
                    Commander
                  </label>
                  <input
                    type="text"
                    value={newDeckCommander}
                    onChange={(e) => setNewDeckCommander(e.target.value)}
                    placeholder="Atraxa, Praetors' Voice"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 mb-2 text-sm font-medium">
                    Partner Commander
                  </label>
                  <input
                    type="text"
                    value={newDeckPartner}
                    onChange={(e) => setNewDeckPartner(e.target.value)}
                    placeholder="Partner commander (if applicable)"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 mb-2 text-sm font-medium">
                    Color Identity
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10">
                      <input
                        type="checkbox"
                        checked={newDeckColor.includes('W')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDeckColor(prev => prev + 'W');
                          } else {
                            setNewDeckColor(prev => prev.replace('W', ''));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-white">White (W)</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10">
                      <input
                        type="checkbox"
                        checked={newDeckColor.includes('U')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDeckColor(prev => prev + 'U');
                          } else {
                            setNewDeckColor(prev => prev.replace('U', ''));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-white">Blue (U)</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10">
                      <input
                        type="checkbox"
                        checked={newDeckColor.includes('B')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDeckColor(prev => prev + 'B');
                          } else {
                            setNewDeckColor(prev => prev.replace('B', ''));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-white">Black (B)</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10">
                      <input
                        type="checkbox"
                        checked={newDeckColor.includes('R')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDeckColor(prev => prev + 'R');
                          } else {
                            setNewDeckColor(prev => prev.replace('R', ''));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-white">Red (R)</span>
                    </label>
                    <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/10">
                      <input
                        type="checkbox"
                        checked={newDeckColor.includes('G')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDeckColor(prev => prev + 'G');
                          } else {
                            setNewDeckColor(prev => prev.replace('G', ''));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-white">Green (G)</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewDeckForm(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <X size={18} />
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  <Check size={18} />
                  Save Deck
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Decks List */}
        {loading && decks.length === 0 ? (
          <div className="text-white text-center py-10">Loading decks...</div>
        ) : decks.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
            <Box className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <p className="text-white text-lg mb-4">You don't have any decks yet.</p>
            <button
              onClick={() => setShowNewDeckForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Your First Deck
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <div 
                key={deck._id}
                className="relative bg-white/10 backdrop-blur-lg rounded-xl p-6 transition-all hover:bg-white/15 overflow-hidden"
                style={{ 
                  borderLeft: `4px solid ${getColorFromIdentity(deck.color || '')}`,
                }}
              >
                {editingDeckId === deck._id ? (
                  // Edit Form
                  <div>
                    <div className="space-y-3 mb-3">
                      <input
                        type="text"
                        value={editDeckName}
                        onChange={(e) => setEditDeckName(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                        placeholder="Deck Name"
                      />
                      
                      <input
                        type="text"
                        value={editDeckCommander}
                        onChange={(e) => setEditDeckCommander(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                        placeholder="Commander"
                      />
                      
                      <input
                        type="text"
                        value={editDeckPartner}
                        onChange={(e) => setEditDeckPartner(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20"
                        placeholder="Partner (optional)"
                      />
                      
                      <div className="space-y-1 mb-3">
                        <label className="block text-white/80 text-sm">Color Identity</label>
                        <div className="flex flex-wrap gap-2">
                          <label className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer hover:bg-white/10">
                            <input
                              type="checkbox"
                              checked={editDeckColor.includes('W')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDeckColor(prev => prev + 'W');
                                } else {
                                  setEditDeckColor(prev => prev.replace('W', ''));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-white text-sm">W</span>
                          </label>
                          <label className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer hover:bg-white/10">
                            <input
                              type="checkbox"
                              checked={editDeckColor.includes('U')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDeckColor(prev => prev + 'U');
                                } else {
                                  setEditDeckColor(prev => prev.replace('U', ''));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-white text-sm">U</span>
                          </label>
                          <label className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer hover:bg-white/10">
                            <input
                              type="checkbox"
                              checked={editDeckColor.includes('B')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDeckColor(prev => prev + 'B');
                                } else {
                                  setEditDeckColor(prev => prev.replace('B', ''));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-white text-sm">B</span>
                          </label>
                          <label className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer hover:bg-white/10">
                            <input
                              type="checkbox"
                              checked={editDeckColor.includes('R')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDeckColor(prev => prev + 'R');
                                } else {
                                  setEditDeckColor(prev => prev.replace('R', ''));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-white text-sm">R</span>
                          </label>
                          <label className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 cursor-pointer hover:bg-white/10">
                            <input
                              type="checkbox"
                              checked={editDeckColor.includes('G')}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDeckColor(prev => prev + 'G');
                                } else {
                                  setEditDeckColor(prev => prev.replace('G', ''));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-white text-sm">G</span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditing}
                          className="bg-white/10 hover:bg-white/20 text-white p-1 rounded-lg"
                        >
                          <X size={18} />
                        </button>
                        
                        <button
                          onClick={() => saveDeckEdit(deck._id)}
                          className="bg-green-600 hover:bg-green-700 text-white p-1 rounded-lg"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Deck Display
                  <>
                    <div className="flex justify-between mb-1">
                      <h2 className="text-xl font-bold text-white">{deck.name}</h2>
                      
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditingDeck(deck)}
                          className="text-white/60 hover:text-white"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={() => deleteDeck(deck._id)}
                          className="text-white/60 hover:text-red-400"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {deck.commander && (
                      <div className="text-white/80 text-sm mb-1">
                        Commander: {deck.commander}
                        {deck.partnerCommander && ` & ${deck.partnerCommander}`}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-white/60 text-xs">Played</div>
                        <div className="text-white font-medium">{deck.playCount}</div>
                      </div>
                      
                      <div>
                        <div className="text-white/60 text-xs">Wins</div>
                        <div className="text-white font-medium">{deck.winCount}</div>
                      </div>
                      
                      <div>
                        <div className="text-white/60 text-xs">Win Rate</div>
                        <div className="text-white font-medium">{calculateWinRate(deck)}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckManager; 