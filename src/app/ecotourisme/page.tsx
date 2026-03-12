'use client';

import React, { useEffect, useState } from 'react';
import { getAllTrails } from '@/lib/actions';
import { 
  Mountain, Map, Clock, Zap, ArrowRight, 
  Search, Loader2, Star, TreePine 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const difficultyLabels: Record<string, { label: string, color: string }> = {
  easy: { label: 'Facile', color: 'text-green-600 bg-green-50' },
  moderate: { label: 'Modéré', color: 'text-amber-600 bg-amber-50' },
  hard: { label: 'Difficile', color: 'text-red-600 bg-red-50' },
};

export default function EcotourismePage() {
  const [trails, setTrails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDifficulty, setActiveDifficulty] = useState<string>('all');

  useEffect(() => {
    async function fetchTrails() {
      setLoading(true);
      const data = await getAllTrails();
      setTrails(data);
      setLoading(false);
    }
    fetchTrails();
  }, []);

  const filteredTrails = trails.filter(t => 
    (activeDifficulty === 'all' || t.difficulty === activeDifficulty) &&
    (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2000&q=80" 
          alt="Ecotourisme Togo" 
          className="object-cover"
          fill
          priority
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-widest mb-6"
          >
            <TreePine className="h-4 w-4" /> Explorez le Togo Sauvage
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white mb-6"
          >
            Circuits Éco-Responsables
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-stone-200 font-medium italic"
          >
            Découvrez des itinéraires uniques guidés par des experts locaux pour une immersion totale.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2 p-1 bg-stone-100 rounded-2xl w-fit">
            {['all', 'easy', 'moderate', 'hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setActiveDifficulty(diff)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${activeDifficulty === diff ? 'bg-white text-green-600 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              >
                {diff === 'all' ? 'Tous' : (difficultyLabels[diff]?.label || diff)}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-300" />
            <input 
              type="text" 
              placeholder="Rechercher un circuit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-12 w-12 text-green-600 animate-spin" /></div>
        ) : filteredTrails.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredTrails.map((trail, i) => (
              <motion.div
                key={trail.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative bg-white rounded-[40px] border border-stone-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all"
              >
                <div className="relative h-72">
                  {trail.imageUrl && <Image 
                    src={trail.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80"} 
                    alt={trail.name}
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    fill
                  />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-6 right-6">
                    <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${difficultyLabels[trail.difficulty]?.color || 'bg-stone-100'}`}>
                      {difficultyLabels[trail.difficulty]?.label || trail.difficulty}
                    </span>
                  </div>
                  {trail.isFeatured && (
                    <div className="absolute top-6 left-6 bg-amber-400 text-stone-900 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 shadow-lg">
                      <Star className="h-3 w-3 fill-current" /> Coup de Coeur
                    </div>
                  )}
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-black text-white leading-tight">{trail.name}</h3>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-bold text-stone-600">{trail.durationHours}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-bold text-stone-600">{trail.distanceKm}km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold text-stone-600 italic">Eco-certifié</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-stone-400 line-clamp-2 mb-8 font-medium italic">
                    {trail.description}
                  </p>

                  <Link 
                    href={`/ecotourisme/${trail.id}`}
                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-green-600 transition-all shadow-lg"
                  >
                    VOIR L'ITINÉRAIRE <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-stone-50 rounded-[40px] border-2 border-dashed border-stone-200">
            <Mountain className="h-12 w-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Aucun circuit ne correspond à votre recherche</p>
          </div>
        )}
      </div>
    </div>
  );
}
