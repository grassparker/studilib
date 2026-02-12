// Dashboard.tsx

import React from 'react';
import { FocusRoom } from './Study/FocusRoom';
import { TinyHomeView } from './Home/TinyHomeView';
import { Overview } from './Dashboard/Overview';
import { Friends } from './Friends/Friends';
import { User } from '../types';

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
    case 'social': // <--- 2. Match the ID from Sidebar.tsx
      return <Friends user={user} />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <i className="fas fa-tools text-4xl mb-4"></i>
          <p className="font-medium">Tab "{activeTab}" is currently under construction.</p>
        </div>
      );
  }
};