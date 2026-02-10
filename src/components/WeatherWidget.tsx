'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, Loader2 } from 'lucide-react';

const PARKS = [
  { name: 'Fazao-Malfakassa', lat: 8.85, lon: 0.95 },
  { name: 'Parc National de la Kéran', lat: 10.35, lon: 1.05 },
  { name: 'Oti-Mandouri', lat: 10.82, lon: 0.65 }
];

export function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const results = await Promise.all(PARKS.map(async (park) => {
          // Utilisation de Open-Meteo (API gratuite sans clé)
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${park.lat}&longitude=${park.lon}&current_weather=true&hourly=relativehumidity_2m`);
          const data = await res.json();
          return {
            ...park,
            temp: data.current_weather.temperature,
            wind: data.current_weather.windspeed,
            code: data.current_weather.weathercode
          };
        }));
        setWeatherData(results);
      } catch (error) {
        console.error("Erreur météo:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="h-6 w-6 text-orange-400" />;
    if (code < 50) return <Cloud className="h-6 w-6 text-stone-400" />;
    return <CloudRain className="h-6 w-6 text-blue-400" />;
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {weatherData.map((park, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div>
            <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{park.name}</h4>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-stone-900">{park.temp}°C</span>
              {getWeatherIcon(park.code)}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-xs text-stone-500 gap-1 justify-end">
              <Wind className="h-3 w-3" /> {park.wind} km/h
            </div>
            <div className="text-[9px] font-bold text-green-600 uppercase mt-1">Risque Feu : Bas</div>
          </div>
        </div>
      ))}
    </div>
  );
}
