import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import { Achievements } from '../Profile/Achievements';

interface FriendsProfileProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
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
        <div className="profile-scope fixed inset-0 z-[100] flex items-center justify-center bg-[#1a2e1a]/90 backdrop-blur-sm p-2 md:p-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
                
                .profile-scope *:not(i) { 
                    font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace !important; 
                    text-transform: uppercase; 
                }

                @media (max-width: 640px) {
                    .profile-scope h1 { font-size: 10px !important; }
                    .profile-scope h2 { font-size: 7px !important; }
                    .profile-scope p { font-size: 5px !important; }
                    .stat-value { font-size: 8px !important; }
                }

                .parchment-modal { 
                    background: #fdf4db; 
                    border: 6px solid #3e2723; 
                    color: #3e2723; 
                    box-shadow: 12px 12px 0 0 #2a1b0a;
                    background-image: repeating-linear-gradient(90deg, #f7ecd0, #f7ecd0 2px, transparent 2px, transparent 4px),
                                      repeating-linear-gradient(0deg, #f7ecd0, #f7ecd0 2px, transparent 2px, transparent 4px);
                    background-size: 8px 8px;
                }

                .stat-container { border: 4px solid #5d4037; background: #efebe9; padding: 15px; position: relative; }
                
                .energy-bar-container { border: 4px solid #3e2723; background: #3e2723; height: 24px; padding: 2px; }
                .energy-bar-fill { background: #4caf50; border: 2px solid #81c784; transition: width 0.5s; }
                
                .close-btn { 
                    background: #e53935; 
                    color: white; 
                    border: 4px solid #3e2723; 
                    box-shadow: 4px 4px 0 0 #2a1b0a;
                }
                .close-btn:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 #2a1b0a; }
            `}</style>

            <div className="parchment-modal w-[95%] md:w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto p-6 md:p-10 relative">
                
                {/* Close Button */}
                <button onClick={onClose} className="close-btn absolute top-2 right-2 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-xs md:text-sm">
                    X
                </button>
                
                {/* Header Section */}
                <div className="flex items-center gap-4 md:gap-6 mb-8 mt-2 border-b-4 border-[#3e2723] pb-6">
                    <div className="relative">
                        <img 
                            src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} 
                            className="w-16 h-16 md:w-24 md:h-24 border-4 border-[#3e2723] bg-white p-1 shadow-[4px_4px_0_0_#3e2723]"
                            alt="avatar"
                        />
                        <div className="absolute -bottom-2 -right-2 bg-[#ffaa00] border-2 border-[#3e2723] px-1 text-[6px]">LVL. ??</div>
                    </div>
                    <div className="overflow-hidden">
                         <h1 className="text-[12px] md:text-[16px] text-[#3e2723] mb-1">
                            {user.username}
                        </h1>
                        <p className="text-[6px] md:text-[8px] text-[#8d6e63]">
                            JOURNEYMAN_ADVENTURER
                        </p>
                    </div>
                </div>

                {/* Progress Report */}
                <div className="stat-container mb-8">
                    <h2 className="text-[8px] md:text-[10px] text-[#3e2723] mb-4 flex items-center gap-2">
                        <i className="fas fa-heart text-red-600"></i> PARTY_MEMBER_VITALS
                    </h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                        <div className="bg-[#fdfbf7] p-2 border-2 border-[#5d4037] text-center">
                            <p className="text-[5px] md:text-[6px] text-[#8d6e63] mb-1">FOCUS</p>
                            <p className="stat-value text-[8px] md:text-[10px]">{totalFocusMinutes}M</p>
                        </div>
                        <div className="bg-[#fdfbf7] p-2 border-2 border-[#5d4037] text-center">
                            <p className="text-[5px] md:text-[6px] text-[#8d6e63] mb-1">QUESTS</p>
                            <p className="stat-value text-[8px] md:text-[10px]">{sessionCount}</p>
                        </div>
                        <div className="bg-[#fdfbf7] p-2 border-2 border-[#5d4037] text-center">
                            <p className="text-[5px] md:text-[6px] text-[#8d6e63] mb-1">STREAK</p>
                            <p className="stat-value text-[8px] md:text-[10px] text-[#ffaa00]">{streak}D</p>
                        </div>
                        <div className="bg-[#fdfbf7] p-2 border-2 border-[#5d4037] text-center">
                            <p className="text-[5px] md:text-[6px] text-[#8d6e63] mb-1">ENERGY</p>
                            <p className="stat-value text-[8px] md:text-[10px]">{rawPercent}%</p>
                        </div>
                    </div>

                    <p className="text-[6px] mb-2 text-[#3e2723]">DAILY_GOAL_PROGRESS</p>
                    <div className="energy-bar-container">
                        <div className="h-full energy-bar-fill" style={{ width: `${barWidth}%` }} />
                    </div>
                </div>
                
                {/* Achievements */}
                <div className="stat-container mb-6">
                    <h2 className="text-[8px] md:text-[10px] text-[#3e2723] mb-4 flex items-center gap-2">
                        <i className="fas fa-trophy text-[#ffaa00]"></i> COLLECTED_LOOT
                    </h2>
                    <div className="overflow-x-auto bg-white/50 p-2 border-2 border-[#d7ccc8]">
                        <Achievements 
                            stats={{ streak, sessionCount, totalFocusMinutes }} 
                            userId={user.id} 
                        />
                    </div>
                </div>

                <div className="text-center italic mt-4 pb-2">
                    <p className="text-[6px] text-[#a1887f]">-- MAY THE CODE BE WITH THEM --</p>
                </div>
            </div>
        </div>
    );
}