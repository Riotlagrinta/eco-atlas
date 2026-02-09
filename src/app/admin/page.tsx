'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2, Leaf, Film, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    description: '',
    conservation_status: 'LC',
    image_url: ''
  });
  const [docData, setDocData] = useState({
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: '',
    category: 'Nature'
  });
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [docList, setDocList] = useState<any[]>([]);
  const [obsList, setObsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'species' | 'docs' | 'obs'>('species');

  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    const { data: species } = await supabase
      .from('species')
      .select('*')
      .order('created_at', { ascending: false });
    if (species) setSpeciesList(species);

    const { data: docs } = await supabase
      .from('documentaries')
      .select('*')
      .order('created_at', { ascending: false });
    if (docs) setDocList(docs);

    const { data: obs } = await supabase
      .from('observations')
      .select('*, species:species_id(name), profiles:user_id(full_name)')
      .eq('is_verified', false)
      .order('created_at', { ascending: false });
    if (obs) setObsList(obs);
  };

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/connexion');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
      } else {
        setIsAdmin(true);
        fetchData();
      }
      setLoading(false);
    }
    checkAdmin();
  }, [router, supabase]);

  const handleDeleteSpecies = async (id: string) => {
    if (!confirm("Supprimer cette espèce ?")) return;
    const { error } = await supabase.from('species').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Supprimer ce documentaire ?")) return;
    const { error } = await supabase.from('documentaries').delete().eq('id', id);
    if (!error) fetchData();
  };

  const handleVerifyObs = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('observations')
      .update({ is_verified: true })
      .eq('id', id);
    if (!error) {
      setStatus({ type: 'success', msg: "Signalement validé et ajouté à la carte !" });
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteObs = async (id: string) => {
    if (!confirm("Rejeter et supprimer ce signalement ?")) return;
    setLoading(true);
    const { error } = await supabase.from('observations').delete().eq('id', id);
    if (!error) {
      setStatus({ type: 'success', msg: "Signalement supprimé." });
      fetchData();
    }
    setLoading(false);
  };

  const handleSubmitSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('species').insert([formData]);
    if (!error) {
      setStatus({ type: 'success', msg: "Espèce ajoutée !" });
      setFormData({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '' });
      fetchData();
    }
    setLoading(false);
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('documentaries').insert([docData]);
    if (!error) {
      setStatus({ type: 'success', msg: "Documentaire ajouté !" });
      setDocData({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '', category: 'Nature' });
      fetchData();
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `species/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('observations')
      .upload(filePath, file);

    if (uploadError) {
      setStatus({ type: 'error', msg: "Erreur d'upload : " + uploadError.message });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('observations')
      .getPublicUrl(filePath);

    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('species')
      .insert([formData]);

    if (error) {
      setStatus({ type: 'error', msg: error.message });
    } else {
      setStatus({ type: 'success', msg: "Espèce ajoutée avec succès au patrimoine togolais !" });
      setFormData({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '' });
      fetchData();
    }
    setLoading(false);
  };

  if (loading && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg">
          <Shield className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Panel Administrateur</h1>
          <p className="text-stone-500">Gestion de la biodiversité du Togo</p>
        </div>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-4 rounded-2xl flex items-center ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}
        >
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
          <span className="font-medium">{status.msg}</span>
        </motion.div>
      )}

      <div className="flex space-x-4 mb-8">
        <button 
          onClick={() => setActiveTab('species')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'species' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-stone-600 border border-stone-200'}`}
        >
          Espèces
        </button>
        <button 
          onClick={() => setActiveTab('docs')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'docs' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-stone-600 border border-stone-200'}`}
        >
          Documentaires
        </button>
        <button 
          onClick={() => setActiveTab('obs')}
          className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'obs' ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-stone-600 border border-stone-200'}`}
        >
          Signalements {obsList.length > 0 && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{obsList.length}</span>}
        </button>
      </div>

      {activeTab === 'species' ? (
        <>
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
            <h2 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-600" /> Ajouter une nouvelle espèce
            </h2>

            <form onSubmit={handleSubmitSpecies} className="space-y-6">
              {/* Formulaire espèce existant */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Nom commun</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Nom scientifique</label>
                  <input
                    type="text"
                    value={formData.scientific_name}
                    onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Description locale</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Statut de conservation</label>
                  <select
                    value={formData.conservation_status}
                    onChange={(e) => setFormData({ ...formData, conservation_status: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  >
                    <option value="LC">Préoccupation mineure (LC)</option>
                    <option value="NT">Quasi menacé (NT)</option>
                    <option value="VU">Vulnérable (VU)</option>
                    <option value="EN">En danger (EN)</option>
                    <option value="CR">Danger critique (CR)</option>
                  </select>
                </div>

                <div className="relative">
                  <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  <label htmlFor="file-upload" className={`flex items-center justify-center w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${formData.image_url ? 'border-green-500 bg-green-50 text-green-700' : 'border-stone-200 text-stone-500'}`}>
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Upload className="h-5 w-5 mr-2" />}
                    {formData.image_url ? 'Photo chargée' : 'Charger une photo'}
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loading || uploading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg">
                Enregistrer l'espèce
              </button>
            </form>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
              <Leaf className="h-5 w-5 mr-2 text-green-600" /> Espèces enregistrées
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {speciesList.map((s) => (
                <div key={s.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={s.image_url} className="w-12 h-12 rounded-xl object-cover" />
                    <h3 className="font-bold">{s.name}</h3>
                  </div>
                  <button onClick={() => handleDeleteSpecies(s.id)} className="p-2 text-stone-300 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : activeTab === 'docs' ? (
        <>
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
            <h2 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
              <Plus className="h-5 w-5 mr-2 text-green-600" /> Ajouter un documentaire
            </h2>
            {/* ... reste du formulaire doc ... */}
            <form onSubmit={handleSubmitDoc} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Titre du film</label>
                  <input
                    type="text"
                    required
                    value={docData.title}
                    onChange={(e) => setDocData({ ...docData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Durée (ex: 12:45)</label>
                  <input
                    type="text"
                    required
                    value={docData.duration}
                    onChange={(e) => setDocData({ ...docData, duration: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Lien YouTube (Embed)</label>
                  <input
                    type="text"
                    required
                    value={docData.video_url}
                    onChange={(e) => setDocData({ ...docData, video_url: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="https://www.youtube.com/embed/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Image de couverture (URL)</label>
                  <input
                    type="text"
                    required
                    value={docData.thumbnail_url}
                    onChange={(e) => setDocData({ ...docData, thumbnail_url: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Description</label>
                <textarea
                  required
                  rows={3}
                  value={docData.description}
                  onChange={(e) => setDocData({ ...docData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 resize-none"
                ></textarea>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl shadow-lg">
                Publier le documentaire
              </button>
            </form>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
              <Film className="h-5 w-5 mr-2 text-green-600" /> Vidéos publiées
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {docList.map((d) => (
                <div key={d.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={d.thumbnail_url} className="w-16 h-10 rounded-lg object-cover" />
                    <h3 className="font-bold">{d.title}</h3>
                  </div>
                  <button onClick={() => handleDeleteDoc(d.id)} className="p-2 text-stone-300 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
            <Camera className="h-5 w-5 mr-2 text-green-600" /> Signalements en attente de validation
          </h2>
          
          <div className="grid grid-cols-1 gap-6">
            {obsList.map((o) => (
              <div key={o.id} className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="w-full md:w-64 h-48 md:h-auto">
                  <img src={o.image_url} className="w-full h-full object-cover" alt="Signalement" />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg text-stone-900">
                        {o.species?.name || "Espèce inconnue"}
                      </h3>
                      <span className="text-[10px] bg-stone-100 px-2 py-1 rounded-full font-bold text-stone-500">
                        PAR: {o.profiles?.full_name || "Utilisateur"}
                      </span>
                    </div>
                    <p className="text-stone-600 text-sm mb-4">{o.description}</p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleVerifyObs(o.id)}
                      className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl hover:bg-green-700 transition-all flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" /> Valider
                    </button>
                    <button 
                      onClick={() => handleDeleteObs(o.id)}
                      className="flex-1 bg-white text-red-600 border border-red-100 font-bold py-2 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Rejeter
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {obsList.length === 0 && (
              <div className="text-center py-24 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                <p className="text-stone-500 font-medium">Aucun signalement en attente. Beau travail !</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
