'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Play, Clock, Film, Search, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-stone-950 text-white pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-4 flex items-center">
              <Film className="h-10 w-10 text-green-500 mr-4" /> Eco-Stream Togo
            </h1>
            <p className="text-stone-400 text-lg">
              Le meilleur des documentaires sur la nature et l'écologie togolaise.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${filter === cat ? 'bg-green-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDocs.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-stone-900 rounded-3xl overflow-hidden border border-stone-800 hover:border-green-500/50 transition-all shadow-2xl"
              >
                <div className="relative aspect-video">
                  <img
                    src={doc.thumbnail_url}
                    alt={doc.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-600/40">
                      <Play className="h-8 w-8 text-white fill-current ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur text-[10px] font-bold rounded flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> {doc.duration}
                  </div>
                </div>

                <div className="p-6">
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2 block">
                    {doc.category}
                  </span>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-green-400 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-stone-400 text-sm line-clamp-2 mb-6 leading-relaxed">
                    {doc.description}
                  </p>
                  
                  <a 
                    href={doc.video_url} 
                    target="_blank" 
                    className="inline-flex items-center text-sm font-bold hover:underline"
                  >
                    Regarder maintenant <Play className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
