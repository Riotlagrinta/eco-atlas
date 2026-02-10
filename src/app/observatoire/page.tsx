'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Leaf, Search, AlertTriangle, Loader2, X, Share2, Heart, MessageSquare, Send, User, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const MiniMap = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => <div className="h-full bg-stone-100 animate-pulse" /> 
});

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

function ObservatoireContent() {
  const [species, setSpecies] = useState<Species[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const supabase = createClient();
  const searchParams = useSearchParams();
  const speciesIdFromUrl = searchParams.get('id');

  const fetchComments = async (speciesId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('species_id', speciesId)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  useEffect(() => {
    async function fetchData() {
      const { data: speciesData } = await supabase.from('species').select('*').order('name');
      if (speciesData) {
        setSpecies(speciesData);
        
        // Si un ID est dans l'URL, on ouvre la fiche correspondante
        if (speciesIdFromUrl) {
          const target = speciesData.find(s => s.id === speciesIdFromUrl);
          if (target) {
            setSelectedSpecies(target);
            fetchComments(target.id);
          }
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favData } = await supabase.from('favorites').select('species_id').eq('user_id', user.id);
        if (favData) setFavorites(favData.map(f => f.species_id));
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase, speciesIdFromUrl]);

  const toggleFavorite = async (speciesId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Connectez-vous pour ajouter des favoris");

    if (favorites.includes(speciesId)) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('species_id', speciesId);
      setFavorites(favorites.filter(id => id !== speciesId));
    } else {
      await supabase.from('favorites').insert([{ user_id: user.id, species_id: speciesId }]);
      setFavorites([...favorites, speciesId]);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Connectez-vous pour commenter !");
    
    const { error } = await supabase.from('comments').insert([{
      user_id: user.id,
      species_id: selectedSpecies?.id,
      content: newComment
    }]);

    if (!error) {
      setNewComment('');
      fetchComments(selectedSpecies!.id);
    }
  };

  const filteredSpecies = species.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.scientific_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Modal Détail */}
      <AnimatePresence>
        {selectedSpecies && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-100/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-stone-200"
            >
              <div className="relative h-64 md:h-96">
                <img src={selectedSpecies.image_url} className="w-full h-full object-cover" alt={selectedSpecies.name} />
                <button onClick={() => setSelectedSpecies(null)} className="absolute top-4 right-4 bg-white shadow-lg text-stone-900 p-2 rounded-full hover:bg-stone-100 transition-all"><X className="h-6 w-6" /></button>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900">{selectedSpecies.name}</h2>
                    <p className="text-lg italic text-green-600">{selectedSpecies.scientific_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold text-white ${statusColors[selectedSpecies.conservation_status]}`}>
                      {statusLabels[selectedSpecies.conservation_status]}
                    </div>
                    <button 
                      onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Découvrez le " + selectedSpecies.name + " sur Eco-Atlas Togo 🇹🇬")}`, '_blank')}
                      className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all"
                    >
                      <Share2 className="h-3 w-3 mr-1" /> WhatsApp
                    </button>
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

                <p className="text-stone-600 leading-relaxed whitespace-pre-wrap mb-12 border-b border-stone-100 pb-12">{selectedSpecies.description}</p>

                {/* Carte de Répartition */}
                <div className="mb-12">
                  <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-green-600" /> Répartition au Togo
                  </h3>
                  <div className="h-64 rounded-3xl overflow-hidden border border-stone-200 shadow-inner">
                    <MiniMap filter="species" />
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 italic text-center">Les points indiquent les signalements citoyens vérifiés pour cette espèce.</p>
                </div>

                {/* Section Discussion */}
                <div className="bg-stone-50 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-green-600" /> Discussion ({comments.length})
                  </h3>

                  <div className="space-y-6 mb-8">
                    {comments.map((c) => (
                      <div key={c.id} className="flex space-x-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-stone-200 overflow-hidden flex-shrink-0">
                          {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-stone-300" />}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
                            <p className="font-bold text-xs text-stone-900 mb-1">{c.profiles?.full_name || "Éco-citoyen"}</p>
                            <p className="text-sm text-stone-600">{c.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendComment} className="relative">
                    <input 
                      type="text" 
                      placeholder="Une question ? Une observation ?" 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full pl-6 pr-12 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                    />
                    <button type="submit" className="absolute right-3 top-3 p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(s.id);
                  }}
                  className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur shadow-lg rounded-full flex items-center justify-center hover:scale-110 transition-all"
                >
                  <Heart className={`h-5 w-5 ${favorites.includes(s.id) ? 'text-red-500 fill-current' : 'text-stone-400'}`} />
                </button>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-stone-900 mb-1">{s.name}</h3>
                <p className="text-sm italic text-stone-500 mb-4">{s.scientific_name}</p>
                <button 
                  onClick={() => {
                    setSelectedSpecies(s);
                    fetchComments(s.id);
                  }} 
                  className="w-full py-3 bg-stone-900 text-white font-bold rounded-xl hover:bg-green-600 transition-colors"
                >
                  Voir la fiche
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200 text-stone-400 font-medium">L'observatoire est vide. Utilisez le panel admin pour ajouter des espèces.</div>
      )}
    </div>
  );
}

export default function ObservatoirePage() {
  return (
    <div className="min-h-screen bg-white text-stone-900 px-4 py-12">
      <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="h-12 w-12 text-green-600 animate-spin" /></div>}>
        <ObservatoireContent />
      </Suspense>
    </div>
  );
}