
import React from 'react';
import { supabase } from '../Auth/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { loginUser, signUpUser } from '../Auth/auth';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { id: 'focus', icon: 'fa-stopwatch', label: 'Focus Room' },
    { id: 'tinyhome', icon: 'fa-home', label: 'My Tiny Home' },
    { id: 'schedule', icon: 'fa-calendar-alt', label: 'Schedule' },
    { id: 'social', icon: 'fa-users', label: 'Friends' },
    { id: 'stats', icon: 'fa-chart-pie', label: 'Statistics' },
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col h-full z-20">
      <div className="p-6 hidden md:block">
        <h2 className="text-2xl font-bold text-amber-600 font-quicksand flex items-center gap-2">
          <i className="fas fa-book-reader"></i>
          StudiLib
        </h2>
      </div>
      <div className="p-4 md:hidden flex justify-center">
        <i className="fas fa-book-reader text-2xl text-amber-600"></i>
      </div>

      <nav className="flex-1 mt-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 rounded-2xl transition-all ${
              activeTab === item.id
                ? 'bg-amber-500 text-white shadow-md'
                : 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
            }`}
          >
            <i className={`fas ${item.icon} text-lg w-6`}></i>
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center md:justify-start gap-4 px-4 py-3 text-slate-400 hover:text-red-500 transition-colors rounded-2xl"
        >
          <i className="fas fa-sign-out-alt text-lg w-6"></i>
          <span className="hidden md:block font-medium">Log Out</span>
        </button>
      </div>
    </aside>
  );
};
