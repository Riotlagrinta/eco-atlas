'use client';

import React from 'react';
import Link from 'next/link';
import { Leaf, CheckCircle2, Github, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';

export default function InscriptionPage() {
  const handleGitHubSignup = () => {
    signIn('github', { callbackUrl: '/' });
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
            <h1 className="text-2xl font-bold text-stone-900">Rejoindre Eco-Atlas</h1>
            <p className="text-stone-500 mt-2 text-sm">Créez votre compte via nos partenaires sécurisés</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGitHubSignup}
              className="w-full flex items-center justify-center gap-3 bg-stone-900 hover:bg-stone-800 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all"
            >
              <Github className="h-5 w-5" />
              S&apos;inscrire avec GitHub
            </button>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start text-blue-700 text-xs leading-relaxed">
              <CheckCircle2 className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
              <span>
                En vous inscrivant, vous rejoignez une communauté de naturalistes engagés pour la biodiversité du Togo. Vos données sont protégées.
              </span>
            </div>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-stone-500 italic">Autres options bientôt...</span>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-stone-500">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="font-bold text-green-600 hover:text-green-700 underline underline-offset-4 flex items-center justify-center mt-2">
              <LogIn className="h-4 w-4 mr-1" /> Se connecter
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
