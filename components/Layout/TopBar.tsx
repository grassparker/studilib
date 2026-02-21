import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';

interface TopBarProps {
  user: User;
  onAvatarClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onAvatarClick }) => {
  const { t, i18n } = useTranslation();
  
  const displayName = user.username || 
                      user.email?.split('@')[0] || 
                      t('player_1');

  const avatarUrl = (user as any).avatar_url || 
                    user.avatar || 
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

  const displayCoins = user.coins ?? 0;

  // Function to toggle language
  const handleLanguageChange = () => {
    const newLang = i18n.language === 'EN' ? 'ZH' : 'EN';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="h-20 bg-[#111] border-b-4 border-black flex items-center justify-between px-4 md:px-8 z-10 pixel-font text-white">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-font { font-family: 'Press Start 2P', cursive; }
        
        .hud-box {
          background: #333;
          border: 4px solid #666;
          box-shadow: 4px 4px 0 0 black;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.1s;
        }

        .coin-box {
          border-color: #ffd700;
        }

        .lang-box:hover {
          background: #444;
          border-color: #fff;
          transform: translateY(-2px);
        }

        .avatar-frame {
          border: 4px solid white;
          box-shadow: 4px 4px 0 0 black;
          background: #444;
          image-rendering: pixelated;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #00ff00;
          border: 1px solid black;
          display: inline-block;
          margin-right: 8px;
        }
      `}</style>

      {/* Left Side: Currency & Settings HUD */}
      <div className="flex items-center gap-4">
        {/* COIN HUD */}
        <div className="hud-box coin-box">
          <i className="fas fa-coins text-[#ffd700] text-sm animate-pulse"></i>
          <span className="text-[10px] tracking-widest text-[#ffd700]">{t('gp')}_{displayCoins}</span>
        </div>

        {/* LANGUAGE TOGGLE HUD */}
        <button onClick={handleLanguageChange} className="hud-box lang-box">
          <i className="fas fa-globe text-sky-400 text-sm"></i>
          <span className="text-[10px] tracking-widest text-white">
            {i18n.language === 'EN' ? 'ZH' : 'EN'}
          </span>
        </button>
      </div>

      {/* Right Side: Player Info */}
      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block border-r-4 border-[#333] pr-6">
          <p className="text-[10px] mb-2 tracking-tighter">{displayName}</p>
          <div className="flex items-center justify-end">
            <span className="status-dot"></span>
            <p className="text-[8px] text-[#00ff00]">{user.status || t('ready')}</p>
          </div>
        </div>

        <div className="relative group" onClick={onAvatarClick}>
          <img 
            src={avatarUrl} 
            alt="HUD_AVATAR" 
            className="w-12 h-12 avatar-frame cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          />
          <div className="absolute -bottom-2 -left-2 bg-white text-black text-[6px] px-1 border-2 border-black font-bold">
            LV_1
          </div>
        </div>
      </div>
    </header>
  );
};