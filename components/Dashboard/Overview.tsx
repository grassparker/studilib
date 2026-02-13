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

  // 1. Fetch Goals
  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setGoals(data);
      if (error) console.error("Goal fetch error:", error);
    };
    fetchGoals();
  }, [user.id]);

  // 2. Goal Action Handlers
  const addGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const { data, error } = await supabase
      .from('goals')
      .insert([{ title: newGoalTitle, user_id: user.id, category: 'daily' }])
      .select();

    if (data) {
      setGoals([data[0], ...goals]);
      setNewGoalTitle('');
    }
    if (error) console.error("Add goal error:", error);
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('goals')
      .update({ completed: !completed })
      .eq('id', id);

    if (!error) {
      setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !completed } : g));
    }
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) setGoals(prev => prev.filter(g => g.id !== id));
  };

  // Memoized Filters
  const activeGoals = goals.filter(g => !g.completed);
  const archivedGoals = goals.filter(g => g.completed);

  // 3. Fetch Friends
  useEffect(() => {
    const fetchFriends = async () => {
      const { data: friendshipData } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', user.id);

      if (friendshipData && friendshipData.length > 0) {
        const friendIds = friendshipData.map(f => f.friend_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', friendIds);

        if (profiles) setFriends(profiles);
      } else {
        setFriends([]);
      }
    };
    fetchFriends();
  }, [user.id]);

  // 4. Presence Logic
  useEffect(() => {
    const channel = supabase.channel('online-users');
    channel
      .on('presence', { event: 'sync' }, () => {
        console.log('Online state updated:', channel.presenceState());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: user.username,
            online_at: new Date().toISOString(),
          });
        }
      });
    return () => { channel.unsubscribe(); };
  }, [user.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">

      {/* LEFT COLUMN: Welcome & Goals */}
      <div className="lg:col-span-2 space-y-8">
        <section className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
          <h1 className="text-3xl font-bold font-quicksand mb-2">Welcome back, {user.username}! ✨</h1>
          <p className="opacity-90">Ready to crush your targets today?</p>
          <i className="fas fa-book-open absolute -bottom-4 -right-4 text-white/10 text-9xl"></i>
        </section>
      
      {/* Goals */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 font-quicksand">Daily Focus Goals</h3>
            <div className="flex gap-2">
              <input 
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                placeholder="New goal..."
                className="text-sm border border-slate-200 rounded-xl px-3 py-1 outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button onClick={addGoal} className="bg-amber-500 text-white px-4 py-1 rounded-xl font-bold text-sm hover:bg-amber-600 transition-colors">
                + Add
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {activeGoals.length > 0 ? activeGoals.map((goal) => (
              <div key={goal.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all">
                <button 
                  onClick={() => toggleGoal(goal.id, goal.completed)}
                  className="w-6 h-6 rounded-lg border-2 border-slate-200 flex items-center justify-center transition-all hover:border-amber-500"
                >
                  <i className="fas fa-check text-[10px] text-amber-500 opacity-0 group-hover:opacity-30"></i>
                </button>
                <span className="flex-1 font-medium text-slate-700">{goal.title}</span>
                <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                  <i className="fas fa-trash-alt text-sm"></i>
                </button>
              </div>
            )) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm italic">No active goals. Add one above! 🚀</p>
              </div>
            )}
          </div>

          {archivedGoals.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-50">
              <button 
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-2"
              >
                {showArchived ? 'Hide' : 'View'} Finished ({archivedGoals.length})
                <i className={`fas fa-chevron-${showArchived ? 'up' : 'down'}`}></i>
              </button>

              {showArchived && (
                <div className="mt-4 space-y-2">
                  {archivedGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 group opacity-60">
                      <button
                        onClick={() => toggleGoal(goal.id, goal.completed)}
                        className="w-6 h-6 rounded-lg bg-amber-500 border-amber-500 text-white flex items-center justify-center"
                      >
                        <i className="fas fa-check text-[10px]"></i>
                      </button>
                      <span className="flex-1 text-sm text-slate-500 line-through">{goal.title}</span>
                      <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500">
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* RIGHT COLUMN: Study Group & Notice */}
      <div className="space-y-8">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold text-slate-800 font-quicksand mb-6">Study Group</h3>
          <div className="space-y-4">
            {friends.length > 0 ? friends.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-amber-50 transition-colors cursor-pointer">
                <div className="relative">
                  <img 
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                    alt={friend.username} 
                    className="w-12 h-12 rounded-xl bg-slate-100" 
                  />
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm">{friend.username}</p>
                  <p className="text-xs text-green-600 font-medium">Online</p>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-sm text-center py-4">No study buddies yet!</p>
            )}
          </div>
        </section>

        <section className="bg-slate-800 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
          <h3 className="text-lg font-bold mb-4 font-quicksand flex items-center gap-2 relative z-10">
            <i className="fas fa-bullhorn text-amber-400"></i> Group Notice
          </h3>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 relative z-10">
            <p className="text-sm italic text-slate-300">"Consistency is key. See you at the 6 PM session!"</p>
          </div>
          <i className="fas fa-quote-right absolute top-2 right-2 text-white/5 text-6xl"></i>
        </section>
      </div>
    </div>
  );
};