import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Home, Wind } from 'lucide-react';
import { RunnerObstacle } from '../types';
import { generateCheer } from '../services/geminiService';

interface RunnerGameProps {
  onBack: () => void;
}

// Physics Constants (Pixels per Second)
const GRAVITY = 2500; 
const JUMP_FORCE = -900;
const SCROLL_SPEED = 350; // Horizontal speed
const GROUND_HEIGHT = 100;
const SPAWN_RATE_MIN = 1.2; // Seconds
const SPAWN_RATE_MAX = 2.5; // Seconds

export const RunnerGame: React.FC<RunnerGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [cheer, setCheer] = useState('');

  // Game State Refs (Mutable for performance)
  const lastTimeRef = useRef<number>(0);
  const playerY = useRef(0);
  const playerVelocity = useRef(0);
  const isJumping = useRef(false);
  const obstacles = useRef<RunnerObstacle[]>([]);
  const scoreRef = useRef(0);
  const frameId = useRef<number>(0);
  const timeSinceLastSpawn = useRef(0);
  const nextSpawnTime = useRef(0);
  
  // Parallax Offsets
  const bgOffset1 = useRef(0);
  const bgOffset2 = useRef(0);
  const groundOffset = useRef(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const spawnObstacle = (canvasWidth: number) => {
    const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
    obstacles.current.push({
      id: Date.now() + Math.random(),
      x: canvasWidth + 50,
      letter: letter
    });
    // Set next spawn time
    nextSpawnTime.current = Math.random() * (SPAWN_RATE_MAX - SPAWN_RATE_MIN) + SPAWN_RATE_MIN;
    timeSinceLastSpawn.current = 0;
  };

  const resetGame = () => {
    playerY.current = 0;
    playerVelocity.current = 0;
    isJumping.current = false;
    obstacles.current = [];
    scoreRef.current = 0;
    timeSinceLastSpawn.current = 0;
    nextSpawnTime.current = 1; // First spawn quick
    setScore(0);
    setCheer('');
    lastTimeRef.current = 0;
    setGameState('playing');
  };

  const update = (dt: number, canvas: HTMLCanvasElement) => {
    // 1. Update Physics
    playerVelocity.current += GRAVITY * dt;
    playerY.current += playerVelocity.current * dt;

    // Ground Collision
    if (playerY.current > 0) {
      playerY.current = 0;
      playerVelocity.current = 0;
      isJumping.current = false;
    }

    // 2. Update Parallax Backgrounds
    const speedScale = dt * SCROLL_SPEED;
    groundOffset.current = (groundOffset.current + speedScale) % canvas.width;
    bgOffset1.current = (bgOffset1.current + speedScale * 0.2) % canvas.width; // Far clouds slow
    bgOffset2.current = (bgOffset2.current + speedScale * 0.5) % canvas.width; // Near clouds medium

    // 3. Spawning
    timeSinceLastSpawn.current += dt;
    if (timeSinceLastSpawn.current > nextSpawnTime.current) {
      spawnObstacle(canvas.width);
    }

    // 4. Update Obstacles
    for (let i = obstacles.current.length - 1; i >= 0; i--) {
      const obs = obstacles.current[i];
      obs.x -= SCROLL_SPEED * dt;

      // Remove off-screen
      if (obs.x < -100) {
        obstacles.current.splice(i, 1);
        continue;
      }

      // Collision Detection
      // Player Box: X: 100, Width: 50
      // Obstacle Box: X: obs.x, Width: 50
      // Vertical check: Player needs to be high enough to clear height (e.g. 50px)
      
      const playerX = 100;
      const playerW = 50;
      const obsW = 50;
      const obsHeight = 50;

      // Horizontal Overlap
      if (obs.x < playerX + playerW - 10 && obs.x + obsW > playerX + 10) {
         // Vertical Overlap (inverted Y, 0 is ground, negative is up)
         // If player bottom (playerY) is lower than obstacle top (-obsHeight)
         // Actually playerY is 0 at ground. 
         // We need playerY (e.g. -100) to be less than -obsHeight (e.g. -50)
         // So if playerY > -45 (allowing 5px graze), HIT
         if (playerY.current > -40) {
             setGameState('gameover');
         }
      }
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // --- Background (Sky) ---
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#bae6fd'); // Sky 200
    gradient.addColorStop(1, '#e0f2fe'); // Sky 100
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // --- Parallax Clouds 1 (Slow/Far) ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    const cloudY1 = height * 0.2;
    // Draw twice for infinite scroll
    [0, width].forEach(offset => {
        const x = offset - bgOffset1.current;
        ctx.beginPath();
        ctx.arc(x + 100, cloudY1, 40, 0, Math.PI * 2);
        ctx.arc(x + 160, cloudY1 - 10, 50, 0, Math.PI * 2);
        ctx.arc(x + 220, cloudY1, 40, 0, Math.PI * 2);
        ctx.fill();
    });

    // --- Parallax Clouds 2 (Faster/Near) ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudY2 = height * 0.4;
    [0, width].forEach(offset => {
        const x = offset - bgOffset2.current;
        ctx.beginPath();
        ctx.arc(x + 400, cloudY2, 30, 0, Math.PI * 2);
        ctx.arc(x + 450, cloudY2 - 15, 45, 0, Math.PI * 2);
        ctx.arc(x + 500, cloudY2, 30, 0, Math.PI * 2);
        ctx.fill();
    });

    // --- Ground ---
    const groundY = height - GROUND_HEIGHT;
    ctx.fillStyle = '#22c55e'; // Green
    ctx.fillRect(0, groundY, width, GROUND_HEIGHT);
    
    // Moving Grass Texture
    ctx.fillStyle = '#16a34a'; // Darker green pattern
    [0, width].forEach(offset => {
       const x = offset - groundOffset.current;
       for(let i=0; i<width; i+=100) {
          ctx.beginPath();
          ctx.moveTo(x + i, groundY);
          ctx.lineTo(x + i + 20, groundY + 20);
          ctx.lineTo(x + i + 40, groundY);
          ctx.fill();
       }
    });
    
    // Top Grass Strip
    ctx.fillStyle = '#86efac';
    ctx.fillRect(0, groundY, width, 10);

    // --- Obstacles ---
    obstacles.current.forEach(obs => {
        const x = obs.x;
        const y = groundY;
        
        // Crate
        ctx.fillStyle = '#92400e'; // Brown
        ctx.fillRect(x, y - 50, 50, 50);
        
        // Crate Detail (Cross)
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.strokeRect(x+5, y-45, 40, 40);
        ctx.beginPath();
        ctx.moveTo(x+5, y-45);
        ctx.lineTo(x+45, y-5);
        ctx.moveTo(x+45, y-45);
        ctx.lineTo(x+5, y-5);
        ctx.stroke();

        // Balloon String
        ctx.beginPath();
        ctx.moveTo(x + 25, y - 50);
        ctx.lineTo(x + 25, y - 90);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Balloon Body
        ctx.beginPath();
        ctx.arc(x + 25, y - 110, 25, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15'; // Yellow
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Letter
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 28px Fredoka';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obs.letter.toUpperCase(), x + 25, y - 110);
    });

    // --- Player ---
    const playerX = 100;
    const drawPlayerY = groundY - 60 + playerY.current; // 60 is player height
    
    // Shadow
    if (playerY.current < 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        // Shadow shrinks as player goes higher
        const scale = Math.max(0.5, 1 - Math.abs(playerY.current)/200);
        ctx.ellipse(playerX + 25, groundY + 5, 20 * scale, 5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // Body
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(playerX, drawPlayerY, 50, 60);
    
    // Face (Eyes)
    ctx.fillStyle = 'white';
    ctx.fillRect(playerX + 30, drawPlayerY + 10, 12, 12);
    ctx.fillStyle = 'black'; // Pupil
    ctx.fillRect(playerX + 36, drawPlayerY + 14, 4, 4);

    // Legs
    ctx.fillStyle = '#1d4ed8';
    if (Math.abs(playerY.current) > 5) {
        // Jumping Pose (Legs tucked)
        ctx.fillRect(playerX + 10, drawPlayerY + 50, 15, 15);
        ctx.fillRect(playerX + 30, drawPlayerY + 40, 15, 15);
    } else {
        // Running Animation (Sine wave based on real time)
        const time = Date.now() / 100;
        const l1 = Math.sin(time) * 10;
        const l2 = Math.sin(time + Math.PI) * 10;
        ctx.fillRect(playerX + 10, drawPlayerY + 60 + l1, 15, 15);
        ctx.fillRect(playerX + 30, drawPlayerY + 60 + l2, 15, 15);
    }
  };

  const loop = useCallback((time: number) => {
    if (gameState !== 'playing') return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    // Cap dt for sanity (e.g. if tab was hidden)
    const safeDt = Math.min(dt, 0.1);

    if (canvasRef.current) {
       const ctx = canvasRef.current.getContext('2d');
       if (ctx) {
           update(safeDt, canvasRef.current);
           draw(ctx, canvasRef.current);
       }
    }

    frameId.current = requestAnimationFrame(loop);
  }, [gameState]);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      const key = e.key.toLowerCase();

      // Find FIRST actionable obstacle in range
      // Range: 0 to 500 (Approaching or just passed)
      // We sort by x to prioritize the closest one in front
      const actionableObstacles = obstacles.current
        .filter(o => o.x > 50 && o.x < 600) // Wide window for fairness
        .sort((a, b) => a.x - b.x);

      const target = actionableObstacles[0];

      if (target && target.letter === key) {
          if (!isJumping.current) {
             playerVelocity.current = JUMP_FORCE;
             isJumping.current = true;
             scoreRef.current += 10;
             setScore(scoreRef.current);
             
             // Visual "Hit" effect could be added here
          }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Start/Stop Loop
  useEffect(() => {
    if (gameState === 'playing') {
       frameId.current = requestAnimationFrame(loop);
    } else {
       cancelAnimationFrame(frameId.current);
    }
    return () => cancelAnimationFrame(frameId.current);
  }, [gameState, loop]);

  // Generate Cheer on Game Over
  useEffect(() => {
    if (gameState === 'gameover') {
        generateCheer(score, "Letter Runner").then(setCheer);
    }
  }, [gameState, score]);

  return (
    <div className="w-full h-screen bg-sky-100 flex flex-col items-center justify-center relative overflow-hidden">
       
       {/* UI Layer */}
       <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
           <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg border-b-4 border-slate-200">
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Current Score</p>
                <p className="text-4xl font-bold text-slate-800">{score}</p>
           </div>
           <button 
             onClick={onBack} 
             className="pointer-events-auto bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 p-3 rounded-xl shadow-md transition-colors"
           >
               <Home size={24} />
           </button>
       </div>

       <canvas 
         ref={canvasRef}
         width={800}
         height={450}
         className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-8 border-white"
         style={{ maxHeight: '80vh' }}
       />
       
       <div className="mt-4 text-slate-400 flex items-center gap-2 animate-pulse">
           <Wind size={16} /> Speed increases as you run! (Just kidding, it's steady for learning)
       </div>

       {/* Start Screen */}
       {gameState === 'start' && (
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-20">
               <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-lg transform hover:scale-105 transition-transform duration-300">
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Play size={40} fill="currentColor" />
                   </div>
                   <h2 className="text-4xl font-bold text-slate-800 mb-4">Ready to Run?</h2>
                   <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                       Type the letters on the balloons to make your runner 
                       <span className="font-bold text-blue-500"> JUMP</span> over the crates!
                   </p>
                   <button 
                    onClick={resetGame}
                    className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-bold py-4 rounded-xl shadow-[0_4px_0_0_rgba(21,128,61,1)] hover:shadow-[0_2px_0_0_rgba(21,128,61,1)] hover:translate-y-[2px] transition-all"
                   >
                       Start Game
                   </button>
               </div>
           </div>
       )}

       {/* Game Over Screen */}
       {gameState === 'gameover' && (
           <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
               <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md animate-pop">
                   <h2 className="text-4xl font-bold text-slate-800 mb-2">Great Effort!</h2>
                   <div className="my-6">
                       <p className="text-sm text-slate-400 font-bold uppercase">Final Score</p>
                       <p className="text-6xl font-bold text-blue-500">{score}</p>
                   </div>
                   <p className="text-slate-500 italic mb-8 min-h-[3rem]">
                       "{cheer || 'Loading cheer...'}"
                   </p>
                   <div className="flex gap-4">
                        <button 
                            onClick={onBack} 
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition"
                        >
                            Menu
                        </button>
                        <button 
                            onClick={resetGame} 
                            className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 rounded-xl shadow-[0_4px_0_0_rgba(202,138,4,1)] hover:shadow-[0_2px_0_0_rgba(202,138,4,1)] hover:translate-y-[2px] transition-all"
                        >
                             <RotateCcw size={20} /> Play Again
                        </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
};