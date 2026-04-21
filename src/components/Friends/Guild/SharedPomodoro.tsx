import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../Auth/supabaseClient';

interface SharedPomodoroProps {
  groupId: string;
  isLeader: boolean;
  user: any;
}

export const SharedPomodoro: React.FC<SharedPomodoroProps> = ({ groupId, isLeader, user }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'STUDY' | 'BREAK'>('IDLE');
  const hasLoggedRef = useRef(false);

  const syncTimer = (endAt: string | null, type: string) => {
    if (!endAt || type === 'IDLE') {
      setStatus('IDLE');
      setTimeLeft(0);
      return;
    }
    const end = new Date(endAt).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((end - now) / 1000));

    if (diff <= 0) {
      setStatus('IDLE');
      setTimeLeft(0);
    } else {
      setTimeLeft(diff);
      setStatus(type as any);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel(`group_timer_${groupId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` }, 
        (payload) => {
          syncTimer(payload.new.timer_end_at, payload.new.timer_type);
          hasLoggedRef.current = false;
        }
      )
      .subscribe();

    const fetchInitial = async () => {
      const { data } = await supabase.from('groups').select('timer_end_at, timer_type').eq('id', groupId).single();
      if (data) syncTimer(data.timer_end_at, data.timer_type);
    };

    fetchInitial();
    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (status === 'STUDY' && !hasLoggedRef.current) handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, status]);

  const handleSessionComplete = async () => {
    hasLoggedRef.current = true;
    await supabase.from('focus_sessions').insert([{
      group_id: groupId,
      user_id: user.id,
      duration_minutes: 25 
    }]);
  };

  const startSession = async (min: number, type: 'STUDY' | 'BREAK') => {
    const endAt = new Date(Date.now() + min * 60000).toISOString();
    await supabase.from('groups').update({ 
      timer_end_at: endAt, 
      timer_type: type,
      timer_is_running: true 
    }).eq('id', groupId);
  };

  const stopSession = async () => {
    await supabase.from('groups').update({ 
      timer_end_at: null, 
      timer_type: 'IDLE',
      timer_is_running: false 
    }).eq('id', groupId);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 tech-font">
      <style>{`
        .timer-glow-study {
          color: #60a5fa;
          text-shadow: 0 0 20px rgba(96, 165, 250, 0.4);
        }
        .timer-glow-break {
          color: #e6ccb2;
          text-shadow: 0 0 20px rgba(230, 204, 178, 0.4);
        }
        .sonar-ring {
          position: absolute;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sonar-wave {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 1px solid rgba(96, 165, 250, 0.2);
          animation: sonar-ping 3s infinite ease-out;
        }
        @keyframes sonar-ping {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      <div className="relative flex items-center justify-center w-75 h-75 mb-10">
        <div className="sonar-ring">
           {status !== 'IDLE' && <div className="sonar-wave" style={{ borderColor: status === 'STUDY' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(230, 204, 178, 0.2)' }} />}
           <div className="w-[90%] h-[90%] border-4 border-white/5 rounded-full flex flex-col items-center justify-center bg-[#000d3d]/20 backdrop-blur-sm">
              <span className="pixel-font text-[8px] text-white/20 mb-2 tracking-widest">
                {status === 'IDLE' ? 'SYSTEM_READY' : `${status}_MODE`}
              </span>
              <div className={`text-6xl font-bold font-mono tracking-tighter ${
                status === 'STUDY' ? 'timer-glow-study' : 
                status === 'BREAK' ? 'timer-glow-break' : 
                'text-white/10'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <div className="mt-2 flex gap-1">
                 {[1,2,3].map(i => <div key={i} className={`h-1 w-4 rounded-full ${status !== 'IDLE' ? 'bg-blue-400 animate-pulse' : 'bg-white/5'}`} />)}
              </div>
           </div>
        </div>
      </div>
      
      {isLeader ? (
        <div className="flex flex-col gap-4 w-full max-w-60">
          {status === 'IDLE' ? (
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => startSession(25, 'STUDY')} 
                className="bg-blue-500/10 border border-blue-400/30 text-blue-400 hover:bg-blue-500 hover:text-white py-3 rounded-xl transition-all pixel-font text-[7px]"
              >
                DEEP_FOCUS
              </button>
              <button 
                onClick={() => startSession(5, 'BREAK')} 
                className="bg-[#e6ccb2]/10 border border-[#e6ccb2]/30 text-[#e6ccb2] hover:bg-[#e6ccb2] hover:text-[#000d3d] py-3 rounded-xl transition-all pixel-font text-[7px]"
              >
                SURFACE
              </button>
            </div>
          ) : (
            <button 
              onClick={stopSession} 
              className="w-full bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white py-4 rounded-xl transition-all pixel-font text-[7px] tracking-widest"
            >
              TERMINATE_UPLINK
            </button>
          )}
        </div>
      ) : (
        <div className="text-center">
            {status !== 'IDLE' ? (
                <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2 items-center">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        <p className="pixel-font text-[7px] text-emerald-400 tracking-widest">RECEIVING_SYNC_SIGNAL</p>
                    </div>
                    <p className="text-[10px] text-white/30 italic">Maintaining depth with the Lead Operator...</p>
                </div>
            ) : (
                <p className="pixel-font text-[7px] text-white/20 tracking-widest">WAITING_FOR_LEADER_INIT...</p>
            )}
        </div>
      )}
    </div>
  );
};