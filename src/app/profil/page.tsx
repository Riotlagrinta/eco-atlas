'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User, Camera, CheckCircle, Clock, Award, Loader2, ArrowRight, MapPin, Settings, Upload, Save, X, Heart, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'obs' | 'favs'>('obs');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/connexion');
      return;
    }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profileData);
    setNewName(profileData?.full_name || '');

    const { data: obsData } = await supabase.from('observations').select('*, species:species_id(name)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (obsData) setObservations(obsData);

    const { data: badgeData } = await supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id);
    if (badgeData) setBadges(badgeData);

    const { data: favData } = await supabase.from('favorites').select('*, species(*)').eq('user_id', user.id);
    if (favData) setFavorites(favData);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [router, supabase]);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    const { error } = await supabase.from('profiles').update({ full_name: newName }).eq('id', profile.id);
    if (!error) {
      setIsEditing(false);
      fetchData();
    }
    setUpdating(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpdating(true);
    const filePath = `avatars/${profile.id}-${Math.random()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('observations').upload(filePath, file);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('observations').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      fetchData();
    }
    setUpdating(false);
  };

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
            <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-xl relative group">
              <div className="w-full h-full bg-stone-100 rounded-2xl flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <User className="h-12 w-12 text-stone-300" />
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                <Upload className="text-white h-6 w-6" />
                <input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
              </label>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)}
                    className="text-2xl font-bold text-stone-900 border-b-2 border-green-500 bg-transparent outline-none py-1"
                  />
                  <button onClick={handleUpdateProfile} disabled={updating} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all">
                    {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-stone-900">{profile?.full_name || "Éco-citoyen"}</h1>
                  <button onClick={() => setIsEditing(true)} className="p-2 text-stone-400 hover:text-green-600 transition-all">
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              )}
              <p className="text-stone-500 flex items-center mt-1 text-sm">
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
                </div>
              ))}
              {badges.length === 0 && <div className="col-span-2 py-4 text-stone-400 text-xs italic">Continuez vos actions pour débloquer des badges !</div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex p-1 bg-stone-100 rounded-2xl mb-8 w-fit">
            <button 
              onClick={() => setActiveTab('obs')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center ${activeTab === 'obs' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-500'}`}
            >
              <Camera className="h-4 w-4 mr-2" /> Signalements
            </button>
            <button 
              onClick={() => setActiveTab('favs')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center ${activeTab === 'favs' ? 'bg-white text-red-600 shadow-sm' : 'text-stone-500'}`}
            >
              <Heart className="h-4 w-4 mr-2" /> Ma Nature
            </button>
          </div>

          {activeTab === 'obs' ? (
            <div className="grid grid-cols-1 gap-4">
              {observations.map((obs) => (
                <div key={obs.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                      <img src={obs.image_url} className="w-full h-full object-cover" alt="Obs" />
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{obs.species?.name || "Espèce inconnue"}</h4>
                      <div className="flex items-center mt-1 text-[10px] font-bold uppercase tracking-wider">
                        {obs.is_verified ? <span className="text-green-600 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Validé</span> : <span className="text-amber-500 flex items-center"><Clock className="h-3 w-3 mr-1" /> En attente</span>}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-stone-300 group-hover:text-green-600 transition-colors" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {favorites.map((fav) => (
                <div key={fav.id} className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="relative h-40 bg-stone-100">
                    <img src={fav.species?.image_url} className="w-full h-full object-cover" alt="Fav" />
                    <div className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500">
                      <Heart className="h-4 w-4 fill-current" />
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-stone-900">{fav.species?.name}</h4>
                    <p className="text-xs text-stone-500 italic mb-3">{fav.species?.scientific_name}</p>
                    <button onClick={() => router.push('/observatoire')} className="text-[10px] font-bold text-green-600 uppercase tracking-widest hover:underline">Voir la fiche</button>
                  </div>
                </div>
              ))}
              {favorites.length === 0 && (
                <div className="col-span-full text-center py-20 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                  <Heart className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                  <p className="text-stone-500 font-medium">Vous n'avez pas encore d'espèces favorites.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
