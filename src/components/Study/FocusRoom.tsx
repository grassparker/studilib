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
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@200;400;600;700&display=swap');
        
        .tech-font { font-family: 'Inter', sans-serif; }
        
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
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(230, 204, 178, 0.1);
          border-radius: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          width: 100%;
          max-width: 450px;
          padding: 2rem;
          z-index: 5;
          position: relative;
        }

        /* JOURNAL MODAL CENTERED */
        .journal-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(${isJournalOpen ? '1' : '0.9'});
          width: 95%;
          max-width: 600px;
          height: 80vh;
          max-height: 700px;
          background: rgba(0, 13, 61, 0.8);
          backdrop-filter: blur(40px);
          border: 1px solid rgba(230, 204, 178, 0.2);
          border-radius: 30px;
          z-index: 200;
          opacity: ${isJournalOpen ? '1' : '0'};
          visibility: ${isJournalOpen ? 'visible' : 'hidden'};
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 0 50px 100px -20px rgba(0, 0, 0, 0.7);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 5, 20, 0.7);
          backdrop-filter: blur(10px);
          z-index: 150;
          opacity: ${isJournalOpen ? '1' : '0'};
          visibility: ${isJournalOpen ? 'visible' : 'hidden'};
          transition: opacity 0.3s ease;
        }

        .btn-nav {
          background: rgba(230, 204, 178, 0.05);
          border: 1px solid rgba(230, 204, 178, 0.1);
          padding: 8px 20px;
          border-radius: 100px;
          transition: all 0.2s ease;
          color: #7a98b9;
          font-size: 0.85rem;
          white-space: nowrap;
        }
        .btn-nav.active { background: #e6ccb2; color: #000d3d; font-weight: 600; }

        .orb-main {
          width: 100%;
          max-width: 200px;
          height: 56px;
          border-radius: 100px;
          font-weight: 600;
          letter-spacing: 2px;
          transition: all 0.3s ease;
          text-transform: uppercase;
        }
        .orb-main.start { background: #e6ccb2; color: #000d3d; }
        .orb-main.stop { background: transparent; color: #e6ccb2; border: 1.5px solid #e6ccb2; }

        .time-text-input {
          font-size: clamp(60px, 15vw, 100px);
          width: 1.8em;
        }

        @media (max-width: 640px) {
          .glass-altar { padding: 1.5rem; border-radius: 30px; }
          .nav-container { top: 20px !important; left: 20px !important; right: 20px !important; flex-direction: column !important; gap: 12px !important; }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
      
      {/* NAV CONTROLS */}
      <div className="nav-container absolute top-10 left-10 right-10 flex justify-between items-center z-20">
        <div className="flex gap-2 bg-[#000d3d]/60 p-1.5 rounded-full border border-[#e6ccb2]/10 backdrop-blur-xl">
            <button onClick={() => setMode(TimerMode.POMODORO)} disabled={isActive} className={`btn-nav ${mode === TimerMode.POMODORO ? 'active' : ''}`}>{t('focus')}</button>
            <button onClick={() => setMode(TimerMode.SHORT_BREAK)} disabled={isActive} className={`btn-nav ${mode === TimerMode.SHORT_BREAK ? 'active' : ''}`}>{t('break')}</button>
        </div>
        
        <div className="flex gap-2">
            <button onClick={toggleFullscreen} className="btn-nav w-10 h-10 p-0 flex items-center justify-center"><i className="fas fa-expand-alt text-xs"></i></button>
            <button onClick={() => setIsJournalOpen(true)} className="btn-nav flex items-center gap-2 px-6">
                <i className="fas fa-feather-alt text-[10px]"></i>
                <span className="font-bold tracking-widest text-[10px] uppercase">{t('journal')}</span>
            </button>
        </div>
      </div>

      {/* MAIN ALTAR */}
      <div className="glass-altar flex flex-col items-center justify-center text-center">
        {/* PROGRESS RING */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-8">
          <circle cx="50%" cy="50%" r="44%" fill="none" stroke="rgba(230,204,178,0.05)" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="44%" fill="none" 
                  stroke="#e6ccb2" 
                  strokeWidth="2" 
                  strokeDasharray="276%"
                  strokeDashoffset={`${276 - (progressPercent * 2.76)}%`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear opacity-30" />
        </svg>

        <div className="z-10 w-full">
            <div className={`text-[10px] mb-6 tracking-[0.3em] uppercase opacity-50 tech-font`}>
                {isActive ? 'Protocol Active' : 'System Standby'}
            </div>

            <div className="mb-8">
              {isActive ? (
                <div className="tech-font font-light tracking-tighter leading-none text-[#e6ccb2]" style={{ fontSize: 'clamp(60px, 15vw, 100px)' }}>
                  {Math.floor(timeLeft / 60).toString().padStart(2, '0')}
                  <span className="opacity-20">:</span>
                  {(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              ) : (
                <div className="flex justify-center items-baseline">
                    <input 
                        type="number" 
                        value={customSettings[mode] || ''}
                        onChange={(e) => handleManualTimeChange(e.target.value)}
                        className="bg-transparent text-center outline-none border-b border-[#e6ccb2]/20 focus:border-[#e6ccb2] transition-all text-[#e6ccb2] font-light tech-font time-text-input"
                    />
                    <span className="ml-2 text-xs uppercase tracking-widest opacity-40">m</span>
                </div>
              )}
            </div>

            <button onClick={toggleTimer} className={`orb-main ${isActive ? 'stop' : 'start'}`}>
                {isActive ? t('pause') : t('start')}
            </button>
        </div>
      </div>

      {/* CENTERED JOURNAL MODAL */}
      <div className="modal-overlay" onClick={() => { saveNotesToDB(); setIsJournalOpen(false); }}></div>
      
      <div className="journal-modal">
          <div className="p-6 md:p-8 flex justify-between items-center border-b border-[#e6ccb2]/10">
            <div>
                <span className="text-[10px] text-[#7a98b9] uppercase tracking-widest block mb-1">Session Notes</span>
                <h2 className="text-xl md:text-2xl font-light text-[#e6ccb2]">Journal</h2>
            </div>
            <button onClick={() => { saveNotesToDB(); setIsJournalOpen(false); }} 
                    className="w-10 h-10 rounded-full border border-[#e6ccb2]/20 flex items-center justify-center hover:bg-[#e6ccb2] hover:text-[#000d3d] transition-all">
                <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotesToDB}
                className="w-full h-full bg-transparent resize-none outline-none p-6 md:p-8 text-base md:text-lg font-light leading-relaxed text-[#e6ccb2]/80 placeholder-[#7a98b9]/30 no-scrollbar"
                placeholder="What are you focusing on?"
              />
          </div>

          <div className="p-6 md:p-8 bg-[#000d3d]/40 border-t border-[#e6ccb2]/10">
            <button onClick={downloadNotes} className="w-full bg-[#e6ccb2] text-[#000d3d] py-4 rounded-full font-bold flex items-center justify-center gap-3 transition-all active:scale-95">
                <i className="fas fa-cloud-download-alt"></i>
                {t('exportAsMD')}
            </button>
          </div>
      </div>
    </div>
  );
};