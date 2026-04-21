import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../Auth/supabaseClient';
import { User } from '../../types';

interface SubTask {
  id: string;
  text: string;
  done: boolean;
}

interface ScheduledTask {
  id: string;
  title: string;
  start_time: string;
  task_date: string;
  duration_min: number;
  task_type: 'task' | 'call';
  memos?: string;
  sub_tasks?: SubTask[];
  is_ics_event?: boolean;
  external_id?: string;
}

const getLocalToday = () => new Date().toLocaleDateString('en-CA');

export const Schedule: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();

  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('day');
  const [selectedDate, setSelectedDate] = useState(getLocalToday());
  const [selectedQuest, setSelectedQuest] = useState<ScheduledTask | null>(null);
  const [deployMode, setDeployMode] = useState<'event' | 'task'>('event');

  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [memoText, setMemoText] = useState('');
  const [icsUrlInput, setIcsUrlInput] = useState('');
  const [currentIcsUrl, setCurrentIcsUrl] = useState('');
  
  const [newSubTaskText, setNewSubTaskText] = useState('');

  const categoryOrder = [t('morning_log'), t('afternoon_log'), t('evening_log')];

  const getTaskStyle = (task: ScheduledTask) => {
    if (task.is_ics_event) return 'bg-blue-400/5 border-blue-400/20 hover:border-blue-400/50 text-blue-100';
    if (task.start_time === '00:00:00') return 'bg-white/5 border-white/10 hover:border-white/30 text-slate-300';
    return 'bg-[#e6ccb2]/5 border-[#e6ccb2]/20 hover:border-[#e6ccb2]/60 text-[#e6ccb2]';
  };

  useEffect(() => {
    const initData = async () => {
      const { data: profile } = await supabase.from('profiles').select('ics_url').eq('id', user.id).single();
      if (profile?.ics_url) {
        setCurrentIcsUrl(profile.ics_url);
        setIcsUrlInput(profile.ics_url);
      }
    };
    initData();
  }, [user.id]);

  useEffect(() => {
    if (selectedQuest) setMemoText(selectedQuest.memos || '');
  }, [selectedQuest]);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('schedules')
      .select(`*`)
      .eq('user_id', user.id)
      .order('start_time', { ascending: true });
    
    if (data) setTasks(data);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    try {
      const isTaskMode = deployMode === 'task';
      const initialSubTasks: SubTask[] = isTaskMode ? [{
        id: crypto.randomUUID(),
        text: newTitle.toUpperCase(),
        done: false
      }] : [];

      const { error } = await supabase.from('schedules').insert([{
        user_id: user.id,
        title: newTitle.toUpperCase(),
        start_time: isTaskMode ? '00:00:00' : `${newTime}:00`,
        task_date: selectedDate,
        task_type: 'task',
        sub_tasks: initialSubTasks 
      }]);

      if (error) throw error;
      setNewTitle('');
      fetchSchedule();
    } catch (err: any) { alert(err.message); }
  };

  const syncICS = async () => {
    if (!currentIcsUrl) return alert("NO ARCHIVE BOUND");
    setLoading(true);
    try {
      await supabase.functions.invoke('sync-calendar', { body: { user_id: user.id } });
      fetchSchedule();
    } catch (err: any) {
      alert("SYNC FAILED");
    } finally { setLoading(false); }
  };

  const updateIcsUrl = async () => {
    const { error } = await supabase.from('profiles').update({ ics_url: icsUrlInput }).eq('id', user.id);
    if (!error) {
      setCurrentIcsUrl(icsUrlInput);
      alert('SOURCE LINKED');
    }
  };

  const toggleSubTask = async (taskId: string, subTaskId: string, currentStatus: boolean) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const updatedSubTasks = (targetTask.sub_tasks || []).map(st => 
      st.id === subTaskId ? { ...st, done: !currentStatus } : st
    );

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, sub_tasks: updatedSubTasks } : t));
    if (selectedQuest?.id === taskId) setSelectedQuest({ ...selectedQuest, sub_tasks: updatedSubTasks });

    await supabase.from('schedules').update({ sub_tasks: updatedSubTasks }).eq('id', taskId);
  };

  const addSubTask = async () => {
    if (!selectedQuest || !newSubTaskText.trim()) return;
    const newSub: SubTask = { id: crypto.randomUUID(), text: newSubTaskText.toUpperCase(), done: false };
    const updatedSubTasks = [...(selectedQuest.sub_tasks || []), newSub];
    
    const { error } = await supabase.from('schedules').update({ sub_tasks: updatedSubTasks }).eq('id', selectedQuest.id);
    if (!error) {
      setSelectedQuest({ ...selectedQuest, sub_tasks: updatedSubTasks });
      setNewSubTaskText('');
      fetchSchedule();
    }
  };

  const deleteSubTask = async (subTaskId: string) => {
    if (!selectedQuest) return;
    const updatedSubTasks = (selectedQuest.sub_tasks || []).filter(st => st.id !== subTaskId);
    const { error } = await supabase.from('schedules').update({ sub_tasks: updatedSubTasks }).eq('id', selectedQuest.id);
    if (!error) {
      setSelectedQuest({ ...selectedQuest, sub_tasks: updatedSubTasks });
      fetchSchedule();
    }
  };

  const toggleAllSubTasks = async (task: ScheduledTask) => {
    const allDone = task.sub_tasks?.every(st => st.done) || false;
    const updatedSubTasks = (task.sub_tasks || []).map(st => ({ ...st, done: !allDone }));
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, sub_tasks: updatedSubTasks } : t));
    await supabase.from('schedules').update({ sub_tasks: updatedSubTasks }).eq('id', task.id);
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) fetchSchedule();
  };

  const saveMemos = async () => {
    if (!selectedQuest) return;
    await supabase.from('schedules').update({ memos: memoText }).eq('id', selectedQuest.id);
    fetchSchedule();
    setSelectedQuest(null);
  };

  const getDaysInMonth = () => {
    const now = new Date(selectedDate);
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toLocaleDateString('en-CA');
    });
  };

  const filteredTasks = tasks.filter(t => t.task_date === selectedDate);
  const today = getLocalToday();

  return (
    <div className="schedule-scope space-y-6 p-4 md:p-8 max-w-6xl mx-auto pb-32 text-slate-200">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Plus+Jakarta+Sans:wght@300;400;600&display=swap');
        .schedule-scope { font-family: 'Plus Jakarta Sans', sans-serif; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        
        .glass-hud { 
          background: rgba(255, 255, 255, 0.03); 
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08); 
          border-radius: 20px;
          padding: 16px;
        }
        @media (min-width: 768px) { .glass-hud { padding: 24px; border-radius: 24px; } }

        .input-horizon { 
          background: rgba(0, 0, 0, 0.2); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          border-radius: 12px;
          padding: 12px; 
          font-size: 14px; 
          color: #f8fafc; 
          width: 100%; 
          transition: all 0.3s;
        }
        .input-horizon:focus { border-color: #e6ccb2; background: rgba(255, 255, 255, 0.05); outline: none; }

        .btn-horizon { 
          background: #e6ccb2; 
          color: #000d3d; 
          border-radius: 12px;
          padding: 12px 16px; 
          font-weight: 700; 
          transition: all 0.3s;
          white-space: nowrap;
        }
        .btn-horizon:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(230, 204, 178, 0.2); }

        .btn-ghost-horizon {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
          border-radius: 12px;
          transition: all 0.2s;
        }
        .btn-ghost-horizon:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); }

        .calendar-cell { 
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05); 
          min-height: 60px; 
          transition: all 0.3s; 
        }
        @media (min-width: 768px) { .calendar-cell { min-height: 80px; border-radius: 12px; } }
        .calendar-cell:hover { background: rgba(255, 255, 255, 0.05); }
        .calendar-cell.selected { border: 1px solid #e6ccb2; background: rgba(230, 204, 178, 0.05); }

        .quest-card {
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .quest-card::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; opacity: 0.5;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(230, 204, 178, 0.2); border-radius: 10px; }
      `}</style>

      {/* HEADER: Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-6 border-b border-white/10 gap-6">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toISOString().split('T')[0]); }} className="btn-ghost-horizon w-10 h-10 flex items-center justify-center shrink-0">
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          <div className="text-center">
            <h1 className="text-[8px] md:text-[9px] pixel-font text-[#e6ccb2] mb-1 md:mb-2 tracking-[0.2em] md:tracking-[0.3em] uppercase">
              {viewMode === 'day' ? (selectedDate === today ? t('current_timeline') : t('archived_day')) : t('starmapping')}
            </h1>
            <p className="text-lg md:text-2xl font-light tracking-tight text-white">
              {new Date(selectedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toISOString().split('T')[0]); }} className="btn-ghost-horizon w-10 h-10 flex items-center justify-center shrink-0">
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={syncICS} className="btn-ghost-horizon flex-1 md:flex-none px-4 py-3 flex items-center justify-center gap-2">
            <i className={`fas fa-sync-alt text-xs ${loading ? 'animate-spin' : ''}`}></i>
            <span className="text-[10px] font-bold uppercase tracking-wider">{t('sync')}</span>
          </button>
          <button onClick={() => setViewMode(viewMode === 'day' ? 'month' : 'day')} className="btn-horizon flex-2 md:flex-none px-4 py-3 text-[10px] uppercase tracking-widest font-bold">
            {viewMode === 'day' ? t('grid_view') : t('open_log')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          {/* DEPLOYMENT MODULE */}
          <div className="glass-hud flex flex-col">
            <h3 className="text-[8px] pixel-font text-slate-500 mb-4 tracking-widest uppercase">{t('quick_deployment')}</h3>
            <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
              <button onClick={() => setDeployMode('event')} className={`flex-1 p-2 text-[7px] pixel-font rounded-lg transition-all ${deployMode === 'event' ? 'bg-[#e6ccb2] text-[#000d3d]' : 'text-slate-500'}`}>{t('uplink')}</button>
              <button onClick={() => setDeployMode('task')} className={`flex-1 p-2 text-[7px] pixel-font rounded-lg transition-all ${deployMode === 'task' ? 'bg-[#e6ccb2] text-[#000d3d]' : 'text-slate-500'}`}>{t('task')}</button>
            </div>
            <div className="space-y-3">
              <input type="text" placeholder={t('objective_name')} value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-horizon" />
              {deployMode === 'event' && <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="input-horizon" />}
              <button onClick={addTask} className="btn-horizon w-full text-[9px] pixel-font">{t('execute')}</button>
            </div>
          </div>

          {/* EXTERNAL LINKAGE */}
          <div className="glass-hud flex flex-col">
            <h3 className="text-[8px] pixel-font text-slate-700 mb-4 tracking-widest uppercase">{t('link_chronicle')}</h3>
            <input type="text" placeholder={t('ical_source_url')} value={icsUrlInput} onChange={e => setIcsUrlInput(e.target.value)} className="input-horizon mb-4" />
            <div className="flex flex-col items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${currentIcsUrl ? 'bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]' : 'bg-red-500'}`}></span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate">{currentIcsUrl ? t('bound') : t('offline')}</span>
              </div>
              <button onClick={updateIcsUrl} className="text-[9px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase shrink-0">{t('bind_source')}</button>
            </div>
          </div>
        </div>

        {/* LOG DISPLAY */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          {viewMode === 'month' ? (
            <div className="glass-hud p-3 md:p-6 w-full"> {/* added w-full here */}
              <div className="grid grid-cols-7 gap-1 md:gap-3 w-full"> {/* added w-full here */}
                {['S','M','T','W','T','F','S'].map((day, index) => (
                  <div key={`header-${index}`} className="text-center text-[7px] pixel-font text-slate-600 pb-2">
                    {day}
                  </div>
                ))}

                {(() => {
                  const firstDayOfMonth = new Date(selectedDate);
                  firstDayOfMonth.setDate(1);
                  const startDayIndex = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
          
                  return Array.from({ length: startDayIndex }).map((_, i) => (
                    <div key={`pad-${i}`} className="calendar-cell opacity-0 pointer-events-none" />
                  ));
                })()}
                
                {getDaysInMonth().map(date => {
                  const dayTasks = tasks.filter(t => t.task_date === date);
                  const isToday = date === today;
                  return (
                    <div 
                      key={date} 
                      onClick={() => { setSelectedDate(date); setViewMode('day'); }} 
                      className={`calendar-cell w-full p-1.5 md:p-3 cursor-pointer flex flex-col ${date === selectedDate ? 'selected' : ''}`}
                    > {/* added w-full to cell */}
                    <span className={`text-[10px] font-bold ${isToday ? 'text-[#e6ccb2]' : 'text-slate-500'}`}>
                      {date.split('-')[2]}
                    </span>
                    <div className="mt-auto flex flex-wrap gap-0.5 md:gap-1">
                      {dayTasks.slice(0,3).map(t => (
                        <div key={t.id} className={`h-1 w-1 md:h-1 md:w-full rounded-full ${t.start_time === '00:00:00' ? 'bg-white/10' : 'bg-[#e6ccb2]/40'}`}></div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
            <div className="space-y-6 md:space-y-8">
              {loading ? (
                <div className="text-center py-24 pixel-font text-slate-700 text-[9px] animate-pulse tracking-[0.5em]">{t('scanning')}</div>
              ) : filteredTasks.length === 0 ? (
                <div className="glass-hud flex flex-col items-center justify-center text-slate-500 py-16 md:py-20">
                  <i className="fas fa-ghost text-2xl mb-4 opacity-20"></i>
                  <p className="pixel-font text-[7px] uppercase tracking-widest opacity-40">{t('zero_missions')}</p>
                </div>
              ) : (
               categoryOrder.map(cat => {
                const catTasks = filteredTasks.filter(task => {
                  const hour = parseInt(task.start_time.split(':')[0]);
                  if (hour < 12) return t('morning_log') === cat;
                  if (hour < 17) return t('afternoon_log') === cat;
                  return t('evening_log') === cat;
                });
                if (!catTasks.length) return null;
                return (
                  <div key={cat} className="group/cat">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent"></div>
                      <h3 className="text-[7px] md:text-[8px] pixel-font text-slate-500 tracking-[0.2em] md:tracking-[0.3em] uppercase">{cat}</h3>
                      <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent"></div>
                    </div>
                    <div className="space-y-3">
                      {catTasks.map(task => {
                        const isFullyDone = task.sub_tasks?.length ? task.sub_tasks.every(st => st.done) : false;
                        const taskStyle = getTaskStyle(task);
                        return (
                          <div key={task.id} onClick={() => setSelectedQuest(task)} className={`group/item quest-card flex items-center justify-between p-4 md:p-5 cursor-pointer backdrop-blur-md ${taskStyle}`}>
                            <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                              {task.start_time === '00:00:00' ? (
                                <div onClick={(e) => e.stopPropagation()} className="flex items-center shrink-0">
                                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-lg border flex items-center justify-center transition-all ${isFullyDone ? 'bg-[#e6ccb2] border-[#e6ccb2]' : 'border-white/20'}`} onClick={() => toggleAllSubTasks(task)}>
                                    {isFullyDone && <i className="fas fa-check text-[#000d3d] text-[10px]"></i>}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] md:text-xs font-bold font-mono opacity-60 min-w-10 md:min-w-11.25 shrink-0">{task.start_time.slice(0, 5)}</span>
                              )}
                              <span className={`text-sm md:text-base font-semibold tracking-tight truncate ${isFullyDone ? 'line-through opacity-30' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="opacity-0 group-hover/item:opacity-100 text-slate-500 hover:text-red-400 transition-all p-2 shrink-0">
                              <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          )}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedQuest && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-3 md:p-4">
          <div className="absolute inset-0 bg-[#000d3d]/90 backdrop-blur-md md:backdrop-blur-xl" onClick={() => setSelectedQuest(null)} />
          <div className="glass-hud w-full max-w-xl relative shadow-2xl border-white/10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-[#e6ccb2] to-transparent"></div>
            
            <div className="flex gap-7 justify-between items-start mb-6 md:mb-8">
              <div className="overflow-hidden">
                <p className="text-[7px] pixel-font text-[#e6ccb2] mb-2 tracking-[0.2em]">{t('mission_intel')}</p>
                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight truncate">{selectedQuest.title}</h2>
              </div>
              <button onClick={() => setSelectedQuest(null)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors shrink-0">
                <i className="fas fa-times text-slate-400"></i>
              </button>
            </div>
            
            <div className="space-y-6 md:space-y-8 overflow-y-auto custom-scrollbar pr-1">
              <div>
                <h4 className="text-[8px] pixel-font text-slate-500 mb-4 tracking-[0.3em] uppercase">{t('milestones')}</h4>
                <div className="space-y-2 md:space-y-3">
                  {selectedQuest.sub_tasks?.map(st => (
                    <div key={st.id} className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-xl border border-white/5 group/milestone">
                      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                        <div onClick={() => toggleSubTask(selectedQuest.id, st.id, st.done)} className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all shrink-0 ${st.done ? 'bg-blue-400 border-blue-400' : 'border-white/20'}`}>
                          {st.done && <i className="fas fa-check text-[8px] text-[#000d3d]"></i>}
                        </div>
                        <span className={`text-sm font-medium truncate ${st.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{st.text}</span>
                      </div>
                      <button onClick={() => deleteSubTask(st.id)} className="opacity-0 group-hover/milestone:opacity-100 text-slate-600 hover:text-red-400 p-2 transition-all shrink-0">
                        <i className="fas fa-trash-alt text-[10px]"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <input type="text" placeholder="Add a milestone..." value={newSubTaskText} onChange={e => setNewSubTaskText(e.target.value)} className="input-horizon" onKeyDown={(e) => e.key === 'Enter' && addSubTask()} />
                  <button onClick={addSubTask} className="btn-horizon px-5 md:px-6 shrink-0">
                    <i className="fas fa-plus text-xs md:hidden"></i>
                    <span className="hidden md:inline">{t('add')}</span>
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-[8px] pixel-font text-slate-500 mb-4 tracking-[0.3em] uppercase">{t('mission_notes')}</h4>
                <textarea value={memoText} onChange={e => setMemoText(e.target.value)} className="input-horizon min-h-30 md:min-h-35 resize-none text-slate-300" placeholder={t('record_observations')} />
              </div>

              <div className="flex gap-4 pt-2 pb-2">
                <button onClick={saveMemos} className="btn-horizon flex-1 text-[9px] pixel-font">{t('commit_updates')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};