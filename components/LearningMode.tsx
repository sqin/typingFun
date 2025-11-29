import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, RefreshCcw, ChevronRight, ChevronLeft, BookOpen, Star } from 'lucide-react';
import { LESSONS } from '../constants';
import { VirtualKeyboard } from './VirtualKeyboard';
import { generatePracticeWords } from '../services/geminiService';

interface LearningModeProps {
  onBack: () => void;
}

export const LearningMode: React.FC<LearningModeProps> = ({ onBack }) => {
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [targetString, setTargetString] = useState<string>("");
  const [inputString, setInputString] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const activeLessonRef = useRef<HTMLButtonElement>(null);

  const lesson = LESSONS[currentLessonIdx];

  // Scroll active lesson into view in sidebar
  useEffect(() => {
    if (activeLessonRef.current) {
        activeLessonRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentLessonIdx]);

  // Initialize Lesson Content
  const loadLessonContent = async () => {
    setLoading(true);
    setCompleted(false);
    setInputString("");
    
    // 1. Foundation: Repetition of new keys
    let practice = lesson.letters.map(l => `${l}${l}${l} `).join("");
    
    // 2. Fetch Words: Use all letters learned so far
    try {
      const allowedLetters = [...new Set(LESSONS.slice(0, currentLessonIdx + 1).flatMap(l => l.letters))];
      const focusLetters = lesson.letters;
      
      const words = await generatePracticeWords(allowedLetters, focusLetters);
      
      if (words && words.length > 0) {
        practice += words.join(" ");
      } else {
        practice += lesson.letters.map(l => `${l} `).join(" ");
      }
    } catch (e) {
      practice += lesson.letters.join(" ");
    }

    setTargetString(practice.trim());
    setLoading(false);
  };

  useEffect(() => {
    loadLessonContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLessonIdx]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (completed || loading) return;
      
      const key = e.key; 
      
      if (key.length > 1 && key !== 'Backspace') return;

      if (key === 'Backspace') {
        setInputString(prev => prev.slice(0, -1));
        return;
      }

      setInputString(prev => {
        const next = prev + key;
        if (next === targetString) {
          setCompleted(true);
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetString, inputString, completed, loading]);

  const handleLessonSelect = (idx: number) => {
      setCurrentLessonIdx(idx);
      // Blur the button so focus returns to body for typing
      (document.activeElement as HTMLElement)?.blur();
  };

  const currentTargetChar = targetString[inputString.length];
  const progress = Math.min(100, (inputString.length / targetString.length) * 100);

  return (
    <div className="flex h-screen bg-indigo-50 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 md:w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl z-20 flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <button 
                onClick={onBack} 
                className="flex items-center gap-2 text-slate-600 hover:text-red-500 hover:bg-red-50 font-bold transition-colors w-full p-3 rounded-xl border border-transparent hover:border-red-100"
            >
                <ArrowLeft size={20} /> Exit Learning
            </button>
          </div>
          
          <div className="p-4 bg-indigo-50/50 border-b border-indigo-100">
             <h2 className="font-bold text-indigo-900 flex items-center gap-2 text-lg">
                 <BookOpen className="text-indigo-500" size={20}/> 
                 Lesson Plan
             </h2>
             <p className="text-xs text-indigo-400 mt-1 font-medium">{LESSONS.length} Interactive Lessons</p>
          </div>

          {/* Lesson List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 no-scrollbar">
              {LESSONS.map((l, idx) => {
                  const isActive = idx === currentLessonIdx;
                  const isPast = idx < currentLessonIdx;
                  return (
                      <button 
                          key={l.id} 
                          ref={isActive ? activeLessonRef : null}
                          onClick={() => handleLessonSelect(idx)}
                          className={`
                              w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                              ${isActive 
                                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200 translate-x-1' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:pl-5'}
                          `}
                      >
                          <div className="flex justify-between items-center z-10 relative">
                              <span className="flex items-center gap-3">
                                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isActive ? 'bg-white/20' : isPast ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                      {isPast ? <CheckCircle size={12}/> : l.id}
                                  </span>
                                  <span className="truncate w-32">{l.title}</span>
                              </span>
                              {isActive && <ChevronRight size={16} className="animate-pulse" />}
                          </div>
                      </button>
                  )
              })}
          </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50/50 relative">
        <div className="flex-1 flex flex-col items-center py-8 px-4 md:px-12 max-w-6xl mx-auto w-full">
            
            {/* Active Lesson Header */}
            <div className="w-full text-center mb-8 animate-pop">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
                    <Star size={12} fill="currentColor" /> Current Lesson
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">{lesson.title}</h1>
                <p className="text-slate-500 text-lg">{lesson.description}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-3xl h-6 bg-slate-200 rounded-full mb-8 overflow-hidden border-4 border-white shadow-sm">
                <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-300 ease-out flex items-center justify-end pr-2"
                style={{ width: `${progress}%` }}
                >
                    {progress > 10 && <span className="text-[10px] font-bold text-white/90">Keep going!</span>}
                </div>
            </div>

            {/* Typing Area */}
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl w-full max-w-5xl mb-8 min-h-[200px] flex flex-wrap items-center justify-center gap-1.5 text-3xl md:text-4xl font-mono leading-relaxed relative border border-slate-100">
                {loading ? (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-400 font-medium">Creating fun practice...</span>
                    </div>
                ) : completed ? (
                    <div className="flex flex-col items-center animate-pop text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                             <CheckCircle className="text-green-500 w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Lesson Complete!</h3>
                        <p className="text-slate-500 mb-6">You are doing great! Ready for the next challenge?</p>
                        
                        <div className="flex gap-4">
                            <button onClick={loadLessonContent} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition">
                                <RefreshCcw size={20}/> Repeat
                            </button>
                            {currentLessonIdx < LESSONS.length - 1 && (
                            <button 
                                onClick={() => handleLessonSelect(currentLessonIdx + 1)}
                                className="flex items-center gap-2 px-8 py-3 bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-600 hover:translate-y-[-2px] transition-all"
                            >
                                Next Lesson <ChevronRight size={20} />
                            </button>
                            )}
                        </div>
                    </div>
                ) : (
                targetString.split('').map((char, idx) => {
                    let statusClass = "text-slate-300"; // Pending
                    let isCurrent = idx === inputString.length;
                    
                    if (idx < inputString.length) {
                        statusClass = inputString[idx] === char ? "text-green-500" : "text-red-400 bg-red-50 decoration-wavy underline decoration-red-300";
                    } else if (isCurrent) {
                        statusClass = "bg-yellow-200 text-slate-900 border-b-4 border-yellow-400 -translate-y-1 scale-110 shadow-sm rounded-lg z-10";
                    }

                    return (
                    <span key={idx} className={`w-10 h-14 md:w-12 md:h-16 flex items-center justify-center rounded-lg transition-all duration-100 ${statusClass}`}>
                        {char === ' ' ? '␣' : char}
                    </span>
                    );
                })
                )}
            </div>

            {/* Hint & Navigation */}
            <div className="flex justify-between items-center w-full max-w-5xl px-4 mb-6">
                 <button 
                    disabled={currentLessonIdx === 0}
                    onClick={() => handleLessonSelect(currentLessonIdx - 1)}
                    className="flex items-center gap-2 text-slate-400 font-bold disabled:opacity-0 hover:text-indigo-600 transition"
                >
                    <ChevronLeft /> Previous
                </button>

                {!loading && !completed && (
                    <div className="px-6 py-2 bg-slate-800 text-white rounded-full font-bold shadow-lg animate-bounce">
                        {currentTargetChar === ' ' ? "Press Spacebar" : `Find '${currentTargetChar}'`}
                    </div>
                )}

                <button 
                    disabled={currentLessonIdx === LESSONS.length - 1}
                    onClick={() => handleLessonSelect(currentLessonIdx + 1)}
                    className="flex items-center gap-2 text-slate-400 font-bold disabled:opacity-0 hover:text-indigo-600 transition"
                >
                    Skip <ChevronRight />
                </button>
            </div>

            {/* Keyboard Helper */}
            {!loading && !completed && (
                <div className="w-full flex justify-center mt-auto pb-8">
                    <VirtualKeyboard activeKey={currentTargetChar} />
                </div>
            )}
        </div>
      </main>
    </div>
  );
};