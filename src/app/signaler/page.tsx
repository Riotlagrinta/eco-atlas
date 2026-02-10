'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Camera, MapPin, Loader2, CheckCircle, AlertCircle, Send, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

export default function SignalerPage() {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => {
      setIsOnline(true);
      toast.success("Connexion rétablie !");
    });
    window.addEventListener('offline', () => {
      setIsOnline(false);
      toast.error("Mode hors-ligne activé.");
    });
  }, []);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [species, setSpecies] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    species_id: '',
    description: '',
    image_url: '',
    type: 'observation',
    alert_level: 'low'
  });

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/connexion');
      
      const { data } = await supabase.from('species').select('id, name').order('name');
      if (data) setSpecies(data);
    }
    init();
  }, [router, supabase]);

  const getGeolocation = () => {
    if (!navigator.geolocation) {
      setStatus({ type: 'error', msg: "La géolocalisation n'est pas supportée par votre navigateur." });
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoading(false);
      },
      () => {
        setStatus({ type: 'error', msg: "Impossible d'accéder à votre position. Vérifiez vos autorisations." });
        setLoading(false);
      }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
    const filePath = `user_reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('observations')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('observations').getPublicUrl(filePath);
      setFormData({ ...formData, image_url: publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      setStatus({ type: 'error', msg: "Veuillez activer votre position GPS avant d'envoyer." });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('observations').insert([
      {
        user_id: user?.id,
        species_id: formData.type === 'observation' ? (formData.species_id || null) : null,
        description: formData.description,
        image_url: formData.image_url,
        location: `POINT(${coords.lng} ${coords.lat})`,
        is_verified: formData.type === 'alert' ? true : false, // Les alertes sont visibles immédiatement pour la sécurité
        type: formData.type,
        alert_level: formData.alert_level
      }
    ]);

    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      toast.success(formData.type === 'alert' ? "ALERTE ENVOYÉE !" : "Observation envoyée avec succès !");
      setTimeout(() => router.push('/carte'), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-green-100 rounded-3xl text-green-600 mb-4">
          <Camera className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900">Signaler une espèce</h1>
        <p className="text-stone-500 mt-2">Contribuez à l'inventaire de la biodiversité du Togo</p>
      </div>

      {status && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mb-6 p-4 rounded-2xl flex items-center ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5 mr-3" /> : <AlertCircle className="h-5 w-5 mr-3" />}
          <span className="font-medium">{status.msg}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-3xl border border-stone-100 shadow-xl">
        <div className="space-y-4">
          <button
            type="button"
            onClick={getGeolocation}
            className={`w-full py-4 rounded-2xl flex items-center justify-center space-x-3 border-2 transition-all ${coords ? 'bg-green-50 border-green-500 text-green-700' : 'bg-stone-50 border-stone-100 text-stone-600 hover:border-green-300'}`}
          >
            <MapPin className={`h-5 w-5 ${coords ? 'animate-pulse' : ''}`} />
            <span className="font-bold">{coords ? 'Position capturée' : 'Activer ma position GPS'}</span>
          </button>

          <div className="flex p-1 bg-stone-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'observation'})}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.type === 'observation' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-500'}`}
            >
              Observation
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, type: 'alert'})}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.type === 'alert' ? 'bg-red-600 text-white shadow-sm' : 'text-stone-500'}`}
            >
              Alerte Urgente
            </button>
          </div>

          <div className="relative">
            <input type="file" id="obs-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
            <label htmlFor="obs-upload" className={`flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${formData.image_url ? 'border-green-500' : 'border-stone-200 hover:border-green-400'}`}>
              {uploading ? <Loader2 className="h-8 w-8 animate-spin text-green-600" /> : 
                formData.image_url ? <img src={formData.image_url} className="w-full h-full object-cover" /> :
                <div className="text-center"><Camera className="h-10 w-10 mx-auto text-stone-300 mb-2" /><span className="text-stone-400 font-medium">Prendre une photo</span></div>
              }
            </label>
          </div>

          {formData.type === 'observation' ? (
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2 ml-1">Espèce (si connue)</label>
              <select
                value={formData.species_id}
                onChange={(e) => setFormData({ ...formData, species_id: e.target.value })}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
              >
                <option value="">Je ne sais pas</option>
                {species.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-bold text-red-700 mb-2 ml-1">Niveau d'Urgence</label>
              <select
                value={formData.alert_level}
                onChange={(e) => setFormData({ ...formData, alert_level: e.target.value })}
                className="w-full px-4 py-3 bg-red-50 border border-red-100 text-red-700 font-bold rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
              >
                <option value="medium">Moyen (Pollution, déchet)</option>
                <option value="high">Élevé (Abattage d'arbres)</option>
                <option value="critical">Critique (Braconnage, Feu de brousse)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2 ml-1">Détails de l'observation</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
              placeholder="Ex: J'ai vu cet oiseau près de la rivière..."
            ></textarea>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center space-x-2"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /><span>Envoyer le signalement</span></>}
        </button>
      </form>
      <Toaster position="bottom-center" />
    </div>
  );
}
