import React, { useState, useEffect } from 'react';
import { supabase } from '../Auth/supabaseClient';
import { User } from '../../types';
import { createClient } from '@supabase/supabase-js';
import { loginUser, signUpUser } from '../Auth/auth';
interface ScheduledTask {
  id: string;
  title: string;
  start_time: string;
  duration_min: number; 
  task_type: 'task' | 'call';
}

interface ScheduleProps {
  user: User;
}

export const Schedule: React.FC<ScheduleProps> = ({ user }) => {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');

  

  useEffect(() => {
    if (!user) return;

    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: true });

      if (data) setTasks(data);
      if (error) console.error("Schedule fetch error:", error);
      setLoading(false);
    };

    fetchSchedule();
  }, [user]);

  const addTask = async () => {
    if (!newTitle.trim()) return;

    const { data, error } = await supabase
      .from('schedules')
      .insert([{
        user_id: user.id, // <--- Add this back! It won't be null anymore.
        title: newTitle,
        start_time: `${newTime}:00`, 
        task_type: 'task',
        duration_min: 25
      }])
      .select();
  
    if (data) {
      setTasks(prev => [...prev, data[0]].sort((a,b) => a.start_time.localeCompare(b.start_time)));
      setNewTitle('');
    }
  
    if (error) {
      console.error("Final Debug Error:", error.message);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6 p-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
          <p className="text-slate-500">Please log in to view your schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 font-quicksand">Daily Planner</h2>
        
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="What's next?"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input 
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button 
            onClick={addTask}
            className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600 transition-all text-sm"
          >
            Add
          </button>
        </div>
      </header>

      {/* Timeline View */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading your day...</div>
        ) : tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors group">
              <div className="w-16 text-sm font-bold text-slate-400">
                {task.start_time.slice(0, 5)}
              </div>
              <div className={`flex-1 p-3 rounded-2xl border-l-4 ${
                task.task_type === 'call' ? 'bg-blue-50 border-blue-500' : 'bg-amber-50 border-amber-500'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700">{task.title}</span>
                  <span className="text-[10px] uppercase font-black text-slate-400">{task.duration_min} min</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-slate-400 italic">No tasks yet. Enjoy your free time! 🏖️</div>
        )}
      </div>
    </div>
  );
};