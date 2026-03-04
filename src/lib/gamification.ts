import { createClient } from '@/lib/supabase/client';

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
    // Courbe progressive : chaque niveau demande un peu plus
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

// === API SUPABASE ===

/** Récupérer ou créer le profil de gamification d'un utilisateur */
export async function getUserLevel(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        // Créer le profil si inexistant
        const { data: newData } = await supabase
            .from('user_levels')
            .insert({ user_id: userId, xp: 0, level: 1, rank: '🌱 Explorateur', streak_days: 0 })
            .select()
            .single();
        return newData;
    }

    return data;
}

/** Ajouter de l'XP à un utilisateur et gérer le level-up */
export async function addXP(
    userId: string,
    amount: number,
    _reason: string
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean; newRank: string }> {
    const supabase = createClient();

    const userLevel = await getUserLevel(userId);
    if (!userLevel) throw new Error('Impossible de récupérer le niveau utilisateur');

    const newXP = userLevel.xp + amount;
    let newLevel = userLevel.level;
    let leveledUp = false;

    // Vérifier les level-ups consécutifs
    while (newXP >= xpForLevel(newLevel + 1)) {
        newLevel++;
        leveledUp = true;
    }

    const newRank = getRank(newLevel).name;

    // Mettre à jour le streak
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = userLevel.last_activity_date;
    let newStreak = userLevel.streak_days;

    if (lastActivity !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        newStreak = lastActivity === yesterday ? newStreak + 1 : 1;
    }

    await supabase
        .from('user_levels')
        .update({
            xp: newXP,
            level: newLevel,
            rank: newRank,
            streak_days: newStreak,
            last_activity_date: today,
        })
        .eq('user_id', userId);

    return { newXP, newLevel, leveledUp, newRank };
}

/** Récupérer le classement par région */
export async function getLeaderboard(region?: string, limit = 10) {
    const supabase = createClient();

    let query = supabase
        .from('user_levels')
        .select('user_id, xp, level, rank, streak_days, profiles(full_name, avatar_url, region)')
        .order('xp', { ascending: false })
        .limit(limit);

    if (region) {
        query = query.eq('profiles.region', region);
    }

    const { data } = await query;
    return data || [];
}

/** Récupérer les défis actifs */
export async function getActiveChallenges() {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', today)
        .order('end_date', { ascending: true });

    return data || [];
}

/** Récupérer la progression d'un utilisateur sur les défis */
export async function getUserChallenges(userId: string) {
    const supabase = createClient();

    const { data } = await supabase
        .from('user_challenges')
        .select('*, challenges(*)')
        .eq('user_id', userId);

    return data || [];
}

/** Incrémenter la progression d'un défi */
export async function incrementChallengeProgress(
    userId: string,
    challengeType: string
) {
    const supabase = createClient();

    // Trouver les défis actifs correspondant au type
    const activeChallenges = await getActiveChallenges();
    const matching = activeChallenges.filter(c => c.target_type === challengeType);

    for (const challenge of matching) {
        // Upsert la progression
        const { data: existing } = await supabase
            .from('user_challenges')
            .select('*')
            .eq('user_id', userId)
            .eq('challenge_id', challenge.id)
            .single();

        if (existing && existing.completed) continue;

        const newProgress = (existing?.progress || 0) + 1;
        const completed = newProgress >= challenge.target_count;

        await supabase
            .from('user_challenges')
            .upsert({
                user_id: userId,
                challenge_id: challenge.id,
                progress: newProgress,
                completed,
                completed_at: completed ? new Date().toISOString() : null,
            });

        // Si défi complété, donner l'XP bonus
        if (completed && !existing?.completed) {
            await addXP(userId, challenge.xp_reward, `Défi complété: ${challenge.title}`);
        }
    }
}
