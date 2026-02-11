'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2, Leaf, Film, Camera, Map as MapIcon, Newspaper, Save, Users, Target, Brain, QrCode, BarChart3, Activity, Edit3 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [formData, setFormData] = useState({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '', habitat: '', diet: '', population_estimate: '', category: 'Fauna' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [obsList, setObsList] = useState<any[]>([]);
  const [allObsList, setAllObsList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'species' | 'obs' | 'users' | 'insights'>('species');

  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    const { data: species } = await supabase.from('species').select('*').order('created_at', { ascending: false });
    if (species) setSpeciesList(species);

    const { data: obs } = await supabase.from('observations').select('*, species:species_id(name), profiles:user_id(full_name, region)').order('created_at', { ascending: false });
    if (obs) {
      setAllObsList(obs);
      setObsList(obs.filter((o: any) => !o.is_verified));
      
      const regionData: any = {};
      obs.forEach((o: any) => {
        const reg = o.profiles?.region || 'Inconnue';
        regionData[reg] = (regionData[reg] || 0) + 1;
      });
      setAdminStats({
        byRegion: Object.keys(regionData).map(k => ({ name: k, count: regionData[k] })),
        totalAlerts: obs.filter((o: any) => o.type === 'alert').length,
        resolvedAlerts: obs.filter((o: any) => o.is_resolved).length
      });
    }

    const { data: users } = await supabase.from('profiles').select('*').order('updated_at', { ascending: false });
    if (users) setUserList(users);
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

  const handleEditSpecies = (s: any) => {
    setEditingId(s.id);
    setFormData({
      name: s.name,
      scientific_name: s.scientific_name || '',
      description: s.description || '',
      conservation_status: s.conservation_status || 'LC',
      image_url: s.image_url || '',
      habitat: s.habitat || '',
      diet: s.diet || '',
      population_estimate: s.population_estimate || '',
      category: s.category || 'Fauna'
    });
    setActiveTab('species');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = editingId 
      ? await supabase.from('species').update(formData).eq('id', editingId)
      : await supabase.from('species').insert([formData]);

    if (!error) {
      setStatus({ type: 'success', msg: editingId ? "Mis à jour !" : "Ajouté !" });
      setFormData({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '', habitat: '', diet: '', population_estimate: '', category: 'Fauna' });
      setEditingId(null);
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteSpecies = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from('species').delete().eq('id', id);
    fetchData();
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchData();
  };

  const handleToggleResolve = async (id: string, current: boolean) => {
    await supabase.from('observations').update({ is_resolved: !current }).eq('id', id);
    fetchData();
  };

  const handleVerifyObs = async (id: string) => {
    await supabase.from('observations').update({ is_verified: true }).eq('id', id);
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const filePath = `species/${Math.random()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('observations').upload(filePath, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('observations').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: publicUrl });
    }
    setUploading(false);
  };

  if (loading && !isAdmin) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg"><Shield className="h-8 w-8" /></div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-stone-900">Panel Administrateur</h1>
          <p className="text-stone-500 text-sm">Gestion du patrimoine naturel du Togo</p>
        </div>
        <Link href="/admin/carte" className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-6 py-3 rounded-2xl flex items-center border border-stone-200 transition-all">
          <MapIcon className="h-5 w-5 mr-2" /> SIG
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'species', label: 'Espèces', icon: Leaf },
          { id: 'obs', label: 'Modération', icon: Camera, badge: obsList.length },
          { id: 'users', label: 'Membres', icon: Users },
          { id: 'insights', label: 'Insights', icon: BarChart3 }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center text-xs ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-stone-500 border border-stone-200'}`}>
            <tab.icon className="h-4 w-4 mr-2" /> {tab.label} {tab.badge ? <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'species' && (
        <div className="space-y-12">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
            <h2 className="text-xl font-bold mb-8 flex items-center">{editingId ? <Edit3 className="mr-2 text-blue-600" /> : <Plus className="mr-2 text-green-600" />} {editingId ? "Modifier l'espèce" : "Ajouter une espèce"}</h2>
            <form onSubmit={handleSubmitSpecies} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Nom" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-transparent focus:border-green-500" />
                <input type="text" placeholder="Nom scientifique" value={formData.scientific_name} onChange={(e) => setFormData({...formData, scientific_name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none" />
              </div>
              <textarea placeholder="Description" rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none"></textarea>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value as any})} className="w-full p-4 bg-stone-50 rounded-2xl">
                  <option value="Fauna">Faune (Animaux)</option>
                  <option value="Flora">Flore (Plantes)</option>
                </select>
                <div className="relative">
                  <input type="file" id="up" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="up" className="flex items-center justify-center w-full p-4 rounded-2xl border-2 border-dashed cursor-pointer font-bold bg-stone-50 text-stone-400">
                    {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} Photo
                  </label>
                </div>
              </div>
              <button type="submit" className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg ${editingId ? 'bg-blue-600' : 'bg-green-600'}`}>{editingId ? "Enregistrer les modifications" : "Publier l'espèce"}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({name:'', scientific_name:'', description:'', conservation_status:'LC', image_url:'', habitat:'', diet:'', population_estimate:'', category:'Fauna'}); }} className="w-full text-stone-400 font-bold text-sm">Annuler</button>}
            </form>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {speciesList.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                  <img src={s.image_url} className="w-12 h-12 rounded-xl object-cover" />
                  <div><h4 className="font-bold">{s.name}</h4><span className="text-[10px] uppercase font-bold text-stone-400">{s.category}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowQR(`${window.location.origin}/observatoire?id=${s.id}`)} className="p-2 text-stone-400 hover:text-blue-600"><QrCode className="h-5 w-5" /></button>
                  <button onClick={() => handleEditSpecies(s)} className="p-2 text-stone-400 hover:text-green-600"><Edit3 className="h-5 w-5" /></button>
                  <button onClick={() => handleDeleteSpecies(s.id)} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-6 flex items-center"><MapIcon className="h-5 w-5 mr-2 text-green-600" /> Répartition Régionale</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats?.byRegion}><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]}/></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-center text-center">
              <h3 className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mb-4">Alertes résolues</h3>
              <span className="text-6xl font-bold mb-2 text-green-400">{adminStats?.resolvedAlerts} / {adminStats?.totalAlerts}</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
            {allObsList.filter(o => o.type === 'alert').map(alert => (
              <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-all">
                <div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${alert.is_resolved ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div><div><p className="font-bold text-stone-900 text-sm">{alert.description}</p><p className="text-[10px] text-stone-400 uppercase font-bold">{alert.profiles?.region}</p></div></div>
                <button onClick={() => handleToggleResolve(alert.id, alert.is_resolved)} className={`px-4 py-2 rounded-xl text-[10px] font-bold ${alert.is_resolved ? 'bg-green-50 text-green-600' : 'bg-stone-900 text-white'}`}>{alert.is_resolved ? 'RÉSOLU' : 'RÉSOUDRE'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'obs' && (
        <div className="grid grid-cols-1 gap-6">
          {obsList.map(o => (
            <div key={o.id} className="bg-white rounded-3xl border border-stone-100 overflow-hidden flex flex-col md:flex-row shadow-sm">
              <img src={o.image_url} className="w-full md:w-48 h-48 object-cover" />
              <div className="p-6 flex-1">
                <h3 className="font-bold text-stone-900">{o.species?.name || "Inconnu"} <span className="text-xs font-normal text-stone-400 ml-2">par {o.profiles?.full_name}</span></h3>
                <p className="text-stone-500 text-sm mt-2 mb-6 line-clamp-2">{o.description}</p>
                <div className="flex gap-3"><button onClick={() => handleVerifyObs(o.id)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl">Valider</button><button onClick={() => handleDeleteObs(o.id)} className="flex-1 border border-red-100 text-red-600 font-bold py-2 rounded-xl">Rejeter</button></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-4">
          {userList.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between shadow-sm">
              <h3 className="font-bold">{u.full_name || 'Utilisateur'} <span className="text-xs font-normal text-stone-400 ml-2">({u.role})</span></h3>
              <select value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value)} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs font-bold"><option value="user">Utilisateur</option><option value="expert">Expert</option><option value="admin">Administrateur</option></select>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full">
              <h3 className="font-bold text-stone-900 mb-6 uppercase tracking-widest text-xs">Outil de Sensibilisation</h3>
              <div className="bg-white p-4 border-2 border-stone-50 rounded-2xl inline-block mb-6 shadow-inner"><QRCodeSVG value={showQR} size={200} /></div>
              <p className="text-[10px] text-stone-400 mb-8 italic">Imprimez ce code QR pour les parcs nationaux du Togo.</p>
              <div className="flex gap-4"><button onClick={() => window.print()} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl">Imprimer</button><button onClick={() => setShowQR(null)} className="flex-1 bg-stone-100 text-stone-600 font-bold py-3 rounded-xl">Fermer</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
