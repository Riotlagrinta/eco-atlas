'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Leaf, Map, Film, Info, Camera, Shield, User, Newspaper, Bell, Clock, Globe, Target, Brain, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { translations } from '@/lib/i18n';
import { GlobalSearch } from '@/components/GlobalSearch';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [lang, setLang] = useState<'fr' | 'ee' | 'kby'>('fr');
  const supabase = createClient();

  const t = translations[lang];

  const navItems = [
    { name: t.obs, href: '/observatoire', icon: Leaf },
    { name: t.map, href: '/carte', icon: Map },
    { name: 'Missions', href: '/missions', icon: Target },
    { name: 'Galerie', href: '/galerie', icon: Camera },
    { name: 'Eco-Stream', href: '/documentaires', icon: Film },
    { name: 'Partenaires', href: '/organisations', icon: ShieldCheck },
    { name: 'Actualités', href: '/actualites', icon: Newspaper },
  ];

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

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
        fetchNotifications(user.id);
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setIsAdmin(false);
        setNotifications([]);
      }
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
            
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-stone-100 p-1 rounded-lg mr-4">
              <button onClick={() => setLang('fr')} className={`text-[9px] px-2 py-1 rounded font-bold ${lang === 'fr' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-400'}`}>FR</button>
              <button onClick={() => setLang('ee')} className={`text-[9px] px-2 py-1 rounded font-bold ${lang === 'ee' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-400'}`}>EE</button>
              <button onClick={() => setLang('kby')} className={`text-[9px] px-2 py-1 rounded font-bold ${lang === 'kby' ? 'bg-white text-green-600 shadow-sm' : 'text-stone-400'}`}>KBY</button>
            </div>

            <GlobalSearch />

            {user && (
              <div className="relative">
                {/* ... existing bell icon code ... */}
                <button 
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 text-stone-400 hover:text-green-600 transition-all"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50">
                    <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                      <span className="font-bold text-xs text-stone-500 uppercase tracking-widest">Notifications</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-stone-50 hover:bg-stone-50 transition-colors">
                          <p className="text-sm text-stone-700 leading-relaxed mb-2">{n.message}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-stone-400 flex items-center"><Clock className="h-3 w-3 mr-1" /> Juste maintenant</span>
                            <button onClick={() => markAsRead(n.id)} className="text-[10px] font-bold text-green-600 hover:underline">Marquer comme lu</button>
                          </div>
                        </div>
                      )) : (
                        <div className="p-8 text-center text-stone-400 text-sm">Aucune nouvelle notification</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user && (
              <Link
                href="/profil"
                className="text-stone-600 hover:text-green-600 transition-colors font-medium flex items-center space-x-1 text-sm"
              >
                <User className="h-4 w-4" />
                <span>Profil</span>
              </Link>
            )}

            {user && (
              <Link
                href="/signaler"
                className="text-emerald-600 hover:text-emerald-700 transition-colors font-bold flex items-center space-x-1 text-sm bg-emerald-50 px-3 py-1.5 rounded-lg"
              >
                <Camera className="h-4 w-4" />
                <span>{t.signaler}</span>
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
                {t.connexion}
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