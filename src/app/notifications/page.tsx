import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getNotifications } from '@/lib/actions';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
    const session = await auth();
    if (!session?.user) {
        redirect('/connexion');
    }

    const notifications = await getNotifications();

    return <NotificationsClient initialNotifications={notifications} />;
}
