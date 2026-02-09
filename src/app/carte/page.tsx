'use client';

import dynamic from 'next/dynamic';
import { Search, Filter, Info } from 'lucide-react';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-stone-100 animate-pulse flex items-center justify-center">
      <span className="text-stone-400 font-medium">Chargement de la carte...</span>
    </div>
  ),
});

export default function CartePage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar Control Panel */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-stone-200 flex flex-col shadow-xl z-10">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-stone-900 mb-6 flex items-center">
            <Search className="h-6 w-6 mr-2 text-green-600" /> Explorateur Géo
          </h1>
          
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une espèce ou un lieu..."
                className="w-full pl-10 pr-4 py-2 bg-stone-100 border-none rounded-lg focus:ring-2 focus:ring-green-500 transition-all outline-none text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200 hover:bg-green-200 transition-colors">
                En danger
              </button>
              <button className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-full border border-stone-200 hover:bg-stone-200 transition-colors">
                Parcs Nationaux
              </button>
              <button className="px-3 py-1 bg-stone-100 text-stone-600 text-xs font-semibold rounded-full border border-stone-200 hover:bg-stone-200 transition-colors">
                Zones Marines
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-green-900">Aide à la navigation</h4>
                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  Utilisez les filtres pour isoler des espèces spécifiques ou des zones protégées sur la carte interactive.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider">Résultats récents</h3>
            {/* Mock results */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-3 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-stone-100">
                <div className="w-12 h-12 bg-stone-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=100&q=80`} alt="Animal" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-stone-900">Espèce {i}</h5>
                  <p className="text-xs text-stone-500">Localisation: Zone Amazonienne</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-stone-100">
        <Map />
        
        {/* Floating Stats */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/90 backdrop-blur shadow-lg rounded-xl p-4 border border-white/50 hidden sm:block">
          <div className="flex gap-8">
            <div className="text-center">
              <span className="block text-2xl font-bold text-green-600">1,248</span>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Espèces suivies</span>
            </div>
            <div className="text-center border-l border-stone-200 pl-8">
              <span className="block text-2xl font-bold text-emerald-600">452</span>
              <span className="text-[10px] uppercase font-bold text-stone-500 tracking-widest">Zones protégées</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
