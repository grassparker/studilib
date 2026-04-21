import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../Auth/supabaseClient';

export const GlobalChat = ({ userId, username }: { userId: string, username: string }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const stars = useMemo(() => {
    return [...Array(35)].map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      duration: `${Math.random() * 4 + 2}s`,
      delay: `${Math.random() * 3}s`,
    }));
  }, []);

  const fetchGlobal = async () => {
    const { data } = await supabase
      .from('public_messages')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setMessages(data.reverse());
  };

  useEffect(() => {
    fetchGlobal();
    const channel = supabase.channel('global-uplink')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'public_messages',
      }, async (payload) => {
        if (payload.new.user_id === userId) return;
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', payload.new.user_id).single();
        const incoming = { ...payload.new, profiles: { username: profile?.username || 'ANON_NODE' } };
        setMessages(prev => [...prev, incoming]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMsg = { 
      id: Date.now(), 
      content: newMessage, 
      user_id: userId, 
      profiles: { username },
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    const { error } = await supabase.from('public_messages').insert([{ user_id: userId, content: tempMsg.content }]);
    if (error) setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
  };

  return (
    <div 
      className="flex flex-col h-112.5 rounded-3xl overflow-hidden relative backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
      style={{ 
        // Semi-transparent gradient to let the background blur peek through
        background: 'linear-gradient(180deg, rgba(0, 13, 61, 0.6) 0%, rgba(26, 71, 138, 0.4) 40%, rgba(122, 152, 185, 0.2) 80%, rgba(230, 204, 178, 0.1) 120%)' 
      }}
    >
      {/* GLOWING STARS LAYER */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-[#e6ccb2] animate-twinkle"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              boxShadow: `0 0 ${parseFloat(star.size) * 3}px 1px rgba(230,204,178,0.8)`,
              animationDuration: star.duration,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.4); }
      `}</style>

      {/* HEADER - Frosted Glass */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center backdrop-blur-xl z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e6ccb2] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e6ccb2]"></span>
          </div>
          <span className="pixel-font text-[8px] text-[#e6ccb2] tracking-[0.2em] uppercase drop-shadow-[0_0_8px_rgba(230,204,178,0.8)]">Starlight_Uplink</span>
        </div>
        <span className="text-[9px] text-[#e6ccb2]/70 font-mono">NET_SYNC_v2.0</span>
      </div>

      {/* MESSAGE STREAM */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 chat-scroll bg-transparent z-10">
        {messages.map((m, i) => {
          const isMe = m.user_id === userId;
          return (
            <div key={m.id || i} className="flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-1 duration-500">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold uppercase tracking-wider drop-shadow-md ${isMe ? 'text-[#e6ccb2]' : 'text-white'}`}>
                  {m.profiles?.username || 'GUEST_NODE'}
                </span>
                <span className="text-[7px] text-white/50 font-mono">
                  {new Date(m.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed font-mono wrap-break-word p-3 rounded-2xl backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.1)] border
                ${isMe 
                  ? 'bg-white/10 border-white/20 text-white border-r-[#e6ccb2]/60 ml-4 rounded-tr-sm' 
                  : 'bg-black/20 border-white/10 text-white/90 border-l-[#7a98b9]/60 mr-4 rounded-tl-sm'
                }`}
              >
                {m.content}
              </p>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* INPUT SYSTEM - Frosted Glass */}
      <div className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-xl z-10">
        <form onSubmit={send} className="flex gap-2 relative">
          <input 
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="TRANSMIT TO ORBIT..."
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-5 py-3 text-[10px] font-mono text-white placeholder:text-white/40 focus:outline-none focus:border-[#e6ccb2]/50 focus:bg-black/30 focus:ring-1 focus:ring-[#e6ccb2]/30 transition-all shadow-inner"
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#e6ccb2] hover:bg-white/10 hover:scale-105 transition-all disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            <i className="fa-solid fa-paper-plane text-[10px]"></i>
          </button>
        </form>
      </div>
    </div>
  );
};