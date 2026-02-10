'use client';

import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Thermometer, AlertTriangle, Loader2 } from 'lucide-react';

const PARKS = [
  { name: 'Fazao-Malfakassa', lat: 8.85, lon: 0.95 },
  { name: 'La Kéran', lat: 10.35, lon: 1.05 },
  { name: 'Oti-Mandouri', lat: 10.82, lon: 0.65 }
];

export function WeatherWidget() {
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const results = await Promise.all(PARKS.map(async (park) => {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${park.lat}&longitude=${park.lon}&current_weather=true`);
          const data = await res.json();
          
          // Logique de calcul du Risque Incendie (Simplifiée)
          const temp = data.current_weather.temperature;
          const wind = data.current_weather.windspeed;
          let risk = "Bas";
          let riskColor = "text-green-600 bg-green-50";
          
          if (temp > 35 && wind > 20) { risk = "Critique"; riskColor = "text-red-600 bg-red-50 animate-pulse"; }
          else if (temp > 30 || wind > 15) { risk = "Élevé"; riskColor = "text-orange-600 bg-orange-50"; }
          else if (temp > 25) { risk = "Modéré"; riskColor = "text-yellow-600 bg-yellow-50"; }

          return {
            ...park,
            temp,
            wind,
            code: data.current_weather.weathercode,
            risk,
            riskColor
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
        <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex-1">
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
            <div className={`text-[9px] font-bold px-2 py-1 rounded-lg mt-2 inline-block uppercase tracking-tighter ${park.riskColor}`}>
              Risque Feu : {park.risk}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}