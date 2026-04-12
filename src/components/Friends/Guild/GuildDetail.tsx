import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../Auth/supabaseClient';
import { Chat } from './Chat';
import { SharedPomodoro } from './SharedPomodoro';

export const GuildDetail: React.FC<{ user: any }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guild, setGuild] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'timer' | 'chat'>('timer'); // Mobile Tab State
  const [stats, setStats] = useState({ totalFocus: 0, sessions: 0 });

  useEffect(() => {
    const fetchRealStats = async () => {
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration_minutes')
        .eq('group_id', id);

      if (data) {
        const total = data.reduce((acc, curr) => acc + curr.duration_minutes, 0);
        setStats({
          totalFocus: total,
          sessions: data.length
        });
      }
    };

    if (id) fetchRealStats();
  }, [id]);

  useEffect(() => {
    const fetchGuildData = async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*, group_members(user_id, profiles(username, avatar_url))')
        .eq('id', id)
        .single();

      if (error || !data) {
        alert("GUILD NOT FOUND");
        navigate('/app'); 
      } else {
        setGuild(data);
      }
    };
    if (id) fetchGuildData();
  }, [id, navigate]);

  const pixelStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      
      .social-scope { 
          font-family: 'Press Start 2P', monospace !important; 
          text-transform: uppercase;
          background-color: #f1f8e9; /* Nature Green Theme */
      }

      .pixel-box { border: 4px solid #3e2723; background: white; box-shadow: 4px 4px 0 0 #2a1b0a; padding: 12px; }
      .pixel-btn-tab { border: 4px solid #3e2723; background: #8d6e63; color: white; padding: 10px; font-size: 8px; flex: 1; text-align: center; }
      .pixel-btn-tab.active { background: #4caf50; box-shadow: inset 4px 4px 0 0 #1b5e20; }

      .custom-scroll { overflow-y: auto; }
      .custom-scroll::-webkit-scrollbar { width: 6px; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #3e2723; }

      /* Mobile UI Tweaks */
      @media (max-width: 1024px) {
        .mobile-content-h { height: calc(100vh - 220px); }
      }
    `}</style>
  );

  if (!guild) return <div className="social-scope h-screen flex items-center justify-center">LOADING...</div>;

return (
    <div className="social-scope h-screen flex flex-col p-2 md:p-6 overflow-hidden">
      {pixelStyles}

      {/* 1. COMPACT HEADER */}
      <header className="pixel-box flex justify-between items-center mb-3 shrink-0 bg-[#fffdf5]">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => navigate(-1)} className="text-[#3e2723] hover:scale-110 transition-transform">
            <i className="fas fa-chevron-left"></i>
          </button>
          <h1 className="text-[8px] md:text-[12px] truncate">🛡️ {guild.name}</h1>
        </div>
        <div className="hidden md:flex gap-4">
            {/* NEW: QUICK MINI STATS */}
            <div className="text-[6px] text-green-600">● {guild.group_members.length} ONLINE</div>
            <div className="text-[6px] text-[#8d6e63]">LVL 12 GUILD</div>
        </div>
      </header>

      {/* NEW: 2. STAT_HUD SECTION (The Focus Data) */}
      {/* STAT_HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 shrink-0">
        {/* TOTAL FOCUS */}
        <div className="pixel-box bg-[#3e2723] text-[#4caf50] !p-2 flex flex-col items-center">
          <span className="text-[5px] text-white/50 mb-1">TOTAL_FOCUS</span>
          <span className="text-[10px]">{stats.totalFocus}M</span>
        </div>

        {/* SESSIONS */}
        <div className="pixel-box bg-white !p-2 flex flex-col items-center">
          <span className="text-[5px] text-[#8d6e63] mb-1">SESSIONS</span>
          <span className="text-[10px]">{stats.sessions}</span>
        </div>

        {/* LVL CALCULATION (Fun RPG Logic) */}
        <div className="pixel-box bg-white !p-2 flex flex-col items-center border-blue-500">
          <span className="text-[5px] text-blue-500 mb-1">GUILD_RANK</span>
          <span className="text-[8px] uppercase">
            {stats.totalFocus > 500 ? 'Veteran' : 'Novice'}
          </span>
        </div>

        {/* ACTIVE PARTY */}
        <div className="pixel-box bg-[#4caf50] text-white !p-2 flex flex-col items-center">
          <span className="text-[5px] text-white/70 mb-1">ADVENTURERS</span>
          <span className="text-[10px]">{guild?.group_members?.length || 0}</span>
        </div>
      </div>
      {/* 2. MAIN LAYOUT */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        
        {/* PARTY LIST (Sidebar on Desktop, Hidden on Mobile) */}
        <aside className="hidden lg:flex flex-col w-48 shrink-0 min-h-0">
          <section className="pixel-box flex-1 flex flex-col min-h-0">
            <h2 className="text-[7px] mb-4 border-b-2 border-[#3e2723] pb-2">PARTY</h2>
            <div className="flex-1 custom-scroll space-y-3">
              {guild.group_members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-2">
                  <img src={m.profiles?.avatar_url} className="w-6 h-6 border-2 border-[#3e2723]" alt="av" />
                  <span className="text-[6px] truncate">{m.profiles?.username}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* TIMER & CHAT AREA */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* MOBILE TABS (Only visible < 1024px) */}
          <div className="flex lg:hidden gap-2 mb-3 shrink-0">
            <button onClick={() => setActiveTab('timer')} className={`pixel-btn-tab ${activeTab === 'timer' ? 'active' : ''}`}>
              <i className="fas fa-clock mr-2"></i> FOCUS
            </button>
            <button onClick={() => setActiveTab('chat')} className={`pixel-btn-tab ${activeTab === 'chat' ? 'active' : ''}`}>
              <i className="fas fa-comment-dots mr-2"></i> COMMS
            </button>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
            
            {/* TIMER SECTION */}
            <main className={`${activeTab === 'timer' ? 'flex' : 'hidden'} lg:flex flex-[2] flex-col min-h-0`}>
              <section className="pixel-box flex-1 flex flex-col items-center justify-center bg-white relative">
                <div className="absolute top-2 left-2 text-[5px] text-slate-300">GUILD_SYNC_V.4</div>
                <SharedPomodoro groupId={guild.id} isLeader={user.id === guild.creator_id} user={user}/>
              </section>
            </main>

            {/* CHAT SECTION */}
            <aside className={`${activeTab === 'chat' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col min-h-0`}>
              <section className="pixel-box flex-1 flex flex-col bg-[#fffdf5] overflow-hidden">
                <h2 className="text-[7px] mb-2 hidden lg:block border-b-2 border-[#3e2723] pb-2">GUILD_CHAT</h2>
                <div className="flex-1 overflow-hidden flex flex-col bg-white border-2 border-[#3e2723]">
                  <Chat 
                    groupId={guild.id} 
                    userId={user.id} 
                    username={user.username || user.email?.split('@')[0] || 'Hero'} 
                  />
                </div>
              </section>
            </aside>

          </div>
        </div>

      </div>

      {/* 3. MOBILE FOOTER INFO (Optional) */}
      <div className="lg:hidden mt-2 text-center">
        <p className="text-[5px] text-[#8d6e63]">🛡️ CURRENTLY DEPLOYED: {guild.group_members.length} USERS</p>
      </div>
    </div>
  );
};