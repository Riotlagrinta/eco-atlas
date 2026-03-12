import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getProfileData } from '@/lib/actions';
import ProfileClient from './ProfileClient';

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/connexion');
  }

  const data = await getProfileData();
  if (!data) {
    return <div>Erreur lors du chargement du profil.</div>;
  }

  return <ProfileClient initialData={data} />;
}
