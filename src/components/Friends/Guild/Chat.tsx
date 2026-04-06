import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../Auth/supabaseClient'; // Double-check this path!

interface ChatProps {
  groupId: string;
  userId: string;
  username: string;
}

export const Chat: React.FC<ChatProps> = ({ groupId, userId, username }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- 1. THE REFRESH LOGIC (Fetch from DB) ---
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, profiles(username)') // This joins with profiles to get the name
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) console.error("FETCH_ERROR:", error);
    else if (data) setMessages(data);
  };

  // --- 2. THE REALTIME LOGIC ---
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`guild_chat_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          console.log("RECEIVING_REALTIME:", payload);

          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          const incomingMsg = {
            ...payload.new,
            profiles: { username: profile?.username || 'GUEST' }
          };

          setMessages((prev) => [...prev, incomingMsg]);
        }
      )
      .subscribe((status) => {
        console.log("REALTIME_CONNECTION_STATUS:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('group_messages')
      .insert([{
        group_id: groupId,
        user_id: userId,
        content: newMessage.trim()
      }]);

    if (error) alert("FAILED TO SEND");
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white font-mono">
      {/* MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px]">
        {messages.length > 0 ? messages.map((msg) => (
          <div key={msg.id} className="text-[10px] border-l-4 border-blue-200 pl-2">
            <span className="font-bold text-blue-600">
              [{msg.profiles?.username || 'GUEST'}]:
            </span>
            <span className="ml-2 text-black">{msg.content}</span>
          </div>
        )) : (
          <p className="text-[8px] text-slate-300 italic">NO MESSAGES IN LOGS...</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FIELD */}
      <form onSubmit={handleSendMessage} className="p-4 border-t-4 border-black flex gap-2 bg-slate-50">
        <input 
          className="flex-1 pixel-input-field !p-2 !text-[10px]"
          placeholder="ENTER MESSAGE..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="pixel-btn-action !p-2">
          SEND
        </button>
      </form>
    </div>
  );
};