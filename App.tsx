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
import { LandingPage } from './public/LandingPage';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
    setUser(null);
  };

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'EN' ? 'ZH' : 'EN';
    i18n.changeLanguage(newLang);
  };

  // --- 3. PIXEL THEME RENDER ---

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FBBF24]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
          .pixel-font { font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace; }
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
            {t('loading_os')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Landing Page - Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Login Page */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/app" /> : <AuthForms onLogin={() => {}} />} 
        />

        {/* Protected App Routes */}
        <Route 
          path="/app" 
          element={
            !user ? (
              <Navigate to="/login" />
            ) : (
              <div className="flex h-screen bg-[#f0f0f0] overflow-hidden">
                <style>{`
                  @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                  @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
                  * { font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace; }
                  
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

                  {/* SYSTEM STATUS BAR */}
                  <footer className="h-8 bg-black text-white flex items-center px-4 justify-between">
                    <span className="text-[6px] uppercase tracking-[0.2em]">{t('system_stable')}</span>
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

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;