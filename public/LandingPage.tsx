import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'EN' ? 'ZH' : 'EN');
  };

  return (
    <div className="min-h-screen bg-[#FBBF24] flex flex-col items-center justify-center p-6 text-black font-pixel">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            .font-pixel { font-family: 'Press Start 2P', monospace; }
            .pixel-border {
                border: 6px solid black;
                box-shadow: 8px 8px 0 0 black;
            }
            .scanline {
                width: 100%;
                height: 2px;
                background: rgba(0,0,0,0.1);
                position: absolute;
                animation: scroll 4s linear infinite;
            }
            @keyframes scroll {
                0% { top: 0; }
                100% { top: 100%; }
            }
        `}</style>

      {/* Language Switcher - Top Right */}
      <button 
        onClick={toggleLang}
        className="absolute top-6 right-6 bg-white border-4 border-black px-4 py-2 text-[10px] font-bold shadow-[4px_4px_0_0_black] active:translate-y-1 active:shadow-none z-50 hover:bg-gray-100 transition-colors uppercase"
      >
        {i18n.language === 'EN' ? '🇨🇳 中文' : '🇺🇸 EN'}
      </button>

      {/* Hero Section */}
      <div className="text-center max-w-4xl relative">
        <div className="bg-white pixel-border p-8 mb-8 inline-block relative overflow-hidden">
          <div className="scanline"></div>
          <h1 className="text-3xl md:text-6xl mb-4 tracking-tighter">STUDI_OS</h1>
          <p className="text-[10px] md:text-[12px] leading-relaxed opacity-80 uppercase">
            {t('landing_tagline') || 'Level up your life, one pomodoro at a time.'}
          </p>
        </div>

        {/* FEATURE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 text-[8px] uppercase">
            <div className="bg-white/50 border-4 border-black p-4 pixel-border">
                <i className="fas fa-khanda mb-3 text-xl block"></i>
                <h3 className="font-bold mb-2">RPG Progression</h3>
                <p>Turn chores into quests and earn XP for your focus.</p>
            </div>
            <div className="bg-white/50 border-4 border-black p-4 pixel-border">
                <i className="fas fa-ghost mb-3 text-xl block"></i>
                <h3 className="font-bold mb-2">Social Haven</h3>
                <p>Build your room and visit party members in real-time.</p>
            </div>
            <div className="bg-white/50 border-4 border-black p-4 pixel-border">
                <i className="fas fa-microchip mb-2 text-xl block"></i>
                <h3 className="font-bold mb-2">System Stable</h3>
                <p>Optimized for Sequoia 2026 build environments.</p>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button 
            onClick={() => navigate('/login')}
            className="bg-black text-amber-400 pixel-border px-8 py-4 text-[12px] hover:bg-gray-900 transition-all active:translate-y-1 active:shadow-none font-bold uppercase"
          >
            {t('boot_system') || '[ BOOT_SYSTEM ]'}
          </button>
          
          <a 
            href="https://github.com/grassparker/studilib"
            target="_blank"
            rel="noreferrer"
            className="bg-white text-black pixel-border px-8 py-4 text-[12px] hover:bg-gray-100 transition-all active:translate-y-1 active:shadow-none font-bold uppercase"
          >
            SOURCE_CODE
          </a>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-16 text-[8px] opacity-60 flex flex-col items-center gap-4">
        <div className="flex gap-8">
            <span>LOC: KUALA_LUMPUR</span>
            <span>USER: GUEST_001</span>
            <span className="text-green-700 animate-pulse font-bold">ONLINE</span>
        </div>
        <div className="flex flex-col items-center gap-1">
            <p>© 2026 CANDY. ALL RIGHTS RESERVED.</p>
            <p className="bg-black text-white px-2 py-1">BUILD v.1.0.2</p>
        </div>
      </div>
    </div>
  );
};