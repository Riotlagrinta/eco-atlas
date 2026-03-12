import { savePushSubscription, getUnreadNotifications, getAllNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/actions';

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

    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        ) as unknown as BufferSource,
    });

    return subscription;
}

/**
 * Enregistre le push subscription dans la base de données via Server Action
 */
export async function registerPushSubscription(subscription: PushSubscription) {
    const subJSON = subscription.toJSON();

    await savePushSubscription({
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh || '',
        auth: subJSON.keys?.auth || '',
    });
}

/**
 * Récupérer les notifications non-lues
 */
export async function fetchUnreadNotifications() {
    return await getUnreadNotifications();
}

/**
 * Récupérer toutes les notifications
 */
export async function fetchAllNotifications() {
    return await getAllNotifications();
}

/**
 * Marquer une notification comme lue
 */
export async function markAsRead(notificationId: string) {
    await markNotificationAsRead(notificationId);
}

/**
 * Marquer toutes les notifications comme lues
 */
export async function markAllAsRead() {
    await markAllNotificationsAsRead();
}

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
