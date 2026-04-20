import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import updatesData from './updates.json'; // Adjust path as needed

export const Updates: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
  
    const themeStyles = (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:wght@400;700&display=swap');
            
            .updates-scope { 
                font-family: 'Inter', sans-serif; 
                background: radial-gradient(circle at top, #001a4d 0%, #000d3d 100%);
                color: #e2e8f0;
            }
            .pixel-font { font-family: 'Press Start 2P', monospace; }
            
            /* Deep Sea Timeline */
            .log-entry {
                border-left: 1px dashed rgba(230, 204, 178, 0.3);
                padding-left: 40px;
                position: relative;
                margin-bottom: 60px;
            }

            .log-entry::before {
                content: '';
                position: absolute;
                left: -5px;
                top: 0;
                width: 9px;
                height: 9px;
                border-radius: 50%;
                background: #e6ccb2;
                box-shadow: 0 0 15px rgba(230, 204, 178, 0.6);
            }

            .glass-box {
                background: rgba(255, 255, 255, 0.03);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 24px;
                border-radius: 20px;
                transition: all 0.3s ease;
            }

            .glass-box:hover {
                border-color: rgba(230, 204, 178, 0.4);
                transform: translateX(5px);
                background: rgba(255, 255, 255, 0.05);
            }

            .tag-tech {
                font-size: 7px;
                font-family: 'Press Start 2P', monospace;
                padding: 5px 10px;
                background: rgba(230, 204, 178, 0.1);
                border: 1px solid rgba(230, 204, 178, 0.2);
                color: #e6ccb2;
                border-radius: 4px;
            }

            .btn-return {
                border: 1px solid rgba(230, 204, 178, 0.4);
                color: #e6ccb2;
                background: transparent;
                transition: all 0.3s;
            }

            .btn-return:hover {
                background: #e6ccb2;
                color: #000d3d;
                box-shadow: 0 0 20px rgba(230, 204, 178, 0.4);
            }
        `}</style>
    );

    return (
        <div className="updates-scope min-h-screen p-6 md:p-12 overflow-x-hidden">
            {themeStyles}

            {/* HEADER: LOG_METADATA */}
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end mb-20 border-b border-white/10 pb-10">
                <div>
                    <h1 className="pixel-font text-xl md:text-2xl text-[#e6ccb2] tracking-tighter">ARCHIVE_LOGS</h1>
                    <p className="pixel-font text-[8px] text-blue-400/60 mt-4 tracking-[0.3em] uppercase">Kernel_Phase_History // Depth_1200m</p>
                </div>
                <button 
                    onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} 
                    className="pixel-font btn-return px-8 py-4 text-[9px] mt-8 md:mt-0 rounded-xl"
                >
                    [ RETURN_TO_CORE ]
                </button>
            </div>

            {/* LOG_STREAM */}
            <div className="max-w-4xl mx-auto ml-2 md:mx-auto">
                {updatesData.map((update) => (
                    <div key={update.id} className="log-entry">
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <span className="pixel-font text-[10px] text-blue-400">{update.id}</span>
                            <span className="font-mono text-[11px] text-white/30 tracking-widest">{update.date}</span>
                            <span className={`pixel-font text-[7px] px-3 py-1.5 rounded-md border ${
                                update.type === 'FEATURE' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 
                                update.type === 'FIX' ? 'border-rose-500/50 text-rose-400 bg-rose-500/10' : 
                                'border-blue-500/50 text-blue-400 bg-blue-500/10'
                            }`}>
                                {update.type}
                            </span>
                        </div>
                
                        <div className="glass-box">
                            <h2 className="text-lg md:text-xl font-bold text-white mb-3 tracking-tight">
                                {update.title}
                            </h2>
                            <p className="text-[13px] leading-relaxed text-white/60 mb-6 font-light">
                                {update.content}
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {update.tags.map(tag => (
                                    <span key={tag} className="tag-tech">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="mt-32 text-center border-t border-white/5 pt-16 pb-20">
                <div className="inline-block px-6 py-2 rounded-full border border-white/5 bg-white/5">
                    <p className="pixel-font text-[6px] text-white/20 tracking-[0.8em] uppercase">--- End_of_Transmission ---</p>
                </div>
            </footer>
        </div>
    );
};