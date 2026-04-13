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
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    [TimerMode.POMODORO]: 25,
    [TimerMode.SHORT_BREAK]: 5,
    [TimerMode.LONG_BREAK]: 15,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. INITIAL LOAD & RE-ENTRY SYNC ---
  useEffect(() => {
    const initFocusRoom = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles')
        .select('pomodoro_settings, last_notes, timer_ends_at, timer_mode')
        .eq('id', user.id)
        .single();

      if (profile?.pomodoro_settings) setCustomSettings(profile.pomodoro_settings);
      if (profile?.last_notes) setNotes(profile.last_notes);
      
      if (profile?.timer_ends_at) {
        const end = new Date(profile.timer_ends_at).getTime();
        const now = Date.now();
        
        if (end > now) {
          // Timer is still alive in the DB! Reconstruct the state.
          setTargetTimestamp(profile.timer_ends_at);
          setMode(profile.timer_mode as TimerMode || TimerMode.POMODORO);
          setIsActive(true);
          setTimeLeft(Math.floor((end - now) / 1000));
        } else {
          // Timer expired while away
          await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', user.id);
          setIsActive(false);
        }
      }
    };
    initFocusRoom();
  }, [user]);

  // --- 2. TIMER ENGINE ---
  useEffect(() => {
    let interval: any = null;
    if (isActive && targetTimestamp) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((new Date(targetTimestamp).getTime() - Date.now()) / 1000));
        
        if (remaining <= 0) {
          clearInterval(interval);
          handleComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else if (!isActive) {
        // Keeps UI in sync with settings when idle
        setTimeLeft(customSettings[mode] * 60);
    }
    return () => clearInterval(interval);
  }, [isActive, targetTimestamp, mode, customSettings]);

  // --- 3. CORE ACTIONS ---
  const toggleTimer = async () => {
    if (isActive) {
      setIsActive(false);
      setTargetTimestamp(null);
      await supabase.from('profiles').update({ 
        timer_ends_at: null, 
        last_notes: notes 
      }).eq('id', user.id);
    } else {
      const mins = customSettings[mode];
      const endAt = new Date(Date.now() + mins * 60000).toISOString();
      
      setTargetTimestamp(endAt);
      setIsActive(true);
      
      await supabase.from('profiles').update({ 
        timer_ends_at: endAt, 
        timer_mode: mode 
      }).eq('id', user.id);
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    setTargetTimestamp(null);
    await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', user.id);
    
    if (mode === TimerMode.POMODORO) updateCoins(25);
    
    // Auto-switch modes
    setMode(mode === TimerMode.POMODORO ? TimerMode.SHORT_BREAK : TimerMode.POMODORO);
  };

  const handleManualTimeChange = async (val: string) => {
    if (isActive) return;
    const mins = val === '' ? 0 : Math.min(180, Math.max(1, parseInt(val) || 1));
    const newSettings = { ...customSettings, [mode]: mins };
    
    setCustomSettings(newSettings);

    // Save preference to DB as they change it
    await supabase.from('profiles')
      .update({ pomodoro_settings: newSettings })
      .eq('id', user.id);
  };

  const saveNotesToDB = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ last_notes: notes }).eq('id', user.id);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([`# SESSION JOURNAL - ${new Date().toLocaleDateString()}\n\n${notes}`], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `scribe_notes_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div ref={containerRef} className="game-ui-scope min-h-screen bg-[#0f1410] text-[#e0e7d8] flex items-center justify-center p-6 relative overflow-hidden">
      <style>{`
        .game-ui-scope *:not(i) { font-family: 'Press Start 2P', monospace !important; text-transform: uppercase; }
        .altar-box { background: #1a231b; padding: 40px; border: 8px double #4caf50; position: relative; z-index: 10; }
        .timer-input { background: transparent; border: none; text-align: center; color: #4caf50; outline: none; width: 100%; cursor: pointer; transition: 0.3s; }
        .timer-input:focus { color: #ffaa00; }
        .journal-sidebar { position: absolute; right: 0; top: 0; bottom: 0; width: 350px; background: #fffdf5; color: #3e2723; transform: translateX(${isJournalOpen ? '0' : '100%'}); transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); z-index: 100; border-left: 8px solid #3e2723; }
        .btn-pixel { background: #4caf50; padding: 12px; border: 4px solid #1b5e20; color: white; cursor: pointer; font-size: 8px; box-shadow: 4px 4px 0 0 #000; }
        .btn-pixel:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 #000; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'radial-gradient(#4caf50 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>

      {/* TOP HUD */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
        <div className="flex gap-4">
            <button onClick={() => setMode(TimerMode.POMODORO)} disabled={isActive} className={`btn-pixel ${mode === TimerMode.POMODORO ? 'bg-orange-600' : 'opacity-50'}`}>FOCUS</button>
            <button onClick={() => setMode(TimerMode.SHORT_BREAK)} disabled={isActive} className={`btn-pixel ${mode === TimerMode.SHORT_BREAK ? 'bg-blue-600' : 'opacity-50'}`}>BREAK</button>
        </div>
        <div className="flex gap-4">
            <button onClick={toggleFullscreen} className="btn-pixel bg-slate-700"><i className="fas fa-expand"></i></button>
            <button onClick={() => setIsJournalOpen(true)} className="btn-pixel bg-amber-700">JOURNAL</button>
        </div>
      </div>

      {/* MAIN ALTAR */}
      <div className="altar-box flex flex-col items-center max-w-2xl w-full">
        <p className="text-[#4caf50] text-[10px] mb-8 animate-pulse tracking-widest text-center">
          {isActive ? '--- QUEST IN PROGRESS ---' : '--- ADJUST YOUR FOCUS ---'}
        </p>

        <div className="w-full mb-10 flex justify-center items-center">
          {isActive ? (
            <h1 className="text-6xl md:text-8xl text-center text-[#ffaa00] tabular-nums tracking-tight">
              {Math.floor(timeLeft / 3600) > 0 ? `${Math.floor(timeLeft / 3600)}:` : ''}
              {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}:
              {(timeLeft % 60).toString().padStart(2, '0')}
            </h1>
          ) : (
          <div className="flex items-end justify-center gap-2">
              <input 
                  type="number" 
                  value={customSettings[mode] || ''}
                  onChange={(e) => handleManualTimeChange(e.target.value)}
                  className="timer-input text-6xl md:text-8xl"
                  placeholder="00"
              />
                <span className="text-xl text-[#4caf50] mb-4">MINS</span>
            </div>
          )}
        </div>

        <button onClick={toggleTimer} className="w-full btn-pixel !text-xl py-6 bg-[#4caf50] hover:bg-[#66bb6a]">
            {isActive ? 'ABORT QUEST' : 'BEGIN SESSION'}
        </button>
      </div>

      {/* SLIDE-OUT JOURNAL */}
      <div className="journal-sidebar flex flex-col p-6 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center border-b-4 border-[#3e2723] pb-4 mb-4">
            <h2 className="text-[12px] font-bold text-[#3e2723]">SCRIBE'S LOG</h2>
            <button onClick={() => { saveNotesToDB(); setIsJournalOpen(false); }} className="text-red-700 hover:scale-125 transition-transform">X</button>
          </div>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotesToDB}
            className="flex-1 bg-transparent resize-none outline-none border-2 border-dashed border-[#d7ccc8] p-4 text-[10px] leading-relaxed text-[#3e2723]"
            placeholder="Scribe your findings here..."
          />
          <button onClick={downloadNotes} className="btn-pixel bg-amber-800 mt-4 w-full">EXPORT .MD</button>
      </div>
      
      {/* HUD INFO */}
      <div className="absolute bottom-8 left-8 text-[6px] text-white/20 tracking-[4px]">
        STUDILIB_VOID_PROTOCOL // {user.username}
      </div>
    </div>
  );
};