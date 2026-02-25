import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as packageJson from '../../package.json';
import '../../index.css';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const menuItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: t('status') },
    { id: 'focus', icon: 'fa-stopwatch', label: t('quest') },
    { id: 'tinyhome', icon: 'fa-home', label: t('haven') },
    { id: 'schedule', icon: 'fa-calendar-alt', label: t('log') },
    { id: 'social', icon: 'fa-users', label: t('party') }
  ];

  const handleTabClick = (id: string) => {
    onTabChange(id);
    setIsOpen(false); 
  };

  return (
    <>
      {/* 1. MOBILE BOTTOM BAR */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white border-t-4 border-black z-[100] p-4 flex justify-between items-center">
        <h2 className="text-[10px] text-black font-pixel">
          <i className="fas fa-terminal mr-2 text-amber-500"></i> {t('studi_os')}
        </h2>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white border-4 border-black text-black px-3 py-1 text-[8px] font-pixel shadow-[4px_4px_0_0_#000] active:translate-y-1 active:shadow-none"
        >
          {isOpen ? t('close') : t('OPEN MENU')}
        </button>
      </div>

      {/* 2. SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#fdfdfd] border-r-4 border-black flex flex-col transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:flex
        z-[90] h-full md:h-screen pb-16 md:pb-0
      `}>
        
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=WDXL+Lubrifont+SC&display=swap');
          .font-pixel { font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace; }
          
          .menu-container-social {
            border: 4px solid black;
            box-shadow: 8px 8px 0 0 rgba(0,0,0,0.1);
            background: white; 
            padding: 20px 16px;
          }

          .menu-option {
            background: transparent;
            border: none;
            padding: 12px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            width: 100%;
            text-align: left;
            transition: transform 0.1s;
          }

          .menu-icon-big {
            font-size: 1.2rem;
            width: 40px;
            text-align: center;
            margin-right: 12px;
            color: black;
          }

          .menu-option.active {
            background: #FBBF24;
            border: 4px solid black;
            box-shadow: 4px 4px 0 0 black;
            transform: translate(-2px, -2px);
          }

          .active-cursor-black {
            position: absolute;
            left: -40px;
            color: black;
            font-size: 18px;
            animation: finger-bob 0.6s steps(2, start) infinite;
          }

          @keyframes finger-bob {
            0% { transform: translateX(0); }
            100% { transform: translateX(5px); }
          }
        `}</style>

        {/* Desktop Header */}
        <div className="p-8 hidden md:block">
          <h2 className="text-[12px] text-black font-pixel flex items-center gap-3">
            <span className="bg-black text-amber-400 p-2 border-2 border-black">
              <i className="fas fa-terminal"></i>
            </span>
            {t('studi_os')}
          </h2>
        </div>

        {/* SOCIAL MENU BOX */}
        <nav className="flex-1 m-4 menu-container-social overflow-y-auto">
          <div className="space-y-4">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative ml-10">
                  {isActive && (
                    <span className="active-cursor-black font-pixel">
                      <i className="fas fa-hand-point-right"></i>
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleTabClick(item.id)}
                    className={`menu-option ${isActive ? 'active' : 'opacity-40 hover:opacity-100'}`}
                  >
                    <i className={`fas ${item.icon} menu-icon-big`}></i>
                    <span className="font-pixel text-[10px] text-black tracking-tighter">
                      {item.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </nav>

        {/* System Footer - Consolidated for Visibility */}
        <div className="p-4 bg-white border-t-4 border-black mt-auto">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-4 px-4 py-3 bg-white text-red-600 border-4 border-black font-pixel shadow-[4px_4px_0_0_black] active:translate-y-1 active:shadow-none transition-all hover:bg-red-50"
          >
            <i className="fas fa-power-off"></i>
            <span className="text-[8px]">{t('shut_down')}</span>
          </button>
          <p className="text-[6px] text-slate-400 text-center font-pixel mt-6 uppercase tracking-widest">
            v.{packageJson.version} - {t('version')}
          </p>
        </div>
      </aside>

      {/* OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;