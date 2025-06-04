import React from 'react';
import { Trophy, RotateCcw } from 'lucide-react';
import { Player } from '../types';
import { calculateTotalTurnTime } from '../utils';

interface GameOverScreenProps {
  winner: Player;
  players: Player[];
  resetGame: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ winner, players, resetGame }) => {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl mx-4">
        <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-4xl font-bold text-white mb-4">Game Over!</h2>
        <p className="text-2xl text-yellow-400 font-bold mb-6">
          {winner.name} Wins!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {players.map(player => (
            <div key={player.id} className="text-white text-left">
              <h3 className="font-bold text-lg mb-2">{player.name}</h3>
              <ul className="space-y-1 text-sm">
                <li>Damage Dealt: {player.stats.damageDealt}</li>
                <li>Commander Damage: {player.stats.commanderDamageDealt}</li>
                <li>Eliminations: {player.stats.eliminations.size}</li>
                <li>Total Turn Time: {calculateTotalTurnTime(player.stats.turnTimes)}s</li>
                {player.stats.eliminations.size > 0 && (
                  <li>Eliminated: {Array.from(player.stats.eliminations).map(id => 
                    players.find(p => p.id === id)?.name
                  ).join(', ')}</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <button
          onClick={resetGame}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
        >
          <RotateCcw size={20} />
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen; 