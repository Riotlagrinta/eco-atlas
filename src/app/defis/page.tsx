'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getActiveChallenges, getUserChallenges } from '@/lib/gamification';
import { createClient } from '@/lib/supabase/client';
import { Target, Clock, Zap, Loader2, CheckCircle, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Challenge {
    id: string;
    title: string;
    description: string;
    xp_reward: number;
    target_type: string;
    target_count: number;
    start_date: string;
    end_date: string;
    image_url: string;
    is_active: boolean;
}

interface UserChallenge {
    challenge_id: string;
    progress: number;
    completed: boolean;
    completed_at: string | null;
    challenges: Challenge;
}

export default function DefisPage() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [userProgress, setUserProgress] = useState<UserChallenge[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        const activeChallenges = await getActiveChallenges();
        setChallenges(activeChallenges as Challenge[]);

        if (user) {
            const progress = await getUserChallenges(user.id);
            setUserProgress(progress as UserChallenge[]);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getProgressForChallenge = (challengeId: string) => {
        return userProgress.find(p => p.challenge_id === challengeId);
    };

    const getTimeRemaining = (endDate: string) => {
        const diff = new Date(endDate).getTime() - Date.now();
        if (diff <= 0) return 'Terminé';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}j ${hours}h restants`;
        return `${hours}h restantes`;
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            observations: '📸 Observations',
            species: '🦎 Espèces',
            alerts: '🚨 Alertes',
            quiz: '🧠 Quiz',
            login: '🔑 Connexions',
        };
        return labels[type] || type;
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-purple-100 rounded-3xl text-purple-600 mb-4">
                    <Target className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-black text-stone-900">Défis de la Semaine</h1>
                <p className="text-stone-500 mt-2">Relevez des défis pour gagner de l&apos;XP bonus !</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            ) : challenges.length === 0 ? (
                <div className="text-center py-20 text-stone-400">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Aucun défi actif pour le moment</p>
                    <p className="text-sm mt-1">De nouveaux défis arrivent bientôt !</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {challenges.map((challenge, index) => {
                        const progress = getProgressForChallenge(challenge.id);
                        const progressPercent = progress
                            ? Math.min(100, (progress.progress / challenge.target_count) * 100)
                            : 0;
                        const isCompleted = progress?.completed || false;

                        return (
                            <motion.div
                                key={challenge.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative overflow-hidden rounded-3xl border transition-all ${isCompleted
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-white border-stone-100 shadow-sm hover:shadow-md'
                                    }`}
                            >
                                {/* Image en-tête */}
                                {challenge.image_url && (
                                    <div className="relative h-32 w-full">
                                        <Image
                                            src={challenge.image_url}
                                            alt={challenge.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-3 left-4 right-4">
                                            <p className="text-white font-black text-lg leading-tight">{challenge.title}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="p-5">
                                    {!challenge.image_url && (
                                        <h3 className="font-black text-stone-900 text-lg mb-1">{challenge.title}</h3>
                                    )}
                                    <p className="text-sm text-stone-500 mb-4">{challenge.description}</p>

                                    {/* Infos */}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold">
                                            <Zap className="h-3 w-3" /> +{challenge.xp_reward} XP
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-600 rounded-xl text-xs font-bold">
                                            {getTypeLabel(challenge.target_type)}
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-xl text-xs font-bold">
                                            <Clock className="h-3 w-3" /> {getTimeRemaining(challenge.end_date)}
                                        </span>
                                    </div>

                                    {/* Barre de progression */}
                                    <div className="relative">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-bold text-stone-600">
                                                {progress?.progress || 0} / {challenge.target_count}
                                            </span>
                                            {isCompleted && (
                                                <span className="text-green-600 font-bold flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> Complété !
                                                </span>
                                            )}
                                        </div>
                                        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-purple-500'}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                transition={{ duration: 1, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </div>

                                    {isCompleted && (
                                        <motion.div
                                            className="mt-4 flex items-center gap-2 text-green-600"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <Gift className="h-4 w-4" />
                                            <span className="text-sm font-bold">+{challenge.xp_reward} XP récoltés !</span>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
