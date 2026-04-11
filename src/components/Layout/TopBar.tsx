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

  const handleLanguageChange = () => {
    const newLang = i18n.language === 'EN' ? 'ZH' : 'EN';
    i18n.changeLanguage(newLang);
  };

  return (
    <header className="h-20 bg-[#2e7d32] border-b-6 border-[#3e2723] flex items-center justify-between px-4 md:px-8 z-50 pixel-font text-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)]">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
        .pixel-font { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
        
        .nature-hud-box {
          background: #3e2723;
          border: 4px solid #5d4037;
          box-shadow: 4px 4px 0 0 #1a0f0a;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.1s;
        }

        .gold-glow {
          color: #ffaa00;
          text-shadow: 2px 2px 0px #000;
        }

        .nature-btn:hover {
          background: #4e342e;
          transform: translateY(-2px);
          box-shadow: 4px 6px 0 0 #1a0f0a;
        }

        .avatar-shrine {
          border: 4px solid #fffdf5;
          box-shadow: 4px 4px 0 0 #1a0f0a;
          background: #8d6e63;
          image-rendering: pixelated;
        }

        .xp-bar-mini {
          width: 40px;
          height: 6px;
          background: #1b5e20;
          border: 2px solid #000;
          margin-top: 4px;
          overflow: hidden;
        }

        .xp-fill {
          width: 60%;
          height: 100%;
          background: #4caf50;
        }
      `}</style>

      {/* Left Side: Resources & Translation */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* GOLD POUCH */}
        <div className="nature-hud-box border-[#ffaa00]">
          <i className="fas fa-coins gold-glow text-xs animate-bounce"></i>
          <span className="text-[8px] md:text-[10px] tracking-widest gold-glow">
            {displayCoins}G
          </span>
        </div>

        {/* WORLD TONGUE (Language) */}
        <button onClick={handleLanguageChange} className="nature-hud-box nature-btn">
          <i className="fas fa-scroll text-stone-300 text-xs"></i>
          <span className="text-[8px] md:text-[10px] tracking-widest text-white">
            {i18n.language}
          </span>
        </button>
      </div>

      {/* Right Side: Adventurer Profile */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] mb-1 tracking-tighter text-[#fffdf5] uppercase font-bold">
            {displayName}
          </p>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 bg-[#00ff00] border border-black animate-pulse"></div>
               <p className="text-[7px] text-[#a5d6a7]">{user.status || t('ready')}</p>
            </div>
            {/* Just a decorative XP bar to sell the RPG vibe */}
            <div className="xp-bar-mini">
              <div className="xp-fill"></div>
            </div>
          </div>
        </div>

        <div className="relative group" onClick={onAvatarClick}>
          <img 
            src={avatarUrl} 
            alt="HERO_AVATAR" 
            className="w-10 h-10 md:w-12 md:h-12 avatar-shrine cursor-pointer hover:rotate-3 transition-transform"
          />
          <div className="absolute -bottom-2 -right-2 bg-[#ffaa00] text-[#3e2723] text-[6px] px-1.5 py-0.5 border-2 border-[#3e2723] font-bold shadow-sm">
            LV.1
          </div>
        </div>
      </div>
    </header>
  );
};