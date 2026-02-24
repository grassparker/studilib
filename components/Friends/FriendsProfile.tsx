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
        <div className="profile-scope fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
                .profile-scope *:not(i) { 
                    font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace !important; 
                    text-transform: uppercase; 
                }
                .profile-scope i {
                    font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", sans-serif !important;
                    font-weight: 900;
                }
                .terminal-modal { background: #1a1a1a; border: 4px solid #333; color: #00ff00; }
                .stat-box { border: 2px solid #333; background: #111; padding: 15px; }
                .xp-bar-container { border: 2px solid #00ff00; background: #000; height: 20px; padding: 2px; }
                .xp-bar-fill { background: #00ff00; box-shadow: 0 0 10px #00ff00; transition: width 0.5s; }
            `}</style>

            <div className="terminal-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-red-500 hover:scale-110 transition-transform text-lg">[X]</button>
                
                <div className="flex items-center gap-4 mb-4">
                    <img 
                        src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        className="w-16 h-16 border-4 border-[#333] bg-white p-1"
                        alt="avatar"
                    />
                </div>
                <div className="mb-10 border-b-2 border-[#333] pb-4 flex justify-between items-end">
                    <h1 className="text-[12px] text-[#ffaa00]">
                        {user.username}'S_ENCRYPTED_DATA
                    </h1>
                    <span className="text-[6px] text-slate-500 tracking-tighter">ID_{user.id.substring(0,8)}</span>
                </div>

                {/* Progress Report */}
                <div className="stat-box mb-8">
                    <h2 className="text-[8px] text-[#00ff00] mb-6 tracking-widest">{">"} LIVE_SYNC_STATS</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
                        <div><p className="text-[6px] text-slate-500 mb-2">MINS</p><p className="text-[10px] text-white">{totalFocusMinutes}</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">SESS</p><p className="text-[10px] text-white">{sessionCount}</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">STREAK</p><p className="text-[10px] text-[#ffaa00]">{streak}D</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">QUOTA</p><p className="text-[10px] text-white">{rawPercent}%</p></div>
                    </div>

                    <div className="xp-bar-container">
                        <div className="h-full xp-bar-fill" style={{ width: `${barWidth}%` }} />
                    </div>
                </div>
                
                {/* Achievements */}
                <div className="stat-box mb-6 border-cyan-900/50">
                    <h2 className="text-[8px] text-cyan-400 mb-6 tracking-widest">{">"} FRIEND_ACHIEVEMENT_LOG</h2>
                    <Achievements 
                        stats={{ streak, sessionCount, totalFocusMinutes }} 
                        userId={user.id}  // <--- ADD THIS LINE
                    />
                </div>

                <div className="text-center opacity-30 mt-4">
                    <p className="text-[6px]">-- END_OF_TRANSMISSION --</p>
                </div>
                
            </div>
        </div>
    );
}