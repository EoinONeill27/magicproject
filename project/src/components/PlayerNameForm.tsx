import React from 'react';

interface PlayerNameFormProps {
  playerCount: 2 | 4;
  playerNames: string[];
  setPlayerNames: (names: string[]) => void;
  startGame: () => void;
}

const PlayerNameForm: React.FC<PlayerNameFormProps> = ({ 
  playerCount, 
  playerNames, 
  setPlayerNames, 
  startGame 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <h1 className="text-4xl font-bold text-white mb-4">Enter Player Names</h1>
      <div className="flex flex-col gap-2">
        {Array.from({ length: playerCount }).map((_, index) => (
          <input
            key={index}
            type="text"
            placeholder={`Player ${index + 1} Name`}
            value={playerNames[index]}
            onChange={(e) => {
              const newNames = [...playerNames];
              newNames[index] = e.target.value;
              setPlayerNames(newNames);
            }}
            className="p-2 rounded-lg text-black"
          />
        ))}
      </div>
      <button
        onClick={startGame}
        className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
      >
        Start Game
      </button>
    </div>
  );
};

export default PlayerNameForm; 