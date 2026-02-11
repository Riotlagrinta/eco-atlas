'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Leaf, MapPin, Loader2, ArrowLeft, Heart, Share2, MessageSquare, Send, User, X } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';

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
  category: 'Fauna' | 'Flora';
}

const statusColors: Record<string, string> = {
  'CR': 'bg-red-600', 'EN': 'bg-orange-600', 'VU': 'bg-yellow-500', 'NT': 'bg-blue-500', 'LC': 'bg-green-500',
};

const statusLabels: Record<string, string> = {
  'CR': 'En danger critique', 'EN': 'En danger', 'VU': 'Vulnérable', 'NT': 'Quasi menacé', 'LC': 'Préoccupation mineure',
};

export default function SpeciesDetailPage() {
  const { id } = useParams();
  const [species, setSpecies] = useState<Species | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

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
      const { data } = await supabase
        .from('species')
        .select('*')
        .eq('id', id)
        .single();
      
      if (data) {
        setSpecies(data);
        fetchComments(data.id);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Connectez-vous pour commenter !");
    
    await supabase.from('comments').insert([{
      user_id: user.id,
      species_id: species?.id,
      content: newComment
    }]);
    setNewComment('');
    fetchComments(species!.id);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;
  if (!species) return <div className="text-center py-24">Espèce non trouvée.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 bg-white min-h-screen">
      <Link href="/observatoire" className="inline-flex items-center text-stone-400 hover:text-green-600 font-bold text-sm mb-8 transition-colors group">
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Retour à l'observatoire
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden mb-12">
        <div className="relative h-64 md:h-[50vh]">
          <img src={species.image_url} className="w-full h-full object-cover" alt={species.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{species.name}</h1>
            <p className="text-stone-200 text-lg italic">{species.scientific_name}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
            <div className={`px-6 py-2 rounded-2xl text-sm font-bold text-white shadow-lg ${statusColors[species.conservation_status]}`}>
              Statut UICN : {statusLabels[species.conservation_status]}
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Découvrez le " + species.name + " sur Eco-Atlas Togo 🇹🇬 : " + window.location.href)}`, '_blank')}
                className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-600 font-bold rounded-2xl hover:bg-green-100 transition-all border border-green-100"
              >
                <Share2 className="h-5 w-5" /> Partager
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Habitat Togo', value: species.habitat },
              { label: 'Régime Alimentaire', value: species.diet },
              { label: 'Population', value: species.population_estimate }
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">{item.label}</h4>
                <p className="text-sm font-bold text-stone-800 leading-relaxed">{item.value || "Donnée en cours de collecte"}</p>
              </div>
            ))}
          </div>

          <div className="prose prose-stone max-w-none mb-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Description et Importance Écologique</h2>
            <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-wrap">{species.description}</p>
          </div>

          {/* Carte de Répartition */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" /> Zone d'observation au Togo
            </h3>
            <div className="h-80 rounded-3xl overflow-hidden border border-stone-200 shadow-inner">
              <MiniMap filter="species" />
            </div>
          </div>

          {/* Section Discussion */}
          <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
            <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" /> Discussion Communautaire ({comments.length})
            </h3>

            <div className="space-y-6 mb-10">
              {comments.map((c) => (
                <div key={c.id} className="flex space-x-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-stone-200 overflow-hidden flex-shrink-0 shadow-sm">
                    {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-stone-300" />}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                      <p className="font-bold text-sm text-stone-900 mb-1">{c.profiles?.full_name || "Éco-citoyen"}</p>
                      <p className="text-stone-600 leading-relaxed">{c.content}</p>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 ml-3 font-bold uppercase">{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendComment} className="relative">
              <input 
                type="text" 
                placeholder="Ajoutez une information ou posez une question..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full pl-6 pr-16 py-5 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
              />
              <button type="submit" className="absolute right-4 top-4 p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
