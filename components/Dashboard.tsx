
import React from 'react';
import { FocusRoom } from './Study/FocusRoom';
import { TinyHomeView } from './Home/TinyHomeView';
import { Overview } from './Dashboard/Overview';
import { User } from '../types';
import { supabase } from './Auth/supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { loginUser, signUpUser } from './Auth/auth';

interface DashboardProps {
  activeTab: string;
  user: User;
  updateCoins: (amount: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab, user, updateCoins }) => {
  switch (activeTab) {
    case 'dashboard':
      return <Overview user={user} />;
    case 'focus':
      return <FocusRoom updateCoins={updateCoins} />;
    case 'tinyhome':
      return <TinyHomeView user={user} updateCoins={updateCoins} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <i className="fas fa-tools text-4xl mb-4"></i>
          <p className="font-medium">Tab "{activeTab}" is currently under construction.</p>
        </div>
      );
  }
};
