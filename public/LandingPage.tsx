import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [isFlashing, setIsFlashing] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#FBBF24] flex flex-col items-center p-6 text-black font-pixel">
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
        {i18n.language === 'EN' ? '🇨🇳 中文' : '🇺🇸 EN'}
      </button>

      {/* HERO SECTION */}
      <div className="text-center max-w-4xl mt-20 mb-20 relative">
        <div className="bg-white pixel-border p-8 mb-8 inline-block relative overflow-hidden">
          <div className="scanline"></div>
          <h1 className="text-4xl md:text-7xl mb-4 tracking-tighter">STUDILIB</h1>
          <p className="text-[10px] md:text-[14px] leading-relaxed opacity-80 uppercase font-bold">
            {t('landing_tagline') || 'Gamified Productivity for the Next-Gen Student.'}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <button 
            onClick={handleBootClick} // FIXED: Added the click handler
            className="bg-black text-amber-400 pixel-border px-8 py-4 text-[12px] hover:bg-gray-900 transition-all active:translate-y-1 active:shadow-none font-bold uppercase animate-bop"
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

      {/* NEW: THE "SYSTEM CORE" - DETAILED INFO SECTION */}
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        
        {/* Left Column: The "Why" */}
        <div className="terminal-card shadow-[12px_12px_0_0_black]">
          <h2 className="text-[14px] mb-6 border-b-4 border-black pb-2 text-red-600 font-bold">
            {">"} MISSION_OBJECTIVE
          </h2>
          <div className="space-y-6 text-[10px] leading-relaxed">
            <p>
              Traditional study apps are boring. <span className="bg-black text-white px-1">StudiLib</span> treats your focus as a resource. 
              Earn coins through deep work sessions and invest them in your personal Haven.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-green-600">[✓]</span>
                <span>Stop Procrastinating: Use the integrated Pomodoro system to stay on track.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">[✓]</span>
                <span>Build Your Haven: Purchase and upgrade furniture for your pixel room.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600">[✓]</span>
                <span>Track Progress: Real-time analytics for your study streaks and focus time.</span>
              </li>
            </ul>
          </div>
          <h2 className="text-[14px] mb-6 border-b-4 border-black pb-2 text-red-600 font-bold">
            ★★★★★ Try Pixeldoro as well!
          </h2>
          <div className="space-y-6 text-[10px] leading-relaxed">
            Different people have different approaches to problems, such as productivity. Here is another amazing productivity app I discovered that has a totally yet amazing approach to keep you focused. :) <br/> I promise, it's wonderful!
          </div>
        </div>

        {/* Right Column: The "How" (Tutorial) */}
        <div className="terminal-card shadow-[12px_12px_0_0_#0ea5e9]">
          <h2 className="text-[14px] mb-6 border-b-4 border-black pb-2 text-blue-600 font-bold">
            {">"} BOOT_SEQUENCE
          </h2>
          <div className="space-y-4 text-[9px]">
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">01</span>
                <p>SYNC_ACCOUNT: Confirm your identity to enable cloud-save for your Haven items.</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">02</span>
                <p>FOCUS_MODE: Complete Pomodoro sessions to mine currency (Coins).</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">03</span>
                <p>EXPAND_BASE: Visit the shop to purchase upgrades and rare pixel art furniture.</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">04</span>
                <p>ACHIEVE: Unlock medals for consistency and focus milestones.</p>
            </div>
            <div className="flex gap-4 items-center bg-gray-100 p-3 border-2 border-black">
                <span className="text-xl">Try something new?</span>
                <p>Requestion new features and sign up for the waitlist. :D</p>
            </div
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pb-10 text-[8px] opacity-60 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-8">
            <span>LOC: KUALA_LUMPUR</span>
            <span>USER_COUNT: 001_ACTIVE</span>
            <span className="text-green-700 animate-pulse font-bold">SYSTEM: STABLE</span>
        </div>
        <p>© 2026 CANDY. DESIGNED FOR AUTONOMOUS LEARNERS.</p>
      </div>
    </div>
  );
};
