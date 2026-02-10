'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Leaf, Search, AlertTriangle, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Species {
  id: string;
  name: string;
  scientific_name: string;
  description: string;
  conservation_status: string;
  image_url: string;
  habitat?: string;
  diet?: string;
  population_estimate?: string;
}

const statusColors: Record<string, string> = {
  'CR': 'bg-red-600', 'EN': 'bg-orange-600', 'VU': 'bg-yellow-500', 'NT': 'bg-blue-500', 'LC': 'bg-green-500',
};

const statusLabels: Record<string, string> = {
  'CR': 'En danger critique', 'EN': 'En danger', 'VU': 'Vulnérable', 'NT': 'Quasi menacé', 'LC': 'Préoccupation mineure',
};

export default function ObservatoirePage() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    async function fetchSpecies() {
      const { data } = await supabase.from('species').select('*').order('name');
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
    <div className="min-h-screen bg-white text-stone-900 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Modal Détail - Fond Clair */}
        {selectedSpecies && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-100/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-stone-200"
            >
              <div className="relative h-64 md:h-96">
                <img src={selectedSpecies.image_url} className="w-full h-full object-cover" alt={selectedSpecies.name} />
                <button 
                  onClick={() => setSelectedSpecies(null)}
                  className="absolute top-4 right-4 bg-white shadow-lg text-stone-900 p-2 rounded-full hover:bg-stone-100 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900">{selectedSpecies.name}</h2>
                    <p className="text-lg italic text-green-600">{selectedSpecies.scientific_name}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${statusColors[selectedSpecies.conservation_status]}`}>
                    {statusLabels[selectedSpecies.conservation_status]}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {[
                    { label: 'Habitat', value: selectedSpecies.habitat },
                    { label: 'Régime', value: selectedSpecies.diet },
                    { label: 'Population', value: selectedSpecies.population_estimate }
                  ].map((item, i) => (
                    <div key={i} className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{item.label}</h4>
                      <p className="text-sm font-bold text-stone-700">{item.value || "Non renseigné"}</p>
                    </div>
                  ))}
                </div>

                <div className="prose prose-stone max-w-none">
                  <h4 className="text-lg font-bold mb-2 text-stone-900">Description et Conservation</h4>
                  <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{selectedSpecies.description}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-stone-900 mb-4 flex items-center">
              <Leaf className="h-10 w-10 text-green-600 mr-4" /> Observatoire
            </h1>
            <p className="text-stone-600 text-lg">Encyclopédie de la biodiversité du Togo.</p>
          </div>
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-12 w-12 text-green-600 animate-spin" /></div>
        ) : filteredSpecies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSpecies.map((s) => (
              <div key={s.id} className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden hover:shadow-xl transition-all group">
                <div className="relative h-64 bg-stone-100">
                  <img src={s.image_url} alt={s.name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase ${statusColors[s.conservation_status]}`}>{s.conservation_status}</div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-stone-900 mb-1">{s.name}</h3>
                  <p className="text-sm italic text-stone-500 mb-4">{s.scientific_name}</p>
                  <button onClick={() => setSelectedSpecies(s)} className="w-full py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-green-600 transition-colors">Voir la fiche</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 text-stone-400 font-medium">L'observatoire est vide. Utilisez le panel admin pour ajouter des espèces.</div>
        )}
      </div>
    </div>
  );
}