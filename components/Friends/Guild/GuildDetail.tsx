import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../Auth/supabaseClient';
import { Chat } from './Chat';
import { SharedPomodoro } from './SharedPomodoro';

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

  const pixelStyles = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      
      .social-scope { 
          font-family: 'Press Start 2P', monospace !important; 
          text-transform: uppercase;
          background-color: #f0f0f0;
      }

      /* Containers */
      .pixel-box-white { border: 4px solid black; background: white; box-shadow: 6px 6px 0 0 rgba(0,0,0,0.1); padding: 15px; }
      .pixel-box-blue { border: 4px solid black; background: #e0f2fe; box-shadow: 6px 6px 0 0 #7dd3fc; padding: 15px; }
      
      /* Buttons */
      .pixel-btn-action { border: 4px solid black; background: #ffaa00; padding: 8px; box-shadow: inset -3px -3px 0 0 #cc8800; cursor: pointer; display: flex; align-items: center; gap: 8px; }
      .pixel-btn-action:active { box-shadow: inset 3px 3px 0 0 #cc8800; transform: translateY(1px); }

      /* Scrollbar Logic */
      .custom-scroll { overflow-y: auto; scrollbar-width: thin; scrollbar-color: black #eee; }
      .custom-scroll::-webkit-scrollbar { width: 8px; }
      .custom-scroll::-webkit-scrollbar-track { background: #eee; border-left: 2px solid black; }
      .custom-scroll::-webkit-scrollbar-thumb { background: black; border: 2px solid #eee; }

      /* Text Wrap Fix for Chat */
      .social-scope * { overflow-wrap: break-word; word-wrap: break-word; }
    `}</style>
  );

  if (!guild) return <div className="social-scope h-screen flex items-center justify-center">LOADING_DATA...</div>;

  return (
    <div className="social-scope h-screen flex flex-col p-4 md:p-6 overflow-hidden">
      {pixelStyles}

      {/* HEADER - Shrink-0 prevents it from squishing */}
      <header className="pixel-box-white flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="pixel-btn-action bg-slate-200 !shadow-none">
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="text-[10px] md:text-[14px] font-bold text-blue-600 truncate"># {guild.name}</h1>
        </div>
        <div className="text-[8px] bg-green-100 px-3 py-1 border-2 border-black">
          {guild.group_members.length} ONLINE
        </div>
      </header>

      {/* MAIN VIEWPORT - This grid fills the remaining screen height */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* LEFT: PARTY LIST (2 Columns) */}
        <aside className="lg:col-span-2 order-2 lg:order-1 flex flex-col min-h-0">
          <section className="pixel-box-white flex-1 flex flex-col min-h-0">
            <h2 className="text-[8px] mb-4 underline shrink-0">PARTY</h2>
            <div className="flex-1 custom-scroll space-y-3 pr-2">
              {guild.group_members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-2 border-b border-dotted border-slate-200 pb-2">
                  <div className="w-6 h-6 border-2 border-black bg-white shrink-0 overflow-hidden">
                    <img src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${m.profiles?.username}`} alt="avatar" />
                  </div>
                  <span className="text-[6px] truncate">{m.profiles?.username}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* CENTER: MISSION CLOCK (7 Columns) */}
        <main className="lg:col-span-7 order-1 lg:order-2 flex flex-col min-h-0">
          <section className="pixel-box-white flex-1 flex flex-col items-center justify-center relative bg-white">
            <div className="absolute top-4 left-4 text-[6px] text-slate-300">MOD_CORE_SYNC: OK</div>
            <h2 className="text-[10px] mb-8 tracking-[0.2em]">[ MISSION_CLOCK ]</h2>
            
            <div className="w-full flex justify-center">
               <SharedPomodoro 
                  groupId={guild.id} 
                  isLeader={user.id === guild.creator_id} 
                />
            </div>

            <div className="mt-12 text-[6px] text-slate-400 animate-pulse">
               AWAITING_COMMAND_FROM_LEADER...
            </div>
          </section>
        </main>

        {/* RIGHT: COMMS (3 Columns) */}
        <aside className="lg:col-span-3 order-3 flex flex-col min-h-0">
          <section className="pixel-box-blue flex-1 flex flex-col overflow-hidden">
            <h2 className="text-[8px] mb-2 flex items-center gap-2 shrink-0">
                <i className="fas fa-comments"></i> COMMS_LINK
            </h2>
            <div className="flex-1 bg-white border-4 border-black flex flex-col overflow-hidden">
                {/* Scroll container for Chat */}
                <div className="flex-1 custom-scroll p-2">
                    <Chat 
                      groupId={guild.id} 
                      userId={user.id} 
                      username={user.username || user.email?.split('@')[0] || 'Hero'} 
                    />
                </div>
            </div>
          </section>
        </aside>

      </div>
    </div>
  );
};