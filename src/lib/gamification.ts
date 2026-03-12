import { db } from '@/lib/db';
import { userLevels, challenges, userChallenges, users } from '@/lib/db/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

// === BARÈME XP ===
export const XP_REWARDS = {
    OBSERVATION_VALIDATED: 25,
    ALERT_SENT: 50,
    QUIZ_COMPLETED: 30,
    FORUM_POST: 10,
    FORUM_REPLY: 5,
    VOTE_CAST: 5,
    STREAK_7_DAYS: 100,
    STREAK_30_DAYS: 500,
    FIRST_OBSERVATION: 50,
} as const;

// === RANGS ===
const RANKS = [
    { minLevel: 1, maxLevel: 5, name: '🌱 Explorateur', color: '#22c55e' },
    { minLevel: 6, maxLevel: 10, name: '🦎 Naturaliste', color: '#3b82f6' },
    { minLevel: 11, maxLevel: 15, name: '🦁 Gardien de la Nature', color: '#f59e0b' },
    { minLevel: 16, maxLevel: 20, name: '🌍 Légende du Togo', color: '#ef4444' },
] as const;

// === CALCULS ===

/** XP requis pour atteindre un niveau donné */
export function xpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
}

/** Rang correspondant à un niveau */
export function getRank(level: number): { name: string; color: string } {
    const rank = RANKS.find(r => level >= r.minLevel && level <= r.maxLevel);
    return rank
        ? { name: rank.name, color: rank.color }
        : { name: RANKS[RANKS.length - 1].name, color: RANKS[RANKS.length - 1].color };
}

/** Pourcentage de progression vers le prochain niveau */
export function getProgressPercent(xp: number, level: number): number {
    const currentLevelXP = xpForLevel(level);
    const nextLevelXP = xpForLevel(level + 1);
    const progress = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    return Math.max(0, Math.min(100, progress));
}

// === API DRIZZLE ===

/** Récupérer ou créer le profil de gamification d'un utilisateur */
export async function getUserLevel(userId: string) {
    try {
        let levelData = await db.query.userLevels.findFirst({
            where: eq(userLevels.userId, userId),
        });

        if (!levelData) {
            // Créer le profil si inexistant
            const result = await db.insert(userLevels).values({
                userId,
                xp: 0,
                level: 1,
                rank: '🌱 Explorateur',
                streakDays: 0,
            }).returning();
            levelData = result[0];
        }

        return levelData;
    } catch (error) {
        console.error('Error in getUserLevel:', error);
        return null;
    }
}

/** Ajouter de l'XP à un utilisateur et gérer le level-up */
export async function addXP(
    userId: string,
    amount: number,
    _reason: string
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean; newRank: string }> {
    const userLevel = await getUserLevel(userId);
    if (!userLevel) throw new Error('Impossible de récupérer le niveau utilisateur');

    const newXP = (userLevel.xp || 0) + amount;
    let newLevel = userLevel.level || 1;
    let leveledUp = false;

    // Vérifier les level-ups consécutifs
    while (newXP >= xpForLevel(newLevel + 1)) {
        newLevel++;
        leveledUp = true;
    }

    const newRank = getRank(newLevel).name;

    // Mettre à jour le streak
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = userLevel.lastActivityDate;
    let newStreak = userLevel.streakDays || 0;

    if (lastActivity !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newStreak = lastActivity === yesterday ? newStreak + 1 : 1;
    }

    await db.update(userLevels)
        .set({
            xp: newXP,
            level: newLevel,
            rank: newRank,
            streakDays: newStreak,
            lastActivityDate: today,
        })
        .where(eq(userLevels.userId, userId));

    return { newXP, newLevel, leveledUp, newRank };
}

/** Récupérer le classement par région */
export async function getLeaderboard(region?: string, limit = 10) {
    // Note: 'region' is not in our 'user' table yet, but we'll try to join if it was.
    // Based on the schema provided, it's missing.
    try {
        return await db.query.userLevels.findMany({
            with: {
                user: true
            },
            orderBy: [desc(userLevels.xp)],
            limit,
        });
    } catch (error) {
        console.error('Error in getLeaderboard:', error);
        return [];
    }
}

/** Récupérer les défis actifs */
export async function getActiveChallenges() {
    const today = new Date().toISOString().split('T')[0];
    try {
        return await db.query.challenges.findMany({
            where: and(
                eq(challenges.isActive, true),
                gte(challenges.endDate, today)
            ),
            orderBy: [challenges.endDate],
        });
    } catch (error) {
        console.error('Error in getActiveChallenges:', error);
        return [];
    }
}

/** Récupérer la progression d'un utilisateur sur les défis */
export async function getUserChallenges(userId: string) {
    try {
        return await db.query.userChallenges.findMany({
            where: eq(userChallenges.userId, userId),
            with: {
                challenge: true
            }
        });
    } catch (error) {
        console.error('Error in getUserChallenges:', error);
        return [];
    }
}

/** Incrémenter la progression d'un défi */
export async function incrementChallengeProgress(
    userId: string,
    challengeType: 'observations' | 'species' | 'alerts' | 'quiz' | 'login'
) {
    // Trouver les défis actifs correspondant au type
    const activeChalls = await getActiveChallenges();
    const matching = activeChalls.filter(c => c.targetType === challengeType);

    for (const challenge of matching) {
        try {
            const existing = await db.query.userChallenges.findFirst({
                where: and(
                    eq(userChallenges.userId, userId),
                    eq(userChallenges.challengeId, challenge.id)
                )
            });

            if (existing && existing.completed) continue;

            const newProgress = (existing?.progress || 0) + 1;
            const completed = newProgress >= (challenge.targetCount || 1);

            await db.insert(userChallenges)
                .values({
                    userId,
                    challengeId: challenge.id,
                    progress: newProgress,
                    completed,
                    completedAt: completed ? new Date() : null,
                })
                .onConflictDoUpdate({
                    target: [userChallenges.userId, userChallenges.challengeId],
                    set: {
                        progress: newProgress,
                        completed,
                        completedAt: completed ? new Date() : null,
                    }
                });

            // Si défi complété, donner l'XP bonus
            if (completed && !existing?.completed) {
                await addXP(userId, challenge.xpReward || 0, `Défi complété: ${challenge.title}`);
            }
        } catch (error) {
            console.error(`Error incrementing challenge progress for ${challenge.id}:`, error);
        }
    }
}
