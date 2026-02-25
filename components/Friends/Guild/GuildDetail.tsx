import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../Auth/supabaseClient';
import { Chat } from './Chat';

export const GuildDetail: React.FC<{ user: any }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guild, setGuild] = useState<any>(null);

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

  // MOVE CSS TO THE TOP so it's available for the loading screen
  const pixelStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
      
      .social-scope *:not(i) { 
          font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace !important; 
          text-transform: uppercase; 
      }

      .social-scope i {
          font-family: "Font Awesome 6 Free" !important;
          font-weight: 900;
          text-transform: none !important;
      }

      .pixel-box-white { border: 4px solid black; background: white; box-shadow: 8px 8px 0 0 rgba(0,0,0,0.2); padding: 20px; }
      .pixel-box-blue { border: 4px solid black; background: #e0f2fe; box-shadow: 8px 8px 0 0 #7dd3fc; padding: 20px; }
      .pixel-btn-action { border: 4px solid black; background: #ffaa00; padding: 10px 15px; box-shadow: inset -4px -4px 0 0 #cc8800; cursor: pointer; font-size: 10px; display: flex; align-items: center; gap: 10px; }
      .pixel-btn-action:active { box-shadow: inset 4px 4px 0 0 #cc8800; transform: translateY(2px); }
      .pixel-avatar-sm { border: 2px solid black; background: white; width: 32px; height: 32px; flex-shrink: 0; }
    `}</style>
  );

  if (!guild) return (
    <div className="social-scope flex flex-col items-center justify-center min-h-screen bg-[#f0f0f0] p-4 text-center">
      {pixelStyles}
      <div className="pixel-box-white animate-pulse">
        <p className="text-[10px]">ACCESSING_GUILD_DATABASE...</p>
        <p className="text-[8px] mt-4 text-slate-400">PLEASE_WAIT</p>
      </div>
    </div>
  );

  return (
    <div className="social-scope max-w-7xl mx-auto p-4 md:p-8 space-y-6 min-h-screen flex flex-col">
      {pixelStyles}

      {/* HEADER SECTION - More compact on mobile */}
      <header className="pixel-box-white flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={() => navigate(-1)} className="pixel-btn-action bg-slate-200 !shadow-none !p-2">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[10px] md:text-[14px] font-bold text-blue-600 truncate"># {guild.name}</h1>
            <p className="text-[6px] md:text-[8px] text-slate-400 mt-1">ID: {guild.id.slice(0,8)}</p>
          </div>
        </div>
        <div className="flex gap-4 items-center self-end sm:self-center">
            <span className="text-[8px] md:text-[10px] bg-green-100 px-3 py-1 border-2 border-black">
                {guild.group_members.length} MEMBERS
            </span>
        </div>
      </header>

      {/* MAIN CONTENT GRID - Stacked on mobile, 4-col on desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 flex-1">
        
        {/* LEFT/TOP: MEMBER LIST */}
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <section className="pixel-box-white h-full max-h-[300px] lg:max-h-full overflow-y-auto">
            <h2 className="text-[8px] md:text-[10px] mb-4 underline decoration-double sticky top-0 bg-white py-1">MEMBER_LIST</h2>
            <div className="space-y-3">
              {guild.group_members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-black hover:bg-slate-50 min-w-0">
                  <img 
                    src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles?.username}`} 
                    className="pixel-avatar-sm" 
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[8px] truncate">{m.profiles?.username}</span>
                    {m.user_id === guild.creator_id && (
                      <span className="text-[6px] text-amber-600 font-bold">[LEADER]</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* RIGHT/BOTTOM: CHAT HUB - Fixed height for chat area while allowing page scroll */}
        <main className="lg:col-span-3 order-1 lg:order-2 flex flex-col">
          <section className="pixel-box-blue flex-1 flex flex-col min-h-[450px] md:min-h-[600px]">
            <h2 className="text-[8px] md:text-[10px] mb-4 flex items-center gap-2">
                <i className="fas fa-comments"></i> GUILD_CHAT
            </h2>
            <div className="flex-1 bg-white border-4 border-black p-2 overflow-hidden shadow-[inset_4px_4px_0_0_#ddd] flex flex-col">
                <Chat 
                  groupId={guild.id} 
                  userId={user.id} 
                  username={user.username || user.email?.split('@')[0] || 'Hero'} 
                />
            </div>
          </section>
        </main>

      </div>
    </div>
  );
};