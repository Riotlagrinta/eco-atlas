'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Brain, Trophy, ArrowRight, Loader2, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  image_url: string;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export default function QuizPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchQuizzes() {
      const { data } = await supabase.from('quizzes').select('*');
      if (data) setQuizzes(data);
      setLoading(false);
    }
    fetchQuizzes();
  }, [supabase]);

  const startQuiz = async (quiz: Quiz) => {
    setLoading(true);
    const { data } = await supabase.from('questions').select('*').eq('quiz_id', quiz.id);
    if (data) {
      setQuestions(data);
      setActiveQuiz(quiz);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
    }
    setLoading(false);
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const correct = index === questions[currentIndex].correct_index;
    setIsCorrect(correct);
    if (correct) setScore(score + 1);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setShowResult(true);
        saveResult();
      }
    }, 2000);
  };

  const saveResult = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('quiz_results').insert([{
        user_id: user.id,
        quiz_id: activeQuiz?.id,
        score: score,
        total_questions: questions.length
      }]);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-green-600 h-10 w-10" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 bg-white min-h-screen">
      <div className="mb-16 text-center">
        <h1 className="text-4xl font-bold text-stone-900 mb-4 flex items-center justify-center">
          <Brain className="h-10 w-10 text-green-600 mr-4" /> Le Quizz de la Nature
        </h1>
        <p className="text-stone-500 text-lg">Testez vos connaissances et devenez un expert de la biodiversité du Togo.</p>
      </div>

      {!activeQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {quizzes.map((quiz) => (
            <motion.div 
              key={quiz.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden group cursor-pointer"
              onClick={() => startQuiz(quiz)}
            >
              <div className="h-48 bg-stone-100 relative">
                <img src={quiz.image_url} className="w-full h-full object-cover" alt={quiz.title} />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-green-600 uppercase tracking-widest">{quiz.difficulty}</div>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-stone-900 mb-2 group-hover:text-green-600 transition-colors">{quiz.title}</h3>
                <p className="text-stone-500 text-sm mb-6">{quiz.description}</p>
                <div className="flex items-center text-green-600 font-bold text-sm">
                  Commencer le défi <ArrowRight className="ml-2 h-4 w-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : showResult ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 bg-stone-50 rounded-3xl border border-stone-100">
          <Trophy className="h-20 w-20 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-stone-900 mb-2">Quizz Terminé !</h2>
          <p className="text-stone-500 text-lg mb-8">Votre score : <span className="text-green-600 font-bold">{score} / {questions.length}</span></p>
          <button 
            onClick={() => setActiveQuiz(null)}
            className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-600 transition-all"
          >
            Retour aux quizz
          </button>
        </motion.div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 flex justify-between items-end">
            <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Question {currentIndex + 1} sur {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`h-1.5 w-8 rounded-full ${i <= currentIndex ? 'bg-green-500' : 'bg-stone-100'}`}></div>
              ))}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-stone-900 mb-10 leading-relaxed">{questions[currentIndex].question_text}</h2>

          <div className="space-y-4">
            {questions[currentIndex].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                className={`w-full p-6 rounded-2xl border-2 text-left font-bold transition-all flex justify-between items-center ${
                  selectedOption === index 
                    ? (isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700')
                    : 'border-stone-100 bg-white text-stone-600 hover:border-green-200'
                }`}
              >
                {option}
                {selectedOption === index && (isCorrect ? <CheckCircle className="h-5 w-5" /> : <X className="h-5 w-5" />)}
              </button>
            ))}
          </div>

          {selectedOption !== null && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-blue-800 text-sm leading-relaxed"><span className="font-bold">Le saviez-vous ?</span> {questions[currentIndex].explanation}</p>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
}

function X({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
}
