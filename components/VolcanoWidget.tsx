
import React, { useEffect, useState } from 'react';
import { fetchVolcanoStatus } from '../services/volcanoService';
import { VolcanoStatus, LoadingState } from '../types';

const VolcanoWidget: React.FC = () => {
  const [data, setData] = useState<VolcanoStatus[]>([]);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);

  const updateData = async () => {
    setStatus(LoadingState.LOADING);
    try {
      const result = await fetchVolcanoStatus();
      setData(result);
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
    }
  };

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 30 * 60 * 1000); // 30 mins
    return () => clearInterval(interval);
  }, []);

  const getVisuals = (level: string) => {
    switch(level) {
        case '0': return {
            bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
            border: 'border-emerald-500/30',
            text: 'text-emerald-400',
            label: 'NORMAL',
            glow: 'shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            )
        };
        case '1': return {
            bg: 'bg-yellow-500/10 hover:bg-yellow-500/20',
            border: 'border-yellow-500/30',
            text: 'text-yellow-400',
            label: 'LOW LEVEL',
            glow: 'shadow-[0_0_10px_-3px_rgba(234,179,8,0.3)]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            )
        };
        case '2': return {
            bg: 'bg-orange-500/10 hover:bg-orange-500/20',
            border: 'border-orange-500/50',
            text: 'text-orange-400',
            label: 'MODERATE',
            glow: 'shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]',
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            )
        };
        case '3': return {
            bg: 'bg-red-600/20 hover:bg-red-600/30',
            border: 'border-red-500',
            text: 'text-red-500',
            label: 'HIGH UNREST',
            glow: 'shadow-[0_0_20px_-3px_rgba(239,68,68,0.5)]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3a9 9 0 0 0 2.5 3.8z"></path></svg>
            )
        };
        case '4': return {
            bg: 'bg-rose-700/30 hover:bg-rose-700/40',
            border: 'border-rose-500 ring-1 ring-rose-500/50',
            text: 'text-rose-500',
            label: 'INTENSE',
            glow: 'shadow-[0_0_25px_-5px_rgba(244,63,94,0.6)]',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path><path d="M8.5 8.5A2.5 2.5 0 0 0 11 6c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3a9 9 0 0 0 2.5 3.8z"></path></svg>
            )
        };
        case '5': return {
            bg: 'bg-purple-700/30 hover:bg-purple-700/40',
            border: 'border-purple-500 ring-2 ring-purple-500',
            text: 'text-purple-400',
            label: 'HAZARDOUS',
            glow: 'shadow-[0_0_30px_-5px_rgba(168,85,247,0.7)]',
             icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-ping"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            )
        };
        default: return { // Unknown/Loading
            bg: 'bg-gray-800/50',
            border: 'border-gray-700/50',
            text: 'text-gray-500',
            label: 'UNKNOWN',
            glow: '',
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        };
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-3 md:p-4 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-none">
            <div className="flex items-center gap-2">
                <div className="p-1 bg-orange-500/10 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 10.7 8 10a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2l-1 .7"/></svg>
                </div>
                <h2 className="text-sm font-bold text-gray-200 tracking-tight">VOLCANO STATUS</h2>
            </div>
            <a href="https://wovodat.phivolcs.dost.gov.ph/bulletin/list-of-bulletin" target="_blank" rel="noreferrer" className="text-[9px] px-2 py-1 bg-white/5 hover:bg-white/10 rounded border border-white/5 text-gray-400 hover:text-white font-mono uppercase transition-colors">
                Bulletin List &rarr;
            </a>
        </div>

        {/* Content */}
        <div className="flex-grow min-h-0 overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar">
            {(status === LoadingState.LOADING && data.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                    <div className="w-6 h-6 border-2 border-bento-accent/30 border-t-bento-accent rounded-full animate-spin"></div>
                    <div className="text-[10px] font-mono animate-pulse">Scanning WOVOdat...</div>
                </div>
            ) : (
                <div className="flex gap-3 h-full px-1">
                    {data.map((volcano, idx) => {
                        const style = getVisuals(volcano.level);
                        return (
                            <a 
                                href={volcano.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                key={idx} 
                                className={`flex-none w-36 h-full rounded-xl border p-3 flex flex-col justify-between transition-all duration-300 ${style.bg} ${style.border} ${style.glow} hover:scale-[1.03] cursor-pointer group shadow-lg`}
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-grow min-w-0">
                                        <div className="text-xs font-bold text-gray-100 uppercase truncate leading-tight group-hover:text-white tracking-wide" title={volcano.name}>
                                            {volcano.name}
                                        </div>
                                        <div className="text-[9px] text-gray-400 font-mono leading-tight mt-1 truncate opacity-80">
                                            {volcano.date}
                                        </div>
                                    </div>
                                    <div className={`flex-none ${style.text} drop-shadow-md`}>
                                        {style.icon}
                                    </div>
                                </div>
                                
                                <div className="mt-2">
                                    <div className={`text-[9px] font-mono opacity-80 mb-0.5 ${style.text} font-semibold`}>
                                        LEVEL {volcano.level}
                                    </div>
                                    <div className={`text-[11px] font-black tracking-wider uppercase ${style.text} leading-none`}>
                                        {style.label}
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                    
                    {status === LoadingState.ERROR && data.length === 0 && (
                        <div className="flex-none w-full flex items-center justify-center text-[10px] text-red-400 border border-red-900/30 rounded-xl bg-red-900/10">
                            <span>Unable to load data.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default VolcanoWidget;
