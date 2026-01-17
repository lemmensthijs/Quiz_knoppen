import React, { useState, useEffect } from 'react';
import { usePlayerGame, generateId } from '../services/gameService';
import { Button } from '../components/Button';
import { Player, GamePhase } from '../types';

export const PlayerView: React.FC = () => {
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [profile, setProfile] = useState<Player | null>(null);

  // Initialize Game Hook
  const { gameState, buzz } = usePlayerGame(profile);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newProfile = { id: generateId(), name: name.trim() };
    setProfile(newProfile);
    setJoined(true);
  };

  // Determine Screen Color / State
  let screenClass = "bg-slate-900"; // Default
  let statusText = "Waiting for Host";
  let canBuzz = false;

  if (joined) {
    if (gameState.phase === GamePhase.QUESTION_ACTIVE) {
      screenClass = "bg-blue-900"; // Ready to buzz
      statusText = "GO!";
      canBuzz = true;
    } else if (gameState.phase === GamePhase.BUZZED) {
      if (gameState.buzzedPlayerId === profile?.id) {
        screenClass = "bg-green-600"; // Winner
        statusText = "YOU BUZZED!";
      } else {
        screenClass = "bg-red-700"; // Loser
        statusText = `LOCKED: ${gameState.buzzedPlayerName}`;
      }
    }
  }

  // --- JOIN SCREEN ---
  if (!joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-900 text-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Join Game</h1>
            <p className="text-slate-400">Enter your name to connect to the main screen.</p>
          </div>
          <form onSubmit={handleJoin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Your Name" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-lg text-center text-white focus:ring-2 focus:ring-blue-500 outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
            />
            <Button fullWidth size="lg" type="submit">Join</Button>
          </form>
        </div>
      </div>
    );
  }

  // --- GAME SCREEN ---
  return (
    <div className={`min-h-screen flex flex-col p-6 transition-colors duration-300 ${screenClass}`}>
      {/* Header */}
      <div className="flex justify-between items-center text-white/70 mb-8">
        <span className="font-bold">{profile?.name}</span>
        <span className="font-mono bg-black/20 px-2 py-1 rounded">
          {gameState.phase === GamePhase.BUZZED ? `${gameState.timer}s` : '--'}
        </span>
      </div>

      {/* Main Buzzer Area */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8">
        
        <h2 className="text-3xl md:text-5xl font-black text-white text-center uppercase tracking-tight drop-shadow-md animate-bounce">
          {statusText}
        </h2>

        <div className="relative">
          {/* Ripple Effect if Active */}
          {canBuzz && (
            <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 buzz-anim"></div>
          )}
          
          <button
            onClick={buzz}
            disabled={!canBuzz}
            className={`
              relative w-64 h-64 rounded-full border-8 shadow-2xl transition-transform active:scale-95 flex items-center justify-center
              ${canBuzz 
                ? 'bg-blue-500 border-blue-400 cursor-pointer shadow-blue-900/50 hover:bg-blue-400' 
                : 'bg-slate-700 border-slate-600 cursor-not-allowed opacity-80'}
              ${gameState.buzzedPlayerId === profile?.id ? 'bg-green-500 border-green-400 scale-110' : ''}
              ${gameState.phase === GamePhase.BUZZED && gameState.buzzedPlayerId !== profile?.id ? 'bg-red-600 border-red-500 opacity-50' : ''}
            `}
          >
             <span className="text-4xl font-black text-white uppercase tracking-widest pointer-events-none select-none">
               {canBuzz ? 'PUSH' : gameState.buzzedPlayerId === profile?.id ? '👑' : 'WAIT'}
             </span>
          </button>
        </div>
        
        {gameState.currentCard && (
           <div className="mt-8 bg-black/20 p-4 rounded-xl backdrop-blur-sm text-center max-w-md">
              <p className="text-white/90 font-medium">
                {gameState.currentCard.text}
              </p>
           </div>
        )}

      </div>
    </div>
  );
};