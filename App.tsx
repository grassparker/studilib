
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as any); 
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as any);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  //CoINS!!!!
  const updateCoins = (amount: number) => {
    if (user) {
      setUser({ ...user, coins: (user.coins || 0) + amount } as any);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-amber-50">
        <div className="animate-bounce text-amber-600 text-4xl">
          <i className="fas fa-book-open"></i>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForms onLogin={() => {}} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar user={user} onAvatarClick={() => setIsProfileOpen(true)} />
          <ProfileModal
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
          />

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Dashboard 
              activeTab={activeTab} 
              user={user} 
              updateCoins={updateCoins}
            />
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;