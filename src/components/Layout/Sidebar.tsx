import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom'; // <--- NEW
import * as packageJson from '../../../package.json';

// 1. UPDATED INTERFACE: Removed activeTab and onTabChange
interface SidebarProps {
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Hooks for routing
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: 'dashboard', path: '/app', icon: 'fa-shield-halved', label: t('status') },
    { id: 'focus', path: '/app/focus', icon: 'fa-hourglass-start', label: t('quest') },
    { id: 'tinyhome', path: '/app/tinyhome', icon: 'fa-campground', label: t('haven') },
    { id: 'schedule', path: '/app/schedule', icon: 'fa-map', label: t('log') },
    { id: 'social', path: '/app/social', icon: 'fa-khanda', label: t('party') }
  ];

  const handleTabClick = (path: string) => {
    navigate(path); // Navigate to the URL instead of changing state
    setIsOpen(false); 
  };

  return (
    <>
      {/* 1. MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#3e2723] border-t-4 border-[#2a1b0a] z-[100] p-4 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
        <h2 className="text-[10px] text-[#ffaa00] font-pixel">
          <i className="fas fa-compass mr-2 animate-spin-slow"></i> {t('studi_os')}
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#8d6e63] border-4 border-[#2a1b0a] text-white px-3 py-1 text-[8px] font-pixel shadow-[4px_4px_0_0_#2a1b0a] active:translate-y-1 active:shadow-none"
        >
          {isOpen ? t('close') : '📜 ' + t('OPEN MENU')}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#fffdf5] border-r-4 border-[#3e2723] flex flex-col transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:flex
        z-[90] h-full md:h-screen pb-16 md:pb-0
      `}>
        
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
          .font-pixel { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
          .menu-container-nature { border: 4px solid #3e2723; box-shadow: 8px 8px 0 0 #2a1b0a; background: #fdf4db; padding: 20px 16px; background-image: radial-gradient(#d7ccc8 1px, transparent 1px); background-size: 16px 16px; }
          .menu-option { background: transparent; border: none; padding: 12px; margin-bottom: 8px; display: flex; align-items: center; width: 100%; text-align: left; transition: all 0.2s; }
          .menu-icon-big { font-size: 1.2rem; width: 40px; text-align: center; margin-right: 12px; color: #5d4037; }
          .menu-option.active { background: #4caf50; border: 4px solid #3e2723; box-shadow: 4px 4px 0 0 #2a1b0a; transform: translate(-2px, -2px); }
          .menu-option.active .menu-icon-big, .menu-option.active span { color: white !important; }
          .active-cursor-nature { position: absolute; left: -35px; color: #3e2723; font-size: 18px; animation: blade-bob 0.8s steps(2, start) infinite; }
          @keyframes blade-bob { 0% { transform: translateX(0) rotate(45deg); } 100% { transform: translateX(5px) rotate(45deg); } }
          .animate-spin-slow { animation: spin 8s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        <div className="p-8 hidden md:block">
          <h2 className="text-[12px] text-[#3e2723] font-pixel flex items-center gap-3">
            <span className="bg-[#3e2723] text-[#ffaa00] p-2 border-2 border-[#2a1b0a] shadow-[4px_4px_0_0_#d7ccc8]">
              <i className="fas fa-compass animate-spin-slow"></i>
            </span>
            {t('studi_os')}
          </h2>
        </div>

        <nav className="flex-1 m-4 menu-container-nature overflow-y-auto">
          <div className="space-y-4">
            {menuItems.map((item) => {
              // Check if current URL matches the item's path
              // For dashboard (root), we check exact match, otherwise check if path starts with item path
              const isActive = item.id === 'dashboard' 
                ? location.pathname === '/app' || location.pathname === '/app/'
                : location.pathname.startsWith(item.path);

              return (
                <div key={item.id} className="relative ml-8">
                  {isActive && (
                    <span className="active-cursor-nature">
                      <i className="fas fa-khanda"></i>
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleTabClick(item.path)}
                    className={`menu-option ${isActive ? 'active' : 'opacity-60 hover:opacity-100'}`}
                  >
                    <i className={`fas ${item.icon} menu-icon-big`}></i>
                    <span className="font-pixel text-[9px] text-[#3e2723] tracking-tighter font-bold">
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="p-4 bg-[#fdf4db] border-t-4 border-[#3e2723] mt-auto">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-4 px-4 py-3 bg-[#fffdf5] text-[#d32f2f] border-4 border-[#3e2723] font-pixel shadow-[4px_4px_0_0_#2a1b0a] active:translate-y-1 active:shadow-none transition-all hover:bg-red-50"
          >
            <i className="fas fa-door-open"></i>
            <span className="text-[8px]">{t('shut_down')}</span>
          </button>
          <div className="mt-6 flex flex-col items-center gap-1 opacity-40">
            <p className="text-[6px] text-[#5d4037] font-pixel uppercase tracking-widest">
              v.{packageJson.version}
            </p>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 bg-[#2a1b0a]/60 backdrop-blur-sm z-[80] md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default Sidebar;