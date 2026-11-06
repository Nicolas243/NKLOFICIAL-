'use client';

import Link from 'next/link';
import { useState } from 'react';

type WizardStep = 'start' | 'device' | 'currency' | 'english' | 'result';
type Device = 'celular' | 'computador';
type Currency = 'brl' | 'usd';
type English = 'sim' | 'nao';

const DEVICE_OPTIONS: Array<{ value: Device; label: string }> = [
  { value: 'celular', label: 'Celular' },
  { value: 'computador', label: 'Computador' },
];
const CURRENCY_OPTIONS: Array<{ value: Currency; label: string }> = [
  { value: 'brl', label: 'Reais' },
  { value: 'usd', label: 'Dólar' },
];
const ENGLISH_OPTIONS: Array<{ value: English; label: string }> = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Ainda não' },
];

export function IncomeWizardBanner() {
  const [step, setStep] = useState<WizardStep>('start');
  const [device, setDevice] = useState<Device | null>(null);
  const [currency, setCurrency] = useState<Currency | null>(null);
  const [english, setEnglish] = useState<English | null>(null);

  function chooseDevice(value: Device): void {
    setDevice(value);
    setStep('currency');
  }

  function chooseCurrency(value: Currency): void {
    setCurrency(value);
    setStep('english');
  }

  function chooseEnglish(value: English): void {
    setEnglish(value);
    setStep('result');
  }

  function reset(): void {
    setStep('start');
    setDevice(null);
    setCurrency(null);
    setEnglish(null);
  }

  const resultQuery = new URLSearchParams({
    objetivo: device ?? '',
    moeda: currency ?? '',
    ingles: english ?? '',
  }).toString();

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-orange-500/40 bg-[linear-gradient(120deg,#07152d_0%,#0b5ed7_58%,#f97316_150%)] p-5 text-white shadow-[0_12px_30px_rgba(11,94,215,0.18)] md:rounded-[2rem] md:p-8" aria-labelledby="income-wizard-title">
      {step === 'start' && (
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">Guia interativo</p>
            <h2 id="income-wizard-title" className="mt-2 font-playfair text-2xl font-bold md:text-4xl">Ainda não sabe por onde começar?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85 md:text-base">Responda a 3 perguntas e descubra a melhor oportunidade para o seu perfil.</p>
          </div>
          <button type="button" onClick={() => setStep('device')} className="min-h-11 shrink-0 rounded-md bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-400">Começar guia</button>
        </div>
      )}
      {step !== 'start' && step !== 'result' && (
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">Pergunta {step === 'device' ? '1' : step === 'currency' ? '2' : '3'} de 3</p>
            <button type="button" onClick={reset} className="text-xs font-bold text-white/75 underline hover:text-white">Recomeçar</button>
          </div>
          <h2 id="income-wizard-title" className="mt-2 font-playfair text-2xl font-bold">
            {step === 'device' && 'Você prefere usar celular ou computador?'}
            {step === 'currency' && 'Quer receber em Reais ou Dólar?'}
            {step === 'english' && 'Você tem inglês?'}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {(step === 'device' ? DEVICE_OPTIONS : step === 'currency' ? CURRENCY_OPTIONS : ENGLISH_OPTIONS).map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  if (step === 'device') chooseDevice(option.value as Device);
                  if (step === 'currency') chooseCurrency(option.value as Currency);
                  if (step === 'english') chooseEnglish(option.value as English);
                }}
                className="min-h-11 rounded-md border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold transition hover:border-orange-200 hover:bg-orange-500"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 'result' && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-200">Seu próximo passo</p>
          <h2 id="income-wizard-title" className="mt-2 font-playfair text-2xl font-bold">Veja oportunidades compatíveis com suas respostas.</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/programas?${resultQuery}`} className="inline-flex min-h-11 items-center rounded-md bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-400">Ver seleção sugerida</Link>
            <button type="button" onClick={reset} className="min-h-11 rounded-md border border-white/40 px-5 py-3 text-sm font-bold hover:bg-white/10">Responder de novo</button>
          </div>
        </div>
      )}
    </section>
  );
}
