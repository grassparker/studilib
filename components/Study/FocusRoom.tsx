import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mode, setMode] = useState<TimerMode>(TimerMode.POMODORO);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [notes, setNotes] = useState<string>('');
  const [targetTimestamp, setTargetTimestamp] = useState<string | null>(null);

  // 1. Initial Session & Data Load
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        const { data } = await supabase.from('profiles').select('timer_ends_at, timer_mode, last_notes').eq('id', session.user.id).single();
        
        if (data?.last_notes) setNotes(data.last_notes);
        
        // If there's an active timer in the DB, resume it
        if (data?.timer_ends_at) {
          const end = new Date(data.timer_ends_at).getTime();
          const now = new Date().getTime();
          if (end > now) {
            setTargetTimestamp(data.timer_ends_at);
            setMode(data.timer_mode as TimerMode || TimerMode.POMODORO);
            setIsActive(true);
          } else {
            // Timer expired while user was away
            await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', session.user.id);
          }
        }
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => subscription.unsubscribe();
  }, []);

  // 2. THE MASTER SYNC LOGIC
  useEffect(() => {
    let interval: any = null;

    const syncTimer = () => {
      if (!isActive || !targetTimestamp) return;

      const now = new Date().getTime();
      const end = new Date(targetTimestamp).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));

      if (remaining === 0) {
        handleComplete();
      } else {
        setTimeLeft(remaining);
      }
    };

    if (isActive) {
      syncTimer(); 
      interval = setInterval(syncTimer, 1000);
    }

    const handleVisibility = () => { if (document.visibilityState === 'visible') syncTimer(); };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isActive, targetTimestamp]);

  const toggleTimer = async () => {
    if (isActive) {
      setIsActive(false);
      setTargetTimestamp(null);
      if (currentUser) {
        await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', currentUser.id);
      }
    } else {
      const duration = mode === TimerMode.POMODORO ? 25 : mode === TimerMode.SHORT_BREAK ? 5 : 15;
      const endAt = new Date(Date.now() + duration * 60000).toISOString();
      setTargetTimestamp(endAt);
      setIsActive(true);
      if (currentUser) {
        await supabase.from('profiles').update({ timer_ends_at: endAt, timer_mode: mode }).eq('id', currentUser.id);
      }
    }
  };

  const handleComplete = async () => {
    setIsActive(false);
    setTargetTimestamp(null);
    
    triggerPopup(t('quest_complete'), t('rewards_collected'));

    const alertMessage = mode === TimerMode.POMODORO 
      ? t('quest_time')
      : t('break_over');
    
    if (currentUser) {
      await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', currentUser.id);
      const minutesSpent = mode === TimerMode.POMODORO ? 25 : (mode === TimerMode.SHORT_BREAK ? 5 : 15);
      await supabase.from('study_sessions').insert([{ user_id: currentUser.id, time: minutesSpent, status: 'completed' }]);
      if (mode === TimerMode.POMODORO) updateCoins(25);
    }
    
    if (mode === TimerMode.POMODORO) {
      setMode(TimerMode.SHORT_BREAK);
      resetTimer(TimerMode.SHORT_BREAK);
    } else {
      setMode(TimerMode.POMODORO);
      resetTimer(TimerMode.POMODORO);
    }
  };

  const resetTimer = (targetMode: TimerMode) => {
    setIsActive(false);
    setTargetTimestamp(null);
    const mins = targetMode === TimerMode.POMODORO ? 25 : targetMode === TimerMode.SHORT_BREAK ? 5 : 15;
    setTimeLeft(mins * 60);
  };

  const handleNoteChange = async (val: string) => {
    setNotes(val);
    if (currentUser) {
      await supabase.from('profiles').update({ last_notes: val }).eq('id', currentUser.id);
    }
  };

  const downloadNotes = () => {
    if (!notes.trim()) return;
    const date = new Date().toLocaleDateString();
    const fileContent = `# QUEST_LOG_${date}\n\n${notes}`;
    const blob = new Blob([fileContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log-${date.replace(/\//g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalTime = mode === TimerMode.POMODORO ? 25 * 60 : mode === TimerMode.SHORT_BREAK ? 5 * 60 : 15 * 60;
  const progressPercentage = ((totalTime - timeLeft) / totalTime) * 100;

  const getModeLabel = (timerMode: TimerMode) => {
    switch(timerMode) {
      case TimerMode.POMODORO:
        return t('pomodoro');
      case TimerMode.SHORT_BREAK:
        return t('short_break');
      case TimerMode.LONG_BREAK:
        return t('long_break');
      default:
        return timerMode;
    }
  };

  return (
    <div className="game-ui-scope flex flex-col lg:flex-row gap-8 min-h-full p-4 lg:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .game-ui-scope { image-rendering: pixelated; }
        .game-ui-scope * { font-family: 'Press Start 2P', cursive !important; text-transform: uppercase; }
        
        .menu-box {
          background: white;
          border: 4px solid black;
          box-shadow: 8px 8px 0 0 rgba(0,0,0,1);
          padding: 24px;
        }

        .timer-text {
          font-size: clamp(2rem, 10vw, 4.5rem);
          color: black;
          margin: 30px 0;
          text-align: center;
          letter-spacing: -2px;
        }

        .progress-container {
          width: 100%;
          height: 24px;
          border: 4px solid black;
          background: #EEE;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: #FBBF24;
          transition: width 1s linear;
        }

        .btn-action {
          background: #FBBF24;
          border: 4px solid black;
          padding: 16px 32px;
          font-size: 10px;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 black;
        }
        .btn-action:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 black; }
        .btn-action:disabled { background: #ccc; cursor: not-allowed; }

        .btn-reset {
          background: white;
          border: 4px solid black;
          padding: 12px;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 black;
        }
        .btn-reset:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 black; }

        .mode-btn {
          font-size: 7px;
          padding: 10px;
          border-bottom: 4px solid transparent;
          color: #999;
          transition: all 0.2s;
        }
        .mode-btn.active { border-bottom: 4px solid #FBBF24; color: black; }
        .mode-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .notes-input {
          width: 100%;
          min-height: 350px;
          border: 4px solid black;
          padding: 20px;
          font-size: 10px;
          line-height: 1.8;
          resize: none;
          outline: none;
          background: #FFF;
        }
        
        .ui-label { font-size: 10px; text-decoration: underline; margin-bottom: 20px; display: block; font-weight: bold; }
      `}</style>

      {/* TIMER SECTION */}
      <div className="flex-1 menu-box flex flex-col items-center">
        <span className="ui-label self-start">{t('quest_timer')}</span>
        
        <div className="progress-container mb-8">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[TimerMode.POMODORO, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); resetTimer(m); }}
              className={`mode-btn ${mode === m ? 'active' : ''}`}
              disabled={isActive}
            >
              {getModeLabel(m)}
            </button>
          ))}
        </div>

        <h1 className="timer-text tabular-nums">
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </h1>

        <div className="flex gap-6 mt-4">
          <button onClick={toggleTimer} className="btn-action">
            {isActive ? t('halt') : t('begin')}
          </button>
          <button onClick={() => resetTimer(mode)} className="btn-reset">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* NOTES SECTION */}
      <div className="w-full lg:w-[450px] menu-box flex flex-col shadow-[8px_8px_0_0_#FBBF24]">
        <div className="flex justify-between items-center mb-6">
          <span className="ui-label">{t('quest_log')}</span>
          <button onClick={downloadNotes} className="text-[8px] hover:text-amber-600 transition-colors">
            [{t('export_data')}]
          </button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder={t('waiting_for_input')}
          className="notes-input flex-1"
        />
        
        <div className="mt-6 flex justify-between text-[7px] text-gray-400 tracking-widest">
          <p>{t('connection_encrypted')}</p>
          <p>{t('byte_count')}: {notes.length}</p>
        </div>
      </div>
    </div>
  );
};