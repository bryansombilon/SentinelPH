
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

  const getLevelColor = (level: string) => {
    switch(level) {
        case '0': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case '1': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        case '2': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
        case '3': return 'bg-red-500/20 text-red-400 border-red-500/30';
        case '4': return 'bg-red-600/20 text-red-500 border-red-600/30';
        case '5': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        case '?': return 'bg-gray-700/30 text-gray-400 border-gray-600/30 animate-pulse'; // Loading/Unknown
        default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="flex flex-col h-full w-full p-4 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-none">
            <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 10.7 8 10a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h6a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2l-1 .7"/></svg>
                <h2 className="text-sm font-bold text-gray-200 tracking-tight">VOLCANO STATUS</h2>
            </div>
            <a href="https://wovodat.phivolcs.dost.gov.ph/bulletin/list-of-bulletin" target="_blank" rel="noreferrer" className="text-[9px] text-gray-500 hover:text-white font-mono uppercase transition-colors">
                FULL LIST &rarr;
            </a>
        </div>

        {/* Content */}
        <div className="flex-grow min-h-0 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
            {/* Show list even if loading, as we might have cached or default data immediately */}
            {(status === LoadingState.LOADING && data.length === 0) ? (
                <div className="h-full flex items-center justify-center text-[10px] font-mono text-gray-500 animate-pulse">
                    Retrieving bulletins...
                </div>
            ) : (
                <div className="flex gap-2 h-full">
                    {data.map((volcano, idx) => (
                        <div key={idx} className="flex-none w-28 h-full bg-bento-highlight/10 border border-white/5 rounded-lg p-2 flex flex-col justify-between hover:bg-bento-highlight/20 transition-colors">
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-gray-200 uppercase truncate" title={volcano.name}>
                                    {volcano.name}
                                </div>
                                <div className="text-[8px] text-gray-500 font-mono leading-tight truncate">
                                    {volcano.date}
                                </div>
                            </div>
                            
                            <div className={`text-center py-1 rounded border text-[10px] font-mono font-bold mt-1 ${getLevelColor(volcano.level)}`}>
                                LEVEL {volcano.level}
                            </div>
                        </div>
                    ))}
                    {status === LoadingState.ERROR && data.length === 0 && (
                        <div className="text-[10px] text-red-400 flex items-center h-full px-4">
                            Source Unavailable
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default VolcanoWidget;
