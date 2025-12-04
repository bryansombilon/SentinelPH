
import React, { useEffect, useState } from 'react';
import { fetchTyphoonData } from '../services/typhoonService';
import { TyphoonData, TyphoonSignal, LoadingState } from '../types';

const TyphoonWidget: React.FC = () => {
  const [data, setData] = useState<TyphoonData | null>(null);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [selectedSignal, setSelectedSignal] = useState<TyphoonSignal | null>(null);

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

  const getSignalColor = (level: number) => {
      switch(level) {
          case 5: return 'bg-purple-600 border-purple-400 text-white';
          case 4: return 'bg-red-600 border-red-400 text-white';
          case 3: return 'bg-orange-600 border-orange-400 text-white';
          case 2: return 'bg-yellow-600 border-yellow-400 text-white';
          default: return 'bg-blue-600 border-blue-400 text-white';
      }
  };

  // --- Loading State ---
  if (status === LoadingState.LOADING && !data) {
      return (
          <div className="flex items-center justify-center h-full w-full bg-bento-card relative">
              <span className="text-bento-accent text-xs font-mono animate-pulse">Scanning Bulletins...</span>
          </div>
      );
  }

  // --- Error State ---
  if (status === LoadingState.ERROR) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center bg-bento-card">
            <span className="text-red-500 font-mono text-xs mb-2">Connection Failed</span>
            <button onClick={updateData} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-mono text-gray-300">Retry</button>
        </div>
      );
  }

  // --- No Cyclone State ---
  if (!data || !data.hasCyclone) {
      return (
          <div className="flex flex-col h-full w-full relative bg-bento-card">
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

  // --- Active Cyclone View ---
  return (
    <div className="flex flex-col h-full w-full bg-bento-card relative">
         
         {/* Header */}
         <div className="flex-none flex items-center justify-between mb-3">
             <div className="flex items-center gap-2 max-w-[70%]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-bento-alert animate-spin-slow shrink-0"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1 0 10 10"/></svg>
                <h2 className="text-lg font-bold text-white tracking-tight truncate uppercase">{data.name}</h2>
             </div>
             <a href={data.url} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] px-2 py-1 rounded bg-bento-alert/20 text-bento-alert border border-bento-alert/50 font-mono uppercase hover:bg-bento-alert/30 transition-colors">
                 BULLETIN
             </a>
         </div>

         {/* Summary / Active Signals Grid */}
         <div className="flex-grow overflow-y-auto min-h-0 pr-1">
             <div className="text-[10px] font-mono text-gray-400 mb-4 border-l-2 border-bento-alert pl-2">
                 {data.summary}
             </div>

             {data.signals.length === 0 ? (
                 <div className="text-center py-6 text-gray-500 font-mono text-xs border border-dashed border-gray-700 rounded-lg">
                     No TCWS Signals currently raised. <br/> Monitoring active.
                 </div>
             ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                     {data.signals.map((sig) => {
                         const colorClass = getSignalColor(sig.level);
                         return (
                            <button 
                                key={sig.level}
                                onClick={() => setSelectedSignal(sig)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg border shadow-lg transition-transform hover:scale-105 active:scale-95 ${colorClass}`}
                            >
                                <div className="text-[10px] font-mono uppercase tracking-wider opacity-90 mb-1">Signal</div>
                                <div className="text-3xl font-bold leading-none">{sig.level}</div>
                                <div className="text-[9px] mt-1 bg-black/20 px-1.5 py-0.5 rounded text-white/90">
                                    Click for Areas
                                </div>
                            </button>
                         );
                     })}
                 </div>
             )}
         </div>

         {/* Footer */}
         <div className="flex-none mt-3 pt-2 border-t border-bento-border/50 text-[10px] text-gray-600 font-mono text-center flex justify-between">
            <span>SOURCE: PAGASA</span>
            <span>MONITORING ACTIVE</span>
        </div>

        {/* --- DETAILS POPUP --- */}
        {selectedSignal && (
            <div className="absolute inset-0 z-20 bg-bento-card/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-200 p-4">
                <div className="flex-none flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSignalColor(selectedSignal.level).split(' ')[0]}`}></div>
                        <h3 className="font-bold text-white text-sm font-mono">TCWS SIGNAL NO. {selectedSignal.level} AREAS</h3>
                    </div>
                    <button 
                        onClick={() => setSelectedSignal(null)}
                        className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                    {selectedSignal.areas.length > 0 ? (
                        <div className="space-y-4">
                            {selectedSignal.areas.map((areaText, idx) => (
                                <div key={idx} className="bg-white/5 rounded p-3 text-xs leading-relaxed text-gray-200 border border-white/5">
                                    {areaText}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 font-mono text-xs mt-10">
                            No specific areas parsed. Please check the official bulletin link.
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default TyphoonWidget;
