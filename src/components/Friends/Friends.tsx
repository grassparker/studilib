import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../Auth/supabaseClient';
import { User } from '../../types';
import FriendsProfile from './FriendsProfile';
import { useNavigate } from 'react-router-dom';

export const Friends: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- ADMIN CHECK ---
  const isAdmin = user.email === 'your-email@gmail.com';

  // --- STATE ---
  const [friends, setFriends] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');

  const fetchFriendsAndRequests = useCallback(async () => {
    const { data: friendshipData } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id).eq('status', 'accepted');
    if (friendshipData?.length) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendshipData.map(f => f.friend_id));
      if (profiles) setFriends(profiles);
    }
  }, [user.id]);

  const fetchGroups = useCallback(async () => {
    const { data: groupDetails } = await supabase.from('groups').select('*, group_members(user_id, profiles(username, avatar_url))');
    if (groupDetails) setGroups(groupDetails);
  }, []);

  useEffect(() => {
    fetchFriendsAndRequests();
    fetchGroups();
    const channel = supabase.channel('online-players', { config: { presence: { key: user.id } } });
    channel.on('presence', { event: 'sync' }, () => setOnlineUsers(Object.keys(channel.presenceState()))).subscribe(async (s) => {
      if (s === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString(), username: user.email });
    });
    return () => { channel.unsubscribe(); };
  }, [user.id, fetchFriendsAndRequests, fetchGroups]);

  // --- ACTIONS ---
  const handleSaveGroup = async () => {
    if (!groupNameInput.trim()) return;
    if (editingGroup) {
      await supabase.from('groups').update({ name: groupNameInput.toUpperCase() }).eq('id', editingGroup.id);
    } else {
      await supabase.from('groups').insert([{ name: groupNameInput.toUpperCase(), created_by: user.id }]);
    }
    fetchGroups();
    closeModal();
  };

  const deleteGroup = async (id: string) => {
    if (!window.confirm("DISBAND THIS GUILD?")) return;
    await supabase.from('groups').delete().eq('id', id);
    fetchGroups();
  };

  const openModal = (group: any = null) => {
    setEditingGroup(group);
    setGroupNameInput(group ? group.name : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-[#000d3d] via-[#1a478a] to-[#7a98b9] p-4 md:p-8 tech-font text-white selection:bg-[#e6ccb2] selection:text-[#000d3d]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;700&display=swap');
        
        .tech-font { font-family: 'Inter', sans-serif; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .glass-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
        }

        .btn-horizon {
          background: rgba(230, 204, 178, 0.1);
          border: 1px solid rgba(230, 204, 178, 0.2);
          color: #e6ccb2;
          font-family: 'Press Start 2P', monospace;
          transition: all 0.3s ease;
        }

        .btn-horizon:hover {
          background: #e6ccb2;
          color: #000d3d;
          box-shadow: 0 0 15px rgba(230, 204, 178, 0.3);
        }

        .guild-strip::-webkit-scrollbar { height: 4px; }
        .guild-strip::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .guild-strip::-webkit-scrollbar-thumb { background: #e6ccb2; border-radius: 10px; }

        .status-pulse {
          box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.7);
          animation: pulse-blue 2s infinite;
        }

        @keyframes pulse-blue {
          0% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(96, 165, 250, 0); }
          100% { box-shadow: 0 0 0 0 rgba(96, 165, 250, 0); }
        }
      `}</style>

      <div className="max-w-350 mx-auto space-y-12 pb-20">
        
        {/* 1. GUILDS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="pixel-font text-[9px] md:text-[11px] text-blue-300 tracking-widest flex items-center gap-3">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              {t('Available Guilds')}
            </h2>
          </div>
          
          <div className="flex gap-6 overflow-x-auto pb-6 guild-strip outline-none snap-x">
            {groups.map(group => (
              <div key={group.id} className="glass-card p-6 min-w-50 flex flex-col items-center group relative snap-center">
                <div onClick={() => navigate(`/guild/${group.id}`)} className="cursor-pointer text-center w-full">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-4 group-hover:border-[#e6ccb2] transition-colors shadow-xl">
                    <span className="text-3xl filter drop-shadow-md">🛡️</span>
                  </div>
                  <p className="pixel-font text-[8px] mb-2 text-white truncate px-2">{group.name}</p>
                </div>
                
                {isAdmin && (
                  <div className="flex gap-4 mt-4 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(group)} className="text-xs hover:text-blue-300"><i className="fas fa-cog"></i></button>
                    <button onClick={() => deleteGroup(group.id)} className="text-xs hover:text-red-400"><i className="fas fa-skull"></i></button>
                  </div>
                )}
              </div>
            ))}
            
            <div onClick={() => openModal()} className="glass-card p-6 min-w-50 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer group snap-center">
               <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:border-[#e6ccb2] transition-all">
                  <i className="fas fa-plus text-[#e6ccb2]"></i>
               </div>
               <p className="pixel-font text-[7px] text-white/50 group-hover:text-[#e6ccb2]">{t('forge_guild')}</p>
            </div>
          </div>
        </section>

        {/* 2. THE PARTY GRID */}
        <section>
          <h2 className="pixel-font text-[9px] md:text-[11px] text-[#e6ccb2] mb-8 tracking-widest">
            {t('party')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {friends.map(friend => {
              const isOnline = onlineUsers.includes(friend.id);
              return (
                <div key={friend.id} onClick={() => setSelectedFriend(friend)} className="glass-card p-5 flex flex-col items-center cursor-pointer text-center relative overflow-hidden">
                  <div className="relative mb-4">
                    <div className={`p-1 rounded-full border-2 transition-all duration-500 ${isOnline ? 'border-blue-400 rotate-6 shadow-[0_0_15px_rgba(96,165,250,0.3)]' : 'border-transparent grayscale opacity-60'}`}>
                      <img 
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                        className="w-16 h-16 rounded-full object-cover bg-[#000d3d]" 
                        alt="avatar" 
                      />
                    </div>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-blue-400 border-2 border-[#1a478a] rounded-full status-pulse"></span>
                    )}
                  </div>
                  <p className="font-bold text-sm tracking-tight text-white mb-1 truncate w-full">{friend.username}</p>
                  <p className={`pixel-font text-[5px] uppercase tracking-tighter ${isOnline ? 'text-blue-300' : 'text-white/20'}`}>
                    {isOnline ? t('uplink_live') : t('offline')}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. REALM RECORDS */}
        <section className="max-w-4xl">
          <div className="glass-card p-8 border-blue-400/10">
            <h3 className="pixel-font text-[8px] text-white/40 mb-8 flex items-center gap-3">
              <i className="fas fa-scroll opacity-30"></i> {t('realm_records')}
            </h3>
            <div className="space-y-6">
              {groups.slice(0, 3).map((group, i) => (
                <div key={group.id} className="flex items-center gap-6 group border-b border-white/5 pb-6 last:border-0 last:pb-0">
                  <span className="tech-font text-xs font-bold text-blue-300/30">0{i+1}</span>
                  <div className="flex-1">
                    <p className="tech-font text-sm text-white/80">
                      Guild <span className="text-[#e6ccb2] font-bold">{group.name}</span> is transmitting recruitment signals.
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate(`/guild/${group.id}`)} 
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-[#e6ccb2] hover:text-[#000d3d] transition-all"
                  >
                    <i className="fas fa-chevron-right text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* MODAL overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-200 bg-[#000d3d]/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="glass-card p-8 md:p-10 w-full max-w-md border-[#e6ccb2]/20 shadow-2xl">
            <h2 className="pixel-font text-[10px] text-[#e6ccb2] mb-8 border-b border-white/10 pb-6 uppercase tracking-widest">
              {editingGroup ? 'Modify Guild' : 'Found New Guild'}
            </h2>
            <input 
              autoFocus
              className="w-full bg-white/5 p-4 mb-8 tech-font text-white border border-white/10 rounded-xl focus:border-[#e6ccb2] outline-none transition-all placeholder:text-white/20" 
              placeholder="Designation naming..." 
              value={groupNameInput} 
              onChange={e => setGroupNameInput(e.target.value)} 
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleSaveGroup} 
                className="btn-horizon flex-1 py-4 text-[8px] rounded-xl"
              >
                {editingGroup ? 'Update Protocol' : 'Confirm Forge'}
              </button>
              <button 
                onClick={closeModal} 
                className="flex-1 py-4 text-[8px] pixel-font text-white/40 hover:text-white transition-colors"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedFriend && (
        <FriendsProfile isOpen={true} onClose={() => setSelectedFriend(null)} user={selectedFriend} />
      )}
    </div>
  );
};