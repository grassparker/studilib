import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';

interface OverviewProps {
  user: User;
}

export const Overview: React.FC<OverviewProps> = ({ user }) => {
  const { t } = useTranslation();
  const [todaysQuests, setTodaysQuests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTodaysData = useCallback(async () => {
    if (!user?.id) return;

    // 1. Fetch unified Quests (Events + Tasks) for Today
    const { data: scheduleData } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', todayStr)
      .order('start_time', { ascending: true });

    if (scheduleData) setTodaysQuests(scheduleData);

    // 2. Fetch Friends
    const { data: friendshipData } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id);
    if (friendshipData && friendshipData.length > 0) {
      const friendIds = friendshipData.map(f => f.friend_id);
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendIds);
      if (profiles) setFriends(profiles);
    }
    setLoading(false);
  }, [user.id, todayStr]);

  useEffect(() => {
    fetchTodaysData();
    
    const channel = supabase.channel('online-players', {
      config: { presence: { key: user.id } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => { channel.unsubscribe(); };
  }, [user.id, fetchTodaysData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4 pb-32 md:pb-8 min-h-full pixel-font uppercase overflow-y-auto pattern-dirt-dim">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
        
        .pixel-font { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
        
        /* Dimmed Dirt Background */
        .pattern-dirt-dim {
          background-color: #3e2723; /* Darker brown base */
          background-image: repeating-linear-gradient(45deg, #2a1b0a 0, #2a1b0a 1px, transparent 0, transparent 50%),
                            repeating-linear-gradient(-45deg, #2a1b0a 0, #2a1b0a 1px, #3e2723 0, #3e2723 50%);
          background-size: 12px 12px;
        }

        .pixel-box-parchment {
          border: 4px solid #1b262a;
          box-shadow: 8px 8px 0 0 rgba(0,0,0,0.3);
          background: #efebe9; /* Dimmer parchment / Stone grey-wash */
          background-image: radial-gradient(#d7ccc8 1px, transparent 1px);
          background-size: 24px 24px;
          padding: 1.5rem;
        }

        /* Improved Path Layout */
        .timeline-gutter {
          position: absolute;
          left: 65px;
          top: 0;
          bottom: 0;
          width: 8px;
          background: #bcaaa4;
          border-left: 3px solid #3e2723;
          border-right: 3px solid #3e2723;
          opacity: 0.4;
        }

        .quest-node-v2 {
          position: relative;
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
          align-items: flex-start;
        }

        .time-seal {
          width: 60px;
          text-align: right;
          font-size: 7px;
          color: #5d4037;
          font-weight: bold;
          padding-top: 14px;
        }

        .node-marker {
          width: 36px;
          height: 36px;
          background: #fffdf5;
          border: 4px solid #3e2723;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          flex-shrink: 0;
          box-shadow: 4px 4px 0 0 rgba(0,0,0,0.2);
        }

        .badge-task { 
          background: #3e2723; /* Dark Brown for standard quests */
          color: #fff; 
        }

        .badge-event { 
          background: #d4a373; /* Golden/Amber for fixed events/calls */
          color: #3e2723;
          border: 1px solid #3e2723;
        }

        .quest-card-v2 {
          flex: 1;
          background: #fffdf5;
          border: 4px solid #3e2723;
          padding: 14px;
          box-shadow: 6px 6px 0 0 rgba(62,39,35,0.1);
          transition: transform 0.1s;
        }
        .quest-card-v2:hover { transform: translateX(4px); }

        .status-badge {
          font-size: 6px;
          padding: 2px 6px;
          background: #3e2723;
          color: #fffdf5;
        }

        .btn-party {
          background: #4e342e;
          border: 4px solid #1b262a;
          color: #d7ccc8;
          padding: 12px;
          font-size: 8px;
          text-align: center;
          box-shadow: 4px 4px 0 0 #000;
        }
      `}</style>

      {/* LEFT COLUMN: THE DAY'S PATH */}
      <div className="lg:col-span-2 space-y-6">
        <section className="p-6 relative pattern-grass border-4 border-[#1b5e20] shadow-[8px_8px_0_0_rgba(0,0,0,0.4)]">
          <h1 className="text-[10px] md:text-sm text-white mb-2 drop-shadow-md">🌿 {t('hello')}, {user.username}!</h1>
          <div className="flex justify-between items-center">
            <p className="text-[7px] md:text-[8px] text-white opacity-90 italic">"THE FOREST WHISPERS YOUR NEXT MOVE."</p>
            <span className="text-[8px] bg-white/20 px-2 py-1 text-white border border-white/40">{todayStr}</span>
          </div>
        </section>

        <section className="pixel-box-parchment relative min-h-[600px]">
          <h3 className="text-[10px] font-bold text-[#3e2723] mb-10 flex items-center gap-3">
            <i className="fas fa-scroll"></i> {t('active_quests')}
          </h3>

          <div className="relative">
            <div className="timeline-gutter"></div>

            {todaysQuests.length > 0 ? todaysQuests.map((quest) => {
              const questHour = parseInt(quest.start_time.split(':')[0]);
              const currentHour = new Date().getHours();
              const isPast = questHour < currentHour;
              const isNow = questHour === currentHour;

              return (
                <div key={quest.id} className={`quest-node-v2 ${isPast ? 'opacity-40 grayscale' : ''}`}>
                  <div className="time-seal">{quest.start_time.slice(0, 5)}</div>
                  
                  <div className={`node-marker ${isNow ? 'bg-[#ffaa00] !border-[#ffaa00] scale-110 shadow-[0_0_15px_#ffaa00]' : 'bg-white'}`}>
                    <i className={`fas ${quest.task_type === 'call' ? 'fa-mountain' : 'fa-leaf'} text-[12px] ${isNow ? 'text-white' : 'text-[#3e2723]'}`}></i>
                  </div>

                  <div className="quest-card-v2">
                    <div className="flex justify-between items-start mb-2">
                      <span className="status-badge">{quest.task_type}</span>
                      {isNow && <span className="text-[6px] text-orange-600 animate-pulse font-bold">CURRENT OBJECTIVE</span>}
                    </div>
                    <p className="text-[9px] md:text-[10px] text-[#3e2723] font-bold leading-normal">{quest.title}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="ml-24 py-24 text-center border-4 border-dashed border-[#bcaaa4]">
                <p className="text-[8px] text-[#5d4037] mb-4">THE PATH IS CLEAR... TOO CLEAR.</p>
                <a href="/app/schedule" className="inline-block text-[8px] bg-[#3e2723] text-white px-4 py-2">SCRIBE NEW QUESTS</a>
              </div>
            )}
            
            {/* FINISH LINE */}
            <div className="quest-node-v2 mt-8">
                <div className="time-seal">DUSK</div>
                <div className="node-marker bg-[#1b262a] !border-[#1b262a] text-white">
                    <i className="fas fa-campground"></i>
                </div>
                <div className="pt-4">
                    <p className="text-[7px] text-[#5d4037] font-bold">REST AT THE CAMPFIRE</p>
                </div>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: SOCIAL & SYSTEM */}
      <div className="space-y-8">
        <section className="pixel-box-parchment">
          <h3 className="text-[10px] mb-8 underline text-[#3e2723]"><i className="fas fa-compass mr-2"></i> FELLOW TRAVELERS</h3>
          <div className="space-y-6">
            {friends.map((friend) => {
              const isOnline = onlineUsers.includes(friend.id);
              return (
                <div key={friend.id} className="flex items-center gap-4 group">
                  <div className={`w-12 h-12 border-4 border-[#3e2723] bg-[#d7ccc8] shrink-0 ${!isOnline && 'grayscale opacity-30'}`}>
                    <img 
                      src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                      alt={friend.username} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className={`text-[8px] font-bold truncate ${isOnline ? 'text-green-800' : 'text-[#8d6e63]'}`}>{friend.username}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 ${isOnline ? 'bg-green-500 shadow-[0_0_5px_#4caf50]' : 'bg-[#5d4037]'}`}></div>
                      <p className="text-[6px] text-[#5d4037]">{isOnline ? 'ENCOUNTERED' : 'WANDERING'}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <a href="/friends" className="block btn-party hover:bg-[#3e2723] transition-colors">
              [ MANAGE GUILD ]
            </a>
          </div>
        </section>

        <section className="border-4 border-[#1b262a] bg-[#2a1b0a] text-[#d7ccc8] p-6 shadow-[8px_8px_0_0_#1b5e20]">
          <h3 className="text-[10px] mb-4 text-[#81c784]"><i className="fas fa-terminal mr-2"></i> SYSTEM_OUTPUT</h3>
          <div className="border-l-2 border-[#81c784] pl-4 py-1">
            <p className="text-[7px] leading-relaxed italic opacity-80">
                TIME IS THE ONLY RESOURCE THAT DOES NOT REGENERATE. SPEND IT WISELY ON YOUR QUESTS.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};