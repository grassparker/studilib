import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TimerMode, User } from '../../types';
import { supabase } from '../Auth/supabaseClient';

interface FocusRoomProps {
  user: User;
  updateCoins: (amount: number) => void;
}

export const FocusRoom: React.FC<FocusRoomProps> = ({ user, updateCoins }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<TimerMode>(TimerMode.POMODORO);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [targetTimestamp, setTargetTimestamp] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  // --- TASK & OBJECTIVE STATE ---
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskSelectorOpen, setIsTaskSelectorOpen] = useState(false);

  // --- MUSIC STATE ---
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const initFocusRoom = async () => {
      if (!user) return;

      const { data: profile } = await supabase.from('profiles')
        .select('timer_ends_at, timer_mode, last_notes')
        .eq('id', user.id)
        .single();
      
      if (profile?.last_notes) setNotes(profile.last_notes);
      
      const { data: sessionData } = await supabase.from('study_sessions').select('*').eq('user_id', user.id).neq('status', 'completed');
      const { data: scheduleData } = await supabase.from('schedules').select('*').eq('user_id', user.id).eq('task_date', new Date().toISOString().split('T')[0]);

      setTasks([
        ...(sessionData || []).map(s => ({ ...s, displayTitle: s.title || 'STUDY SESSION', source: 'SESSION' })),
        ...(scheduleData || []).map(sc => ({ ...sc, displayTitle: sc.title, source: 'EVENT' }))
      ]);

      if (profile?.timer_ends_at) {
        const end = new Date(profile.timer_ends_at).getTime();
        if (end > Date.now()) {
          setTargetTimestamp(profile.timer_ends_at);
          setMode(profile.timer_mode as TimerMode || TimerMode.POMODORO);
          setIsActive(true);
        }
      }
    };
    initFocusRoom();
  }, [user]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && targetTimestamp) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(targetTimestamp).getTime() - Date.now()) / 1000));
        if (remaining === 0) handleComplete();
        else setTimeLeft(remaining);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, targetTimestamp]);

  const toggleTimer = async () => {
    if (isActive) {
      setIsActive(false);
      setTargetTimestamp(null);
      await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', user.id);
    } else {
      const mins = mode === TimerMode.POMODORO ? 25 : mode === TimerMode.SHORT_BREAK ? 5 : 15;
      const endAt = new Date(Date.now() + mins * 60000).toISOString();
      setTargetTimestamp(endAt);
      setIsActive(true);
      await supabase.from('profiles').update({ timer_ends_at: endAt, timer_mode: mode }).eq('id', user.id);
    }
  };

  const resetTimer = (targetMode: TimerMode) => {
    setIsActive(false);
    setTargetTimestamp(null);
    setMode(targetMode);
    const mins = targetMode === TimerMode.POMODORO ? 25 : targetMode === TimerMode.SHORT_BREAK ? 5 : 15;
    setTimeLeft(mins * 60);
  };

  const handleComplete = async () => {
    setIsActive(false);
    setTargetTimestamp(null);
    await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', user.id);
    if (mode === TimerMode.POMODORO) updateCoins(25);
    resetTimer(mode === TimerMode.POMODORO ? TimerMode.SHORT_BREAK : TimerMode.POMODORO);
  };

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([`# SESSION NOTES - ${new Date().toLocaleDateString()}\n\n${notes}`], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `quest_log_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
  };

  const activeTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="game-ui-scope flex flex-col lg:flex-row gap-8 p-4 lg:p-8 bg-[#f1f8e9]">
      <style>{`
        .game-ui-scope *:not(i) { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace !important; text-transform: uppercase; }
        .menu-box-nature { background: #fffdf5; border: 4px solid #3e2723; box-shadow: 8px 8px 0 0 #2a1b0a; padding: 24px; }
        .btn-nature { background: #4caf50; color: white; border: 4px solid #1b5e20; padding: 12px; font-size: 8px; box-shadow: 4px 4px 0 0 #1b262a; cursor: pointer; }
        .btn-stone { background: #78909c; border: 4px solid #37474f; padding: 12px; color: white; box-shadow: 4px 4px 0 0 #1b262a; cursor: pointer; }
        .btn-scroll { background: #d7ccc8; border: 4px solid #5d4037; padding: 8px; color: #3e2723; font-size: 7px; cursor: pointer; }
        .task-sel { width: 100%; border: 4px solid #3e2723; background: #fdf4db; padding: 10px; cursor: pointer; font-size: 9px; }
        .mode-btn { padding: 8px; font-size: 6px; border: 2px solid #3e2723; background: white; cursor: pointer; flex: 1; }
        .mode-btn.active { background: #3e2723; color: #ffaa00; }
      `}</style>

      {/* LEFT: TIMER ALTAR */}
      <div className="flex-1 menu-box-nature flex flex-col items-center">
        <div className="w-full relative mb-6">
          <p className="text-[7px] mb-2 text-[#8d6e63]">CURRENT OBJECTIVE</p>
          <div className="task-sel flex justify-between items-center" onClick={() => !isActive && setIsTaskSelectorOpen(!isTaskSelectorOpen)}>
            <span className="truncate">{activeTask ? activeTask.displayTitle : 'FREE FOCUS MODE'}</span>
            <i className={`fas fa-chevron-${isTaskSelectorOpen ? 'up' : 'down'}`}></i>
          </div>
          {isTaskSelectorOpen && !isActive && (
            <div className="absolute top-full left-0 w-full bg-white border-4 border-[#3e2723] z-50 max-h-40 overflow-y-auto shadow-xl">
              <div className="p-2 text-[7px] border-b hover:bg-green-100 cursor-pointer" onClick={() => { setSelectedTaskId(null); setIsTaskSelectorOpen(false); }}>-- FREE FOCUS --</div>
              {tasks.map(t => (
                <div key={t.id} className="p-2 text-[7px] border-b hover:bg-green-100 flex justify-between cursor-pointer" onClick={() => { setSelectedTaskId(t.id); setIsTaskSelectorOpen(false); }}>
                  <span>{t.displayTitle}</span><span className="opacity-40">{t.source}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex w-full gap-2 mb-8">
          <button onClick={() => resetTimer(TimerMode.POMODORO)} disabled={isActive} className={`mode-btn ${mode === TimerMode.POMODORO ? 'active' : ''}`}>FOCUS</button>
          <button onClick={() => resetTimer(TimerMode.SHORT_BREAK)} disabled={isActive} className={`mode-btn ${mode === TimerMode.SHORT_BREAK ? 'active' : ''}`}>SHORT BREAK</button>
          <button onClick={() => resetTimer(TimerMode.LONG_BREAK)} disabled={isActive} className={`mode-btn ${mode === TimerMode.LONG_BREAK ? 'active' : ''}`}>LONG BREAK</button>
        </div>

        <h1 className="text-5xl md:text-7xl mb-10 tabular-nums text-[#3e2723] tracking-tighter">
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </h1>

        <div className="flex gap-4">
          <button onClick={toggleTimer} className="btn-nature px-12 text-[10px]">
            <i className={`fas ${isActive ? 'fa-pause' : 'fa-play'} mr-2`}></i>
            {isActive ? 'HALT' : 'BEGIN'}
          </button>
          <button onClick={() => resetTimer(mode)} className="btn-stone"><i className="fas fa-undo"></i></button>
        </div>
      </div>

      {/* RIGHT: JOURNAL */}
      <div className="w-full lg:w-[400px] menu-box-nature flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b-2 border-[#3e2723] pb-2">
          <p className="text-[8px] font-bold">SESSION JOURNAL</p>
          <button onClick={downloadNotes} className="btn-scroll">
            <i className="fas fa-file-download mr-1"></i> EXPORT .MD
          </button>
        </div>
        <textarea 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scribe your findings here, traveler..."
          className="w-full h-[350px] lg:flex-1 border-2 border-[#d7ccc8] p-4 bg-[#fffdf5] resize-none outline-none text-[9px] leading-loose shadow-inner" 
        />
        <p className="text-[6px] mt-2 opacity-50">Notes will be saved locally as a Markdown scroll.</p>
      </div>
    </div>
  );
};