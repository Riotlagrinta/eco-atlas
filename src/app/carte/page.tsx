'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, Filter, Info, Leaf, Map as MapIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-stone-100 animate-pulse flex items-center justify-center">
      <span className="text-stone-400 font-medium">Chargement de la carte forestière...</span>
    </div>
  ),
});

export default function CartePage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'parks' | 'species'>('all');
  const [recentObs, setRecentObs] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchRecent() {
      const { data } = await supabase
        .from('observations')
        .select('*, species:species_id(name)')
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecentObs(data);
    }
    fetchRecent();
  }, [supabase]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Control Panel */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-stone-200 flex flex-col shadow-xl z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-6 flex items-center">
            <MapIcon className="h-6 w-6 mr-2 text-green-600" /> Atlas Togo
          </h1>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${activeFilter === 'all' ? 'bg-green-600 text-white border-green-600' : 'bg-stone-100 text-stone-600 border-stone-200'}`}
              >
                Tout voir
              </button>
              <button 
                onClick={() => setActiveFilter('parks')}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${activeFilter === 'parks' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-100 text-stone-600 border-stone-200'}`}
              >
                Parcs & Réserves
              </button>
              <button 
                onClick={() => setActiveFilter('species')}
                className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${activeFilter === 'species' ? 'bg-blue-600 text-white border-blue-600' : 'bg-stone-100 text-stone-600 border-stone-200'}`}
              >
                Observations
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-green-900 uppercase text-[10px] tracking-wider">Légende</h4>
                <p className="text-[11px] text-green-700 mt-1 leading-relaxed">
                  Zones vertes : Aires protégées. <br />
                  Marqueurs : Signalements citoyens vérifiés.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Derniers signalements au Togo</h3>
            
            {recentObs.length > 0 ? recentObs.map((obs) => (
              <div key={obs.id} className="flex items-center space-x-4 p-3 hover:bg-stone-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-stone-100 group">
                <div className="w-14 h-14 bg-stone-100 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <img 
                    src={obs.image_url || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=100&q=80'} 
                    alt="Observation" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="min-w-0">
                  <h5 className="text-sm font-bold text-stone-900 truncate">{obs.species?.name || "Espèce inconnue"}</h5>
                  <p className="text-[11px] text-stone-500 truncate">{obs.description}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-stone-400 italic text-center py-4">Aucune observation récente</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-stone-100">
        <Map filter={activeFilter} />
        
        {/* Floating Stats */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur shadow-2xl rounded-2xl p-4 border border-white/50 hidden sm:block">
          <div className="flex gap-8">
            <div className="text-center">
              <span className="block text-2xl font-bold text-green-600">🇹🇬</span>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Patrimoine National</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
