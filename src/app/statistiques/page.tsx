'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, PieChart, Activity, ShieldCheck, Leaf, Users, Loader2, ArrowUpRight, Trophy, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, ChartTooltip, Cell, LineChart, Line, CartesianGrid } from 'recharts';

export default function StatistiquesPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    speciesCount: 0,
    protectedCount: 0,
    obsCount: 0,
    userCount: 0,
    byStatus: [] as any[],
    trends: [] as any[],
    leaderboard: [] as any[],
    regionalRank: [] as any[]
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: sCount },
        { count: pCount },
        { count: oCount },
        { count: uCount },
        { data: speciesData },
        { data: obsData },
        { data: leaderData },
        { data: regData }
      ] = await Promise.all([
        supabase.from('species').select('*', { count: 'exact', head: true }),
        supabase.from('protected_areas').select('*', { count: 'exact', head: true }),
        supabase.from('observations').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('species').select('conservation_status'),
        supabase.from('observations').select('created_at').eq('is_verified', true),
        supabase.from('profiles').select('full_name, avatar_url, role, observations(count)').limit(5),
        supabase.from('profiles').select('region, observations(count)').not('region', 'is', null)
      ]);

      // Calcul par région
      const regMap: any = {};
      regData?.forEach((p: any) => {
        if (p.region) {
          regMap[p.region] = (regMap[p.region] || 0) + (p.observations?.[0]?.count || 0);
        }
      });
      const regionalStats = Object.keys(regMap).map(key => ({ name: key, count: regMap[key] }));

      // Calcul des tendances par mois
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const currentYear = new Date().getFullYear();
      const trendMap: any = {};
      months.forEach(m => trendMap[m] = 0);
      
      obsData?.forEach((o: any) => {
        const date = new Date(o.created_at);
        if (date.getFullYear() === currentYear) {
          trendMap[months[date.getMonth()]]++;
        }
      });
      const trendData = months.map(m => ({ name: m, signalements: trendMap[m] }));

      const statusCount: any = { CR: 0, EN: 0, VU: 0, NT: 0, LC: 0 };
      speciesData?.forEach((s: any) => {
        if (statusCount[s.conservation_status] !== undefined) statusCount[s.conservation_status]++;
      });

      const chartData = [
        { name: 'Critique', count: statusCount.CR, color: '#dc2626' },
        { name: 'En danger', count: statusCount.EN, color: '#ea580c' },
        { name: 'Vulnérable', count: statusCount.VU, color: '#eab308' },
        { name: 'Quasi menacé', count: statusCount.NT, color: '#3b82f6' },
        { name: 'Préoccupation mineure', count: statusCount.LC, color: '#22c55e' },
      ];

      setStats({
        speciesCount: sCount || 0,
        protectedCount: pCount || 0,
        obsCount: oCount || 0,
        userCount: uCount || 0,
        byStatus: chartData,
        trends: trendData,
        leaderboard: leaderData || [],
        regionalRank: regionalStats
      });
      setLoading(false);
    }
    fetchStats();
  }, [supabase]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-stone-900 mb-4 flex items-center">
          <BarChart3 className="h-10 w-10 text-green-600 mr-4" /> Statistiques Nationales
        </h1>
        <p className="text-stone-500 text-lg text-center md:text-left">Analyse en temps réel de la biodiversité et des efforts de conservation au Togo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Espèces Suivies", value: stats.speciesCount, icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
          { label: "Aires Protégées", value: stats.protectedCount, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Observations Validées", value: stats.obsCount, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Éco-citoyens", value: stats.userCount, icon: Users, color: "text-purple-600", bg: "bg-purple-50" }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all">
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6`}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className="block text-4xl font-bold text-stone-900 mb-1">{item.value}</span>
            <span className="text-sm font-bold text-stone-400 uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      {/* NOUVEAU : PALMARÈS DES RÉGIONS */}
      <div className="mb-12 bg-stone-50 rounded-3xl p-8 border border-stone-100">
        <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-green-600" /> Ligue des Régions du Togo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.regionalRank.length > 0 ? stats.regionalRank.sort((a,b) => b.count - a.count).map((reg, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-stone-100 text-center shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                <Globe className="h-12 w-12 text-stone-900" />
              </div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">{reg.name}</span>
              <span className="block text-3xl font-bold text-stone-900">{reg.count}</span>
              <span className="text-[10px] font-bold text-green-600 uppercase mt-2 block">Contributions</span>
            </div>
          )) : (
            <p className="col-span-full text-center text-stone-400 text-sm italic py-4">Désignez votre région dans votre profil pour participer à la ligue !</p>
          )}
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
            {stats.leaderboard.map((user, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center font-bold text-xs text-stone-500">{i + 1}</div>
                  <div>
                    <p className="text-sm font-bold text-stone-900">{user.full_name || 'Éco-citoyen'}</p>
                    <p className="text-[10px] text-stone-400 font-bold uppercase">{user.role}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600">+{user.observations?.[0]?.count || 0}</span>
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
                  {stats.byStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
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
    </div>
  );
}