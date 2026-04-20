import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../Auth/supabaseClient';
import { Chat } from './Chat';
import { SharedPomodoro } from './SharedPomodoro';

export const GuildDetail: React.FC<{ user: any }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [guild, setGuild] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [stats, setStats] = useState({ totalFocus: 0, sessions: 0 });

  // --- 1. NOTIFICATION LOGIC (FIXED) ---
  useEffect(() => {
    if (!id) return;
    
    if (isChatOpen) {
      setHasNewMessage(false);
    }

    // Unique channel ID prevents the "WebSocket closed" race condition
    const channelId = `notify_${id}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'group_messages', 
          filter: `group_id=eq.${id}` 
        },
        (payload) => {
          // Trigger notification ONLY if chat is closed and sender isn't current user
          if (!isChatOpen && payload.new.user_id !== user.id) {
            setHasNewMessage(true);
          }
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [id, isChatOpen, user.id]);

  // --- 2. FETCH STATS ---
  useEffect(() => {
    const fetchRealStats = async () => {
      const { data } = await supabase
        .from('focus_sessions')
        .select('duration_minutes')
        .eq('group_id', id);
        
      if (data) {
        const total = data.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        setStats({ totalFocus: total, sessions: data.length });
      }
    };
    if (id) fetchRealStats();
  }, [id]);

  // --- 3. FETCH GUILD DATA ---
  useEffect(() => {
    const fetchGuildData = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members(user_id, profiles(username, avatar_url))')
        .eq('id', id)
        .single();
        
      if (error || !data) navigate('/app');
      else setGuild(data);
    };
    if (id) fetchGuildData();
  }, [id, navigate]);

  const themeStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;700&display=swap');
      
      .deep-sea-scope { 
          font-family: 'Inter', sans-serif;
          background: radial-gradient(circle at top, #001a4d 0%, #000d3d 100%);
          color: white;
      }
      .pixel-font { font-family: 'Press Start 2P', monospace; }
      .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.5rem;
      }
      .chat-popup {
          position: fixed;
          bottom: 90px;
          right: 24px;
          width: 350px;
          height: 500px;
          z-index: 50;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
      }
      @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
      }
      .fab-btn {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 18px;
          background: #e6ccb2;
          color: #000d3d;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          z-index: 60;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          transition: all 0.2s;
      }
      .fab-btn:hover { transform: scale(1.05); background: #f5e6d3; }
      .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 14px;
          height: 14px;
          background: #ff4d4d;
          border: 2px solid #000d3d;
          border-radius: 50%;
      }
    `}</style>
  );

  if (!guild) return <div className="deep-sea-scope h-screen flex items-center justify-center pixel-font text-[10px]">SYNCING_CHANNELS...</div>;

  return (
    <div className="deep-sea-scope h-screen flex flex-col p-3 md:p-6 overflow-hidden relative">
      {themeStyles}

      {/* HEADER */}
      <header className="glass-panel flex justify-between items-center px-6 py-4 mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-white/50 hover:text-[#e6ccb2] transition-colors">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tighter flex items-center gap-2">
              <span className="text-[#e6ccb2]">🛡️</span> {guild.name}
            </h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
            <div className="pixel-font text-[6px] text-blue-300">{guild.group_members.length} ACTIVE</div>
            <div className="pixel-font text-[6px] bg-[#e6ccb2]/10 text-[#e6ccb2] px-3 py-1.5 rounded-md border border-[#e6ccb2]/20">LVL_12</div>
        </div>
      </header>

      {/* STAT HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 shrink-0">
        {[
          { label: 'TOTAL_FOCUS', val: `${stats.totalFocus}M`, color: 'text-blue-400' },
          { label: 'SESSIONS', val: stats.sessions, color: 'text-orange-400' },
          { label: 'RANK', val: stats.totalFocus > 500 ? 'VETERAN' : 'NOVICE', color: 'text-[#e6ccb2]' },
          { label: 'PARTY_SIZE', val: guild.group_members.length, color: 'text-emerald-400' }
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-3 flex flex-col items-center justify-center text-center">
            <span className="pixel-font text-[5px] text-white/30 mb-2 tracking-widest">{stat.label}</span>
            <div className={`text-sm md:text-lg font-bold ${stat.color}`}>{stat.val}</div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* PARTY SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-0">
          <section className="glass-panel flex-1 flex flex-col p-5 min-h-0">
            <h2 className="pixel-font text-[7px] mb-6 text-[#e6ccb2]/60 border-b border-white/5 pb-3">ACTIVE_PARTY</h2>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scroll">
              {guild.group_members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-3">
                  <div className="relative">
                    <img src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.profiles?.username}`} 
                         className="w-8 h-8 rounded-xl border border-white/10" alt="av" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#000d3d] rounded-full"></div>
                  </div>
                  <p className="text-xs font-medium truncate">{m.profiles?.username}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* TIMER SECTION */}
        <main className="flex-1 flex flex-col min-h-0">
          <section className="glass-panel flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-white/5">
            <div className="absolute top-4 left-6 pixel-font text-[6px] text-blue-400/40 tracking-[0.4em]">SYNC_COORDINATES: {guild.id.substring(0, 8)}</div>
            <SharedPomodoro groupId={guild.id} isLeader={user.id === guild.creator_id} user={user}/>
          </section>
        </main>
      </div>

      {/* CHAT POPUP */}
      {isChatOpen && (
        <div className="chat-popup glass-panel overflow-hidden shadow-2xl border-[#e6ccb2]/20">
          <div className="px-5 py-3 border-b border-white/10 flex justify-between items-center bg-[#000d3d]/50">
             <span className="pixel-font text-[7px] text-[#e6ccb2]">COMMS_LINK_ENCRYPTED</span>
             <button onClick={() => setIsChatOpen(false)} className="text-white/40 hover:text-white">
                <i className="fas fa-times"></i>
             </button>
          </div>
          <div className="flex-1 overflow-hidden">
             <Chat 
                groupId={guild.id} 
                userId={user.id} 
                username={user.username || 'Hero'} 
             />
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fab-btn"
      >
        <i className={`fas ${isChatOpen ? 'fa-comment-slash' : 'fa-comments'}`}></i>
        {hasNewMessage && !isChatOpen && <div className="notification-badge animate-pulse" />}
      </button>

      {/* FOOTER */}
      <footer className="mt-4 flex justify-between items-center px-4 md:px-2 opacity-30">
        <p className="pixel-font text-[5px] tracking-widest uppercase">Encryption: AES_Pixel_256</p>
        <p className="pixel-font text-[5px]">DEPTH: 1200M</p>
      </footer>
    </div>
  );
};