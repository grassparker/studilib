import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../Auth/supabaseClient';

interface ChatProps {
  groupId: string;
  userId: string;
  username: string;
}

export const Chat: React.FC<ChatProps> = ({ groupId, userId, username }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- AUTO SCROLL ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- INITIAL FETCH ---
  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*, profiles(username)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) console.error('FETCH_ERROR:', error);
    else if (data) setMessages(data);
  };

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    let isMounted = true;
    fetchMessages();

    const channel = supabase
      .channel(`room_${groupId}`)
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

          // 1. Check for duplicates immediately
          setMessages((current) => {
            if (current.some((m) => m.id === payload.new.id)) return current;

            // 2. If it's from another user, fetch their profile
            if (payload.new.user_id !== userId) {
              const fetchAndAdd = async () => {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('username')
                  .eq('id', payload.new.user_id)
                  .single();

                const msgWithProfile = {
                  ...payload.new,
                  profiles: { username: profile?.username || 'GUEST' },
                };

                if (isMounted) {
                  setMessages((prev) => [...prev, msgWithProfile]);
                }
              };
              fetchAndAdd();
              return current;
            }

            // 3. If it's ours, the optimistic handler manages it
            return current;
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [groupId, userId]);

  // --- SEND MESSAGE (WITH OPTIMISTIC UI) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent) return;

    // 1. Create a temporary optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      content: messageContent,
      user_id: userId,
      created_at: new Date().toISOString(),
      profiles: { username },
    };

    // 2. Update UI immediately
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');

    // 3. Send to Supabase
    const { data, error } = await supabase
      .from('group_messages')
      .insert([{ group_id: groupId, user_id: userId, content: messageContent }])
      .select('*, profiles(username)')
      .single();

    if (error) {
      console.error('SEND_ERROR:', error);
      // Roll back the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      // Replace temp message with the confirmed DB row
      setMessages((prev) => prev.map((m) => (m.id === tempId ? data : m)));
    } else {
      // data is null but no error — RLS is likely blocking the post-insert SELECT.
      // The optimistic message stays visible for now. On next mount/refresh,
      // fetchMessages() will load the real persisted row correctly.
      console.warn(
        'Insert succeeded but SELECT returned null. ' +
          'Check your RLS SELECT policy on group_messages.'
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000d3d]/60 backdrop-blur-md">
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(230, 204, 178, 0.2); border-radius: 10px; }

        .bubble-mine {
          background: linear-gradient(135deg, #1e40af 0%, #000d3d 100%);
          border: 1px solid rgba(96, 165, 250, 0.2);
          border-bottom-right-radius: 2px;
        }

        .bubble-theirs {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-bottom-left-radius: 2px;
        }
      `}</style>

      {/* HEADER */}
      <div className="px-4 py-2 border-b border-white/10 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-500/80 font-mono tracking-widest uppercase">
            Sync_Active
          </span>
        </div>
        <span className="text-[10px] text-white/20 font-mono uppercase">
          Node_{groupId.substring(0, 4)}
        </span>
      </div>

      {/* MESSAGE LIST */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll">
        {messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.user_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`flex items-center gap-2 mb-1 ${
                    isMe ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <span className="text-[9px] text-[#e6ccb2]/60 font-mono uppercase">
                    {msg.profiles?.username || 'GUEST'}
                  </span>
                  <span className="text-[8px] text-white/10 font-mono">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs shadow-lg ${
                    isMe ? 'bubble-mine text-white' : 'bubble-theirs text-blue-100'
                  }`}
                >
                  <p className="leading-relaxed break-words whitespace-pre-wrap">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-2">
            <p className="text-[10px] font-mono tracking-widest uppercase">
              Awaiting Transmissions...
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-black/40 border-t border-white/10 flex gap-2"
      >
        <input
          className="flex-1 bg-[#000d3d]/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-400/50 transition-all"
          placeholder="TYPE MESSAGE..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          type="submit"
          className="bg-[#e6ccb2] text-[#000d3d] px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all text-xs font-bold"
        >
          SEND
        </button>
      </form>
    </div>
  );
};