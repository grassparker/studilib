import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import { Achievements } from './Achievements';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onProfileUpdate: (updatedData: any) => void; 
}

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdate }: ProfileModalProps) {
    const { t } = useTranslation();
    const [newUsername, setNewUsername] = useState('');
    const [dailyGoal, setDailyGoal] = useState(100); 
    const [sessionCount, setSessionCount] = useState(0);
    const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
    const [streak, setStreak] = useState(0);
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const fetchLiveStats = async () => {
            if (!user?.id || !isOpen) return;

            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const todayISO = todayDate.toISOString();

            const { data: sessionData } = await supabase
                .from('study_sessions')
                .select('time')
                .eq('user_id', user.id)
                .gte('created_at', todayISO);

            let totalMinsToday = 0;
            if (sessionData) {
                setSessionCount(sessionData.length);
                totalMinsToday = sessionData.reduce((acc, curr) => acc + (Number(curr.time) || 0), 0);
                setTotalFocusMinutes(totalMinsToday);
            }
            
            const { data: profileData } = await supabase
                .from('profiles')
                .select('weekly_streak, daily_goal, last_pomo_at')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setDailyGoal(profileData.daily_goal || 100);
                const updatedStreak = profileData.weekly_streak || 0;
                setStreak(updatedStreak);
            }
        };

        if (isOpen) {
            fetchLiveStats();
            setNewUsername(user.username || '');
        }
    }, [isOpen, user.id]);

    const rawPercent = Math.round((totalFocusMinutes / (dailyGoal || 1)) * 100);
    const barWidth = Math.min(rawPercent, 100);
    const passwordsMatch = newPassword === confirmPassword;

    const handleSaveProfile = async () => {
        if (!newUsername.trim()) return;
        if (newPassword && (newPassword.length < 6 || !passwordsMatch)) return;

        const { error } = await supabase
            .from('profiles')
            .update({ username: newUsername, daily_goal: dailyGoal })
            .eq('id', user.id);

        if (!error) {
            onProfileUpdate({ username: newUsername, daily_goal: dailyGoal }); 
            setNewPassword('');
            setConfirmPassword('');
            alert(t('system_reconfigured'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                
                .horizon-modal-overlay {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(26, 71, 138, 0.4) 0%, rgba(0, 13, 61, 0.95) 100%);
                    backdrop-filter: blur(12px);
                }

                .glass-panel {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(20px);
                    border-radius: 32px;
                    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
                }

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
                    transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1);
                }

                .glass-input {
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 8px;
                    width: 100%;
                    transition: all 0.3s;
                }

                .glass-input:focus {
                    border-color: #e6ccb2;
                    background: rgba(255, 255, 255, 0.05);
                    outline: none;
                }

                .btn-save-horizon {
                    background: #e6ccb2;
                    color: #000d3d;
                    padding: 20px;
                    border-radius: 16px;
                    font-family: 'Press Start 2P', monospace;
                    font-size: 9px;
                    font-weight: bold;
                    width: 100%;
                    transition: all 0.3s;
                }

                .btn-save-horizon:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 20px rgba(230, 204, 178, 0.2);
                }

                .pixel-font { font-family: 'Press Start 2P', monospace; }
            `}</style>

            <div className="horizon-modal-overlay" onClick={onClose} />

            <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-10 relative z-10 text-white">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <p className="pixel-font text-[7px] text-blue-300/60 tracking-[0.4em] mb-2">{t('operator_profile')}</p>
                        <h1 className="text-xl font-bold tracking-tight">
                            {user.username || 'NODE'}<span className="text-blue-400/40 font-mono">#{user.id.substring(0,4)}</span>
                        </h1>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors">
                        <i className="fas fa-times opacity-40"></i>
                    </button>
                </div>

                {/* Performance HUD */}
                <div className="stat-card mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <i className="fas fa-chart-line text-blue-300"></i>
                        <h2 className="pixel-font text-[8px] tracking-widest text-blue-200/80">{t('performance_sync')}</h2>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/5 p-4 rounded-xl">
                            <p className="text-[6px] pixel-font text-slate-500 mb-2">{t('focus')}</p>
                            <p className="text-lg font-bold">{totalFocusMinutes}<span className="text-[10px] ml-1 opacity-40">M</span></p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl">
                            <p className="text-[6px] pixel-font text-slate-500 mb-2">{t('sessions')}</p>
                            <p className="text-lg font-bold">{sessionCount}</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-blue-400/20 shadow-[0_0_15px_rgba(96,165,250,0.1)]">
                            <p className="text-[6px] pixel-font text-blue-400 mb-2">{t('streak')}</p>
                            <p className="text-lg font-bold">{streak}<span className="text-[10px] ml-1 opacity-40">D</span></p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl">
                            <p className="text-[6px] pixel-font text-slate-500 mb-2">{t('quota')}</p>
                            <p className="text-lg font-bold">{rawPercent}%</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                        <span className="pixel-font text-[6px] text-slate-500">{t('daily_progress_flow')}</span>
                        <span className="pixel-font text-[7px] text-blue-200">{rawPercent}%</span>
                    </div>
                    <div className="horizon-bar-bg">
                        <div className="horizon-bar-fill" style={{ width: `${barWidth}%` }} />
                    </div>
                </div>

                {/* Achievements Section */}
                <div className="mb-8">
                    <h2 className="pixel-font text-[8px] tracking-widest text-blue-200/50 mb-6 ml-2">{t('unlockable_archives')}</h2>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <Achievements 
                            stats={{ streak, sessionCount, totalFocusMinutes }} 
                            userId={user.id} 
                        />
                    </div>
                </div>

                {/* Config Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="stat-card">
                        <h2 className="pixel-font text-[8px] text-blue-300/40 mb-6">{t('core_identity')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="pixel-font text-[6px] block mb-2 text-slate-500">{t('ALIAS')}</label>
                                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="glass-input" />
                            </div>
                            <div>
                                <label className="pixel-font text-[6px] block mb-2 text-slate-500">{t('DAILY_GOAL')} (MINS)</label>
                                <input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} className="glass-input" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-card border-red-400/10">
                        <h2 className="pixel-font text-[8px] text-red-300/40 mb-6">! {t('security_layer')}</h2>
                        <div className="space-y-4">
                            <input type="password" placeholder={t('new_access_key')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="glass-input" />
                            <input type="password" placeholder={t('confirm_key')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="glass-input" />
                        </div>
                    </div>
                </div>

                <button onClick={handleSaveProfile} className="btn-save-horizon pixel-font">
                    {t('save_system_reconfig')}
                </button>
            </div>
        </div>
    );
}