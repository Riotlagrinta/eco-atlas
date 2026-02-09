'use client';

import React from 'react';
import { Leaf, Shield, Users, Target, MapPin, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AproposPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-green-900">
        <div className="absolute inset-0 opacity-50">
          <img
            src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&q=80"
            alt="Nature Togo"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Notre Mission
          </motion.h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto text-stone-200">
            Préserver le patrimoine naturel unique du Togo pour les générations futures.
          </p>
        </div>
      </section>

      {/* Vision & Goals */}
      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-6">L'Observatoire Citoyen du Togo</h2>
            <p className="text-stone-600 text-lg leading-relaxed mb-6">
              Eco-Atlas est né d'une volonté simple : donner aux Togolais les outils pour découvrir et protéger leur environnement. 
              De la réserve de faune de l'Oti aux forêts sacrées des Plateaux, notre plateforme cartographie la vie sauvage pour mieux la défendre.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">Objectif Zéro Braconnage</h4>
                  <p className="text-stone-500">Documenter les populations pour aider les gardes-forestiers.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900">Éducation Environnementale</h4>
                  <p className="text-stone-500">Sensibiliser la jeunesse via nos documentaires exclusifs.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1501705388883-4ed8a543392c?auto=format&fit=crop&w=800&q=80" 
              className="rounded-3xl shadow-2xl relative z-10"
              alt="Nature togolais"
            />
            <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-green-100 rounded-3xl -z-10"></div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-stone-50 py-20 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <span className="block text-4xl font-bold text-green-600">5+</span>
              <span className="text-stone-500 font-medium">Parcs Nationaux</span>
            </div>
            <div>
              <span className="block text-4xl font-bold text-green-600">100%</span>
              <span className="text-stone-500 font-medium">Togolais</span>
            </div>
            <div>
              <span className="block text-4xl font-bold text-green-600">24/7</span>
              <span className="text-stone-500 font-medium">Surveillance</span>
            </div>
            <div>
              <span className="block text-4xl font-bold text-green-600">50+</span>
              <span className="text-stone-500 font-medium">Espèces suivies</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-stone-900 mb-4">Une question ? Un partenariat ?</h2>
        <p className="text-stone-600 mb-12 max-w-2xl mx-auto text-lg">
          Nous travaillons main dans la main avec les associations locales et le gouvernement pour une écologie participative.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <div className="flex items-center space-x-3 px-8 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
            <Mail className="h-6 w-6 text-green-600" />
            <span className="font-bold text-stone-900 text-lg">contact@eco-atlas.tg</span>
          </div>
          <div className="flex items-center space-x-3 px-8 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm">
            <MapPin className="h-6 w-6 text-green-600" />
            <span className="font-bold text-stone-900 text-lg">Lomé, Togo</span>
          </div>
        </div>
      </section>
    </div>
  );
}
