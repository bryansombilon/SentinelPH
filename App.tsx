
import React from 'react';
import ClockWidget from './components/ClockWidget';
import WeatherWidget from './components/WeatherWidget';
import EarthquakeWidget from './components/EarthquakeWidget';
import TyphoonWidget from './components/TyphoonWidget';
import VolcanoWidget from './components/VolcanoWidget';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-bento-bg p-4 md:p-6 flex flex-col gap-4 overflow-hidden h-screen">
      
      {/* Main Grid 
          - Mobile: Auto height, stacks vertically.
          - Desktop: Fits remaining height, 4 columns, 4 rows.
      */}
      <main className="flex-grow grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-4 gap-4 h-full min-h-0">
        
        {/* --- ROW 1 & 2 --- */}

        {/* 1. Clock: Top Left [Col 1-2, Row 1] */}
        <div className="md:col-span-2 md:row-span-1 bg-bento-card border border-bento-border rounded-2xl overflow-hidden shadow-lg relative group h-40 md:h-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <ClockWidget />
        </div>

        {/* 2. Weather: Top Right [Col 3-4, Row 1-2] 
            We place this second so it fills the top-right quadrant spanning 2 rows.
        */}
        <div className="md:col-span-2 md:row-span-2 bg-bento-card border border-bento-border rounded-2xl overflow-hidden shadow-lg relative group h-64 md:h-auto order-first md:order-none">
             <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/5 to-transparent pointer-events-none z-20"></div>
            <WeatherWidget />
        </div>

        {/* 3. Earthquake: Middle Left [Col 1-2, Row 2-3] 
           Starts at Row 2, fills the gap below Clock.
        */}
        <div className="md:col-span-2 md:row-span-2 bg-bento-card border border-bento-border rounded-2xl p-4 shadow-lg flex flex-col relative group min-h-0 h-64 md:h-auto overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/5 to-transparent pointer-events-none rounded-2xl"></div>
             <div className="flex-grow w-full h-full min-h-0 relative">
                 <EarthquakeWidget />
             </div>
        </div>

        {/* 4. Typhoon: Middle Right [Col 3-4, Row 3] 
           Starts at Row 3, fills the gap below Weather.
        */}
        <div className="md:col-span-2 md:row-span-1 bg-bento-card border border-bento-border rounded-2xl p-4 shadow-lg flex flex-col relative group min-h-0 h-48 md:h-auto overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-bento-alert/5 to-transparent pointer-events-none rounded-2xl"></div>
             <div className="flex-grow w-full h-full min-h-0 relative">
                 <TyphoonWidget />
             </div>
        </div>

        {/* --- ROW 4 --- */}

        {/* 5. Volcano: Bottom Full Width [Col 1-4, Row 4] */}
        <div className="md:col-span-4 md:row-span-1 bg-bento-card border border-bento-border rounded-2xl overflow-hidden shadow-lg relative group h-32 md:h-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/5 to-transparent pointer-events-none"></div>
            <VolcanoWidget />
        </div>

      </main>
    </div>
  );
};

export default App;
