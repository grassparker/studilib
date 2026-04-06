import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TimerMode } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import '../../index.css';

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

  // ---  MUSIC STATE & REF ---
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const LOFI_BEATS = [
    'https://luan.xyz/files/audio/ambient_c_motion.mp3'
  ];

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        const { data } = await supabase.from('profiles')
          .select('timer_ends_at, timer_mode, last_notes')
          .eq('id', session.user.id)
          .single();
        
        if (data?.last_notes) setNotes(data.last_notes);
        
        if (data?.timer_ends_at) {
          const end = new Date(data.timer_ends_at).getTime();
          const now = new Date().getTime();
          
          if (end > now) {
            setTargetTimestamp(data.timer_ends_at);
            setMode(data.timer_mode as TimerMode || TimerMode.POMODORO);
            setIsActive(true);
          } else {
            handleCompleteRetroactive(data.timer_mode as TimerMode || TimerMode.POMODORO, session.user.id);
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

    return () => {
      subscription.unsubscribe();
      // Stop music when leaving the room
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // ---  MUSIC TOGGLE FUNCTION ---
  const toggleMusic = () => {
    if (isMusicPlaying) {
      audioRef.current?.pause();
      setIsMusicPlaying(false);
    } else {
      const randomTrack = LOFI_BEATS[Math.floor(Math.random() * LOFI_BEATS.length)];

      if (!audioRef.current) {
        audioRef.current = new Audio(randomTrack);
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
      }

      const newAudio = new Audio(randomTrack);
      newAudio.loop = false;
      newAudio.volume = 0.5;

      newAudio.onended = () => {
        setIsMusicPlaying(false);
        toggleMusic(); // Play next track
      };

      audioRef.current = newAudio;
      audioRef.current.play().catch(err => {
        console.error("Error playing music:", err);
        setIsMusicPlaying(false);
      });
      setIsMusicPlaying(true);
    }
  };

  const handleCompleteRetroactive = async (completedMode: TimerMode, userId: string) => {
    const { data: prof } = await supabase.from('profiles').select('timer_ends_at').eq('id', userId).single();
    if (!prof?.timer_ends_at) return;
    const endTime = new Date(prof.timer_ends_at).getTime();
    const now = new Date().getTime();
    const minutesSinceFinished = (now - endTime) / 1000 / 60;

    await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', userId);
    const minutesSpent = completedMode === TimerMode.POMODORO ? 25 : (completedMode === TimerMode.SHORT_BREAK ? 5 : 15);
    await supabase.from('study_sessions').insert([{ user_id: userId, time: minutesSpent, status: 'completed' }]);

    if (completedMode === TimerMode.POMODORO && minutesSinceFinished < 30) {
      updateCoins(25);
    }

    const nextMode = completedMode === TimerMode.POMODORO ? TimerMode.SHORT_BREAK : TimerMode.POMODORO;
    setMode(nextMode);
    resetTimer(nextMode);
  };

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

    if (currentUser) {
      await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', currentUser.id);
      const minutesSpent = mode === TimerMode.POMODORO ? 25 : (mode === TimerMode.SHORT_BREAK ? 5 : 15);
      await supabase.from('study_sessions').insert([{ user_id: currentUser.id, time: minutesSpent, status: 'completed' }]);
      if (mode === TimerMode.POMODORO) updateCoins(25);
    }
    
    const nextMode = mode === TimerMode.POMODORO ? TimerMode.SHORT_BREAK : TimerMode.POMODORO;
    setMode(nextMode);
    resetTimer(nextMode);
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
      case TimerMode.POMODORO: return t('pomodoro');
      case TimerMode.SHORT_BREAK: return t('short_break');
      case TimerMode.LONG_BREAK: return t('long_break');
      default: return timerMode;
    }
  };

  return (
    <div className="game-ui-scope flex flex-col lg:flex-row gap-8 min-h-full p-4 lg:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
        .game-ui-scope { image-rendering: pixelated; }
        .game-ui-scope * { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace !important; text-transform: uppercase; }
        .menu-box { background: white; border: 4px solid black; box-shadow: 8px 8px 0 0 rgba(0,0,0,1); padding: 24px; }
        .timer-text { font-size: clamp(2rem, 10vw, 4.5rem); color: black; margin: 30px 0; text-align: center; letter-spacing: -2px; }
        .progress-container { width: 100%; height: 24px; border: 4px solid black; background: #EEE; position: relative; }
        .progress-fill { height: 100%; background: #FBBF24; transition: width 1s linear; }
        .btn-action { background: #FBBF24; border: 4px solid black; padding: 16px 32px; font-size: 10px; cursor: pointer; box-shadow: 4px 4px 0 0 black; }
        .btn-action:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 black; }
        .btn-reset { background: white; border: 4px solid black; padding: 12px; cursor: pointer; box-shadow: 4px 4px 0 0 black; }
        
        .btn-music { background: white; border: 4px solid black; padding: 12px; cursor: pointer; box-shadow: 4px 4px 0 0 black; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
        .btn-music:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 0 black; }
        .btn-music.playing { background: black; color: #FBBF24; }
        
        .mode-btn { font-size: 7px; padding: 10px; border-bottom: 4px solid transparent; color: #999; }
        .mode-btn.active { border-bottom: 4px solid #FBBF24; color: black; }
        .notes-input { width: 100%; min-height: 350px; border: 4px solid black; padding: 20px; font-size: 10px; line-height: 1.8; resize: none; outline: none; background: #FFF; }
        .ui-label { font-size: 10px; text-decoration: underline; margin-bottom: 20px; display: block; font-weight: bold; }
      `}</style>

      <div className="flex-1 menu-box flex flex-col items-center">
        <span className="ui-label self-start">{t('quest_timer')}</span>
        <div className="progress-container mb-8">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {[TimerMode.POMODORO, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK].map((m) => (
            <button key={m} onClick={() => { setMode(m); resetTimer(m); }} className={`mode-btn ${mode === m ? 'active' : ''}`} disabled={isActive}>
              {getModeLabel(m)}
            </button>
          ))}
        </div>
        <h1 className="timer-text tabular-nums">
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
        </h1>
        <div className="flex gap-4 mt-4 flex-wrap justify-center">
          <button onClick={toggleTimer} className="btn-action">{isActive ? t('halt') : t('begin')}</button>
          <button onClick={() => resetTimer(mode)} className="btn-reset">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="square">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          
          {/* --- NEW MUSIC BUTTON --- */}
          <button onClick={toggleMusic} className={`btn-music ${isMusicPlaying ? 'playing' : ''}`}>
            {isMusicPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="w-full lg:w-[450px] menu-box flex flex-col shadow-[8px_8px_0_0_#FBBF24]">
        <div className="flex justify-between items-center mb-6">
          <span className="ui-label">{t('quest_log')}</span>
          <button onClick={downloadNotes} className="text-[8px] hover:text-amber-600">[{t('export_data')}]</button>
        </div>
        <textarea value={notes} onChange={(e) => handleNoteChange(e.target.value)} placeholder={t('waiting_for_input')} className="notes-input flex-1" />
        <div className="mt-6 flex justify-between text-[7px] text-gray-400">
          <p>{t('connection_encrypted')}</p><p>{t('byte_count')}: {notes.length}</p>
        </div>
      </div>
    </div>
  );
};