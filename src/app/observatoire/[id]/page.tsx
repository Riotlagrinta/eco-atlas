import React from 'react';
import { getSpeciesById, addSpeciesComment } from '@/lib/actions';
import { MapPin, ArrowLeft, Share2, MessageSquare, Send, User, Camera, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { VotePanel } from '@/components/VotePanel';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

import { DynamicMap } from '@/components/DynamicMap';

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  'CR': 'bg-red-600', 'EN': 'bg-orange-600', 'VU': 'bg-yellow-500', 'NT': 'bg-blue-500', 'LC': 'bg-green-500',
};

const statusLabels: Record<string, string> = {
  'CR': 'En danger critique', 'EN': 'En danger', 'VU': 'Vulnérable', 'NT': 'Quasi menacé', 'LC': 'Préoccupation mineure',
};

export default async function SpeciesDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const species = await getSpeciesById(id);
  const session = await auth();

  if (!species) return <div className="text-center py-24">Espèce non trouvée.</div>;

  async function handleSendComment(formData: FormData) {
    'use server';
    const content = formData.get('content') as string;
    if (!content) return;
    
    await addSpeciesComment(id, content);
    revalidatePath(`/observatoire/${id}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 bg-white min-h-screen">
      <Link href="/observatoire" className="inline-flex items-center text-stone-400 hover:text-green-600 font-bold text-sm mb-8 transition-colors group">
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Retour à l&apos;observatoire
      </Link>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden mb-12">
        <div className="relative h-64 md:h-[50vh]">
          {species.imageUrl && <Image src={species.imageUrl} className="object-cover" alt={species.name} fill />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8 z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{species.name}</h1>
            <p className="text-stone-200 text-lg italic">{species.scientificName}</p>
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
            <div className={`px-6 py-2 rounded-2xl text-sm font-bold text-white shadow-lg ${statusColors[species.conservationStatus || 'LC']}`}>
              Statut UICN : {statusLabels[species.conservationStatus || 'LC']}
            </div>
            <div className="flex gap-4">
              <button
                className="flex items-center gap-2 px-6 py-3 bg-green-50 text-green-600 font-bold rounded-2xl hover:bg-green-100 transition-all border border-green-100"
              >
                <Share2 className="h-5 w-5" /> Partager
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              { label: 'Habitat Togo', value: species.habitat },
              { label: 'Régime Alimentaire', value: species.diet },
              { label: 'Population', value: species.populationEstimate }
            ].map((item, i) => (
              <div key={i} className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">{item.label}</h4>
                <p className="text-sm font-bold text-stone-800 leading-relaxed">{item.value || "Donnée en cours de collecte"}</p>
              </div>
            ))}
          </div>

          <div className="prose prose-stone max-w-none mb-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">Description et Importance Écologique</h2>
            <p className="text-stone-600 leading-relaxed text-lg whitespace-pre-wrap">{species.description}</p>
          </div>

          {/* Carte de Répartition */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-stone-900 mb-6 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-green-600" /> Zone d&apos;observation au Togo
            </h3>
            <div className="h-80 rounded-3xl overflow-hidden border border-stone-200 shadow-inner">
              <DynamicMap filter="species" />
            </div>
          </div>

          {/* Section Signalements Récents */}
          <div className="mb-16">
            <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
              <Camera className="h-5 w-5 mr-2 text-green-600" /> Signalements Récents
            </h3>

            {species.observations.length > 0 ? (
              <div className="space-y-12">
                {species.observations.map((obs) => (
                  <div key={obs.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start bg-stone-50 p-6 rounded-3xl border border-stone-100">
                    <div className="space-y-4">
                      <div className="relative h-64 rounded-2xl overflow-hidden shadow-md">
                        {obs.imageUrl && <Image src={obs.imageUrl} className="object-cover" alt="Observation" fill />}
                        {obs.isVerified && (
                          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shadow-lg">
                            <CheckCircle className="h-3 w-3" /> Validé
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-white border border-stone-200 overflow-hidden relative flex-shrink-0">
                          {obs.user?.image ? (
                            <Image src={obs.user.image} className="object-cover" alt="Avatar" fill />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{obs.user?.name || "Éco-citoyen"}</p>
                          <p className="text-[10px] text-stone-400 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" /> {obs.createdAt ? new Date(obs.createdAt).toLocaleDateString('fr-FR') : ''}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-stone-600 leading-relaxed italic px-2">
                        &quot;{obs.description}&quot;
                      </p>
                    </div>

                    <div className="lg:pt-0">
                      <VotePanel observationId={obs.id} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
                <p className="text-stone-400 font-medium">Aucun signalement récent pour cette espèce.</p>
                <Link href="/signaler" className="text-green-600 font-bold text-sm mt-2 inline-block hover:underline">
                  Soyez le premier à la signaler !
                </Link>
              </div>
            )}
          </div>

          {/* Section Discussion */}
          <div className="bg-stone-50 p-8 rounded-3xl border border-stone-100">
            <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" /> Discussion Communautaire ({species.comments.length})
            </h3>

            <div className="space-y-6 mb-10">
              {species.comments.map((c) => (
                <div key={c.id} className="flex space-x-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-stone-200 overflow-hidden flex-shrink-0 shadow-sm relative">
                    {c.user?.image ? <Image src={c.user.image} className="object-cover" alt="Avatar" fill /> : <User className="h-6 w-6 text-stone-300" />}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                      <p className="font-bold text-sm text-stone-900 mb-1">{c.user?.name || "Éco-citoyen"}</p>
                      <p className="text-stone-600 leading-relaxed">{c.content}</p>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-2 ml-3 font-bold uppercase">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                  </div>
                </div>
              ))}
            </div>

            {session ? (
              <form action={handleSendComment} className="relative">
                <input
                  name="content"
                  type="text"
                  placeholder="Ajoutez une information ou posez une question..."
                  className="w-full pl-6 pr-16 py-5 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                />
                <button type="submit" className="absolute right-4 top-4 p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
                  <Send className="h-5 w-5" />
                </button>
              </form>
            ) : (
                <div className="text-center p-6 bg-white rounded-2xl border border-stone-200">
                    <p className="text-stone-500 text-sm">Connectez-vous pour participer à la discussion.</p>
                    <Link href="/connexion" className="text-green-600 font-bold hover:underline text-sm">Se connecter</Link>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
