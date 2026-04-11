import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthForms } from './components/Auth/Authentication';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { User } from './types';
import ProfileModal from './components/Profile/ProfileModal';
import { supabase } from './components/Auth/supabaseClient';
import { LandingPage } from './pages/LandingPage';
import { GuildDetail } from './components/Friends/Guild/GuildDetail';
import { Updates } from './pages/Updates';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- 1. AUTH & DATA FETCHING ---
  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async (userId: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (isMounted && data) {
        setUser(prev => ({ ...prev, ...data } as any));
      }
    };

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user as any);
          await fetchProfileData(session.user.id);
        }
        if (isMounted) setIsLoading(false);
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user as any);
        fetchProfileData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'EN' ? 'ZH' : 'EN';
    i18n.changeLanguage(newLang);
  };

  const handleProfileUpdate = (updatedData: any) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  const updateCoins = async (amount: number) => {
    if (!user) return;
    const newCount = (user.coins || 0) + amount;
    setUser((prev) => (prev ? { ...prev, coins: newCount } : null));
    await supabase.from('profiles').update({ coins: newCount }).eq('id', user.id);
  };

  // --- 2. LOADING SCREEN ---
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FBBF24]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel-font { font-family: 'Press Start 2P', monospace; }
          .pixel-box { border: 6px solid black; background: white; box-shadow: 10px 10px 0 0 rgba(0,0,0,1); }
        `}</style>
        <div className="pixel-box p-8 animate-pulse text-center">
          <p className="pixel-font text-[10px] text-black mb-4">SYSTEM_BOOTING...</p>
          <div className="w-full bg-gray-200 h-4 border-2 border-black">
            <div className="bg-black h-full" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. THE ROUTER MAP ---
  return (
    <Router>
      <Routes>
        <Route path="/updates" element={<Updates />} />
        <Route path="/" element={user ? <Navigate to="/app" replace /> : <LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/app" replace /> : <AuthForms onLogin={() => {}} />} />
        
        {/* All protected app routes go through here */}
        <Route 
          path="/app/*" 
          element={
            user ? (
              <AppLayout 
                user={user} 
                handleLogout={handleLogout} 
                handleProfileUpdate={handleProfileUpdate}
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
                updateCoins={updateCoins}
                handleLanguageChange={handleLanguageChange}
              />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route path="/guild/:id" element={user ? <GuildDetail user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

// --- SUB-COMPONENT: APP LAYOUT ---
const AppLayout: React.FC<any> = ({ 
  user, handleLogout, handleProfileUpdate, isProfileOpen, 
  setIsProfileOpen, updateCoins, handleLanguageChange 
}) => {
  const { t, i18n } = useTranslation();
  
  return (
    <div className="flex h-screen bg-[#f0f0f0] overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
        
        * { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
        
        .main-content-area {
          background-image: radial-gradient(#d1d5db 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* Essential Quest Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        @keyframes questPop {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-quest-pop { animation: questPop 0.2s ease-out forwards; }
      `}</style>

      {/* IMPORTANT: Sidebar should no longer take setActiveTab 
          It should use <Link> or navigate() internally now.
      */}
      <Sidebar onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-l-4 border-black">
        <TopBar user={user} onAvatarClick={() => setIsProfileOpen(true)} />
        
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onProfileUpdate={handleProfileUpdate}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 main-content-area">
          <div className="max-w-7xl mx-auto h-full">
            {/* Dashboard now handles its own sub-routing based on the URL */}
            <Dashboard user={user} updateCoins={updateCoins} />
          </div>
        </main>

        <footer className="h-8 bg-black text-white flex items-center px-4 justify-between">
          <span className="text-[6px] uppercase tracking-[0.2em]">{t('system_stable')}</span>
          <div className="flex gap-4">
            <button onClick={handleLanguageChange} className="text-[6px] text-amber-400 underline">
              {t('language')}: {i18n.language}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;