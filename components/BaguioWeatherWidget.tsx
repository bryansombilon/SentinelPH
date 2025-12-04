
import React, { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  precipitation: number;
  feelsLike: number;
}

interface AirQualityData {
  aqi: number;
}

interface DailyForecast {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
}

const BaguioWeatherWidget: React.FC = () => {
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [aqi, setAqi] = useState<number | null>(null);
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [hourly, setHourly] = useState<HourlyForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForecast, setShowForecast] = useState(false);

  // Baguio Coordinates
  const LAT = 16.4023;
  const LON = 120.5960;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch Current, Hourly, and Daily
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,wind_direction_10m,wind_gusts_10m,apparent_temperature&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila`
        );
        const weatherData = await weatherRes.json();

        // Fetch Air Quality
        const aqiRes = await fetch(
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=us_aqi`
        );
        const aqiData = await aqiRes.json();

        setCurrent({
          temp: weatherData.current.temperature_2m,
          humidity: weatherData.current.relative_humidity_2m,
          weatherCode: weatherData.current.weather_code,
          windSpeed: weatherData.current.wind_speed_10m,
          windDirection: weatherData.current.wind_direction_10m,
          windGusts: weatherData.current.wind_gusts_10m,
          precipitation: weatherData.current.precipitation,
          feelsLike: weatherData.current.apparent_temperature,
        });
        
        setForecast(weatherData.daily);
        setHourly(weatherData.hourly);
        setAqi(aqiData.current.us_aqi);
        setLoading(false);
      } catch (e) {
        console.error("Weather fetch failed", e);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000); // 15 mins
    return () => clearInterval(interval);
  }, []);

  // Helper to convert degrees to compass direction
  const getWindDir = (angle: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(angle / 45) % 8;
    return directions[index];
  };

  // Enhanced WMO Weather Interpretation with SVGs and Colors
  const getWeatherVisuals = (code: number | null) => {
    const defaultVisuals = { 
        label: 'Unknown', 
        color: 'text-gray-400', 
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    };

    if (code === null) return defaultVisuals;

    // Clear / Sunny
    if (code === 0) {
        return { 
            label: 'Clear', 
            color: 'text-yellow-400', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
        };
    }
    // Cloudy
    if (code <= 3) {
        return { 
            label: code === 1 ? 'Mainly Clear' : 'Cloudy', 
            color: 'text-gray-300', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19 8.963 24.5 12 24.5s5.5-2.463 5.5-5.5z"/><path d="M12 13.5V12a8 8 0 1 1 8 8h-2.5"/></svg>
        };
    }
    // Fog
    if (code <= 48) {
        return { 
            label: 'Foggy', 
            color: 'text-gray-400', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 6h14"/><path d="M4 10h16"/><path d="M6 14h12"/><path d="M4 18h16"/></svg>
        };
    }
    // Drizzle
    if (code <= 57) {
        return { 
            label: 'Drizzle', 
            color: 'text-blue-300', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 19v2"/><path d="M8 13v2"/><path d="M16 19v2"/><path d="M16 13v2"/><path d="M12 21v2"/><path d="M12 15v2"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
        };
    }
    // Rain
    if (code <= 67) {
        return { 
            label: 'Rain', 
            color: 'text-blue-400', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>
        };
    }
    // Snow
    if (code <= 77) {
        return { 
            label: 'Snow', 
            color: 'text-white', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 14-2.5 2.5"/><path d="m14 14 2.5 2.5"/><path d="M12 22v-6.5"/><path d="m14 10 2.5-2.5"/><path d="m10 10-2.5-2.5"/><path d="M12 2v6.5"/><path d="m10 14 2.5-2.5"/><path d="m14 14-2.5-2.5"/><path d="M22 12h-6.5"/><path d="M2 12h6.5"/></svg>
        };
    }
    // Showers
    if (code <= 82) {
        return { 
            label: 'Showers', 
            color: 'text-blue-500', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
        };
    }
    // Storm
    if (code <= 99) {
        return { 
            label: 'T-Storm', 
            color: 'text-purple-400', 
            icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9"/><polyline points="13 11 9 17 15 17 11 23"/></svg>
        };
    }
    return defaultVisuals;
  };

  const getAqiLabel = (aqi: number) => {
    if (aqi <= 50) return { text: 'Good', color: 'text-green-400' };
    if (aqi <= 100) return { text: 'Moderate', color: 'text-yellow-400' };
    if (aqi <= 150) return { text: 'Unhealthy (Sens.)', color: 'text-orange-400' };
    return { text: 'Unhealthy', color: 'text-red-400' };
  };

  const visuals = getWeatherVisuals(current?.weatherCode ?? null);
  const aqiInfo = aqi !== null ? getAqiLabel(aqi) : { text: '--', color: 'text-gray-400' };
  
  const precipValue = current?.precipitation ?? 0;
  const isRaining = precipValue > 0;

  // Process next 24 hours
  const getNext24Hours = () => {
    if (!hourly) return [];
    const now = new Date();
    // Find nearest hour index (allowing for slight overlap if API update is delayed)
    const currentHourIndex = hourly.time.findIndex(t => new Date(t).getTime() >= now.getTime() - 60 * 60 * 1000);
    
    if (currentHourIndex === -1) return [];
    
    const next24 = [];
    for(let i=0; i<24; i++) {
        const idx = currentHourIndex + i;
        if (idx < hourly.time.length) {
            next24.push({
                time: hourly.time[idx],
                temp: hourly.temperature_2m[idx],
                code: hourly.weather_code[idx]
            });
        }
    }
    return next24;
  };
  const hourlyData = getNext24Hours();

  // Helper to format ISO string (2023-10-27T13:00) to 1PM, ignoring browser timezone to respect API timezone
  const formatHourlyTime = (isoString: string) => {
      const timePart = isoString.split('T')[1];
      if (!timePart) return "";
      let [hour] = timePart.split(':').map(Number);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}${ampm}`;
  };

  return (
    <div className="w-full h-full relative bg-bento-card border border-bento-border rounded-2xl overflow-hidden shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
        
        {/* --- MAIN VIEW --- */}
        <div className={`flex flex-col h-full w-full p-2 md:p-3 transition-opacity duration-300 ${showForecast ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Header - Compact */}
            <div className="flex justify-between items-start z-10 mb-1 flex-none">
                <div>
                    <h2 className="text-[10px] md:text-xs font-bold text-gray-400 font-mono tracking-wider uppercase">Baguio City</h2>
                    <div className="text-[8px] text-gray-600 font-mono flex items-center gap-1">
                        LIVE <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowForecast(true)}
                    className="text-[9px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-1.5 py-0.5 rounded text-bento-accent hover:text-white transition-colors uppercase"
                >
                    Details
                </button>
            </div>

            {/* Main Temp & Condition */}
            <div className="flex-grow flex flex-col justify-center items-center z-10 min-h-0 relative -mt-1">
                {loading ? (
                    <div className="animate-pulse text-gray-600 text-xs font-mono">Loading...</div>
                ) : (
                    <>
                        {/* Temperature Row */}
                        <div className="flex items-center justify-center gap-2 mb-0.5">
                             <div className={`w-8 h-8 md:w-10 md:h-10 filter drop-shadow-md opacity-90 ${visuals.color}`}>
                                {visuals.icon}
                             </div>
                             <div className="text-5xl md:text-6xl font-bold text-white font-mono tracking-tighter leading-none drop-shadow-xl">
                                {current?.temp?.toFixed(0)}°
                            </div>
                        </div>
                        
                        {/* Condition & Feels Like */}
                        <div className="flex flex-col items-center gap-0.5 mb-2">
                            <div className={`text-[10px] md:text-xs font-bold font-mono uppercase tracking-wide text-center leading-none ${visuals.color}`}>
                                {visuals.label}
                            </div>
                            <div className="text-[9px] text-gray-400 font-mono bg-white/5 px-1.5 py-px rounded border border-white/5 leading-none">
                                Feels {current?.feelsLike.toFixed(0)}°
                            </div>
                        </div>

                        {/* Metrics Grid - Optimized for visibility */}
                        <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
                            {/* Humidity - Highlighted as requested */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded p-1 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                                    <span className="text-[8px] text-gray-500 font-mono uppercase">Hum</span>
                                </div>
                                <div className="text-xs md:text-sm text-blue-100 font-mono font-bold">
                                    {current?.humidity}%
                                </div>
                            </div>

                            {/* Wind */}
                            <div className="bg-bento-highlight/10 border border-white/5 rounded p-1 flex items-center justify-between">
                                 <div className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
                                    <span className="text-[8px] text-gray-500 font-mono uppercase">Wind</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                        <div 
                                            className="text-gray-400" 
                                            style={{ transform: `rotate(${current?.windDirection ?? 0}deg)` }}
                                            title={`Direction: ${current?.windDirection}°`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="m17 7-5-5-5 5"/></svg>
                                        </div>
                                        <div className="text-xs md:text-sm text-gray-200 font-mono font-bold flex items-baseline">
                                            {current?.windSpeed.toFixed(0)}<span className="text-[8px] opacity-70 font-normal ml-0.5">kph</span>
                                            <span className="text-[8px] text-bento-accent ml-1 font-normal">{getWindDir(current?.windDirection ?? 0)}</span>
                                        </div>
                                    </div>
                                    <div className="text-[7px] text-gray-500 font-mono leading-none">
                                        Gust {current?.windGusts.toFixed(0)}
                                    </div>
                                </div>
                            </div>

                             {/* Precip */}
                             <div className={`bg-bento-highlight/10 border border-white/5 rounded p-1 flex items-center justify-between ${isRaining ? 'bg-cyan-500/10 border-cyan-500/30' : ''}`}>
                                <div className="flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isRaining ? 'text-cyan-400' : 'text-gray-500'}><line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>
                                    <span className="text-[8px] text-gray-500 font-mono uppercase">Precip</span>
                                </div>
                                <div className={`text-xs md:text-sm font-mono font-bold ${isRaining ? 'text-cyan-300' : 'text-gray-400'}`}>
                                    {precipValue}<span className="text-[8px] opacity-70 font-normal ml-0.5">mm</span>
                                </div>
                            </div>

                             {/* AQI */}
                             <div className="bg-bento-highlight/10 border border-white/5 rounded p-1 flex items-center justify-between">
                                <span className="text-[8px] text-gray-500 font-mono uppercase">AQI</span>
                                <div className={`text-xs md:text-sm font-mono font-bold ${aqiInfo.color}`}>
                                    {aqi}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- FORECAST OVERLAY --- */}
        <div className={`absolute inset-0 bg-bento-card/95 backdrop-blur-md z-20 flex flex-col transition-transform duration-300 ${showForecast ? 'translate-y-0' : 'translate-y-full'}`}>
             
             {/* Header */}
             <div className="flex justify-between items-center p-3 border-b border-white/10 shrink-0 bg-bento-card/50">
                <span className="text-xs font-bold text-gray-200 font-mono uppercase">Detailed Forecast</span>
                <button 
                    onClick={() => setShowForecast(false)}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
             </div>
             
             {/* Scrollable Container for All Content */}
             <div className="flex-grow overflow-y-auto p-3 pt-0 custom-scrollbar">
                
                {/* Hourly Section */}
                <div className="mb-4 mt-3">
                    <div className="text-[10px] font-bold text-gray-500 font-mono uppercase mb-2">Next 24 Hours</div>
                    <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar scroll-smooth snap-x snap-mandatory">
                        {hourlyData.map((h, i) => {
                            const time = formatHourlyTime(h.time);
                            const info = getWeatherVisuals(h.weather_code);
                            return (
                                <div key={i} className="flex flex-col items-center min-w-[44px] p-2 bg-white/5 rounded border border-transparent hover:border-white/10 shrink-0 snap-start">
                                    <span className="text-[9px] text-gray-400 font-mono mb-1.5">{time}</span>
                                    <div className={`w-5 h-5 mb-1.5 ${info.color} filter drop-shadow-sm`}>
                                        {info.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-white">{h.temp.toFixed(0)}°</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Daily Section */}
                <div>
                    <div className="text-[10px] font-bold text-gray-500 font-mono uppercase mb-2">7-Day Outlook</div>
                    <div className="space-y-1">
                        {forecast?.time.map((date, idx) => {
                            const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                            const info = getWeatherVisuals(forecast.weather_code[idx]);
                            return (
                                <div key={idx} className="grid grid-cols-5 items-center p-2 rounded bg-white/5 text-[10px] font-mono border border-transparent hover:border-white/10 transition-colors">
                                    <span className="text-gray-400 font-bold">{dayName}</span>
                                    <div className={`col-span-1 flex justify-center ${info.color}`}>
                                        <div className="w-4 h-4">{info.icon}</div>
                                    </div>
                                    <span className="col-span-1 text-[8px] text-gray-500 truncate">{info.label}</span>
                                    <div className="col-span-2 text-right">
                                        <span className="text-white font-bold text-xs">{forecast.temperature_2m_max[idx].toFixed(0)}°</span>
                                        <span className="text-gray-600 mx-1">/</span>
                                        <span className="text-gray-500">{forecast.temperature_2m_min[idx].toFixed(0)}°</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="h-6"></div> {/* Bottom spacer */}
             </div>
        </div>
    </div>
  );
};

export default BaguioWeatherWidget;
