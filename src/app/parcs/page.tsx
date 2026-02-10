'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, Trees, Map, ArrowRight, Loader2, Maximize } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ParcsPage() {
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAreas() {
      const { data } = await supabase
        .from('protected_areas')
        .select('*')
        .order('name');
      if (data) setAreas(data);
      setLoading(false);
    }
    fetchAreas();
  }, [supabase]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-stone-900 mb-4 flex items-center">
          <Trees className="h-10 w-10 text-green-600 mr-4" /> Parcs & Sanctuaires du Togo
        </h1>
        <p className="text-stone-500 text-lg">Découvrez les poumons verts de notre nation et leur importance vitale.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {areas.map((area, index) => (
          <motion.div
            key={area.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden flex flex-col"
          >
            <div className="h-64 relative bg-stone-100">
              <img 
                src={area.image_url || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt={area.name} 
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-stone-900 uppercase tracking-widest border border-stone-100 shadow-sm">
                {area.type}
              </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl font-bold text-stone-900">{area.name}</h3>
                <div className="flex items-center text-green-600 font-bold bg-green-50 px-3 py-1 rounded-lg text-sm">
                  <Maximize className="h-4 w-4 mr-1" /> {area.area_km2 || '??'} km²
                </div>
              </div>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed line-clamp-3">
                {area.description || "Aucune description détaillée disponible pour le moment."}
              </p>
              
              <div className="mt-auto pt-6 border-t border-stone-50 flex items-center justify-between">
                <Link 
                  href={`/parcs/${area.id}`} 
                  className="flex items-center text-green-600 font-bold text-sm hover:translate-x-2 transition-all"
                >
                  Détails & Statistiques <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <div className="flex -space-x-2 overflow-hidden">
                  {[1,2,3].map(i => (
                    <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-stone-100 overflow-hidden">
                      <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=50&h=50&fit=crop`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
