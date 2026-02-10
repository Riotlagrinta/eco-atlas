'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Camera, CheckCircle, Clock, Award, Loader2, ArrowRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/connexion');
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // Fetch User's Observations
      const { data: obsData } = await supabase
        .from('observations')
        .select('*, species:species_id(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (obsData) setObservations(obsData);

      // Fetch User's Badges
      const { data: badgeData } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id);
      
      if (badgeData) setBadges(badgeData);

      setLoading(false);
    }
    fetchData();
  }, [router, supabase]);

  const verifiedCount = observations.filter(o => o.is_verified).length;
  const rank = verifiedCount >= 10 ? 'Expert de la Nature' : verifiedCount >= 3 ? 'Sentinelle' : 'Éco-citoyen';

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header Profil */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden mb-12">
        <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-500"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end -mt-12 mb-6 gap-6">
            <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-xl">
              <div className="w-full h-full bg-stone-100 rounded-2xl flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <User className="h-12 w-12 text-stone-300" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-stone-900">{profile?.full_name || "Éco-citoyen"}</h1>
              <p className="text-stone-500 flex items-center mt-1">
                <Award className="h-4 w-4 mr-2 text-green-600" /> {rank} du Togo
              </p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-6 py-2 bg-stone-50 rounded-2xl border border-stone-100">
                <span className="block text-xl font-bold text-stone-900">{observations.length}</span>
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Signalements</span>
              </div>
              <div className="text-center px-6 py-2 bg-green-50 rounded-2xl border border-green-100">
                <span className="block text-xl font-bold text-green-600">{verifiedCount}</span>
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Validés</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm text-center">
            <h3 className="font-bold text-stone-900 mb-6 flex items-center justify-center">
              <Award className="h-5 w-5 mr-2 text-green-600" /> Mes Trophées
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {badges.map((ub) => (
                <div key={ub.id} className="group relative flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100 mb-2 group-hover:scale-110 transition-transform">
                    <Award className="h-8 w-8 text-green-600" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-700 uppercase">{ub.badges?.name}</span>
                  
                  {/* Tooltip description */}
                  <div className="absolute -top-12 scale-0 group-hover:scale-100 bg-stone-900 text-white text-[10px] p-2 rounded shadow-xl transition-all w-32 z-10">
                    {ub.badges?.description}
                  </div>
                </div>
              ))}
              
              {badges.length === 0 && (
                <div className="col-span-2 py-4 text-stone-400 text-xs italic">
                  Continuez vos actions pour débloquer des badges !
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className="font-bold text-stone-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-green-600" /> Informations
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Rôle</label>
                <p className="text-stone-700 font-medium capitalize">{profile?.role}</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Membre depuis</label>
                <p className="text-stone-700 font-medium">
                  {new Date(profile?.updated_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Historique Observations */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-stone-900 mb-6 flex items-center">
            <Camera className="h-6 w-6 mr-3 text-green-600" /> Mes Signalements
          </h2>

          <div className="grid grid-cols-1 gap-4">
            {observations.map((obs) => (
              <div key={obs.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                    <img src={obs.image_url || 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=100&q=80'} className="w-full h-full object-cover" alt="Obs" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">{obs.species?.name || "Espèce inconnue"}</h4>
                    <p className="text-xs text-stone-500 line-clamp-1">{obs.description}</p>
                    <div className="flex items-center mt-1 text-[10px] font-bold uppercase tracking-wider">
                      {obs.is_verified ? (
                        <span className="text-green-600 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Validé</span>
                      ) : (
                        <span className="text-amber-500 flex items-center"><Clock className="h-3 w-3 mr-1" /> En attente</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-2 text-stone-300 group-hover:text-green-600 transition-colors">
                  <ArrowRight className="h-5 w-5" />
                </div>
              </div>
            ))}

            {observations.length === 0 && (
              <div className="text-center py-20 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                <Camera className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                <p className="text-stone-500 font-medium">Vous n'avez pas encore envoyé de signalement.</p>
                <button 
                  onClick={() => router.push('/signaler')}
                  className="mt-4 text-green-600 font-bold hover:underline"
                >
                  Commencer maintenant →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
