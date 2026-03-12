'use client';

import React, { useState } from 'react';
import { Calendar, Users, Send, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createBooking } from '@/lib/actions';
import { useSession } from 'next-auth/react';

interface BookingFormProps {
    trailId: string;
    trailName: string;
}

export function BookingForm({ trailId, trailName }: BookingFormProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        participants: 1,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return toast.error('Connectez-vous pour réserver.');

        setLoading(true);
        const res = await createBooking({
            trailId,
            bookingDate: formData.date,
            participants: formData.participants,
        });

        if (res.success) {
            setSuccess(true);
            toast.success('Réservation envoyée !');
        } else {
            toast.error('Erreur lors de la réservation');
        }
        setLoading(false);
    };

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-100 p-8 rounded-3xl text-center"
            >
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-200">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-2">Demande envoyée !</h3>
                <p className="text-green-700 text-sm mb-6">
                    Votre demande de réservation pour <strong>{trailName}</strong> est en cours de traitement. Notre guide local vous contactera bientôt.
                </p>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-green-600 font-bold text-sm hover:underline"
                >
                    Faire une autre réservation
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-stone-100 shadow-xl p-8 sticky top-24">
            <h3 className="text-2xl font-black text-stone-900 mb-6">Réserver votre sortie</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2 ml-1">Date souhaitée</label>
                    <div className="relative">
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-green-500 transition-all text-sm"
                        />
                        <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2 ml-1">Nombre de participants</label>
                    <div className="relative">
                        <input
                            type="number"
                            required
                            min="1"
                            max="15"
                            value={formData.participants}
                            onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) })}
                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:border-green-500 transition-all text-sm"
                        />
                        <Users className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
                    </div>
                </div>

                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-6">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">Total estimé</p>
                    <p className="text-xl font-black text-green-600">Gratuit <span className="text-xs text-stone-400 font-normal ml-1">(Eco-Atlas est une plateforme citoyenne)</span></p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold shadow-lg hover:bg-green-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> Envoyer la demande</>}
                </button>

                <p className="text-center text-[10px] text-stone-400">
                    Vos données sont transmises uniquement au guide local certifié en charge de ce parcours.
                </p>
            </form>
        </div>
    );
}
