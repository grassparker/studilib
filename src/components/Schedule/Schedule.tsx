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
}

export const Schedule: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();

  // --- STATE ---
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'day'>('day');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedQuest, setSelectedQuest] = useState<ScheduledTask | null>(null);

  // --- FORM STATE ---
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newSubTaskText, setNewSubTaskText] = useState('');
  const [memoText, setMemoText] = useState('');

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const categoryOrder = [t('morning_log'), t('afternoon_log'), t('evening_log')];

  // --- FETCH LOGIC ---
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .order('task_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (data) setTasks(data);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  useEffect(() => {
    if (selectedQuest) setMemoText(selectedQuest.memos || '');
  }, [selectedQuest]);

  // --- ACTIONS ---
  const addTask = async () => {
    if (!newTitle.trim()) return;
    const { data } = await supabase.from('schedules').insert([{
      user_id: user.id,
      title: newTitle.toUpperCase(),
      start_time: `${newTime}:00`,
      task_date: selectedDate,
      task_type: 'task',
      duration_min: 25,
      sub_tasks: []
    }]).select();

    if (data) {
      setTasks(prev => [...prev, data[0]].sort((a, b) => (a.task_date + a.start_time).localeCompare(b.task_date + b.start_time)));
      setNewTitle('');
    }
  };

  const updateQuestDetails = async () => {
    if (!selectedQuest) return;
    const { error } = await supabase
      .from('schedules')
      .update({ memos: memoText, sub_tasks: selectedQuest.sub_tasks })
      .eq('id', selectedQuest.id);

    if (!error) {
      setTasks(prev => prev.map(t => t.id === selectedQuest.id ? { ...t, memos: memoText, sub_tasks: selectedQuest.sub_tasks } : t));
      setSelectedQuest(null);
    }
  };

  const toggleSubTask = (subTaskId: string) => {
    if (!selectedQuest) return;
    const updatedSubTasks = (selectedQuest.sub_tasks || []).map(st => 
      st.id === subTaskId ? { ...st, done: !st.done } : st
    );
    setSelectedQuest({ ...selectedQuest, sub_tasks: updatedSubTasks });
  };

  const addSubTask = () => {
    if (!newSubTaskText.trim() || !selectedQuest) return;
    const newST: SubTask = { id: crypto.randomUUID(), text: newSubTaskText.toUpperCase(), done: false };
    setSelectedQuest({ ...selectedQuest, sub_tasks: [...(selectedQuest.sub_tasks || []), newST] });
    setNewSubTaskText('');
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- HELPERS ---
  const getTaskAtHour = (hour: number) => tasks.find(t => parseInt(t.start_time.split(':')[0]) === hour && t.task_date === selectedDate);
  const getDetailedCategory = (task: ScheduledTask) => {
    const hour = parseInt(task.start_time.split(':')[0]);
    if (hour < 12) return t('morning_log');
    if (hour < 17) return t('afternoon_log');
    return t('evening_log');
  };
  const filteredTasks = tasks.filter(t => t.task_date === selectedDate);

  // Generate Calendar Days
  const getDaysInMonth = () => {
    const now = new Date(selectedDate);
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(year, month, i + 1);
      return d.toISOString().split('T')[0];
    });
  };

  return (
    <div className="schedule-scope space-y-8 p-4 max-w-4xl mx-auto pb-32 text-[#3e2723]">
      <style>{`
        .schedule-scope *:not(i) { font-family: 'Press Start 2P', 'LXGW WenKai TC' , monospace !important; text-transform: uppercase; }
        .ledger-panel-wood { background: #fffdf5; border: 4px solid #3e2723; box-shadow: 8px 8px 0 0 #2a1b0a; padding: 24px; position: relative; }
        .nature-input-field { background: #fdfbf7; border: 4px solid #5d4037; padding: 12px; font-size: 8px; width: 100%; color: #3e2723; outline: none; }
        .action-btn-wood { background: #8d6e63; color: white; border: 4px solid #3e2723; font-size: 10px; padding: 12px 24px; cursor: pointer; box-shadow: 4px 4px 0 0 #2a1b0a; display: flex; align-items: center; gap: 8px; }
        .ui-label-nature { font-size: 10px; border-bottom: 4px solid #4caf50; padding-bottom: 6px; margin-bottom: 20px; display: inline-flex; align-items: center; gap: 10px; font-weight: bold; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .calendar-day { border: 2px solid #3e2723; height: 80px; padding: 4px; background: white; cursor: pointer; position: relative; }
        .calendar-day.active { background: #ffaa00; }
        .calendar-day.today { border-color: #4caf50; border-width: 4px; }
      `}</style>

      {/* 1. NAVIGATION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="action-btn-wood !px-4"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <h2 className="text-[10px] bg-[#fffdf5] border-4 border-[#3e2723] px-6 py-2 shadow-[4px_4px_0_0_#2a1b0a]">
            {selectedDate === new Date().toISOString().split('T')[0] ? 'TODAY' : selectedDate}
          </h2>

          <button 
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="action-btn-wood !px-4"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <button 
          onClick={() => setViewMode(viewMode === 'day' ? 'month' : 'day')} 
          className="action-btn-wood !bg-[#3e2723]"
        >
          <i className={`fas ${viewMode === 'day' ? 'fa-map' : 'fa-calendar-day'}`}></i>
          {viewMode === 'day' ? 'WORLD MAP' : 'DAILY PATH'}
        </button>
      </div>

      {viewMode === 'month' ? (
        /* 2. WORLD MAP (CALENDAR VIEW) */
        <div className="ledger-panel-wood animate-quest-pop">
          <h3 className="ui-label-nature">CHRONICLE MAP</h3>
          <div className="calendar-grid">
            {['S','M','T','W','T','F','S'].map(d => (
              <div key={d} className="text-center text-[8px] font-bold mb-2">{d}</div>
            ))}
            {getDaysInMonth().map(date => {
              const taskCount = tasks.filter(t => t.task_date === date).length;
              return (
                <div 
                  key={date} 
                  onClick={() => { setSelectedDate(date); setViewMode('day'); }}
                  className={`calendar-day ${date === selectedDate ? 'active' : ''} ${date === new Date().toISOString().split('T')[0] ? 'today' : ''}`}
                >
                  <span className="text-[8px]">{date.split('-')[2]}</span>
                  {taskCount > 0 && (
                    <div className="absolute bottom-1 right-1 flex gap-1">
                      <div className="w-2 h-2 bg-[#3e2723] rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3. DAILY VIEW */
        <div className="space-y-8 animate-quest-pop">
          {/* ADD QUEST */}
          <div className="ledger-panel-wood">
            <h3 className="ui-label-nature">POST A QUEST</h3>
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="OBJECTIVE..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="nature-input-field" />
              <div className="flex gap-4">
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="nature-input-field flex-1" />
                <button onClick={addTask} className="action-btn-wood">DEPLOY</button>
              </div>
            </div>
          </div>

          {/* PATH VIEW (The Mini-Timeline) */}
          <div className="ledger-panel-wood">
            <h3 className="ui-label-nature">THE DAY'S PATH</h3>
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {hours.map(h => {
                const t = getTaskAtHour(h);
                return (
                  <div key={h} className={`h-12 border-2 flex flex-col items-center justify-center transition-all ${t ? 'bg-[#ffaa00] border-[#3e2723] scale-105 shadow-[2px_2px_0_0_#2a1b0a]' : 'bg-white opacity-30 border-dashed border-[#d7ccc8]'}`}>
                    <span className="text-[5px]">{h}:00</span>
                    {t && <i className="fas fa-exclamation-circle text-[8px]"></i>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* QUEST LOG */}
          <div className="ledger-panel-wood min-h-[300px]">
            {categoryOrder.map(cat => {
              const catTasks = filteredTasks.filter(t => getDetailedCategory(t) === cat);
              if (!catTasks.length) return null;
              return (
                <section key={cat} className="mb-8">
                  <h3 className="ui-label-nature">{cat}</h3>
                  {catTasks.map(task => (
                    <div key={task.id} onClick={() => setSelectedQuest(task)} className="border-4 border-[#3e2723] bg-white mb-3 p-4 flex justify-between items-center hover:translate-x-1 transition-transform cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-4">
                        <span className="text-[8px] bg-[#efebe9] p-1 border-2 border-[#3e2723]">{task.start_time.slice(0, 5)}</span>
                        <span className="text-[9px] font-bold">{task.title}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }} className="text-red-700 p-2">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))}
                </section>
              );
            })}
            {filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <i className="fas fa-scroll text-4xl mb-4"></i>
                <p className="text-[8px]">No quests logged for this date.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. QUEST DETAIL MODAL (Subtasks & Notes) */}
      {selectedQuest && (
        <div className="modal-overlay px-4">
          <div className="ledger-panel-wood w-full max-w-lg max-h-[90vh] overflow-y-auto animate-quest-pop shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-start border-b-4 border-[#3e2723] pb-4 mb-6">
              <div>
                <h2 className="text-[12px] font-bold">{selectedQuest.title}</h2>
                <p className="text-[7px] mt-2 opacity-60">TIME: {selectedQuest.start_time.slice(0, 5)}</p>
              </div>
              <button onClick={() => setSelectedQuest(null)}><i className="fas fa-times text-xl"></i></button>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="ui-label-nature !text-[8px]">SUB-OBJECTIVES</h4>
                <div className="space-y-2">
                  {(selectedQuest.sub_tasks || []).map(st => (
                    <div key={st.id} className="flex items-center gap-3 p-2 border-2 bg-white">
                      <input type="checkbox" checked={st.done} onChange={() => toggleSubTask(st.id)} className="w-4 h-4" />
                      <span className={`text-[8px] ${st.done ? 'line-through opacity-50' : ''}`}>{st.text}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-4">
                    <input type="text" placeholder="ADD..." value={newSubTaskText} onChange={e => setNewSubTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubTask()} className="nature-input-field flex-1" />
                    <button onClick={addSubTask} className="action-btn-wood !py-0"><i className="fas fa-plus"></i></button>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="ui-label-nature !text-[8px]">MEMOS</h4>
                <textarea value={memoText} onChange={e => setMemoText(e.target.value)} className="nature-input-field min-h-[100px]" />
              </section>

              <div className="flex gap-4">
                <button onClick={updateQuestDetails} className="action-btn-wood flex-1 !bg-[#4caf50]">SAVE LOG</button>
                <button onClick={() => setSelectedQuest(null)} className="action-btn-wood flex-1">BACK</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};