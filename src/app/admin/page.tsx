'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Shield, Plus, Upload, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
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

  const router = useRouter();
  const supabase = createClient();

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
      }
      setLoading(false);
    }
    checkAdmin();
  }, [router, supabase]);

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

      <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
        <h2 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
          <Plus className="h-5 w-5 mr-2 text-green-600" /> Ajouter une nouvelle espèce
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Nom commun</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="Ex: Éléphant du Nord"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Nom scientifique</label>
              <input
                type="text"
                value={formData.scientific_name}
                onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                placeholder="Ex: Loxodonta africana"
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
              placeholder="Décrivez l'importance de cette espèce pour le Togo..."
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
                <option value="EW">Éteint à l'état sauvage (EW)</option>
                <option value="EX">Éteint (EX)</option>
              </select>
            </div>

            <div className="relative">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="file-upload"
                className={`flex items-center justify-center w-full px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${formData.image_url ? 'border-green-500 bg-green-50 text-green-700' : 'border-stone-200 hover:border-green-400 text-stone-500'}`}
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : formData.image_url ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <Upload className="h-5 w-5 mr-2" />
                )}
                {formData.image_url ? 'Photo chargée' : 'Charger une photo'}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Enregistrer l'espèce"}
          </button>
        </form>
      </div>
    </div>
  );
}
