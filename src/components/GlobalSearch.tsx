'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Leaf, Map, Newspaper, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Fuse from 'fuse.js';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function preloadData() {
      const [s, p, a] = await Promise.all([
        supabase.from('species').select('id, name, type:scientific_name').limit(20),
        supabase.from('protected_areas').select('id, name').limit(10),
        supabase.from('articles').select('id, title').limit(10)
      ]);

      const combined = [
        ...(s.data || []).map(i => ({ ...i, category: 'Espèce', url: '/observatoire' })),
        ...(p.data || []).map(i => ({ ...i, category: 'Aire Protégée', url: '/carte' })),
        ...(a.data || []).map(i => ({ ...i, title: i.title, category: 'Actualité', url: '/actualites' }))
      ];
      setAllData(combined);
    }
    preloadData();
  }, [supabase]);

  useEffect(() => {
    if (!query) return setResults([]);
    const fuse = new Fuse(allData, { keys: ['name', 'title'], threshold: 0.3 });
    setResults(fuse.search(query).map(r => r.item));
  }, [query, allData]);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 text-stone-400 hover:text-green-600 transition-all flex items-center gap-2 bg-stone-50 rounded-xl border border-stone-100 px-4"
      >
        <Search className="h-4 w-4" />
        <span className="text-xs font-bold text-stone-400 hidden sm:inline uppercase tracking-widest">Rechercher...</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-start justify-center pt-24 px-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200"
            >
              <div className="p-4 flex items-center border-b border-stone-100">
                <Search className="h-5 w-5 text-green-600 mr-3" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Trouver une espèce, un parc, une actualité..."
                  className="flex-1 bg-transparent outline-none text-lg text-stone-900"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-stone-50 rounded-xl transition-all">
                  <X className="h-5 w-5 text-stone-400" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4">
                {results.length > 0 ? results.map((res, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      router.push(res.url);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 hover:bg-green-50 rounded-2xl border border-transparent hover:border-green-100 transition-all group mb-2"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                        {res.category === 'Espèce' ? <Leaf className="h-5 w-5" /> : res.category === 'Aire Protégée' ? <Map className="h-5 w-5" /> : <Newspaper className="h-5 w-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-stone-900">{res.name || res.title}</h4>
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{res.category}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-stone-300 group-hover:text-green-600 transition-all" />
                  </button>
                )) : query ? (
                  <div className="py-12 text-center text-stone-400 italic">Aucun résultat pour "{query}"</div>
                ) : (
                  <div className="py-12 text-center text-stone-400 text-sm">Commencez à taper pour rechercher...</div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
