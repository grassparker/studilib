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
    <div className="min-h-screen bg-[#efebe9] p-4 md:p-8 text-[#3e2723] selection:bg-[#ffaa00]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .pixel-font { font-family: 'Press Start 2P', cursive !important; text-transform: uppercase; line-height: 1.5; }
        .pixel-border { border: 4px solid #3e2723; position: relative; }
        
        /* The "Wood Panel" Aesthetic */
        .pixel-card { 
          background: #fffdf5; 
          box-shadow: inset -4px -4px 0px 0px #d7ccc8, 4px 4px 0px 0px #2a1b0a;
          border: 4px solid #3e2723;
        }

        .pixel-card:hover { transform: translate(-2px, -2px); box-shadow: inset -4px -4px 0px 0px #d7ccc8, 6px 6px 0px 0px #2a1b0a; }
        .pixel-card:active { transform: translate(2px, 2px); box-shadow: none; }

        /* Custom Scrollbar for the Guild Strip */
        .guild-strip::-webkit-scrollbar { height: 8px; }
        .guild-strip::-webkit-scrollbar-track { background: #d7ccc8; border: 2px solid #3e2723; }
        .guild-strip::-webkit-scrollbar-thumb { background: #3e2723; }

        .section-label {
          display: inline-block;
          background: #3e2723;
          color: #fffdf5;
          padding: 4px 12px;
          font-size: 8px;
          margin-bottom: 16px;
          clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%);
        }
      `}</style>

      {/* 1. TOP NAV / GUILDS */}
      <section className="mb-12">
        <div className="section-label pixel-font">Available Guilds</div>
        <div className="flex gap-6 overflow-x-auto pb-6 guild-strip outline-none">
          {groups.map(group => (
            <div key={group.id} className="pixel-card p-4 min-w-[160px] flex flex-col items-center group relative">
              <div onClick={() => navigate(`/guild/${group.id}`)} className="cursor-pointer text-center">
                <div className="w-16 h-16 bg-[#efebe9] border-4 border-[#3e2723] flex items-center justify-center mb-3 group-hover:bg-[#ffaa00] transition-colors">
                  <span className="text-2xl">🛡️</span>
                </div>
                <p className="pixel-font text-[7px] mb-2">{group.name}</p>
              </div>
              
              {isAdmin && (
                <div className="flex gap-4 mt-2 opacity-40 hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(group)} className="hover:text-blue-600"><i className="fas fa-cog"></i></button>
                  <button onClick={() => deleteGroup(group.id)} className="hover:text-red-600"><i className="fas fa-skull"></i></button>
                </div>
              )}
            </div>
          ))}
          
          <div onClick={() => openModal()} className="pixel-card p-4 min-w-[160px] bg-[#d7ccc8]/30 border-dashed flex flex-col items-center justify-center cursor-pointer group">
             <div className="w-10 h-10 border-4 border-dashed border-[#3e2723] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <i className="fas fa-plus"></i>
             </div>
             <p className="pixel-font text-[6px]">Forge</p>
          </div>
        </div>
      </section>

      {/* 2. PARTY GRID */}
      <section className="mb-12">
        <div className="section-label pixel-font">The Party</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
          {friends.map(friend => {
            const isOnline = onlineUsers.includes(friend.id);
            return (
              <div key={friend.id} onClick={() => setSelectedFriend(friend)} className="pixel-card p-3 flex flex-col items-center cursor-pointer">
                <div className="relative mb-3">
                  <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} 
                       className={`w-14 h-14 border-4 border-[#3e2723] bg-white ${isOnline ? '' : 'grayscale contrast-125'}`} alt="avatar" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#3e2723] ${isOnline ? 'bg-[#4caf50]' : 'bg-[#9e9e9e]'}`}></div>
                </div>
                <p className="pixel-font text-[6px] text-center w-full truncate">{friend.username}</p>
                <p className={`pixel-font text-[4px] mt-2 ${isOnline ? 'text-[#4caf50]' : 'text-[#8d6e63]'}`}>
                  {isOnline ? 'IN CAMP' : 'ON JOURNEY'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. LOG FOOTER */}
      <section className="max-w-3xl mx-auto">
        <div className="section-label pixel-font">Realm Records</div>
        <div className="pixel-card p-6 space-y-4">
          {groups.slice(0, 3).map((group, i) => (
            <div key={group.id} className="flex items-center gap-4 text-[7px] pixel-font border-b-2 border-[#d7ccc8] pb-4 last:border-0 last:pb-0">
              <span className="text-[#8d6e63]">0{i+1}</span>
              <span className="flex-1">Guild <span className="text-[#4caf50] underline">{group.name}</span> is recruiting heroes.</span>
              <button onClick={() => navigate(`/guild/${group.id}`)} className="text-[#3e2723] hover:text-[#ffaa00]"><i className="fas fa-arrow-right"></i></button>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#2a1b0a]/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="pixel-card p-8 w-full max-w-md bg-[#fffdf5] animate-in zoom-in-95 duration-200">
            <h2 className="pixel-font text-[10px] mb-8 border-b-4 border-[#3e2723] pb-4">
              {editingGroup ? 'Modify Guild' : 'Found New Guild'}
            </h2>
            <input 
              autoFocus
              className="w-full p-4 mb-8 pixel-font text-[8px] border-4 border-[#3e2723] bg-[#efebe9] focus:bg-white outline-none transition-colors" 
              placeholder="NAMING..." 
              value={groupNameInput} 
              onChange={e => setGroupNameInput(e.target.value)} 
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleSaveGroup} className="flex-1 bg-[#4caf50] text-white p-4 pixel-font text-[8px] pixel-border shadow-[4px_4px_0_0_#1b5e20] active:shadow-none active:translate-y-1">
                {editingGroup ? 'UPDATE' : 'CONFIRM'}
              </button>
              <button onClick={closeModal} className="flex-1 bg-white p-4 pixel-font text-[8px] pixel-border shadow-[4px_4px_0_0_#d7ccc8] active:shadow-none active:translate-y-1">
                CANCEL
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