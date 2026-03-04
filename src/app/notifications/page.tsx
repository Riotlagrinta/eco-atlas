'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { getAllNotifications, markAsRead, markAllAsRead } from '@/lib/push-notifications';
import { createClient } from '@/lib/supabase/client';
import { Bell, AlertTriangle, Award, Target, MessageSquare, Info, Check, CheckCheck, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Notification {
    id: string;
    title: string;
    body: string;
    type: 'alert' | 'badge' | 'challenge' | 'community' | 'system';
    is_read: boolean;
    created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
    alert: { icon: <AlertTriangle className="h-5 w-5" />, color: 'text-red-600', bg: 'bg-red-50', label: 'Alerte' },
    badge: { icon: <Award className="h-5 w-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Badge' },
    challenge: { icon: <Target className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Défi' },
    community: { icon: <MessageSquare className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Communauté' },
    system: { icon: <Info className="h-5 w-5" />, color: 'text-stone-600', bg: 'bg-stone-50', label: 'Système' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const data = await getAllNotifications(user.id);
            setNotifications(data as Notification[]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleMarkRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        );
    };

    const handleMarkAllRead = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await markAllAsRead(user.id);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
    };

    const filtered = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.is_read)
            : notifications.filter(n => n.type === filter);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-blue-100 rounded-3xl text-blue-600 mb-4">
                    <Bell className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-black text-stone-900">Notifications</h1>
                <p className="text-stone-500 mt-2">
                    {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour !'}
                </p>
            </div>

            {/* Filtres */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
                {[
                    { key: 'all', label: 'Toutes' },
                    { key: 'unread', label: `Non lues (${unreadCount})` },
                    { key: 'alert', label: '🚨 Alertes' },
                    { key: 'challenge', label: '🎯 Défis' },
                    { key: 'badge', label: '🏅 Badges' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f.key
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Action globale */}
            {unreadCount > 0 && (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
                    >
                        <CheckCheck className="h-4 w-4" /> Tout marquer comme lu
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-stone-400">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Aucune notification</p>
                    <p className="text-sm mt-1">Vos alertes et récompenses apparaîtront ici.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((notif, index) => {
                        const config = typeConfig[notif.type] || typeConfig.system;
                        return (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${notif.is_read
                                        ? 'bg-white border-stone-100 opacity-60'
                                        : 'bg-white border-stone-200 shadow-sm'
                                    }`}
                            >
                                <div className={`p-3 rounded-2xl ${config.bg} ${config.color} flex-shrink-0`}>
                                    {config.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-black text-stone-900 text-sm truncate">{notif.title}</p>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${config.bg} ${config.color}`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-500">{notif.body}</p>
                                    <p className="text-xs text-stone-300 mt-2">{formatDate(notif.created_at)}</p>
                                </div>
                                {!notif.is_read && (
                                    <button
                                        onClick={() => handleMarkRead(notif.id)}
                                        className="p-2 text-stone-300 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all flex-shrink-0"
                                        title="Marquer comme lu"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
