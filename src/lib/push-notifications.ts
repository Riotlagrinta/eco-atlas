import { createClient } from '@/lib/supabase/client';

/**
 * Demande la permission de notification au navigateur et retourne le subscription object.
 */
export async function requestNotificationPermission(): Promise<PushSubscription | null> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        console.warn('Push notifications non supportées par ce navigateur.');
        return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        console.warn('Notification permission refusée.');
        return null;
    }

    // Attendre que le SW soit prêt (enregistré par next-pwa)
    const registration = await navigator.serviceWorker.ready;

    // S'abonner aux push (VAPID Key publique)
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as unknown as BufferSource,
    });

    return subscription;
}

/**
 * Enregistre le push subscription dans Supabase
 */
export async function savePushSubscription(userId: string, subscription: PushSubscription) {
    const supabase = createClient();
    const subJSON = subscription.toJSON();

    await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh || '',
        auth: subJSON.keys?.auth || '',
    }, { onConflict: 'user_id,endpoint' });
}

/**
 * Récupérer les notifications non-lues d'un utilisateur
 */
export async function getUnreadNotifications(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);
    return data || [];
}

/**
 * Récupérer toutes les notifications d'un utilisateur
 */
export async function getAllNotifications(userId: string) {
    const supabase = createClient();
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    return data || [];
}

/**
 * Marquer une notification comme lue
 */
export async function markAsRead(notificationId: string) {
    const supabase = createClient();
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllAsRead(userId: string) {
    const supabase = createClient();
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
}

// === Utilitaire VAPID ===
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
