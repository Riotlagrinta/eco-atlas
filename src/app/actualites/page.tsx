'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Newspaper, Calendar, User, ArrowRight, Loader2, MessageSquare, Send, X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchArticles() {
      const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
      if (data) setArticles(data);
      setLoading(false);
    }
    fetchArticles();
  }, [supabase]);

  const fetchComments = async (articleId: string) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('article_id', articleId)
      .order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Connectez-vous pour commenter !");

    const { error } = await supabase.from('comments').insert([{
      user_id: user.id,
      article_id: selectedArticle?.id,
      content: newComment
    }]);

    if (!error) {
      setNewComment('');
      fetchComments(selectedArticle!.id);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white min-h-screen">
      {/* Lecteur d'Article & Commentaires */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-100/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl relative border border-stone-200"
            >
              <div className="relative h-64 md:h-80">
                <img src={selectedArticle.image_url} className="w-full h-full object-cover" alt="Article" />
                <button onClick={() => setSelectedArticle(null)} className="absolute top-4 right-4 bg-white shadow-lg p-2 rounded-full hover:bg-stone-100 transition-all"><X className="h-6 w-6" /></button>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-lg">{selectedArticle.category}</span>
                    <h2 className="text-3xl font-bold text-stone-900 mt-4">{selectedArticle.title}</h2>
                  </div>
                  <button 
                    onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(selectedArticle.title + " - Lu sur Eco-Atlas Togo : " + window.location.href)}`, '_blank')}
                    className="flex items-center text-xs font-bold text-green-600 hover:bg-green-50 px-4 py-2 rounded-xl border border-green-100 transition-all"
                  >
                    <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                  </button>
                </div>

                <p className="text-stone-600 leading-relaxed whitespace-pre-wrap mb-12 border-b border-stone-100 pb-12">{selectedArticle.content}</p>

                {/* Section Commentaires */}
                <div className="bg-stone-50 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold text-stone-900 mb-8 flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2 text-green-600" /> Discussion ({comments.length})
                  </h3>

                  <div className="space-y-6 mb-8">
                    {comments.map((c) => (
                      <div key={c.id} className="flex space-x-4">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-stone-200 overflow-hidden flex-shrink-0">
                          {c.profiles?.avatar_url ? <img src={c.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-stone-300" />}
                        </div>
                        <div className="flex-1">
                          <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm relative">
                            <p className="font-bold text-xs text-stone-900 mb-1">{c.profiles?.full_name || "Anonyme"}</p>
                            <p className="text-sm text-stone-600 leading-relaxed">{c.content}</p>
                          </div>
                          <span className="text-[10px] text-stone-400 mt-1 ml-2">{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendComment} className="relative">
                    <input 
                      type="text" 
                      placeholder="Ajouter un commentaire..." 
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full pl-6 pr-12 py-4 bg-white border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
                    />
                    <button type="submit" className="absolute right-3 top-3 p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                <button 
                  onClick={() => {
                    setSelectedArticle(article);
                    fetchComments(article.id);
                  }}
                  className="flex items-center text-green-600 font-bold text-sm hover:translate-x-2 transition-transform"
                >
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
