import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS } from '../../types';
import { supabase } from '../Auth/supabaseClient';

export const Achievements: React.FC<{ stats: any, userId: string }> = ({ stats, userId }) => {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    const syncAchievements = async () => {
      if (!userId) return;

      const newlyMet = ACHIEVEMENTS.filter(ach => ach.requirement(stats));

      if (newlyMet.length > 0) {
        const achievementsToSave = newlyMet.map(ach => ({
          user_id: userId,
          achievement_id: ach.id
        }));

        await supabase
          .from('user_achievements')
          .upsert(achievementsToSave, { onConflict: 'user_id, achievement_id' });
      }

      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (data) {
        setUnlockedIds(data.map(d => d.achievement_id));
      }
    };

    syncAchievements();
  }, [stats, userId]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .pixel-text { font-family: 'Press Start 2P', monospace; }

        .ach-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }

        .ach-unlocked {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(230, 204, 178, 0.3);
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5),
                      inset 0 0 20px rgba(230, 204, 178, 0.05);
        }

        .ach-locked {
          background: rgba(0, 13, 61, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          opacity: 0.6;
        }

        .ach-unlocked:hover {
          transform: translateY(-5px) scale(1.02);
          border-color: rgba(230, 204, 178, 0.6);
          background: rgba(255, 255, 255, 0.08);
        }

        .horizon-glow {
          color: #e6ccb2;
          filter: drop-shadow(0 0 10px rgba(230, 204, 178, 0.5));
        }

        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .star-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          animation: star-twinkle 2s infinite ease-in-out;
        }
      `}</style>

      {ACHIEVEMENTS.map((ach) => {
        const isUnlocked = unlockedIds.includes(ach.id) || ach.requirement(stats);
        
        return (
          <div 
            key={ach.id}
            className={`ach-card p-6 flex flex-col items-center justify-center text-center min-h-[160px] ${
              isUnlocked ? 'ach-unlocked' : 'ach-locked'
            }`}
          >
            {/* Animated background particles for unlocked items */}
            {isUnlocked && (
              <>
                <div className="star-particle top-4 left-4" style={{ animationDelay: '0s' }}></div>
                <div className="star-particle bottom-4 right-6" style={{ animationDelay: '0.5s' }}></div>
                <div className="star-particle top-8 right-4" style={{ animationDelay: '1.2s' }}></div>
              </>
            )}

            {/* Background ID Decal */}
            <div className="absolute top-3 right-4 opacity-10 text-[6px] pixel-text text-white">
              {isUnlocked ? 'SYNC_OK' : 'ENC_LVL_1'}
            </div>

            <div className="w-12 h-12 flex items-center justify-center mb-4">
              <i 
                className={`fas ${ach.icon} text-3xl transition-all duration-500 ${
                  isUnlocked ? 'horizon-glow' : 'text-slate-600'
                }`}
              ></i>
            </div>
            
            <p className={`pixel-text text-[8px] mb-2 leading-none uppercase tracking-widest ${
              isUnlocked ? 'text-white' : 'text-slate-500'
            }`}>
              {t(ach.name)}
            </p>
            
            <p className={`text-[10px] leading-tight h-10 overflow-hidden font-medium ${
              isUnlocked ? 'text-blue-100/70' : 'text-slate-600'
            }`}>
              {t(ach.description)}
            </p>
            
            <div className={`mt-4 text-[6px] pixel-text px-3 py-1.5 rounded-full transition-colors ${
              isUnlocked 
                ? 'bg-[#e6ccb2]/10 text-[#e6ccb2] border border-[#e6ccb2]/20' 
                : 'bg-black/20 text-slate-700'
            }`}>
              {isUnlocked ? t('COLLECTED') : t('UNDISCOVERED')}
            </div>
          </div>
        );
      })}
    </div>
  );
};