import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../Auth/supabaseClient';
import { User } from '../../types';

interface ScheduledTask {
  id: string;
  title: string;
  start_time: string;
  task_date: string;
  duration_min: number;
  task_type: 'task' | 'call';
}

export const Schedule: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);

  useEffect(() => {
    if (user) {
      fetchSchedule();
      const interval = setInterval(fetchSchedule, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchSchedule = async () => {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      // Automatically hide overdue tasks: must be today+future, and if today, time must be >= now
      .or(`task_date.gt.${todayDate},and(task_date.eq.${todayDate},start_time.gte.${currentTime})`)
      .order('task_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (data) setTasks(data);
    if (error) console.error("Filter Error:", error.message);
    setLoading(false);
  };

  const addTask = async () => {
    if (!newTitle.trim()) return;
    const { data } = await supabase.from('schedules').insert([{
      user_id: user.id, 
      title: newTitle.toUpperCase(), 
      start_time: `${newTime}:00`, 
      task_date: newDate, 
      task_type: 'task', 
      duration_min: 25
    }]).select();
    
    if (data) {
      setTasks(prev => [...prev, data[0]].sort((a, b) => (a.task_date + a.start_time).localeCompare(b.task_date + b.start_time)));
      setNewTitle('');
    }
  };

  const deleteTask = async (id: string) => {
    await supabase.from('schedules').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const saveEdit = async () => {
    if (!editingTask) return;
    const { error } = await supabase.from('schedules')
      .update({ 
        title: editingTask.title.toUpperCase(), 
        start_time: editingTask.start_time, 
        task_date: editingTask.task_date 
      })
      .eq('id', editingTask.id);
    
    if (!error) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t).sort((a,b) => (a.task_date + a.start_time).localeCompare(b.task_date + b.start_time)));
      setEditingTask(null);
    }
  };

  const getDetailedCategory = (task: ScheduledTask) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const taskDate = new Date(task.task_date);
    const diffDays = Math.round((new Date(task.task_date).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));

    if (task.task_date === todayStr) {
      const hour = parseInt(task.start_time.split(':')[0]);
      if (hour < 12) return t('morning_log');
      if (hour < 17) return t('afternoon_log');
      return t('evening_log');
    }
    
    if (diffDays === 1) return t('tomorrow_intel');
    if (diffDays <= 7) return t('next_7_days');
    return t('next_month_data');
  };

  const categoryOrder = [
    t('morning_log'), t('afternoon_log'), t('evening_log'), 
    t('tomorrow_intel'), t('next_7_days'), t('next_month_data')
  ];

  // Logic to hide tasks when > 10 exist
  const visibleTasks = showAll ? tasks : tasks.slice(0, 10);

  return (
    <div className="schedule-scope space-y-8 p-4 max-w-4xl mx-auto pb-32">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .schedule-scope * { font-family: 'Press Start 2P', cursive !important; text-transform: uppercase; }
        
        .party-panel {
          background: white;
          border: 4px solid black;
          box-shadow: 8px 8px 0 0 rgba(0,0,0,0.1);
          padding: 24px;
        }

        .party-input {
          background: white;
          border: 4px solid black;
          color: black;
          padding: 12px;
          font-size: 8px;
          outline: none;
          width: 100%;
        }

        .find-btn {
          background: #ffaa00;
          color: black;
          border: 4px solid black;
          font-size: 10px;
          padding: 12px 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 2px 2px 0 0 black;
        }
        .find-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0 0 black; }

        .party-row {
          background: white;
          border: 4px solid black;
          margin-bottom: 12px;
          padding: 16px;
        }

        .section-header {
          font-size: 10px;
          border-bottom: 2px solid black;
          padding-bottom: 4px;
          margin-bottom: 16px;
          display: inline-block;
        }

        .time-badge {
          color: #64748b;
          font-size: 8px;
          margin-right: 16px;
        }

        .active-cursor {
          color: white;
          animation: finger-bob 0.6s steps(2, start) infinite;
        }

        @keyframes finger-bob {
          0% { transform: translateX(0); }
          100% { transform: translateX(5px); }
        }
      `}</style>

      {/* 1. SEARCH/INPUT PANEL */}
      <div className="party-panel">
        <h3 className="section-header mb-6">{t('log_new_entry')}</h3>
        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder={t('input_quest_title')}
            value={newTitle} 
            onChange={e => setNewTitle(e.target.value)} 
            className="party-input" 
          />
          <div className="flex flex-wrap gap-4">
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="party-input flex-1" />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="party-input flex-1" />
            <button onClick={addTask} className="find-btn">
              <i className="fas fa-plus"></i> {t('execute')}
            </button>
          </div>
        </div>
      </div>

      {/* 2. CATEGORIZED TASK LIST */}
      <div className="party-panel min-h-[400px]">
        {tasks.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-[#94a3b8] text-[8px] tracking-widest">{t('log_empty')}</p>
          </div>
        ) : (
          <div className="space-y-10">
            {categoryOrder.map(cat => {
              const catTasks = visibleTasks.filter(t => getDetailedCategory(t) === cat);
              if (catTasks.length === 0) return null;

              return (
                <section key={cat}>
                  <h3 className="section-header">{cat}</h3>
                  <div className="space-y-4 mt-4">
                    {catTasks.map(task => (
                      <div key={task.id} className="relative flex items-center">
                        {editingTask?.id === task.id && (
                          <span className="absolute -left-8 active-cursor">
                            <i className="fas fa-hand-point-right"></i>
                          </span>
                        )}
                        
                        <div className={`party-row flex-1 flex items-center justify-between ${editingTask?.id === task.id ? 'bg-amber-50' : ''}`}>
                          {editingTask?.id === task.id ? (
                            <div className="flex flex-wrap gap-3 flex-1 items-center">
                              <input 
                                className="party-input flex-1" 
                                value={editingTask.title} 
                                onChange={e => setEditingTask({...editingTask, title: e.target.value})} 
                              />
                              <div className="flex gap-4 ml-auto">
                                <button onClick={saveEdit} className="text-blue-600 text-[8px] underline">[{t('save')}]</button>
                                <button onClick={() => setEditingTask(null)} className="text-red-500 text-[8px] underline">[{t('exit')}]</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center">
                                <span className="time-badge">{task.start_time.slice(0,5)}</span>
                                <span className="text-[10px] text-black tracking-tight">{task.title}</span>
                              </div>
                              <div className="flex gap-4">
                                <button onClick={() => setEditingTask(task)} className="text-amber-600 text-[8px]">{t('edit')}</button>
                                <button onClick={() => deleteTask(task.id)} className="text-red-500 text-[8px]">{t('drop')}</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. FETCH MORE DATA BUTTON */}
      {tasks.length > 10 && (
        <button 
          onClick={() => setShowAll(!showAll)} 
          className="w-full py-6 party-panel text-black text-[10px] hover:bg-slate-50 transition-colors flex items-center justify-center gap-4"
        >
          {showAll ? (
            <> <i className="fas fa-chevron-up"></i> {t('collapse_log')} </>
          ) : (
            <> <i className="fas fa-search"></i> {t('fetch_more')}_{tasks.length - 10}_{t('more_entries')} </>
          )}
        </button>
      )}
    </div>
  );
};