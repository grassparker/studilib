import React from 'react';
import { ACHIEVEMENTS } from '../../types';

export const Achievements: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 min-h-[100px]">
      {ACHIEVEMENTS.map((ach) => {
        const isUnlocked = ach.requirement(stats);
        
        return (
          <div 
            key={ach.id}
            className={`p-2 border-4 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[120px] ${
              isUnlocked 
                ? 'bg-[#111] border-[#00ff00] opacity-100 shadow-[4px_4px_0_0_#00ff00]' 
                : 'bg-[#000] border-[#333] opacity-50 grayscale'
            }`}
          >
            {/* ICON WRAPPER: Forced dimensions prevent layout collapse */}
            <div className="w-8 h-8 flex items-center justify-center mb-2">
              <i 
                className={`fas ${ach.icon} text-xl ${isUnlocked ? 'animate-bounce' : ''}`} 
                style={{ 
                  color: isUnlocked ? ach.color : '#444',
                  textShadow: isUnlocked ? `0 0 8px ${ach.color}` : 'none' 
                }}
              >
                {/* Fallback if FontAwesome fails: a small pixel dot */}
                {!ach.icon && <div className="w-2 h-2 bg-current" />}
              </i>
            </div>
            
            <p className="text-[7px] font-bold text-white mb-1 leading-none">
              {ach.name}
            </p>
            
            <p className="text-[5px] text-slate-400 leading-tight h-6 overflow-hidden">
              {ach.description}
            </p>
            
            <div className={`mt-2 text-[5px] px-1 uppercase ${isUnlocked ? 'text-[#00ff00]' : 'text-red-500'}`}>
              {isUnlocked ? '[Online]' : '[Locked]'}
            </div>
          </div>
        );
      })}
    </div>
  );
};