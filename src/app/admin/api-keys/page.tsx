'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Key, Plus, Trash2, Copy, CheckCircle, XCircle, 
  Loader2, Shield, Building2, Calendar, Activity, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { getApiKeys, createApiKey, updateApiKeyStatus, deleteApiKey } from '@/lib/actions';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ApiKeysAdmin() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<any[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newOrg, setNewOrg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchKeysData = useCallback(async () => {
    setLoading(true);
    try {
        const data = await getApiKeys();
        setKeys(data || []);
    } catch (err) {
        console.error(err);
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
            fetchKeysData();
        }
    }
  }, [authStatus, session, router, fetchKeysData]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrg.trim()) return;

    setSubmitting(true);
    const res = await createApiKey(newOrg.trim());

    if (!res.success) {
      toast.error('Erreur lors de la génération');
    } else {
      toast.success('Clé API générée avec succès !');
      setNewOrg('');
      setShowNewModal(false);
      fetchKeysData();
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const res = await updateApiKeyStatus(id, !currentStatus);
    if (res.success) {
      toast.success(currentStatus ? 'Clé révoquée' : 'Clé réactivée');
      fetchKeysData();
    }
  };

  const handleDelete = async (id: string) => {
      if(confirm("Supprimer définitivement cette clé ?")) {
          const res = await deleteApiKey(id);
          if (res.success) {
              toast.success("Clé supprimée");
              fetchKeysData();
          }
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier !');
  };

  if (authStatus === 'loading' || (loading && keys.length === 0)) {
      return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-amber-500 h-10 w-10" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <Toaster position="bottom-center" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-stone-900 flex items-center gap-3">
            <Key className="h-8 w-8 text-amber-500" />
            Gestion des Accès API
          </h1>
          <p className="text-stone-500 mt-1 font-medium">Partenaires Institutionnels & Chercheurs</p>
        </div>
        <button 
          onClick={() => setShowNewModal(true)}
          className="bg-stone-900 text-white px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-xl hover:bg-stone-800 transition-all"
        >
          <Plus className="h-5 w-5" /> NOUVEAU PARTENAIRE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {keys.map((k) => (
          <motion.div 
            key={k.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`bg-white p-6 rounded-[32px] border transition-all ${k.isActive ? 'border-stone-100 shadow-sm' : 'border-red-100 bg-red-50/30 grayscale'}`}
          >
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-5 w-5 text-stone-400" />
                  <h3 className="text-lg font-black text-stone-900">{k.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${k.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {k.isActive ? 'Actif' : 'Révoqué'}
                  </span>
                </div>
                
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex items-center justify-between mb-4 group">
                  <code className="text-xs font-mono text-stone-600 break-all">{k.key}</code>
                  <button 
                    onClick={() => copyToClipboard(k.key)}
                    className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Créé le {new Date(k.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5"><Activity className="h-3 w-3" /> Limite: Standard</span>
                  <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> Accès: Read-only</span>
                </div>
              </div>

              <div className="flex md:flex-col justify-end gap-2">
                <button 
                  onClick={() => handleToggleStatus(k.id, k.isActive)}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-xs transition-all ${k.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-600 text-white hover:bg-green-700'}`}
                >
                  {k.isActive ? 'Révoquer' : 'Réactiver'}
                </button>
                <button 
                  onClick={() => handleDelete(k.id)}
                  className="p-3 bg-stone-50 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {keys.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-stone-200">
            <Key className="h-12 w-12 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Aucun partenaire enregistré</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-[40px] shadow-2xl w-full max-w-md border border-stone-100"
            >
              <h2 className="text-2xl font-black text-stone-900 mb-6 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600" />
                Nouveau Partenaire
              </h2>
              <form onSubmit={handleCreateKey} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 ml-1">Nom de l'Organisation / Chercheur</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Université de Lomé, PNUD..."
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-bold shadow-xl hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center"
                  >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'GÉNÉRER LA CLÉ'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowNewModal(false)}
                    className="px-6 py-4 bg-stone-100 text-stone-500 rounded-2xl font-bold"
                  >
                    ANNULER
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
