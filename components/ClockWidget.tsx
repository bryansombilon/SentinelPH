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
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center">
      <div className="text-bento-accent text-sm font-mono tracking-widest mb-2 uppercase opacity-80">
        Philippine Standard Time
      </div>
      <div className="font-mono text-5xl md:text-7xl font-bold tracking-tighter text-white flex items-baseline justify-center">
        <span>{hours}</span>
        <span className="animate-pulse mx-1 text-bento-highlight">:</span>
        <span>{minutes}</span>
        
        <div className="flex flex-col items-start ml-2 md:ml-3">
           <span className="text-xl md:text-3xl text-gray-500 font-normal leading-none">{seconds}</span>
           <span className="text-xs md:text-sm text-bento-accent font-bold leading-none mt-1">{ampm}</span>
        </div>
      </div>
      <div className="mt-4 text-gray-400 font-sans text-lg md:text-xl font-medium tracking-wide">
        {dateString}
      </div>
    </div>
  );
};

export default ClockWidget;