'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Leaf, Search, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Species {
  id: string;
  name: string;
  scientific_name: string;
  description: string;
  conservation_status: string;
  image_url: string;
}

const statusColors: Record<string, string> = {
  'CR': 'bg-red-600',
  'EN': 'bg-orange-600',
  'VU': 'bg-yellow-500',
  'NT': 'bg-blue-500',
  'LC': 'bg-green-500',
};

const statusLabels: Record<string, string> = {
  'CR': 'En danger critique',
  'EN': 'En danger',
  'VU': 'Vulnérable',
  'NT': 'Quasi menacé',
  'LC': 'Préoccupation mineure',
};

export default function ObservatoirePage() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchSpecies() {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .order('name');
      
      if (data) setSpecies(data);
      setLoading(false);
    }
    fetchSpecies();
  }, []);

  const filteredSpecies = species.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-stone-900 mb-4 flex items-center">
            <Leaf className="h-10 w-10 text-green-600 mr-4" /> Observatoire
          </h1>
          <p className="text-stone-600 text-lg">
            Découvrez et apprenez-en plus sur les espèces suivies par notre communauté.
          </p>
        </div>

        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Rechercher une espèce..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
          />
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
          <p className="text-stone-500 font-medium">Chargement de la biodiversité...</p>
        </div>
      ) : filteredSpecies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpecies.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={s.image_url || 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80'}
                  alt={s.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-lg ${statusColors[s.conservation_status] || 'bg-stone-500'}`}>
                  {s.conservation_status}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-stone-900 mb-1">{s.name}</h3>
                <p className="text-sm italic text-stone-500 mb-4">{s.scientific_name}</p>
                <p className="text-stone-600 text-sm line-clamp-3 leading-relaxed mb-6">
                  {s.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                    Statut: <span className="text-stone-700">{statusLabels[s.conservation_status] || 'Inconnu'}</span>
                  </span>
                  <button className="text-green-600 hover:text-green-700 font-bold text-sm">
                    Détails →
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
          <AlertTriangle className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-stone-900">Aucune espèce trouvée</h3>
          <p className="text-stone-500">Essayez de modifier vos critères de recherche.</p>
        </div>
      )}
    </div>
  );
}
