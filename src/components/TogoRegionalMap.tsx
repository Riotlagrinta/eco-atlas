'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TogoMapProps {
  activeRegion: string | null;
  onRegionClick: (region: string) => void;
  regionalData: any[];
}

export function TogoRegionalMap({ activeRegion, onRegionClick, regionalData }: TogoMapProps) {
  // Chemins SVG simplifiés pour les 5 régions du Togo
  const regions = [
    { id: 'Savanes', d: "M45,10 L85,10 L85,40 L40,55 L35,30 Z", color: "fill-emerald-600" },
    { id: 'Kara', d: "M40,55 L85,40 L90,80 L45,95 L35,70 Z", color: "fill-green-500" },
    { id: 'Centrale', d: "M45,95 L90,80 L95,130 L50,145 L40,120 Z", color: "fill-emerald-500" },
    { id: 'Plateaux', d: "M50,145 L95,130 L105,200 L45,215 L40,180 Z", color: "fill-green-600" },
    { id: 'Maritime', d: "M45,215 L105,200 L110,250 L60,250 L55,230 Z", color: "fill-emerald-700" },
  ];

  const getRegionCount = (id: string) => {
    return regionalData.find(r => r.name === id)?.count || 0;
  };

  return (
    <div className="relative w-full aspect-[1/2] max-w-[250px] mx-auto group">
      <svg viewBox="0 0 150 260" className="w-full h-full drop-shadow-2xl">
        {regions.map((reg) => (
          <motion.path
            key={reg.id}
            d={reg.d}
            className={cn(
              "cursor-pointer transition-all stroke-white stroke-[2px]",
              activeRegion === reg.id ? "fill-green-400" : reg.color,
              activeRegion && activeRegion !== reg.id ? "opacity-30" : "opacity-100"
            )}
            whileHover={{ scale: 1.02, strokeWidth: 4 }}
            onClick={() => onRegionClick(reg.id)}
          />
        ))}
      </svg>
      
      {/* Tooltip flottant au survol */}
      <div className="absolute top-0 -right-12 space-y-2">
        {regions.map(r => (
          <div key={r.id} className={cn(
            "text-[8px] font-bold px-2 py-1 rounded-full border transition-all",
            activeRegion === r.id ? "bg-green-600 text-white border-green-600" : "bg-white text-stone-400 border-stone-100"
          )}>
            {r.id}: {getRegionCount(r.id)}
          </div>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
