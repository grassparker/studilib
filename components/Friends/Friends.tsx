import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';

// Deleted "import { error } from 'console'" - it crashes browsers!

interface FriendsProps {
  user: User;
}

export const Friends: React.FC<FriendsProps> = ({ user }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchFriendsAndRequests();
  }, [user.id]);

const fetchFriendsAndRequests = async () => {
    // 1. Fetch Accepted Friends
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

    // 2. Fetch Pending Requests (Step 1: Get IDs)
    const { data: idList, error: idError } = await supabase
      .from('friendships')
      .select('user_id')
      .eq('friend_id', user.id)
      .eq('status', 'pending');

    if (idError) {
      console.error("Error fetching request IDs:", idError);
      return;
    }

    // Step 2: Get Profiles for those IDs
    if (idList && idList.length > 0) {
      const { data: requesterProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', idList.map(item => item.user_id));

      if (requesterProfiles) {
        const formattedRequests = requesterProfiles.map(p => ({
          user_id: p.id,
          profiles: p
        }));
        setPendingRequests(formattedRequests);
      }
    } else {
      setPendingRequests([]);
    }
  };

  const handleSearch = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('email', searchEmail.trim())
      .single();
    if (data) setSearchResults([data]);
  };

  const sendRequest = async (friendId: string) => {
    if (friendId === user.id) {
        alert("You can't add yourself as a friend! That's a bit lonely. 😅");
        return;
    }

    const { error } = await supabase.from('friendships').insert([
        { user_id: user.id, friend_id: friendId, status: 'pending' }
    ]);

    if (error) {
        if (error.code === '23505') {
            alert("A request is already pending or you are already friends!");
        } else {
            console.error("Error sending request:", error);
            alert("An error occurred while sending the request. Please try again.");
        }
    }
    alert("Request sent!");
  };

  const acceptFriend = async (requesterId: string) => {
    // Update their request to us
    await supabase.from('friendships')
      .update({ status: 'accepted' })
      .eq('user_id', requesterId)
      .eq('friend_id', user.id);
    
    // Create reciprocal link so we are both in each other's lists
    await supabase.from('friendships').insert([
      { user_id: user.id, friend_id: requesterId, status: 'accepted' }
    ]);
    
    fetchFriendsAndRequests();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Search Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4 font-quicksand text-slate-800">Find Study Buddies</h2>
        <div className="flex gap-2">
          <input 
            type="email"
            placeholder="Enter friend's email..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500 text-slate-700"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-xl font-bold transition-colors">
            Search
          </button>
        </div>
        
        {searchResults.map(result => (
          <div key={result.id} className="mt-4 flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <img src={result.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.username}`} className="w-10 h-10 rounded-full" />
              <span className="font-bold text-slate-700">{result.username}</span>
            </div>
            <button onClick={() => sendRequest(result.id)} className="bg-white text-amber-600 border border-amber-200 px-4 py-1.5 rounded-lg font-bold hover:bg-amber-50">
              + Add Friend
            </button>
          </div>
        ))}
      </section>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <section className="bg-amber-50 p-6 rounded-3xl border border-amber-100 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-amber-800 flex items-center gap-2">
            <i className="fas fa-user-plus"></i> Friend Requests
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.user_id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
                <div className="flex items-center gap-3">
                   <img src={request.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${request.profiles?.username}`} className="w-10 h-10 rounded-full" />
                   <span className="font-bold text-slate-700">{request.profiles?.username} <span className="font-normal text-slate-500 text-sm">wants to study!</span></span>
                </div>
                <button onClick={() => acceptFriend(request.user_id)} className="bg-green-500 hover:bg-green-600 text-white px-5 py-1.5 rounded-xl text-sm font-bold transition-shadow hover:shadow-md">
                  Accept
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends List Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold mb-4 text-slate-800">Your Friends</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {friends.length > 0 ? friends.map(friend => (
            <div key={friend.id} className="flex items-center gap-3 p-4 border border-slate-50 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="relative">
                    <img src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`} className="w-12 h-12 rounded-xl" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <p className="font-bold text-slate-700">{friend.username}</p>
            </div>
          )) : (
            <p className="text-slate-400 text-sm italic col-span-2 text-center py-8">No friends added yet. Start by searching for an email!</p>
          )}
        </div>
      </section>
    </div>
  );
};