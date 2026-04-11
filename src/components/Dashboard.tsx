import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FocusRoom } from './Study/FocusRoom';
import { TinyHomeView } from './Home/TinyHomeView';
import { Overview } from './Dashboard/Overview';
import { Friends } from './Friends/Friends';
import { User } from '../types';
import { Schedule } from './Schedule/Schedule';
import { Routes, Route } from 'react-router-dom';

// 1. UPDATED INTERFACE: Removed activeTab
interface DashboardProps {
  user: User;
  updateCoins: (amount: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, updateCoins }) => {
  const { t } = useTranslation();

  return (
    <Routes>
      {/* Root of the dashboard (/app) */}
      <Route path="/" element={<Overview user={user} />} />
      
      {/* Sub-paths (e.g., /app/schedule) */}
      <Route path="schedule" element={<Schedule user={user} />} />
      <Route path="focus" element={<FocusRoom user={user} updateCoins={updateCoins} />} />
      <Route path="tinyhome" element={<TinyHomeView user={user} updateCoins={updateCoins} />} />
      <Route path="social" element={<Friends user={user} />} />
      
      {/* Catch-all for mistakes within /app */}
      <Route path="*" element={<div>Quest Location Not Found...</div>} />
    </Routes>
  );
};