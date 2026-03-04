import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

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

// Initialisation lazy du client Supabase admin
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    initVapid();
    try {
        const { title, body, type, userId, relatedId, radiusKm, location } = await req.json() as {
            title: string; body: string; type: string; userId?: string;
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

async function sendToUser(userId: string, title: string, body: string, type: string, relatedId?: string) {
    const admin = getSupabaseAdmin();

    // Sauvegarder la notification en BDD
    await admin.from('notifications').insert({
        user_id: userId, title, body,
        type: type || 'system',
        related_id: relatedId || null,
    });

    // Envoyer le push
    const { data: subs } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', userId);

    if (subs) {
        for (const sub of subs as unknown as { endpoint: string; p256dh: string; auth: string }[]) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify({ title, body, type })
                );
            } catch {
                await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
        }
    }
}

async function sendToNearbyUsers(
    location: string, radiusKm: number,
    title: string, body: string, type: string, relatedId?: string
): Promise<number> {
    const match = location.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/);
    if (!match) return 0;

    const admin = getSupabaseAdmin();

    const { data: nearbyUsers } = await admin
        .from('notification_preferences')
        .select('user_id')
        .eq('push_enabled', true);

    if (!nearbyUsers || nearbyUsers.length === 0) return 0;

    let sentCount = 0;
    for (const u of nearbyUsers as unknown as { user_id: string }[]) {
        await sendToUser(u.user_id, title, body, type, relatedId);
        sentCount++;
    }

    return sentCount;
}
