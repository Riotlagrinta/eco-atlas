'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Leaf, Camera, Newspaper, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileItems = [
  { name: 'Carte', href: '/carte', icon: Map },
  { name: 'Espèces', href: '/observatoire', icon: Leaf },
  { name: 'Signaler', href: '/signaler', icon: Camera, primary: true },
  { name: 'News', href: '/actualites', icon: Newspaper },
  { name: 'Moi', href: '/profil', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-100 px-6 py-3 z-[100] flex justify-between items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {mobileItems.map((item) => {
        const isActive = pathname === item.href;
        
        if (item.primary) {
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className="relative -top-8 bg-green-600 p-4 rounded-2xl shadow-xl shadow-green-600/40 text-white"
            >
              <item.icon className="h-6 w-6" />
            </Link>
          );
        }

        return (
          <Link 
            key={item.name} 
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-all",
              isActive ? "text-green-600 scale-110" : "text-stone-400"
            )}
          >
            <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
