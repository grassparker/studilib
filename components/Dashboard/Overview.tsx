import React, { useState, useEffect } from 'react';
import { User, Goal } from '../../types';
import { supabase } from '../Auth/supabaseClient';

interface OverviewProps {
  user: User;
}

export const Overview: React.FC<OverviewProps> = ({ user }) => {
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  // Data Fetching Logic (Stays the same)
  useEffect(() => {
    const fetchGoals = async () => {
      const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (data) setGoals(data);
    };
    fetchGoals();
  }, [user.id]);

  useEffect(() => {
    const fetchFriends = async () => {
      const { data: friendshipData } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id);
      if (friendshipData && friendshipData.length > 0) {
        const friendIds = friendshipData.map(f => f.friend_id);
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds);
        if (profiles) setFriends(profiles);
      }
    };
    fetchFriends();
  }, [user.id]);

  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const { data } = await supabase.from('goals').insert([{ title: newGoalTitle, user_id: user.id, category: 'daily' }]).select();
    if (data) { setGoals([data[0], ...goals]); setNewGoalTitle(''); }
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    await supabase.from('goals').update({ completed: !completed }).eq('id', id);
    setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !completed } : g));
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const activeGoals = goals.filter(g => !g.completed);
  const archivedGoals = goals.filter(g => g.completed);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 pixel-font uppercase text-slate-900" style={{ imageRendering: 'pixelated' }}>
      
      {/* GLOBAL PIXEL CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', cursive; }
        .pixel-box {
          border: 4px solid black;
          box-shadow: 4px 4px 0 0 rgba(0,0,0,0.2);
          background: white;
          padding: 1.5rem;
        }
        .pixel-banner {
          border: 4px solid black;
          background: #ffaa00;
          color: black;
          box-shadow: 6px 6px 0 0 #cc8800;
        }
        .pixel-input {
          border: 4px solid black;
          padding: 8px;
          outline: none;
          font-size: 10px;
        }
        .pixel-btn-amber {
          background: #ffaa00;
          border: 4px solid black;
          box-shadow: inset -4px -4px 0 0 #cc8800;
          padding: 8px 12px;
          font-size: 10px;
          cursor: pointer;
        }
        .pixel-btn-amber:active { box-shadow: inset 4px 4px 0 0 #cc8800; }
      `}</style>

      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-8">
        {/* Welcome Banner */}
        <section className="pixel-banner p-8 relative overflow-hidden">
          <h1 className="text-sm mb-4">HELLO, {user.username}!</h1>
          <p className="text-[10px] leading-loose">MISSION: CRUSH_TARGETS.EXE</p>
          <div className="absolute right-4 top-4 opacity-20 text-4xl">👾</div>
        </section>
      
        {/* Goals Section */}
        <section className="pixel-box">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
            <h3 className="text-xs font-bold tracking-tighter underline">ACTIVE_QUESTS</h3>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="INPUT QUEST..."
                className="pixel-input flex-1"
              />
              <button onClick={addGoal} className="pixel-btn-amber">ADD</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {activeGoals.length > 0 ? activeGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-4 p-4 border-2 border-slate-100 hover:border-black transition-all group">
                <button 
                  onClick={() => toggleGoal(goal.id, goal.completed)}
                  className="w-8 h-8 border-4 border-black bg-white flex items-center justify-center hover:bg-slate-100"
                >
                  <i className="fas fa-check text-green-600 opacity-0 group-hover:opacity-100 text-xs"></i>
                </button>
                <span className="flex-1 text-[10px]">{goal.title}</span>
                <button onClick={() => deleteGoal(goal.id)} className="text-slate-300 hover:text-red-600">
                  [X]
                </button>
              </div>
            )) : (
              <p className="text-[10px] text-center text-slate-400 py-4 italic">NO QUESTS LOGGED...</p>
            )}
          </div>

          {/* Archived Quests */}
          {archivedGoals.length > 0 && (
            <div className="mt-8 pt-6 border-t-4 border-black border-dotted">
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className="text-[8px] hover:text-amber-600 flex items-center gap-2"
              >
                {showArchived ? '[-] HIDE' : '[+] VIEW'} COMPLETED ({archivedGoals.length})
              </button>

              {showArchived && (
                <div className="mt-4 space-y-2 opacity-60">
                  {archivedGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-4 p-2 bg-slate-50 border-l-4 border-black">
                       <span className="text-[8px] line-through flex-1">{goal.title}</span>
                       <button onClick={() => deleteGoal(goal.id)} className="text-[8px]">[DEL]</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-8">
        {/* Study Group */}
        <section className="pixel-box">
          <h3 className="text-xs mb-6 underline">PARTY_MEMBERS</h3>
          <div className="space-y-6">
            {friends.length > 0 ? friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-4 group cursor-pointer">
                <div className="w-12 h-12 border-4 border-black bg-slate-100 overflow-hidden">
                  <img 
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                    alt={friend.username} 
                    className="w-full h-full" 
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold">{friend.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 border border-black"></div>
                    <p className="text-[8px] text-green-600">ONLINE</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-[8px] text-slate-400 text-center">NO ALLIES FOUND.</p>
            )}
          </div>
        </section>

        {/* Group Notice */}
        <section className="bg-black text-white border-4 border-[#555] p-6 shadow-[8px_8px_0_0_#222]">
          <h3 className="text-[10px] mb-4 text-amber-400">!! SYSTEM_MSG</h3>
          <div className="border-l-4 border-amber-400 pl-4 py-2">
            <p className="text-[9px] leading-relaxed italic">"CONSISTENCY IS POWER. 6PM BOSS RAID INITIATED."</p>
          </div>
        </section>
      </div>
    </div>
  );
};