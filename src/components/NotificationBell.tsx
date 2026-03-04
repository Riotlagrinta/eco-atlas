'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Bell, X, AlertTriangle, Award, Target, MessageSquare, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getUnreadNotifications, markAsRead, markAllAsRead } from '@/lib/push-notifications';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Notification {
    id: string;
    title: string;
    body: string;
    type: 'alert' | 'badge' | 'challenge' | 'community' | 'system';
    is_read: boolean;
    created_at: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    alert: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600', bg: 'bg-red-50' },
    badge: { icon: <Award className="h-4 w-4" />, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    challenge: { icon: <Target className="h-4 w-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    community: { icon: <MessageSquare className="h-4 w-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    system: { icon: <Info className="h-4 w-4" />, color: 'text-stone-600', bg: 'bg-stone-50' },
};

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        const data = await getUnreadNotifications(userId);
        setNotifications(data as Notification[]);
    }, [userId]);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setUserId(user.id);
        });
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Rafraîchir toutes les 30 secondes
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleMarkRead = async (id: string) => {
        await markAsRead(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleMarkAllRead = async () => {
        if (!userId) return;
        await markAllAsRead(userId);
        setNotifications([]);
        setIsOpen(false);
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "À l'instant";
        if (minutes < 60) return `il y a ${minutes}min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `il y a ${hours}h`;
        return `il y a ${Math.floor(hours / 24)}j`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-all"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center"
                    >
                        {notifications.length > 9 ? '9+' : notifications.length}
                    </motion.span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay mobile */}
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-12 w-80 max-h-96 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                                <h3 className="font-black text-stone-900 text-sm">Notifications</h3>
                                <div className="flex items-center gap-2">
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-[10px] font-bold text-green-600 hover:underline"
                                        >
                                            Tout marquer lu
                                        </button>
                                    )}
                                    <button onClick={() => setIsOpen(false)} className="text-stone-300 hover:text-stone-500">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Liste */}
                            <div className="overflow-y-auto max-h-72">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center text-stone-300">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm font-bold">Aucune notification</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => {
                                        const config = typeConfig[notif.type] || typeConfig.system;
                                        return (
                                            <motion.div
                                                key={notif.id}
                                                layout
                                                exit={{ opacity: 0, x: -50 }}
                                                className="flex items-start gap-3 px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-all cursor-pointer"
                                                onClick={() => handleMarkRead(notif.id)}
                                            >
                                                <div className={`p-2 rounded-xl ${config.bg} ${config.color} flex-shrink-0 mt-0.5`}>
                                                    {config.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-stone-900 text-sm truncate">{notif.title}</p>
                                                    <p className="text-xs text-stone-400 line-clamp-2">{notif.body}</p>
                                                    <p className="text-[10px] text-stone-300 mt-1">{timeAgo(notif.created_at)}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t border-stone-100 px-4 py-2">
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs font-bold text-green-600 hover:underline block text-center"
                                >
                                    Voir tout l&apos;historique →
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
