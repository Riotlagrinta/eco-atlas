import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(req: NextRequest) {
    try {
        const { userId, endpoint, p256dh, auth } = await req.json() as {
            userId: string; endpoint: string; p256dh: string; auth: string;
        };

        if (!userId || !endpoint || !p256dh || !auth) {
            return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 });
        }

        const admin = getSupabaseAdmin();

        await admin.from('push_subscriptions').upsert(
            { user_id: userId, endpoint, p256dh, auth },
            { onConflict: 'user_id,endpoint' }
        );

        await admin.from('notification_preferences').upsert(
            { user_id: userId, push_enabled: true, alert_radius_km: 50, alert_types: ['critical', 'high'] },
            { onConflict: 'user_id' }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inconnue';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
