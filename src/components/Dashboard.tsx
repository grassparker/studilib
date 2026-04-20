import React from 'react';
import { useTranslation } from 'react-i18next';
import { FocusRoom } from './Study/FocusRoom';
import { Overview } from './Dashboard/Overview';
import { Friends } from './Friends/Friends';
import { User } from '../types';
import { Schedule } from './Schedule/Schedule';
import { Routes, Route } from 'react-router-dom';

interface DashboardProps {
  user: User;
  updateCoins: (amount: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, updateCoins }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen text-slate-100 font-sans selection:bg-blue-400/30 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;600&display=swap');
        
        .pixel-font { font-family: 'Press Start 2P', monospace; }

        /* The New Horizon Palette */
        .tech-bg { 
          background: linear-gradient(180deg, 
            #000d3d 0%, 
            #1a478a 40%, 
            #7a98b9 80%, 
            #e6ccb2 100%
          );
          background-attachment: fixed;
        }

        /* Star Generation Layer */
        .stars-container {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          z-index: 0;
        }

        .star {
          position: absolute;
          background: white;
          border-radius: 50%;
          opacity: 0;
          animation: twinkle var(--duration) infinite ease-in-out;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>

      {/* Background & Stars */}
      <div className="tech-bg min-h-screen relative">
        <div className="stars-container">
          {/* Mapping a few stars manually for performance, 
              or you could map an array of 50 here */}
          {[...Array(40)].map((_, i) => (
            <div 
              key={i}
              className="star"
              style={{
                top: `${Math.random() * 70}%`, // Keep stars in the upper darker sky
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 3}px`,
                height: `${Math.random() * 3}px`,
                '--duration': `${2 + Math.random() * 4}s`,
                animationDelay: `${Math.random() * 5}s`
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Content Layer */}
        <div className="relative z-10">
          <Routes>
            <Route path="/" element={<Overview user={user} />} />
            <Route path="schedule" element={<Schedule user={user} />} />
            <Route path="focus" element={<FocusRoom user={user} updateCoins={updateCoins} />} />
            
            <Route 
              path="tinyhome" 
              element={
                <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
                  <div className="bg-white/5 backdrop-blur-md border border-white/20 p-12 rounded-lg relative overflow-hidden">
                    <i className="fas fa-moon text-5xl text-blue-200 mb-8 animate-pulse drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"></i>
                    
                    <h2 className="pixel-font text-[10px] text-white mb-4 tracking-widest">
                      SECTOR_OFFLINE
                    </h2>
                    
                    <p className="text-xs font-mono text-blue-100/70 mb-8 max-w-xs leading-relaxed">
                      The horizon is expanding. Your personal sector is currently under construction in the twilight.
                    </p>
                    
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-300 animate-[progress_3s_infinite]" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </div>
              } 
            />
            
            <Route path="social" element={<Friends user={user} />} />
            
            <Route path="*" element={
              <div className="flex items-center justify-center min-h-[60vh] pixel-font text-[10px] text-white/50">
                [!] ERROR_404: LOST_IN_THE_STARS
              </div>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};