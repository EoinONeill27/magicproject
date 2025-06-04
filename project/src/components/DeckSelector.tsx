import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Check, Users, User, X } from 'lucide-react';
import api from '../services/api';
import { Deck, Playgroup } from '../types';

interface DeckSelectorProps {
  playerId: number;
  playerName: string;
  borrowedDeckIds: string[];
  onSelectDeck: (playerId: number, deckId: string, deckName: string) => void;
  onCancel: () => void;
  onCreateNew: () => void;
}

const DeckSelector: React.FC<DeckSelectorProps> = ({ 
  playerId, 
  playerName, 
  borrowedDeckIds,
  onSelectDeck, 
  onCancel,
  onCreateNew
}) => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [playgroupDecks, setPlaygroupDecks] = useState<{[username: string]: Deck[]}>({});
  const [loading, setLoading] = useState(true);
  const [loadingPlaygroupDecks, setLoadingPlaygroupDecks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedBorrowedDeckId, setSelectedBorrowedDeckId] = useState<string | null>(null);
  const [showBorrowedDecks, setShowBorrowedDecks] = useState(false);
  const [playgroups, setPlaygroups] = useState<Playgroup[]>([]);

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        setLoading(true);
        console.log(`Fetching decks for player: ${playerName}`);
        
        // Fetch decks for the specific player
        const fetchedDecks = await api.getDecksByUsername(playerName);
        console.log(`Fetched ${fetchedDecks.length} decks for ${playerName}`);
        setDecks(fetchedDecks);
        
        // If there's only one deck, auto-select it
        if (fetchedDecks.length === 1) {
          setSelectedDeckId(fetchedDecks[0]._id);
        }
        
        // Fetch playgroups for borrowing
        const fetchedPlaygroups = await api.getPlaygroups();
        setPlaygroups(fetchedPlaygroups.filter(pg => pg.members.includes(playerName)));
      } catch (err) {
        console.error('Error fetching decks:', err);
        setError(`Failed to load decks for ${playerName}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDecks();
  }, [playerName]);

  const fetchPlaygroupDecks = async (playgroup: Playgroup) => {
    try {
      console.log('Fetching decks for playgroup:', playgroup.name);
      setLoadingPlaygroupDecks(true);
      const memberDecks: {[username: string]: Deck[]} = {};
      
      // Fetch decks for each member except the current player
      const membersToFetch = playgroup.members.filter(m => m !== playerName);
      console.log('Members to fetch decks from:', membersToFetch);
      
      for (const member of membersToFetch) {
        console.log(`Fetching decks for member: ${member}`);
        try {
          const decks = await api.getDecksByUsername(member);
          console.log(`Found ${decks.length} decks for ${member}`);
          if (decks.length > 0) {
            memberDecks[member] = decks;
          }
        } catch (err) {
          console.error(`Error fetching decks for ${member}:`, err);
        }
      }
      
      console.log('Fetched decks:', memberDecks);
      setPlaygroupDecks(memberDecks);
      setSelectedBorrowedDeckId(null);
    } catch (err) {
      console.error('Error in fetchPlaygroupDecks:', err);
      setError('Failed to load playgroup decks');
    } finally {
      setLoadingPlaygroupDecks(false);
    }
  };

  const handleConfirmSelection = () => {
    if (showBorrowedDecks && selectedBorrowedDeckId) {
      // Find the borrowed deck across all users
      let selectedDeck: Deck | null = null;
      let deckOwner = '';
      
      for (const [username, userDecks] of Object.entries(playgroupDecks)) {
        const found = userDecks.find(deck => deck._id === selectedBorrowedDeckId);
        if (found) {
          selectedDeck = found;
          deckOwner = username;
          break;
        }
      }
      
      if (selectedDeck) {
        onSelectDeck(playerId, selectedDeck._id, `${selectedDeck.name} (borrowed from ${deckOwner})`);
      }
    } else if (selectedDeckId) {
      const selectedDeck = decks.find(deck => deck._id === selectedDeckId);
      if (selectedDeck) {
        onSelectDeck(playerId, selectedDeck._id, selectedDeck.name);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">
            Select Deck for {playerName}
          </h2>
          <button 
            onClick={onCancel}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-lg mb-6 relative">
            <div className="flex items-start">
              <div className="flex-1 pr-8">
                <p>{error}</p>
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
        
        {/* Tabs for selecting personal or borrowed decks */}
        <div className="flex mb-4 border-b border-white/20">
          <button 
            onClick={() => setShowBorrowedDecks(false)}
            className={`px-4 py-2 ${!showBorrowedDecks ? 'text-white border-b-2 border-indigo-500' : 'text-white/60 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <User size={18} />
              <span>My Decks</span>
            </div>
          </button>
          <button 
            onClick={() => setShowBorrowedDecks(true)}
            className={`px-4 py-2 ${showBorrowedDecks ? 'text-white border-b-2 border-indigo-500' : 'text-white/60 hover:text-white'}`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              <span>Borrow</span>
            </div>
          </button>
        </div>
        
        {!showBorrowedDecks ? (
          // Show personal decks
          loading ? (
            <div className="text-white text-center py-6">Loading {playerName}'s decks...</div>
          ) : decks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white mb-4">{playerName} doesn't have any decks yet.</p>
              <button
                onClick={onCreateNew}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={18} />
                Create a Deck for {playerName}
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 mb-6 max-h-80 overflow-y-auto pr-2">
                {decks.map(deck => {
                  // Check if this deck is already borrowed by another player
                  const isBorrowed = borrowedDeckIds.includes(deck._id);
                  // Don't allow selecting a deck that's already in use
                  const isDisabled = isBorrowed;
                  
                  return (
                    <button
                      key={deck._id}
                      onClick={() => !isDisabled && setSelectedDeckId(deck._id)}
                      className={`text-left p-3 rounded-lg transition-colors ${
                        selectedDeckId === deck._id 
                          ? 'bg-indigo-600 text-white' 
                          : isDisabled
                            ? 'bg-gray-600/50 text-white/50 cursor-not-allowed'
                            : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      style={{ 
                        borderLeft: `4px solid ${deck.color || '#6366f1'}`,
                      }}
                      disabled={isDisabled}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">
                            {deck.name}
                            {isBorrowed && " (in use by another player)"}
                          </div>
                          {deck.commander && (
                            <div className="text-sm opacity-80">
                              {deck.commander}
                              {deck.partnerCommander && ` & ${deck.partnerCommander}`}
                            </div>
                          )}
                          <div className="text-xs opacity-70 mt-1">
                            W/L: {deck.winCount}/{deck.playCount} ({deck.playCount > 0 ? Math.round((deck.winCount / deck.playCount) * 100) : 0}%)
                          </div>
                        </div>
                        
                        {selectedDeckId === deck._id && (
                          <Check size={20} className="text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={onCreateNew}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus size={18} />
                  New Deck
                </button>
                
                <button
                  onClick={handleConfirmSelection}
                  disabled={!selectedDeckId}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedDeckId 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-white/5 text-white/40 cursor-not-allowed'
                  }`}
                >
                  <Check size={18} />
                  Select Deck
                </button>
              </div>
            </>
          )
        ) : (
          // Show borrow interface
          <>
            {Object.keys(playgroupDecks).length === 0 ? (
              <>
                <p className="text-white/80 mb-4">Select a playgroup to borrow a deck from:</p>
                {loading ? (
                  <div className="text-white text-center py-6">Loading playgroups...</div>
                ) : playgroups.length === 0 ? (
                  <div className="text-white text-center py-6">You are not a member of any playgroups.</div>
                ) : (
                  <div className="grid gap-3 mb-6 max-h-80 overflow-y-auto pr-2">
                    {playgroups.map(playgroup => (
                      <button
                        key={playgroup._id}
                        onClick={async () => {
                          await fetchPlaygroupDecks(playgroup);
                          setSelectedBorrowedDeckId('');
                        }}
                        className="text-left p-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="text-indigo-400" size={20} />
                          <div>
                            <div className="font-medium">{playgroup.name}</div>
                            <div className="text-sm opacity-70">{playgroup.members.length} members</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <button 
                    onClick={() => {
                      setPlaygroupDecks({});
                      setSelectedBorrowedDeckId(null);
                    }}
                    className="text-white/60 hover:text-white flex items-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    <span>Back to Playgroups</span>
                  </button>
                </div>
                
                {loadingPlaygroupDecks ? (
                  <div className="text-white text-center py-6">Loading decks from playgroup members...</div>
                ) : Object.keys(playgroupDecks).length === 0 ? (
                  <div className="text-white text-center py-6">No decks found from playgroup members.</div>
                ) : (
                  <div className="mb-6 max-h-80 overflow-y-auto pr-2">
                    {Object.entries(playgroupDecks).map(([username, userDecks]) => (
                      <div key={username} className="mb-4">
                        <h4 className="text-indigo-300 font-medium text-sm mb-2">{username}'s Decks:</h4>
                        <div className="grid gap-2">
                          {userDecks.map(deck => {
                            // Check if this deck is already borrowed by another player
                            const isBorrowed = borrowedDeckIds.includes(deck._id);
                            // Don't allow selecting a deck that's already in use
                            const isDisabled = isBorrowed;
                            
                            return (
                              <button
                                key={deck._id}
                                onClick={() => !isDisabled && setSelectedBorrowedDeckId(deck._id)}
                                className={`text-left p-3 rounded-lg transition-colors ${
                                  selectedBorrowedDeckId === deck._id 
                                    ? 'bg-indigo-600 text-white' 
                                    : isDisabled
                                      ? 'bg-gray-600/50 text-white/50 cursor-not-allowed'
                                      : 'bg-white/10 text-white hover:bg-white/20'
                                }`}
                                style={{ 
                                  borderLeft: `4px solid ${deck.color || '#6366f1'}`,
                                }}
                                disabled={isDisabled}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">
                                      {deck.name}
                                      {isBorrowed && " (in use by another player)"}
                                    </div>
                                    {deck.commander && (
                                      <div className="text-sm opacity-80">
                                        {deck.commander}
                                        {deck.partnerCommander && ` & ${deck.partnerCommander}`}
                                      </div>
                                    )}
                                    <div className="text-xs opacity-70 mt-1">
                                      W/L: {deck.winCount}/{deck.playCount} ({deck.playCount > 0 ? Math.round((deck.winCount / deck.playCount) * 100) : 0}%)
                                    </div>
                                  </div>
                                  
                                  {selectedBorrowedDeckId === deck._id && (
                                    <Check size={20} className="text-white" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <button
                    onClick={handleConfirmSelection}
                    disabled={!selectedBorrowedDeckId}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedBorrowedDeckId 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-white/5 text-white/40 cursor-not-allowed'
                    }`}
                  >
                    <Check size={18} />
                    Borrow Deck
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DeckSelector; 