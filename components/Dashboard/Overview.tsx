
import React, { useState } from 'react';
import { User, Friend, Goal } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { loginUser, signUpUser } from '../Auth/auth';

interface OverviewProps {
  user: User;
}

export const Overview: React.FC<OverviewProps> = ({ user }) => {
  const [motivation, setMotivation] = useState<string>("Ready for a productive session?");
  const [isLoadingMotiv, setIsLoadingMotiv] = useState(false);

  const friends: Friend[] = [
    { id: '2', username: 'Alex', email: '', coins: 120, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', status: 'studying', currentTask: 'Linear Algebra', lastSeen: 'Active now' },
    { id: '3', username: 'Sarah', email: '', coins: 450, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', status: 'online', lastSeen: 'Active now' },
    { id: '4', username: 'Liam', email: '', coins: 30, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam', status: 'offline', lastSeen: '2h ago' },
  ];

  const goals: Goal[] = [
    { id: '1', title: 'Study for 2 hours', completed: true, category: 'daily' },
    { id: '2', title: 'Finish Math Assignment', completed: false, category: 'daily' },
    { id: '3', title: 'Read 3 Chapters', completed: false, category: 'weekly' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Welcome & Stats */}
      <div className="lg:col-span-2 space-y-8">
        <section className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold font-quicksand mb-2">Welcome back, {user.username}! ✨</h1>
          </div>
          <i className="fas fa-book-open absolute -bottom-4 -right-4 text-white/10 text-9xl"></i>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Studied Today', value: '2.5h', icon: 'fa-clock', color: 'bg-blue-500' },
            { label: 'Pomodoros', value: '5', icon: 'fa-tomato', color: 'bg-red-500' },
            { label: 'Friends Online', value: '2', icon: 'fa-users', color: 'bg-green-500' },
            { label: 'Home Value', value: '1.2k', icon: 'fa-gem', color: 'bg-purple-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-2 shadow-sm`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{stat.label}</p>
            </div>
          ))}
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 font-quicksand">Daily Focus Goals</h3>
            <button className="text-amber-600 font-bold text-sm hover:underline">+ Add Goal</button>
          </div>
          <div className="space-y-3">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                <button className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  goal.completed ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-200 text-transparent'
                }`}>
                  <i className="fas fa-check text-xs"></i>
                </button>
                <span className={`flex-1 font-medium ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {goal.title}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {goal.category}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column: Friends & Activity */}
      <div className="space-y-8">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 font-quicksand">Study Group</h3>
            <i className="fas fa-search text-slate-400 cursor-pointer hover:text-amber-500"></i>
          </div>
          <div className="space-y-4">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-amber-50 transition-all cursor-pointer">
                <div className="relative">
                  <img src={friend.avatar} alt={friend.username} className="w-12 h-12 rounded-xl bg-slate-100" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    friend.status === 'studying' ? 'bg-blue-500' : friend.status === 'online' ? 'bg-green-500' : 'bg-slate-300'
                  }`}></div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{friend.username}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {friend.status === 'studying' ? `📖 ${friend.currentTask}` : friend.lastSeen}
                  </p>
                </div>
                {friend.status === 'studying' && (
                  <button className="bg-amber-100 text-amber-600 p-2 rounded-lg hover:bg-amber-200">
                    <i className="fas fa-headphones text-xs"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-amber-300 hover:text-amber-500 transition-all text-sm">
            + Invite More Friends
          </button>
        </section>

        <section className="bg-slate-800 p-6 rounded-3xl text-white shadow-lg">
          <h3 className="text-lg font-bold mb-4 font-quicksand flex items-center gap-2">
            <i className="fas fa-bullhorn text-amber-400"></i>
            Group Notice
          </h3>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 mb-4">
            <p className="text-sm italic text-slate-300">"Hey guys! Let's hit the 100 hour mark as a group this week. Group session tonight at 8 PM! 🚀"</p>
            <p className="text-[10px] text-amber-400 mt-2 font-bold">— Admin Sarah</p>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Jot a note..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button className="bg-amber-500 hover:bg-amber-600 p-2 rounded-xl transition-colors">
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
