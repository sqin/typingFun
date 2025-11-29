import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, XCircle } from 'lucide-react';
import { generateCheer } from '../services/geminiService';

interface BullseyeGameProps {
  onBack: () => void;
}

interface GameTarget {
  id: number;
  x: number;
  y: number;
  letter: string;
  createdAt: number;
}

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export const BullseyeGame: React.FC<BullseyeGameProps> = ({ onBack }) => {
  const [targets, setTargets] = useState<GameTarget[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'playing' | 'gameover'>('playing');
  const [cheer, setCheer] = useState<string>('');
  const [lastTyped, setLastTyped] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Spawn a target
  const spawnTarget = useCallback(() => {
    if (gameState !== 'playing') return;
    const id = Date.now() + Math.random();
    const letter = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    
    // Random position within 80% of container to avoid edges
    const x = Math.floor(Math.random() * 80) + 10; 
    const y = Math.floor(Math.random() * 70) + 15;

    setTargets(prev => [...prev, { id, x, y, letter, createdAt: Date.now() }]);
  }, [gameState]);

  // Game Loop for Time & Spawning
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const spawnInterval = setInterval(() => {
      // Limit max targets on screen
      setTargets(prev => {
        if (prev.length < 5) {
           spawnTarget();
           return prev; // spawnTarget updates state, so we just return prev here to satisfy type, effectively rely on side effect or move logic. 
           // Actually better to do logic here:
        }
        return prev;
      });
      // Force spawn
      if (Math.random() > 0.3) spawnTarget();
    }, 1200);

    return () => {
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
    };
  }, [gameState, spawnTarget]);

  // Initial spawn
  useEffect(() => {
    spawnTarget();
    spawnTarget();
  }, []);

  // Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      const key = e.key.toLowerCase();
      if (!ALPHABET.includes(key)) return;

      setLastTyped(key);

      // Find target with this letter (prioritize oldest)
      setTargets(prev => {
        const index = prev.findIndex(t => t.letter === key);
        if (index !== -1) {
          // Hit!
          const target = prev[index];
          setScore(s => s + 10);
          // Play sound effect visual (handled by UI flash potentially)
          return prev.filter(t => t.id !== target.id);
        } else {
          // Miss
          setScore(s => Math.max(0, s - 2));
          return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // End Game Cheer
  useEffect(() => {
    if (gameState === 'gameover') {
      generateCheer(score, "Bullseye Blitz").then(setCheer);
    }
  }, [gameState, score]);

  return (
    <div className="relative w-full h-screen bg-sky-900 overflow-hidden flex flex-col">
      {/* HUD */}
      <div className="flex justify-between items-center p-4 bg-slate-800 text-white shadow-md z-20">
        <button onClick={onBack} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-bold">
          Exit
        </button>
        <div className="text-2xl font-bold text-yellow-400">Score: {score}</div>
        <div className="text-2xl font-bold text-sky-400">Time: {timeLeft}s</div>
      </div>

      {/* Game Area */}
      <div ref={containerRef} className="flex-1 relative cursor-crosshair">
        {targets.map(t => (
          <div
            key={t.id}
            className="absolute flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-red-500 shadow-xl animate-pop transition-transform"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          >
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-300">
               <span className="text-3xl font-bold text-slate-800 uppercase">{t.letter}</span>
            </div>
          </div>
        ))}
        
        {/* Visual Feedback for Miss/Hit (Simple centralized text) */}
        {lastTyped && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 text-9xl font-bold select-none">
                {lastTyped.toUpperCase()}
            </div>
        )}
      </div>

      {/* Game Over Modal */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md animate-pop">
            <Target className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-slate-800 mb-2">Time's Up!</h2>
            <p className="text-2xl text-yellow-600 font-bold mb-4">Score: {score}</p>
            <p className="text-lg text-slate-600 mb-6 italic">"{cheer || 'Calculating awesome message...'}"</p>
            <div className="flex gap-4 justify-center">
              <button 
                onClick={onBack}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-bold text-lg"
              >
                Menu
              </button>
              <button 
                onClick={() => {
                  setGameState('playing');
                  setScore(0);
                  setTimeLeft(30);
                  setTargets([]);
                  setCheer('');
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 px-6 py-3 rounded-xl font-bold text-lg shadow-[0_4px_0_0_rgba(202,138,4,1)] hover:shadow-[0_2px_0_0_rgba(202,138,4,1)] hover:translate-y-[2px] transition-all"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
