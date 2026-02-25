import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import updatesData from '../public/updates.json'; // Adjust path as needed

export const UpdatesPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
  
    const hasRecentUpdate = () => {
        if (!updatesData.length) return false;
  
        const latestDate = new Date(updatesData[0].date); // Assuming JSON is sorted newest first
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - latestDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
        return diffDays <= 2; // Show "NEW" if update is within the last 7 days
    };

    return (
        <div className="social-scope max-w-4xl mx-auto p-4 md:p-8 min-h-screen">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@700&display=swap');
                .font-pixel { font-family: 'Press Start 2P', 'LXGW WenKai TC', monospace; }
                .social-scope *:not(i) { font-family: 'Press Start 2P', 'WDXL Lubrifont SC', monospace !important; text-transform: uppercase; }
                .social-scope i { font-family: "Font Awesome 6 Free" !important; font-weight: 900; }
        
                .log-entry {
                    border-left: 4px solid black;
                    padding-left: 20px;
                    position: relative;
                    margin-bottom: 40px;
                }
            .log-entry::before {
                content: '';
                position: absolute;
                left: -10px;
                top: 0;
                width: 16px;
                height: 16px;
                background: black;
                border: 4px solid #FBBF24;
            }
            .tag-pixel {
                font-size: 6px;
                padding: 2px 6px;
                border: 1px solid black;
                margin-right: 5px;
            }
        `}</style>

        {/* HEADER */}
        <div className="flex justify-between items-center mb-12 border-b-8 border-black pb-6">
            <div>
                <h1 className="text-xl md:text-2xl font-bold">SYSTEM_LOGS</h1>
                <p className="text-[8px] text-slate-500 mt-2">STUDILIB_VERSION_HISTORY</p>
            </div>
            <button onClick={() => navigate(-1)} className="bg-black text-white p-4 text-[10px] hover:bg-slate-800">
                [BACK_TO_CORE]
            </button>
        </div>

        {/* UPDATES LIST */}
        <div className="relative border-l-4 border-slate-200 ml-4 pl-8 py-4">
            {updatesData.map((update) => (
                <div key={update.id} className="log-entry">
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                    <span className="text-[10px] text-blue-600 font-bold">{update.id}</span>
                    <span className="text-[8px] text-slate-400">{update.date}</span>
                    <span className={`text-[8px] px-2 py-1 border-2 border-black ${
                        update.type === 'FEATURE' ? 'bg-green-200' : 
                        update.type === 'FIX' ? 'bg-red-200' : 'bg-blue-200'
                    }`}>
                    {update.type}
                    </span>
                </div>
            
                <h2 className="text-[12px] md:text-[14px] mb-3">{update.title}</h2>
                    <p className="text-[10px] leading-relaxed text-slate-700 mb-4 bg-white p-4 border-2 border-dashed border-slate-300">
                        {update.content}
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {update.tags.map(tag => (
                            <span key={tag} className="tag-pixel bg-slate-100">{tag}</span>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        <footer className="mt-20 text-center border-t-4 border-black pt-8">
            <p className="text-[8px] animate-pulse">END_OF_TRANSMISSION</p>
        </footer>
        </div>
    );
};