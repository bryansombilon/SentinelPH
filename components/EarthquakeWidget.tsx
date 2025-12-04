
import React, { useEffect, useState, useRef } from 'react';
import { fetchEarthquakes } from '../services/earthquakeService';
import { EarthquakeFeature, LoadingState } from '../types';
import { generateSituationReport } from '../services/geminiService';

const EarthquakeWidget: React.FC = () => {
  const [quakes, setQuakes] = useState<EarthquakeFeature[]>([]);
  const [status, setStatus] = useState<LoadingState>(LoadingState.IDLE);
  const [aiReport, setAiReport] = useState<string>("Initializing AI Analysis...");
  const [selectedQuake, setSelectedQuake] = useState<EarthquakeFeature | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  
  // Initialize minMag from localStorage or default to 1.0
  const [minMag, setMinMag] = useState<number>(() => {
    const saved = localStorage.getItem('sentinel_min_mag');
    return saved ? parseFloat(saved) : 1.0;
  });

  const getPhStartOfDayISO = () => {
    // Return a flag to tell service to calculate start of day
    return "true"; 
  };

  const updateData = async () => {
    setStatus(LoadingState.LOADING);
    try {
      const startTime = getPhStartOfDayISO();
      const data = await fetchEarthquakes(minMag, startTime);
      // Explicitly sort by time descending (Latest first)
      const sorted = data.features.sort((a, b) => b.properties.time - a.properties.time);
      setQuakes(sorted);
      setStatus(LoadingState.SUCCESS);
      
      const now = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' });
      generateSituationReport(sorted, now).then(setAiReport);

    } catch (error) {
      console.error(error);
      setStatus(LoadingState.ERROR);
    }
  };

  // Re-fetch when minMag changes, and set up interval
  useEffect(() => {
    updateData();
    // Refresh every 3 minutes
    const interval = setInterval(updateData, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [minMag]);

  // Leaflet Map Initialization for Main View
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current && !selectedQuake && status === LoadingState.SUCCESS) {
        const L = (window as any).L;
        if (!L) return;

        // Cleanup existing map
        if (leafletMapInstance.current) {
            leafletMapInstance.current.remove();
            leafletMapInstance.current = null;
        }

        // Init Map centered on PH
        const map = L.map(mapRef.current).setView([12.8797, 121.7740], 5);
        leafletMapInstance.current = map;

        // Dark Matter Tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        // Add Markers
        quakes.forEach((quake) => {
            const lat = quake.geometry.coordinates[1];
            const lon = quake.geometry.coordinates[0];
            const mag = quake.properties.mag;
            const timeStr = new Date(quake.properties.time).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: '2-digit', minute:'2-digit' });
            
            let color = '#06b6d4'; // Cyan default
            let magClass = 'text-cyan-500 border-cyan-500/50 bg-cyan-500/10';
            
            if (mag >= 4) { color = '#eab308'; magClass = 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10'; }
            if (mag >= 5) { color = '#f97316'; magClass = 'text-orange-500 border-orange-500/50 bg-orange-500/10'; }
            if (mag >= 6) { color = '#ef4444'; magClass = 'text-red-500 border-red-500/50 bg-red-500/10'; }

            const marker = L.circleMarker([lat, lon], {
                radius: Math.max(mag * 2.5, 6), // Scale radius by magnitude, min size 6
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.5
            }).addTo(map);

            // Create DOM element for Popup
            const popupDiv = document.createElement('div');
            popupDiv.innerHTML = `
                <div class="flex flex-col gap-2 min-w-[180px] p-1 font-sans">
                    <div class="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
                        <span class="text-[9px] font-bold text-gray-500 font-mono uppercase tracking-wider">Event Details</span>
                        <span class="text-[10px] text-gray-400 font-mono">${timeStr}</span>
                    </div>
                    
                    <div class="flex items-start gap-3">
                         <div class="flex-none flex items-center justify-center w-10 h-10 rounded-lg ${magClass} border font-bold text-lg font-mono">
                            ${mag.toFixed(1)}
                         </div>
                         <div class="flex flex-col min-w-0">
                            <span class="text-[9px] text-gray-500 font-mono uppercase leading-none mb-0.5">Location</span>
                            <span class="text-xs font-bold text-white leading-tight line-clamp-2">${quake.properties.place}</span>
                         </div>
                    </div>
                </div>
            `;

            // Add interactive button to popup
            const btn = document.createElement('button');
            btn.className = "mt-2 w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[9px] font-mono uppercase text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1";
            btn.innerHTML = `<span>View Analysis</span> <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
            btn.onclick = (e) => {
                e.preventDefault();
                setSelectedQuake(quake);
            };
            popupDiv.appendChild(btn);

            marker.bindPopup(popupDiv, {
                closeButton: true,
                autoPan: true
            });
        });

        return () => {
            if (leafletMapInstance.current) {
                leafletMapInstance.current.remove();
                leafletMapInstance.current = null;
            }
        };
    }
  }, [viewMode, quakes, selectedQuake, status]);


  const handleMagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseFloat(e.target.value);
    setMinMag(val);
    localStorage.setItem('sentinel_min_mag', val.toString());
  };

  const getMagnitudeColor = (mag: number) => {
    if (mag >= 6) return 'text-red-500 bg-red-500/10 border-red-500/50';
    if (mag >= 5) return 'text-orange-500 bg-orange-500/10 border-orange-500/50';
    if (mag >= 4) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50';
    return 'text-bento-accent bg-bento-accent/10 border-bento-accent/50';
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // --- Detail View Component ---
  if (selectedQuake) {
    const d = new Date(selectedQuake.properties.time);
    const dateStr = d.toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'full' });
    const timeStr = d.toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', timeStyle: 'medium' });
    const magColor = getMagnitudeColor(selectedQuake.properties.mag);
    
    // Map setup for iframe
    const lat = selectedQuake.geometry.coordinates[1];
    const lon = selectedQuake.geometry.coordinates[0];
    const range = 0.8; 
    const bbox = `${lon - range},${lat - range},${lon + range},${lat + range}`;

    return (
        <div className="flex flex-col h-full w-full bg-bento-card relative animate-in fade-in duration-200">
            {/* Detail Header */}
            <div className="flex-none flex items-center justify-between mb-4 pb-2 border-b border-bento-border/50">
                <button 
                    onClick={() => setSelectedQuake(null)}
                    className="flex items-center text-xs font-mono text-gray-400 hover:text-white transition-colors gap-1 px-2 py-1 -ml-2 rounded hover:bg-white/5"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    BACK TO LIST
                </button>
                <span className="text-[10px] font-mono text-bento-accent tracking-widest uppercase">Event Details</span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-1">
                
                {/* Hero Section */}
                <div className="flex flex-col items-center justify-center py-2 space-y-1">
                    <div className={`text-5xl font-mono font-bold ${magColor.split(' ')[0]}`}>
                        {selectedQuake.properties.mag.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">Magnitude</div>
                </div>

                {/* Location */}
                <div className="bg-bento-highlight/10 rounded-lg p-3 border border-white/5 text-center">
                    <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-mono mb-1">Epicenter</h3>
                    <p className="text-sm font-bold text-gray-200 leading-tight">
                        {selectedQuake.properties.place}
                    </p>
                </div>
                
                {/* Map Embed - Enhanced */}
                <div className="rounded-lg overflow-hidden border border-white/10 h-64 bg-black relative group shadow-inner">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`}
                        style={{ border: 0 }}
                        title="Earthquake Location Map"
                        className="opacity-90 group-hover:opacity-100 transition-opacity bg-zinc-900"
                        loading="lazy"
                    ></iframe>
                     <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 backdrop-blur rounded text-[9px] text-gray-300 font-mono pointer-events-none border border-white/10">
                        {lat.toFixed(4)}, {lon.toFixed(4)}
                    </div>
                    <div className="absolute bottom-2 right-2">
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-bento-accent text-black font-bold text-[9px] rounded shadow hover:bg-white transition-colors uppercase font-mono flex items-center gap-1"
                        >
                            <span>Google Maps</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </a>
                    </div>
                </div>

                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-bento-highlight/10 rounded-lg p-3 border border-white/5">
                        <h4 className="text-[9px] uppercase tracking-wider text-gray-500 font-mono mb-1">Time (PH)</h4>
                        <div className="text-xs text-white font-mono">{timeStr}</div>
                        <div className="text-[10px] text-gray-500">{dateStr}</div>
                    </div>
                    <div className="bg-bento-highlight/10 rounded-lg p-3 border border-white/5">
                        <h4 className="text-[9px] uppercase tracking-wider text-gray-500 font-mono mb-1">Depth</h4>
                        <div className="text-xs text-white font-mono">{selectedQuake.geometry.coordinates[2]} km</div>
                    </div>
                </div>

                {/* Link */}
                <a 
                    href={selectedQuake.properties.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 bg-bento-accent/10 hover:bg-bento-accent/20 border border-bento-accent/30 text-bento-accent rounded text-xs font-mono font-bold uppercase transition-colors"
                >
                    View on PHIVOLCS
                </a>
            </div>
        </div>
    );
  }

  // --- Main View (List or Map) ---
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex-none flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-bento-alert animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.8 4A6.3 8.7 0 0 1 20 9"></path>
                <path d="M9 9h.01"></path>
                <path d="M4 9a6.3 8.7 0 0 1 1.2-5"></path>
                <path d="M8.02 14.46 5.8 12.03"></path>
                <path d="M16 9h.01"></path>
                <path d="M11.98 14.46 14.2 12.03"></path>
                <path d="M2 21h20"></path>
                <path d="M6 21v-3"></path>
                <path d="M18 21v-3"></path>
                <path d="M10 21v-4a2 2 0 0 1 4 0v4"></path>
                <path d="M10 5a2 2 0 1 1 4 0"></path>
                <path d="m8 5-1.4-1.8a2 2 0 0 0-2.8 0l-.8 1"></path>
                <path d="m16 5 1.4-1.8a2 2 0 0 1 2.8 0l.8 1"></path>
            </svg>
            <h2 className="text-lg font-bold text-gray-200 tracking-tight">SEISMIC ACTIVITY</h2>
        </div>
        <div className="flex gap-2 items-center">
            {/* View Toggle */}
            <div className="flex bg-bento-highlight/20 rounded p-0.5 border border-bento-border">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded transition-colors ${viewMode === 'list' ? 'bg-bento-accent/20 text-bento-accent font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    List
                </button>
                <button 
                    onClick={() => setViewMode('map')}
                    className={`px-2 py-0.5 text-[9px] font-mono uppercase rounded transition-colors ${viewMode === 'map' ? 'bg-bento-accent/20 text-bento-accent font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Map
                </button>
            </div>

             {/* Filter Dropdown */}
            <div className="hidden sm:flex items-center bg-bento-highlight/20 rounded px-2 py-0.5 border border-bento-border transition-colors hover:border-bento-accent/30">
                <span className="text-[9px] text-gray-500 mr-2 font-mono uppercase tracking-wider">Min Mag</span>
                <select 
                    value={minMag} 
                    onChange={handleMagChange} 
                    className="bg-transparent text-[10px] font-mono text-bento-accent font-bold focus:outline-none appearance-none cursor-pointer text-right w-8"
                >
                    <option value="1">1.0</option>
                    <option value="2">2.0</option>
                    <option value="3">3.0</option>
                    <option value="4">4.0</option>
                    <option value="5">5.0</option>
                </select>
            </div>

            <span className={`text-[10px] px-2 py-1 rounded border ${status === LoadingState.LOADING ? 'text-yellow-500 border-yellow-500' : 'text-green-500 border-green-500'} font-mono uppercase`}>
                {status === LoadingState.LOADING ? 'Ref...' : 'Today'}
            </span>
        </div>
      </div>

      {/* AI Summary Banner */}
      <div className="flex-none mb-4 p-3 bg-bento-highlight/30 border-l-2 border-bento-accent rounded-r text-xs text-gray-300 font-mono leading-relaxed">
        <span className="text-bento-accent font-bold mr-2">[AI OPS]:</span>
        {aiReport}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow flex flex-col min-h-0 relative">
        
        {/* VIEW: MAP */}
        {viewMode === 'map' && (
             <div className="absolute inset-0 rounded-lg overflow-hidden border border-white/5 bg-black">
                 {status === LoadingState.LOADING && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="text-bento-accent text-xs font-mono animate-pulse">LOADING MAP DATA...</div>
                    </div>
                 )}
                 <div ref={mapRef} className="w-full h-full z-10"></div>
                 <div className="absolute bottom-2 left-2 z-20 bg-black/70 backdrop-blur px-2 py-1 rounded border border-white/10 text-[9px] text-gray-400 font-mono pointer-events-none">
                    Click marker for info
                 </div>
             </div>
        )}

        {/* VIEW: LIST */}
        {viewMode === 'list' && (
            <>
                <div className="flex-none grid grid-cols-12 gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2 px-2">
                    <div className="col-span-2 text-center">Mag</div>
                    <div className="col-span-7">Location</div>
                    <div className="col-span-3 text-right">Time</div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-2 min-h-0 custom-scrollbar">
                    {status === LoadingState.ERROR && (
                        <div className="text-red-400 text-sm text-center py-4 border border-red-900/50 rounded bg-red-900/10">
                        Connection Lost. Retrying...
                        </div>
                    )}
                    
                    {quakes.map((quake) => {
                    const date = new Date(quake.properties.time);
                    const magColorClass = getMagnitudeColor(quake.properties.mag);
                    const timeAgo = getTimeAgo(quake.properties.time);
                    
                    return (
                        <button 
                            key={quake.id} 
                            onClick={() => setSelectedQuake(quake)}
                            className="w-full text-left group grid grid-cols-12 gap-2 items-center p-3 rounded-lg bg-bento-highlight/10 hover:bg-bento-highlight/30 border border-transparent hover:border-bento-accent/30 transition-all duration-200 cursor-pointer"
                        >
                            {/* Magnitude */}
                            <div className={`col-span-2 flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded mx-auto font-bold font-mono text-sm ${magColorClass} group-hover:scale-105 transition-transform`}>
                                {quake.properties.mag.toFixed(1)}
                            </div>

                            {/* Info */}
                            <div className="col-span-7 flex flex-col justify-center">
                                <span className="text-gray-200 text-xs font-semibold truncate group-hover:text-white">
                                    {quake.properties.place}
                                </span>
                                <span className="text-gray-500 text-[10px] font-mono group-hover:text-gray-400">
                                    Depth: {quake.geometry.coordinates[2]}km
                                </span>
                            </div>

                            {/* Time */}
                            <div className="col-span-3 flex flex-col items-end justify-center">
                                <span className="text-bento-accent text-[10px] font-mono font-bold">
                                    {timeAgo}
                                </span>
                                <span className="text-gray-600 text-[9px] font-mono hidden md:block">
                                    {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                                </span>
                            </div>
                        </button>
                    );
                    })}

                    {quakes.length === 0 && status === LoadingState.SUCCESS && (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                            <div className="text-sm font-mono italic mb-2">No activity detected today.</div>
                            <div className="text-[10px] text-gray-600">Region: Philippines</div>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>
      
      <div className="flex-none mt-3 pt-2 border-t border-bento-border/50 text-[10px] text-gray-600 font-mono text-center flex justify-between">
        <span>SOURCE: PHIVOLCS</span>
        <span>TODAY'S ACTIVITY</span>
      </div>
    </div>
  );
};

export default EarthquakeWidget;
