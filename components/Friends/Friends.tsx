import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import '../../index.css';
import FriendsProfile from './FriendsProfile';

export const Friends: React.FC<{ user: User }> = ({ user }) => {
  const { t } = useTranslation();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    fetchFriendsAndRequests();

    //Check which friend is present
    const channel = supabase.channel('online-players', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Sync the online list whenever someone joins/leaves
        setOnlineUsers(Object.keys(state));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Tell the world we are here!
          await channel.track({ 
            online_at: new Date().toISOString(),
            username: user.email // optional extra data
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [user.id]);

  const fetchFriendsAndRequests = async () => {
    // 1. Fetch Friends
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
    }

    // 2. Fetch Pending Requests
    const { data: idList } = await supabase
      .from('friendships')
      .select('user_id')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (idList && idList.length > 0) {
      const { data: requesterProfiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', idList.map(item => item.user_id));

      if (requesterProfiles) {
        setPendingRequests(requesterProfiles.map(p => ({ user_id: p.id, profiles: p })));
      }
    } else {
      setPendingRequests([]);
    }
  };

  //Search friends
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
    else alert(t('request_sent'));
  };

  const acceptFriend = async (requesterId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('user_id', requesterId).eq('friend_id', user.id);
    await supabase.from('friendships').insert([{ user_id: user.id, friend_id: requesterId, status: 'accepted' }]);
    fetchFriendsAndRequests();
  };

  //Opens friend
  const handleOpenProfile = (friend: any) => {
    console.log('Friend clicked:', friend);
    setSelectedFriend(friend);
    setIsProfileOpen(true);
  };

  return (
    <div className="social-scope max-w-4xl mx-auto space-y-8 p-4 overflow-hidden">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
        
        .social-scope { image-rendering: pixelated; }
        .social-scope * { font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace !important; text-transform: uppercase; }

        .pixel-box-white {
          border: 4px solid black;
          background: white;
          box-shadow: 8px 8px 0 0 rgba(0,0,0,0.2);
          padding: 24px;
        }

        .pixel-box-green {
          border: 4px solid black;
          background: #90ee90;
          box-shadow: 8px 8px 0 0 #2d6a30;
          padding: 24px;
        }

        .pixel-input-field {
          border: 4px solid black;
          padding: 12px;
          background: #fff;
          outline: none;
          font-size: 10px;
          width: 100%;
        }

        .pixel-btn-action {
          border: 4px solid black;
          background: #ffaa00;
          padding: 12px 20px;
          box-shadow: inset -4px -4px 0 0 #cc8800;
          cursor: pointer;
          font-size: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pixel-btn-action:active { 
          box-shadow: inset 4px 4px 0 0 #cc8800;
          transform: translateY(2px);
        }

        .pixel-avatar {
          border: 4px solid black;
          background: white;
          width: 64px;
          height: 64px;
        }
      `}</style>

      {/* SEARCH SECTION */}
      <section className="pixel-box-white">
        <h2 className="text-[12px] mb-8 underline decoration-double">{t('search_players')}</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input 
            type="email"
            placeholder={t('input_email')}
            className="pixel-input-field"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="pixel-btn-action whitespace-nowrap">
            <i className="fas fa-search"></i> {t('find')}
          </button>
        </div>
        
        {searchResults.map(result => (
          <div key={result.id} className="mt-8 flex items-center justify-between p-6 border-4 border-black border-dashed bg-slate-50">
            <div className="flex items-center gap-6">
              <img src={result.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`} className="pixel-avatar" />
              <span className="text-[10px]">{result.username}</span>
            </div>
            <button onClick={() => sendRequest(result.id)} className="pixel-btn-action bg-white shadow-none">
              <i className="fas fa-user-plus"></i> {t('add')}
            </button>
          </div>
        ))}
      </section>

      {/* PENDING SECTION */}
      {pendingRequests.length > 0 && (
        <section className="pixel-box-green">
          <h2 className="text-[12px] mb-6 text-green-900">! {t('incoming_requests')}</h2>
          <div className="space-y-6">
            {pendingRequests.map((request) => (
              <div key={request.user_id} className="flex items-center justify-between bg-white border-4 border-black p-6">
                <div className="flex items-center gap-6">
                   <img src={request.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.profiles?.username}`} className="pixel-avatar" />
                   <div>
                     <span className="text-[10px]">{request.profiles?.username}</span>
                     <p className="text-[7px] text-slate-500 mt-2">{t('wants_to_join')}</p>
                   </div>
                </div>
                <button onClick={() => acceptFriend(request.user_id)} className="pixel-btn-action bg-[#45a049] text-white">
                  <i className="fas fa-check-double"></i> {t('accept')}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FRIENDS LIST SECTION */}
      <section className="pixel-box-white">
        <h2 className="text-[12px] mb-8 underline decoration-double">{t('your_party')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {friends.length > 0 ? friends.map(friend => {
            const isOnline = onlineUsers.includes(friend.id);
            return (
              <div 
                key={friend.id} 
                onClick={() => handleOpenProfile(friend)}
                className="flex items-center gap-6 p-6 border-4 border-slate-200 hover:border-black transition-all bg-white group shadow-[4px_4px_0_0_#eee] hover:shadow-[4px_4px_0_0_#000] cursor-pointer"
              >
                <div className="relative">
                    <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} className="pixel-avatar" />
                    {/* DYNAMIC STATUS BOX */}
                    <div className={`absolute -bottom-2 -right-2 w-6 h-6 border-4 border-black transition-colors ${isOnline ? 'bg-[#00ff00]' : 'bg-[#94a3b8]'}`}></div>
                </div>
                <div>
                  <p className="text-[10px] font-bold">{friend.username}</p>
                  <p className={`text-[7px] mt-3 flex items-center gap-2 ${isOnline ? 'text-blue-600' : 'text-slate-400'}`}>
                    <i className={`fas ${isOnline ? 'fa-bolt' : 'fa-moon'}`}></i>
                    {isOnline ? t('status_active') : t('status_sleeping')}
                  </p>
                </div>
              </div>
            );
          }) : (
            <p className="text-[8px] text-slate-400 italic col-span-2 text-center py-12">{t('lobby_empty')}</p>
          )}
        </div>
      </section>

      {/* FRIENDS PROFILE MODAL */}
      {selectedFriend && (
        <FriendsProfile 
          isOpen={isProfileOpen} 
          onClose={() => {
            setIsProfileOpen(false);
            setSelectedFriend(null);
          }} 
          user={selectedFriend} 
        />
      )}
    </div>
  );
};