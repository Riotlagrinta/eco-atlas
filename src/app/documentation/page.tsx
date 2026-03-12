import React from 'react';
import { FileText, Download, Gavel, BookOpen } from 'lucide-react';
import * as motion from 'framer-motion/client';
import { getAllDocuments } from '@/lib/actions';

export const dynamic = "force-dynamic";

export default async function DocumentationPage() {
  const docs = await getAllDocuments();

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-16">
        <h1 className="text-4xl font-bold text-stone-900 mb-4 flex items-center">
          <BookOpen className="h-10 w-10 text-green-600 mr-4" /> Centre de Documentation
        </h1>
        <p className="text-stone-500 text-lg">Retrouvez les textes de loi, les rapports scientifiques et les guides de bonnes pratiques environnementales au Togo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {docs.length > 0 ? docs.map((doc: any, index: number) => (
            <div
              key={doc.id}
              className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-stone-900">{doc.title}</h3>
                  <p className="text-stone-500 text-sm">{doc.description}</p>
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase mt-2 inline-block">
                    {doc.category}
                  </span>
                </div>
              </div>
              <a
                href={doc.fileUrl}
                target="_blank"
                className="p-4 bg-stone-900 text-white rounded-2xl hover:bg-green-600 transition-all shadow-lg"
              >
                <Download className="h-5 w-5" />
              </a>
            </div>
          )) : (
            <div className="text-center py-24 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
              <p className="text-stone-400 font-medium">Aucun document disponible pour le moment.</p>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-stone-900 text-white p-8 rounded-3xl shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center text-green-400">
              <Gavel className="h-6 w-6 mr-2" /> Le Droit Forestier
            </h3>
            <p className="text-stone-400 text-sm leading-relaxed mb-8">
              Le nouveau Code Forestier du Togo (Loi n° 2008-009) renforce la protection des ressources forestières et la participation des citoyens.
            </p>
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10 text-xs font-medium text-stone-300">
              Saviez-vous que couper un arbre sans autorisation est passible d&apos;amendes au Togo ?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
