'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2, Leaf, Film, Camera, Map as MapIcon, Newspaper, Save, Users, Target, Brain, QrCode, BarChart3, Activity, Edit3, MessageSquare } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  
  const [formData, setFormData] = useState({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '', habitat: '', diet: '', population_estimate: '', category: 'Fauna' });
  const [docData, setDocData] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '', category: 'Nature' });
  const [articleData, setArticleData] = useState({ title: '', content: '', image_url: '', category: 'Actualité' });
  const [missionData, setMissionData] = useState({ title: '', description: '', target_count: 10, image_url: '', end_date: '' });
  const [quizData, setQuizData] = useState({ title: '', description: '', difficulty: 'easy', image_url: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [docList, setDocList] = useState<any[]>([]);
  const [obsList, setObsList] = useState<any[]>([]);
  const [allObsList, setAllObsList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [articleList, setArticleList] = useState<any[]>([]);
  const [missionList, setMissionList] = useState<any[]>([]);
  const [quizList, setQuizList] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'species' | 'docs' | 'obs' | 'blog' | 'users' | 'missions' | 'quizzes' | 'insights'>('species');

  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    const [s, d, o, u, a, m, q] = await Promise.all([
      supabase.from('species').select('*').order('created_at', { ascending: false }),
      supabase.from('documentaries').select('*').order('created_at', { ascending: false }),
      supabase.from('observations').select('*, species:species_id(name), profiles:user_id(full_name, region)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('updated_at', { ascending: false }),
      supabase.from('articles').select('*').order('created_at', { ascending: false }),
      supabase.from('missions').select('*').order('created_at', { ascending: false }),
      supabase.from('quizzes').select('*').order('created_at', { ascending: false })
    ]);

    if (s.data) setSpeciesList(s.data);
    if (d.data) setDocList(d.data);
    if (o.data) {
      setAllObsList(o.data);
      setObsList(o.data.filter((obs: any) => !obs.is_verified));
      const regionData: any = {};
      o.data.forEach((obs: any) => {
        const reg = obs.profiles?.region || 'Inconnue';
        regionData[reg] = (regionData[reg] || 0) + 1;
      });
      setAdminStats({
        byRegion: Object.keys(regionData).map(k => ({ name: k, count: regionData[k] })),
        totalAlerts: o.data.filter((obs: any) => obs.type === 'alert').length,
        resolvedAlerts: o.data.filter((obs: any) => obs.is_resolved).length
      });
    }
    if (u.data) setUserList(u.data);
    if (a.data) setArticleList(a.data);
    if (m.data) setMissionList(m.data);
    if (q.data) setQuizList(q.data);
  };

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/connexion'); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role !== 'admin') { router.push('/'); } else { setIsAdmin(true); fetchData(); }
      setLoading(false);
    }
    checkAdmin();
  }, [router, supabase]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    fetchData();
  };

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

  const handleDeleteSpecies = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from('species').delete().eq('id', id);
    fetchData();
  };

  const handleToggleResolve = async (id: string, current: boolean) => {
    await supabase.from('observations').update({ is_resolved: !current }).eq('id', id);
    fetchData();
  };

  const handleVerifyObs = async (id: string) => {
    setLoading(true);
    await supabase.from('observations').update({ is_verified: true, admin_feedback: feedback }).eq('id', id);
    setFeedback('');
    fetchData();
    setLoading(false);
  };

  const handleDeleteObs = async (id: string) => {
    if (!confirm("Rejeter ?")) return;
    setLoading(true);
    await supabase.from('observations').update({ is_verified: false, admin_feedback: feedback }).eq('id', id);
    setFeedback('');
    fetchData();
    setLoading(false);
  };

  const handleSubmitSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = editingId 
      ? await supabase.from('species').update(formData).eq('id', editingId)
      : await supabase.from('species').insert([formData]);
    if (!error) {
      setFormData({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '', habitat: '', diet: '', population_estimate: '', category: 'Fauna' });
      setEditingId(null);
      fetchData();
    }
    setLoading(false);
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
        <div className="flex-1"><h1 className="text-3xl font-bold text-stone-900">Panel Administrateur</h1><p className="text-stone-500 text-sm">Gestion globale du patrimoine forestier du Togo</p></div>
        <Link href="/admin/carte" className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-6 py-3 rounded-2xl flex items-center border border-stone-200"><MapIcon className="h-5 w-5 mr-2" /> SIG</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'species', label: 'Espèces', icon: Leaf },
          { id: 'obs', label: 'Modération', icon: Camera, badge: obsList.length },
          { id: 'blog', label: 'Blog', icon: Newspaper },
          { id: 'missions', label: 'Missions', icon: Target },
          { id: 'users', label: 'Membres', icon: Users },
          { id: 'insights', label: 'Insights', icon: BarChart3 }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center text-xs ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
            <tab.icon className="h-4 w-4 mr-2" /> {tab.label} {tab.badge ? <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'obs' && (
        <div className="space-y-8">
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-8">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center"><MessageSquare className="h-4 w-4 mr-2" /> Modération Pédagogique</h3>
            <textarea 
              placeholder="Ajoutez une explication pour l'utilisateur (ex: photo floue, espèce déjà présente...)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-4 bg-white border border-amber-200 rounded-2xl outline-none text-sm"
            ></textarea>
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

      {activeTab === 'insights' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm"><h3 className="font-bold text-stone-900 mb-6 flex items-center"><MapIcon className="h-5 w-5 mr-2 text-green-600" /> Répartition Régionale</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={adminStats?.byRegion}><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={10}/><Tooltip/><Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div></div>
            <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-center text-center"><h3 className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mb-4">Alertes résolues</h3><span className="text-6xl font-bold mb-2 text-green-400">{adminStats?.resolvedAlerts} / {adminStats?.totalAlerts}</span></div>
          </div>
          <div className="bg-white rounded-3xl border border-stone-100 overflow-hidden divide-y divide-stone-50">
            {allObsList.filter(o => o.type === 'alert').map(alert => (
              <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-all"><div className="flex items-center gap-4"><div className={`w-3 h-3 rounded-full ${alert.is_resolved ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div><div><p className="font-bold text-stone-900 text-sm">{alert.description}</p><p className="text-[10px] text-stone-400 uppercase font-bold">{alert.profiles?.region}</p></div></div><button onClick={() => handleToggleResolve(alert.id, alert.is_resolved)} className={`px-4 py-2 rounded-xl text-[10px] font-bold ${alert.is_resolved ? 'bg-green-50 text-green-600' : 'bg-stone-900 text-white'}`}>{alert.is_resolved ? 'RÉSOLU' : 'RÉSOUDRE'}</button></div>
            ))}
          </div>
        </div>
      )}

      {/* Reste des onglets simplifiés pour la stabilité */}
      {activeTab === 'species' && (
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-xl">
            <h2 className="text-xl font-bold mb-8 flex items-center">{editingId ? <Edit3 className="mr-2 text-blue-600" /> : <Plus className="mr-2 text-green-600" />} {editingId ? "Modifier" : "Ajouter"}</h2>
            <form onSubmit={handleSubmitSpecies} className="space-y-4">
              <input type="text" placeholder="Nom" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl" />
              <button type="submit" className={`w-full py-4 rounded-2xl text-white font-bold ${editingId ? 'bg-blue-600' : 'bg-green-600'}`}>Enregistrer</button>
            </form>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {speciesList.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4"><img src={s.image_url} className="w-12 h-12 rounded-xl object-cover" /><div><h4 className="font-bold">{s.name}</h4><span className="text-[10px] uppercase text-stone-400">{s.category}</span></div></div>
                <div className="flex gap-2"><button onClick={() => handleEditSpecies(s)} className="p-2 text-stone-400 hover:text-green-600"><Edit3 className="h-5 w-5" /></button><button onClick={() => handleDeleteSpecies(s.id)} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}