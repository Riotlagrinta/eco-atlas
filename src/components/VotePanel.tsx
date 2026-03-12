'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, HelpCircle, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getObservationVotes, voteObservation, getAllSpecies } from '@/lib/actions';
import { useSession } from 'next-auth/react';

interface VotePanelProps {
    observationId: string;
    compact?: boolean;
    onVoteSuccess?: () => void;
}

export function VotePanel({ observationId, compact = false, onVoteSuccess }: VotePanelProps) {
    const { data: session } = useSession();
    const [votes, setVotes] = useState<any[]>([]);
    const [userVote, setUserVote] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [speciesList, setSpeciesList] = useState<any[]>([]);
    const [suggestedSpeciesId, setSuggestedSpeciesId] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [votesData, specData] = await Promise.all([
                getObservationVotes(observationId),
                getAllSpecies()
            ]);

            setVotes(votesData || []);
            setSpeciesList(specData || []);

            if (session?.user?.id && votesData) {
                const myVote = votesData.find((v: any) => v.userId === session.user?.id);
                if (myVote) setUserVote(myVote.vote);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [observationId, session]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleVote = async (vote: 'confirm' | 'reject' | 'unsure') => {
        if (!session) return toast.error('Connectez-vous pour voter.');

        const res = await voteObservation({
            observationId,
            vote,
            comment: comment.trim() || undefined,
            suggestedSpeciesId: suggestedSpeciesId || undefined
        });

        if (!res.success) {
            toast.error('Erreur lors du vote');
        } else {
            toast.success(`Vote enregistré !`);
            setUserVote(vote);
            setComment('');
            fetchData();
            if (onVoteSuccess) onVoteSuccess();
        }
    };

    const confirms = votes.filter(v => v.vote === 'confirm').length;
    const rejects = votes.filter(v => v.vote === 'reject').length;
    const unsures = votes.filter(v => v.vote === 'unsure').length;
    const total = votes.length;
    const consensusPercent = total > 0 ? Math.round((confirms / total) * 100) : 0;
    const isValidated = confirms >= 3 && consensusPercent >= 70;

    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-stone-300" />;

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                {isValidated && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        <CheckCircle className="h-3 w-3" /> Validé
                    </span>
                )}
                <span className="text-[10px] text-stone-400">
                    ✅{confirms} ❌{rejects} ❓{unsures}
                </span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-stone-100 p-5">
            <h4 className="font-black text-stone-900 text-sm mb-3 flex items-center gap-2">
                Validation collaborative
                {isValidated && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg font-bold">
                        <CheckCircle className="h-3 w-3" /> Consensus atteint
                    </span>
                )}
            </h4>

            <div className="relative h-4 rounded-full overflow-hidden bg-stone-100 mb-3">
                <motion.div
                    className="absolute inset-y-0 left-0 bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (confirms / total) * 100 : 0}%` }}
                    transition={{ duration: 0.6 }}
                />
                <motion.div
                    className="absolute inset-y-0 bg-red-400 rounded-full"
                    style={{ left: `${total > 0 ? (confirms / total) * 100 : 0}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${total > 0 ? (rejects / total) * 100 : 0}%` }}
                    transition={{ duration: 0.6 }}
                />
            </div>

            <div className="flex justify-between text-xs text-stone-400 mb-4">
                <span className="text-green-600 font-bold">✅ {confirms} confirmations</span>
                <span className="text-red-500 font-bold">❌ {rejects} rejets</span>
                <span className="text-stone-400 font-bold">❓ {unsures} incertains</span>
            </div>

            {!userVote ? (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleVote('confirm')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm hover:bg-green-100 border border-green-200 transition-all"
                        >
                            <ThumbsUp className="h-4 w-4" /> Confirmer
                        </button>
                        <button
                            onClick={() => handleVote('reject')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 border border-red-200 transition-all"
                        >
                            <ThumbsDown className="h-4 w-4" /> Rejeter
                        </button>
                        <button
                            onClick={() => handleVote('unsure')}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-50 text-stone-500 rounded-xl font-bold text-sm hover:bg-stone-100 border border-stone-200 transition-all"
                        >
                            <HelpCircle className="h-4 w-4" /> Incertain
                        </button>
                    </div>

                    <div className="flex flex-col gap-2">
                        <select
                            value={suggestedSpeciesId}
                            onChange={(e) => setSuggestedSpeciesId(e.target.value)}
                            className="w-full px-4 py-2 bg-stone-50 rounded-xl text-xs outline-none border border-stone-200 font-bold text-stone-600"
                        >
                            <option value="">Suggérer une espèce (optionnel)...</option>
                            {speciesList.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Commentaire optionnel..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-2 bg-stone-50 rounded-xl text-xs outline-none border border-stone-200"
                        />
                    </div>
                </div>
            ) : (
                <div className="text-center py-3 text-sm text-stone-400">
                    <span className="font-bold">
                        {userVote === 'confirm' ? '✅' : userVote === 'reject' ? '❌' : '❓'}
                    </span>{' '}
                    Vous avez voté · {total} votes au total
                </div>
            )}

            {votes.length > 0 && (
                <div className="mt-4 pt-3 border-t border-stone-100">
                    <p className="text-[10px] font-bold text-stone-300 uppercase tracking-wider mb-2">Derniers votes</p>
                    <div className="space-y-1">
                        {votes.slice(0, 5).map((v, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-stone-400">
                                <span>{v.vote === 'confirm' ? '✅' : v.vote === 'reject' ? '❌' : '❓'}</span>
                                <span className="font-bold text-stone-600">{v.user?.name || 'Anonyme'}</span>
                                {v.comment && <span className="text-stone-300">— {v.comment}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
