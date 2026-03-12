'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Map as MapIcon, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const MapEditor = dynamic(() => import('@/components/MapEditor'), {
  ssr: false,
  loading: () => <div className="h-[70vh] bg-stone-100 animate-pulse flex items-center justify-center">Chargement de l&apos;éditeur SIG...</div>
});

export default function AdminCartePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
        router.push('/connexion');
    } else if (authStatus === 'authenticated') {
        // @ts-ignore
        if (session?.user?.role !== 'admin') {
            router.push('/');
        }
    }
  }, [authStatus, session, router]);

  if (authStatus === 'loading') return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="p-2 hover:bg-stone-100 rounded-full transition-all">
            <ArrowLeft className="h-6 w-6 text-stone-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stone-900 flex items-center">
              <MapIcon className="h-8 w-8 mr-3 text-green-600" /> Éditeur de Zones (SIG)
            </h1>
            <p className="text-stone-500">Dessinez les limites des nouveaux parcs sur la carte</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden">
        <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-widest">
          <span>Outils de dessin actifs</span>
          <span className="text-green-600">Mode Administrateur Sécurisé</span>
        </div>
        <div className="h-[70vh]">
          <MapEditor />
        </div>
      </div>
    </div>
  );
}
