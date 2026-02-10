import React from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, Map, Shield, PlayCircle } from 'lucide-react';
import { WeatherWidget } from '@/components/WeatherWidget';

export default function Home() {
  return (
    <div className="flex flex-col w-full bg-white">
      {/* Hero Section - Version Lumineuse */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-stone-50">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80"
            alt="Nature"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div>
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              Atlas Officiel du Togo 🇹🇬
            </span>
            <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight text-stone-900">
              Explorez la Nature <br />
              <span className="text-green-600">du Togo.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-stone-600 leading-relaxed">
              L'observatoire participatif pour découvrir, suivre et protéger les espèces rares de notre territoire, de Dapaong à Lomé.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/carte"
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center transition-all shadow-xl shadow-green-600/20"
              >
                Ouvrir la Carte SIG <Map className="ml-3 h-6 w-6" />
              </Link>
              <Link
                href="/documentaires"
                className="bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center transition-all shadow-sm"
              >
                Eco-Stream <PlayCircle className="ml-3 h-6 w-6 text-green-600" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Weather Section */}
      <section className="py-12 -mt-16 relative z-20 max-w-7xl mx-auto px-4 w-full">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6 ml-4">Météo des Parcs en Temps Réel</h3>
        <WeatherWidget />
      </section>

      {/* Reste des sections (Features, CTA) */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-stone-900 mb-4 tracking-tight">Notre Engagement</h2>
            <div className="h-1.5 w-24 bg-green-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Leaf, title: "Observatoire", color: "bg-green-50 text-green-600", desc: "Une base de données scientifique sur la faune et la flore menacées au Togo." },
              { icon: Map, title: "Cartographie SIG", color: "bg-emerald-50 text-emerald-600", desc: "Suivi en temps réel des zones protégées et détection des feux de brousse." },
              { icon: Shield, title: "Protection", color: "bg-teal-50 text-teal-600", desc: "Outils de signalement pour les éco-citoyens et les agents forestiers." }
            ].map((f, i) => (
              <div key={i} className="bg-stone-50/50 p-10 rounded-3xl border border-stone-100 hover:border-green-200 transition-all hover:shadow-xl group">
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-stone-900">{f.title}</h3>
                <p className="text-stone-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
