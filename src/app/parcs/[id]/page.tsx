import React from 'react';
import { getProtectedAreaById } from '@/lib/actions';
import { MapPin, ArrowLeft, Activity, Leaf, Sun, Cloud } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = "force-dynamic";

export default async function ParcDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const parc = await getProtectedAreaById(id);

  if (!parc) return <div className="text-center py-24">Parc non trouvé.</div>;

  // Basic weather fetch (client-side or server-side, here server-side for speed)
  let weather = null;
  try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=8.85&longitude=0.95&current_weather=true`, { next: { revalidate: 3600 } });
      const wData = await res.json();
      weather = wData.current_weather;
  } catch (e) {}

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <Link href="/parcs" className="inline-flex items-center text-stone-400 hover:text-green-600 font-bold text-sm mb-8 transition-colors group">
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Retour à la liste
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Colonne Gauche : Image et Info */}
        <div className="lg:col-span-2 space-y-10">
          <div className="relative h-[50vh] rounded-3xl overflow-hidden shadow-2xl border border-stone-100">
            {parc.imageUrl && <Image src={parc.imageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80'} className="object-cover" alt="Parc National" fill priority />}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-10 z-10">
              <span className="text-green-400 font-bold uppercase tracking-widest text-xs mb-2">{parc.type}</span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{parc.name}</h1>
              <p className="text-stone-200 flex items-center"><MapPin className="h-4 w-4 mr-2" /> Patrimoine Naturel du Togo</p>
            </div>
          </div>

          <div className="prose prose-stone max-w-none">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Description de la zone</h2>
            <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-wrap">{parc.description}</p>
          </div>
        </div>

        {/* Colonne Droite : Dashboards */}
        <div className="space-y-8">
          {/* Météo Locale */}
          <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6">Conditions en direct</h3>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-4xl font-bold text-stone-900">{weather?.temperature || '??'}°C</span>
                <p className="text-xs text-stone-500 mt-1">Température de l&apos;air</p>
              </div>
              <div className="p-4 bg-white rounded-2xl shadow-sm">
                {weather?.weathercode === 0 ? <Sun className="h-8 w-8 text-orange-400" /> : <Cloud className="h-8 w-8 text-blue-400" />}
              </div>
            </div>
          </div>

          {/* Stats Spatiales (Mocked for now) */}
          <div className="bg-green-600 p-8 rounded-3xl shadow-xl shadow-green-600/20 text-white">
            <h3 className="text-sm font-bold text-green-200 uppercase tracking-widest mb-8">Analyse Biodiversité</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                <Leaf className="h-5 w-5 mb-2 text-green-300" />
                <span className="block text-3xl font-bold">120+</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Espèces</span>
              </div>
              <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                <Activity className="h-5 w-5 mb-2 text-green-300" />
                <span className="block text-3xl font-bold">45</span>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Observations</span>
              </div>
            </div>
            <button className="w-full mt-8 py-3 bg-white text-green-700 font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-stone-50 transition-all">Voir sur la carte SIG</button>
          </div>

          {/* Fiche Technique */}
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6">Fiche Technique</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-stone-50">
                <span className="text-xs text-stone-500 font-medium">Superficie</span>
                <span className="text-xs font-bold text-stone-900">{parc.areaKm2} km²</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-stone-50">
                <span className="text-xs text-stone-500 font-medium">Surveillance</span>
                <span className="text-xs font-bold text-green-600">24h/24 (SIG)</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs text-stone-500 font-medium">Risque incendie</span>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-tighter italic">Faible (NASA FIRMS)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
