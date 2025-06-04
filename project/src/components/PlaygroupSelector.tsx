import React, { useState, useEffect } from 'react';
import { Playgroup, User } from '../types';
import api from '../services/api';
import { Plus, UserPlus, Users, X, Check, LogOut, Search, Trash2, Crown } from 'lucide-react';

interface PlaygroupSelectorProps {
  currentUser: User;
  onSelectMembers: (players: string[], playgroup: Playgroup, startingLife: number, randomizeFirstPlayer?: boolean) => void;
  onBack: () => void;
}

const PlaygroupSelector: React.FC<PlaygroupSelectorProps> = ({ 
  currentUser,
  onSelectMembers,
  onBack
}) => {
  const [playgroups, setPlaygroups] = useState<Playgroup[]>([]);
  const [selectedPlaygroup, setSelectedPlaygroup] = useState<Playgroup | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaygroupName, setNewPlaygroupName] = useState('');
  const [newPlaygroupPassword, setNewPlaygroupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinPassword, setJoinPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedPlaygroupToJoin, setSelectedPlaygroupToJoin] = useState<Playgroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPlaygroup, setCurrentPlaygroup] = useState<Playgroup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'member' | 'available'>('member');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToKick, setMemberToKick] = useState<string | null>(null);
  const [startingLife, setStartingLife] = useState<number>(40); // Default to Commander life total
  const [randomizeFirstPlayer, setRandomizeFirstPlayer] = useState<boolean>(false);

  useEffect(() => {
    const fetchPlaygroups = async () => {
      try {
        setIsLoading(true);
        const fetchedPlaygroups = await api.getPlaygroups();
        setPlaygroups(fetchedPlaygroups);
        
        // Find all playgroups where the current user is a member
        const userPlaygroups = fetchedPlaygroups.filter(pg => 
          pg.members.includes(currentUser.username)
        );
        
        // Set the first playgroup as selected by default
        if (userPlaygroups.length > 0) {
          setSelectedPlaygroup(userPlaygroups[0]);
        }
        
        setIsLoading(false);
      } catch (error) {
        setErrorMessage('Failed to load playgroups');
        setIsLoading(false);
      }
    };

    fetchPlaygroups();
  }, [currentUser.username]);

  // Filter playgroups based on search query and filter type
  const filteredPlaygroups = playgroups.filter(playgroup => {
    const matchesSearch = playgroup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      playgroup.members.some(member => member.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const isMember = playgroup.members.includes(currentUser.username);
    
    switch (filterType) {
      case 'member':
        return matchesSearch && isMember;
      case 'available':
        return matchesSearch && !isMember;
      default:
        return matchesSearch;
    }
  });

  // Group playgroups by membership status
  const memberPlaygroups = filteredPlaygroups.filter(pg => pg.members.includes(currentUser.username));
  const availablePlaygroups = filteredPlaygroups.filter(pg => !pg.members.includes(currentUser.username));

  const handleLeavePlaygroup = async () => {
    if (!currentPlaygroup) return;
    
    try {
      setIsLoading(true);
      await api.leavePlaygroup(currentPlaygroup._id);
      // Fetch updated playgroups list
      const updatedPlaygroups = await api.getPlaygroups();
      setPlaygroups(updatedPlaygroups);
      setCurrentPlaygroup(null);
      setSelectedPlaygroup(null); // Clear selected playgroup
      setSelectedMembers([]); // Clear selected members
      setShowDeleteConfirm(false);
      setIsLoading(false);
    } catch (error) {
      setErrorMessage('Failed to leave playgroup');
      setIsLoading(false);
    }
  };

  const handleCreatePlaygroup = async () => {
    if (!newPlaygroupName.trim()) {
      setErrorMessage('Please enter a playgroup name');
      return;
    }

    if (isPrivate && !newPlaygroupPassword) {
      setErrorMessage('Please enter a password for the private playgroup');
      return;
    }

    if (isPrivate && newPlaygroupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const newPlaygroup = await api.createPlaygroup(
        newPlaygroupName, 
        isPrivate ? newPlaygroupPassword : undefined, 
        isPrivate
      );
      
      // Immediately update the playgroups list
      const updatedPlaygroups = await api.getPlaygroups();
      setPlaygroups(updatedPlaygroups);
      
      // Find and set the newly created playgroup
      const createdPlaygroup = updatedPlaygroups.find(pg => pg._id === newPlaygroup._id);
      if (createdPlaygroup) {
        setCurrentPlaygroup(createdPlaygroup);
        setSelectedPlaygroup(createdPlaygroup);
      }
      
      // Reset form state
      setIsCreatingNew(false);
      setNewPlaygroupName('');
      setNewPlaygroupPassword('');
      setConfirmPassword('');
      setIsPrivate(false);
      setErrorMessage('');
      
      setIsLoading(false);
    } catch (error: any) {
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Failed to create playgroup');
      }
      setIsLoading(false);
    }
  };

  const handleJoinPlaygroup = async (playgroup: Playgroup) => {
    if (playgroup.isPrivate) {
      setSelectedPlaygroupToJoin(playgroup);
      setShowPasswordModal(true);
      return;
    }

    try {
      setIsLoading(true);
      await api.joinPlaygroup(playgroup._id);
      const updatedPlaygroups = await api.getPlaygroups();
      setPlaygroups(updatedPlaygroups);
      setIsLoading(false);
    } catch (error) {
      setErrorMessage('Failed to join playgroup');
      setIsLoading(false);
    }
  };

  const handleJoinWithPassword = async () => {
    if (!selectedPlaygroupToJoin) return;

    try {
      setIsLoading(true);
      await api.joinPlaygroup(selectedPlaygroupToJoin._id, joinPassword);
      const updatedPlaygroups = await api.getPlaygroups();
      setPlaygroups(updatedPlaygroups);
      setShowPasswordModal(false);
      setJoinPassword('');
      setSelectedPlaygroupToJoin(null);
      setIsLoading(false);
    } catch (error) {
      setErrorMessage('Failed to join playgroup - incorrect password');
      setIsLoading(false);
    }
  };

  const toggleMemberSelection = (member: string) => {
    if (selectedMembers.includes(member)) {
      setSelectedMembers(selectedMembers.filter(m => m !== member));
    } else {
      setSelectedMembers([...selectedMembers, member]);
    }
  };

  const handlePlaygroupSelect = (playgroup: Playgroup) => {
    setSelectedPlaygroup(playgroup);
    setSelectedMembers([]); // Reset selected members when switching playgroups
  };

  const handleStartGame = () => {
    if (selectedMembers.length < 2) {
      setErrorMessage('Please select at least 2 players to start a game');
      return;
    }
    if (!selectedPlaygroup) {
      setErrorMessage('Please select a playgroup first');
      return;
    }
    onSelectMembers(selectedMembers, selectedPlaygroup, startingLife, randomizeFirstPlayer);
    onBack();
  };

  const handleKickMember = async (memberUsername: string) => {
    if (!currentPlaygroup) return;
    
    try {
      setIsLoading(true);
      await api.kickPlaygroupMember(currentPlaygroup._id, memberUsername);
      
      // Update the current playgroup
      const updatedPlaygroups = await api.getPlaygroups();
      const updatedPlaygroup = updatedPlaygroups.find(pg => pg._id === currentPlaygroup._id);
      if (updatedPlaygroup) {
        setCurrentPlaygroup(updatedPlaygroup);
      }
      
      setMemberToKick(null);
      setIsLoading(false);
    } catch (error) {
      setErrorMessage('Failed to kick member');
      setIsLoading(false);
    }
  };

  const handleDeletePlaygroup = async () => {
    if (!currentPlaygroup) return;
    
    try {
      setIsLoading(true);
      await api.deletePlaygroup(currentPlaygroup._id);
      setCurrentPlaygroup(null);
      setPlaygroups(playgroups.filter(pg => pg._id !== currentPlaygroup._id));
      setShowDeleteConfirm(false);
      setIsLoading(false);
    } catch (error) {
      setErrorMessage('Failed to delete playgroup');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Playgroups</h2>
          <button 
            onClick={onBack}
            className="text-white hover:text-red-500"
          >
            <X size={24} />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-red-500/20 border border-red-500 text-white rounded p-2 mb-4">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="text-white text-center py-8">Loading...</div>
        ) : (
          <>
            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search playgroups..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    filterType === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('member')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    filterType === 'member'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  My Playgroups
                </button>
                <button
                  onClick={() => setFilterType('available')}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    filterType === 'available'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  Available
                </button>
              </div>
            </div>

            {/* Create New Playgroup Button */}
            {!isCreatingNew && (
              <div className="mb-6">
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Create New Playgroup
                </button>
              </div>
            )}

            {/* Create New Playgroup Form */}
            {isCreatingNew && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <h3 className="text-white font-semibold mb-3">Create New Playgroup</h3>
                <input
                  type="text"
                  value={newPlaygroupName}
                  onChange={(e) => setNewPlaygroupName(e.target.value)}
                  placeholder="Playgroup Name"
                  className="w-full p-2 rounded-lg bg-white/10 text-white mb-2"
                />
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/20 border-white/20 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isPrivate" className="text-white cursor-pointer">
                    Make playgroup private
                  </label>
                </div>
                {isPrivate && (
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={newPlaygroupPassword}
                      onChange={(e) => setNewPlaygroupPassword(e.target.value)}
                      placeholder="Set password"
                      className="w-full p-2 rounded-lg bg-white/10 text-white"
                      autoComplete="new-password"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full p-2 rounded-lg bg-white/10 text-white"
                      autoComplete="new-password"
                    />
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleCreatePlaygroup}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewPlaygroupName('');
                      setNewPlaygroupPassword('');
                      setConfirmPassword('');
                      setIsPrivate(false);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Current Playgroup Section */}
            {memberPlaygroups.length > 0 && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Your Playgroups</h3>
                <div className="space-y-2">
                  {memberPlaygroups.map(playgroup => (
                    <div
                      key={playgroup._id}
                      className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                        selectedPlaygroup?._id === playgroup._id
                          ? 'bg-indigo-600/50 ring-2 ring-indigo-400'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <button
                        onClick={() => handlePlaygroupSelect(playgroup)}
                        className="flex-1 text-left flex items-center justify-between p-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="text-white" size={18} />
                          <span className="text-white">{playgroup.name}</span>
                          {playgroup.createdBy && playgroup.createdBy.username === currentUser.username && (
                            <Crown size={14} className="text-yellow-400" />
                          )}
                        </div>
                        {selectedPlaygroup?._id === playgroup._id && (
                          <Check className="text-indigo-300" size={18} />
                        )}
                      </button>
                      {playgroup.createdBy && playgroup.createdBy.username === currentUser.username ? (
                        <button
                          onClick={() => {
                            setCurrentPlaygroup(playgroup);
                            setShowDeleteConfirm(true);
                          }}
                          className="ml-2 text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete playgroup"
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setCurrentPlaygroup(playgroup);
                            setShowDeleteConfirm(true);
                          }}
                          className="ml-2 text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Leave playgroup"
                        >
                          <LogOut size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Player Selection for Game */}
                {selectedPlaygroup && (
                  <div className="mt-4">
                    <h3 className="text-white font-semibold mb-2">Select Players for Game</h3>
                    <div className="space-y-2">
                      {selectedPlaygroup.members.map(member => (
                        <div
                          key={member}
                          className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                        >
                          <button
                            onClick={() => toggleMemberSelection(member)}
                            className={`flex-1 text-left flex items-center justify-between p-2 rounded-lg transition-all ${
                              selectedMembers.includes(member)
                                ? 'bg-indigo-600/50 ring-2 ring-indigo-400'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-white">{member}</span>
                              {selectedPlaygroup.createdBy && selectedPlaygroup.createdBy.username === member && (
                                <Crown size={14} className="text-yellow-400" />
                              )}
                            </div>
                            {selectedMembers.includes(member) && (
                              <Check className="text-indigo-300" size={18} />
                            )}
                          </button>
                          {selectedPlaygroup.createdBy && selectedPlaygroup.createdBy.username === currentUser.username && member !== currentUser.username && (
                            <button
                              onClick={() => setMemberToKick(member)}
                              className="ml-2 text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Kick member"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Starting Life Total Selection */}
                    <div className="mt-4 mb-2">
                      <h3 className="text-white font-semibold mb-2">Select Starting Life Total</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => setStartingLife(20)}
                          className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center ${
                            startingLife === 20
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                              : 'bg-white/5 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xl font-bold">20</span>
                          <span className="text-xs">Standard</span>
                        </button>
                        <button
                          onClick={() => setStartingLife(30)}
                          className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center ${
                            startingLife === 30
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                              : 'bg-white/5 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xl font-bold">30</span>
                          <span className="text-xs">Brawl</span>
                        </button>
                        <button
                          onClick={() => setStartingLife(40)}
                          className={`p-2 rounded-lg transition-all flex flex-col items-center justify-center ${
                            startingLife === 40
                              ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                              : 'bg-white/5 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <span className="text-xl font-bold">40</span>
                          <span className="text-xs">Commander</span>
                        </button>
                      </div>
                      
                      {/* Custom Life Total Input */}
                      <div className="mt-2">
                        <label className="text-white/80 text-sm block mb-1">Custom Life Total:</label>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={startingLife}
                          onChange={(e) => setStartingLife(Math.max(1, Math.min(999, parseInt(e.target.value) || 1)))}
                          className="w-full p-2 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    </div>
                    
                    {/* Game Options */}
                    <div className="mt-4 mb-2">
                      <h3 className="text-white font-semibold mb-2">Game Options</h3>
                      <div className="flex items-center bg-white/5 hover:bg-white/10 rounded-lg p-3 transition-all">
                        <input
                          type="checkbox"
                          id="randomizeFirstPlayer"
                          checked={randomizeFirstPlayer}
                          onChange={(e) => setRandomizeFirstPlayer(e.target.checked)}
                          className="w-5 h-5 rounded bg-white/20 border-white/20 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="randomizeFirstPlayer" className="ml-3 text-white cursor-pointer select-none">
                          Randomly select first player
                        </label>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleStartGame}
                      disabled={selectedMembers.length < 2}
                      className={`w-full mt-4 p-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                        selectedMembers.length < 2 
                          ? 'bg-gray-600/50 cursor-not-allowed text-white/50' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {selectedMembers.length < 2 ? (
                        <span>Select at least 2 players to start</span>
                      ) : (
                        <>
                          <Users size={18} />
                          Start Game with {selectedMembers.length} Players
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Available Playgroups */}
            {(filterType === 'all' || filterType === 'available') && availablePlaygroups.length > 0 && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3">Available Playgroups</h3>
                <div className="space-y-2">
                  {availablePlaygroups.map(playgroup => (
                    <div
                      key={playgroup._id}
                      className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="text-white" size={18} />
                        <div className="text-left">
                          <span className="text-white block">{playgroup.name}</span>
                          <span className="text-white/60 text-sm">
                            {playgroup.members.length} members
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinPlaygroup(playgroup)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <UserPlus size={18} />
                        Join Group
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {filteredPlaygroups.length === 0 && (
              <div className="text-center py-8 text-white/60">
                No playgroups found matching your search
              </div>
            )}
          </>
        )}

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Enter Password</h3>
              <p className="text-white/80 mb-4">
                This playgroup is private. Please enter the password to join.
              </p>
              <input
                type="password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full p-2 rounded-lg bg-white/10 text-white mb-4"
                autoComplete="new-password"
              />
              <div className="flex gap-4 justify-end">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setJoinPassword('');
                    setSelectedPlaygroupToJoin(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinWithPassword}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete/Leave Playgroup Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {currentPlaygroup?.createdBy?.username === currentUser.username 
                ? "Delete Playgroup" 
                : "Leave Playgroup"}
            </h3>
            <p className="text-white/80 mb-6">
              {currentPlaygroup?.createdBy?.username === currentUser.username 
                ? `Are you sure you want to delete "${currentPlaygroup?.name}"? This action cannot be undone.`
                : `Are you sure you want to leave "${currentPlaygroup?.name}"?`}
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (currentPlaygroup?.createdBy?.username === currentUser.username) {
                    handleDeletePlaygroup();
                  } else {
                    handleLeavePlaygroup();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              >
                {currentPlaygroup?.createdBy?.username === currentUser.username ? (
                  <>
                    <Trash2 size={16} />
                    Delete Playgroup
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    Leave Playgroup
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kick Member Confirmation Modal */}
      {memberToKick && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Kick Member</h3>
            <p className="text-white/80 mb-6">
              Are you sure you want to kick {memberToKick} from the playgroup?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setMemberToKick(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleKickMember(memberToKick)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
              >
                <X size={16} />
                Kick Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaygroupSelector; 