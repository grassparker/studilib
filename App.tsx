import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { AuthForms } from './components/Auth/AuthForms';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { User } from './types';
import ProfileModal from './components/Profile/ProfileModal';
import { supabase } from './components/Auth/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'ZH'>('EN'); // For the Chinese translation

  // --- 1. CORE FUNCTIONS ---

  const handleProfileUpdate = (updatedData: any) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...updatedData };
    });
  };

  const updateCoins = async (amount: number) => {
    if (!user) return;
    const newCount = (user.coins || 0) + amount;
    
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, coins: newCount };
    });

    await supabase
      .from('profiles')
      .update({ coins: newCount })
      .eq('id', user.id);
  };

  // --- 2. DATA FETCHING ---

  useEffect(() => {
    const fetchProfileData = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setUser(prev => ({ ...prev, ...data } as any));
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as any);
        fetchProfileData(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as any);
        fetchProfileData(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- 3. PIXEL THEME RENDER ---

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FBBF24]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel-font { font-family: 'Press Start 2P', cursive; }
          .pixel-box {
            border: 6px solid black;
            background: white;
            box-shadow: 10px 10px 0 0 rgba(0,0,0,1);
          }
        `}</style>
        <div className="pixel-box p-8 animate-pulse">
          <div className="text-black text-2xl mb-4 text-center">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <p className="pixel-font text-[10px] tracking-widest text-black">
            LOADING_OS...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForms onLogin={() => {}} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-[#f0f0f0] overflow-hidden">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          * { font-family: 'Press Start 2P', cursive; }
          
          /* Custom Scrollbar for Pixel Look */
          ::-webkit-scrollbar { width: 12px; }
          ::-webkit-scrollbar-track { background: #eee; border-left: 4px solid black; }
          ::-webkit-scrollbar-thumb { background: black; border: 2px solid white; }
          
          .main-content-area {
            background-image: radial-gradient(#d1d5db 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}</style>

        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onLogout={handleLogout} 
        />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-l-4 border-black">
          
          <TopBar 
            user={user} 
            onAvatarClick={() => setIsProfileOpen(true)} 
          />
          
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            onProfileUpdate={handleProfileUpdate}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-8 main-content-area">
            {/* The Dashboard container handles the inner pixel styling */}
            <div className="max-w-7xl mx-auto h-full">
               <Dashboard 
                activeTab={activeTab} 
                user={user} 
                updateCoins={updateCoins}
              />
            </div>
          </main>

          {/* SYSTEM STATUS BAR - Optional but very RPG-like */}
          <footer className="h-8 bg-black text-white flex items-center px-4 justify-between">
            <span className="text-[6px] uppercase tracking-[0.2em]">SYSTEM_STABLE // NO_ERRORS</span>
            <div className="flex gap-4">
               <span className="text-[6px] uppercase">REGION: ASIA_NORTH</span>
               <button 
                onClick={() => setLanguage(language === 'EN' ? 'ZH' : 'EN')}
                className="text-[6px] text-amber-400 underline"
               >
                 LANG: {language}
               </button>
            </div>
          </footer>
        </div>
      </div>
    </Router>
  );
};

export default App;