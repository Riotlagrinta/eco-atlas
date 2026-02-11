'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Target, Users, Calendar, ArrowRight, Loader2, Trophy, MapPin, MessageSquare, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMessages = async (missionId: string) => {
    const { data } = await supabase
      .from('mission_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('mission_id', missionId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Connectez-vous pour discuter !");

    await supabase.from('mission_messages').insert([{
      mission_id: selectedMission?.id,
      user_id: user.id,
      content: newMessage
    }]);
    setNewMessage('');
    fetchMessages(selectedMission!.id);
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <AnimatePresence>
        {selectedMission && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col h-[80vh]">
              <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><MessageSquare className="h-5 w-5" /></div>
                  <div><h3 className="font-bold text-stone-900 leading-tight">{selectedMission.title}</h3><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Canal de coordination</p></div>
                </div>
                <button onClick={() => setSelectedMission(null)} className="p-2 hover:bg-white rounded-xl transition-all"><X className="h-5 w-5 text-stone-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((m) => (
                  <div key={m.id} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-stone-200">{m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} /> : <Users className="h-5 w-5 text-stone-300" />}</div>
                    <div className="flex-1">
                      <div className="bg-stone-50 p-4 rounded-2xl rounded-tl-none border border-stone-100">
                        <p className="font-bold text-xs text-stone-900 mb-1">{m.profiles?.full_name}</p>
                        <p className="text-sm text-stone-600 leading-relaxed">{m.content}</p>
                      </div>
                      <span className="text-[9px] font-bold text-stone-400 ml-2 mt-1 block uppercase">{new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 bg-stone-50/50 border-t border-stone-100 relative">
                <input type="text" placeholder="Envoyez un message à l'équipe..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full pl-6 pr-12 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm" />
                <button type="submit" className="absolute right-9 top-9 p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"><Send className="h-4 w-4" /></button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                    <button 
                      onClick={() => {
                        setSelectedMission(mission);
                        fetchMessages(mission.id);
                      }}
                      className="bg-stone-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-green-600 transition-all flex items-center shadow-lg shadow-stone-900/10"
                    >
                      Discuter <MessageSquare className="ml-2 h-4 w-4" />
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
