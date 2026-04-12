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
  
  // Guard to ensure we only log a session once per completion
  const hasLoggedRef = useRef(false);

  // --- 1. TIMER SYNC LOGIC ---
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

  // --- 2. REALTIME SUBSCRIPTION ---
  useEffect(() => {
    console.log("🔗 INITIALIZING_REALTIME_FOR:", groupId);

    const channel = supabase
      .channel(`group_timer_${groupId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'groups', 
          filter: `id=eq.${groupId}` 
        }, 
        (payload) => {
          console.log("🔔 REALTIME_PAYLOAD_RECEIVED:", payload.new);
          syncTimer(payload.new.timer_end_at, payload.new.timer_type);
          // When a new session starts, reset the logging guard
          hasLoggedRef.current = false;
        }
      )
      .subscribe((status) => {
        console.log("📡 SUBSCRIPTION_STATUS:", status);
      });

    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('timer_end_at, timer_type')
        .eq('id', groupId)
        .single();
        
      if (error) console.error("❌ INITIAL_FETCH_ERROR:", error.message);
      if (data) syncTimer(data.timer_end_at, data.timer_type);
    };

    fetchInitial();

    return () => {
      console.log("⚰️ CLEANING_UP_CHANNEL");
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // --- 3. LOCAL COUNTDOWN & LOGGING ---
  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer reached zero
          if (status === 'STUDY' && !hasLoggedRef.current) {
            handleSessionComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, status]);

  const handleSessionComplete = async () => {
    hasLoggedRef.current = true; // Prevent double logging
    console.log("🏆 RECORDING_FOCUS_DATA...");
    
    const { error } = await supabase.from('focus_sessions').insert([{
      group_id: groupId,
      user_id: user.id,
      duration_minutes: 25 
    }]);

    if (error) console.error("❌ LOGGING_ERROR:", error.message);
  };

  // --- 4. CONTROLS (LEADER ONLY) ---
  const startSession = async (min: number, type: 'STUDY' | 'BREAK') => {
    const endAt = new Date(Date.now() + min * 60000).toISOString();
    
    console.log(`🚀 STARTING_${type}:`, endAt);

    const { data, error } = await supabase
      .from('groups')
      .update({ 
        timer_end_at: endAt, 
        timer_type: type,
        timer_is_running: true 
      })
      .eq('id', groupId)
      .select(); // Returns data to confirm success

    if (error) {
      console.error("❌ DB_UPDATE_ERROR:", error.message);
      alert(`Error: ${error.message}. Check RLS Policies!`);
    } else if (data && data.length === 0) {
      console.warn("⚠️ ZERO_ROWS_UPDATED: RLS likely blocked the write.");
      alert("Permission Denied: Only the leader can update the timer.");
    }
  };

  const stopSession = async () => {
    console.log("🛑 STOPPING_SESSION");
    await supabase
      .from('groups')
      .update({ 
        timer_end_at: null, 
        timer_type: 'IDLE',
        timer_is_running: false 
      })
      .eq('id', groupId);
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`text-[48px] font-bold mb-4 font-mono ${
        status === 'STUDY' ? 'text-red-500' : 
        status === 'BREAK' ? 'text-green-500' : 
        'text-slate-300'
      }`}>
        {formatTime(timeLeft)}
      </div>
      
      {isLeader && (
        <div className="flex gap-2">
          {status === 'IDLE' ? (
            <>
              <button 
                onClick={() => startSession(25, 'STUDY')} 
                className="pixel-btn-action text-[8px] bg-orange-400 p-2 border-2 border-black"
              >
                INIT_STUDY
              </button>
              <button 
                onClick={() => startSession(5, 'BREAK')} 
                className="pixel-btn-action text-[8px] bg-green-400 p-2 border-2 border-black"
              >
                INIT_BREAK
              </button>
            </>
          ) : (
            <button 
              onClick={stopSession} 
              className="pixel-btn-action text-[8px] bg-red-600 text-white p-2 border-2 border-black"
            >
              ABORT_MISSION
            </button>
          )}
        </div>
      )}
      
      {!isLeader && status !== 'IDLE' && (
        <p className="text-[8px] text-slate-400 animate-pulse">GUILD IS FOCUSING...</p>
      )}
    </div>
  );
};