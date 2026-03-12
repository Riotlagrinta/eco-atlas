'use client';

import React, { useState } from 'react';
import { BarChart3, PieChart, Activity, ShieldCheck, Leaf, Users, ArrowUpRight, Trophy, Globe } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { TogoRegionalMap } from '@/components/TogoRegionalMap';

interface StatistiquesClientProps {
  stats: any;
}

export default function StatistiquesClient({ stats }: StatistiquesClientProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  return (
    <>
      {/* NOUVEAU : PALMARÈS DES RÉGIONS */}
      <div className="mb-12 bg-stone-50 rounded-3xl p-8 border border-stone-100">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-600" /> Ligue des Régions du Togo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.regionalRank.sort((a: any, b: any) => b.count - a.count).map((reg: any, i: number) => (
                <div
                  key={i}
                  onClick={() => setSelectedRegion(reg.name === selectedRegion ? null : reg.name)}
                  className={cn(
                    "p-6 rounded-2xl border transition-all cursor-pointer",
                    selectedRegion === reg.name ? "bg-green-600 border-green-600 shadow-lg shadow-green-600/20" : "bg-white border-stone-100 hover:border-green-200"
                  )}
                >
                  <span className={cn("text-[10px] font-bold uppercase mb-2 block", selectedRegion === reg.name ? "text-green-100" : "text-stone-400")}>{reg.name}</span>
                  <span className={cn("block text-3xl font-bold", selectedRegion === reg.name ? "text-white" : "text-stone-900")}>{reg.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/3 flex flex-col items-center">
            <TogoRegionalMap
              activeRegion={selectedRegion}
              onRegionClick={(r) => setSelectedRegion(r === selectedRegion ? null : r)}
              regionalData={stats.regionalRank}
            />
            <p className="text-[10px] text-stone-400 mt-6 font-bold uppercase tracking-widest italic">Carte interactive du territoire</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-stone-50 rounded-3xl p-8 border border-stone-100 min-h-[300px]">
          <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-600" /> Évolution des Signalements ({new Date().getFullYear()})
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Line type="monotone" dataKey="signalements" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
          <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" /> Top Sentinelles
          </h3>
          <div className="space-y-6">
            {stats.leaderboard.map((user: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center font-bold text-xs text-stone-500">{i + 1}</div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{user.full_name || 'Éco-citoyen'}</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">{user.role}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600">+{user.obs_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-stone-50 rounded-3xl p-8 border border-stone-100">
          <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-green-600" /> État de la Biodiversité
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byStatus}>
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.byStatus.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center">Tendances</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg mt-1"><ArrowUpRight className="h-4 w-4" /></div>
                <div><p className="text-sm font-bold text-stone-900">Engagement en hausse</p><p className="text-xs text-stone-500 mt-1">Les signalements ont augmenté de 15% au Togo.</p></div>
              </div>
            </div>
          </div>
          <button onClick={() => window.print()} className="w-full mt-12 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 mr-2" /> Rapport PDF
          </button>
        </div>
      </div>
    </>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
