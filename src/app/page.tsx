import React from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, Map, Shield, PlayCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden bg-green-900">
        <div className="absolute inset-0 opacity-40">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80"
            alt="Forêt dense"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Explorez la Nature <br /><span className="text-green-400">du Togo</span>.
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-stone-200">
            Eco-Atlas est l'observatoire citoyen de la biodiversité togolaise. De la savane de Dapaong aux forêts d'Agou, protégeons notre patrimoine.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/carte"
              className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center transition-all shadow-lg hover:shadow-green-500/20"
            >
              Ouvrir la Carte <Map className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/documentaires"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center transition-all"
            >
              Voir les Documentaires <PlayCircle className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Notre Engagement</h2>
            <div className="h-1.5 w-20 bg-green-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <Leaf className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Observatoire des Espèces</h3>
              <p className="text-stone-600 leading-relaxed">
                Accédez à une base de données exhaustive sur la faune et la flore menacées, alimentée par des données scientifiques en temps réel.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Map className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Cartographie PostGIS</h3>
              <p className="text-stone-600 leading-relaxed">
                Visualisez les zones de conservation et les corridors migratoires grâce à notre système de cartographie haute précision.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Écotourisme Responsable</h3>
              <p className="text-stone-600 leading-relaxed">
                Découvrez des destinations uniques tout en finançant directement des projets de conservation locale à travers le monde.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Prêt à devenir un éco-citoyen ?</h2>
              <p className="text-stone-400 text-lg max-w-xl">
                Rejoignez notre communauté et contribuez à la préservation des espèces en danger partout sur le globe.
              </p>
            </div>
            <Link
              href="/inscription"
              className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-full font-bold text-lg whitespace-nowrap transition-all flex items-center"
            >
              Rejoindre l'aventure <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}