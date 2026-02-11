'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Leaf, Map, Film, Info, Camera, Shield, User, Newspaper, Bell, Clock, Globe, Target, Brain, ShieldCheck, Trees, LogIn, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { translations } from '@/lib/i18n';
import { GlobalSearch } from '@/components/GlobalSearch';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [lang, setLang] = useState<'fr' | 'ee' | 'kby'>('fr');
  const supabase = createClient();

  const t = translations[lang];

  const mainNavItems = [
    { name: t.obs, href: '/observatoire', icon: Leaf },
    { name: 'Parcs', href: '/parcs', icon: Trees },
    { name: t.map, href: '/carte', icon: Map },
    { name: 'Missions', href: '/missions', icon: Target },
    { name: 'Galerie', href: '/galerie', icon: Camera },
    { name: 'Eco-Stream', href: '/documentaires', icon: Film },
    { name: 'Partenaires', href: '/organisations', icon: ShieldCheck },
    { name: 'Actualités', href: '/actualites', icon: Newspaper },
    { name: 'À propos', href: '/a-propos', icon: Info },
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'admin') setIsAdmin(true);
      }
    };
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) { setIsAdmin(false); setNotifications([]); }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 backdrop-blur-md border-b border-stone-100 shadow-sm h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-stone-100 rounded-xl transition-all text-stone-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <Leaf className="h-7 w-7 text-green-600" />
              <span className="text-lg font-bold bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent hidden sm:inline">
                Eco-Atlas
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <GlobalSearch />
            
            {user ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowNotifs(!showNotifs)} className="p-2 text-stone-400 hover:text-green-600 relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                </button>
                <Link href="/profil" className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 border border-green-200">
                  <User className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <Link href="/connexion" className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-green-600 transition-all flex items-center gap-2 shadow-lg shadow-stone-900/10">
                <LogIn className="h-4 w-4" /> <span>{t.connexion}</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Left Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[110]"
            />
            <motion.aside 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[120] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-stone-900 uppercase tracking-tighter">Menu Principal</span>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {mainNavItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    onClick={() => setIsSidebarOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl text-stone-600 hover:text-green-600 hover:bg-green-50 transition-all group font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Link>
                ))}

                <div className="h-px bg-stone-100 my-4 mx-3" />

                {user && (
                  <>
                    <Link href="/signaler" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-emerald-600 font-bold bg-emerald-50 hover:bg-emerald-100 transition-all">
                      <Camera className="h-5 w-5" /> <span>{t.signaler}</span>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-3 p-3 rounded-xl text-stone-700 font-bold hover:bg-stone-100 transition-all">
                        <Shield className="h-5 w-5" /> <span>Administration</span>
                      </Link>
                    )}
                  </>
                )}
              </div>

              <div className="p-6 bg-stone-50 border-t border-stone-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Langue</span>
                  <div className="flex gap-1">
                    {['fr', 'ee', 'kby'].map(l => (
                      <button key={l} onClick={() => setLang(l as any)} className={`text-[9px] px-2 py-1 rounded font-bold uppercase transition-all ${lang === l ? 'bg-green-600 text-white' : 'text-stone-400 hover:text-stone-600'}`}>{l}</button>
                    ))}
                  </div>
                </div>
                {user && (
                  <button 
                    onClick={() => { supabase.auth.signOut(); setIsSidebarOpen(false); }}
                    className="w-full py-3 rounded-xl border border-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 transition-all"
                  >
                    <LogOut className="h-4 w-4" /> Déconnexion
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
