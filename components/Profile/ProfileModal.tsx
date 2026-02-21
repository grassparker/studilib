import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onProfileUpdate: (updatedData: any) => void; 
}

export default function ProfileModal({ isOpen, onClose, user, onProfileUpdate }: ProfileModalProps) {
    const [newUsername, setNewUsername] = useState('');
    const [dailyGoal, setDailyGoal] = useState(100); 
    const [sessionCount, setSessionCount] = useState(0);
    const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
    const [streak, setStreak] = useState(0);
    
    // Password States
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

useEffect(() => {
        const fetchLiveStats = async () => {
            if (!user?.id || !isOpen) return;

            // 1. GET THE START OF "TODAY" (Midnight)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // 2. FETCH ONLY TODAY'S SESSIONS (This fixes the "Reset after each day" issue)
            const { data: sessionData } = await supabase
                .from('study_sessions')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', todayISO); // Filter for today only

            if (sessionData) {
                setSessionCount(sessionData.length);
                const total = sessionData.reduce((acc, curr) => acc + (Number(curr.time) || 25), 0);
                setTotalFocusMinutes(total);
            }

            // 3. FETCH PROFILE DATA (Streak and Goal)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('weekly_streak, daily_goal, last_pomo_at')
                .eq('id', user.id)
                .single();

            if (profileData) {
                setDailyGoal(profileData.daily_goal || 100);
                
                // STREAK LOGIC:
                // If they did a pomo today, use the current streak.
                // If they haven't done a pomo today, we'd usually calculate if they missed yesterday.
                // For now, let's just display what's in the DB.
                setStreak(profileData.weekly_streak || 0);
            }
        };

        fetchLiveStats();
        if (user) setNewUsername(user.username || '');
    }, [user, isOpen]);

    const rawPercent = Math.round((totalFocusMinutes / (dailyGoal || 1)) * 100);
    const barWidth = Math.min(rawPercent, 100);
    const isOverachieving = rawPercent >= 100;

    const handleSaveProfile = async () => {
        if (!newUsername.trim()) return;
    
        // Password Logic (Keep as is...)
        if (newPassword) {
            if (newPassword.length < 6) return alert("ERR: PASSWORD_TOO_SHORT");
            if (newPassword !== confirmPassword) return alert("ERR: PASSWORD_MISMATCH");
            const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
            if (authError) return alert(`AUTH_ERR: ${authError.message}`);
        }

        // THE FIX: Update the profile and handle the response
        const { error } = await supabase
            .from('profiles')
            .update({ 
                username: newUsername, 
                daily_goal: dailyGoal  // Sending the state value to DB
            })
            .eq('id', user.id);

        if (!error) {
            // 1. Tell the parent component to update the main User object
            onProfileUpdate({ username: newUsername, daily_goal: dailyGoal }); 
        
            // 2. Clear password fields
            setNewPassword('');
            setConfirmPassword('');
        
            alert('SYSTEM_RECONFIGURED_SUCCESSFULLY');
        
            // Optional: Close the modal automatically on success
            // onClose(); 
        } else {
            alert("ERR: DATABASE_REJECTED_CHANGES");
        }
    };

    if (!isOpen) return null;

    const passwordsMatch = newPassword && newPassword === confirmPassword;

    return (
        <div className="profile-scope fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                .profile-scope { image-rendering: pixelated; }
                .profile-scope * { font-family: 'Press Start 2P', cursive !important; text-transform: uppercase; }
                
                .terminal-modal {
                    background: #1a1a1a;
                    border: 4px solid #333;
                    box-shadow: 0 0 0 4px #000, 15px 15px 0 0 rgba(0,0,0,0.5);
                    color: #00ff00;
                }

                .stat-box { border: 2px solid #333; background: #111; padding: 15px; }

                .xp-bar-container { border: 2px solid #00ff00; background: #000; height: 20px; padding: 2px; }
                .xp-bar-fill { background: #00ff00; box-shadow: 0 0 10px #00ff00; }

                .pixel-input {
                    background: #000;
                    border: 2px solid #333;
                    color: #ffaa00;
                    padding: 10px;
                    font-size: 8px;
                    width: 100%;
                    outline: none;
                }
                .pixel-input:focus { border-color: #ffaa00; }

                .pixel-btn-save {
                    background: #222;
                    border: 2px solid #00ff00;
                    color: #00ff00;
                    padding: 15px;
                    cursor: pointer;
                    font-size: 10px;
                    width: 100%;
                }
                .pixel-btn-save:hover { background: #00ff00; color: #000; }
            `}</style>

            <div className="terminal-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-red-500">[X]</button>

                <h1 className="text-[12px] mb-10 text-[#ffaa00] border-b-2 border-[#333] pb-4">
                    USER_PROFILE // ID_{user.id.substring(0,8)}
                </h1>

                {/* STATS */}
                <div className="stat-box mb-8">
                    <h2 className="text-[8px] text-[#00ff00] mb-6 tracking-widest">{">"} PROGRESS_REPORT</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-center">
                        <div><p className="text-[6px] text-slate-500 mb-2">MINS</p><p className="text-[10px] text-white">{totalFocusMinutes}</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">SESS</p><p className="text-[10px] text-white">{sessionCount}</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">STREAK</p><p className="text-[10px] text-[#ffaa00]">{streak}D</p></div>
                        <div><p className="text-[6px] text-slate-500 mb-2">QUOTA</p><p className="text-[10px] text-white">{rawPercent}%</p></div>
                    </div>
                    <div className="xp-bar-container">
                        <div className="h-full transition-all duration-1000 xp-bar-fill" style={{ width: `${barWidth}%` }} />
                    </div>
                </div>

                {/* DUAL INPUT SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Identity */}
                    <div className="stat-box">
                        <h2 className="text-[8px] mb-6 text-slate-400"># IDENTITY</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[6px] block mb-2 text-slate-500">USERNAME</label>
                                <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="pixel-input" />
                            </div>
                            <div>
                                <label className="text-[6px] block mb-2 text-slate-500">DAILY_GOAL</label>
                                <input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(Number(e.target.value))} className="pixel-input" />
                            </div>
                        </div>
                    </div>

                    {/* Security with Double Pass */}
                    <div className="stat-box border-red-900/50">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-[8px] text-red-500">! SECURITY</h2>
                            {passwordsMatch && <span className="text-[6px] text-[#00ff00]">MATCHED</span>}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[6px] block mb-2 text-slate-500">NEW_PASSWORD</label>
                                <input 
                                    type="password" 
                                    placeholder="********" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    className="pixel-input" 
                                />
                            </div>
                            <div>
                                <label className="text-[6px] block mb-2 text-slate-500">CONFIRM_PASS</label>
                                <input 
                                    type="password" 
                                    placeholder="********" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className={`pixel-input ${confirmPassword && !passwordsMatch ? 'border-red-500' : ''}`} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={handleSaveProfile} className="pixel-btn-save">
                    {">"} EXECUTE_UPDATE
                </button>
            </div>
        </div>
    );
}