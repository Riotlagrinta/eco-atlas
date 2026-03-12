'use client';

import dynamic from 'next/dynamic';

export const DynamicTrailMap = dynamic(() => import('./TrailMap'), {
  ssr: false,
  loading: () => <div className="h-full bg-stone-100 animate-pulse rounded-3xl" />
});
