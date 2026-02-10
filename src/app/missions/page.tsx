'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Target, Users, Calendar, ArrowRight, Loader2, Trophy, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Mission {
  id: string;
  title: string;
  description: string;
  target_count: number;
  current_count: number;
  image_url: string;
  status: string;
  end_date: string;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMissions() {
      const { data } = await supabase
        .from('missions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (data) setMissions(data);
      setLoading(false);
    }
    fetchMissions();
  }, [supabase]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 flex items-center justify-center">
          <Target className="h-10 w-10 text-green-600 mr-4" /> Missions Vertes
        </h1>
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
          Participez à des actions de terrain ciblées et aidez les scientifiques à mieux comprendre notre nature.
        </p>
      </div>

      {missions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {missions.map((mission, index) => {
            const progress = (mission.current_count / mission.target_count) * 100;
            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden flex flex-col lg:flex-row h-full"
              >
                <div className="lg:w-1/3 h-48 lg:h-auto relative bg-stone-100">
                  <img src={mission.image_url || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80'} className="w-full h-full object-cover" alt="Mission" />
                  <div className="absolute top-4 left-4 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">Actif</div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-3">{mission.title}</h3>
                    <p className="text-stone-500 text-sm mb-6 leading-relaxed">{mission.description}</p>
                    
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-xs font-bold text-stone-400 uppercase">
                        <span>Progression</span>
                        <span className="text-green-600">{mission.current_count} / {mission.target_count} signalements</span>
                      </div>
                      <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-50">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                        ></motion.div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-stone-50">
                    <div className="flex items-center text-stone-400 text-xs font-medium">
                      <Calendar className="h-4 w-4 mr-1" /> Expire le {new Date(mission.end_date).toLocaleDateString('fr-FR')}
                    </div>
                    <button className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-all flex items-center">
                      Participer <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
          <Trophy className="h-12 w-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Toutes les missions ont été accomplies. Revenez bientôt !</p>
        </div>
      )}
    </div>
  );
}
