'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRank } from '@/lib/gamification';
import { Trophy, Sparkles, X } from 'lucide-react';

interface LevelUpModalProps {
    isOpen: boolean;
    newLevel: number;
    onClose: () => void;
}

export function LevelUpModal({ isOpen, newLevel, onClose }: LevelUpModalProps) {
    const rank = getRank(newLevel);
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

    useEffect(() => {
        if (isOpen) {
            // Générer des confettis
            const newParticles = Array.from({ length: 20 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                delay: Math.random() * 0.5,
            }));
            setParticles(newParticles);

            // Auto-fermer après 4s
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Confettis */}
                    {particles.map((p) => (
                        <motion.div
                            key={p.id}
                            className="absolute w-3 h-3 rounded-full"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'][p.id % 5],
                            }}
                            initial={{ opacity: 0, scale: 0, y: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -100, -200] }}
                            transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
                        />
                    ))}

                    {/* Modal */}
                    <motion.div
                        className="relative bg-white rounded-[2rem] p-10 text-center max-w-sm mx-4 shadow-2xl"
                        initial={{ scale: 0.5, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.5, y: 50, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-stone-300 hover:text-stone-500 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <motion.div
                            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                            style={{ backgroundColor: `${rank.color}20` }}
                            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Trophy className="h-10 w-10" style={{ color: rank.color }} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                                <span className="text-sm font-bold text-yellow-600 uppercase tracking-wider">
                                    Level Up !
                                </span>
                                <Sparkles className="h-5 w-5 text-yellow-500" />
                            </div>

                            <h2 className="text-4xl font-black text-stone-900 mb-1">
                                Niveau {newLevel}
                            </h2>

                            <p className="text-xl font-bold mb-4" style={{ color: rank.color }}>
                                {rank.name}
                            </p>

                            <p className="text-sm text-stone-400">
                                Continuez vos contributions pour débloquer le prochain rang !
                            </p>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
