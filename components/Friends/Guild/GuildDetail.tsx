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

  if (!guild) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f0f0] font-['Press_Start_2P']">
      <p className="animate-pulse">LOADING_GUILD_ASSETS...</p>
    </div>
  );

  return (
    <div className="social-scope max-w-7xl mx-auto p-4 md:p-8 space-y-8 h-screen flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
        /* This applies the font to everything EXCEPT <i> tags (the icons) */
        .social-scope *:not(i) { 
            font-family: 'Press Start 2P', 'WDXL Lubrifont SC' , monospace !important; 
            text-transform: uppercase; 
        }

        /* This makes sure the icons keep their own font family */
        .social-scope i {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 900;
            text-transform: none !important; /* Icons shouldn't be uppercase */
        }
        .social-scope * { font-family: 'Press Start 2P', 'WDXL Lubrifont SC' , monospace !important; text-transform: uppercase; }
        .pixel-box-white { border: 4px solid black; background: white; box-shadow: 8px 8px 0 0 rgba(0,0,0,0.2); padding: 24px; }
        .pixel-box-blue { border: 4px solid black; background: #e0f2fe; box-shadow: 8px 8px 0 0 #7dd3fc; padding: 24px; }
        .pixel-btn-action { border: 4px solid black; background: #ffaa00; padding: 12px 20px; box-shadow: inset -4px -4px 0 0 #cc8800; cursor: pointer; font-size: 10px; display: flex; align-items: center; gap: 10px; }
        .pixel-btn-action:active { box-shadow: inset 4px 4px 0 0 #cc8800; transform: translateY(2px); }
        .pixel-avatar-sm { border: 2px solid black; background: white; width: 32px; height: 32px; }
      `}</style>

      {/* HEADER SECTION */}
      <header className="pixel-box-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="pixel-btn-action bg-slate-200 !shadow-none !p-2">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-[14px] font-bold text-blue-600"># {guild.name}</h1>
            <p className="text-[8px] text-slate-400 mt-1">GUILD_ID: {guild.id.slice(0,8)}...</p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
            <span className="text-[10px] bg-green-100 px-3 py-1 border-2 border-black">
                {guild.group_members.length} MEMBERS
            </span>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
        
        {/* LEFT: MEMBER LIST */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          <section className="pixel-box-white flex-1 overflow-y-auto">
            <h2 className="text-[10px] mb-6 underline decoration-double">MEMBER_LIST</h2>
            <div className="space-y-4">
              {guild.group_members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-3 p-2 border-2 border-transparent hover:border-black hover:bg-slate-50 transition-all">
                  <img 
                    src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles?.username}`} 
                    className="pixel-avatar-sm" 
                  />
                  <div className="flex flex-col">
                    <span className="text-[8px] truncate max-w-[120px]">{m.profiles?.username}</span>
                    {m.user_id === guild.creator_id && (
                      <span className="text-[6px] text-amber-600 font-bold">[LEADER]</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* RIGHT: CHAT HUB */}
        <main className="lg:col-span-3 flex flex-col h-full">
          <section className="pixel-box-blue flex-1 flex flex-col min-h-[500px]">
            <h2 className="text-[10px] mb-4 flex items-center gap-2">
                <i className="fas fa-comments"></i> GUILD_CHAT
            </h2>
            <div className="flex-1 bg-white border-4 border-black p-2 overflow-hidden shadow-[inset_4px_4px_0_0_#ddd]">
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