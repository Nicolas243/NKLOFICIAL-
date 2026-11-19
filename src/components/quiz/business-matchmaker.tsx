'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { processQuiz } from '@/actions/process-quiz';
import { QUIZ_QUESTIONS } from '@/config/quiz-questions';
import type { QuizAnswerMap } from '@/db/schema';
import type { QuizResult } from '@/lib/quiz-result';

const ANSWERS_STORAGE_KEY = 'nkl-business-quiz-answers';
const RESULT_STORAGE_KEY = 'nkl-business-quiz-result';

export function BusinessMatchmaker() {
  const router = useRouter();
  const [answers, setAnswers] = useState<QuizAnswerMap>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = window.localStorage.getItem(ANSWERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) as QuizAnswerMap : {};
    } catch (storageError) {
      console.error('[BUSINESS_QUIZ] Não foi possível recuperar respostas locais:', storageError);
      return {};
    }
  });
  const [current, setCurrent] = useState(0);
  const [email, setEmail] = useState('');
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const question = QUIZ_QUESTIONS[current];
  const progress = ((current + (isGateOpen ? 1 : 0)) / QUIZ_QUESTIONS.length) * 100;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  useEffect(() => {
    window.localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  function chooseAnswer(weight: number): void {
    if (!question) return;
    const nextAnswers = { ...answers, [question.id]: weight };
    setAnswers(nextAnswers);
    setError(null);
    if (current === QUIZ_QUESTIONS.length - 1) {
      setIsGateOpen(true);
    } else {
      setCurrent((value) => value + 1);
    }
  }

  function goBack(): void {
    if (isGateOpen) {
      setIsGateOpen(false);
      setCurrent(QUIZ_QUESTIONS.length - 1);
      return;
    }
    setCurrent((value) => Math.max(0, value - 1));
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!privacyConsent) {
      setError('Confirme o consentimento com a Política de Privacidade para ver seu resultado.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const result = await processQuiz({ email, answers, privacyConsent: true });
      window.localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
      window.localStorage.removeItem(ANSWERS_STORAGE_KEY);
      router.push('/resultado');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Não foi possível processar seu resultado.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl rounded-[2rem] border border-border bg-surface/90 p-5 shadow-[0_20px_60px_rgba(70,55,35,0.12)] md:p-10" aria-labelledby="quiz-title">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-neon">
          <span>{isGateOpen ? 'Resultado pronto' : `Pergunta ${current + 1} de ${QUIZ_QUESTIONS.length}`}</span>
          <span>{answeredCount}/50 respondidas</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label="Progresso do diagnóstico"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <motion.div className="h-full rounded-full bg-neon" animate={{ width: `${progress}%` }} transition={{ duration: 0.25 }} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isGateOpen ? (
          <motion.form key="gate" onSubmit={submit} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-6">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-neon">Último passo</p>
              <h2 id="quiz-title" className="mt-3 font-playfair text-3xl font-bold md:text-5xl">Informe seu e-mail para abrir o diagnóstico</h2>
              <p className="mt-4 leading-relaxed opacity-75">
                Seu e-mail registra este diagnóstico no Portal NKL. O resultado completo abre imediatamente na página /resultado e fica salvo neste navegador.
              </p>
            </div>
            <label className="block text-sm font-bold" htmlFor="quiz-email">
              E-mail
              <input id="quiz-email" name="email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-border bg-background px-4 text-base font-normal outline-none focus:border-neon" placeholder="voce@exemplo.com" />
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4 text-sm leading-relaxed" htmlFor="quiz-privacy-consent">
              <input
                id="quiz-privacy-consent"
                name="privacyConsent"
                type="checkbox"
                required
                checked={privacyConsent}
                onChange={(event) => setPrivacyConsent(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border accent-neon"
              />
              <span>
                Concordo com o registro do meu e-mail e das respostas deste diagnóstico nos termos da{' '}
                <Link href="/privacidade" className="font-bold text-neon underline">
                  Política de Privacidade
                </Link>{' '}
                (LGPD).
              </span>
            </label>
            {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={goBack} className="min-h-11 rounded-lg border border-border px-5 py-3 text-sm font-bold hover:border-neon">Voltar</button>
              <button type="submit" disabled={isProcessing || !privacyConsent} className="min-h-11 flex-1 rounded-lg bg-neon px-5 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-60">
                {isProcessing ? 'Processando...' : 'Ver meu resultado imediato'}
              </button>
            </div>
          </motion.form>
        ) : question ? (
          <motion.div key={question.id} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-neon">{question.axis}</p>
            <h2 id="quiz-title" className="mt-3 font-playfair text-3xl font-bold leading-tight md:text-5xl">{question.text}</h2>
            <div className="mt-8 grid gap-3">
              {question.options.map((option) => (
                <button key={option.label} type="button" onClick={() => chooseAnswer(option.weight)} className={`min-h-14 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-neon hover:bg-neon/10 ${answers[question.id] === option.weight ? 'border-neon bg-neon/10' : 'border-border'}`}>
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-between">
              <button type="button" onClick={goBack} disabled={current === 0} className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-bold disabled:invisible hover:border-neon">Voltar</button>
              <span className="self-center text-xs opacity-60">Escolha a alternativa mais próxima da sua realidade.</span>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export type { QuizResult };
