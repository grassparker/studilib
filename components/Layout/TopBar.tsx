import React from 'react';
import { User } from '../../types';

interface TopBarProps {
  user: User;
  onAvatarClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onAvatarClick }) => {
  // 1. Look everywhere for the name!
  const displayName = user.username || 
                      (user as any).user_metadata?.username || 
                      user.email?.split('@')[0] || 
                      "User";

  // 2. Look for the avatar link (Yesterday it was 'avatar', Today it is 'avatar_url')
  const avatarUrl = (user as any).avatar_url || 
                    user.avatar || 
                    (user as any).user_metadata?.avatar_url || 
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

  // 3. Coins (Make sure they default to 0 so the bubble isn't empty)
  const displayCoins = user.coins ?? 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-amber-100 px-3 py-1 rounded-full text-amber-700 font-bold border border-amber-200 shadow-sm">
          <i className="fas fa-coins text-amber-500"></i>
          <span>{displayCoins}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* ... (keep your bell button code) ... */}
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 leading-tight">{displayName}</p>
            <p className="text-[10px] text-green-500 font-medium uppercase tracking-wider">{user.status || 'Online'}</p>
          </div>
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            onClick={onAvatarClick}
            className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-amber-500 p-0.5 cursor-pointer object-cover"
          />
        </div>
      </div>
    </header>
  );
};