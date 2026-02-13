
import React from 'react';
import { User } from '../../types';
import { supabase } from '../Auth/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { loginUser, signUpUser } from '../Auth/auth';

interface TopBarProps {
  user: User;
  onAvatarClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onAvatarClick }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full text-amber-700 font-bold border border-amber-200 shadow-sm">
          <i className="fas fa-coins text-amber-500"></i>
          <span>{user.coins}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-amber-600 transition-colors rounded-full hover:bg-slate-50">
          <i className="fas fa-bell text-xl"></i>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{user.username}</p>
            <p className="text-[10px] text-green-500 font-medium uppercase tracking-wider">{user.status}</p>
          </div>
          <img 
            src={user.avatar} 
            alt="Avatar" 
            onClick={onAvatarClick}
            className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-amber-500 p-0.5 cursor-pointer"
          />
        </div>
      </div>
    </header>
  );
};
