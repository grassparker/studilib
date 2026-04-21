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

    // --- FULLSCREEN & HIDE UI LOGIC ---
    useEffect(() => {
        if (isOpen) {
            // Lock body scroll
            document.body.style.overflow = 'hidden';
            
            // Force hide any common navigation elements
            const selectors = ['nav', 'header', '.navbar', '#main-nav-bar', '.menu-bar'];
            selectors.forEach(s => {
                const el = document.querySelector(s) as HTMLElement;
                if (el) el.style.visibility = 'hidden';
            });
        }

        return () => {
            // Restore visibility and scroll
            document.body.style.overflow = 'unset';
            const selectors = ['nav', 'header', '.navbar', '#main-nav-bar', '.menu-bar'];
            selectors.forEach(s => {
                const el = document.querySelector(s) as HTMLElement;
                if (el) el.style.visibility = 'visible';
            });
        };
    }, [isOpen]);

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
        /* z-[9999] and fixed inset-0 ensures it occupies the entire viewport */
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-[#000d3d] tech-font">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;700&display=swap');
                
                .tech-font { font-family: 'Inter', sans-serif; }
                .pixel-font { font-family: 'Press Start 2P', monospace; }

                /* The Fullscreen Background */
                .fullscreen-bg {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(26, 71, 138, 0.4) 0%, #000d3d 100%);
                    backdrop-filter: blur(20px);
                }

                .glass-panel {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 32px;
                    width: 95%;
                    max-width: 800px;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    z-index: 10;
                }

                /* Custom Scrollbar for the modal content */
                .glass-panel::-webkit-scrollbar { width: 6px; }
                .glass-panel::-webkit-scrollbar-track { background: transparent; }
                .glass-panel::-webkit-scrollbar-thumb { background: rgba(230, 204, 178, 0.2); border-radius: 10px; }

                .stat-card {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 1.5rem;
                }

                .horizon-bar-bg {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 12px;
                }

                .horizon-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #7a98b9, #e6ccb2);
                    box-shadow: 0 0 15px rgba(230, 204, 178, 0.4);
                }
            `}</style>

            <div className="fullscreen-bg" onClick={onClose} />

            <div className="glass-panel p-6 md:p-12 text-white shadow-2xl">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-white/5">
                    <div className="relative">
                        <div className="p-1.5 rounded-3xl border-2 border-blue-400/30 rotate-3 bg-[#000d3d]">
                            <img 
                                src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} 
                                className="w-24 h-24 md:w-36 md:h-36 rounded-2xl object-cover"
                                alt="avatar"
                            />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-[#e6ccb2] text-[#000d3d] pixel-font text-[8px] px-4 py-1.5 rounded-lg font-bold shadow-xl">
                            LVL. ??
                        </div>
                    </div>

                    <div className="text-center md:text-left flex-1">
                        <p className="pixel-font text-[7px] text-blue-300/60 tracking-[0.5em] mb-3 uppercase">Personnel_File</p>
                        <h1 className="text-4xl font-bold tracking-tighter mb-3">
                            {user.username}
                        </h1>
                        <p className="pixel-font text-[9px] text-blue-300/30 tracking-widest uppercase">
                            Deep_Sea_Operator
                        </p>
                    </div>

                    <button 
                        onClick={onClose} 
                        className="absolute top-2 right-2 md:top-6 md:right-6 w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Vitals Grid */}
                <div className="space-y-10">
                    <div className="stat-card">
                        <div className="flex items-center gap-3 mb-8">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            <h2 className="pixel-font text-[9px] tracking-widest text-blue-200/80">LIVE_METRICS</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                            {[
                                { label: 'FOCUS', val: `${totalFocusMinutes}M` },
                                { label: 'QUESTS', val: sessionCount },
                                { label: 'STREAK', val: `${streak}D`, color: 'text-[#e6ccb2]' },
                                { label: 'SYNCHRONY', val: `${rawPercent}%` }
                            ].map((stat, i) => (
                                <div key={i} className="text-center border-r last:border-0 border-white/5">
                                    <p className="pixel-font text-[6px] text-white/20 mb-3">{stat.label}</p>
                                    <p className={`text-2xl font-bold ${stat.color || 'text-white'}`}>{stat.val}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <p className="pixel-font text-[7px] text-white/30 uppercase tracking-tighter">Current_Depth_Progress</p>
                                <p className="text-sm font-mono text-blue-300 font-bold">{rawPercent}%</p>
                            </div>
                            <div className="horizon-bar-bg">
                                <div className="horizon-bar-fill" style={{ width: `${barWidth}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Achievements */}
                    <div>
                        <h2 className="pixel-font text-[9px] text-white/20 mb-6 flex items-center gap-3 tracking-widest">
                            <i className="fas fa-box-open"></i> Recovered_Artifacts
                        </h2>
                        <div className="bg-white/5 rounded-3xl p-8 border border-white/5">
                            <Achievements 
                                stats={{ streak, sessionCount, totalFocusMinutes }} 
                                userId={user.id} 
                            />
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12 pb-4 opacity-10">
                    <p className="pixel-font text-[7px] tracking-[0.4em]">-- Transmission Encrypted --</p>
                </div>
            </div>
        </div>
    );
}