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

  // --- 1. FETCH FRIENDS & PENDING ---
  const fetchFriendsAndRequests = useCallback(async () => {
    // Fetch Accepted Friends
    const { data: friendshipData } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (friendshipData && friendshipData.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', friendshipData.map(f => f.friend_id));
      if (profiles) setFriends(profiles);
    } else {
      setFriends([]);
    }

    // Fetch Pending (Where YOU are the friend_id, and someone else is the user_id)
    const { data: pendingData } = await supabase
      .from('friendships')
      .select('user_id, profiles:user_id (id, username, avatar_url)')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (pendingData) {
      setPendingRequests(pendingData);
    }
  }, [user.id]);

  const fetchGroups = useCallback(async () => {
    const { data: memberOf } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (memberOf && memberOf.length > 0) {
      const groupIds = memberOf.map(m => m.group_id);
      const { data: groupDetails } = await supabase
        .from('groups')
        .select('*, group_members(user_id, profiles(username, avatar_url))')
        .in('id', groupIds);
      if (groupDetails) setGroups(groupDetails);
    } else {
      setGroups([]);
    }
  }, [user.id]);

  useEffect(() => {
    fetchFriendsAndRequests();
    fetchGroups();

    const channel = supabase.channel('online-players', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString(), username: user.email });
        }
      });

    return () => { channel.unsubscribe(); };
  }, [user.id, fetchFriendsAndRequests, fetchGroups]);

  // --- ACTIONS ---
  const handleSearch = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('email', searchEmail.trim())
      .single();
    if (data) setSearchResults([data]);
    else alert(t('player_not_found'));
  };

  const sendRequest = async (friendId: string) => {
    if (friendId === user.id) return alert(t('lonely_hero_error'));
    const { error } = await supabase.from('friendships').insert([
        { user_id: user.id, friend_id: friendId, status: 'pending' }
    ]);
    if (error) alert(t('already_pending'));
    else { alert(t('request_sent')); fetchFriendsAndRequests(); }
  };

  const acceptFriend = async (requesterId: string) => {
    // 1. Update their request to accepted
    await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', requesterId).eq('friend_id', user.id);
    // 2. Create reciprocal friendship
    await supabase.from('friendships').insert([{ user_id: user.id, friend_id: requesterId, status: 'accepted' }]);
    fetchFriendsAndRequests();
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    const { data: group } = await supabase.from('groups').insert([{ name: newGroupName, creator_id: user.id }]).select().single();
    if (group) {
      await supabase.from('group_members').insert([{ group_id: group.id, user_id: user.id }]);
      setNewGroupName(''); setIsCreatingGroup(false); fetchGroups();
    }
  };

  const addToGroup = async (groupId: string, friendId: string) => {
    const { error } = await supabase.from('group_members').insert([{ group_id: groupId, user_id: friendId }]);
    if (error) alert("Already in group!");
    else fetchGroups();
  };

  const handleOpenProfile = (friend: any) => {
    setSelectedFriend(friend);
    setIsProfileOpen(true);
  };

  /* No changes made to logic, only the return block for the new Nature-RPG style */
return (
  <div className="social-scope max-w-4xl mx-auto space-y-8 p-4 overflow-hidden pb-32">
    
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');

      .social-scope *:not(i) { 
        font-family: 'Press Start 2P', 'LXGW WenKai TC' , monospace !important; 
        text-transform: uppercase; 
      }
      .social-scope i { font-family: "Font Awesome 6 Free" !important; font-weight: 900; text-transform: none !important; }

      /* Nature RPG Containers */
      .pixel-box-wood { 
        border: 4px solid #3e2723; 
        background: #fffdf5; /* Parchment */
        background-image: repeating-linear-gradient(90deg, #fdf4db, #fdf4db 2px, transparent 2px, transparent 4px),
                          repeating-linear-gradient(0deg, #fdf4db, #fdf4db 2px, transparent 2px, transparent 4px);
        background-size: 8px 8px;
        box-shadow: 8px 8px 0 0 #2a1b0a; 
        padding: 20px; 
      }

      .pixel-box-grass { 
        border: 4px solid #1b5e20; 
        background: #4caf50; 
        background-image: linear-gradient(0deg, #388e3c 1px, transparent 1px),
                          linear-gradient(90deg, #388e3c 1px, transparent 1px);
        background-size: 8px 8px;
        box-shadow: 8px 8px 0 0 #1b262a; 
        padding: 20px; 
      }

      .pixel-input-field { 
        border: 4px solid #5d4037; 
        padding: 12px; 
        background: #fdfbf7; 
        outline: none; 
        font-size: 10px; 
        width: 100%; 
        color: #3e2723;
      }

      .pixel-btn-action { 
        border: 4px solid #3e2723; 
        background: #8d6e63; /* Wood brown */
        color: white;
        padding: 10px 15px; 
        box-shadow: 4px 4px 0 0 #2a1b0a; 
        cursor: pointer; 
        font-size: 8px; 
        display: flex; 
        align-items: center; 
        gap: 8px; 
        flex-shrink: 0; 
      }
      .pixel-btn-action:active { 
        box-shadow: 0px 0px 0 0 #2a1b0a; 
        transform: translate(2px, 2px); 
      }

      .pixel-avatar { 
        border: 4px solid #3e2723; 
        background: #efebe9; 
        width: 48px; 
        height: 48px; 
        flex-shrink: 0; 
        image-rendering: pixelated; 
      }
      @media (min-width: 768px) { .pixel-avatar { width: 64px; height: 64px; } }
      
      .guild-card {
        border: 4px solid #5d4037;
        background: white;
        box-shadow: 4px 4px 0 0 rgba(62,39,35,0.1);
      }
    `}</style>

    {/* 1. SEARCH SECTION */}
    <section className="pixel-box-wood">
      <h2 className="text-[10px] md:text-[12px] mb-6 underline decoration-double text-[#3e2723]">🔍 {t('search_players')}</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <input className="pixel-input-field" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} placeholder={t('input_email')} />
        <button onClick={handleSearch} className="pixel-btn-action !bg-[#78909c] whitespace-nowrap">
          <i className="fas fa-binoculars"></i> {t('find')}
        </button>
      </div>
      
      {searchResults.map(result => (
        <div key={result.id} className="mt-6 flex items-center justify-between p-4 border-4 border-[#5d4037] border-dashed bg-[#f1f8e9]/50 gap-4 min-w-0">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <img src={result.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`} className="pixel-avatar" alt="avatar"/>
            <span className="text-[10px] text-[#3e2723] truncate">{result.username}</span>
          </div>
          <button onClick={() => sendRequest(result.id)} className="pixel-btn-action bg-white !text-[#3e2723]">
            <i className="fas fa-handshake"></i> {t('add')}
          </button>
        </div>
      ))}
    </section>

    {/* 2. PENDING REQUESTS */}
    {pendingRequests.length > 0 && (
      <section className="pixel-box-grass">
        <h2 className="text-[10px] md:text-[12px] mb-6 text-white">📜 {t('incoming_requests')}</h2>
        <div className="space-y-4">
          {pendingRequests.map((request: any) => (
            <div key={request.user_id} className="flex items-center justify-between bg-white border-4 border-[#3e2723] p-4 gap-4 min-w-0">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                 <img src={request.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.profiles?.username}`} className="pixel-avatar" alt="avatar"/>
                 <div className="min-w-0 flex-1">
                   <p className="text-[9px] text-[#3e2723] truncate">{request.profiles?.username}</p>
                   <p className="text-[6px] text-emerald-700 mt-1 truncate">{t('wants_to_join')}</p>
                 </div>
              </div>
              <button onClick={() => acceptFriend(request.user_id)} className="pixel-btn-action !bg-[#81c784]">
                <i className="fas fa-check-circle"></i> {t('accept')}
              </button>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* 3. FRIENDS LIST */}
    <section className="pixel-box-wood">
      <h2 className="text-[10px] md:text-[12px] mb-6 underline decoration-double text-[#3e2723]">🏕️ {t('your_party')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {friends.length > 0 ? friends.map(friend => {
          const isOnline = onlineUsers.includes(friend.id);
          return (
            <div key={friend.id} className="flex flex-col border-4 border-[#3e2723] bg-white hover:bg-[#f1f8e9] transition-colors overflow-hidden">
              <div onClick={() => handleOpenProfile(friend)} className="flex items-center gap-4 p-4 cursor-pointer min-w-0">
                <div className="relative flex-shrink-0">
                    <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} className="pixel-avatar" alt="avatar" />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#3e2723] ${isOnline ? 'bg-green-500' : 'bg-[#a1887f]'}`}></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#3e2723] truncate">{friend.username}</p>
                  <p className={`text-[6px] mt-2 flex items-center gap-2 ${isOnline ? 'text-green-700' : 'text-[#a1887f]'}`}>
                    <i className={`fas ${isOnline ? 'fa-campfire' : 'fa-bed'}`}></i>
                    <span className="truncate">{isOnline ? t('status_active') : t('status_sleeping')}</span>
                  </p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <select className="pixel-input-field !py-1 !text-[8px] !h-auto cursor-pointer" defaultValue="" onChange={(e) => { if(e.target.value) { addToGroup(e.target.value, friend.id); e.target.value = ""; } }}>
                  <option value="" disabled>🛡️ {t('invite_to_guild')}</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
            </div>
          );
        }) : (
          <p className="text-[8px] text-[#a1887f] italic col-span-full text-center py-8">{t('lobby_empty')}</p>
        )}
      </div>
    </section>

    {/* 4. GUILDS */}
    <section className="pixel-box-wood">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[10px] md:text-[12px] underline decoration-double text-[#3e2723]">🏰 {t('your_guilds')}</h2>
        <button onClick={() => setIsCreatingGroup(!isCreatingGroup)} className="pixel-btn-action !bg-[#78909c]">
          {isCreatingGroup ? '[X]' : t('create_group')}
        </button>
      </div>

      {isCreatingGroup && (
        <div className="mb-6 p-4 border-4 border-dashed border-[#8d6e63] flex gap-2">
          <input className="pixel-input-field" placeholder="GUILD NAME..." value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
          <button onClick={createGroup} className="pixel-btn-action !bg-[#81c784]">{t('confirm')}</button>
        </div>
      )}

      <div className="space-y-4">
        {groups.map(group => (
          <div key={group.id} onClick={() => navigate(`/guild/${group.id}`)} className="border-4 border-[#3e2723] p-4 cursor-pointer bg-white hover:bg-[#efebe9] flex flex-col gap-4 shadow-[4px_4px_0_0_rgba(93,64,55,0.1)]">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[#5d4037] truncate">🛡️ {group.name}</p>
                <span className="text-[6px] text-[#a1887f] uppercase">{group.group_members?.length} ADVENTURERS</span>
              </div>
              <i className="fas fa-arrow-right text-[#d7ccc8] text-[10px]"></i>
            </div>
            <div className="flex -space-x-2">
              {group.group_members?.slice(0, 5).map((m: any) => (
                <img key={m.user_id} src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles?.username}`} className="w-8 h-8 border-2 border-[#3e2723] bg-white flex-shrink-0" alt="member"/>
              ))}
              {group.group_members?.length > 5 && <div className="w-8 h-8 border-2 border-[#3e2723] bg-[#3e2723] text-white text-[6px] flex items-center justify-center">+{group.group_members.length - 5}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>

    {selectedFriend && (
      <FriendsProfile isOpen={isProfileOpen} onClose={() => { setIsProfileOpen(false); setSelectedFriend(null); }} user={selectedFriend} />
    )}
  </div>
);
};