'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf, Mail, MapPin, Globe, Phone, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-stone-900 text-white pt-24 pb-12 overflow-hidden relative">
      {/* Texture de fond discrète */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <Leaf className="h-96 w-96 -rotate-12 absolute -left-20 -bottom-20" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Branding */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <Leaf className="h-8 w-8 text-green-500" />
              <span className="text-2xl font-bold tracking-tight">Eco-Atlas</span>
            </Link>
            <p className="text-stone-400 text-sm leading-relaxed mb-8">
              L'outil citoyen pour la surveillance et la protection de la biodiversité du Togo. 🇹🇬
            </p>
            <div className="flex space-x-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-green-600 transition-all cursor-pointer">
                <Globe className="h-5 w-5" />
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-green-600 transition-all cursor-pointer">
                <Mail className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-green-500">Navigation</h4>
            <ul className="space-y-4 text-stone-400 text-sm">
              <li><Link href="/observatoire" className="hover:text-white transition-colors">Observatoire</Link></li>
              <li><Link href="/carte" className="hover:text-white transition-colors">Carte SIG</Link></li>
              <li><Link href="/documentaires" className="hover:text-white transition-colors">Eco-Stream</Link></li>
              <li><Link href="/statistiques" className="hover:text-white transition-colors">Statistiques</Link></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-green-500">Ressources</h4>
            <ul className="space-y-4 text-stone-400 text-sm">
              <li><Link href="/a-propos" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/missions" className="hover:text-white transition-colors">Missions</Link></li>
              <li><Link href="/actualites" className="hover:text-white transition-colors">Actualités</Link></li>
              <li className="flex items-center text-stone-500 italic"><ShieldCheck className="h-3 w-3 mr-2" /> Certifié Togo Vert</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-green-500">Nous Contacter</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm text-stone-400">
                <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                <span>Lomé, Quartier Administratif<br />Togo</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-stone-400">
                <Mail className="h-5 w-5 text-green-500" />
                <span>contact@eco-atlas.tg</span>
              </div>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/20 transition-all mt-4 text-xs">
                Soutenir le projet
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-stone-500 text-[10px] font-medium uppercase tracking-widest">
            © {new Date().getFullYear()} Eco-Atlas Togo • Tous droits réservés.
          </p>
          <div className="flex space-x-8 text-[10px] font-bold text-stone-500 uppercase tracking-widest">
            <span className="hover:text-white cursor-pointer transition-colors">Mentions Légales</span>
            <span className="hover:text-white cursor-pointer transition-colors">Confidentialité</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ShieldCheck({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
}
