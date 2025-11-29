
import React, { useEffect, useState } from 'react';
import { getBaguioTrafficAnalysis, TrafficHotspot } from '../services/geminiService';

const TrafficWidget: React.FC = () => {
  const [data, setData] = useState<TrafficHotspot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const refreshData = async () => {
    // Only show loading spinner on first load or if data is empty
    if (data.length === 0) setLoading(true);
    
    const result = await getBaguioTrafficAnalysis();
    setData(result);
    setLastUpdated(new Date().toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute:'2-digit' }));
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
    // Refresh every 5 minutes to keep traffic status current
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Congested': return 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.4)]';
          case 'Heavy': return 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]';
          case 'Moderate': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_15px_-3px_rgba(234,179,8,0.3)]';
          default: return 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]';
      }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Congested' || status === 'Heavy') return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
    if (status === 'Moderate') return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    return <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
  };

  const getTrendVisuals = (trend: string) => {
      if (trend === 'Worsening') return { 
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-[-45deg]"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>, 
          color: 'text-red-400', 
          bg: 'bg-red-400/10' 
      };
      if (trend === 'Improving') return { 
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="rotate-[45deg]"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>, 
          color: 'text-emerald-400', 
          bg: 'bg-emerald-400/10' 
      };
      return { 
          icon: <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>, 
          color: 'text-gray-500', 
          bg: 'bg-gray-500/10' 
      };
  };

  return (
    <div className="flex flex-col h-full w-full p-3 bg-bento-card relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-none">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20 relative">
                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                     <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
                </div>
                <div>
                    <h2 className="text-xs font-bold text-gray-200 tracking-tight leading-none">BAGUIO TRAFFIC</h2>
                    <div className="text-[8px] text-gray-500 font-mono mt-0.5 uppercase tracking-wide flex items-center gap-1">
                        <span className="text-red-400 font-bold">LIVE</span> 
                        <span className="opacity-50">| AI PATTERN ANALYSIS</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-[9px] text-gray-600 font-mono hidden md:inline-block">UPDATED {lastUpdated}</span>
                <button onClick={refreshData} className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                </button>
            </div>
        </div>

        {/* Horizontal Gallery */}
        <div className="flex-grow min-h-0 overflow-x-auto overflow-y-hidden pb-1 custom-scrollbar">
            {loading && data.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-500 gap-2 w-full">
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-[10px] font-mono animate-pulse">Analyzing Patterns...</span>
                </div>
            ) : (
                <div className="flex gap-3 h-full px-1">
                    {data.map((spot, idx) => {
                        const styleClass = getStatusColor(spot.status);
                        const trend = getTrendVisuals(spot.trend);
                        
                        return (
                            <div key={idx} className={`flex-none w-32 md:w-40 h-full rounded-xl border p-3 flex flex-col justify-between transition-all duration-300 ${styleClass} group relative`}>
                                {/* Top Section: Name */}
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div className="text-[10px] font-bold uppercase truncate leading-tight tracking-wide opacity-90 pr-1" title={spot.name}>
                                            {spot.name}
                                        </div>
                                        <div className="opacity-80">
                                            {getStatusIcon(spot.status)}
                                        </div>
                                    </div>
                                    <div className="text-[9px] font-mono leading-tight mt-1 opacity-70 truncate">
                                        {spot.details}
                                    </div>
                                </div>
                                
                                {/* Bottom Section: Status & Trend */}
                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="text-[8px] font-mono opacity-60 uppercase mb-0.5">STATUS</div>
                                        <div className="text-sm font-black tracking-widest uppercase leading-none">
                                            {spot.status}
                                        </div>
                                    </div>
                                    
                                    {spot.trend !== 'Stable' && (
                                        <div className={`flex items-center gap-1 p-1 rounded ${trend.bg} ${trend.color} backdrop-blur-sm`}>
                                            {trend.icon}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};

export default TrafficWidget;
