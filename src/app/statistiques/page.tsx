import React from 'react';
import { getStatistics } from '@/lib/actions';
import { BarChart3, PieChart, Activity, ShieldCheck, Leaf, Users, ArrowUpRight, Trophy, Globe } from 'lucide-react';
import StatistiquesClient from './StatistiquesClient';

export default async function StatistiquesPage() {
  const stats = await getStatistics();

  if (!stats) return <div className="flex justify-center py-24">Erreur lors du chargement des statistiques.</div>;

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

      <StatistiquesClient stats={stats} />
    </div>
  );
}
