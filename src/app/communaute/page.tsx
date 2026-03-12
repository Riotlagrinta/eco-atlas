'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Plus, Loader2, ThumbsUp, MessageCircle, Pin, Search, Leaf, AlertTriangle, Map, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { getForumThreads, createForumThread } from '@/lib/actions';
import { useSession } from 'next-auth/react';

export const dynamic = "force-dynamic";

const CATEGORIES = [
    { key: 'all', label: 'Tous', icon: MessageSquare },
    { key: 'general', label: 'Général', icon: MessageCircle },
    { key: 'identification', label: 'Identification', icon: HelpCircle },
    { key: 'alert', label: 'Alertes', icon: AlertTriangle },
    { key: 'parc', label: 'Parcs', icon: Map },
    { key: 'species', label: 'Espèces', icon: Leaf },
];

export default function CommunautePage() {
    const { data: session } = useSession();
    const [threads, setThreads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [showNewThread, setShowNewThread] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newCategory, setNewCategory] = useState('general');
    const [submitting, setSubmitting] = useState(false);

    const fetchThreadsData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getForumThreads(category, search);
            setThreads(data || []);
        } catch (err) {
            toast.error("Erreur de chargement");
        } finally {
            setLoading(false);
        }
    }, [category, search]);

    useEffect(() => {
        fetchThreadsData();
    }, [fetchThreadsData]);

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) return;

        setSubmitting(true);
        if (!session) {
            toast.error('Connectez-vous pour publier.');
            setSubmitting(false);
            return;
        }

        const res = await createForumThread({
            title: newTitle.trim(),
            content: newContent.trim(),
            category: newCategory,
        });

        if (!res.success) {
            toast.error('Erreur lors de la création');
        } else {
            toast.success('Discussion créée !');
            setNewTitle('');
            setNewContent('');
            setShowNewThread(false);
            fetchThreadsData();
        }
        setSubmitting(false);
    };

    const timeAgo = (dateStr: any) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return 'À l\'instant';
        if (hours < 24) return `il y a ${hours}h`;
        const days = Math.floor(hours / 24);
        return `il y a ${days}j`;
    };

    const getCategoryBadge = (cat: string) => {
        const colors: Record<string, string> = {
            general: 'bg-stone-100 text-stone-600',
            identification: 'bg-blue-50 text-blue-600',
            alert: 'bg-red-50 text-red-600',
            parc: 'bg-green-50 text-green-600',
            species: 'bg-emerald-50 text-emerald-700',
        };
        const labels: Record<string, string> = {
            general: '💬 Général', identification: '🔍 Identification',
            alert: '🚨 Alerte', parc: '🌿 Parc', species: '🦎 Espèce',
        };
        return (
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${colors[cat] || 'bg-stone-100 text-stone-500'}`}>
                {labels[cat] || cat}
            </span>
        );
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Toaster position="bottom-center" />

            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-blue-100 rounded-3xl text-blue-600 mb-4">
                    <MessageSquare className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-black text-stone-900">Communauté</h1>
                <p className="text-stone-500 mt-2">Échangez avec les naturalistes du Togo</p>
            </div>

            <div className="flex gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300" />
                    <input
                        type="text"
                        placeholder="Rechercher une discussion..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-2xl text-sm outline-none focus:border-blue-400 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setShowNewThread(!showNewThread)}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/30 transition-all"
                >
                    <Plus className="h-4 w-4" /> Nouveau
                </button>
            </div>

            {showNewThread && (
                <motion.form
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleCreateThread}
                    className="bg-white border border-stone-200 rounded-3xl p-6 mb-8 shadow-sm"
                >
                    <h3 className="font-black text-stone-900 mb-4">Nouveau sujet</h3>
                    <input
                        type="text" placeholder="Titre de la discussion"
                        value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-stone-200 rounded-2xl text-sm mb-3 outline-none focus:border-blue-400"
                        required
                    />
                    <textarea
                        placeholder="Décrivez votre sujet..."
                        value={newContent} onChange={(e) => setNewContent(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border border-stone-200 rounded-2xl text-sm mb-3 outline-none focus:border-blue-400 resize-none"
                        required
                    />
                    <div className="flex items-center justify-between">
                        <select
                            value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                            className="px-4 py-2 border border-stone-200 rounded-xl text-sm bg-white outline-none"
                        >
                            <option value="general">💬 Général</option>
                            <option value="identification">🔍 Identification</option>
                            <option value="alert">🚨 Alerte</option>
                            <option value="parc">🌿 Parc</option>
                            <option value="species">🦎 Espèce</option>
                        </select>
                        <button
                            type="submit" disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publier'}
                        </button>
                    </div>
                </motion.form>
            )}

            <div className="flex flex-wrap gap-2 mb-6">
                {CATEGORIES.map(c => (
                    <button
                        key={c.key}
                        onClick={() => setCategory(c.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${category === c.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                            }`}
                    >
                        <c.icon className="h-3.5 w-3.5" /> {c.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : threads.length === 0 ? (
                <div className="text-center py-20 text-stone-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Aucune discussion pour le moment</p>
                    <p className="text-sm mt-1">Soyez le premier à lancer un sujet !</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {threads.map((thread, index) => (
                        <motion.div
                            key={thread.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                        >
                            <Link
                                href={`/communaute/${thread.id}`}
                                className={`block p-5 rounded-2xl border transition-all hover:shadow-md ${thread.isPinned
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-stone-100'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
                                        <Image
                                            src={thread.author?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(thread.author?.name || 'U')}&background=3b82f6&color=fff`}
                                            alt="Avatar" fill className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {thread.isPinned && (
                                                <Pin className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                            )}
                                            <h3 className="font-bold text-stone-900 text-sm truncate">{thread.title}</h3>
                                        </div>
                                        <p className="text-xs text-stone-400 line-clamp-2 mb-2">{thread.content}</p>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {getCategoryBadge(thread.category)}
                                            <span className="text-[10px] text-stone-300">
                                                {thread.author?.name || 'Anonyme'} · {timeAgo(thread.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-stone-400">
                                                <ThumbsUp className="h-3 w-3" /> {thread.upvotes}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-stone-400">
                                                <MessageCircle className="h-3 w-3" /> {thread.repliesCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
