import React from 'react';
import { KEYBOARD_LAYOUT } from '../constants';

interface VirtualKeyboardProps {
  activeKey: string | null;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ activeKey }) => {
  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-xl shadow-2xl border-b-8 border-slate-900 w-full max-w-3xl mx-auto">
      {KEYBOARD_LAYOUT.map((row, rIndex) => (
        <div key={rIndex} className="flex gap-2 justify-center w-full">
          {row.map((k) => {
            const isActive = activeKey && k.key === activeKey.toLowerCase();
            const handColor = k.hand === 'left' ? 'border-sky-500' : 'border-pink-500';
            const activeClass = isActive 
              ? 'bg-yellow-400 text-slate-900 translate-y-1 shadow-none border-yellow-600' 
              : 'bg-slate-700 text-white shadow-[0_4px_0_0_rgba(0,0,0,0.3)] hover:translate-y-[1px] hover:shadow-[0_3px_0_0_rgba(0,0,0,0.3)]';

            return (
              <div
                key={k.key}
                className={`
                  relative flex items-center justify-center 
                  w-10 h-10 md:w-14 md:h-14 rounded-lg 
                  text-lg md:text-xl font-bold uppercase transition-all duration-75
                  border-b-4 ${handColor} ${activeClass}
                `}
              >
                {k.key}
                {isActive && (
                   <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-xs py-1 px-2 rounded shadow whitespace-nowrap z-10 animate-bounce">
                     Use {k.finger}
                   </span>
                )}
              </div>
            );
          })}
        </div>
      ))}
      
      <div className="flex gap-4 mt-4 text-white text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-700 border-b-4 border-sky-500"></div>
          <span>Left Hand</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-700 border-b-4 border-pink-500"></div>
          <span>Right Hand</span>
        </div>
      </div>
    </div>
  );
};
