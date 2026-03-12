'use server';

import { db } from '@/lib/db';
import { articles, observations, species, challenges, users, userLevels, comments, favorites, apiKeys, apiLogs, forumThreads, forumReplies, documents, documentaries, bookings, votes, observationVotes, ecoTrails, localGuides, protectedAreas, missions, missionMessages, notifications, pushSubscriptions } from '@/lib/db/schema';
import { desc, eq, and, sql, not, ilike } from 'drizzle-orm';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

// --- Auth Check ---
async function ensureAdmin() {
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

// --- Notifications ---
export async function getUnreadNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];
    try {
        return await db.query.notifications.findMany({
            where: and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)),
            orderBy: [desc(notifications.createdAt)],
            limit: 20
        });
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
        return [];
    }
}

export async function getAllNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];
    try {
        return await db.query.notifications.findMany({
            where: eq(notifications.userId, session.user.id),
            orderBy: [desc(notifications.createdAt)],
            limit: 50
        });
    } catch (error) {
        console.error('Error fetching all notifications:', error);
        return [];
    }
}

export async function markNotificationAsRead(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    try {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
        revalidatePath('/notifications');
        return { success: true };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { success: false, error };
    }
}

export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    try {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, session.user.id));
        revalidatePath('/notifications');
        return { success: true };
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return { success: false, error };
    }
}

export async function savePushSubscription(data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');
    try {
        await db.insert(pushSubscriptions).values({
            ...data,
            userId: session.user.id
        }).onConflictDoUpdate({
            target: [pushSubscriptions.userId, pushSubscriptions.endpoint],
            set: { p256dh: data.p256dh, auth: data.auth }
        });
        return { success: true };
    } catch (error) {
        console.error('Error saving push subscription:', error);
        return { success: false, error };
    }
}

// --- API Keys ---
export async function getApiKeys() {
    await ensureAdmin();
    try {
        return await db.query.apiKeys.findMany({
            orderBy: [desc(apiKeys.createdAt)]
        });
    } catch (error) {
        console.error('Error fetching API keys:', error);
        return [];
    }
}

export async function createApiKey(name: string) {
    await ensureAdmin();
    const session = await auth();
    try {
        const newKey = `ea_${uuidv4().replace(/-/g, '')}`;
        await db.insert(apiKeys).values({
            userId: session?.user?.id,
            key: newKey,
            name,
            isActive: true
        });
        revalidatePath('/admin/api-keys');
        return { success: true, key: newKey };
    } catch (error) {
        console.error('Error creating API key:', error);
        return { success: false, error };
    }
}

export async function updateApiKeyStatus(id: string, isActive: boolean) {
    await ensureAdmin();
    try {
        await db.update(apiKeys).set({ isActive }).where(eq(apiKeys.id, id));
        revalidatePath('/admin/api-keys');
        return { success: true };
    } catch (error) {
        console.error('Error updating API key status:', error);
        return { success: false, error };
    }
}

export async function deleteApiKey(id: string) {
    await ensureAdmin();
    try {
        await db.delete(apiKeys).where(eq(apiKeys.id, id));
        revalidatePath('/admin/api-keys');
        return { success: true };
    } catch (error) {
        console.error('Error deleting API key:', error);
        return { success: false, error };
    }
}

// --- Articles ---
export async function getLatestArticles(limit = 3) {
  try {
    return await db.query.articles.findMany({
      orderBy: [desc(articles.createdAt)],
      limit,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

export async function getAllArticles() {
  try {
    return await db.query.articles.findMany({
      orderBy: [desc(articles.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching all articles:', error);
    return [];
  }
}

export async function createArticle(data: { title: string, content: string, imageUrl?: string, category?: string }) {
  await ensureAdmin();
  const session = await auth();
  try {
    await db.insert(articles).values({
      ...data,
      authorId: session?.user?.id,
    });
    revalidatePath('/actualites');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error creating article:', error);
    return { success: false, error };
  }
}

export async function deleteArticle(id: string) {
  await ensureAdmin();
  try {
    await db.delete(articles).where(eq(articles.id, id));
    revalidatePath('/actualites');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting article:', error);
    return { success: false, error };
  }
}

// --- Documents ---
export async function getAllDocuments() {
    try {
        return await db.query.documents.findMany({
            orderBy: [desc(documents.createdAt)]
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

export async function createDocument(data: any) {
    await ensureAdmin();
    try {
        await db.insert(documents).values(data);
        revalidatePath('/documentation');
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Error creating document:', error);
        return { success: false, error };
    }
}

// --- Documentaries ---
export async function getAllDocumentaries() {
    try {
        return await db.query.documentaries.findMany({
            orderBy: [desc(documentaries.createdAt)]
        });
    } catch (error) {
        console.error('Error fetching documentaries:', error);
        return [];
    }
}

// --- Eco Trails ---
export async function getAllTrails() {
    try {
        return await db.query.ecoTrails.findMany({
            orderBy: [desc(ecoTrails.createdAt)]
        });
    } catch (error) {
        console.error('Error fetching trails:', error);
        return [];
    }
}

export async function getTrailById(id: string) {
    try {
        return await db.query.ecoTrails.findFirst({
            where: eq(ecoTrails.id, id)
        });
    } catch (error) {
        console.error('Error fetching trail:', error);
        return null;
    }
}

// --- Protected Areas (SIG) ---
export async function getAllProtectedAreas() {
    try {
        return await db.query.protectedAreas.findMany({
            orderBy: [desc(protectedAreas.createdAt)]
        });
    } catch (error) {
        console.error('Error fetching protected areas:', error);
        return [];
    }
}

export async function upsertProtectedArea(data: any) {
    await ensureAdmin();
    try {
        if (data.id) {
            await db.update(protectedAreas).set(data).where(eq(protectedAreas.id, data.id));
        } else {
            await db.insert(protectedAreas).values(data);
        }
        revalidatePath('/admin/carte');
        revalidatePath('/carte');
        revalidatePath('/parcs');
        return { success: true };
    } catch (error) {
        console.error('Error upserting protected area:', error);
        return { success: false, error };
    }
}

// --- Guides ---
export async function getAllGuides() {
    try {
        return await db.query.localGuides.findMany({
            orderBy: [desc(localGuides.rating)]
        });
    } catch (error) {
        console.error('Error fetching guides:', error);
        return [];
    }
}

// --- Missions ---
export async function getActiveMissions() {
    try {
        return await db.query.missions.findMany({
            where: eq(missions.status, 'active'),
            orderBy: [desc(missions.createdAt)]
        });
    } catch (error) {
        console.error('Error fetching missions:', error);
        return [];
    }
}

export async function getMissionMessages(missionId: string) {
    try {
        return await db.query.missionMessages.findMany({
            where: eq(missionMessages.missionId, missionId),
            with: {
                user: {
                    columns: { name: true, image: true }
                }
            },
            orderBy: [desc(missionMessages.createdAt)]
        });
    } catch (error) {
        console.error('Error fetching mission messages:', error);
        return [];
    }
}

export async function sendMissionMessage(missionId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await db.insert(missionMessages).values({
            missionId,
            userId: session.user.id,
            content
        });
        revalidatePath('/missions');
        return { success: true };
    } catch (error) {
        console.error('Error sending mission message:', error);
        return { success: false, error };
    }
}

// --- Observations ---
export async function getLatestVerifiedObservations(limit = 6) {
  try {
    return await db.query.observations.findMany({
      where: eq(observations.isVerified, true),
      with: {
        species: {
          columns: { name: true }
        }
      },
      orderBy: [desc(observations.createdAt)],
      limit,
    });
  } catch (error) {
    console.error('Error fetching observations:', error);
    return [];
  }
}

export async function getAllObservations() {
  try {
    return await db.query.observations.findMany({
      with: {
        species: {
          columns: { name: true }
        },
        user: {
          columns: { name: true, image: true }
        }
      },
      orderBy: [desc(observations.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching all observations:', error);
    return [];
  }
}

export async function createObservation(data: {
  speciesId?: string | null,
  description: string,
  imageUrl?: string,
  location?: string,
  latitude?: number,
  longitude?: number,
  isVerified?: boolean,
  type?: 'observation' | 'alert',
  alertLevel?: 'low' | 'medium' | 'high' | 'critical'
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const [newObs] = await db.insert(observations).values({
      ...data,
      userId: session.user.id,
    }).returning();

    // Gamification logic
    const xpReward = data.type === 'alert' ? 50 : 25;
    const levelData = await db.query.userLevels.findFirst({
      where: eq(userLevels.userId, session.user.id)
    });

    let leveledUp = false;
    let newLevel = 1;

    if (levelData) {
      const updatedXp = (levelData.xp || 0) + xpReward;
      newLevel = Math.floor(Math.sqrt(updatedXp / 100)) + 1;
      leveledUp = newLevel > (levelData.level || 1);

      await db.update(userLevels).set({
        xp: updatedXp,
        level: newLevel,
        lastActivityDate: new Date().toISOString().split('T')[0]
      }).where(eq(userLevels.userId, session.user.id));
    } else {
        await db.insert(userLevels).values({
            userId: session.user.id,
            xp: xpReward,
            level: 1,
            lastActivityDate: new Date().toISOString().split('T')[0]
        });
    }

    revalidatePath('/observatoire');
    revalidatePath('/profil');
    return { success: true, observation: newObs, xpResult: { xpReward, leveledUp, newLevel } };
  } catch (error) {
    console.error('Error creating observation:', error);
    return { success: false, error };
  }
}

export async function verifyObservation(id: string, isVerified: boolean) {
  await ensureAdmin();
  try {
    await db.update(observations).set({ isVerified }).where(eq(observations.id, id));
    revalidatePath('/admin');
    revalidatePath('/observatoire');
    return { success: true };
  } catch (error) {
    console.error('Error verifying observation:', error);
    return { success: true };
  }
}

// --- Observation Votes ---
export async function getObservationVotes(obsId: string) {
    try {
        return await db.query.observationVotes.findMany({
            where: eq(observationVotes.observationId, obsId),
            with: {
                user: {
                    columns: { name: true }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching votes:', error);
        return [];
    }
}

export async function voteObservation(data: { observationId: string, vote: 'confirm' | 'reject' | 'unsure', comment?: string, suggestedSpeciesId?: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await db.insert(observationVotes).values({
            ...data,
            userId: session.user.id
        }).onConflictDoUpdate({
            target: [observationVotes.userId, observationVotes.observationId],
            set: { vote: data.vote, comment: data.comment, suggestedSpeciesId: data.suggestedSpeciesId }
        });

        // Threshold check
        const votes = await db.query.observationVotes.findMany({
            where: eq(observationVotes.observationId, data.observationId)
        });

        const confirms = votes.filter(v => v.vote === 'confirm').length;
        const consensus = votes.length > 0 ? (confirms / votes.length) * 100 : 0;

        if (confirms >= 3 && consensus >= 70) {
            await db.update(observations).set({ isVerified: true }).where(eq(observations.id, data.observationId));
        }

        revalidatePath(`/observatoire/${data.observationId}`);
        return { success: true };
    } catch (error) {
        console.error('Error voting on observation:', error);
        return { success: false, error };
    }
}

// --- Species ---
export async function getAllSpecies() {
  try {
    return await db.query.species.findMany({
      orderBy: [desc(species.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching species:', error);
    return [];
  }
}

export async function createSpecies(data: any) {
  await ensureAdmin();
  try {
    await db.insert(species).values(data);
    revalidatePath('/admin');
    revalidatePath('/observatoire');
    return { success: true };
  } catch (error) {
    console.error('Error creating species:', error);
    return { success: false, error };
  }
}

export async function updateSpecies(id: string, data: any) {
  await ensureAdmin();
  try {
    await db.update(species).set(data).where(eq(species.id, id));
    revalidatePath('/admin');
    revalidatePath('/observatoire');
    return { success: true };
  } catch (error) {
    console.error('Error updating species:', error);
    return { success: false, error };
  }
}

export async function deleteSpecies(id: string) {
  await ensureAdmin();
  try {
    await db.delete(species).where(eq(species.id, id));
    revalidatePath('/admin');
    revalidatePath('/observatoire');
    return { success: true };
  } catch (error) {
    console.error('Error deleting species:', error);
    return { success: false, error };
  }
}

// --- Users ---
export async function getAllUsers() {
  await ensureAdmin();
  try {
    return await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function updateUserRole(userId: string, role: string) {
  await ensureAdmin();
  try {
    await db.update(users).set({ role }).where(eq(users.id, userId));
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error };
  }
}

// --- Dashboard Stats ---
export async function getDashboardStats() {
  await ensureAdmin();
  try {
      const obsData = await db.query.observations.findMany({
          columns: { createdAt: true, isVerified: true, type: true }
      });
      const userData = await db.query.users.findMany({
          columns: { createdAt: true, region: true }
      });

      const regionStats: Record<string, number> = {};
      userData.forEach(u => {
          const r = u.region || 'Inconnue';
          regionStats[r] = (regionStats[r] || 0) + 1;
      });

      const totalAlerts = obsData.filter(o => o.type === 'alert').length;
      const verifiedObs = obsData.filter(o => o.isVerified).length;

      return {
          totalObservations: obsData.length,
          totalAlerts,
          verifiedObs,
          totalUsers: userData.length,
          byRegion: Object.entries(regionStats).map(([name, count]) => ({ name, count })),
      };
  } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return null;
  }
}

// --- Forum (Community) ---
export async function getForumThreads(category?: string, search?: string) {
    try {
        const whereConditions = [];
        if (category && category !== 'all') whereConditions.push(eq(forumThreads.category, category));
        if (search) whereConditions.push(ilike(forumThreads.title, `%${search}%`));

        return await db.query.forumThreads.findMany({
            where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
            with: {
                author: {
                    columns: { name: true, image: true }
                }
            },
            orderBy: [desc(forumThreads.isPinned), desc(forumThreads.createdAt)],
            limit: 50
        });
    } catch (error) {
        console.error('Error fetching forum threads:', error);
        return [];
    }
}

export async function createForumThread(data: { title: string, content: string, category: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await db.insert(forumThreads).values({
            ...data,
            authorId: session.user.id
        });
        revalidatePath('/communaute');
        return { success: true };
    } catch (error) {
        console.error('Error creating thread:', error);
        return { success: false, error };
    }
}

export async function getForumThreadById(id: string) {
    try {
        return await db.query.forumThreads.findFirst({
            where: eq(forumThreads.id, id),
            with: {
                author: {
                    columns: { name: true, image: true }
                },
                replies: {
                    with: {
                        author: {
                            columns: { name: true, image: true }
                        }
                    },
                    orderBy: [desc(forumReplies.createdAt)]
                }
            }
        });
    } catch (error) {
        console.error('Error fetching thread:', error);
        return null;
    }
}

export async function createForumReply(threadId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await db.insert(forumReplies).values({
            threadId,
            content,
            authorId: session.user.id
        });
        
        await db.update(forumThreads)
            .set({ repliesCount: sql`${forumThreads.repliesCount} + 1` })
            .where(eq(forumThreads.id, threadId));

        revalidatePath(`/communaute/${threadId}`);
        return { success: true };
    } catch (error) {
        console.error('Error creating reply:', error);
        return { success: false, error };
    }
}

export async function voteForum(type: 'thread' | 'reply', id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        const table = type === 'thread' ? forumThreads : forumReplies;
        await db.update(table)
            .set({ upvotes: sql`${table.upvotes} + 1` })
            .where(eq(table.id, id));
        
        if (type === 'thread') revalidatePath(`/communaute/${id}`);
        else {
             const reply = await db.query.forumReplies.findFirst({ where: eq(forumReplies.id, id) });
             if (reply) revalidatePath(`/communaute/${reply.threadId}`);
        }
        return { success: true };
    } catch (error) {
        console.error('Error voting:', error);
        return { success: false, error };
    }
}

// --- Booking ---
export async function createBooking(data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error('Unauthorized');

    try {
        await db.insert(bookings).values({
            ...data,
            userId: session.user.id
        });
        revalidatePath('/ecotourisme');
        return { success: true };
    } catch (error) {
        console.error('Error creating booking:', error);
        return { success: false, error };
    }
}

// --- Comments & Discussion ---
export async function getSpeciesComments(speciesId: string) {
  try {
    return await db.query.comments.findMany({
      where: eq(comments.speciesId, speciesId),
      with: {
        user: {
          columns: { name: true, image: true }
        }
      },
      orderBy: [desc(comments.createdAt)],
    });
  } catch (error) {
    console.error('Error fetching species comments:', error);
    return [];
  }
}

export async function addSpeciesComment(speciesId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    await db.insert(comments).values({
      speciesId,
      userId: session.user.id,
      content,
    });
    revalidatePath(`/observatoire/${speciesId}`);
    return { success: true };
  } catch (error) {
    console.error('Error adding species comment:', error);
    return { success: false, error };
  }
}

// --- Favorites ---
export async function toggleFavorite(speciesId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  try {
    const existing = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, session.user.id), eq(favorites.speciesId, speciesId))
    });

    if (existing) {
      await db.delete(favorites).where(eq(favorites.id, existing.id));
      return { success: true, action: 'removed' };
    } else {
      await db.insert(favorites).values({
        userId: session.user.id,
        speciesId,
      });
      return { success: true, action: 'added' };
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { success: false, error };
  }
}

export async function getUserFavorites() {
  const session = await auth();
  if (!session?.user?.id) return [];

  try {
    const favs = await db.query.favorites.findMany({
      where: eq(favorites.userId, session.user.id),
      with: {
        species: true
      }
    });
    return favs.map(f => f.species);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}
