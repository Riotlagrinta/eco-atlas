'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowLeft, Clock, Map as MapIcon, Zap, 
  CheckCircle, ShieldCheck, Languages, Phone, 
  Loader2, Mountain, Compass
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import BookingForm from '@/components/BookingForm';

const TrailMap = dynamic(() => import('@/components/TrailMap'), {
  ssr: false,
  loading: () => <div className="h-full bg-stone-100 animate-pulse" />
});

interface Trail {
  id: string;
  name: string;
  description: string;
  difficulty: string;
  duration_hours: number;
  distance_km: number;
  highlights: string[];
  route_geojson: any;
  image_url: string;
}

interface Guide {
  id: string;
  name: string;
  phone: string;
  languages: string[];
  specialties: string[];
  rating: number;
  price_per_day: number;
  avatar_url: string;
  is_verified: boolean;
}

export default function TrailDetailPage() {
  const { id } = useParams();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data: trailData } = await supabase
        .from('eco_trails')
        .select('*')
        .eq('id', id)
        .single();

      if (trailData) {
        setTrail(trailData);
        // Pour la démo, on récupère un guide aléatoire ou lié au parc (ici on simplifie)
        const { data: guideData } = await supabase
          .from('local_guides')
          .select('*')
          .limit(1)
          .single();
        if (guideData) setGuide(guideData);
      }
      setLoading(false);
    }
    fetchData();
  }, [id, supabase]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;
  if (!trail) return <div className="text-center py-24 text-stone-400 font-bold">Circuit introuvable.</div>;

  return (
    <div className="min-h-screen bg-stone-50/30">
      {/* Top Banner */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <Image src={trail.image_url} className="object-cover" alt={trail.name} fill priority />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute top-8 left-8">
          <Link href="/ecotourisme" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md rounded-2xl text-white font-bold text-sm hover:bg-white/40 transition-all border border-white/20">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        </div>
        <div className="absolute bottom-12 left-8 right-8 max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-white">{trail.name}</h1>
          <div className="flex gap-4 mt-4">
            <span className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest">{trail.difficulty}</span>
            <span className="px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl text-xs font-bold uppercase tracking-widest border border-white/20">Eco-Circuit</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Durée', value: `${trail.duration_hours}h`, icon: Clock, color: 'text-green-600' },
                { label: 'Distance', value: `${trail.distance_km}km`, icon: MapIcon, color: 'text-blue-600' },
                { label: 'Difficulté', value: trail.difficulty, icon: Mountain, color: 'text-amber-600' },
                { label: 'Certification', value: 'Éco-Togo', icon: Zap, color: 'text-purple-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm text-center">
                  <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="font-black text-stone-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="bg-white p-10 rounded-[40px] border border-stone-100 shadow-sm">
              <h2 className="text-2xl font-black text-stone-900 mb-6 flex items-center gap-3">
                <Compass className="h-6 w-6 text-green-600" /> À propos de l'expédition
              </h2>
              <p className="text-stone-600 leading-relaxed text-lg italic whitespace-pre-wrap mb-10">
                {trail.description}
              </p>
              
              <h3 className="font-black text-stone-900 mb-6 uppercase tracking-widest text-xs">Points forts du circuit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trail.highlights?.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-bold text-stone-700">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-blue-600" /> Tracé de l'itinéraire
              </h3>
              <div className="h-[500px] rounded-[40px] overflow-hidden border border-stone-200 shadow-2xl">
                <TrailMap geoJsonData={trail.route_geojson} />
              </div>
            </div>

            {/* Guide Profile */}
            {guide && (
              <div className="bg-stone-900 p-10 rounded-[40px] text-white">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 shadow-xl">
                    <Image src={guide.avatar_url || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&w=200&q=80"} className="object-cover" alt={guide.name} fill />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <h3 className="text-2xl font-black">{guide.name}</h3>
                      {guide.is_verified && <ShieldCheck className="h-5 w-5 text-green-400" />}
                    </div>
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mb-4">Guide Naturaliste Certifié</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">
                        <Languages className="h-4 w-4" /> {guide.languages.join(', ')}
                      </div>
                      <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-xs font-bold">
                        <Phone className="h-4 w-4" /> {guide.phone}
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right bg-white/5 p-6 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Tarif Guide</p>
                    <p className="text-3xl font-black text-green-400">{guide.price_per_day} FCFA</p>
                    <p className="text-[8px] text-stone-500 uppercase">/ jour (hors participants)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="relative">
            <BookingForm 
              trailId={trail.id} 
              guideId={guide?.id || ''} 
              pricePerPerson={5000} // Base price example
            />
          </div>
        </div>
      </div>
    </div>
  );
}
