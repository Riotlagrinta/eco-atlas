'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2, Leaf, Film, Camera, Map as MapIcon, Newspaper, Save, Users, Target, Brain, QrCode, BarChart3, Activity } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  
  const [formData, setFormData] = useState({ name: '', scientific_name: '', description: '', conservation_status: 'LC', image_url: '', habitat: '', diet: '', population_estimate: '' });
  const [docData, setDocData] = useState({ title: '', description: '', video_url: '', thumbnail_url: '', duration: '', category: 'Nature' });

  const [speciesList, setSpeciesList] = useState<any[]>([]);
  const [docList, setDocList] = useState<any[]>([]);
  const [obsList, setObsList] = useState<any[]>([]);
  const [allObsList, setAllObsList] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'species' | 'docs' | 'obs' | 'users' | 'insights'>('species');

  const router = useRouter();
  const supabase = createClient();

  const fetchData = async () => {
    const { data: species } = await supabase.from('species').select('*').order('created_at', { ascending: false });
    if (species) setSpeciesList(species);

    const { data: docs } = await supabase.from('documentaries').select('*').order('created_at', { ascending: false });
    if (docs) setDocList(docs);

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

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setStatus({ type: 'success', msg: "Rôle mis à jour !" });
      fetchData();
    }
  };

  const handleToggleResolve = async (id: string, current: boolean) => {
    await supabase.from('observations').update({ is_resolved: !current }).eq('id', id);
    fetchData();
  };

  const handleVerifyObs = async (id: string) => {
    setLoading(true);
    await supabase.from('observations').update({ is_verified: true }).eq('id', id);
    setStatus({ type: 'success', msg: "Validé !" });
    fetchData();
    setLoading(false);
  };

  const handleDeleteObs = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    await supabase.from('observations').delete().eq('id', id);
    fetchData();
  };

  if (loading && !isAdmin) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center space-x-4 mb-12">
        <div className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg"><Shield className="h-8 w-8" /></div>
        <div><h1 className="text-3xl font-bold text-stone-900">Panel Administrateur</h1><p className="text-stone-500 text-sm">Dashboard décisionnel Togo</p></div>
        <Link href="/admin/carte" className="ml-auto bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold px-6 py-3 rounded-2xl flex items-center transition-all border border-stone-200"><MapIcon className="h-5 w-5 mr-2" /> SIG</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { id: 'species', label: 'Espèces', icon: Leaf },
          { id: 'obs', label: 'Modération', icon: Camera, badge: obsList.length },
          { id: 'users', label: 'Membres', icon: Users },
          { id: 'insights', label: 'Insights', icon: BarChart3 }
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center text-xs ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
            <tab.icon className="h-4 w-4 mr-2" /> {tab.label} {tab.badge ? <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'insights' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
              <h3 className="font-bold text-stone-900 mb-6 flex items-center"><MapIcon className="h-5 w-5 mr-2 text-green-600" /> Signalements par Région</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adminStats?.byRegion}>
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-center text-center">
              <h3 className="text-stone-400 font-bold uppercase text-[10px] tracking-widest mb-4">Gestion des Alertes</h3>
              <span className="text-6xl font-bold mb-2">{adminStats?.resolvedAlerts} / {adminStats?.totalAlerts}</span>
              <p className="text-sm text-stone-400 italic">Alertes urgentes résolues par les agents</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-50 bg-stone-50/50 font-bold text-sm">Suivi des alertes critiques</div>
            <div className="divide-y divide-stone-50">
              {allObsList.filter(o => o.type === 'alert').map(alert => (
                <div key={alert.id} className="p-6 flex items-center justify-between hover:bg-stone-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${alert.is_resolved ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm">{alert.description}</p>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">{alert.profiles?.region || 'Inconnue'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleToggleResolve(alert.id, alert.is_resolved)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${alert.is_resolved ? 'bg-green-50 text-green-600' : 'bg-stone-900 text-white'}`}
                  >
                    {alert.is_resolved ? 'RÉSOU' : 'MARQUER RÉSOLU'}
                  </button>
                </div>
              ))}
            </div>
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
                <div className="flex gap-3">
                  <button onClick={() => handleVerifyObs(o.id)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-xl">Valider</button>
                  <button onClick={() => handleDeleteObs(o.id)} className="flex-1 border border-red-100 text-red-600 font-bold py-2 rounded-xl">Rejeter</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 gap-4">
          {userList.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between shadow-sm">
              <h3 className="font-bold">{u.full_name || 'Utilisateur'} <span className="text-xs font-normal text-stone-400 ml-2">({u.region})</span></h3>
              <select value={u.role} onChange={(e) => handleUpdateRole(u.id, e.target.value)} className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 text-xs font-bold">
                <option value="user">Utilisateur</option><option value="expert">Expert</option><option value="admin">Administrateur</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}