import React, { useState } from 'react';

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

export default function Profile() {
    const [profile, setProfile] = useState<UserProfile>({
        username: 'User',
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
            // API call to update password
            alert('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            alert('Passwords do not match');
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Profile</h1>

            {/* User Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Account Info</h2>
                {!isEditing ? (
                    <div className="flex justify-between items-center">
                        <p className="text-lg">Username: <span className="font-semibold">{profile.username}</span></p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Edit
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            placeholder="New username"
                        />
                        <button
                            onClick={handleSaveProfile}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Save
                        </button>
                    </div>
                )}
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Statistics</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-600">Focus Time</p>
                        <p className="text-2xl font-bold">{profile.stats.focusTime}h</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-600">Pomodoros</p>
                        <p className="text-2xl font-bold">{profile.stats.pomodorosCompleted}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-600">Weekly Streak</p>
                        <p className="text-2xl font-bold">{profile.stats.weeklyStreak} days</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                        <p className="text-gray-600">Monthly Progress</p>
                        <p className="text-2xl font-bold">{profile.stats.monthlyProgress}/{profile.stats.monthlyGoal}</p>
                    </div>
                </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                <div className="space-y-4">
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Current password"
                    />
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="New password"
                    />
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2"
                        placeholder="Confirm password"
                    />
                    <button
                        onClick={handleChangePassword}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    );
}