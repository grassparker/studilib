import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthForms } from './components/Auth/AuthForms';
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
  const [activeTab, setActiveTab] = useState('dashboard');
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
      if (error) console.error("Error fetching profile:", error.message);
    };

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // This catches the "Invalid Refresh Token" error
          console.error('Auth init error:', error.message);
          await supabase.auth.signOut(); // Clear stale cookies/tokens
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (session?.user) {
          if (isMounted) {
            setUser(session.user as any);
            await fetchProfileData(session.user.id);
          }
        }
        if (isMounted) setIsLoading(false);
      } catch (err) {
        console.error('Unexpected Auth Error:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    // HANDSHAKE LINKAGE: Listens for Login/Logout/Token Expiry
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (isMounted) {
          setUser(session.user as any);
          fetchProfileData(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) setUser(null);
      } else if (event === 'TOKEN_REFRESHED' === false && !session) {
        // Handle session expiration or invalid refresh tokens
        if (isMounted) setUser(null);
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

  // --- 2. LOADING SCREEN (The "Boot" Protocol) ---
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FBBF24]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
          .pixel-font { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
          .pixel-box {
            border: 6px solid black;
            background: white;
            box-shadow: 10px 10px 0 0 rgba(0,0,0,1);
          }
        `}</style>
        <div className="pixel-box p-8 animate-pulse text-center">
          <p className="pixel-font text-[10px] tracking-widest text-black mb-4">
            {t('loading_os') || "SYSTEM_BOOTING..."}
          </p>
          <div className="w-full bg-gray-200 h-4 border-2 border-black">
            <div className="bg-black h-full animate-[loading_2s_ease-in-out_infinite]" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- 3. THE ROUTER MAP ---
  return (
    <Router>
      <Routes>
        {/* PUBLIC ACCESS: Always available for SEO and Users */}
        <Route path="/updates" element={<Updates />} />

        {/* LANDING PAGE: Logic to skip if already logged in */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/app" replace /> : <LandingPage />} 
        />

        {/* AUTH: Forced redirect if logged in */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/app" replace /> : <AuthForms onLogin={() => {}} />} 
        />

        {/* GUILD DETAIL: Protected */}
        <Route 
          path="/guild/:id" 
          element={user ? <GuildDetail user={user} /> : <Navigate to="/login" />} 
        />

        {/* PROTECTED DASHBOARD AREA */}
        <Route 
          path="/app" 
          element={
            !user ? (
              <Navigate to="/login" />
            ) : (
              <div className="flex h-screen bg-[#f0f0f0] overflow-hidden">
                <style>{`
                  * { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
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
                    <div className="max-w-7xl mx-auto h-full">
                      <Dashboard 
                        activeTab={activeTab} 
                        user={user} 
                        updateCoins={updateCoins}
                      />
                    </div>
                  </main>

                  {/* SYSTEM STATUS BAR */}
                  <footer className="h-8 bg-black text-white flex items-center px-4 justify-between">
                    <span className="text-[6px] uppercase tracking-[0.2em]">
                      {t('system_stable')}
                    </span>
                    <div className="flex gap-4">
                      <span className="text-[6px] uppercase">{t('region')}</span>
                      <button 
                        onClick={handleLanguageChange}
                        className="text-[6px] text-amber-400 underline"
                      >
                        {t('language')}: {i18n.language}
                      </button>
                    </div>
                  </footer>
                </div>
              </div>
            )
          } 
        />

        {/* CATCH-ALL REDIRECT */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;