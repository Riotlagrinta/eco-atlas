'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Leaf, Mail, Lock, Loader2, AlertCircle, Github } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConnexionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGitHubLogin = async () => {
    setLoading(true);
    try {
      await signIn('github', { callbackUrl: '/' });
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-stone-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-stone-900">Bon retour sur Eco-Atlas</h1>
            <p className="text-stone-500 mt-2 text-sm">Connectez-vous pour protéger la biodiversité</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Github className="h-5 w-5" />}
              Continuer avec GitHub
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-stone-500">Ou (Bientôt disponible)</span>
              </div>
            </div>

            <div className="space-y-4 opacity-50 pointer-events-none">
              <div className="relative">
                <input
                  disabled
                  type="email"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none text-sm"
                  placeholder="nom@exemple.com"
                />
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
              </div>
              <div className="relative">
                <input
                  disabled
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl outline-none text-sm"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-stone-400" />
              </div>
              <button disabled className="w-full bg-stone-200 text-stone-500 font-bold py-3.5 rounded-xl cursor-not-allowed">
                Se connecter par email
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-stone-500">
            Pas encore de compte ?{' '}
            <Link href="/inscription" className="font-bold text-green-600 hover:text-green-700 underline underline-offset-4">
              S&apos;inscrire gratuitement
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
