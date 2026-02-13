import React, { useState } from 'react';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';


interface UserStats {
    focusTime: number;
    pomodorosCompleted: number;
    weeklyStreak: number;
    monthlyGoal: number;
    monthlyProgress: number;
}

interface UserProfile {
    username: string;
    stats: UserStats;
}

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export default function ProfileModal({ isOpen, onClose, user }: ProfileModalProps) {
    // 1. Hooks must ALWAYS be at the top level (before the 'if !isOpen' check)
    const [profile, setProfile] = useState<UserProfile>({
        username: user.username || 'User',
        stats: {
            focusTime: 45,
            pomodorosCompleted: 12,
            weeklyStreak: 5,
            monthlyGoal: 100,
            monthlyProgress: 67,
        },
    });

    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(profile.username);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSaveProfile = () => {
        setProfile({ ...profile, username: newUsername });
        setIsEditing(false);
    };

    const handleChangePassword = () => {
        if (newPassword === confirmPassword) {
            alert('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            alert('Passwords do not match');
        }
    };

    // 2. Early return for modal visibility
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-slate-50 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md text-slate-400 hover:text-red-500 transition-all z-10"
                >
                    <i className="fas fa-times text-lg"></i>
                </button>

                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-8 text-slate-800 font-quicksand">Profile Settings</h1>

                    {/* Account Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Account Info</h2>
                        {!isEditing ? (
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-slate-400">Username</p>
                                    <p className="text-xl font-bold text-slate-800">{profile.username}</p>
                                </div>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm shadow-amber-200"
                                >
                                    Edit
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
                                    placeholder="New username"
                                />
                                <button
                                    onClick={handleSaveProfile}
                                    className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-600"
                                >
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Statistics */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Your Progress</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Focus</p>
                                <p className="text-xl font-black text-slate-800">{profile.stats.focusTime}h</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Pomos</p>
                                <p className="text-xl font-black text-slate-800">{profile.stats.pomodorosCompleted}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Streak</p>
                                <p className="text-xl font-black text-amber-500">{profile.stats.weeklyStreak}🔥</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Goal</p>
                                <p className="text-xl font-black text-slate-800">{profile.stats.monthlyProgress}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">Security</h2>
                        <div className="space-y-3 max-w-md mx-auto">
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="Current password"
                            />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="New password"
                            />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500"
                                placeholder="Confirm new password"
                            />
                            <button
                                onClick={handleChangePassword}
                                className="w-full bg-slate-800 text-white px-4 py-3 rounded-xl font-bold hover:bg-slate-900 transition-colors mt-2"
                            >
                                Update Password
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}