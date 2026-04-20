import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';

interface OverviewProps {
  user: User;
}

export const Overview: React.FC<OverviewProps> = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [todaysQuests, setTodaysQuests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchTodaysData = useCallback(async () => {
    if (!user?.id) return;

    const { data: scheduleData } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', user.id)
      .eq('task_date', todayStr)
      .order('start_time', { ascending: true });

    if (scheduleData) setTodaysQuests(scheduleData);

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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#000d3d]">
      <div className="w-24 h-0.5 bg-white/10 mb-4 overflow-hidden rounded-full">
        <div className="h-full bg-blue-300 animate-[progress_1.5s_infinite]"></div>
      </div>
      <p className="pixel-font text-[7px] text-blue-200 tracking-[0.3em] uppercase animate-pulse">
        {t('initializing_system')}
      </p>
    </div>
  );

  return (
    <div className="relative min-h-full tech-font text-slate-100 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;700&display=swap');
        
        .tech-font { font-family: 'Inter', sans-serif; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .glass-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
        }

        .timeline-stream {
          position: absolute;
          left: 19px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.1) 15%, rgba(255, 255, 255, 0.1) 85%, transparent);
        }

        .btn-horizon {
          background: rgba(230, 204, 178, 0.1);
          border: 1px solid rgba(230, 204, 178, 0.2);
          color: #e6ccb2;
          padding: 12px 24px;
          font-size: 8px;
          border-radius: 12px;
          font-family: 'Press Start 2P', monospace;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-horizon:hover { 
          background: #e6ccb2; 
          color: #000d3d;
          transform: translateY(-2px);
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      <div className="max-w-350 mx-auto p-4 md:p-8 space-y-8 pb-32 lg:pb-8">
        
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 border-b border-white/5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse"></span>
              <p className="pixel-font text-[7px] text-blue-200 tracking-widest uppercase">
                {t('system_status')}: {t('status_active')}
              </p>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {t('welcome_operator')}, <span className="text-blue-300">{user.username}</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="pixel-font text-[7px] text-slate-400 uppercase">Ref_Node // {todayStr}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* MAIN COLUMN: PROTOCOLS */}
          <div className="lg:col-span-8 space-y-6">
            <section className="glass-card p-6 md:p-8">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <i className="fas fa-wave-square text-blue-300 text-sm"></i>
                  <h3 className="pixel-font text-[9px] text-white/80 uppercase tracking-widest">
                    {t('focus_data_stream')}
                  </h3>
                </div>
                <div className="hidden sm:block h-px flex-1 mx-8 bg-white/5"></div>
              </div>

              <div className="relative pl-2 sm:pl-4">
                <div className="timeline-stream"></div>

                {todaysQuests.length > 0 ? todaysQuests.map((quest) => {
                  const currentHour = new Date().getHours();
                  const questHour = parseInt(quest.start_time.split(':')[0]);
                  const isNow = questHour === currentHour;
                  const isPast = questHour < currentHour;

                  return (
                    <div key={quest.id} className={`relative flex gap-6 sm:gap-10 mb-8 items-start transition-opacity duration-500 ${isPast ? 'opacity-30' : 'opacity-100'}`}>
                      <div className="w-12 font-mono text-[11px] text-slate-400 pt-1 font-bold">{quest.start_time.slice(0, 5)}</div>
                      
                      <div className={`w-3 h-3 mt-1.5 z-10 rounded-full border-2 border-[#000d3d] transition-all duration-500 ${isNow ? 'bg-blue-300 scale-125 shadow-[0_0_12px_#93c5fd]' : 'bg-slate-700'}`}></div>
                      
                      <div className={`flex-1 p-5 rounded-2xl border transition-all duration-300 ${isNow ? 'bg-blue-400/10 border-blue-400/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className={`text-sm font-bold mb-1 uppercase tracking-wide ${isNow ? 'text-blue-200' : 'text-slate-100'}`}>{quest.title}</p>
                            <span className="text-[7px] pixel-font text-slate-500 uppercase">{quest.task_type}</span>
                          </div>
                          {isNow && (
                            <div className="flex items-center gap-2">
                               <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                              <span className="pixel-font text-[6px] text-blue-300 uppercase">{t('uplink_live')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-16 text-center glass-card bg-transparent">
                    <i className="fas fa-satellite-dish text-slate-600 text-3xl mb-6"></i>
                    <p className="pixel-font text-[8px] text-slate-500 mb-8 tracking-widest leading-loose">
                      {t('no_protocols_detected')}
                    </p>
                    <button onClick={() => navigate('/app/schedule')} className="btn-horizon">
                      {t('new_entry')}
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* SIDEBAR: SOCIAL & SYSTEM */}
          <div className="lg:col-span-4 space-y-6">
            <section className="glass-card p-6 md:p-8">
              <h3 className="pixel-font text-[8px] text-slate-400 uppercase tracking-widest mb-10 flex items-center justify-between">
                {t('active_uplinks')}
                <span className="text-[10px] text-blue-300/50">{friends.length}</span>
              </h3>
              
              <div className="space-y-6">
                {friends.length > 0 ? friends.map((friend) => {
                  const isOnline = onlineUsers.includes(friend.id);
                  return (
                    <div key={friend.id} className="flex items-center gap-4 group">
                      <div className="relative">
                        <div className={`p-0.5 rounded-full border transition-all duration-500 ${isOnline ? 'border-blue-400 rotate-12' : 'border-transparent grayscale'}`}>
                          <img 
                            src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                            className="w-10 h-10 rounded-full object-cover" 
                            alt={friend.username}
                          />
                        </div>
                        {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-400 border-2 border-[#1a478a] rounded-full"></span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold truncate transition-colors ${isOnline ? 'text-white' : 'text-slate-500'}`}>{friend.username}</p>
                        <p className="text-[7px] pixel-font text-slate-600 uppercase mt-1">
                          {isOnline ? t('transmitting') : t('idle')}
                        </p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-6">
                    <p className="text-[7px] pixel-font text-slate-600 uppercase">{t('scanning_signals')}</p>
                  </div>
                )}
                
                <button onClick={() => navigate('/app/social')} className="w-full btn-horizon !text-[7px] mt-4">
                  {t('social_hub')}
                </button>
              </div>
            </section>

            <section className="glass-card p-6 md:p-8 border-blue-400/10">
              <h3 className="pixel-font text-[7px] text-blue-300 mb-6 flex items-center gap-3">
                <i className="fas fa-terminal opacity-50"></i> {t('system_log')}
              </h3>
              <p className="text-[11px] leading-relaxed font-medium text-slate-400 italic bg-white/5 p-4 rounded-xl">
                "{t('focus_mantra')}"
              </p>
              <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/5">
                 <button onClick={() => navigate('/updates')} className="text-[7px] pixel-font text-slate-500 hover:text-blue-300 transition-colors uppercase tracking-tighter">
                   {t('view_updates')}
                 </button>
                 <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400/40" style={{ width: '45%' }}></div>
                 </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};