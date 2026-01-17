import React from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import { HostView } from './views/HostView';
import { PlayerView } from './views/PlayerView';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-8 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="space-y-2">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          QuizBuzz
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          De ultieme quiz buzzer app. Eén presentator, meerdere spelers.
        </p>
      </div>

      <div className="grid gap-6 w-full max-w-sm">
        <Link to="/host" className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur"></div>
          <div className="relative bg-slate-900 rounded-xl p-6 flex items-center justify-center space-x-4 hover:bg-slate-800 transition">
            <span className="text-2xl font-bold text-white">Ik ben de Presentator 🎤</span>
          </div>
        </Link>

        <Link to="/player" className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-pink-600 rounded-xl opacity-75 group-hover:opacity-100 transition duration-200 blur"></div>
          <div className="relative bg-slate-900 rounded-xl p-6 flex items-center justify-center space-x-4 hover:bg-slate-800 transition">
            <span className="text-2xl font-bold text-white">Ik ben een Speler 📱</span>
          </div>
        </Link>
      </div>
      
      <p className="text-xs text-slate-500 mt-10">
        Demo Modus: Open deze URL in meerdere tabbladen om verschillende apparaten te simuleren.
      </p>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<HostView />} />
        <Route path="/player" element={<PlayerView />} />
      </Routes>
    </HashRouter>
  );
};

export default App;