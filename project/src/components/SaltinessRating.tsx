import React, { useState } from 'react';
import { AlertTriangle, ThumbsUp, Droplet } from 'lucide-react';

type SaltinessLevel = 'notSalty' | 'somewhatSalty' | 'extremelySalty';

interface SaltinessRatingProps {
  playerName: string;
  playerId: number;
  onRatingSelect: (playerId: number, rating: SaltinessLevel) => void;
}

const SaltinessRating: React.FC<SaltinessRatingProps> = ({ playerName, playerId, onRatingSelect }) => {
  const [selectedRating, setSelectedRating] = useState<SaltinessLevel | null>(null);

  const handleSelect = (rating: SaltinessLevel) => {
    setSelectedRating(rating);
    onRatingSelect(playerId, rating);
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-3 sm:p-4 text-white">
      <h3 className="font-medium text-base sm:text-lg mb-2">{playerName}, how salty are you?</h3>
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3">
        <button
          onClick={() => handleSelect('notSalty')}
          className={`p-2 sm:p-3 rounded-lg flex flex-col items-center gap-1 sm:gap-2 transition-colors border ${
            selectedRating === 'notSalty' 
              ? 'bg-green-500/20 border-green-500' 
              : 'bg-white/5 border-transparent hover:bg-white/10'
          }`}
        >
          <ThumbsUp size={24} className="text-green-400" />
          <span className="font-medium text-sm sm:text-base">Not Salty</span>
          <span className="text-xs text-white/70 hidden sm:block">Good game!</span>
        </button>
        
        <button
          onClick={() => handleSelect('somewhatSalty')}
          className={`p-2 sm:p-3 rounded-lg flex flex-col items-center gap-1 sm:gap-2 transition-colors border ${
            selectedRating === 'somewhatSalty' 
              ? 'bg-yellow-500/20 border-yellow-500' 
              : 'bg-white/5 border-transparent hover:bg-white/10'
          }`}
        >
          <Droplet size={24} className="text-yellow-400" />
          <span className="font-medium text-sm sm:text-base">Somewhat</span>
          <span className="text-xs text-white/70 hidden sm:block">Could have gone better</span>
        </button>
        
        <button
          onClick={() => handleSelect('extremelySalty')}
          className={`p-2 sm:p-3 rounded-lg flex flex-col items-center gap-1 sm:gap-2 transition-colors border ${
            selectedRating === 'extremelySalty' 
              ? 'bg-red-500/20 border-red-500' 
              : 'bg-white/5 border-transparent hover:bg-white/10'
          }`}
        >
          <AlertTriangle size={24} className="text-red-400" />
          <span className="font-medium text-sm sm:text-base">Extremely</span>
          <span className="text-xs text-white/70 hidden sm:block">That was unfair!</span>
        </button>
      </div>
    </div>
  );
};

export default SaltinessRating; 