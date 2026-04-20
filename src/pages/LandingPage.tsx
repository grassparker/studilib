import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import updatesData from './updates.json';

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
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
    setTimeout(() => navigate('/login'), 250);
  };

  const hasRecentUpdate = () => {
    if (!updatesData || updatesData.length === 0) return false;
    const latestDate = new Date(updatesData[0].date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - latestDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  useEffect(() => {
    if (latestUpdate && latestUpdate.id) {
      const sessionKey = `studilib_update_${latestUpdate.id}_${new Date().toDateString()}`;
      const lastSeenVersion = localStorage.getItem(sessionKey);
      if (!lastSeenVersion) {
        setShowPopup(true);
      }
    }
  }, [latestUpdate]);

  const dismissPopup = () => {
    const sessionKey = `studilib_update_${latestUpdate.id}_${new Date().toDateString()}`;
    localStorage.setItem(sessionKey, 'seen');
    setShowPopup(false);
  };

  return (
    <div className={`min-h-screen relative overflow-x-hidden transition-all duration-300 ${isFlashing ? 'bg-white' : 'bg-gradient-to-b from-[#000d3d] via-[#1a478a] via-[#7a98b9] to-[#e6ccb2]'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;500;700&display=swap');
        
        .tech-font { font-family: 'Inter', sans-serif; }
        .pixel-font { font-family: 'Press Start 2P', monospace; }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 1.5rem;
          transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .glass-card:hover {
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-4px);
        }

        .btn-horizon {
          background: rgba(230, 204, 178, 0.1);
          border: 1px solid rgba(230, 204, 178, 0.2);
          color: #e6ccb2;
          padding: 16px 32px;
          font-size: 9px;
          border-radius: 12px;
          font-family: 'Press Start 2P', monospace;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .btn-horizon:hover { 
          background: #e6ccb2; 
          color: #000d3d;
          box-shadow: 0 0 25px rgba(230, 204, 178, 0.3);
        }

        .timeline-stream {
          position: absolute;
          left: 19px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2) 15%, rgba(255, 255, 255, 0.2) 85%, transparent);
        }

        .brand-glow {
          text-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Language Switcher */}
      <button 
        onClick={toggleLang}
        className="fixed top-6 right-6 z-50 pixel-font text-[8px] text-white/50 hover:text-[#e6ccb2] transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md"
      >
        {i18n.language === 'EN' ? 'ZH_CN' : 'EN_US'}
      </button>

      {/* HERO SECTION */}
      <div className="max-w-[1400px] mx-auto px-6 pt-32 pb-20 md:pt-48 md:pb-32 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_12px_#60a5fa] animate-pulse"></span>
          <p className="pixel-font text-[8px] md:text-[10px] text-blue-200 tracking-[0.4em] uppercase">
            {t('Welcome!') || 'Precision Focus Environment'}
          </p>
        </div>
        
        <h1 className="tech-font text-6xl md:text-9xl font-black text-white mb-12 tracking-tighter brand-glow">
          STUDI<span className="text-[#e6ccb2]">LIB</span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
          <button onClick={handleBootClick} className="btn-horizon w-full sm:w-auto">
            {t('start_uplink')}
          </button>
          
          <a 
            href="https://github.com/grassparker/studilib"
            target="_blank"
            rel="noreferrer"
            className="tech-font text-white/60 hover:text-white px-8 py-4 text-xs font-bold uppercase tracking-widest transition-all"
          >
            {t('source_code')}
          </a>
        </div>
      </div>

      {/* GRID LAYOUT */}
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 mb-32">
        
        {/* MISSION SECTION */}
        <div className="glass-card p-8 md:p-12 tech-font">
          <h2 className="pixel-font text-[10px] text-blue-300 mb-10 flex items-center gap-4">
            <span className="opacity-30">0x01</span> {t("mission_objective")}
          </h2>
          <div className="space-y-8 text-slate-200">
            <p className="text-xl md:text-2xl font-light leading-relaxed italic text-white/90">
              "{t("mission_desc")}"
            </p>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="h-px w-6 bg-[#e6ccb2]/30 group-hover:w-10 transition-all"></div>
                  <span className="text-sm font-medium tracking-wide opacity-80 group-hover:opacity-100">
                    {t(`mission_item${i}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SEQUENCE SECTION */}
        <div className="glass-card p-8 md:p-12">
          <h2 className="pixel-font text-[10px] text-[#e6ccb2] mb-10 flex items-center gap-4">
            <span className="opacity-30">0x02</span> {t("BOOT_SEQUENCE")}
          </h2>
          <div className="relative pl-8">
            <div className="timeline-stream"></div>
            {['01', '02', '03', '04', '05'].map((step) => (
              <div key={step} className="relative flex gap-8 mb-8 items-center group">
                <div className="w-2 h-2 rounded-full bg-slate-700 border border-[#000d3d] z-10 group-hover:bg-blue-300 group-hover:shadow-[0_0_8px_#93c5fd] transition-all"></div>
                <div className="flex-1 p-4 bg-white/5 border border-white/5 rounded-xl group-hover:border-white/10 transition-all">
                  <p className="tech-font text-[10px] md:text-xs text-white/70 uppercase tracking-widest font-bold">
                    {t(`boot_${step}`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PARTNER MODULE */}
      <div className="max-w-[1400px] mx-auto px-6 mb-32">
        <div className="glass-card overflow-hidden">
          <div className="flex flex-col md:flex-row items-center gap-10 p-8 md:p-12">
            <div className="relative">
              <div className="w-24 h-24 bg-[#000d3d] rounded-3xl flex items-center justify-center text-5xl shadow-2xl border border-white/10">
                🍅
              </div>
              <div className="absolute -top-2 -right-2 pixel-font text-[6px] bg-[#e6ccb2] text-[#000d3d] px-2 py-1 rounded">
                PRO
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <h3 className="pixel-font text-[8px] text-blue-900 uppercase tracking-widest">External_Integrations</h3>
              <p className="tech-font text-2xl font-bold text-white tracking-tight">
                {t("pixeldoro_desc")}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[7px] pixel-font text-slate-600">
                <span>// VERIFIED_PROTOCOL</span>
                <span>// VIBE_SYNC_ACTIVE</span>
              </div>
            </div>

            <a href="https://pixeldoro.io" target="_blank" rel="noreferrer" className="btn-horizon">
              VISIT_PIXELDORO
            </a>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="max-w-[1400px] mx-auto px-6 pb-12">
        <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 pixel-font text-[7px] text-white/70 tracking-widest uppercase">
            <span>LOC: KUALA_LUMPUR</span>
            <span>UPLINK_STATS: {t("user_count")}</span>
            <span className="text-slate-600">SYSTEM_OPERATIONAL</span>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-4">
            <button onClick={() => navigate('/updates')} className="pixel-font text-[8px] text-blue-900 hover:text-white transition-colors">
              {hasRecentUpdate() ? "▲ UPDATE_AVAILABLE" : "VIEW_LOGS"}
            </button>
            <p className="tech-font text-[10px] bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent font-medium tracking-widest uppercase">
              © 2026 CANDY // TWILIGHT_INTERFACE
            </p>
          </div>
        </div>
      </footer>

      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#000d3d]/80 backdrop-blur-xl">
          <div className="glass-card max-w-md w-full p-8 md:p-10 border-blue-400/30 shadow-2xl">
            <div className="pixel-font text-[7px] text-blue-300 bg-blue-400/10 px-3 py-1 rounded inline-block mb-6 uppercase tracking-widest">
              Incoming_Signal
            </div>
            <h2 className="tech-font text-2xl font-bold text-white mb-4 tracking-tight uppercase">
              {latestUpdate?.title}
            </h2>
            <p className="tech-font text-slate-400 text-sm leading-relaxed mb-8">
              {latestUpdate?.content}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { dismissPopup(); navigate('/updates'); }}
                className="btn-horizon w-full"
              >
                ACCESS_LOGS
              </button>
              <button onClick={dismissPopup} className="pixel-font text-[7px] text-slate-500 hover:text-white transition-colors py-2 uppercase">
                Ignore Signal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};