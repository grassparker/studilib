import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import * as packageJson from '../../../package.json';

interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', path: '/app', icon: 'fa-shapes', label: t('status') },
    { id: 'focus', path: '/app/focus', icon: 'fa-moon', label: t('quest') },
    { id: 'tinyhome', path: '/app/tinyhome', icon: 'fa-house-user', label: t('haven') },
    { id: 'schedule', path: '/app/schedule', icon: 'fa-compass', label: t('log') },
    { id: 'social', path: '/app/social', icon: 'fa-users-viewfinder', label: t('party') }
  ];

  const handleTabClick = (path: string) => {
    navigate(path);
    setIsOpen(false); 
  };

  return (
    <>
      {/* MOBILE HEADER - Sleeker Floating Design */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#000d3d]/90 backdrop-blur-lg border-b border-white/10 z-[100] px-6 flex justify-between items-center shadow-xl">
        <h2 className="text-[10px] text-blue-200 font-pixel tracking-tighter">
          <i className="fas fa-feather-alt mr-2 text-blue-400"></i> STUDILIB
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={onLogout}
            className="text-white bg-red-500/10 p-2 rounded-lg border border-red-400/20 hover:bg-red-500/20 active:scale-95 transition-all"
            title={t('shut_down')}
          >
            <i className="fas fa-power-off text-red-400"></i>
          </button>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white bg-white/5 p-2 rounded-lg border border-white/10 active:scale-95 transition-transform"
          >
            <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars-staggered'}`}></i>
          </button>
        </div>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#000826]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col transition-all duration-500 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:flex
        z-[110] h-screen
      `}>
        
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          .font-pixel { font-family: 'Press Start 2P', monospace; }
          
          .menu-container-tech { 
            background: rgba(255, 255, 255, 0.02);
            border-radius: 20px;
            margin: 10px;
            padding: 10px;
          }

          .menu-option { 
            position: relative;
            padding: 14px 16px; 
            margin-bottom: 4px; 
            display: flex; 
            align-items: center; 
            width: 100%; 
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
          }

          .menu-icon-big { 
            font-size: 1rem; 
            width: 28px; 
            text-align: center; 
            margin-right: 12px; 
            color: rgba(255, 255, 255, 0.3); 
            transition: color 0.3s;
          }

          /* Active State: Horizon Sand Glow */
          .menu-option.active { 
            background: rgba(230, 204, 178, 0.08); 
          }

          .menu-option.active .menu-icon-big { color: #e6ccb2 !important; }
          .menu-option.active span { color: white !important; }

          /* Decorative Line for Active */
          .menu-option.active::after {
            content: '';
            position: absolute;
            left: 0;
            top: 25%;
            height: 50%;
            width: 3px;
            background: #e6ccb2;
            border-radius: 0 4px 4px 0;
            box-shadow: 0 0 10px #e6ccb2;
          }

          .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        `}</style>

        {/* LOGO AREA */}
        <div className="p-8 hidden md:block">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/app')}>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center transition-all group-hover:border-blue-400/50 group-hover:bg-blue-500/20 shadow-lg">
              <i className="fas fa-feather-alt text-blue-300 transition-transform group-hover:rotate-12"></i>
            </div>
            <div>
              <h2 className="text-[11px] text-white font-pixel tracking-widest">STUDILIB</h2>
              <p className="text-[6px] text-blue-300/40 font-pixel mt-1">HORIZON v2</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 overflow-y-auto mt-16 md:mt-0">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = item.id === 'dashboard' 
                ? location.pathname === '/app' || location.pathname === '/app/'
                : location.pathname.startsWith(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.path)}
                  className={`menu-option ${isActive ? 'active' : 'opacity-100 hover:bg-white/5'}`}
                >
                  <i className={`fas ${item.icon} menu-icon-big`}></i>
                  <span className={`font-pixel text-[8px] tracking-[0.15em] transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* FOOTER / LOGOUT */}
        <div className="p-6 mt-auto">
          <div className="menu-container-tech !bg-transparent !m-0 !mb-6 border border-white/5 p-4">
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-4 px-2 py-1 text-slate-500 hover:text-red-400 transition-colors group"
            >
              <i className="fas fa-power-off text-[12px] opacity-40 group-hover:opacity-100"></i>
              <span className="font-pixel text-[7px] tracking-widest uppercase">{t('shut_down')}</span>
            </button>
          </div>
          
          <div className="flex flex-col items-center gap-2 opacity-30">
            <div className="h-[1px] w-8 bg-blue-300/50"></div>
            <p className="text-[6px] text-blue-200 font-pixel uppercase tracking-[0.3em]">
              SYS_REV_{packageJson.version}
            </p>
          </div>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#000d3d]/60 backdrop-blur-md z-[105] md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;