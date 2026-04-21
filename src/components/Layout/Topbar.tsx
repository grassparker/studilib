import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../../types';

interface TopBarProps {
  user: User;
  onAvatarClick?: () => void;
  // Added to sync with Sidebar state if needed
  toggleMobileMenu?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onAvatarClick }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const displayName = user.username || user.email?.split('@')[0] || t('player_1');
  const avatarUrl = (user as any).avatar_url || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
  const displayCoins = user.coins ?? 0;

  const handleLanguageChange = () => {
    const newLang = i18n.language.toUpperCase() === 'EN' ? 'ZH' : 'EN';
    i18n.changeLanguage(newLang);
  };

  const menuItems = [
    { path: '/app', label: t('status'), icon: 'fa-shapes' },
    { path: '/app/focus', label: t('quest'), icon: 'fa-moon' },
    { path: '/app/tinyhome', label: t('haven'), icon: 'fa-house-user' },
    { path: '/app/schedule', label: t('log'), icon: 'fa-compass' },
    { path: '/app/social', label: t('party'), icon: 'fa-users-viewfinder' }
  ];

  return (
    <>
      <header className="h-20 bg-[#000d3d]/40 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-8 z-60 relative transition-all">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .pixel-font { font-family: 'Press Start 2P', monospace; }
          
          .glass-hud {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 6px 12px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(4px);
          }

          .horizon-glow {
            color: #e6ccb2;
            filter: drop-shadow(0 0 8px rgba(230, 204, 178, 0.4));
          }

          .avatar-ring {
            padding: 2px;
            background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
          }

          .avatar-ring:hover {
            border-color: #e6ccb2;
            transform: scale(1.05);
          }
        `}</style>

        {/* LEFT: Mobile Menu Toggle & Currency */}
        <div className="flex items-center gap-3">
          {/* Mobile Only Burger */}
          <button 
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-blue-200"
          >
            <i className={`fas ${isMobileNavOpen ? 'fa-times' : 'fa-bars-staggered'}`}></i>
          </button>

          <div className="glass-hud">
            <i className="fas fa-coins horizon-glow text-[10px]"></i>
            <span className="text-[9px] pixel-font text-white/90">
              {displayCoins} <span className="opacity-40 text-[7px]">CR</span>
            </span>
          </div>

          <button onClick={handleLanguageChange} className="glass-hud hover:bg-white/10 transition-colors hidden sm:flex">
            <span className="text-[8px] pixel-font text-blue-300">
              {i18n.language}
            </span>
          </button>
        </div>

        {/* RIGHT: User Profile */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[10px] pixel-font text-white mb-1 tracking-tighter">
              {displayName}
            </p>
            <div className="flex items-center justify-end gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              <p className="text-[7px] pixel-font text-blue-300/50 uppercase">
                {user.status || 'LINK_STABLE'}
              </p>
            </div>
          </div>

          <div className="relative cursor-pointer" onClick={onAvatarClick}>
            <div className="avatar-ring">
              <img 
                src={avatarUrl} 
                alt="USER" 
                className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover bg-slate-900"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#e6ccb2] text-[#000d3d] text-[6px] px-1.5 py-0.5 rounded font-bold pixel-font shadow-lg">
              LV.01
            </div>
          </div>
        </div>

        {/* MOBILE COLLAPSIBLE MENU */}
        <div className={`
          absolute top-20 left-0 w-full bg-[#000d3d]/95 backdrop-blur-2xl border-b border-white/10 
          transition-all duration-300 overflow-hidden z-55 md:hidden
          ${isMobileNavOpen ? 'max-h-100 py-4 shadow-2xl' : 'max-h-0 py-0'}
        `}>
          <div className="flex flex-col px-6 gap-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileNavOpen(false);
                }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  location.pathname === item.path ? 'bg-[#e6ccb2]/10 text-white' : 'text-slate-400'
                }`}
              >
                <i className={`fas ${item.icon} w-5 text-center`}></i>
                <span className="pixel-font text-[9px] tracking-widest">{item.label}</span>
                {location.pathname === item.path && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e6ccb2] shadow-[0_0_8px_#e6ccb2]"></div>
                )}
              </button>
            ))}
            <div className="h-px bg-white/5 my-2"></div>
            <button onClick={handleLanguageChange} className="flex items-center gap-4 p-4 text-blue-300">
              <i className="fas fa-globe w-5 text-center"></i>
              <span className="pixel-font text-[9px]">{t('language')}: {i18n.language}</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* Background Overlay when mobile menu is open */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 md:hidden" 
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
    </>
  );
};