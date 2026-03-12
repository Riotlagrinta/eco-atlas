'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Camera, CheckCircle, Clock, Award, Loader2, ArrowRight, MapPin, Settings, Upload, Save, X, Heart, RefreshCw, Zap, Flame, Target } from 'lucide-react';
import { db } from '@/lib/offline-db';
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';
import { XPBar } from '@/components/XPBar';
import Link from 'next/link';
import { updateProfile, createObservation } from '@/lib/actions';

interface ProfileClientProps {
  initialData: any;
}

export default function ProfileClient({ initialData }: ProfileClientProps) {
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState(initialData.profile);
  const [observations, setObservations] = useState(initialData.profile.observations || []);
  const [badges] = useState(initialData.badges || []);
  const [favorites] = useState(initialData.profile.favorites || []);
  const [offlineReports, setOfflineReports] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'obs' | 'favs' | 'sync'>('obs');
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(profile?.name || '');
  const [newRegion, setNewRegion] = useState(profile?.region || '');

  const regions = ['Maritime', 'Plateaux', 'Centrale', 'Kara', 'Savanes'];
  const router = useRouter();

  useEffect(() => {
    const fetchOffline = async () => {
      const offData = await db.reports.toArray();
      setOfflineReports(offData);
    };
    fetchOffline();
  }, []);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    const result = await updateProfile({ name: newName, region: newRegion });
    if (result.success) {
      setIsEditing(false);
      setProfile({ ...profile, name: newName, region: newRegion });
      toast.success("Profil mis à jour !");
      router.refresh();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
    setUpdating(false);
  };

  const syncReports = async () => {
    if (offlineReports.length === 0) return;
    setUpdating(true);

    for (const report of offlineReports) {
      const result = await createObservation({
        speciesId: report.species_id,
        description: report.description,
        imageUrl: report.image_url,
        location: report.location,
        type: report.type,
        alertLevel: report.alert_level,
        isVerified: report.type === 'alert'
      });

      if (result.success) {
        await db.reports.delete(report.id!);
      }
    }
    
    // Refresh offline reports
    const offData = await db.reports.toArray();
    setOfflineReports(offData);
    setUpdating(false);
    toast.success("Synchronisation terminée !");
    router.refresh();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUpdating(true);
    // Note: Avatar upload usually needs a storage service. 
    // Assuming you have a way to handle it, but I'll skip the actual upload logic 
    // and just show how to call updateProfile.
    toast.error("L'upload d'avatar n'est pas encore migré.");
    setUpdating(false);
  };

  const verifiedCount = observations.filter((o: any) => o.isVerified).length;
  const rank = profile.level?.rank || (verifiedCount >= 10 ? 'Expert de la Nature' : verifiedCount >= 3 ? 'Sentinelle' : 'Éco-citoyen');

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Toaster position="bottom-center" />
      {/* Header Profil */}
      <div className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden mb-12">
        <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-500"></div>
        <div className="px-8 pb-8">
          <div className="relative flex flex-col md:flex-row md:items-end -mt-12 mb-6 gap-6">
            <div className="w-32 h-32 bg-white rounded-3xl p-1 shadow-xl relative group">
              <div className="w-full h-full bg-stone-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                {profile?.image ? <Image src={profile.image} className="object-cover" alt="Avatar" fill /> : <User className="h-12 w-12 text-stone-300" />}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                <Upload className="text-white h-6 w-6" /><input type="file" className="hidden" onChange={handleAvatarUpload} accept="image/*" />
              </label>
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="text-2xl font-bold text-stone-900 border-b-2 border-green-500 bg-transparent outline-none py-1" />
                    <button onClick={handleUpdateProfile} disabled={updating} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-all">
                      {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-all">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <select value={newRegion} onChange={(e) => setNewRegion(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-1 text-xs font-bold text-stone-600 outline-none w-fit">
                    <option value="">Choisir ma région...</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-stone-900">{profile?.name || "Éco-citoyen"}</h1>
                    <button onClick={() => setIsEditing(true)} className="p-2 text-stone-400 hover:text-green-600 transition-all">
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                  {profile?.region && <p className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center"><MapPin className="h-3 w-3 mr-1" /> Région {profile.region}</p>}
                </div>
              )}
              <p className="text-stone-500 flex items-center mt-1 text-sm"><Award className="h-4 w-4 mr-2 text-green-600" /> {rank} du Togo</p>
            </div>
            <div className="flex gap-4">
              <div className="text-center px-6 py-2 bg-stone-50 rounded-2xl border border-stone-100"><span className="block text-xl font-bold text-stone-900">{observations.length}</span><span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Signalements</span></div>
              <div className="text-center px-6 py-2 bg-green-50 rounded-2xl border border-green-100"><span className="block text-xl font-bold text-green-600">{verifiedCount}</span><span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Validés</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre XP Gamification */}
      {profile.level && (
        <div className="mb-8">
          <XPBar xp={profile.level.xp} level={profile.level.level} />
          <div className="flex gap-3 mt-4">
            <Link href="/classement" className="flex-1 flex items-center justify-center gap-2 py-3 bg-yellow-50 text-yellow-700 font-bold text-sm rounded-2xl border border-yellow-200 hover:shadow-md transition-all">
              <Award className="h-4 w-4" /> Classement
            </Link>
            <Link href="/defis" className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-700 font-bold text-sm rounded-2xl border border-purple-200 hover:shadow-md transition-all">
              <Target className="h-4 w-4" /> Mes Défis
            </Link>
            {profile.level.streakDays >= 2 && (
              <div className="flex items-center gap-2 py-3 px-4 bg-orange-50 text-orange-600 font-bold text-sm rounded-2xl border border-orange-200">
                <Flame className="h-4 w-4" /> {profile.level.streakDays}j
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm text-center">
            <h3 className="font-bold text-stone-900 mb-6 flex items-center justify-center"><Award className="h-5 w-5 mr-2 text-green-600" /> Mes Trophées</h3>
            <div className="grid grid-cols-2 gap-4">
              {badges.map((b: any) => (
                <div key={b.id} className="group relative flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100 mb-2 group-hover:scale-110 transition-transform">
                    <Award className="h-8 w-8 text-green-600" />
                  </div>
                  <span className="text-[10px] font-bold text-stone-700 uppercase">{b.name}</span>
                </div>
              ))}
              {badges.length === 0 && <div className="col-span-2 py-4 text-stone-400 text-xs italic">Continuez vos actions pour débloquer des badges !</div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex p-1 bg-stone-100 rounded-2xl mb-8 w-fit">
            <button onClick={() => setActiveTab('obs')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center ${activeTab === 'obs' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-500'}`}><Camera className="h-4 w-4 mr-2" /> Signalements</button>
            <button onClick={() => setActiveTab('favs')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center ${activeTab === 'favs' ? 'bg-white text-red-600 shadow-sm' : 'text-stone-500'}`}><Heart className="h-4 w-4 mr-2" /> Ma Nature</button>
            <button onClick={() => setActiveTab('sync')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center relative ${activeTab === 'sync' ? 'bg-white text-blue-600 shadow-sm' : 'text-stone-500'}`}><RefreshCw className="h-4 w-4 mr-2" /> Synchro {offlineReports.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center animate-bounce">{offlineReports.length}</span>}</button>
          </div>

          {activeTab === 'obs' && (
            <div className="grid grid-cols-1 gap-4">
              {observations.map((obs: any) => (
                <div key={obs.id} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 relative">
                      {obs.imageUrl && <Image src={obs.imageUrl} className="object-cover" alt="Observation" fill />}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900">{obs.species?.name || "Espèce inconnue"}</h4>
                      <div className="flex items-center mt-1 text-[10px] font-bold uppercase tracking-wider">
                        {obs.isVerified ? <span className="text-green-600 flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Validé</span> : <span className="text-amber-500 flex items-center"><Clock className="h-3 w-3 mr-1" /> En attente</span>}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-stone-300 group-hover:text-green-600 transition-colors" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'favs' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {favorites.map((fav: any) => (
                <div key={fav.id} className="bg-white rounded-3xl border border-stone-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="relative h-40 bg-stone-100">
                    {fav.species?.imageUrl && <Image src={fav.species.imageUrl} className="object-cover" alt="Espèce" fill />}
                    <div className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full text-red-500 z-10"><Heart className="h-4 w-4 fill-current" /></div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-stone-900">{fav.species?.name}</h4>
                    <p className="text-xs text-stone-500 italic mb-3">{fav.species?.scientificName}</p>
                    <button onClick={() => router.push(`/observatoire/${fav.species?.id}`)} className="text-[10px] font-bold text-green-600 uppercase tracking-widest hover:underline">Voir la fiche</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm text-center">
              <RefreshCw className={`h-12 w-12 text-blue-500 mx-auto mb-4 ${updating ? 'animate-spin' : ''}`} />
              <h3 className="text-xl font-bold text-stone-900 mb-2">Gestion de la Synchronisation</h3>
              <p className="text-stone-500 text-sm mb-8">Vous avez {offlineReports.length} signalements enregistrés localement sur votre appareil.</p>
              {offlineReports.length > 0 ? (
                <button
                  onClick={syncReports}
                  disabled={updating}
                  className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />} Envoyer les données au serveur
                </button>
              ) : (
                <div className="py-10 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 font-medium italic">Toutes vos données sont à jour.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
