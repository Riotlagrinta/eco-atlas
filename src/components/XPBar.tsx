'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getRank, getProgressPercent, xpForLevel } from '@/lib/gamification';
import { Zap, TrendingUp } from 'lucide-react';

interface XPBarProps {
    xp: number;
    level: number;
    compact?: boolean;
}

export function XPBar({ xp, level, compact = false }: XPBarProps) {
    const rank = getRank(level);
    const progress = getProgressPercent(xp, level);
    const nextLevelXP = xpForLevel(level + 1);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: rank.color }}>Niv.{level}</span>
                <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: rank.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
                <span className="text-[10px] text-stone-400">{xp}/{nextLevelXP}</span>
            </div>
        );
    }

    return (
        <div className="bg-white border border-stone-100 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg"
                        style={{ backgroundColor: rank.color }}
                    >
                        {level}
                    </div>
                    <div>
                        <p className="font-black text-stone-900 text-lg">{rank.name}</p>
                        <p className="text-xs text-stone-400 flex items-center gap-1">
                            <Zap className="h-3 w-3" /> {xp.toLocaleString()} XP au total
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-stone-400 flex items-center gap-1 justify-end">
                        <TrendingUp className="h-3 w-3" /> Prochain niveau
                    </p>
                    <p className="font-bold text-stone-700">{nextLevelXP.toLocaleString()} XP</p>
                </div>
            </div>

            <div className="relative h-4 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                        background: `linear-gradient(90deg, ${rank.color}CC, ${rank.color})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-white drop-shadow-sm">
                        {Math.round(progress)}%
                    </span>
                </div>
            </div>
        </div>
    );
}
