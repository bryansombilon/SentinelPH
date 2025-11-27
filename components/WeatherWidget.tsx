import React, { useState, useEffect } from 'react';

const WeatherWidget: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Refresh every 15 minutes (15 * 60 * 1000)
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setLastUpdated(new Date());
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="absolute top-4 left-4 z-10 bg-bento-bg/80 backdrop-blur px-3 py-1 rounded border border-bento-border">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-xs font-mono text-gray-300">LIVE RAIN/THUNDER</span>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 z-10 bg-bento-bg/80 backdrop-blur px-2 py-1 rounded border border-bento-border text-[10px] text-gray-500 font-mono">
        UPDATED: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>

      <div className="flex-grow w-full h-full overflow-hidden rounded-xl bg-black">
        <iframe
          key={refreshKey}
          src="https://embed.windy.com/embed2.html?lat=12.683&lon=123.333&detailLat=12.683&detailLon=123.333&width=650&height=450&zoom=6&level=surface&overlay=rain&product=gfs&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          allowFullScreen
          title="Windy.com Weather Map"
          className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
        />
      </div>
    </div>
  );
};

export default WeatherWidget;