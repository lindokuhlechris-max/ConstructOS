import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui';
import { CloudRain, Thermometer, MapPin, Cloud, Sun, Settings, X, Search, Map, Clock as ClockIcon, Loader2 } from 'lucide-react';
import { Button } from './ui';
import { useWeather } from '../hooks/useWeather';

export function WeatherWidget() {
  const [locationName, setLocationName] = useState(() => {
    return localStorage.getItem('reports_weather_location') || 'Seattle, WA';
  });
  
  const { data: weatherData, isLoading, error } = useWeather(locationName);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes
    if (code === 0) return <Sun className="w-24 h-24" />;
    if (code > 0 && code < 4) return <Cloud className="w-24 h-24" />;
    if (code >= 51 && code <= 67) return <CloudRain className="w-24 h-24" />;
    if (code >= 80 && code <= 82) return <CloudRain className="w-24 h-24" />;
    return <Cloud className="w-24 h-24" />;
  };

  const handleSaveLocation = () => {
    if (searchInput.trim()) {
      setLocationName(searchInput.trim());
      localStorage.setItem('reports_weather_location', searchInput.trim());
      setIsSettingsOpen(false);
      setSearchInput('');
    }
  };

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          {weatherData ? getWeatherIcon(weatherData.weathercode) : <CloudRain className="w-24 h-24" />}
        </div>
        <CardContent className="p-5 relative z-10">
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex items-start justify-between">
              <span className="text-blue-100 font-medium text-sm flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors" onClick={() => setIsSettingsOpen(true)} title="Change Location">
                Site Weather Station
                <Settings className="h-3.5 w-3.5 opacity-70" />
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-blue-200 mt-1">
               <MapPin className="h-3 w-3" /> {locationName}
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Thermometer className="h-5 w-5 text-amber-300" />
              <span className="text-3xl font-bold flex items-center gap-2">
                {isLoading && !weatherData && <Loader2 className="h-5 w-5 animate-spin opacity-50" />}
                {weatherData ? `${weatherData.temp}°C` : (isLoading ? '--' : 'N/A')}
              </span>
            </div>
            <span className="text-blue-100 text-sm mt-1 flex items-center gap-1.5">
              {error ? (
                 <span className="text-red-200">{error}</span>
              ) : weatherData ? (
                `${weatherData.description} • ${weatherData.windSpeed}km/h Wind`
              ) : (
                'Loading weather...'
              )}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-t border-white/20 pt-4 mt-2">
            <span className="text-blue-100 font-medium text-sm">Local Time</span>
            <div className="flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-blue-200" />
              <span className="text-xl font-bold tracking-tight">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <span className="text-blue-100 text-xs mt-1">
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </CardContent>
      </Card>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2"><Map className="h-5 w-5 text-blue-500" /> Set Location</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 block">City / Location</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder={locationName}
                    onKeyDown={e => e.key === 'Enter' && handleSaveLocation()}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Example: "Seattle, WA" or "London, UK"</p>
              </div>
              <Button onClick={handleSaveLocation} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
                Save Location
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
