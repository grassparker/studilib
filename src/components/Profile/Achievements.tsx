import React, { useState, useEffect } from 'react'; // Added useEffect here
import { ACHIEVEMENTS } from '../../types';
import { supabase } from '../Auth/supabaseClient';

// Pass userId as a prop so we know where to save the data
export const Achievements: React.FC<{ stats: any, userId: string }> = ({ stats, userId }) => {
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    const syncAchievements = async () => {
      if (!userId) return;

      // 1. Check what is met right now
      const newlyMet = ACHIEVEMENTS.filter(ach => ach.requirement(stats));

      if (newlyMet.length > 0) {
        const achievementsToSave = newlyMet.map(ach => ({
          user_id: userId,
          achievement_id: ach.id
        }));

        // 2. Save to DB (onConflict ensures no duplicates)
        await supabase
          .from('user_achievements')
          .upsert(achievementsToSave, { onConflict: 'user_id, achievement_id' });
      }

      // 3. Fetch the "Master List" of what this user has unlocked
      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      if (data) {
        setUnlockedIds(data.map(d => d.achievement_id));
      }
    };

    syncAchievements();
  }, [stats, userId]); // Re-syncs if stats update (e.g., session ends)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 min-h-[100px]">
      {ACHIEVEMENTS.map((ach) => {
        // Now we check the DATABASE list, not just the live stats
        const isUnlocked = unlockedIds.includes(ach.id) || ach.requirement(stats);
        
        return (
          <div 
            key={ach.id}
            className={`p-2 border-4 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[120px] ${
              isUnlocked 
                ? 'bg-[#111] border-[#00ff00] opacity-100 shadow-[4px_4px_0_0_#00ff00]' 
                : 'bg-[#000] border-[#333] opacity-50 grayscale'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center mb-2">
              <i 
                className={`fas ${ach.icon} text-xl ${isUnlocked ? 'animate-bounce' : ''}`} 
                style={{ 
                  color: isUnlocked ? ach.color : '#444',
                  textShadow: isUnlocked ? `0 0 8px ${ach.color}` : 'none' 
                }}
              ></i>
            </div>
            
            <p className="text-[7px] font-bold text-white mb-1 leading-none">{ach.name}</p>
            <p className="text-[5px] text-slate-400 leading-tight h-6 overflow-hidden">{ach.description}</p>
            
            <div className={`mt-2 text-[5px] px-1 uppercase ${isUnlocked ? 'text-[#00ff00]' : 'text-red-500'}`}>
              {isUnlocked ? '[Achieved]' : '[Locked]'}
            </div>
          </div>
        );
      })}
    </div>
  );
};