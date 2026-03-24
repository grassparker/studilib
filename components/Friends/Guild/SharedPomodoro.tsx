import React, { useState, useEffect } from 'react';
import { supabase } from '../../Auth/supabaseClient';

export const SharedPomodoro: React.FC<{ groupId: string; isLeader: boolean }> = ({ groupId, isLeader }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState<'IDLE' | 'STUDY' | 'BREAK'>('IDLE');

  useEffect(() => {
    const channel = supabase
      .channel(`group_timer_${groupId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'groups', filter: `id=eq.${groupId}` }, 
      payload => syncTimer(payload.new.timer_end_at, payload.new.timer_type))
      .subscribe();

    const fetchInitial = async () => {
        const { data } = await supabase.from('groups').select('timer_end_at, timer_type').eq('id', groupId).single();
        if (data) syncTimer(data.timer_end_at, data.timer_type);
    };
    fetchInitial();
    return () => { supabase.removeChannel(channel); };
  }, [groupId]);

  const syncTimer = (endAt: string | null, type: string) => {
    if (!endAt) {
        setStatus('IDLE');
        setTimeLeft(0);
        return;
    }
    const end = new Date(endAt).getTime();
    const now = new Date().getTime();
    const diff = Math.max(0, Math.floor((end - now) / 1000));
    setTimeLeft(diff);
    setStatus(diff > 0 ? (type as any) : 'IDLE');
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      if (status !== 'IDLE') setStatus('IDLE');
      return;
    }
    const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft, status]);

const startSession = async (min: number, type: 'STUDY' | 'BREAK') => {
    const endAt = new Date(Date.now() + min * 60000).toISOString();
    
    const { error } = await supabase
      .from('groups')
      .update({ timer_end_at: endAt, timer_type: type })
      .eq('id', groupId);

    if (error) {
      console.error("❌ TIMER_START_ERROR:", error.message);
      alert(`Database Error: ${error.message}`);
    }
  };

  const stopSession = async () => {
    const { error } = await supabase
      .from('groups')
      .update({ timer_end_at: null, timer_type: 'IDLE' })
      .eq('id', groupId);

    if (error) {
      console.error("❌ TIMER_STOP_ERROR:", error.message);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center">
      <div className={`text-[48px] font-bold mb-4 ${status === 'STUDY' ? 'text-red-500' : status === 'BREAK' ? 'text-green-500' : 'text-slate-300'}`}>
        {formatTime(timeLeft)}
      </div>
      
      {isLeader && (
        <div className="flex gap-2">
          {status === 'IDLE' ? (
            <>
              <button onClick={() => startSession(25, 'STUDY')} className="pixel-btn-action text-[8px] bg-orange-400">INIT_STUDY</button>
              <button onClick={() => startSession(5, 'BREAK')} className="pixel-btn-action text-[8px] bg-green-400">INIT_BREAK</button>
            </>
          ) : (
            <button onClick={stopSession} className="pixel-btn-action text-[8px] bg-red-600 text-white">ABORT_MISSION</button>
          )}
        </div>
      )}
    </div>
  );
};