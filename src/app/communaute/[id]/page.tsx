'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ThumbsUp, MessageCircle, Loader2, Send, CheckCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { addXP, XP_REWARDS, incrementChallengeProgress } from '@/lib/gamification';
import Link from 'next/link';

interface ThreadDetail {
    id: string;
    title: string;
    content: string;
    author_id: string;
    category: string;
    image_url: string | null;
    upvotes: number;
    replies_count: number;
    created_at: string;
    profiles: { full_name: string; avatar_url: string | null }[] | null;
}

interface Reply {
    id: string;
    content: string;
    author_id: string;
    is_expert_answer: boolean;
    upvotes: number;
    created_at: string;
    profiles: { full_name: string; avatar_url: string | null }[] | null;
}

export default function ThreadPage() {
    const params = useParams();
    const router = useRouter();
    const threadId = params.id as string;
    const supabase = createClient();

    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [newReply, setNewReply] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);

        const { data: threadData } = await supabase
            .from('forum_threads')
            .select('*, profiles:author_id(full_name, avatar_url)')
            .eq('id', threadId)
            .single();
        setThread(threadData as unknown as ThreadDetail);

        const { data: repliesData } = await supabase
            .from('forum_replies')
            .select('*, profiles:author_id(full_name, avatar_url)')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });
        setReplies((repliesData as unknown as Reply[]) || []);

        setLoading(false);
    }, [supabase, threadId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newReply.trim()) return;

        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('Connectez-vous pour répondre.');
            setSubmitting(false);
            return;
        }

        const { error } = await supabase.from('forum_replies').insert({
            thread_id: threadId,
            author_id: user.id,
            content: newReply.trim(),
        });

        if (error) {
            toast.error('Erreur : ' + error.message);
        } else {
            // Incrémenter le compteur de réponses
            await supabase.from('forum_threads')
                .update({ replies_count: (thread?.replies_count || 0) + 1 })
                .eq('id', threadId);

            // +XP
            await addXP(user.id, XP_REWARDS.FORUM_REPLY, 'Réponse forum');
            await incrementChallengeProgress(user.id, 'observations');
            toast.success('+5 XP 🎮');

            setNewReply('');
            fetchData();
        }
        setSubmitting(false);
    };

    const handleUpvote = async (type: 'thread' | 'reply', id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error('Connectez-vous pour voter.');

        const table = type === 'thread' ? 'forum_threads' : 'forum_replies';
        const current = type === 'thread' ? thread?.upvotes || 0 : replies.find(r => r.id === id)?.upvotes || 0;

        await supabase.from(table).update({ upvotes: current + 1 }).eq('id', id);
        await addXP(user.id, XP_REWARDS.VOTE_CAST, 'Vote forum');
        fetchData();
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return "À l'instant";
        if (hours < 24) return `il y a ${hours}h`;
        return `il y a ${Math.floor(hours / 24)}j`;
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    if (!thread) return <div className="text-center py-24 text-stone-400">Discussion introuvable</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Toaster position="bottom-center" />

            {/* Retour */}
            <Link href="/communaute" className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Retour au forum
            </Link>

            {/* Thread principal */}
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
                        <Image
                            src={thread.profiles?.[0]?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.profiles?.[0]?.full_name || 'U')}&background=3b82f6&color=fff`}
                            alt="Avatar" fill className="object-cover"
                        />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-stone-900 mb-1">{thread.title}</h1>
                        <p className="text-xs text-stone-400">
                            {thread.profiles?.[0]?.full_name || 'Anonyme'} · {timeAgo(thread.created_at)}
                        </p>
                    </div>
                </div>

                <p className="text-stone-600 leading-relaxed mb-4 whitespace-pre-wrap">{thread.content}</p>

                {thread.image_url && (
                    <div className="relative h-64 rounded-2xl overflow-hidden mb-4">
                        <Image src={thread.image_url} alt="Image" fill className="object-cover" />
                    </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-stone-100">
                    <button
                        onClick={() => handleUpvote('thread', thread.id)}
                        className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-blue-600 transition-colors"
                    >
                        <ThumbsUp className="h-4 w-4" /> {thread.upvotes}
                    </button>
                    <span className="flex items-center gap-1.5 text-sm text-stone-400">
                        <MessageCircle className="h-4 w-4" /> {replies.length} réponses
                    </span>
                </div>
            </div>

            {/* Réponses */}
            <div className="space-y-3 mb-8">
                {replies.map((reply, index) => (
                    <motion.div
                        key={reply.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-5 rounded-2xl border ${reply.is_expert_answer
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-stone-100'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
                                <Image
                                    src={reply.profiles?.[0]?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.profiles?.[0]?.full_name || 'U')}&background=22c55e&color=fff`}
                                    alt="Avatar" fill className="object-cover"
                                />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-stone-900 text-sm">{reply.profiles?.[0]?.full_name || 'Anonyme'}</span>
                                    {reply.is_expert_answer && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-lg">
                                            <Shield className="h-3 w-3" /> Expert
                                        </span>
                                    )}
                                    <span className="text-[10px] text-stone-300">{timeAgo(reply.created_at)}</span>
                                </div>
                                <p className="text-sm text-stone-600 whitespace-pre-wrap">{reply.content}</p>
                                <button
                                    onClick={() => handleUpvote('reply', reply.id)}
                                    className="flex items-center gap-1 text-xs text-stone-300 hover:text-blue-500 mt-2 transition-colors"
                                >
                                    <ThumbsUp className="h-3 w-3" /> {reply.upvotes}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Formulaire de réponse */}
            <form onSubmit={handleReply} className="sticky bottom-4 bg-white rounded-2xl border border-stone-200 shadow-xl p-4 flex gap-3">
                <input
                    type="text"
                    placeholder="Votre réponse..."
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    className="flex-1 px-4 py-3 bg-stone-50 rounded-xl text-sm outline-none"
                    required
                />
                <button
                    type="submit" disabled={submitting}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </form>
        </div>
    );
}
