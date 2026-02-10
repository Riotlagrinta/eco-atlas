'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, Map, Shield, PlayCircle, Newspaper } from 'lucide-react';
import { WeatherWidget } from '@/components/WeatherWidget';
import { createClient } from '@/lib/supabase/client';
import { translations } from '@/lib/i18n';

export default function Home() {
  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [lang, setLang] = useState<'fr' | 'ee' | 'kby'>('fr');
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      if (data) setLatestArticles(data);
    }
    fetchData();
  }, [supabase]);

  const t = translations[lang];

  return (
    <div className="flex flex-col w-full bg-white">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden bg-stone-50">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80" className="w-full h-full object-cover" alt="Nature" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <div>
            <div className="flex justify-center space-x-2 mb-6">
              {['fr', 'ee', 'kby'].map(l => (
                <button key={l} onClick={() => setLang(l as any)} className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${lang === l ? 'bg-green-600 text-white shadow-lg' : 'bg-white text-stone-400 border border-stone-100'}`}>{l}</button>
              ))}
            </div>
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              {t.hero_badge}
            </span>
            <h1 className="text-5xl md:text-8xl font-bold mb-8 tracking-tight text-stone-900 leading-tight">
              {t.hero_title.split('Togo')[0]} <br />
              <span className="text-green-600">Togo.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-stone-600 leading-relaxed">
              {t.hero_desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/carte" className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center transition-all shadow-xl shadow-green-600/20">
                {t.hero_cta} <Map className="ml-3 h-6 w-6" />
              </Link>
              <Link href="/documentaires" className="bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 px-10 py-5 rounded-2xl font-bold text-lg flex items-center justify-center transition-all shadow-sm">
                Eco-Stream <PlayCircle className="ml-3 h-6 w-6 text-green-600" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Weather Section */}
      <section className="py-12 -mt-16 relative z-20 max-w-7xl mx-auto px-4 w-full">
        <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest mb-6 ml-4">Météo des Parcs</h3>
        <WeatherWidget />
      </section>

      {/* News Section */}
      {latestArticles && latestArticles.length > 0 && (
        <section className="py-24 bg-white border-t border-stone-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold text-stone-900 tracking-tight">{t.latest_news}</h2>
                <div className="h-1 w-12 bg-green-500 mt-2"></div>
              </div>
              <Link href="/actualites" className="text-green-600 font-bold text-sm hover:underline flex items-center">
                {t.all_read} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestArticles.map((article) => (
                <Link key={article.id} href="/actualites" className="group">
                  <div className="aspect-video rounded-2xl overflow-hidden bg-stone-100 mb-4 border border-stone-100 transition-all group-hover:shadow-lg">
                    <img src={article.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="News" />
                  </div>
                  <h4 className="font-bold text-stone-900 group-hover:text-green-600 transition-colors line-clamp-2">{article.title}</h4>
                  <p className="text-[10px] text-stone-400 mt-2 font-bold uppercase tracking-widest">{article.category}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Engagement */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Leaf, title: "Observatoire", color: "bg-green-50 text-green-600", desc: "Données scientifiques sur la faune et la flore menacées au Togo." },
              { icon: Map, title: "Cartographie SIG", color: "bg-emerald-50 text-emerald-600", desc: "Suivi en temps réel des zones protégées et détection des feux." },
              { icon: Shield, title: "Protection", color: "bg-teal-50 text-teal-600", desc: "Outils de signalement pour les citoyens et les agents forestiers." }
            ].map((f, i) => (
              <div key={i} className="bg-white p-10 rounded-3xl border border-stone-100 hover:border-green-200 transition-all hover:shadow-xl group">
                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}><f.icon className="h-8 w-8" /></div>
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