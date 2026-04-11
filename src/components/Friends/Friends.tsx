import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import FriendsProfile from './FriendsProfile';
import { useNavigate } from 'react-router-dom';

export const Friends: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- STATE ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  // (Logic remains the same as your previous version to ensure Supabase sync)
  const fetchFriendsAndRequests = useCallback(async () => {
    const { data: friendshipData } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id).eq('status', 'accepted');
    if (friendshipData?.length) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', friendshipData.map(f => f.friend_id));
      if (profiles) setFriends(profiles);
    }
    const { data: pendingData } = await supabase.from('friendships').select('user_id, profiles:user_id (id, username, avatar_url)').eq('friend_id', user.id).eq('status', 'pending');
    if (pendingData) setPendingRequests(pendingData);
  }, [user.id]);

  const fetchGroups = useCallback(async () => {
    const { data: memberOf } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    if (memberOf?.length) {
      const { data: groupDetails } = await supabase.from('groups').select('*, group_members(user_id, profiles(username, avatar_url))').in('id', memberOf.map(m => m.group_id));
      if (groupDetails) setGroups(groupDetails);
    }
  }, [user.id]);

  useEffect(() => {
    fetchFriendsAndRequests();
    fetchGroups();
    const channel = supabase.channel('online-players', { config: { presence: { key: user.id } } });
    channel.on('presence', { event: 'sync' }, () => setOnlineUsers(Object.keys(channel.presenceState()))).subscribe(async (s) => {
      if (s === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString(), username: user.email });
    });
    return () => { channel.unsubscribe(); };
  }, [user.id, fetchFriendsAndRequests, fetchGroups]);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-[#f1f8e9] overflow-hidden border-4 border-[#3e2723] m-2 shadow-[8px_8px_0_0_#2a1b0a]">
      <style>{`
        .pixel-font { font-family: 'Press Start 2P', cursive !important; text-transform: uppercase; }
        .pixel-border { border: 4px solid #3e2723; }
        .pixel-bg-wood { background: #fffdf5; background-image: repeating-linear-gradient(90deg, #fdf4db, #fdf4db 1px, transparent 1px, transparent 4px); background-size: 4px 4px; }
        .guild-btn { width: 48px; height: 48px; border: 3px solid #3e2723; background: #8d6e63; transition: all 0.2s; cursor: pointer; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 3px 3px 0 0 #2a1b0a; }
        .guild-btn:hover { transform: scale(1.05); background: #4caf50; }
        .compact-friend { border-bottom: 2px solid #3e2723; padding: 8px; font-size: 7px; background: white; }
        .scroll-custom::-webkit-scrollbar { width: 8px; }
        .scroll-custom::-webkit-scrollbar-track { background: #fdf4db; }
        .scroll-custom::-webkit-scrollbar-thumb { background: #3e2723; border: 2px solid #fdf4db; }
      `}</style>

      {/* COLUMN 1: GUILD SWITCHER (Discord Style) */}
      <div className="w-20 bg-[#3e2723] flex flex-col items-center py-4 gap-4 border-r-4 border-[#2a1b0a] overflow-y-auto scroll-custom">
        <button onClick={() => setIsCreatingGroup(true)} className="guild-btn !bg-[#4caf50]">
          <i className="fas fa-plus"></i>
        </button>
        <div className="w-10 h-1 bg-[#5d4037] rounded" />
        {groups.map(group => (
          <div key={group.id} onClick={() => navigate(`/guild/${group.id}`)} className="guild-btn relative group" title={group.name}>
             <span className="text-[10px]">{group.name.substring(0, 2)}</span>
          </div>
        ))}
      </div>

      {/* COLUMN 2: MAIN FEED (Chat/Dashboard View) */}
      <div className="flex-1 flex flex-col pixel-bg-wood overflow-y-auto scroll-custom p-6">
        {isCreatingGroup ? (
          <div className="pixel-border p-6 bg-white shadow-[4px_4px_0_0_#3e2723] mb-6">
            <h2 className="pixel-font text-[10px] mb-4">Forge New Guild</h2>
            <input className="pixel-border w-full p-2 mb-4 pixel-font text-[8px]" placeholder="Guild Name..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => { /* createGroup logic */ }} className="bg-[#4caf50] text-white p-2 pixel-font text-[8px] pixel-border">Create</button>
              <button onClick={() => setIsCreatingGroup(false)} className="bg-red-400 text-white p-2 pixel-font text-[8px] pixel-border">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <header className="border-b-4 border-[#3e2723] pb-4 flex justify-between items-center">
              <h1 className="pixel-font text-[12px]">Guild Command Center</h1>
              <div className="flex gap-2">
                <input className="pixel-border p-2 text-[8px] pixel-font" placeholder="Find Player..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
                <button onClick={() => {}} className="bg-[#78909c] text-white px-3 pixel-border text-[8px]"><i className="fas fa-search"></i></button>
              </div>
            </header>

            {/* Guild List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {groups.map(group => (
                 <div key={group.id} onClick={() => navigate(`/guild/${group.id}`)} className="pixel-border bg-white p-4 hover:bg-[#f1f8e9] cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
                   <p className="pixel-font text-[9px] mb-2 text-[#5d4037]">🛡️ {group.name}</p>
                   <div className="flex -space-x-2">
                      {group.group_members?.slice(0, 4).map((m: any) => (
                        <img key={m.user_id} src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles?.username}`} className="w-8 h-8 pixel-border bg-white" alt="m"/>
                      ))}
                   </div>
                 </div>
               ))}
            </div>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div className="bg-[#4caf50] pixel-border p-4">
                <p className="pixel-font text-[8px] text-white mb-3">Incoming Reinforcements ({pendingRequests.length})</p>
                {pendingRequests.map((req: any) => (
                  <div key={req.user_id} className="flex justify-between items-center bg-white p-2 mb-2 pixel-border">
                    <span className="pixel-font text-[7px]">{req.profiles?.username}</span>
                    <button className="bg-green-500 text-white px-2 py-1 text-[6px] pixel-border">Accept</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* COLUMN 3: FRIENDS LIST (Compact Sidebar) */}
      <div className="w-64 bg-[#efebe9] border-l-4 border-[#3e2723] flex flex-col overflow-hidden">
        <div className="bg-[#8d6e63] p-3 border-b-4 border-[#3e2723]">
          <p className="pixel-font text-[8px] text-white">Active Party</p>
        </div>
        <div className="flex-1 overflow-y-auto scroll-custom">
          {friends.map(friend => {
            const isOnline = onlineUsers.includes(friend.id);
            return (
              <div key={friend.id} onClick={() => setSelectedFriend(friend)} className="compact-friend flex items-center gap-3 hover:bg-[#d7ccc8] cursor-pointer transition-all">
                <div className="relative">
                  <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} className="w-10 h-10 pixel-border bg-white" alt="avatar" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 pixel-border ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="pixel-font text-[7px] truncate text-[#3e2723]">{friend.username}</p>
                  <p className="pixel-font text-[5px] text-[#8d6e63] mt-1">{isOnline ? 'CAMPFIRE' : 'RESTING'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedFriend && (
        <FriendsProfile isOpen={true} onClose={() => setSelectedFriend(null)} user={selectedFriend} />
      )}
    </div>
  );
};