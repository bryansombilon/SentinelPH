
import React, { useState, useEffect } from 'react';

const ClockWidget: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Formatters for Philippine Standard Time (12-hour)
  const formatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short', // Shortened for compact view
    month: 'short',
    day: 'numeric',
  });

  const dateString = dateFormatter.format(time);
  
  // Extract parts for styling
  const parts = formatter.formatToParts(time);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value;
  
  const hours = getPart('hour');
  const minutes = getPart('minute');
  const seconds = getPart('second');
  const ampm = getPart('dayPeriod');

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center relative overflow-hidden bg-bento-card border border-bento-border rounded-2xl shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/10 to-transparent pointer-events-none"></div>
      
      {/* Header */}
      <div className="text-[10px] md:text-xs text-bento-accent font-mono tracking-widest mb-1 uppercase opacity-80 z-10 font-bold">
        PST
      </div>

      {/* Main Time */}
      <div className="font-mono text-6xl md:text-7xl font-bold tracking-tighter text-white flex items-baseline justify-center z-10 leading-none filter drop-shadow-xl">
        <span>{hours}</span>
        <span className="animate-pulse mx-0.5 text-bento-highlight -mt-2">:</span>
        <span>{minutes}</span>
      </div>

      {/* Seconds & AM/PM */}
      <div className="flex items-center gap-2 mt-2 z-10">
          <span className="text-lg md:text-xl text-gray-400 font-mono font-medium">{seconds}</span>
          <span className="text-xs md:text-sm text-bento-accent font-bold font-mono bg-bento-accent/10 px-1.5 py-0.5 rounded">{ampm}</span>
      </div>

      {/* Date */}
      <div className="mt-2 text-gray-300 font-sans text-sm md:text-base font-semibold tracking-wide uppercase z-10 opacity-90">
        {dateString}
      </div>
    </div>
  );
};

export default ClockWidget;
