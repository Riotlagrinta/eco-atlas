'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Leaf, Map, Film, Info, Camera, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { name: 'Observatoire', href: '/observatoire', icon: Leaf },
  { name: 'Carte', href: '/carte', icon: Map },
  { name: 'Documentaires', href: '/documentaires', icon: Film },
  { name: 'À propos', href: '/a-propos', icon: Info },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role === 'admin') setIsAdmin(true);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">
                Eco-Atlas
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-600 hover:text-green-600 transition-colors font-medium flex items-center space-x-1 text-sm"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            {user && (
              <Link
                href="/profil"
                className="text-stone-600 hover:text-green-600 transition-colors font-medium flex items-center space-x-1 text-sm"
              >
                <User className="h-4 w-4" />
                <span>Mon Profil</span>
              </Link>
            )}

            {user && (
              <Link
                href="/signaler"
                className="text-emerald-600 hover:text-emerald-700 transition-colors font-bold flex items-center space-x-1 text-sm bg-emerald-50 px-3 py-1.5 rounded-lg"
              >
                <Camera className="h-4 w-4" />
                <span>Signaler</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                className="text-stone-600 hover:text-stone-900 transition-colors font-bold flex items-center space-x-1 text-sm"
              >
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}

            {!user ? (
              <Link
                href="/connexion"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-green-500/20"
              >
                Connexion
              </Link>
            ) : (
              <button 
                onClick={() => supabase.auth.signOut()}
                className="text-stone-400 hover:text-red-500 transition-colors text-sm font-medium"
              >
                Déconnexion
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-green-600 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "md:hidden absolute w-full bg-white border-b border-green-100 transition-all duration-300 ease-in-out overflow-hidden",
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="px-4 pt-2 pb-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-3 px-3 py-3 text-base font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
