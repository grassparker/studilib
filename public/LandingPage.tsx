import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import updatesData from '../public/updates.json';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isFlashing, setIsFlashing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const latestUpdate = updatesData[0];

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'EN' ? 'ZH' : 'EN');
  };

  const handleBootClick = () => {
    // 3. Trigger the flash
    setIsFlashing(true);
    
    // 4. Reset flash after animation finishes (0.2s)
    setTimeout(() => setIsFlashing(false), 200);
    
    // 5. Short delay before navigation so the user sees the flash
    setTimeout(() => navigate('/login'), 250);
  };

  const hasRecentUpdate = () => {
    if (!updatesData || updatesData.length === 0) return false;
  
    // Assuming the first item in JSON is the latest
    const latestDate = new Date(updatesData[0].date);
    const today = new Date();
  
    // Calculate difference in days
    const diffTime = Math.abs(today.getTime() - latestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    return diffDays <= 7; // Returns true if updated in the last 7 days
  };

  useEffect(() => {
    if (latestUpdate && latestUpdate.id) {
      // Remove the localStorage check - just show the popup every time
      // OR use a different key that resets per session
      const sessionKey = `studilib_update_${latestUpdate.id}_${new Date().toDateString()}`;
      const lastSeenVersion = localStorage.getItem(sessionKey);
  
      if (!lastSeenVersion) {
        setShowPopup(true);
      }
    }
  }, [latestUpdate]);

  const dismissPopup = () => {
    // Store with today's date so it only shows once per day
    const sessionKey = `studilib_update_${latestUpdate.id}_${new Date().toDateString()}`;
    localStorage.setItem(sessionKey, 'seen');
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen bg-[#FBBF24] flex flex-col items-center p-6 text-black font-pixel">
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
            .font-pixel { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
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
                pointer-events: none;
            }
            @keyframes scroll {
                0% { top: 0; }
                100% { top: 100%; }
            }
            .terminal-card {
                background: white;
                border: 4px solid black;
                padding: 1.5rem;
                position: relative;
            }
            @keyframes bop {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .animate-bop {
                animation: bop 1.5s ease-in-out infinite;
            }

            .pixel-border {
                border: 6px solid black;
                box-shadow: 8px 8px 0 0 black;
            }

            /* Clicker Feedback */
            .click-flash {
                animation: flash 0.2s ease-out;
            }
            @keyframes flash {
                0% { background-color: white; }
                100% { background-color: black; }
            }
        `}</style>

      {/* Language Switcher */}
      <button 
        onClick={toggleLang}
        className="fixed top-6 right-6 bg-white border-4 border-black px-4 py-2 text-[10px] font-bold shadow-[4px_4px_0_0_black] active:translate-y-1 active:shadow-none z-[100] uppercase"
      >
        {i18n.language === 'EN' ? '中文' : 'EN'}
      </button>

      {/* HERO SECTION */}
      <div className="text-center max-w-4xl mt-20 mb-20 relative">
        <div className="bg-white pixel-border p-8 mb-8 inline-block relative overflow-hidden">
          <div className="scanline"></div>
          <h1 className="text-4xl md:text-7xl mb-4 tracking-tighter">STUDILIB</h1>
          <p className="text-[10px] md:text-[14px] leading-relaxed opacity-80 uppercase font-bold">
            {t('Welcome!')}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button 
            onClick={handleBootClick} // FIXED: Added the click handler
            className="bg-black text-amber-400 pixel-border px-8 py-4 text-[12px] hover:bg-gray-900 transition-all active:translate-y-1 active:shadow-none font-bold uppercase animate-bop"
          >
            {t('start')}
          </button>
          
          <a 
            href="https://github.com/grassparker/studilib"
            target="_blank"
            rel="noreferrer"
            className="bg-white text-black pixel-border px-8 py-4 text-[12px] hover:bg-gray-100 transition-all active:translate-y-1 active:shadow-none font-bold uppercase"
          >
            {t('source code')}
          </a>
        </div>
      </div>

      {/* NEW: THE "SYSTEM CORE" - DETAILED INFO SECTION */}
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        
        {/* Left Column: The "Why" */}
        <div className="terminal-card shadow-[12px_12px_0_0_black]">
          <h2 className="text-[14px] mb-6 border-b-4 border-black pb-2 text-red-600 font-bold">
            {">"} {t("MISSION_OBJECTIVE")}
          </h2>
          <div className="space-y-6 text-[10px] leading-relaxed">
            <p>
              {t("mission_desc")}
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-green-600">[✓]</span>
                <span>{t("mission_item1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">[✓]</span>
                <span>{t("mission_item2")}.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">[✓]</span>
                <span>{t("mission_item3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">[✓]</span>
                <span>{t("mission_item4")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: The "How" (Tutorial) */}
        <div className="terminal-card shadow-[12px_12px_0_0_#0ea5e9]">
          <h2 className="text-[14px] mb-6 border-b-4 border-black pb-2 text-blue-600 font-bold">
            {">"} {t("BOOT_SEQUENCE")}
          </h2>
          <div className="space-y-4 text-[9px]">
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">01</span>
                <p>{t("boot_01")}</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">02</span>
                <p>{t("boot_02")}</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">03</span>
                <p>{t("boot_03")}</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">04</span>
                <p>{t("boot_04")}</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">{t("suggestions")}</span>
                <p>{t("boot_05")}</p>
            </div>
          </div>
        </div>
      </div>

      {/*Pixeldoro Shoutout!*/}
  <div className="max-w-6xl w-full mb-20 px-4">
    <div className="terminal-card border-purple-500 shadow-[12px_12px_0_0_#a855f7] bg-[#fdf4ff]">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0 relative group">
          <div className="w-20 h-20 bg-white border-4 border-black flex items-center justify-center text-4xl group-hover:scale-110 transition-transform cursor-default">
            🍅
          </div>
          <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] px-2 py-1 border-2 border-black rotate-12">
            FAV!
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-[12px] mb-3 text-purple-700 font-bold uppercase tracking-widest">
            {">"} {t("COMMUNITY_HIGHLIGHT")}
          </h2>
          <p className="text-[10px] leading-relaxed text-gray-800 uppercase font-bold mb-4">
            {t("pixeldoro_desc")}
          </p>
          <div className="flex justify-center md:justify-start gap-4 text-[8px] opacity-70">
            <span>{t("devs_approved")}</span>
            <span>{t("vibe_check")}</span>
          </div>
        </div>

        {/* Call to Action */}
        <a 
          href="https://pixeldoro.io" 
          target="_blank"
          rel="noreferrer"
          className="bg-black text-white pixel-border px-8 py-4 text-[10px] hover:bg-purple-700 transition-all active:translate-y-1 active:shadow-none font-bold whitespace-nowrap"
        >
          {t("VISIT_PIXELDORO")}
        </a>
      </div>
    </div>
  </div>

      {/* Footer Info */}
      <div className="mt-auto pb-10 text-[8px] opacity-60 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-8">
            <span>LOC: KUALA_LUMPUR</span>
            <span>{t("user_count")}</span>
        </div>
        <button 
          onClick={() => navigate('/updates')}
          className="text-green-700 animate-pulse font-bold hover:bg-black hover:text-white px-2 py-1 transition-colors border border-transparent hover:border-black"
        >SYSTEM: STABLE {hasRecentUpdate() && "(!)"}</button>
        <p onClick={() => navigate('/updates')} className="cursor-pointer hover:underline">© 2026 CANDY.{t("designed_for")}</p>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4">
          <div className="pixel-border bg-white max-w-sm w-full p-6 relative">
            <div className="bg-blue-600 text-white text-[8px] p-2 mb-4">
              {t('SYSTEM_NOTIFICATION')}
            </div>
            
            <h2 className="text-[12px] mb-2 text-red-600 font-bold">
              {">"} {latestUpdate?.title}
            </h2>
            
            <p className="text-[10px] text-slate-600 mb-6 leading-relaxed">
              {latestUpdate?.content}
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  dismissPopup();
                  navigate('/updates');
                }}
                className="bg-black text-amber-400 pixel-border p-3 text-[10px] w-full"
              >
                {t('view_logs')}
              </button>
              
              <button 
                onClick={dismissPopup}
                className="text-[8px] uppercase underline opacity-50 hover:opacity-100"
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    
  );
};
