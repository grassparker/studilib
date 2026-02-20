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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mode, setMode] = useState<TimerMode>(TimerMode.POMODORO);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const loadNotes = async () => {
      if (currentUser) {
        const { data } = await supabase.from('profiles').select('last_notes').eq('id', currentUser.id).single();
        if (data?.last_notes) setNotes(data.last_notes);
      }
    };
    loadNotes();
  }, [currentUser]);

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
    triggerPopup("QUEST_COMPLETE", "REWARDS_COLLECTED");
    
    const minutesSpent = mode === TimerMode.POMODORO ? 25 : (mode === TimerMode.SHORT_BREAK ? 5 : 15);

    if (currentUser) {
      await supabase.from('study_sessions').insert([{
        user_id: currentUser.id,
        time: minutesSpent,
        status: 'completed'
      }]);
    }

    if (mode === TimerMode.POMODORO) updateCoins(25);
    resetTimer(mode);
  };

  const resetTimer = (targetMode: TimerMode) => {
    setIsActive(false);
    if (targetMode === TimerMode.POMODORO) setTimeLeft(25 * 60);
    else if (targetMode === TimerMode.SHORT_BREAK) setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
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

  return (
    <div className="game-ui-scope flex flex-col lg:flex-row gap-8 min-h-full p-4 lg:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .game-ui-scope { image-rendering: pixelated; background: #F3F4F6; }
        .game-ui-scope * { font-family: 'Press Start 2P', cursive !important; text-transform: uppercase; }
        
        .menu-box {
          background: white;
          border: 4px solid black;
          box-shadow: 6px 6px 0 0 rgba(0,0,0,0.1);
          padding: 20px;
        }

        .timer-text {
          font-size: clamp(2rem, 12vw, 5rem);
          color: black;
          margin: 30px 0;
          text-align: center;
        }

        .progress-container {
          width: 100%;
          height: 24px;
          border: 4px solid black;
          background: #EEE;
        }

        .progress-fill {
          height: 100%;
          background: #ffaa00;
          transition: width 1s linear;
        }

        .btn-action {
          background: #ffaa00;
          border: 4px solid black;
          padding: 14px 24px;
          font-size: 10px;
          cursor: pointer;
          box-shadow: 4px 4px 0 0 black;
        }
        .btn-action:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 black; }

        .btn-reset {
          background: white;
          border: 4px solid black;
          padding: 12px;
          cursor: pointer;
        }

        .mode-btn {
          font-size: 7px;
          padding: 8px 10px;
          border-bottom: 4px solid transparent;
          color: #999;
        }
        .mode-btn.active { border-bottom: 4px solid #FBBF24; color: black; }

        .notes-input {
          width: 100%;
          min-height: 300px;
          border: 4px solid black;
          padding: 16px;
          font-size: 10px;
          line-height: 2;
          resize: none;
          outline: none;
        }
        
        .ui-label { font-size: 10px; text-decoration: underline; margin-bottom: 16px; display: block; }
      `}</style>

      {/* TIMER SECTION (Top on mobile, Left on Desktop) */}
      <div className="flex-1 menu-box flex flex-col items-center">
        <span className="ui-label self-start">QUEST_TIMER</span>
        
        <div className="progress-container mb-6">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[TimerMode.POMODORO, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); resetTimer(m); }}
              className={`mode-btn ${mode === m ? 'active' : ''}`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>

        <h1 className="timer-text tabular-nums">
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </h1>

        <div className="flex gap-4 mb-4">
          <button onClick={() => setIsActive(!isActive)} className="btn-action">
            {isActive ? 'HALT' : 'BEGIN'}
          </button>
          <button onClick={() => resetTimer(mode)} className="btn-reset">
            <i className="fas fa-undo"></i>
          </button>
        </div>
      </div>

      {/* NOTES SECTION (Bottom on mobile, Right on Desktop) */}
      <div className="w-full lg:w-[400px] menu-box flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="ui-label">QUEST_LOG</span>
          <button onClick={downloadNotes} className="text-[7px] text-gray-400">[EXPORT]</button>
        </div>

        <textarea
          value={notes}
          onChange={(e) => handleNoteChange(e.target.value)}
          placeholder="ENTER_INTEL..."
          className="notes-input flex-1"
        />
        
        <div className="mt-4 flex justify-between text-[7px] text-gray-400">
          <p>STATUS: ONLINE</p>
          <p>CHARS: {notes.length}</p>
        </div>
      </div>
    </div>
  );
};