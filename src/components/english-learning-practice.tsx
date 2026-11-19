'use client';

import { useState } from 'react';

export type LearningPracticeQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};

const defaultQuestions: LearningPracticeQuestion[] = [
  {
    prompt: 'Complete: “I ___ from Brazil.”',
    options: ['am', 'is', 'are'],
    answer: 'am',
    explanation: 'Com “I”, usamos “am”: I am from Brazil.',
  },
  {
    prompt: 'Qual frase significa “Eu trabalho em casa”?',
    options: ['I work at home.', 'I working home.', 'I am work home.'],
    answer: 'I work at home.',
    explanation: 'No presente simples, usamos “I work”. “At home” significa “em casa”.',
  },
  {
    prompt: 'Complete: “She ___ English every day.”',
    options: ['study', 'studies', 'studying'],
    answer: 'studies',
    explanation: 'Com he/she/it, o verbo no presente simples normalmente recebe -s ou -es.',
  },
];

export function EnglishLearningPractice({
  questions = defaultQuestions,
  labels = {
    eyebrow: 'Pratique agora',
    title: 'Um diagnóstico rápido, sem nota e sem vergonha',
    description: 'Responda, leia a explicação e volte amanhã. O objetivo é identificar o próximo passo, não provar que você já sabe.',
    score: 'Acertos nesta visita',
    correct: 'Correto!',
    retry: 'Ainda não.',
  },
}: {
  questions?: LearningPracticeQuestion[];
  labels?: {
    eyebrow: string;
    title: string;
    description: string;
    score: string;
    correct: string;
    retry: string;
  };
}) {
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [streak, setStreak] = useState(0);

  function answer(index: number, option: string): void {
    setSelected((current) => ({ ...current, [index]: option }));
    const next = questions.every((question, questionIndex) => (
      questionIndex === index
        ? option === question.answer
        : selected[questionIndex] === questions[questionIndex]?.answer
    )) ? streak + 1 : streak;
    setStreak(next);
  }

  return (
    <section id="pratica" className="mt-14 scroll-mt-24">
      <div className="rounded-2xl border border-neon/25 bg-neon/5 p-5 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">{labels.eyebrow}</p>
            <h2 className="mt-2 font-playfair text-3xl font-bold md:text-5xl">{labels.title}</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-foreground/70">{labels.description}</p>
          </div>
          <p className="rounded-full border border-neon/30 px-4 py-2 text-sm font-bold text-neon" aria-live="polite">{labels.score}: {streak}</p>
        </div>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {questions.map((question, index) => {
            const choice = selected[index];
            const isCorrect = choice === question.answer;
            return (
              <article key={question.prompt} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-sm font-bold leading-relaxed">{index + 1}. {question.prompt}</p>
                <div className="mt-4 space-y-2">
                  {question.options.map((option) => (
                    <button
                      type="button"
                      key={option}
                      onClick={() => answer(index, option)}
                      className={`min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:border-neon ${
                        choice === option
                          ? isCorrect ? 'border-emerald-500 bg-emerald-500/10' : 'border-red-500 bg-red-500/10'
                          : 'border-border'
                      }`}
                      aria-pressed={choice === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {choice && (
                  <p className={`mt-3 text-xs leading-relaxed ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                    {isCorrect ? `${labels.correct} ` : `${labels.retry} `} {question.explanation}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
