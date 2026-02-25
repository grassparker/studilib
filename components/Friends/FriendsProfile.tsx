import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import '../../index.css';
import { Achievements } from '../Profile/Achievements';

interface FriendsProfileProps {
    isOpen: boolean;
    onClose: () => void;
    user: User; // This is the friend's user object
}

export default function FriendsProfile({ isOpen, onClose, user }: FriendsProfileProps) {
    const { t } = useTranslation();
    const [dailyGoal, setDailyGoal] = useState(100); 
    const [sessionCount, setSessionCount] = useState(0);
    const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const fetchFriendStats = async () => {
            if (!user?.id || !isOpen) return;

            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const todayISO = todayDate.toISOString();

            // 1. FETCH FRIEND'S SESSIONS (READ ONLY)
            const { data: sessionData } = await supabase
                .from('study_sessions')
                .select('time')
                .eq('user_id', user.id)
                .gte('created_at', todayISO);

            if (sessionData) {
                setSessionCount(sessionData.length);
                const totalMins = sessionData.reduce((acc, curr) => acc + (Number(curr.time) || 0), 0);
                setTotalFocusMinutes(totalMins);
            }

            // 2. FETCH PROFILE (READ ONLY - NO STREAK UPDATING HERE!)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('weekly_streak, daily_goal')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setDailyGoal(profileData.daily_goal || 100);
                setStreak(profileData.weekly_streak || 0);
            }
        };

        fetchFriendStats();
    }, [isOpen, user.id]);

    const rawPercent = Math.round((totalFocusMinutes / (dailyGoal || 1)) * 100);
    const barWidth = Math.min(rawPercent, 100);

    if (!isOpen) return null;

return (
        <div className="profile-scope fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 md:p-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
                
                .profile-scope *:not(i) { 
                    font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace !important; 
                    text-transform: uppercase; 
                }

                /* Mobile Font Scaling */
                @media (max-width: 640px) {
                    .profile-scope h1 { font-size: 10px !important; }
                    .profile-scope h2 { font-size: 7px !important; }
                    .profile-scope p { font-size: 5px !important; }
                    .stat-value { font-size: 8px !important; }
                }

                .terminal-modal { 
                    background: #1a1a1a; 
                    border: 4px solid #333; 
                    color: #00ff00; 
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                }
                .stat-box { border: 2px solid #333; background: #111; padding: 12px md:padding: 15px; }
                .xp-bar-container { border: 2px solid #00ff00; background: #000; height: 16px; padding: 2px; }
                .xp-bar-fill { background: #00ff00; box-shadow: 0 0 10px #00ff00; transition: width 0.5s; }
            `}</style>

            {/* Container: w-[95%] on mobile, max-w-2xl on desktop */}
            <div className="terminal-modal w-[95%] md:w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto p-4 md:p-10 relative">
                
                {/* Close Button - Larger touch target for mobile */}
                <button onClick={onClose} className="absolute top-2 right-2 md:top-4 md:right-4 text-red-500 p-2 text-sm md:text-lg">
                    [X]
                </button>
                
                {/* Header Section */}
                <div className="flex items-center gap-3 md:gap-4 mb-4 mt-2">
                    <img 
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        className="w-12 h-12 md:w-16 md:h-16 border-4 border-[#333] bg-white p-1"
                        alt="avatar"
                    />
                    <div className="overflow-hidden">
                         <h1 className="text-[10px] md:text-[12px] text-[#ffaa00] truncate">
                            {user.username}
                        </h1>
                        <span className="text-[5px] md:text-[6px] text-slate-500 block truncate">
                            ID_{user.id.substring(0,8)}
                        </span>
                    </div>
                </div>

                <div className="mb-6 md:mb-10 border-b-2 border-[#333] pb-4">
                    <p className="text-[6px] text-slate-400">STATUS: ACCESSING_EXTERNAL_ENCRYPTION...</p>
                </div>

                {/* Progress Report */}
                <div className="stat-box mb-6 md:mb-8">
                    <h2 className="text-[7px] md:text-[8px] text-[#00ff00] mb-4 md:mb-6 tracking-widest">{">"} LIVE_SYNC_STATS</h2>
                    
                    {/* Responsive Grid: 2 cols on mobile, 4 on desktop */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 text-center">
                        <div className="bg-[#0a0a0a] p-2 border border-[#222]">
                            <p className="text-[5px] md:text-[6px] text-slate-500 mb-1">MINS</p>
                            <p className="stat-value text-[8px] md:text-[10px] text-white">{totalFocusMinutes}</p>
                        </div>
                        <div className="bg-[#0a0a0a] p-2 border border-[#222]">
                            <p className="text-[5px] md:text-[6px] text-slate-500 mb-1">SESS</p>
                            <p className="stat-value text-[8px] md:text-[10px] text-white">{sessionCount}</p>
                        </div>
                        <div className="bg-[#0a0a0a] p-2 border border-[#222]">
                            <p className="text-[5px] md:text-[6px] text-slate-500 mb-1">STRK</p>
                            <p className="stat-value text-[8px] md:text-[10px] text-[#ffaa00]">{streak}D</p>
                        </div>
                        <div className="bg-[#0a0a0a] p-2 border border-[#222]">
                            <p className="text-[5px] md:text-[6px] text-slate-500 mb-1">QUOTA</p>
                            <p className="stat-value text-[8px] md:text-[10px] text-white">{rawPercent}%</p>
                        </div>
                    </div>

                    <div className="xp-bar-container">
                        <div className="h-full xp-bar-fill" style={{ width: `${barWidth}%` }} />
                    </div>
                </div>
                
                {/* Achievements */}
                <div className="stat-box mb-6 border-cyan-900/50">
                    <h2 className="text-[7px] md:text-[8px] text-cyan-400 mb-4 md:mb-6 tracking-widest">{">"} ACHIEVEMENT_LOG</h2>
                    <div className="overflow-x-auto">
                        <Achievements 
                            stats={{ streak, sessionCount, totalFocusMinutes }} 
                            userId={user.id} 
                        />
                    </div>
                </div>

                <div className="text-center opacity-30 mt-4 pb-2">
                    <p className="text-[5px] md:text-[6px]">-- END_OF_TRANSMISSION --</p>
                </div>
            </div>
        </div>
    );
}