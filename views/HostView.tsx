import React, { useState } from 'react';
import { useHostGame } from '../services/gameService';
import { generateQuestion } from '../services/geminiService';
import { Button } from '../components/Button';
import { GamePhase } from '../types';

export const HostView: React.FC = () => {
  const { gameState, setQuestion, resetRound } = useHostGame();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const card = await generateQuestion(topic || 'general knowledge');
    setQuestion(card);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col">
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h2 className="text-xl md:text-3xl font-bold text-cyan-400">Host Dashboard</h2>
        <div className="flex items-center gap-2 text-sm md:text-base bg-slate-800 px-4 py-2 rounded-full">
          <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 animate-pulse"></span>
          <span>{gameState.players.length} Players Connected</span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-slate-300">Generate Content</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Topic</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Science, 90s Music, Physics"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
              <Button 
                fullWidth 
                onClick={handleGenerate} 
                disabled={loading}
              >
                {loading ? 'Generating...' : 'New Question (AI)'}
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
             <h3 className="text-lg font-semibold mb-4 text-slate-300">Game Controls</h3>
             <Button variant="secondary" fullWidth onClick={resetRound}>
                Force Unlock / Reset Timer
             </Button>
          </div>
        </div>

        {/* Center/Right: Display Board */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          
          {/* The Big Question Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 min-h-[300px] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
            {!gameState.currentCard ? (
              <div className="text-slate-500 flex flex-col items-center">
                <span className="text-6xl mb-4">📺</span>
                <p className="text-xl">Waiting for a question...</p>
              </div>
            ) : (
              <div className="z-10 w-full">
                <span className="inline-block bg-cyan-900 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                  {gameState.currentCard.type}
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-6">
                  {gameState.currentCard.text}
                </h2>
                {gameState.buzzedPlayerId && gameState.currentCard.answer && (
                   <div className="mt-8 pt-8 border-t border-slate-700 animate-fade-in">
                     <p className="text-slate-400 text-sm uppercase mb-2">Answer</p>
                     <p className="text-xl font-bold text-green-400">{gameState.currentCard.answer}</p>
                   </div>
                )}
              </div>
            )}
          </div>

          {/* Status Bar / Buzzer Result */}
          <div className="h-32">
             {gameState.phase === GamePhase.BUZZED ? (
               <div className="bg-green-600 h-full rounded-2xl flex items-center justify-between px-8 md:px-12 shadow-[0_0_50px_rgba(22,163,74,0.3)] animate-pulse">
                  <div className="flex flex-col">
                    <span className="text-green-200 text-sm uppercase font-bold tracking-wider">Buzz!</span>
                    <span className="text-3xl md:text-5xl font-black text-white">
                      {gameState.buzzedPlayerName}
                    </span>
                  </div>
                  <div className="text-6xl font-mono font-bold text-white tabular-nums">
                    {gameState.timer}s
                  </div>
               </div>
             ) : (
               <div className="bg-slate-800 h-full rounded-2xl flex items-center justify-center border border-slate-700 border-dashed">
                  <p className="text-slate-500 font-mono">Waiting for buzz...</p>
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
};