'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, Users, Eye, Database, Download, Filter, 
  Map as MapIcon, Calendar, ArrowUpRight, ArrowDownRight,
  Loader2, ShieldCheck, Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'];

export default function InstitutionalDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      
      // Simuler des données analytiques (en production, ces données viendraient de vues Supabase ou d'agrégations)
      const { data: obsData } = await supabase
        .from('observations')
        .select('created_at, is_verified, species_id');
      
      const { data: userData } = await supabase
        .from('profiles')
        .select('region, created_at');

      // Agrégation basique pour les graphiques
      const obsByDate: any = {};
      obsData?.forEach((o: any) => {
        const date = new Date(o.created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        obsByDate[date] = (obsByDate[date] || 0) + 1;
      });

      const chartData = Object.keys(obsByDate).map(key => ({
        name: key,
        value: obsByDate[key]
      })).slice(-10);

      const regionMap: any = {};
      userData?.forEach((u: any) => {
        if (u.region) regionMap[u.region] = (regionMap[u.region] || 0) + 1;
      });

      const pieData = Object.keys(regionMap).map(key => ({
        name: key,
        value: regionMap[key]
      }));

      setStats({
        totalObservations: obsData?.length || 0,
        verifiedRate: Math.round(((obsData?.filter((o: any) => o.is_verified).length || 0) / (obsData?.length || 1)) * 100),
        totalUsers: userData?.length || 0,
        activePartners: 12, // Placeholder
        chartData,
        pieData
      });
      
      setLoading(false);
    }
    fetchStats();
  }, [supabase, timeRange]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
      <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
      <p className="text-stone-500 font-bold animate-pulse">Chargement de l'Atlas Analytique...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50/50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-stone-900 flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-600" />
              Tableau de Bord Institutionnel
            </h1>
            <p className="text-stone-500 mt-1 font-medium italic">Analyse de la biodiversité du Togo en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-1 flex shadow-sm">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === range ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all">
              <Download className="h-4 w-4" /> EXPORTER
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Observations', value: stats.totalObservations, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+12%' },
            { label: 'Taux de Validation', value: `${stats.verifiedRate}%`, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50', trend: '+5%' },
            { label: 'Membres Actifs', value: stats.totalUsers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+8%' },
            { label: 'Données Partagées', value: '4.2GB', icon: Database, color: 'text-amber-600', bg: 'bg-amber-50', trend: '+20%' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color}`}><kpi.icon className="h-6 w-6" /></div>
                <span className={`flex items-center text-[10px] font-bold px-2 py-1 rounded-lg bg-green-50 text-green-600`}>
                  <TrendingUp className="h-3 w-3 mr-1" /> {kpi.trend}
                </span>
              </div>
              <h3 className="text-3xl font-black text-stone-900">{kpi.value}</h3>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Growth Chart */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-stone-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" /> Tendance des Observations
              </h3>
              <select className="bg-stone-50 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
                <option>Par jour</option>
                <option>Par semaine</option>
              </select>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Regional Distribution */}
          <div className="bg-white p-8 rounded-[40px] border border-stone-100 shadow-sm">
            <h3 className="font-black text-stone-900 mb-8 flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-blue-600" /> Répartition Régionale
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-6">
              {stats.pieData.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs font-bold text-stone-600">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-stone-900">{Math.round((item.value / stats.totalUsers) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section: API Status & Recent Partners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-stone-900 rounded-[40px] p-8 text-white">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-green-400" /> État des Services API
            </h3>
            <div className="space-y-4">
              {[
                { name: 'Observations V1', status: 'Opérationnel', load: '12%', color: 'bg-green-500' },
                { name: 'Identification IA', status: 'Opérationnel', load: '24%', color: 'bg-green-500' },
                { name: 'Export Service', status: 'Maintenance', load: '0%', color: 'bg-amber-500' },
              ].map((service, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div>
                    <p className="font-bold text-sm">{service.name}</p>
                    <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">{service.status}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold">{service.load}</span>
                    <div className={`w-2 h-2 rounded-full ${service.color} shadow-[0_0_10px_rgba(22,163,74,0.5)]`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-8 border border-stone-100 shadow-sm">
            <h3 className="font-black text-stone-900 mb-6 flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-600" /> Partenaires Récents
            </h3>
            <div className="space-y-6">
              {[
                { name: 'PNUD Togo', date: 'il y a 2h', actions: 1420 },
                { name: 'Université de Lomé', date: 'il y a 5h', actions: 890 },
                { name: 'ONG Compassion', date: 'Hier', actions: 310 },
              ].map((partner, i) => (
                <div key={i} className="flex items-center justify-between border-b border-stone-50 pb-4 last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center font-black text-stone-400 text-xs">
                      {partner.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm">{partner.name}</p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase">{partner.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-600 text-sm">+{partner.actions}</p>
                    <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">Requêtes API</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-4 bg-stone-50 text-stone-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-all">
                Voir tous les partenaires
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
