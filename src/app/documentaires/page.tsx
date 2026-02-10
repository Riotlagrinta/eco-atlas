'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Play, Clock, Film, Search, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Documentary {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  category: string;
}

export default function DocumentairesPage() {
  const [docs, setDocs] = useState<Documentary[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Documentary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tous');
  const supabase = createClient();

  useEffect(() => {
    async function fetchDocs() {
      const { data } = await supabase
        .from('documentaries')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setDocs(data);
      setLoading(false);
    }
    fetchDocs();
  }, []);

  const categories = ['Tous', ...Array.from(new Set(docs.map(d => d.category)))];
  const filteredDocs = filter === 'Tous' ? docs : docs.filter(d => d.category === filter);

  return (
    <div className="min-h-screen bg-white text-stone-900 pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Lecteur Vidéo Intégré - Fond Clair */}
        {selectedDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-100/95 backdrop-blur-md">
            <div className="w-full max-w-5xl aspect-video relative bg-white rounded-3xl overflow-hidden shadow-2xl border border-stone-200">
              <iframe 
                src={`${selectedDoc.video_url}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="absolute -top-12 right-0 text-stone-900 hover:text-green-600 font-bold flex items-center transition-all"
              >
                Fermer <X className="ml-2 h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-4 flex items-center text-stone-900">
              <Film className="h-10 w-10 text-green-600 mr-4" /> Eco-Stream Togo
            </h1>
            <p className="text-stone-600 text-lg">
              Vidéos et reportages sur le patrimoine naturel du Togo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === cat ? 'bg-green-600 text-white' : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white rounded-3xl overflow-hidden border border-stone-200 hover:border-green-500/50 transition-all shadow-sm hover:shadow-xl"
              >
                <div className="relative aspect-video bg-stone-100">
                  <img
                    src={doc.thumbnail_url}
                    alt={doc.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:bg-green-600 group-hover:text-white transition-all">
                      <Play className="h-6 w-6 fill-current ml-1" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-2 block">
                    {doc.category}
                  </span>
                  <h3 className="text-xl font-bold mb-3 text-stone-900">
                    {doc.title}
                  </h3>
                  <p className="text-stone-500 text-sm line-clamp-2 mb-6">
                    {doc.description}
                  </p>
                  <button 
                    onClick={() => setSelectedDoc(doc)} 
                    className="text-sm font-bold text-green-600 hover:underline flex items-center"
                  >
                    Regarder <Play className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 text-stone-400 font-medium">
            Aucun documentaire disponible pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
