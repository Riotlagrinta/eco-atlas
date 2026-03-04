'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, Users, CreditCard, ChevronRight, 
  Loader2, CheckCircle, Smartphone 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

interface BookingFormProps {
  trailId: string;
  guideId: string;
  pricePerPerson: number;
}

export default function BookingForm({ trailId, guideId, pricePerPerson }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    participants: 1,
    paymentMethod: 'tmoney'
  });

  const supabase = createClient();

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Connectez-vous pour réserver !');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('trail_bookings').insert({
      trail_id: trailId,
      guide_id: guideId,
      user_id: user.id,
      date: formData.date,
      participants: formData.participants,
      payment_method: formData.paymentMethod,
      total_price: formData.participants * pricePerPerson,
      status: 'pending'
    });

    if (error) {
      toast.error('Erreur : ' + error.message);
    } else {
      setStep(3);
      toast.success('Demande de réservation envoyée !');
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden sticky top-24">
      <Toaster position="bottom-center" />
      
      <div className="p-6 border-b border-stone-100 bg-stone-900 text-white">
        <h3 className="font-black text-lg">Réserver ce circuit</h3>
        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">À partir de {pricePerPerson} FCFA / pers.</p>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Date de l'expédition
                </label>
                <input 
                  type="date" 
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 font-bold transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Users className="h-3 w-3" /> Nombre de participants
                </label>
                <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-2xl border border-stone-100">
                  <button 
                    onClick={() => setFormData({...formData, participants: Math.max(1, formData.participants - 1)})}
                    className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl hover:bg-stone-100 transition-all"
                  >-</button>
                  <span className="flex-1 text-center font-black text-lg">{formData.participants}</span>
                  <button 
                    onClick={() => setFormData({...formData, participants: formData.participants + 1})}
                    className="w-12 h-12 bg-white rounded-xl shadow-sm font-black text-xl hover:bg-stone-100 transition-all"
                  >+</button>
                </div>
              </div>

              <button 
                disabled={!formData.date}
                onClick={() => setStep(2)}
                className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 hover:bg-stone-800 transition-all"
              >
                ÉTAPE SUIVANTE <ChevronRight className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h4 className="text-sm font-black text-stone-900 mb-4">Mode de paiement local</h4>
              <div className="space-y-3">
                {[
                  { id: 'tmoney', label: 'T-Money', icon: Smartphone, color: 'border-blue-500 text-blue-600 bg-blue-50' },
                  { id: 'flooz', label: 'Moov Flooz', icon: Smartphone, color: 'border-amber-500 text-amber-600 bg-amber-50' },
                  { id: 'cash', label: 'Paiement sur place', icon: CreditCard, color: 'border-stone-200 text-stone-600 bg-stone-50' },
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setFormData({...formData, paymentMethod: method.id})}
                    className={`w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all ${formData.paymentMethod === method.id ? method.color : 'border-stone-50 text-stone-400 hover:border-stone-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      <method.icon className="h-5 w-5" />
                      <span className="font-bold text-sm">{method.label}</span>
                    </div>
                    {formData.paymentMethod === method.id && <CheckCircle className="h-5 w-5" />}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-stone-100">
                <div className="flex justify-between text-stone-900 mb-6">
                  <span className="font-bold text-sm">Total à payer</span>
                  <span className="font-black text-xl">{formData.participants * pricePerPerson} FCFA</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-xl font-bold text-xs"
                  >RETOUR</button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] py-4 bg-green-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'CONFIRMER'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-10 space-y-6"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="h-10 w-10" />
              </div>
              <div>
                <h4 className="text-xl font-black text-stone-900">Demande Envoyée !</h4>
                <p className="text-sm text-stone-500 mt-2 italic px-4">Le guide vous contactera prochainement pour confirmer l'expédition.</p>
              </div>
              <button 
                onClick={() => setStep(1)}
                className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold text-xs"
              >NOUVELLE RÉSERVATION</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
