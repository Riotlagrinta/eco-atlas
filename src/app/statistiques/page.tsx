'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart3, PieChart, Activity, ShieldCheck, Leaf, Users, Loader2, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatistiquesPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    speciesCount: 0,
    protectedCount: 0,
    obsCount: 0,
    userCount: 0,
    byStatus: { CR: 0, EN: 0, VU: 0, LC: 0, NT: 0 }
  });

  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const [
        { count: sCount },
        { count: pCount },
        { count: oCount },
        { count: uCount },
        { data: speciesData }
      ] = await Promise.all([
        supabase.from('species').select('*', { count: 'exact', head: true }),
        supabase.from('protected_areas').select('*', { count: 'exact', head: true }),
        supabase.from('observations').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('species').select('conservation_status')
      ]);

      const statusMap: any = { CR: 0, EN: 0, VU: 0, LC: 0, NT: 0 };
      speciesData?.forEach((s: any) => {
        if (statusMap[s.conservation_status] !== undefined) {
          statusMap[s.conservation_status]++;
        }
      });

      setStats({
        speciesCount: sCount || 0,
        protectedCount: pCount || 0,
        obsCount: oCount || 0,
        userCount: uCount || 0,
        byStatus: statusMap
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
        <p className="text-stone-500 text-lg">Analyse en temps réel de la biodiversité et des efforts de conservation au Togo.</p>
      </div>

      {/* Cartes de Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Espèces Suivies", value: stats.speciesCount, icon: Leaf, color: "text-green-600", bg: "bg-green-50" },
          { label: "Aires Protégées", value: stats.protectedCount, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Observations Validées", value: stats.obsCount, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Éco-citoyens", value: stats.userCount, icon: Users, color: "text-purple-600", bg: "bg-purple-50" }
        ].map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-6`}>
              <item.icon className="h-6 w-6" />
            </div>
            <span className="block text-4xl font-bold text-stone-900 mb-1">{item.value}</span>
            <span className="text-sm font-bold text-stone-400 uppercase tracking-widest">{item.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* État de conservation */}
        <div className="lg:col-span-2 bg-stone-50 rounded-3xl p-8 border border-stone-100">
          <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-green-600" /> Répartition par Statut UICN
          </h3>
          <div className="space-y-6">
            {[
              { id: 'CR', label: 'En danger critique', color: 'bg-red-600' },
              { id: 'EN', label: 'En danger', color: 'bg-orange-500' },
              { id: 'VU', label: 'Vulnérable', color: 'bg-yellow-500' },
              { id: 'NT', label: 'Quasi menacé', color: 'bg-blue-500' },
              { id: 'LC', label: 'Préoccupation mineure', color: 'bg-green-500' }
            ].map((status) => {
              const count = (stats.byStatus as any)[status.id] || 0;
              const percentage = stats.speciesCount > 0 ? (count / stats.speciesCount) * 100 : 0;
              return (
                <div key={status.id}>
                  <div className="flex justify-between mb-2 items-end">
                    <span className="text-sm font-bold text-stone-700">{status.label}</span>
                    <span className="text-xs font-bold text-stone-400">{count} espèces ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-stone-200 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className={`h-full ${status.color}`}
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rapports récents */}
        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm">
          <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
            Dernières Tendances
          </h3>
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg mt-1">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">Engagement en hausse</p>
                <p className="text-xs text-stone-500 mt-1">Le nombre de signalements citoyens a augmenté de 15% ce mois-ci au Togo.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mt-1">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">Zones Sécurisées</p>
                <p className="text-xs text-stone-500 mt-1">Fazao-Malfakassa reste la zone la mieux documentée de l'Atlas.</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="w-full mt-12 py-4 bg-stone-900 text-white font-bold rounded-2xl hover:bg-stone-800 transition-all flex items-center justify-center"
          >
            <ShieldCheck className="h-5 w-5 mr-2" /> Générer le Bilan Officiel
          </button>
        </div>
      </div>
    </div>
  );
}
