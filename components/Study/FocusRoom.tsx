import React, { useState, useEffect } from 'react';
import { TimerMode } from '../../types';
import { supabase } from '../Auth/supabaseClient';

interface FocusRoomProps {
  updateCoins: (amount: number) => void;
}

const triggerPopup = (title: string, body: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/2997/2997300.png' });
  }
};

export const FocusRoom: React.FC<FocusRoomProps> = ({ updateCoins }) => {
  // --- TIMER STATE ---
  const [mode, setMode] = useState<TimerMode>(TimerMode.POMODORO);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  
  // --- NOTES STATE ---
  const [notes, setNotes] = useState<string>('');

  // 1. Initial Setup: Permissions & Load Notes
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const loadNotes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('last_notes')
          .eq('id', user.id)
          .single();
        if (data?.last_notes) setNotes(data.last_notes);
      }
    };
    loadNotes();
  }, []);

  // 2. Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = async () => {
    setIsActive(false);
    triggerPopup("Session Complete!", "Great job focusing!");
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.from('study_sessions').insert([{
        user_id: session.user.id,
        time: mode === TimerMode.POMODORO ? 25 : (mode === TimerMode.SHORT_BREAK ? 5 : 15),
        status: 'completed'
      }]);
    }

    updateCoins(mode === TimerMode.POMODORO ? 10 : 2);
    resetTimer(mode);
  };

  const resetTimer = (targetMode: TimerMode) => {
    setIsActive(false);
    if (targetMode === TimerMode.POMODORO) setTimeLeft(25 * 60);
    else if (targetMode === TimerMode.SHORT_BREAK) setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  // 3. Notes Functions
  const handleNoteChange = async (val: string) => {
    setNotes(val);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Auto-save to DB
      await supabase.from('profiles').update({ last_notes: val }).eq('id', user.id);
    }
  };

  const downloadNotes = () => {
    if (!notes.trim()) return alert("Notes are empty!");
    
    const date = new Date().toLocaleDateString();
    const fileContent = `# Study Session Notes - ${date}\n\n${notes}`;
    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-notes-${date.replace(/\//g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const progressPercentage = (timeLeft / (mode === TimerMode.POMODORO ? 25 * 60 : mode === TimerMode.SHORT_BREAK ? 5 * 60 : 15 * 60)) * 100;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full">
      {/* TIMER CARD */}
      <div className="flex-1 bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
          <div className="h-full bg-amber-500 transition-all duration-1000 ease-linear" style={{ width: `${progressPercentage}%` }} />
        </div>

        <div className="flex gap-4 mb-12 bg-slate-50 p-1.5 rounded-full">
          {[TimerMode.POMODORO, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); resetTimer(m); }}
              className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                mode === m ? 'bg-white shadow-sm text-amber-600' : 'text-slate-400 hover:text-amber-600'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>

        <h1 className="text-9xl font-black text-slate-800 tracking-tighter mb-12 tabular-nums">
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </h1>

        <div className="flex gap-6">
          <button onClick={() => setIsActive(!isActive)} className={`px-12 py-4 rounded-2xl font-bold text-white transition-all active:scale-95 ${isActive ? 'bg-slate-800' : 'bg-amber-600 shadow-lg shadow-amber-200'}`}>
            {isActive ? 'Pause' : 'Start Focus'}
          </button>
          <button onClick={() => resetTimer(mode)} className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 hover:text-amber-600 border border-slate-100 flex items-center justify-center">
            <i className="fas fa-undo"></i>
          </button>
        </div>
      </div>

      {/* NOTES SIDEBAR */}
      <div className="w-full lg:w-96 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col h-[500px] lg:h-auto">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-slate-800">Focus Notes</h3>
          <button 
            onClick={downloadNotes}
            className="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-100 transition-colors flex items-center gap-2"
          >
            <i className="fas fa-download"></i>
            Export .md
          </button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="What are we smashing today?"
          className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none placeholder:text-slate-400"
        />
        <p className="text-[10px] text-slate-400 mt-3 px-2 italic">Notes auto-save to your profile.</p>
      </div>
    </div>
  );
};