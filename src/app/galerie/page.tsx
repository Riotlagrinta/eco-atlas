'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, MapPin, Loader2, Maximize2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GaleriePage() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPhotos() {
      const { data } = await supabase
        .from('observations')
        .select('*, species:species_id(name), profiles:user_id(full_name)')
        .eq('is_verified', true)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false });
      if (data) setPhotos(data);
      setLoading(false);
    }
    fetchPhotos();
  }, [supabase]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 flex items-center justify-center">
          <Camera className="h-10 w-10 text-green-600 mr-4" /> Galerie des Sentinelles
        </h1>
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
          Les plus beaux clichés de la faune et de la flore capturés par la communauté éco-citoyenne du Togo.
        </p>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {photos.map((p, index) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative group cursor-pointer rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-stone-100"
            onClick={() => setSelectedPhoto(p.image_url)}
          >
            <img 
              src={p.image_url} 
              alt="Observation" 
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h4 className="font-bold text-lg">{p.species?.name || "Espèce inconnue"}</h4>
                  <p className="text-xs flex items-center opacity-80 mt-1">
                    <User className="h-3 w-3 mr-1" /> Par {p.profiles?.full_name || "Anonyme"}
                  </p>
                </div>
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                  <Maximize2 className="h-4 w-4" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {photos.length === 0 && (
        <div className="text-center py-24 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
          <p className="text-stone-400 font-medium">La galerie est vide. Soyez le premier à envoyer une photo !</p>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedPhoto} 
              className="max-w-full max-h-full rounded-2xl shadow-2xl"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
