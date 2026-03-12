'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2, Leaf, Camera, Map as MapIcon, Newspaper, Users, BarChart3, Edit3, MessageSquare, X, FileText, Film } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import Image from 'next/image';
import { 
  getAllSpecies, 
  getAllObservations, 
  getAllUsers, 
  getAllArticles, 
  getDashboardStats, 
  updateUserRole, 
  createSpecies, 
  updateSpecies, 
  deleteSpecies, 
  createArticle, 
  deleteArticle,
  verifyObservation,
  getAllDocuments,
  createDocument,
  getAllDocumentaries
} from '@/lib/actions';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession();
  const [showQR, setShowQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({ name: '', scientificName: '', description: '', conservationStatus: 'LC', imageUrl: '', habitat: '', diet: '', populationEstimate: '', category: 'Fauna' });
  const [articleData, setArticleData] = useState({ title: '', content: '', imageUrl: '', category: 'Actualité' });
  const [docData, setDocData] = useState({ title: '', description: '', fileUrl: '', category: 'Loi' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [allObsList, setAllObsList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [articleList, setArticleList] = useState<any[]>([]);
  const [documentList, setDocumentList] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'species' | 'obs' | 'users' | 'insights' | 'blog' | 'docs'>('species');

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o, u, a, d, stats] = await Promise.all([
        getAllSpecies(),
        getAllObservations(),
        getAllUsers(),
        getAllArticles(),
        getAllDocuments(),
        getDashboardStats()
      ]);

      setSpeciesList(s);
      setAllObsList(o);
      setUserList(u);
      setArticleList(a);
      setDocumentList(d);
      setAdminStats(stats);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/connexion');
    } else if (authStatus === 'authenticated') {
      // @ts-ignore
      if (session?.user?.role !== 'admin') {
        router.push('/');
      } else {
        fetchData();
      }
    }
  }, [authStatus, session, router, fetchData]);

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const res = await updateUserRole(userId, newRole);
    if (res.success) {
      toast.success("Rôle mis à jour");
      fetchData();
    }
  };

  const handleEditSpecies = (s: any) => {
    setEditingId(s.id);
    setFormData({ 
      name: s.name, 
      scientificName: s.scientificName || '', 
      description: s.description || '', 
      conservationStatus: s.conservationStatus || 'LC', 
      imageUrl: s.imageUrl || '', 
      habitat: s.habitat || '', 
      diet: s.diet || '', 
      populationEstimate: s.populationEstimate || '', 
      category: s.category || 'Fauna' 
    });
    setActiveTab('species');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSpecies = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    const res = await deleteSpecies(id);
    if (res.success) {
      toast.success("Espèce supprimée");
      fetchData();
    }
  };

  const handleSubmitSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = editingId 
      ? await updateSpecies(editingId, formData) 
      : await createSpecies(formData);
    
    if (res.success) { 
      setFormData({ name: '', scientificName: '', description: '', conservationStatus: 'LC', imageUrl: '', habitat: '', diet: '', populationEstimate: '', category: 'Fauna' }); 
      setEditingId(null); 
      fetchData(); 
      toast.success(editingId ? "Espèce mise à jour" : "Espèce créée");
    }
    setLoading(false);
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createArticle(articleData);
    if (res.success) { 
      setArticleData({ title: '', content: '', imageUrl: '', category: 'Actualité' }); 
      fetchData(); 
      toast.success("Article publié");
    }
    setLoading(false);
  };

  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await createDocument(docData);
    if (res.success) {
      setDocData({ title: '', description: '', fileUrl: '', category: 'Loi' });
      fetchData();
      toast.success("Document ajouté");
    }
    setLoading(false);
  };

  const handleVerifyObs = async (id: string, isVerified: boolean) => {
    setLoading(true);
    const res = await verifyObservation(id, isVerified);
    if (res.success) {
      toast.success(isVerified ? "Observation validée" : "Observation rejetée");
      fetchData();
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    
    const filePath = `species/${Math.random()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('observations').upload(filePath, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('observations').getPublicUrl(filePath);
      setFormData({ ...formData, imageUrl: publicUrl });
      toast.success("Photo téléchargée");
    }
    setUploading(false);
  };

  if (authStatus === 'loading' || (loading && speciesList.length === 0)) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;
  }

  const pendingObs = allObsList.filter(o => !o.isVerified);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Toaster />
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg"><Shield className="h-8 w-8" /></div>
        <div className="flex-1"><h1 className="text-3xl font-bold text-stone-900">Panel Administrateur</h1><p className="text-stone-500 text-sm">Gestion globale d&apos;Eco-Atlas Togo</p></div>
        <Link href="/admin/carte" className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-6 py-3 rounded-2xl flex items-center border border-stone-200 transition-all"><MapIcon className="h-5 w-5 mr-2" /> SIG</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 text-[10px] uppercase font-bold tracking-widest">
        {[
          { id: 'species', label: 'Espèces', icon: Leaf },
          { id: 'obs', label: 'Modération', icon: Camera, badge: pendingObs.length },
          { id: 'blog', label: 'Blog', icon: Newspaper },
          { id: 'docs', label: 'Documents', icon: FileText },
          { id: 'users', label: 'Membres', icon: Users },
          { id: 'insights', label: 'Insights', icon: BarChart3 }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2.5 rounded-xl transition-all flex items-center ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
            <tab.icon className="h-3.5 w-3.5 mr-2" /> {tab.label} {tab.badge ? <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'species' && (
        <div className="space-y-12">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
            <h2 className="text-xl font-bold mb-8 flex items-center">{editingId ? <Edit3 className="mr-2 text-blue-600" /> : <Plus className="mr-2 text-green-600" />} {editingId ? "Modifier l'espèce" : "Ajouter une espèce"}</h2>
            <form onSubmit={handleSubmitSpecies} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="Nom" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none" />
                <input type="text" placeholder="Nom scientifique" value={formData.scientificName} onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none" />
              </div>
              <textarea placeholder="Description" rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none"></textarea>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="w-full p-4 bg-stone-50 rounded-2xl"><option value="Fauna">Faune</option><option value="Flora">Flore</option></select>
                <div className="relative"><input type="file" id="up" className="hidden" onChange={handleFileUpload} /><label htmlFor="up" className={`flex items-center justify-center w-full p-4 rounded-2xl border-2 border-dashed cursor-pointer font-bold bg-stone-50 text-stone-400`}>{uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} Photo</label></div>
              </div>
              <button type="submit" className={`w-full py-4 rounded-2xl text-white font-bold shadow-lg ${editingId ? 'bg-blue-600' : 'bg-green-600'}`}>{editingId ? "Enregistrer les modifications" : "Publier l'espèce"}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', scientificName: '', description: '', conservationStatus: 'LC', imageUrl: '', habitat: '', diet: '', populationEstimate: '', category: 'Fauna' }); }} className="w-full text-stone-400 font-bold text-sm">Annuler</button>}
            </form>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {speciesList.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4"><div className="w-16 h-16 rounded-xl bg-stone-100 overflow-hidden relative mr-4"><Image src={s.imageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80'} className="object-cover" alt={s.name} fill /></div><div><h4 className="font-bold">{s.name}</h4><span className="text-[10px] uppercase font-bold text-stone-400">{s.category}</span></div></div>
                <div className="flex gap-2">
                  <button onClick={() => setShowQR(`${window.location.origin}/observatoire/${s.id}`)} className="p-2 text-stone-400 hover:text-blue-600"><QrCode className="h-5 w-5" /></button>
                  <button onClick={() => handleEditSpecies(s)} className="p-2 text-stone-400 hover:text-green-600"><Edit3 className="h-5 w-5" /></button>
                  <button onClick={() => handleDeleteSpecies(s.id)} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'blog' && (
        <div className="space-y-12">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
            <h2 className="text-xl font-bold mb-8 flex items-center"><Newspaper className="mr-2 text-green-600" /> Rédiger un article</h2>
            <form onSubmit={handleSubmitArticle} className="space-y-6">
              <input type="text" placeholder="Titre" value={articleData.title} onChange={(e) => setArticleData({ ...articleData, title: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none" />
              <textarea placeholder="Contenu" rows={6} value={articleData.content} onChange={(e) => setArticleData({ ...articleData, content: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none"></textarea>
              <input type="text" placeholder="URL Image" value={articleData.imageUrl} onChange={(e) => setArticleData({ ...articleData, imageUrl: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none" />
              <button type="submit" className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg">Publier sur le blog</button>
            </form>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {articleList.map(a => (
              <div key={a.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <h3 className="font-bold">{a.title}</h3>
                <button onClick={async () => { if (confirm("Supprimer ?")) { await deleteArticle(a.id); fetchData(); } }} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'docs' && (
        <div className="space-y-12">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-100">
            <h2 className="text-xl font-bold mb-8 flex items-center"><FileText className="mr-2 text-green-600" /> Ajouter un document</h2>
            <form onSubmit={handleSubmitDocument} className="space-y-6">
              <input type="text" placeholder="Titre" value={docData.title} onChange={(e) => setDocData({ ...docData, title: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none" />
              <textarea placeholder="Description" rows={3} value={docData.description} onChange={(e) => setDocData({ ...docData, description: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none"></textarea>
              <input type="text" placeholder="URL du fichier" value={docData.fileUrl} onChange={(e) => setDocData({ ...docData, fileUrl: e.target.value })} className="w-full p-4 bg-stone-50 rounded-2xl outline-none" />
              <button type="submit" className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg">Ajouter le document</button>
            </form>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {documentList.map(d => (
              <div key={d.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between shadow-sm">
                <h3 className="font-bold">{d.title}</h3>
                <div className="flex gap-2">
                  <a href={d.fileUrl} target="_blank" className="p-2 text-stone-400 hover:text-green-600"><FileText className="h-5 w-5" /></a>
                  <button onClick={async () => { if (confirm("Supprimer ?")) { /* await deleteDocument(d.id); */ fetchData(); } }} className="p-2 text-stone-300 hover:text-red-600"><Trash2 className="h-5 w-5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'obs' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            {pendingObs.map(o => (
              <div key={o.id} className="bg-white rounded-3xl border border-stone-100 overflow-hidden flex flex-col md:flex-row shadow-sm"><div className="w-full md:w-48 h-48 relative"><Image src={o.imageUrl || ''} className="object-cover" alt="Observation" fill /></div><div className="p-6 flex-1"><h3 className="font-bold text-stone-900">{o.species?.name || "Inconnu"} <span className="text-xs font-normal text-stone-400 ml-2">par {o.user?.name}</span></h3><p className="text-stone-500 text-sm mt-2 mb-6 line-clamp-2">{o.description}</p><div className="flex gap-3"><button onClick={() => handleVerifyObs(o.id, true)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl">Valider</button><button onClick={() => handleVerifyObs(o.id, false)} className="flex-1 border border-red-100 text-red-600 font-bold py-2 rounded-xl">Rejeter</button></div></div></div>
            ))}
            {pendingObs.length === 0 && <p className="text-center text-stone-400 py-12">Aucune observation en attente de modération.</p>}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm"><h3 className="font-bold text-stone-900 mb-6 flex items-center"><MapIcon className="h-5 w-5 mr-2 text-green-600" /> Répartition Régionale</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={adminStats?.byRegion}><XAxis dataKey="name" fontSize={10} /><YAxis fontSize={10} /><Tooltip /><Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-center text-center"><h3 className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mb-4">Membres inscrits</h3><span className="text-6xl font-bold mb-2 text-green-400">{adminStats?.totalUsers}</span></div></div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-4">
          {userList.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between shadow-sm">
              <h3 className="font-bold">{u.name || 'Utilisateur'} <span className="text-xs font-normal text-stone-400 ml-2">({u.region || 'N/A'})</span></h3>
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
              <p className="text-[10px] text-stone-400 mb-8 italic text-center">Imprimez ce code QR pour informer les visiteurs dans les parcs nationaux du Togo.</p>
              <div className="flex gap-4"><button onClick={() => window.print()} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl">Imprimer</button><button onClick={() => setShowQR(null)} className="flex-1 bg-stone-100 text-stone-600 font-bold py-3 rounded-xl">Fermer</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
