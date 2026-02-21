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

// Import your landing page here (or create a placeholder)
// import { LandingPage } from './pages/LandingPage'; 

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- 1. DATA FETCHING ---
  useEffect(() => {
    const fetchProfileData = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setUser(prev => ({ ...prev, ...data } as any));
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

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const handleLanguageChange = () => {
    const newLang = i18n.language === 'EN' ? 'ZH' : 'EN';
    i18n.changeLanguage(newLang);
  };

  // --- 2. LOADING SCREEN ---
  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#FBBF24]">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel-font { font-family: 'Press Start 2P', cursive; }
          .pixel-box { border: 6px solid black; background: white; box-shadow: 10px 10px 0 0 rgba(0,0,0,1); }
        `}</style>
        <div className="pixel-box p-8 animate-pulse">
          <p className="pixel-font text-[10px] tracking-widest text-black">{t('loading_os')}</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* LANDING PAGE ROUTE (The Website) */}
        <Route path="/" element={
          user ? <Navigate to="/app" /> : (
            <div className="bg-[#FBBF24] min-h-screen flex flex-col items-center justify-center p-4">
               <h1 className="text-2xl font-pixel mb-8">STUDILIB</h1>
               <p className="mb-4">Welcome to your ultimate study portal.</p>
               <button 
                 onClick={() => window.location.href = '/login'}
                 className="pixel-box p-4 bg-white font-pixel text-[10px]"
               >
                 [ INITIALIZE_SESSION ]
               </button>
            </div>
          )
        } />

        {/* AUTH ROUTE */}
        <Route path="/login" element={
          user ? <Navigate to="/app" /> : <AuthForms onLogin={() => {}} />
        } />

        {/* THE ACTUAL WEB APP ROUTE */}
        <Route path="/app" element={
          !user ? <Navigate to="/login" /> : (
            <div className="flex h-screen bg-[#f0f0f0] overflow-hidden">
              <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                * { font-family: 'Press Start 2P', cursive; }
                ::-webkit-scrollbar { width: 12px; }
                ::-webkit-scrollbar-track { background: #eee; border-left: 4px solid black; }
                ::-webkit-scrollbar-thumb { background: black; border: 2px solid white; }
                .main-content-area {
                  background-image: radial-gradient(#d1d5db 1px, transparent 1px);
                  background-size: 20px 20px;
                }
              `}</style>

              <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
              
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-l-4 border-black">
                <TopBar user={user} onAvatarClick={() => setIsProfileOpen(true)} />
                <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} onProfileUpdate={(data) => setUser(prev => prev ? {...prev, ...data} : null)} />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 main-content-area">
                  <div className="max-w-7xl mx-auto h-full">
                    <Dashboard activeTab={activeTab} user={user} updateCoins={() => {}} />
                  </div>
                </main>

                <footer className="h-8 bg-black text-white flex items-center px-4 justify-between">
                  <span className="text-[6px] uppercase tracking-[0.2em]">{t('system_stable')}</span>
                  <button onClick={handleLanguageChange} className="text-[6px] text-amber-400 underline">
                    {t('language')}: {i18n.language}
                  </button>
                </footer>
              </div>
            </div>
          )
        } />
      </Routes>
    </Router>
  );
};

export default App;