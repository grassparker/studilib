
import React, { useState, useEffect, useRef } from 'react';
import { TimerMode } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { loginUser, signUpUser } from '../Auth/auth';

interface FocusRoomProps {
  updateCoins: (amount: number) => void;
}

const { data, error} = await supabase
  .from('messages')
  .select('*')
  .order('created_at', { ascending: true })
  .limit(50);

if (error) console.error("error fetching history:", error);

export const FocusRoom: React.FC<FocusRoomProps> = ({ updateCoins }) => {
  const [mode, setMode] = useState<TimerMode>(TimerMode.POMODORO);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const { data: { subscription }} = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out, stopping any active streams.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let interval: any = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);

      const saveSession = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('study_sessions').insert([
            {
              user_id: user.id,
              time: mode === TimerMode.POMODORO ? 25 : (mode === TimerMode.SHORT_BREAK ? 5 : 15),
              status: 'completed'
            }
          ]);
        }
      };
      
      saveSession();
      const coinReward = mode === TimerMode.POMODORO ? 10 : 2;
      updateCoins(coinReward);
      alert(`Session complete! You earned ${coinReward} coins!`);
      resetTimer();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, updateCoins]);

  const resetTimer = () => {
    setIsActive(false);
    switch (mode) {
      case TimerMode.POMODORO: setTimeLeft(25 * 60); break;
      case TimerMode.SHORT_BREAK: setTimeLeft(5 * 60); break;
      case TimerMode.LONG_BREAK: setTimeLeft(15 * 60); break;
    }
  };

  {/* Chatroom functionality*/}
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  

  useEffect(() => {
    const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);
    
    if (error) console.error("error fetching history:", error);
    if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel('trial')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

    const sendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      const { data: { user }} = await supabase.auth.getUser();

      if (user && newMessage.trim()) {
        const { error } = await supabase.from('messages').insert([
          {
            user_id: user.id,
            username: user.user_metadata.username || user.email,
            content: newMessage
          }
        ]);

        if (error) console.error(error);
          setNewMessage('');
        }
  };


  {/*const toggleCamera = async () => {
    if (!isCamOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCamOn(true);
      } catch (err) {
        alert("Could not access camera");
      }
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCamOn(false);
    }
  };*/}

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-full">

      {/* Timer Section */}
      <div className="xl:col-span-2 space-y-8">
        <section className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-slate-100">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000"
              style={{ width: `${(timeLeft / (mode === TimerMode.POMODORO ? 25*60 : mode === TimerMode.SHORT_BREAK ? 5*60 : 15*60)) * 100}%` }}
            ></div>
          </div>

          <div className="flex gap-4 mb-12">
            {[TimerMode.POMODORO, TimerMode.SHORT_BREAK, TimerMode.LONG_BREAK].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setIsActive(false); setTimeLeft(m === TimerMode.POMODORO ? 25*60 : m === TimerMode.SHORT_BREAK ? 5*60 : 15*60); }}
                className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${
                  mode === m ? 'bg-amber-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-amber-600'
                }`}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>

          <h1 className="text-9xl font-black text-slate-800 tracking-tighter mb-12 tabular-nums">
            {formatTime(timeLeft)}
          </h1>

          <div className="flex gap-6">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl transition-all ${
                isActive ? 'bg-slate-800 text-white' : 'bg-amber-600 text-white shadow-xl hover:scale-110 active:scale-95'
              }`}
            >
              <i className={`fas ${isActive ? 'fa-pause' : 'fa-play pl-1'}`}></i>
            </button>
            <button
              onClick={resetTimer}
              className="w-20 h-20 rounded-full border-2 border-slate-100 text-slate-400 hover:border-amber-500 hover:text-amber-500 flex items-center justify-center text-2xl transition-all"
            >
              <i className="fas fa-undo"></i>
            </button>
          </div>
        </section>

        {/*Chatroom section*/}

        {/* Remote Study Buddies (Video Call UI)
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-quicksand flex items-center gap-2">
              <i className="fas fa-video text-amber-500"></i>
              Active Group Call
              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">3 Live</span>
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setIsMuted(!isMuted)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'}`}>
                <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
              </button>
              <button onClick={toggleCamera} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isCamOn ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                <i className={`fas ${isCamOn ? 'fa-video' : 'fa-video-slash'}`}></i>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative border-2 border-amber-500">
               {isCamOn ? (
                  <video ref={videoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
               ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/40">
                    <i className="fas fa-user-circle text-4xl mb-2"></i>
                    <p className="text-[10px] uppercase font-bold">You</p>
                  </div>
               )}
               <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] text-white font-bold">You</div>
            </div>
            
            {[
              { name: 'Alex', color: 'bg-emerald-500', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
              { name: 'Sarah', color: 'bg-indigo-500', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah' },
              { name: 'Liam', color: 'bg-rose-500', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam' },
            ].map((friend, i) => (
              <div key={i} className="aspect-video bg-slate-800 rounded-2xl overflow-hidden relative">
                <img src={friend.img} alt={friend.name} className="w-full h-full object-cover opacity-50 grayscale" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                     <i className="fas fa-microphone-slash text-white/50 text-xs"></i>
                   </div>
                </div>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] text-white font-bold">{friend.name}</div>
              </div>
            ))}
          </div>
        </section> */}

      </div>

      {/* Sidebar Focus Tools */}
      <div className="space-y-8">
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold mb-4 text-slate-800">Focus Sound</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'rain', icon: 'fa-cloud-showers-heavy', label: 'Rain' },
              { id: 'cafe', icon: 'fa-coffee', label: 'Cafe' },
              { id: 'forest', icon: 'fa-tree', label: 'Forest' },
              { id: 'noise', icon: 'fa-wave-square', label: 'White' },
            ].map((sound) => (
              <button key={sound.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all flex flex-col items-center gap-2 group">
                <i className={`fas ${sound.icon} text-slate-400 group-hover:text-amber-500 text-xl`}></i>
                <span className="text-xs font-bold text-slate-600">{sound.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
          <h3 className="font-bold mb-4 text-slate-800">Study Chatroom</h3>
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <span className="font-bold text-amber-600">{msg.username}:</span>
                <span className="text-slate-600"> {msg.content}</span>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Type a message..."
            />
            <button type="submit" className="bg-amber-600 text-white p-2 rounded-xl">
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </section>
        
      </div>
    </div>
  );
};
