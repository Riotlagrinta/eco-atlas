'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2, Leaf, Film, Camera, Map as MapIcon, Newspaper, Save, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [formData, setFormData] = useState({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '' });
  const [docData, setDocData] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '', category: 'Nature' });
  const [articleData, setArticleData] = useState({ title: '', content: '', image_url: '', category: 'Actualité' });

  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [docList, setDocList] = useState<any[]>([]);
  const [obsList, setObsList] = useState<any[]>([]);
  const [articleList, setArticleList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'species' | 'docs' | 'obs' | 'blog' | 'users'>('species');

  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    const { data: species } = await supabase.from('species').select('*').order('created_at', { ascending: false });
    if (species) setSpeciesList(species);

    const { data: docs } = await supabase.from('documentaries').select('*').order('created_at', { ascending: false });
    if (docs) setDocList(docs);

    const { data: obs } = await supabase.from('observations').select('*, species:species_id(name), profiles:user_id(full_name)').eq('is_verified', false).order('created_at', { ascending: false });
    if (obs) setObsList(obs);

    const { data: arts } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    if (arts) setArticleList(arts);

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

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setStatus({ type: 'success', msg: "Rôle mis à jour !" });
      fetchData();
    }
  };

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
    const { error } = await supabase.from('observations').update({ is_verified: true }).eq('id', id);
    if (!error) {
      setStatus({ type: 'success', msg: "Signalement validé !" });
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteObs = async (id: string) => {
    if (!confirm("Rejeter ce signalement ?")) return;
    const { error } = await supabase.from('observations').delete().eq('id', id);
    if (!error) fetchData();
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

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('articles').insert([articleData]);
    if (!error) {
      setStatus({ type: 'success', msg: "Article publié !" });
      setArticleData({ title: '', content: '', image_url: '', category: 'Actualité' });
      fetchData();
    }
    setLoading(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Supprimer cet article ?")) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) fetchData();
  };

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

  const exportToCSV = () => {
    const headers = ["ID", "Species", "Description", "Created At"];
    const rows = obsList.map(o => [o.id, o.species?.name || "Unknown", o.description, o.created_at]);
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "export_ecoatlas.csv");
    document.body.appendChild(link);
    link.click();
  };

  if (loading && !isAdmin) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg"><Shield className="h-8 w-8" /></div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Panel Administrateur</h1>
          <p className="text-stone-500 text-sm">Gestion de la biodiversité du Togo</p>
        </div>
        <Link href="/admin/carte" className="ml-auto bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-6 py-3 rounded-2xl flex items-center border border-stone-200"><MapIcon className="h-5 w-5 mr-2" /> Éditeur SIG</Link>
      </div>

      {status && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mb-8 p-4 rounded-2xl flex items-center ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
          <span className="font-medium">{status.msg}</span>
        </motion.div>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'species', label: 'Espèces', icon: Leaf },
          { id: 'docs', label: 'Documentaires', icon: Film },
          { id: 'obs', label: 'Signalements', icon: Camera, badge: obsList.length },
          { id: 'blog', label: 'Actualités', icon: Newspaper },
          { id: 'users', label: 'Membres', icon: Users }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
            <tab.icon className="h-4 w-4 mr-2" /> {tab.label} {tab.badge ? <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'species' && (
        <>
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 mb-12">
            <h2 className="text-xl font-bold text-stone-900 mb-8 flex items-center"><Plus className="h-5 w-5 mr-2 text-green-600" /> Nouvelle Espèce</h2>
            <form onSubmit={handleSubmitSpecies} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Nom commun" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
                <input type="text" placeholder="Nom scientifique" value={formData.scientific_name} onChange={(e) => setFormData({...formData, scientific_name: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <textarea placeholder="Description" rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500"></textarea>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select value={formData.conservation_status} onChange={(e) => setFormData({...formData, conservation_status: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none">
                  <option value="LC">Préoccupation mineure (LC)</option><option value="NT">Quasi menacé (NT)</option><option value="VU">Vulnérable (VU)</option><option value="EN">En danger (EN)</option><option value="CR">Danger critique (CR)</option>
                </select>
                <div className="relative">
                  <input type="file" id="file-up" className="hidden" onChange={handleFileUpload} />
                  <label htmlFor="file-up" className="flex items-center justify-center w-full px-4 py-3 bg-stone-50 border-2 border-dashed border-stone-200 rounded-xl cursor-pointer hover:border-green-500 transition-all text-stone-500 text-sm font-bold">
                    {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} {formData.image_url ? 'Photo OK' : 'Photo'}
                  </label>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-all">Enregistrer l'espèce</button>
            </form>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {speciesList.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4"><img src={s.image_url} className="w-12 h-12 rounded-xl object-cover" /><h3 className="font-bold">{s.name}</h3></div>
                <button onClick={() => handleDeleteSpecies(s.id)} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-stone-900 flex items-center"><Users className="h-5 w-5 mr-2 text-green-600" /> Membres de la communauté</h2>
          <div className="grid grid-cols-1 gap-4">
            {userList.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center font-bold text-green-600">{u.full_name?.charAt(0) || 'U'}</div>
                  <div>
                    <h3 className="font-bold text-stone-900">{u.full_name || 'Utilisateur anonyme'}</h3>
                    <p className="text-xs text-stone-400 font-medium uppercase tracking-widest">{u.role}</p>
                  </div>
                </div>
                <select 
                  value={u.role} 
                  onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="user">Utilisateur</option>
                  <option value="expert">Expert</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reste des onglets (docs, obs, blog) conservés à l'identique */}
      {activeTab === 'docs' && (
        <>
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 mb-12">
            <h2 className="text-xl font-bold text-stone-900 mb-8 flex items-center"><Plus className="h-5 w-5 mr-2 text-green-600" /> Nouveau Documentaire</h2>
            <form onSubmit={handleSubmitDoc} className="space-y-6">
              <input type="text" placeholder="Titre" value={docData.title} onChange={(e) => setDocData({...docData, title: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl" />
              <input type="text" placeholder="Lien YouTube" value={docData.video_url} onChange={(e) => setDocData({...docData, video_url: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl" />
              <button type="submit" className="w-full bg-stone-900 text-white font-bold py-4 rounded-xl">Publier</button>
            </form>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {docList.map(d => (
              <div key={d.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <h3 className="font-bold">{d.title}</h3>
                <button onClick={() => handleDeleteDoc(d.id)} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'obs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-stone-900 flex items-center"><Camera className="h-5 w-5 mr-2 text-green-600" /> Signalements citoyens</h2>
            <button onClick={exportToCSV} className="text-xs font-bold bg-white border border-stone-200 px-4 py-2 rounded-xl flex items-center hover:bg-stone-50"><Save className="h-3 w-3 mr-2" /> Exporter CSV</button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {obsList.map(o => (
              <div key={o.id} className="bg-white rounded-3xl border border-stone-100 overflow-hidden flex flex-col md:flex-row shadow-sm">
                <img src={o.image_url} className="w-full md:w-48 h-48 object-cover" />
                <div className="p-6 flex-1">
                  <h3 className="font-bold text-stone-900">{o.species?.name || "Inconnu"} <span className="text-xs font-normal text-stone-400 ml-2">par {o.profiles?.full_name}</span></h3>
                  <p className="text-stone-500 text-sm mt-2 mb-6">{o.description}</p>
                  <div className="flex gap-3"><button onClick={() => handleVerifyObs(o.id)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl">Valider</button><button onClick={() => handleDeleteObs(o.id)} className="flex-1 border border-red-100 text-red-600 font-bold py-2 rounded-xl">Rejeter</button></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'blog' && (
        <>
          <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 mb-12">
            <h2 className="text-xl font-bold text-stone-900 mb-8 flex items-center"><Plus className="h-5 w-5 mr-2 text-green-600" /> Rédiger un article</h2>
            <form onSubmit={handleSubmitArticle} className="space-y-6">
              <input type="text" placeholder="Titre" value={articleData.title} onChange={(e) => setArticleData({...articleData, title: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl" />
              <textarea placeholder="Contenu" rows={6} value={articleData.content} onChange={(e) => setArticleData({...articleData, content: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl"></textarea>
              <input type="text" placeholder="URL Image" value={articleData.image_url} onChange={(e) => setArticleData({...articleData, image_url: e.target.value})} className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl" />
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-4 rounded-xl">Publier sur le blog</button>
            </form>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {articleList.map(a => (
              <div key={a.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <h3 className="font-bold">{a.title}</h3>
                <button onClick={() => handleDeleteArticle(a.id)} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
