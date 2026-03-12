import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/db';
import { notifications, pushSubscriptions, notificationPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Initialisation lazy de VAPID
let vapidInitialized = false;
function initVapid() {
    if (vapidInitialized) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey) {
        webpush.setVapidDetails('mailto:contact@eco-atlas.tg', publicKey, privateKey);
        vapidInitialized = true;
    }
}

export async function POST(req: NextRequest) {
    initVapid();
    try {
        const { title, body, type, userId, relatedId, radiusKm, location } = await req.json() as {
            title: string; body: string; type: 'alert' | 'badge' | 'challenge' | 'community' | 'system'; userId?: string;
            relatedId?: string; radiusKm?: number; location?: string;
        };

        if (!title || !body) {
            return NextResponse.json({ error: 'title et body sont requis.' }, { status: 400 });
        }

        if (userId) {
            await sendToUser(userId, title, body, type, relatedId);
            return NextResponse.json({ success: true, sent: 1 });
        }

        if (location && radiusKm) {
            const count = await sendToNearbyUsers(location, radiusKm, title, body, type, relatedId);
            return NextResponse.json({ success: true, sent: count });
        }

        return NextResponse.json({ error: 'userId ou location+radiusKm requis.' }, { status: 400 });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

async function sendToUser(userId: string, title: string, body: string, type: 'alert' | 'badge' | 'challenge' | 'community' | 'system', relatedId?: string) {
    // Sauvegarder la notification en BDD
    await db.insert(notifications).values({
        userId, 
        title, 
        body,
        type: type || 'system',
    });

    // Envoyer le push
    const subs = await db.query.pushSubscriptions.findMany({
        where: eq(pushSubscriptions.userId, userId)
    });

    if (subs) {
        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify({ title, body, type })
                );
            } catch {
                await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
            }
        }
    }
}

async function sendToNearbyUsers(
    location: string, radiusKm: number,
    title: string, body: string, type: 'alert' | 'badge' | 'challenge' | 'community' | 'system', relatedId?: string
): Promise<number> {
    const match = location.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
    if (!match) return 0;

    // Dans cette version simplifiée, on envoie à tous ceux qui ont activé le push
    // Une implémentation réelle filtrerait par localisation avec PostGIS
    const nearbyUsers = await db.query.notificationPreferences.findMany({
        where: eq(notificationPreferences.pushEnabled, true),
        columns: {
            userId: true
        }
    });

    if (!nearbyUsers || nearbyUsers.length === 0) return 0;

    let sentCount = 0;
    for (const u of nearbyUsers) {
        await sendToUser(u.userId, title, body, type, relatedId);
        sentCount++;
    }

    return sentCount;
}
