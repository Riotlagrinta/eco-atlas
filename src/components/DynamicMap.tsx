'use client';

import dynamic from 'next/dynamic';

export const DynamicMap = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="h-full bg-stone-100 animate-pulse rounded-2xl" />
});
