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

  // ... (Keep existing useEffect logic for initial sync and timer logic)
  useEffect(() => {
    const initFocusRoom = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from('profiles')
        .select('pomodoro_settings, last_notes, timer_ends_at, timer_mode')
        .eq('id', user.id).single();

      if (profile?.pomodoro_settings) setCustomSettings(profile.pomodoro_settings);
      if (profile?.last_notes) setNotes(profile.last_notes);
      
      if (profile?.timer_ends_at) {
        const end = new Date(profile.timer_ends_at).getTime();
        const now = Date.now();
        if (end > now) {
          setTargetTimestamp(profile.timer_ends_at);
          setMode(profile.timer_mode as TimerMode || TimerMode.POMODORO);
          setIsActive(true);
          setTimeLeft(Math.floor((end - now) / 1000));
        } else {
          await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', user.id);
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
        if (remaining <= 0) {
          clearInterval(interval);
          handleComplete();
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    } else if (!isActive) {
        setTimeLeft(customSettings[mode] * 60);
    }
    return () => clearInterval(interval);
  }, [isActive, targetTimestamp, mode, customSettings]);

  const toggleTimer = async () => {
    if (isActive) {
      const sessionDuration = customSettings[mode] - Math.floor(timeLeft / 60);
      await supabase.from('study_sessions').insert({ user_id: user.id, time: sessionDuration, status: 'aborted' });
      setIsActive(false);
      setTargetTimestamp(null);
      await supabase.from('profiles').update({ timer_ends_at: null, last_notes: notes }).eq('id', user.id);
    } else {
      const mins = customSettings[mode];
      const endAt = new Date(Date.now() + mins * 60000).toISOString();
      setTargetTimestamp(endAt);
      setIsActive(true);
      await supabase.from('profiles').update({ timer_ends_at: endAt, timer_mode: mode }).eq('id', user.id);
    }
  };

  const handleComplete = async () => {
    await supabase.from('study_sessions').insert({ user_id: user.id, time: customSettings[mode], status: 'completed' });
    setIsActive(false);
    setTargetTimestamp(null);
    await supabase.from('profiles').update({ timer_ends_at: null }).eq('id', user.id);
    if (mode === TimerMode.POMODORO) updateCoins(25);
    setMode(mode === TimerMode.POMODORO ? TimerMode.SHORT_BREAK : TimerMode.POMODORO);
  };

  const handleManualTimeChange = async (val: string) => {
    if (isActive) return;
    const mins = val === '' ? 0 : Math.min(180, Math.max(1, parseInt(val) || 1));
    const newSettings = { ...customSettings, [mode]: mins };
    setCustomSettings(newSettings);
    await supabase.from('profiles').update({ pomodoro_settings: newSettings }).eq('id', user.id);
  };

  const saveNotesToDB = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ last_notes: notes }).eq('id', user.id);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const downloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([`# SESSION JOURNAL - ${new Date().toLocaleDateString()}\n\n${notes}`], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `focus_notes_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
  };

  const totalSeconds = customSettings[mode] * 60;
  const progressPercent = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div ref={containerRef} className="focus-room-scope min-h-screen bg-[#000d3d] text-[#e6ccb2] flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;700&display=swap');
        
        .tech-font { font-family: 'Inter', sans-serif; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }

        .bg-gradient-mesh {
          background-color: #000d3d;
          background-image: 
            radial-gradient(at 0% 0%, #1a478a 0px, transparent 50%),
            radial-gradient(at 100% 100%, #7a98b9 0px, transparent 50%),
            radial-gradient(at 50% 100%, #e6ccb2 0px, transparent 50%);
          filter: blur(80px);
          transform: scale(1.5);
        }

        .glass-altar {
          background: rgba(0, 13, 61, 0.6);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(230, 204, 178, 0.15);
          border-radius: 60px;
          box-shadow: 0 40px 100px -20px rgba(0, 0, 0, 0.6);
          position: relative;
          z-index: 5;
        }

        .timer-glow-active {
          filter: drop-shadow(0 0 30px #7a98b9);
        }

        .journal-drawer {
          position: fixed;
          background: rgba(0, 13, 61, 0.95);
          backdrop-filter: blur(30px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100;
          border-color: rgba(230, 204, 178, 0.1);
        }

        @media (max-width: 1024px) {
          .journal-drawer {
            bottom: 0; left: 0; right: 0; height: 80vh;
            border-top: 1px solid #7a98b9;
            transform: translateY(${isJournalOpen ? '0' : '100%'});
            border-radius: 40px 40px 0 0;
          }
        }
        @media (min-width: 1025px) {
          .journal-drawer {
            right: 0; top: 0; bottom: 0; width: 450px;
            border-left: 1px solid #7a98b9;
            transform: translateX(${isJournalOpen ? '0' : '100%'});
          }
        }

        .btn-nav {
          background: rgba(230, 204, 178, 0.05);
          border: 1px solid rgba(230, 204, 178, 0.1);
          padding: 8px 24px;
          border-radius: 100px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #7a98b9;
        }
        .btn-nav:hover:not(:disabled) { background: rgba(230, 204, 178, 0.15); color: #e6ccb2; }
        .btn-nav.active { background: #e6ccb2; color: #000d3d; border-color: #e6ccb2; font-weight: 600; }

        .orb-main {
          width: 240px;
          height: 64px;
          border-radius: 100px;
          font-weight: 600;
          letter-spacing: 3px;
          transition: all 0.5s;
          text-transform: uppercase;
        }
        .orb-main.start { background: #e6ccb2; color: #000d3d; box-shadow: 0 15px 30px -10px rgba(230, 204, 178, 0.4); }
        .orb-main.stop { background: transparent; color: #e6ccb2; border: 1.5px solid #e6ccb2; }
        .orb-main:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -10px rgba(230, 204, 178, 0.5); }

        .time-text {
          font-variant-numeric: tabular-nums;
          font-weight: 200;
          letter-spacing: -4px;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
      
      {/* NAV CONTROLS */}
      <div className="absolute top-10 left-10 right-10 flex flex-col md:flex-row justify-between items-center gap-6 z-20">
        <div className="flex gap-2 bg-[#000d3d]/40 p-2 rounded-full border border-[#e6ccb2]/10 backdrop-blur-xl">
            <button onClick={() => setMode(TimerMode.POMODORO)} disabled={isActive} className={`btn-nav ${mode === TimerMode.POMODORO ? 'active' : ''}`}>{t('focus')}</button>
            <button onClick={() => setMode(TimerMode.SHORT_BREAK)} disabled={isActive} className={`btn-nav ${mode === TimerMode.SHORT_BREAK ? 'active' : ''}`}>{t('break')}</button>
        </div>
        
        <div className="flex gap-4">
            <button onClick={toggleFullscreen} className="btn-nav !p-3 aspect-square flex items-center justify-center"><i className="fas fa-expand-alt"></i></button>
            <button onClick={() => setIsJournalOpen(true)} className="btn-nav !bg-[#e6ccb2]/10 !text-[#e6ccb2] border-[#e6ccb2]/30 flex items-center gap-3 px-8">
                <i className="fas fa-feather-alt text-xs"></i>
                <span className="font-bold tracking-[0.2em]">{t('journal')}</span>
            </button>
        </div>
      </div>

      {/* MAIN ALTAR */}
      <div className="glass-altar w-full max-w-[500px] h-[550px] flex flex-col items-center justify-center p-12 overflow-hidden">
        {/* PROGRESS RING */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-12">
          <circle cx="50%" cy="50%" r="42%" fill="none" stroke="rgba(230,204,178,0.03)" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="42%" fill="none" 
                  stroke="#e6ccb2" 
                  strokeWidth="2" 
                  strokeDasharray="264%"
                  strokeDashoffset={`${264 - (progressPercent * 2.64)}%`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear opacity-20" />
        </svg>

        <div className="text-center z-10 flex flex-col items-center">
            <div className={`mono-text mb-10 tracking-[0.4em] uppercase transition-colors ${isActive ? 'text-[#e6ccb2]' : 'text-[#7a98b9]'}`}>
                {isActive ? t('✦ Protocol Active') : t('✧ System Standby')}
            </div>

            <div className={`mb-12 ${isActive ? 'timer-glow-active' : ''}`}>
              {isActive ? (
                <div className="time-text text-[110px] leading-none text-[#e6ccb2]">
                  {Math.floor((timeLeft % 3600) / 60).toString().padStart(2, '0')}
                  <span className="opacity-20 mx-1">:</span>
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                    <div className="relative flex items-center">
                        <input 
                            type="number" 
                            value={customSettings[mode] || ''}
                            onChange={(e) => handleManualTimeChange(e.target.value)}
                            className="bg-transparent text-[110px] w-[180px] text-center outline-none border-b border-[#e6ccb2]/20 focus:border-[#e6ccb2] transition-all text-[#e6ccb2] font-light time-text"
                        />
                        <span className="absolute -right-10 bottom-6 text-sm uppercase tracking-widest text-[#7a98b9]">min</span>
                    </div>
                </div>
              )}
            </div>

            <button onClick={toggleTimer} className={`orb-main ${isActive ? 'stop' : 'start'}`}>
                {isActive ? t('pause') : t('start')}
            </button>
        </div>
      </div>

      {/* SIDE JOURNAL */}
      <div className="journal-drawer flex flex-col shadow-2xl">
          <div className="p-10 flex justify-between items-end border-b border-[#e6ccb2]/5">
            <div className="flex flex-col gap-1">
                <span className="mono-text text-[#7a98b9] uppercase tracking-widest">{t('system_log')}</span>
                <h2 className="text-3xl font-light text-[#e6ccb2] tracking-tighter">{t('session_journal')}</h2>
            </div>
            <button onClick={() => { saveNotesToDB(); setIsJournalOpen(false); }} 
                    className="w-12 h-12 rounded-full border border-[#e6ccb2]/10 flex items-center justify-center hover:bg-[#e6ccb2] hover:text-[#000d3d] transition-all">
                <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 relative">
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotesToDB}
                className="w-full h-full bg-transparent resize-none outline-none p-10 text-xl font-light leading-relaxed text-[#e6ccb2]/80 placeholder-[#7a98b9]/40 no-scrollbar"
                placeholder="Transcribe your focus here..."
              />
          </div>

          <div className="p-10 bg-[#000d3d] border-t border-[#e6ccb2]/10 flex gap-4">
            <button onClick={downloadNotes} className="flex-1 bg-[#e6ccb2] text-[#000d3d] py-5 rounded-full font-bold flex items-center justify-center gap-3 transition-all hover:opacity-90">
                <i className="fas fa-cloud-download-alt"></i>
                {t('exportAsMD')}
            </button>
          </div>
      </div>

      {isJournalOpen && (
        <div className="fixed inset-0 bg-[#000d3d]/80 backdrop-blur-md z-[90] lg:hidden" onClick={() => setIsJournalOpen(false)}></div>
      )}
    </div>
  );
};