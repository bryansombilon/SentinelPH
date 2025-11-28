
import React from 'react';
import ClockWidget from './components/ClockWidget';
import WeatherWidget from './components/WeatherWidget';
import EarthquakeWidget from './components/EarthquakeWidget';
import TyphoonWidget from './components/TyphoonWidget';
import VolcanoWidget from './components/VolcanoWidget';
import BaguioWeatherWidget from './components/BaguioWeatherWidget';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-bento-bg p-2 md:p-4 flex flex-col gap-4 overflow-hidden h-screen text-white">
      
      {/* 
        Main Grid System: 4 Columns x 4 Rows
        Mobile: Auto flow, single column.
      */}
      <main className="flex-grow grid grid-cols-1 md:grid-cols-4 grid-rows-none md:grid-rows-4 gap-3 md:gap-4 h-full min-h-0">
        
        {/* --- ROW 1 --- */}

        {/* 1. Clock: Col 1, Row 1 (1x1) */}
        <div className="md:col-span-1 md:row-span-1 h-32 md:h-auto">
            <ClockWidget />
        </div>

        {/* 2. Baguio Weather: Col 2, Row 1 (1x1) */}
        <div className="md:col-span-1 md:row-span-1 h-32 md:h-auto">
            <BaguioWeatherWidget />
        </div>

        {/* 4. Weather Satellite: Col 3-4, Row 1-2 (2x2) */}
        <div className="md:col-span-2 md:row-span-2 bg-bento-card border border-bento-border rounded-2xl overflow-hidden shadow-lg relative group h-48 md:h-auto order-first md:order-none">
             <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/5 to-transparent pointer-events-none z-20"></div>
            <WeatherWidget />
        </div>


        {/* --- ROW 2, 3, 4 (Left Side) --- */}

        {/* 3. Seismic Activity: Col 1-2, Row 2-4 (2x3) 
            Starts Row 2, fills the remaining height on left side.
        */}
        <div className="md:col-span-2 md:row-span-3 bg-bento-card border border-bento-border rounded-2xl p-4 shadow-lg flex flex-col relative group min-h-0 h-96 md:h-auto overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/5 to-transparent pointer-events-none rounded-2xl"></div>
             <div className="flex-grow w-full h-full min-h-0 relative">
                 <EarthquakeWidget />
             </div>
        </div>

        {/* --- ROW 3 (Right Side) --- */}

        {/* 5. Typhoon: Col 3-4, Row 3 (2x1) 
            Placed below Weather Satellite.
        */}
        <div className="md:col-span-2 md:row-span-1 bg-bento-card border border-bento-border rounded-2xl p-4 shadow-lg flex flex-col relative group min-h-0 h-40 md:h-auto overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-bento-alert/5 to-transparent pointer-events-none rounded-2xl"></div>
             <div className="flex-grow w-full h-full min-h-0 relative">
                 <TyphoonWidget />
             </div>
        </div>

        {/* --- ROW 4 (Right Side) --- */}

        {/* 6. Volcano: Col 3-4, Row 4 (2x1) 
            Placed below Typhoon.
        */}
        <div className="md:col-span-2 md:row-span-1 bg-bento-card border border-bento-border rounded-2xl overflow-hidden shadow-lg relative group h-32 md:h-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-bento-highlight/5 to-transparent pointer-events-none"></div>
            <VolcanoWidget />
        </div>

      </main>
    </div>
  );
};

export default App;
