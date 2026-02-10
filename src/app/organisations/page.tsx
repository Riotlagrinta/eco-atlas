'use client';

import React from 'react';
import { ShieldCheck, MapPin, Globe, ExternalLink, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const organisations = [
  {
    name: "ANAE (Association Nature & Environnement)",
    type: "ONG Nationale",
    desc: "Spécialisée dans la protection de la faune et la sensibilisation des communautés rurales au Nord Togo.",
    location: "Dapaong, Togo",
    focus: "Conservation / Éducation",
    website: "https://example.com"
  },
  {
    name: "MERN (Ministère de l'Environnement et des Ressources Forestières)",
    type: "Institution Publique",
    desc: "L'autorité officielle en charge de la gestion des parcs nationaux et du code forestier togolais.",
    location: "Lomé, Togo",
    focus: "Régulation / Protection",
    website: "https://environnement.gouv.tg"
  },
  {
    name: "JVE (Jeunes Volontaires pour l'Environnement)",
    type: "Association Internationale",
    desc: "Mouvement de jeunes engagés dans le développement durable et la justice climatique au Togo.",
    location: "Lomé, Togo",
    focus: "Climat / Jeunesse",
    website: "https://jve-international.net"
  }
];

export default function OrganisationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-stone-900 mb-4 flex items-center">
          <ShieldCheck className="h-10 w-10 text-green-600 mr-4" /> Acteurs de la Conservation
        </h1>
        <p className="text-stone-500 text-lg">Découvrez les organisations qui œuvrent chaque jour pour protéger le patrimoine naturel du Togo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {organisations.map((org, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">{org.type}</span>
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-4">{org.name}</h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-8">{org.desc}</p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-xs text-stone-400 font-medium">
                  <MapPin className="h-4 w-4 mr-2 text-stone-300" /> {org.location}
                </div>
                <div className="flex items-center text-xs text-stone-400 font-medium">
                  <ShieldCheck className="h-4 w-4 mr-2 text-stone-300" /> Spécialité : {org.focus}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-50 flex gap-4">
              <a href={org.website} target="_blank" className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-green-600 transition-all">
                Site Web <ExternalLink className="ml-2 h-3 w-3" />
              </a>
              <button className="p-3 border border-stone-100 rounded-xl hover:bg-stone-50 transition-all text-stone-400 hover:text-green-600">
                <Mail className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
