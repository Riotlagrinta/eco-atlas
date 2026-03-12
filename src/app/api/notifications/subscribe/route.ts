import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions, notificationPreferences } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
    try {
        const { userId, endpoint, p256dh, auth } = await req.json() as {
            userId: string; endpoint: string; p256dh: string; auth: string;
        };

        if (!userId || !endpoint || !p256dh || !auth) {
            return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
        }

        // Upsert push_subscription
        const existingSub = await db.query.pushSubscriptions.findFirst({
            where: and(
                eq(pushSubscriptions.userId, userId),
                eq(pushSubscriptions.endpoint, endpoint)
            )
        });

        if (existingSub) {
            await db.update(pushSubscriptions)
                .set({ p256dh, auth })
                .where(eq(pushSubscriptions.id, existingSub.id));
        } else {
            await db.insert(pushSubscriptions).values({
                userId, endpoint, p256dh, auth
            });
        }

        // Upsert notification_preferences
        const existingPref = await db.query.notificationPreferences.findFirst({
            where: eq(notificationPreferences.userId, userId)
        });

        if (existingPref) {
            await db.update(notificationPreferences)
                .set({ pushEnabled: true })
                .where(eq(notificationPreferences.userId, userId));
        } else {
            await db.insert(notificationPreferences).values({
                userId,
                pushEnabled: true,
                alertRadiusKm: 50,
                alertTypes: ['critical', 'high']
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
