
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { AuthForms } from './components/Auth/AuthForms';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Layout/Sidebar';
import { TopBar } from './components/Layout/TopBar';
import { User } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking local storage for a session
    const savedUser = localStorage.getItem('studilib_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('studilib_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('studilib_user');
  };

  const updateCoins = (amount: number) => {
    if (user) {
      const updated = { ...user, coins: user.coins + amount };
      setUser(updated);
      localStorage.setItem('studilib_user', JSON.stringify(updated));
    }
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
    return <AuthForms onLogin={handleLogin} />;
  }

  return (
    <Router>
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar user={user} />
        
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
