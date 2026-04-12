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
    let isMounted = true;
    // Use a unique channel name to avoid collisions
    const channel = supabase.channel(`guild_chat_${groupId}_${Date.now()}`);

    const startSubscription = async () => {
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'group_messages',
            filter: `group_id=eq.${groupId}`,
          },
          async (payload) => {
            if (!isMounted) return;

            // Optimization: Use passed username if we are the sender
            let senderName = payload.new.user_id === userId ? username : null;

            if (!senderName) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', payload.new.user_id)
                .single();
              senderName = profile?.username || 'GUEST';
            }

            const incomingMsg = {
              ...payload.new,
              profiles: { username: senderName },
            };

            setMessages((prev) => [...prev, incomingMsg]);
          }
        )
        .subscribe((status) => {
          if (isMounted) console.log("LOBBY_SYNC:", status);
        });
    };

    fetchMessages();
    startSubscription();

    return () => {
      isMounted = false;
      // The "Ghost Fix": We use a small delay or check status to prevent 
      // closing a connection that is still in the "JOINING" phase.
      const cleanup = async () => {
        if (channel && channel.state !== 'closed') {
          try {
            await supabase.removeChannel(channel);
          } catch (e) {
            // Silently catch the "WebSocket already closed" error
            console.debug("Cleanup handled gracefully");
          }
        }
      };
      cleanup();
    };
  }, [groupId, userId, username]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('group_messages').insert([
      {
        group_id: groupId,
        user_id: userId,
        content: newMessage.trim(),
      },
    ]);

    if (error) alert("FAILED TO SEND");
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-white font-mono">
      {/* MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px]">
        {messages.length > 0 ? (
          messages.map((msg) => (
        <div 
          key={msg.id} 
          className="text-[10px] border-l-4 border-blue-200 pl-2 py-1 flex flex-col"
        >
          <div className="font-bold text-blue-600 truncate">
            [{msg.profiles?.username || 'GUEST'}]:
          </div>
          {/* We use a div here instead of a span to ensure block-level wrapping */}
          <div className="text-black break-all overflow-hidden whitespace-pre-wrap leading-relaxed">
            {msg.content}
          </div>
        </div>
      ))
    ) : (
      <p className="text-[8px] text-slate-300 italic">NO MESSAGES IN LOGS...</p>
  )}
    <div ref={messagesEndRef} />
  </div>

      {/* INPUT FIELD */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t-4 border-black flex gap-2 bg-slate-50"
      >
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