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

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
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
    /* Changed min-h-screen and added pb-24 for mobile navigation clearance */
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 pb-32 md:pb-8 min-h-full pixel-font uppercase text-slate-900 overflow-y-auto lg:overflow-visible">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', cursive; }
        .pixel-box {
          border: 4px solid black;
          box-shadow: 6px 6px 0 0 rgba(0,0,0,1);
          background: white;
          padding: 1.5rem;
        }
        .pixel-banner {
          border: 4px solid black;
          background: #ffaa00;
          color: black;
          box-shadow: 6px 6px 0 0 rgba(0,0,0,1);
        }
        .pixel-input {
          border: 4px solid black;
          padding: 12px;
          outline: none;
          font-size: 8px;
          background: white;
        }
        .pixel-btn-amber {
          background: #ffaa00;
          border: 4px solid black;
          box-shadow: 4px 4px 0 0 black;
          padding: 8px 16px;
          font-size: 10px;
          cursor: pointer;
        }
        .pixel-btn-amber:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0 0 black; }
      `}</style>

      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-8">
        <section className="pixel-banner p-6 md:p-8 relative overflow-hidden">
          <h1 className="text-[10px] md:text-sm mb-4">HELLO, {user.username}!</h1>
          <p className="text-[8px] md:text-[10px] leading-loose">MISSION: CRUSH_TARGETS.EXE</p>
          <div className="absolute right-4 top-4 opacity-20 text-4xl hidden md:block">👾</div>
        </section>
      
        <section className="pixel-box">
          <div className="flex flex-col gap-6 mb-8">
            <h3 className="text-[10px] font-bold underline">ACTIVE_QUESTS</h3>
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <input 
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="INPUT QUEST..."
                className="pixel-input flex-1"
              />
              <button onClick={addGoal} className="pixel-btn-amber">ADD_QUEST</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {activeGoals.length > 0 ? activeGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-4 p-4 border-4 border-black bg-white group shadow-[4px_4px_0_0_rgba(0,0,0,0.05)]">
                <button 
                  onClick={() => toggleGoal(goal.id, goal.completed)}
                  className="w-10 h-10 border-4 border-black bg-white flex items-center justify-center active:bg-amber-400 shrink-0"
                >
                  <i className="fas fa-check text-black text-xs"></i>
                </button>
                <span className="flex-1 text-[8px] md:text-[10px] leading-tight">{goal.title}</span>
                <button onClick={() => deleteGoal(goal.id)} className="text-red-500 text-[8px] md:text-[10px]">
                  [X]
                </button>
              </div>
            )) : (
              <p className="text-[8px] text-center text-slate-400 py-8 border-4 border-dashed border-slate-200">NO ACTIVE QUESTS LOGGED...</p>
            )}
          </div>

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
                    <div key={goal.id} className="flex items-center gap-4 p-3 bg-slate-50 border-4 border-black">
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
        <section className="pixel-box">
          <h3 className="text-[10px] mb-6 underline">PARTY_MEMBERS</h3>
          <div className="space-y-6">
            {friends.length > 0 ? friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-4 group">
                <div className="w-12 h-12 border-4 border-black bg-white shrink-0">
                  <img 
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                    alt={friend.username} 
                    className="w-full h-full" 
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[8px] font-bold truncate">{friend.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 border-2 border-black"></div>
                    <p className="text-[6px] text-green-600">ONLINE</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-[8px] text-slate-400 text-center">NO ALLIES FOUND.</p>
            )}
          </div>
        </section>

        <section className="bg-black text-white border-4 border-black p-6 shadow-[8px_8px_0_0_#FBBF24]">
          <h3 className="text-[10px] mb-4 text-amber-400 tracking-tighter">!! SYSTEM_MSG</h3>
          <div className="border-l-4 border-amber-400 pl-4 py-2">
            <p className="text-[8px] leading-relaxed italic">"CONSISTENCY IS POWER. 6PM BOSS RAID INITIATED."</p>
          </div>
        </section>
      </div>
    </div>
  );
};