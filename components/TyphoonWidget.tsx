
import React, { useEffect, useState } from 'react';
import { fetchTyphoonData } from '../services/typhoonService';
import { TyphoonData, LoadingState } from '../types';

const TyphoonWidget: React.FC = () => {
  const [data, setData] = useState<TyphoonData | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);

  const updateData = async () => {
    setStatus(LoadingState.LOADING);
    try {
      const result = await fetchTyphoonData();
      setData(result);
      setStatus(LoadingState.SUCCESS);
    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
    }
  };

  useEffect(() => {
    updateData();
    const interval = setInterval(updateData, 15 * 60 * 1000); // 15 mins
    return () => clearInterval(interval);
  }, []);

  if (status === LoadingState.LOADING && !data) {
      return (
          <div className="flex items-center justify-center h-full w-full">
              <span className="text-bento-accent text-xs font-mono animate-pulse">Scanning PAGASA Bulletins...</span>
          </div>
      );
  }

  if (status === LoadingState.ERROR) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center">
            <span className="text-red-500 font-mono text-xs mb-2">Connection Failed</span>
            <button onClick={updateData} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-mono text-gray-300">Retry</button>
        </div>
      );
  }

  if (!data || !data.hasCyclone) {
      return (
          <div className="flex flex-col h-full w-full relative">
               <div className="flex-none flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/><path d="M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z"/></svg>
                    <h2 className="text-lg font-bold text-gray-200 tracking-tight">TROPICAL CYCLONE</h2>
                 </div>
                 <span className="text-[10px] px-2 py-1 rounded border border-green-500 text-green-500 font-mono uppercase">CLEAR</span>
               </div>
               
               <div className="flex-grow flex flex-col items-center justify-center text-center p-4 opacity-70">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-3">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M2 12h20"/><path d="M12 2v20"/><circle cx="12" cy="12" r="4"/></svg>
                    </div>
                    <p className="text-gray-400 font-mono text-sm">No Active Tropical Cyclone</p>
                    <p className="text-gray-600 text-[10px] mt-1 max-w-[200px]">There are currently no active tropical cyclones within the Philippine Area of Responsibility (PAR).</p>
               </div>
               
               <div className="flex-none mt-3 pt-2 border-t border-bento-border/50 text-[10px] text-gray-600 font-mono text-center flex justify-between">
                <span>SOURCE: PAGASA</span>
                <span>STATUS: NORMAL</span>
              </div>
          </div>
      );
  }

  // Active Cyclone View
  return (
    <div className="flex flex-col h-full w-full">
         <div className="flex-none flex items-center justify-between mb-2">
             <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-bento-alert animate-spin-slow"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1 0 10 10"/></svg>
                <h2 className="text-lg font-bold text-white tracking-tight truncate max-w-[180px]">{data.name}</h2>
             </div>
             <a href={data.url} target="_blank" rel="noreferrer" className="text-[10px] px-2 py-1 rounded bg-bento-alert/20 text-bento-alert border border-bento-alert/50 font-mono uppercase hover:bg-bento-alert/30 transition-colors">
                 BULLETIN
             </a>
         </div>

         <div className="flex-none text-[10px] font-mono text-gray-400 mb-4 bg-bento-highlight/10 p-2 rounded border border-white/5">
            {data.summary}
         </div>

         <div className="flex-grow overflow-y-auto min-h-0 space-y-3 pr-2">
             {data.signals.length === 0 ? (
                 <div className="text-center py-4 text-gray-500 font-mono text-xs">
                     No Signal Warnings listed in parsed data. <br/> Check official bulletin.
                 </div>
             ) : (
                 data.signals.map((sig) => (
                     <div key={sig.level} className="bg-bento-card border border-bento-border rounded-lg overflow-hidden">
                         <div className={`px-3 py-1.5 font-bold font-mono text-xs flex justify-between items-center ${
                             sig.level >= 3 ? 'bg-red-900/40 text-red-200' : 
                             sig.level === 2 ? 'bg-orange-900/40 text-orange-200' : 
                             'bg-blue-900/40 text-blue-200'
                         }`}>
                             <span>TCWS SIGNAL NO. {sig.level}</span>
                             <span className="text-[9px] opacity-70">WIND THREAT</span>
                         </div>
                         <div className="p-3 text-[11px] text-gray-300 leading-relaxed font-sans border-t border-white/5">
                             {sig.areas.map((area, idx) => (
                                 <p key={idx} className="mb-1 last:mb-0 border-b border-white/5 last:border-0 pb-1 last:pb-0">
                                     {area}
                                 </p>
                             ))}
                             {sig.areas.length === 0 && <span className="italic opacity-50">See bulletin for specific areas</span>}
                         </div>
                     </div>
                 ))
             )}
         </div>

         <div className="flex-none mt-3 pt-2 border-t border-bento-border/50 text-[10px] text-gray-600 font-mono text-center flex justify-between">
            <span>SOURCE: PAGASA</span>
            <span>MONITORING ACTIVE</span>
        </div>
    </div>
  );
};

export default TyphoonWidget;
