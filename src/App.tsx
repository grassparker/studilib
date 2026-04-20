import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthForms } from './components/Auth/Authentication';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/Topbar';
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

  const isZH = i18n.language.toUpperCase().includes('ZH');

  useEffect(() => {
    let isMounted = true;
    const fetchProfileData = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
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
    const newLang = i18n.language.toUpperCase() === 'EN' ? 'ZH' : 'EN';
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

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#000d3d]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel-font { font-family: 'Press Start 2P', monospace; }
        `}</style>
        <div className="flex flex-col items-center">
          {/* New loading bar color to match the beige/blue palette */}
          <div className="w-48 h-1 bg-white/10 mb-6 overflow-hidden relative rounded-full">
            <div className="absolute inset-0 bg-blue-300 animate-[progress_1.5s_infinite]"></div>
          </div>
          <p className="pixel-font text-[8px] text-blue-200 tracking-[0.3em] animate-pulse">
            INITIALIZING_HORIZON...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={isZH ? 'zh-mode' : 'en-mode'}>
       <Router>
        <Routes>
          <Route path="/updates" element={<Updates />} />
          <Route path="/" element={user ? <Navigate to="/app" replace /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/app" replace /> : <AuthForms onLogin={() => {}} />} />
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
    </div>
  );
};

// --- SUB-COMPONENT: APP LAYOUT ---
const AppLayout: React.FC<any> = ({ 
  user, handleLogout, handleProfileUpdate, isProfileOpen, 
  setIsProfileOpen, updateCoins, handleLanguageChange 
}) => {
  const { t, i18n } = useTranslation();
  
  return (
    <div className="flex h-screen overflow-hidden text-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;600&family=LXGW+WenKai+TC:wght@700&display=swap');
        
        * { font-family: 'Inter', sans-serif; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }
        
        .zh-mode .pixel-font { 
          font-family: 'LXGW WenKai TC', 'Press Start 2P', monospace !important;
          font-size: 1.2em; 
          letter-spacing: 0.02em;
        }

        /* Updated Palette Background */
        .app-container-bg {
          background: linear-gradient(180deg, 
            #000d3d 0%, 
            #1a478a 40%, 
            #7a98b9 80%, 
            #e6ccb2 100%
          );
          background-attachment: fixed;
        }

        /* Subtle starry grid overlay */
        .main-content-area {
          background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .layout-border { border-color: rgba(255, 255, 255, 0.1); }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Sidebar background should probably be slightly darker to maintain contrast */}
      <div className="bg-[#000826]/80 backdrop-blur-xl border-r border-white/5">
        <Sidebar onLogout={handleLogout} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden app-container-bg">
        <TopBar user={user} onAvatarClick={() => setIsProfileOpen(true)} />
        
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onProfileUpdate={handleProfileUpdate}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 main-content-area relative">
          <div className="max-w-7xl mx-auto h-full relative z-10">
            <Dashboard user={user} updateCoins={updateCoins} />
          </div>
        </main>

        <footer className="h-8 bg-black/20 backdrop-blur-md border-t border-white/5 text-white/50 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(96,165,250,0.8)]"></span>
            <span className="pixel-font text-[6px] uppercase tracking-[0.2em]">
              {t('system_stable')}
            </span>
          </div>
          <div className="flex gap-6">
            <button 
              onClick={handleLanguageChange} 
              className="pixel-font text-[6px] text-white/40 hover:text-white transition-colors uppercase tracking-widest"
            >
              [ {t('language')}: {i18n.language} ]
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;