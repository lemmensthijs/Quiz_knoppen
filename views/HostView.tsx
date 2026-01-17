import React, { useState, useRef } from 'react';
import { useHostGame } from '../services/gameService';
import { Button } from '../components/Button';
import { GamePhase, QuestionCard } from '../types';

export const HostView: React.FC = () => {
  const { gameState, setQuestion, resetRound } = useHostGame();
  
  // Tabs: 'manual', 'file' (AI removed)
  const [activeTab, setActiveTab] = useState<'manual' | 'file'>('manual');

  // Manual State
  const [manualType, setManualType] = useState<'question' | 'task'>('question');
  const [manualText, setManualText] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');

  // File State
  const [queue, setQueue] = useState<QuestionCard[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSubmit = () => {
    if (!manualText.trim()) return;
    setQuestion({
      type: manualType,
      text: manualText,
      answer: manualAnswer
    });
    // Clear fields for better workflow
    setManualText('');
    setManualAnswer('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      
      const newCards: QuestionCard[] = lines.map(line => {
        // Simple format: "Question Text | Answer"
        const parts = line.split('|');
        const qText = parts[0].trim();
        const ans = parts.length > 1 ? parts[1].trim() : undefined;
        
        return {
          type: 'question',
          text: qText,
          answer: ans
        };
      });

      setQueue(prev => [...prev, ...newCards]);
      // Reset input so same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const playNextInQueue = () => {
    if (queue.length === 0) return;
    const [next, ...rest] = queue;
    setQuestion(next);
    setQueue(rest);
  };

  const clearQueue = () => setQueue([]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col">
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h2 className="text-xl md:text-3xl font-bold text-cyan-400">Presentator Dashboard</h2>
        <div className="flex items-center gap-2 text-sm md:text-base bg-slate-800 px-4 py-2 rounded-full">
          <span className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 animate-pulse"></span>
          <span>{gameState.players.length} Spelers Verbonden</span>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: INPUT CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
            {/* TABS */}
            <div className="flex border-b border-slate-800">
              <button 
                onClick={() => setActiveTab('manual')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'manual' ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-800'}`}
              >
                Handmatig
              </button>
              <button 
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'file' ? 'bg-cyan-900/20 text-cyan-400' : 'text-slate-500 hover:bg-slate-800'}`}
              >
                Uploaden
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="p-6 min-h-[300px]">
              
              {/* MANUAL TAB */}
              {activeTab === 'manual' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex gap-4">
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={manualType === 'question'} 
                          onChange={() => setManualType('question')}
                          className="text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="text-sm">Vraag</span>
                     </label>
                     <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          checked={manualType === 'task'} 
                          onChange={() => setManualType('task')}
                          className="text-cyan-500 focus:ring-cyan-500"
                        />
                        <span className="text-sm">Opdracht</span>
                     </label>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Tekst</label>
                    <textarea 
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Voer vraag of opdracht in..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none h-24 resize-none"
                    />
                  </div>

                  {manualType === 'question' && (
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">Antwoord (Optioneel)</label>
                      <input 
                        type="text" 
                        value={manualAnswer}
                        onChange={(e) => setManualAnswer(e.target.value)}
                        placeholder="Verborgen tot onthulling"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                      />
                    </div>
                  )}

                  <Button fullWidth onClick={handleManualSubmit} disabled={!manualText}>
                    Toon Vraag
                  </Button>
                </div>
              )}

              {/* FILE TAB */}
              {activeTab === 'file' && (
                <div className="space-y-4 animate-fade-in">
                   <div className="p-4 border-2 border-dashed border-slate-700 rounded-lg text-center hover:bg-slate-800/50 transition-colors relative">
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".txt" 
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="pointer-events-none">
                        <span className="text-2xl block mb-1">📂</span>
                        <span className="text-xs text-slate-400">Klik om een .txt bestand te uploaden</span>
                        <p className="text-[10px] text-slate-500 mt-1">Formaat: Vraag | Antwoord</p>
                      </div>
                   </div>

                   <div className="flex justify-between items-center">
                     <span className="text-sm font-bold text-slate-300">Wachtrij: {queue.length}</span>
                     {queue.length > 0 && (
                       <button onClick={clearQueue} className="text-xs text-red-400 hover:text-red-300">Legen</button>
                     )}
                   </div>

                   <Button fullWidth onClick={playNextInQueue} disabled={queue.length === 0}>
                     Speel Volgende ({queue.length})
                   </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
             <h3 className="text-lg font-semibold mb-4 text-slate-300">Spelbediening</h3>
             <Button variant="secondary" fullWidth onClick={resetRound}>
                Forceer Reset / Reset Timer
             </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: DISPLAY BOARD */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          
          {/* The Big Question Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-3xl border border-slate-700 min-h-[300px] flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
            {!gameState.currentCard ? (
              <div className="text-slate-500 flex flex-col items-center">
                <span className="text-6xl mb-4">📺</span>
                <p className="text-xl">Wachten op een vraag...</p>
              </div>
            ) : (
              <div className="z-10 w-full">
                <span className="inline-block bg-cyan-900 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
                  {gameState.currentCard.type === 'question' ? 'VRAAG' : 'OPDRACHT'}
                </span>
                <h2 className="text-2xl md:text-4xl font-extrabold leading-tight mb-6">
                  {gameState.currentCard.text}
                </h2>
                {gameState.buzzedPlayerId && gameState.currentCard.answer && (
                   <div className="mt-8 pt-8 border-t border-slate-700 animate-fade-in">
                     <p className="text-slate-400 text-sm uppercase mb-2">Antwoord</p>
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
                    <span className="text-green-200 text-sm uppercase font-bold tracking-wider">Gedrukt!</span>
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
                  <p className="text-slate-500 font-mono">Wachten op drukker...</p>
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
};