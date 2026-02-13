import React, { useState } from 'react'; // Added useState
import { FocusRoom } from './Study/FocusRoom';
import { TinyHomeView } from './Home/TinyHomeView';
import { Overview } from './Dashboard/Overview';
import { Friends } from './Friends/Friends';
import { User } from '../types';
import ProfileModal from './Profile/ProfileModal';
import { TopBar } from './Layout/TopBar';
import { Schedule } from './Schedule/Schedule';

interface DashboardProps {
  activeTab: string;
  user: User;
  updateCoins: (amount: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeTab, user, updateCoins }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
      <div className="flex-1 overflow-y-auto">
        {(() => {
          switch (activeTab) {
            case 'dashboard':
              return <Overview user={user} />;
            case 'focus':
              return <FocusRoom updateCoins={updateCoins} />;
            case 'tinyhome':
              return <TinyHomeView user={user} updateCoins={updateCoins} />;
            case 'social':
              return <Friends user={user} />;
            case 'schedule':
              return <Schedule user={user} />;
            default:
              return (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <i className="fas fa-tools text-4xl mb-4"></i>
                  <p className="font-medium">Tab "{activeTab}" is under construction.</p>
                </div>
              );
          }
        })()}
      </div>
  );
};