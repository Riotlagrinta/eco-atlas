'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2, Leaf, Film, Camera, Map as MapIcon, Newspaper, Save, Users, Target, Brain, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [formData, setFormData] = useState({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '', habitat: '', diet: '', population_estimate: '' });
  const [docData, setDocData] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '', category: 'Nature' });
  const [quizData, setQuizData] = useState({ title: '', description: '', difficulty: 'easy', image_url: '' });

  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [docList, setDocList] = useState<any[]>([]);
  const [obsList, setObsList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [quizList, setQuizList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'species' | 'docs' | 'obs' | 'users' | 'quizzes'>('species');

  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    const { data: species } = await supabase.from('species').select('*').order('created_at', { ascending: false });
    if (species) setSpeciesList(species);

    const { data: docs } = await supabase.from('documentaries').select('*').order('created_at', { ascending: false });
    if (docs) setDocList(docs);

    const { data: obs } = await supabase.from('observations').select('*, species:species_id(name), profiles:user_id(full_name)').eq('is_verified', false).order('created_at', { ascending: false });
    if (obs) setObsList(obs);

    const { data: users } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
    if (users) setUserList(users);

    const { data: qz } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
    if (qz) setQuizList(qz);
  };

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/connexion');
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `species/${Math.random()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('observations').upload(filePath, file);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('observations').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: publicUrl });
    }
    setUploading(false);
  };

  const handleSubmitSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('species').insert([formData]);
    if (!error) {
      setStatus({ type: 'success', msg: "Espèce ajoutée !" });
      setFormData({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '', habitat: '', diet: '', population_estimate: '' });
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteSpecies = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from('species').delete().eq('id', id);
    fetchData();
  };

  if (loading && !isAdmin) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg"><Shield className="h-8 w-8" /></div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Panel Administrateur</h1>
          <p className="text-stone-500 text-sm">Gestion globale d'Eco-Atlas Togo</p>
        </div>
        <Link href="/admin/carte" className="ml-auto bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-6 py-3 rounded-2xl flex items-center border border-stone-200"><MapIcon className="h-5 w-5 mr-2" /> SIG</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'species', label: 'Espèces', icon: Leaf },
          { id: 'docs', label: 'Docs', icon: Film },
          { id: 'obs', label: 'Signalements', icon: Camera, badge: obsList.length },
          { id: 'users', label: 'Membres', icon: Users },
          { id: 'quizzes', label: 'Quizz', icon: Brain }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center text-xs ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
            <tab.icon className="h-4 w-4 mr-2" /> {tab.label} {tab.badge ? <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'species' && (
        <div className="space-y-12">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
            <h2 className="text-xl font-bold mb-8 flex items-center"><Plus className="h-5 w-5 mr-2 text-green-600" /> Ajouter une espèce au Togo</h2>
            <form onSubmit={handleSubmitSpecies} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Nom commun" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Nom scientifique" value={formData.scientific_name} onChange={(e) => setFormData({...formData, scientific_name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <textarea placeholder="Description détaillée" rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none focus:ring-2 focus:ring-green-500"></textarea>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input type="text" placeholder="Habitat (ex: Fazao)" value={formData.habitat} onChange={(e) => setFormData({...formData, habitat: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl" />
                <input type="text" placeholder="Régime" value={formData.diet} onChange={(e) => setFormData({...formData, diet: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl" />
                <input type="text" placeholder="Population estimée" value={formData.population_estimate} onChange={(e) => setFormData({...formData, population_estimate: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select value={formData.conservation_status} onChange={(e) => setFormData({...formData, conservation_status: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none">
                  <option value="LC">Préoccupation mineure (LC)</option><option value="NT">Quasi menacé (NT)</option><option value="VU">Vulnérable (VU)</option><option value="EN">En danger (EN)</option><option value="CR">Danger critique (CR)</option>
                </select>
                <div className="relative">
                  <input type="file" id="file-up" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="file-up" className={`flex items-center justify-center w-full p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer font-bold ${formData.image_url ? 'border-green-500 bg-green-50 text-green-700' : 'border-stone-200 text-stone-400'}`}>
                    {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} {formData.image_url ? 'Photo chargée' : 'Photo de l\'espèce'}
                  </label>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg hover:bg-green-700 transition-all">Enregistrer l'espèce</button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-bold text-stone-900 mb-2">Liste des espèces</h3>
            {speciesList.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm group">
                <div className="flex items-center space-x-4">
                  <img src={s.image_url} className="w-12 h-12 rounded-xl object-cover" />
                  <h4 className="font-bold text-stone-900">{s.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowQR(`${window.location.origin}/observatoire?id=${s.id}`)}
                    className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <QrCode className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDeleteSpecies(s.id)} className="p-2 text-stone-300 hover:text-red-600 transition-all">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {showQR && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full">
                  <h3 className="font-bold text-stone-900 mb-6 uppercase tracking-widest text-xs">Outil de Sensibilisation</h3>
                  <div className="bg-white p-4 border-2 border-stone-50 rounded-2xl inline-block mb-6 shadow-inner">
                    <QRCodeSVG value={showQR} size={200} />
                  </div>
                  <p className="text-[10px] text-stone-400 mb-8 leading-relaxed italic">Imprimez ce code QR et placez-le sur les panneaux d'information des parcs nationaux du Togo.</p>
                  <div className="flex gap-4">
                    <button onClick={() => window.print()} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl">Imprimer</button>
                    <button onClick={() => setShowQR(null)} className="flex-1 bg-stone-100 text-stone-600 font-bold py-3 rounded-xl">Fermer</button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Onglet Membres */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-stone-900 flex items-center"><Users className="h-5 w-5 mr-2 text-green-600" /> Gestion des éco-citoyens</h2>
          <div className="grid grid-cols-1 gap-4">
            {userList.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center font-bold text-green-600">{u.full_name?.charAt(0) || 'U'}</div>
                  <div>
                    <h3 className="font-bold text-stone-900">{u.full_name || 'Utilisateur'}</h3>
                    <p className="text-xs text-stone-400 font-medium uppercase">{u.role}</p>
                  </div>
                </div>
                <select value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value)} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                  <option value="user">Utilisateur</option><option value="expert">Expert</option><option value="admin">Administrateur</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}