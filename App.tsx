import React, { useState } from 'react';
import { Keyboard, Target, Gamepad2 } from 'lucide-react';
import { AppMode } from './types';
import { LearningMode } from './components/LearningMode';
import { BullseyeGame } from './components/BullseyeGame';
import { RunnerGame } from './components/RunnerGame';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.MENU);

  const renderContent = () => {
    switch (mode) {
      case AppMode.LEARN:
        return <LearningMode onBack={() => setMode(AppMode.MENU)} />;
      case AppMode.GAME_BULLSEYE:
        return <BullseyeGame onBack={() => setMode(AppMode.MENU)} />;
      case AppMode.GAME_RUNNER:
        return <RunnerGame onBack={() => setMode(AppMode.MENU)} />;
      default:
        return (
          <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-sky-100 to-pink-100 flex flex-col items-center justify-center p-4">
            <header className="text-center mb-12 animate-pop">
              <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-500 drop-shadow-sm mb-4">
                Typing Adventures
              </h1>
              <p className="text-xl text-slate-600 font-medium">Learn to type and play fun games!</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
              {/* Learn Card */}
              <button
                onClick={() => setMode(AppMode.LEARN)}
                className="group relative bg-white p-8 rounded-3xl shadow-[0_10px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.1)] hover:translate-y-[5px] transition-all duration-200 border-4 border-indigo-100"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-500 text-white p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Keyboard size={32} />
                </div>
                <h2 className="mt-8 text-2xl font-bold text-slate-800 mb-2">Learn Keys</h2>
                <p className="text-slate-500">Start from the beginning! Learn where every letter lives.</p>
              </button>

              {/* Bullseye Card */}
              <button
                onClick={() => setMode(AppMode.GAME_BULLSEYE)}
                className="group relative bg-white p-8 rounded-3xl shadow-[0_10px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.1)] hover:translate-y-[5px] transition-all duration-200 border-4 border-red-100"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Target size={32} />
                </div>
                <h2 className="mt-8 text-2xl font-bold text-slate-800 mb-2">Bullseye Blitz</h2>
                <p className="text-slate-500">Pop the targets before time runs out! Test your speed.</p>
              </button>

               {/* Runner Card */}
               <button
                onClick={() => setMode(AppMode.GAME_RUNNER)}
                className="group relative bg-white p-8 rounded-3xl shadow-[0_10px_0_0_rgba(0,0,0,0.1)] hover:shadow-[0_5px_0_0_rgba(0,0,0,0.1)] hover:translate-y-[5px] transition-all duration-200 border-4 border-green-100"
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                  <Gamepad2 size={32} />
                </div>
                <h2 className="mt-8 text-2xl font-bold text-slate-800 mb-2">Letter Runner</h2>
                <p className="text-slate-500">Jump over obstacles by typing the correct letter!</p>
              </button>
            </div>

            <footer className="mt-16 text-slate-400 text-sm">
              Powered by Google Gemini • React • Tailwind
            </footer>
          </div>
        );
    }
  };

  return (
    <div className="font-sans text-slate-900">
      {renderContent()}
    </div>
  );
};

export default App;
