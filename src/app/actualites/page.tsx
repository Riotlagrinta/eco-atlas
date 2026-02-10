'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Newspaper, Calendar, User, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  content: string;
  image_url: string;
  category: string;
  created_at: string;
}

export default function ActualitesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchArticles() {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setArticles(data);
      setLoading(false);
    }
    fetchArticles();
  }, [supabase]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 flex items-center justify-center">
          <Newspaper className="h-10 w-10 text-green-600 mr-4" /> Échos de la Nature
        </h1>
        <p className="text-stone-500 text-lg max-w-2xl mx-auto">
          Découvrez les dernières nouvelles sur la biodiversité, les projets de conservation et les initiatives locales au Togo.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group bg-white rounded-3xl border border-stone-100 shadow-sm hover:shadow-xl transition-all overflow-hidden"
            >
              <div className="relative h-64 overflow-hidden bg-stone-100">
                <img 
                  src={article.image_url || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80'} 
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-green-700 uppercase tracking-widest">
                  {article.category}
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-center text-stone-400 text-xs mb-4 space-x-4">
                  <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(article.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <h3 className="text-xl font-bold text-stone-900 mb-4 group-hover:text-green-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-stone-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                  {article.content}
                </p>
                <button className="flex items-center text-green-600 font-bold text-sm hover:translate-x-2 transition-transform">
                  Lire la suite <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">
          <p className="text-stone-400 font-medium text-lg text-center">Aucun article publié pour le moment.</p>
        </div>
      )}
    </div>
  );
}
