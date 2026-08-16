import { useState, useEffect } from 'react';

export interface WeatherData {
  temp: number;
  description: string;
  windSpeed: number;
  weathercode: number;
}

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const getWeatherDesc = (code: number) => {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  return 'Cloudy';
};

export function useWeather(location: string) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const fetchWeather = async () => {
      const cacheKey = `weather_cache_${location.toLowerCase().trim()}`;
      const cachedItem = localStorage.getItem(cacheKey);

      if (cachedItem) {
        try {
          const parsed = JSON.parse(cachedItem);
          if (Date.now() - parsed.timestamp < CACHE_DURATION_MS) {
            setData(parsed.data);
            return;
          }
        } catch (e) {
          // Ignore cache parse errors
          console.warn('Weather cache parse failed, fetching fresh data');
        }
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // 1. Geocoding
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
        if (!geoRes.ok) throw new Error('Failed to fetch location data');
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
          throw new Error('Location not found');
        }
        
        const { latitude, longitude } = geoData.results[0];
        
        // 2. Weather
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        if (!weatherRes.ok) throw new Error('Failed to fetch weather data');
        const weatherData = await weatherRes.json();
        
        if (weatherData.current_weather) {
          const newData: WeatherData = {
            temp: Math.round(weatherData.current_weather.temperature),
            description: getWeatherDesc(weatherData.current_weather.weathercode),
            windSpeed: Math.round(weatherData.current_weather.windspeed),
            weathercode: weatherData.current_weather.weathercode,
          };
          
          setData(newData);
          localStorage.setItem(cacheKey, JSON.stringify({
            data: newData,
            timestamp: Date.now(),
          }));
        }
      } catch (err: any) {
        console.error('Weather fetch error:', err);
        setError(err.message || 'Failed to fetch weather');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [location]);

  return { data, isLoading, error };
}
