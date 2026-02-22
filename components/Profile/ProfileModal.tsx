import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import '../../index.css';

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

            // 1. FETCH TODAY'S SESSIONS
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

            // 2. FETCH PROFILE & HANDLE STREAK LOGIC
            const { data: profileData } = await supabase
                .from('profiles')
                .select('weekly_streak, daily_goal, last_pomo_at')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setDailyGoal(profileData.daily_goal || 100);
                
                // --- STREAK CALCULATION ---
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const oneDayMs = 24 * 60 * 60 * 1000;
                
                let lastPomoDate = 0;
                if (profileData.last_pomo_at) {
                    const lp = new Date(profileData.last_pomo_at);
                    lastPomoDate = new Date(lp.getFullYear(), lp.getMonth(), lp.getDate()).getTime();
                }

                const diff = today - lastPomoDate;
                let updatedStreak = profileData.weekly_streak || 0;

                // If user finished a session today AND hasn't updated streak today
                if (totalMinsToday > 0 && diff !== 0) {
                    if (diff === oneDayMs) {
                        updatedStreak += 1; // Studied yesterday? Streak continues!
                    } else {
                        updatedStreak = 1; // Missed a day? Reset to 1.
                    }

                    // Update database immediately
                    await supabase
                        .from('profiles')
                        .update({ 
                            weekly_streak: updatedStreak, 
                            last_pomo_at: now.toISOString() 
                        })
                        .eq('id', user.id);
                } 
                // If they haven't studied today but it's been more than 1 day since last session...
                else if (diff > oneDayMs) {
                    updatedStreak = 0; // Streak died.
                    await supabase.from('profiles').update({ weekly_streak: 0 }).eq('id', user.id);
                }

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
    const passwordsMatch = newPassword && newPassword === confirmPassword;

    const handleSaveProfile = async () => {
        if (!newUsername.trim()) return;
    
        if (newPassword) {
            if (newPassword.length < 6) return alert(t('password_too_short'));
            if (newPassword !== confirmPassword) return alert(t('password_mismatch'));
            const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
            if (authError) return alert(`AUTH_ERR: ${authError.message}`);
        }

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
        <div className="profile-scope fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
                .profile-scope * { font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace !important; text-transform: uppercase; }
                .terminal-modal { background: #1a1a1a; border: 4px solid #333; color: #00ff00; }
                .stat-box { border: 2px solid #333; background: #111; padding: 15px; }
                .xp-bar-container { border: 2px solid #00ff00; background: #000; height: 20px; padding: 2px; }
                .xp-bar-fill { background: #00ff00; box-shadow: 0 0 10px #00ff00; transition: width 0.5s; }
                .pixel-input { background: #000; border: 2px solid #333; color: #ffaa00; padding: 10px; font-size: 8px; width: 100%; outline: none; }
                .pixel-btn-save { background: #222; border: 2px solid #00ff00; color: #00ff00; padding: 15px; cursor: pointer; width: 100%; }
                .pixel-btn-save:hover { background: #00ff00; color: #000; }
            `}</style>

            <div className="terminal-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-red-500">[X]</button>
                <h1 className="text-[12px] mb-10 text-[#ffaa00] border-b-2 border-[#333] pb-4">
                    {t('user_profile')} // ID_{user.id.substring(0,8)}
                </h1>

                <div className="stat-box mb-8">
                    <h2 className="text-[8px] text-[#00ff00] mb-6 tracking-widest">{">"} {t('progress_report')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
                        <div><p className="text-[6px] text-slate-500 mb-2">{t('mins')}</p><p className="text-[10px] text-white">{totalFocusMinutes}</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">{t('sess')}</p><p className="text-[10px] text-white">{sessionCount}</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">{t('streak')}</p><p className="text-[10px] text-[#ffaa00]">{streak}D</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">{t('quota')}</p><p className="text-[10px] text-white">{rawPercent}%</p></div>
                    </div>
                    <div className="xp-bar-container">
                        <div className="h-full xp-bar-fill" style={{ width: `${barWidth}%` }} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="stat-box">
                        <h2 className="text-[8px] mb-6 text-slate-400"># {t('identity')}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[6px] block mb-2 text-slate-500">{t('username')}</label>
                                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="pixel-input" />
                            </div>
                            <div>
                                <label className="text-[6px] block mb-2 text-slate-500">{t('daily_goal')}</label>
                                <input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} className="pixel-input" />
                            </div>
                        </div>
                    </div>

                    <div className="stat-box border-red-900/50">
                        <h2 className="text-[8px] text-red-500 mb-6">! {t('security')}</h2>
                        <div className="space-y-4">
                            <input type="password" placeholder={t('new_pass')} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pixel-input" />
                            <input type="password" placeholder={t('confirm_pass')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`pixel-input ${confirmPassword && !passwordsMatch ? 'border-red-500' : ''}`} />
                        </div>
                    </div>
                </div>

                <button onClick={handleSaveProfile} className="pixel-btn-save">
                    {">"} {t('execute_update')}
                </button>
            </div>
        </div>
    );
}