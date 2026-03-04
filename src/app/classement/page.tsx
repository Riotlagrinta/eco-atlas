'use client';

import React, { useEffect, useState } from 'react';
import { getLeaderboard, getRank } from '@/lib/gamification';
import { Trophy, Medal, Flame, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const REGIONS = ['Toutes', 'Maritime', 'Plateaux', 'Centrale', 'Kara', 'Savanes'];

interface LeaderboardEntry {
    user_id: string;
    xp: number;
    level: number;
    rank: string;
    streak_days: number;
    profiles: {
        full_name: string;
        avatar_url: string | null;
        region: string;
    }[] | null;
}

export default function ClassementPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [region, setRegion] = useState('Toutes');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            setLoading(true);
            const data = await getLeaderboard(region === 'Toutes' ? undefined : region, 20);
            setEntries(data as unknown as LeaderboardEntry[]);
            setLoading(false);
        }
        fetch();
    }, [region]);

    const getMedalIcon = (index: number) => {
        if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />;
        if (index === 1) return <Medal className="h-6 w-6 text-stone-400" />;
        if (index === 2) return <Medal className="h-6 w-6 text-amber-700" />;
        return <span className="text-sm font-bold text-stone-400 w-6 text-center">{index + 1}</span>;
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <div className="inline-flex p-4 bg-yellow-100 rounded-3xl text-yellow-600 mb-4">
                    <Trophy className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-black text-stone-900">Classement</h1>
                <p className="text-stone-500 mt-2">Les protecteurs les plus engagés du Togo</p>
            </div>

            {/* Filtres régions */}
            <div className="flex flex-wrap gap-2 justify-center mb-8">
                {REGIONS.map(r => (
                    <button
                        key={r}
                        onClick={() => setRegion(r)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${region === r
                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                            }`}
                    >
                        {r === 'Toutes' ? '🌍 Toutes' : `📍 ${r}`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-20 text-stone-400">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="font-bold">Aucun participant pour le moment</p>
                    <p className="text-sm mt-1">Soyez le premier à contribuer !</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {entries.map((entry, index) => {
                        const rankInfo = getRank(entry.level);
                        return (
                            <motion.div
                                key={entry.user_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${index < 3
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 shadow-sm'
                                    : 'bg-white border-stone-100 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex-shrink-0 w-8 flex justify-center">
                                    {getMedalIcon(index)}
                                </div>

                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
                                    <Image
                                        src={entry.profiles?.[0]?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.profiles?.[0]?.full_name || 'U')}&background=22c55e&color=fff`}
                                        alt={entry.profiles?.[0]?.full_name || 'Utilisateur'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-stone-900 truncate">
                                        {entry.profiles?.[0]?.full_name || 'Anonyme'}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs text-stone-400">
                                        <span style={{ color: rankInfo.color }} className="font-bold">
                                            {rankInfo.name}
                                        </span>
                                        {entry.profiles?.[0]?.region && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin className="h-3 w-3" /> {entry.profiles[0].region}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <p className="font-black text-stone-900">{entry.xp.toLocaleString()}</p>
                                    <p className="text-[10px] text-stone-400 font-medium">XP</p>
                                </div>

                                {entry.streak_days >= 3 && (
                                    <div className="flex items-center gap-1 text-orange-500 bg-orange-50 px-2 py-1 rounded-lg flex-shrink-0">
                                        <Flame className="h-3 w-3" />
                                        <span className="text-xs font-bold">{entry.streak_days}j</span>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
