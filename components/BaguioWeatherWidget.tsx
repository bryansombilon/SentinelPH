

import React, { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
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
        // Added apparent_temperature
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation,wind_speed_10m,apparent_temperature&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FManila`
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

  // WMO Weather Code interpretation
  const getWeatherInfo = (code: number | null) => {
    if (code === null) return { label: 'Unknown', icon: '?' };
    if (code === 0) return { label: 'Clear', icon: '☀️' };
    if (code <= 3) return { label: 'Cloudy', icon: '☁️' };
    if (code <= 48) return { label: 'Fog', icon: '🌫️' };
    if (code <= 57) return { label: 'Drizzle', icon: 'DRIZZLE' };
    if (code <= 67) return { label: 'Rain', icon: '🌧️' };
    if (code <= 77) return { label: 'Snow', icon: '❄️' };
    if (code <= 82) return { label: 'Showers', icon: 'SHOWERS' };
    if (code <= 99) return { label: 'Storm', icon: '⛈️' };
    return { label: 'Unknown', icon: '-' };
  };

  const getAqiLabel = (aqi: number) => {
    if (aqi <= 50) return { text: 'Good', color: 'text-green-400' };
    if (aqi <= 100) return { text: 'Moderate', color: 'text-yellow-400' };
    if (aqi <= 150) return { text: 'Unhealthy (Sens.)', color: 'text-orange-400' };
    return { text: 'Unhealthy', color: 'text-red-400' };
  };

  const currentInfo = getWeatherInfo(current?.weatherCode ?? null);
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
        <div className={`flex flex-col h-full w-full p-3 transition-opacity duration-300 ${showForecast ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            
            {/* Header */}
            <div className="flex justify-between items-start z-10 mb-2">
                <div>
                    <h2 className="text-xs md:text-sm font-bold text-gray-400 font-mono tracking-wider uppercase">Baguio City</h2>
                    <div className="text-[9px] text-gray-600 font-mono flex items-center gap-1">
                        LIVE <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    </div>
                </div>
                <button 
                    onClick={() => setShowForecast(true)}
                    className="text-[9px] font-mono bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-bento-accent hover:text-white transition-colors uppercase"
                >
                    Details &rarr;
                </button>
            </div>

            {/* Main Temp & Condition */}
            <div className="flex-grow flex flex-col justify-center items-center z-10 min-h-0">
                {loading ? (
                    <div className="animate-pulse text-gray-600 text-xs font-mono">Loading Weather...</div>
                ) : (
                    <>
                        <div className="flex items-center justify-center gap-2 mb-1">
                             <div className="text-4xl filter drop-shadow-md">{currentInfo.icon}</div>
                             <div className="text-5xl md:text-6xl font-bold text-white font-mono tracking-tighter leading-none drop-shadow-lg">
                                {current?.temp?.toFixed(0)}°
                            </div>
                        </div>
                        <div className="text-xs font-bold text-bento-accent font-mono uppercase tracking-wide mb-1">
                            {currentInfo.label}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mb-3 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            Feels {current?.feelsLike.toFixed(0)}°
                        </div>

                        {/* Metrics Grid */}
                        <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                            {/* Humidity */}
                            <div className="bg-bento-highlight/10 rounded p-1.5 flex items-center justify-between">
                                <span className="text-[8px] text-gray-500 font-mono uppercase">Hum</span>
                                <div className="flex items-center gap-1 text-[10px] text-blue-200 font-mono font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                                    {current?.humidity}%
                                </div>
                            </div>

                            {/* Wind */}
                            <div className="bg-bento-highlight/10 rounded p-1.5 flex items-center justify-between">
                                <span className="text-[8px] text-gray-500 font-mono uppercase">Wind</span>
                                <div className="flex items-center gap-1 text-[10px] text-gray-200 font-mono font-bold">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
                                    {current?.windSpeed.toFixed(0)} <span className="text-[8px] opacity-70">km/h</span>
                                </div>
                            </div>

                             {/* Precip */}
                             <div className="bg-bento-highlight/10 rounded p-1.5 flex items-center justify-between">
                                <span className="text-[8px] text-gray-500 font-mono uppercase">Precip</span>
                                <div className={`flex items-center gap-1 text-[10px] font-mono font-bold ${isRaining ? 'text-cyan-300' : 'text-gray-400'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16" y1="13" x2="16" y2="21"></line><line x1="8" y1="13" x2="8" y2="21"></line><line x1="12" y1="15" x2="12" y2="23"></line><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"></path></svg>
                                    {precipValue} <span className="text-[8px] opacity-70">mm</span>
                                </div>
                            </div>

                             {/* AQI */}
                             <div className="bg-bento-highlight/10 rounded p-1.5 flex items-center justify-between">
                                <span className="text-[8px] text-gray-500 font-mono uppercase">AQI</span>
                                <div className={`text-[10px] font-mono font-bold ${aqiInfo.color}`}>
                                    {aqi} <span className="text-[8px] opacity-70">({aqiInfo.text.slice(0,4)})</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- FORECAST OVERLAY --- */}
        <div className={`absolute inset-0 bg-bento-card/95 backdrop-blur-md z-20 flex flex-col p-3 transition-transform duration-300 ${showForecast ? 'translate-y-0' : 'translate-y-full'}`}>
             <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2 flex-none">
                <span className="text-xs font-bold text-gray-200 font-mono uppercase">Detailed Forecast</span>
                <button 
                    onClick={() => setShowForecast(false)}
                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </button>
             </div>
             
             {/* Hourly Section */}
             <div className="flex-none mb-3">
                <div className="text-[10px] font-bold text-gray-500 font-mono uppercase mb-1">Next 24 Hours</div>
                <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar scroll-smooth snap-x snap-mandatory">
                    {hourlyData.map((h, i) => {
                         const time = formatHourlyTime(h.time);
                         const info = getWeatherInfo(h.weather_code);
                         return (
                             <div key={i} className="flex flex-col items-center min-w-[40px] p-1.5 bg-white/5 rounded border border-transparent hover:border-white/10 shrink-0 snap-start">
                                 <span className="text-[9px] text-gray-400 font-mono mb-1">{time}</span>
                                 <span className="text-lg mb-1 filter drop-shadow-sm">{info.icon}</span>
                                 <span className="text-[10px] font-bold text-white">{h.temp.toFixed(0)}°</span>
                             </div>
                         );
                    })}
                </div>
             </div>

             {/* Daily Section */}
             <div className="flex-grow flex flex-col min-h-0">
                <div className="text-[10px] font-bold text-gray-500 font-mono uppercase mb-1 flex-none">7-Day Outlook</div>
                <div className="flex-grow overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {forecast?.time.map((date, idx) => {
                        const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                        const info = getWeatherInfo(forecast.weather_code[idx]);
                        return (
                            <div key={idx} className="grid grid-cols-4 items-center p-1.5 rounded bg-white/5 text-[10px] font-mono border border-transparent hover:border-white/10">
                                <span className="text-gray-400">{dayName}</span>
                                <span className="text-center text-base">{info.icon}</span>
                                <div className="col-span-2 text-right">
                                    <span className="text-white font-bold">{forecast.temperature_2m_max[idx].toFixed(0)}°</span>
                                    <span className="text-gray-600 mx-1">/</span>
                                    <span className="text-gray-500">{forecast.temperature_2m_min[idx].toFixed(0)}°</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </div>
        </div>
    </div>
  );
};

export default BaguioWeatherWidget;
