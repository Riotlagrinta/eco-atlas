'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Camera, MapPin, Loader2, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { db } from '@/lib/offline-db';
import Image from 'next/image';
import { z } from 'zod';
import { getAllSpecies, createObservation } from '@/lib/actions';
import { LevelUpModal } from '@/components/LevelUpModal';

const observationSchema = z.object({
  species_id: z.string().uuid("L'ID de l'espèce est invalide").nullable(),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères").max(1000, "La description est trop longue"),
  image_url: z.string().url("Une photo valide est requise"),
  location: z.string().startsWith("POINT(", "Format de localisation invalide"),
  latitude: z.number(),
  longitude: z.number(),
  is_verified: z.boolean(),
  type: z.enum(['observation', 'alert']),
  alert_level: z.enum(['low', 'medium', 'high', 'critical'])
});

export default function SignalerPage() {
  const { data: session, status: authStatus } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [species, setSpecies] = useState<{ id: string, name: string }[]>([]);

  const [formData, setFormData] = useState({
    species_id: '',
    description: '',
    image_url: '',
    type: 'observation',
    alert_level: 'low'
  });

  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/connexion');
    }
  }, [authStatus, router]);

  useEffect(() => {
    setTimeout(() => {
      if (typeof navigator !== 'undefined') setIsOnline(navigator.onLine);
    }, 0);
    window.addEventListener('online', () => {
      setIsOnline(true);
      toast.success("Connexion rétablie !");
    });
    window.addEventListener('offline', () => {
      setIsOnline(false);
      toast.error("Mode hors-ligne activé.");
    });
  }, []);

  useEffect(() => {
    async function init() {
      const data = await getAllSpecies();
      if (data) setSpecies(data);
    }
    init();
  }, []);

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
    
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
    const filePath = `user_reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('observations')
      .upload(filePath, file);

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('observations').getPublicUrl(filePath);

      setIsAnalyzing(true);
      try {
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: publicUrl })
        });
        const result = await response.json();

        if (result.success && result.data) {
          const ai = result.data;

          const matchedSpecies = species.find(s =>
            s.name.toLowerCase().includes(ai.name.toLowerCase()) ||
            (ai.scientific_name && s.name.toLowerCase().includes(ai.scientific_name.toLowerCase()))
          );

          setFormData({
            ...formData,
            image_url: publicUrl,
            description: `${ai.name} ${ai.scientific_name ? `(${ai.scientific_name})` : ''}\n\n${ai.description}\n\nStatut de conservation estimé : ${ai.conservation_status}`,
            species_id: matchedSpecies ? matchedSpecies.id : formData.species_id
          });
          toast.success("Image analysée par l'IA avec succès ✨");
        } else {
          setFormData({ ...formData, image_url: publicUrl });
          toast.error(result.error || "L'IA n'a pas pu identifier l'image.");
        }
      } catch (err) {
        console.error("Erreur IA:", err);
        setFormData({ ...formData, image_url: publicUrl });
      } finally {
        setIsAnalyzing(false);
        setUploading(false);
      }
    } else {
      setUploading(false);
      toast.error("Erreur de téléchargement de l'image.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coords) {
      setStatus({ type: 'error', msg: "Veuillez activer votre position GPS avant d'envoyer." });
      return;
    }

    setLoading(true);

    const reportData = {
      species_id: formData.type === 'observation' ? (formData.species_id || null) : null,
      description: formData.description,
      image_url: formData.image_url,
      location: `POINT(${coords.lng} ${coords.lat})`,
      latitude: coords.lat,
      longitude: coords.lng,
      is_verified: formData.type === 'alert' ? true : false,
      type: formData.type as 'observation' | 'alert',
      alert_level: formData.alert_level as 'low' | 'medium' | 'high' | 'critical'
    };

    const parsedData = observationSchema.safeParse(reportData);

    if (!parsedData.success) {
      toast.error(parsedData.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      if (!isOnline) {
        await db.reports.add({
          species_id: reportData.species_id || '',
          description: reportData.description,
          image_url: reportData.image_url,
          location: reportData.location,
          type: formData.type as 'observation' | 'alert',
          alert_level: formData.alert_level as any,
          created_at: new Date().toISOString()
        });
        toast.success("Hors-ligne : Signalement enregistré localement sur votre téléphone !");
        setTimeout(() => router.push('/profil'), 2000);
        setLoading(false);
        return;
      }

      const result = await createObservation({
          speciesId: reportData.species_id,
          description: reportData.description,
          imageUrl: reportData.image_url,
          location: reportData.location,
          latitude: reportData.latitude,
          longitude: reportData.longitude,
          isVerified: reportData.is_verified,
          type: reportData.type,
          alertLevel: reportData.alert_level
      });

      if (!result.success) {
        toast.error("Erreur : " + (result.error as any)?.message);
      } else {
        if (result.xpResult?.leveledUp) {
            setNewLevel(result.xpResult.newLevel);
            setShowLevelUp(true);
        }
        toast.success(`+${formData.type === 'alert' ? 50 : 25} XP ✨`, { icon: '🎮' });
        toast.success(formData.type === 'alert' ? "ALERTE ENVOYÉE !" : "Observation envoyée avec succès !");
        setTimeout(() => router.push('/carte'), 2000);
      }
    } catch (err) {
      toast.error("Une erreur inattendue s'est produite lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <LevelUpModal isOpen={showLevelUp} newLevel={newLevel} onClose={() => setShowLevelUp(false)} />
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-green-100 rounded-3xl text-green-600 mb-4">
          <Camera className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900">Signaler une espèce</h1>
        <p className="text-stone-500 mt-2">Contribuez à l&apos;inventaire de la biodiversité du Togo</p>
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
              onClick={() => setFormData({ ...formData, type: 'observation' })}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.type === 'observation' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-500'}`}
            >
              Observation
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'alert' })}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${formData.type === 'alert' ? 'bg-red-600 text-white shadow-sm' : 'text-stone-500'}`}
            >
              Alerte Urgente
            </button>
          </div>

          <div className="relative">
            <input type="file" id="obs-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
            <label htmlFor="obs-upload" className={`flex flex-col items-center justify-center w-full aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative ${formData.image_url ? 'border-green-500' : 'border-stone-200 hover:border-green-400'}`}>
              {uploading || isAnalyzing ?
                <div className="flex flex-col items-center text-green-600">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <span className="font-bold text-sm">{isAnalyzing ? "L'IA analyse votre photo ✨..." : "Téléchargement..."}</span>
                </div> :
                formData.image_url ? <Image src={formData.image_url} className="object-cover" alt="Observation" fill /> :
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
              <label className="block text-sm font-bold text-red-700 mb-2 ml-1">Niveau d&apos;Urgence</label>
              <select
                value={formData.alert_level}
                onChange={(e) => setFormData({ ...formData, alert_level: e.target.value })}
                className="w-full px-4 py-3 bg-red-50 border border-red-100 text-red-700 font-bold rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all"
              >
                <option value="medium">Moyen (Pollution, déchet)</option>
                <option value="high">Élevé (Abattage d&apos;arbres)</option>
                <option value="critical">Critique (Braconnage, Feu de brousse)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-stone-700 mb-2 ml-1">Détails de l&apos;observation</label>
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
          disabled={loading || uploading || isAnalyzing}
          className="w-full bg-stone-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /><span>Envoyer le signalement</span></>}
        </button>
      </form>
      <Toaster position="bottom-center" />
    </div>
  );
}
