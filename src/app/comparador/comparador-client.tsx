'use client';

import { useState } from 'react';

export default function ComparadorClient() {
  const [stringA, setStringA] = useState('');
  const [stringB, setStringB] = useState('');

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-playfair text-xl font-bold mb-4 text-foreground">Corda A</h2>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-neutral-500">Selecione a primeira corda</span>
          <select
            value={stringA}
            onChange={(e) => setStringA(e.target.value)}
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none text-foreground"
          >
            <option value="">— Selecione —</option>
            <option value="dominant">Dominant</option>
            <option value="evah">Evah Pirazzi</option>
            <option value="obligato">Obligato</option>
            <option value="tonica">Tonica</option>
          </select>
        </label>
        {stringA && (
          <p className="text-sm text-neutral-400 mt-4">
            Você selecionou: <strong className="text-neon">{stringA}</strong>
          </p>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-playfair text-xl font-bold mb-4 text-foreground">Corda B</h2>
        <label className="flex flex-col gap-2">
          <span className="text-sm text-neutral-500">Selecione a segunda corda</span>
          <select
            value={stringB}
            onChange={(e) => setStringB(e.target.value)}
            className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none text-foreground"
          >
            <option value="">— Selecione —</option>
            <option value="dominant">Dominant</option>
            <option value="evah">Evah Pirazzi</option>
            <option value="obligato">Obligato</option>
            <option value="tonica">Tonica</option>
          </select>
        </label>
        {stringB && (
          <p className="text-sm text-neutral-400 mt-4">
            Você selecionou: <strong className="text-neon">{stringB}</strong>
          </p>
        )}
      </div>

      {stringA && stringB && (
        <div className="md:col-span-2 bg-surface border border-border rounded-xl p-6 text-center text-sm text-neutral-400">
          Comparação matemática detalhada em desenvolvimento. Em breve aqui você verá
          tensão, durabilidade e projeção lado a lado.
        </div>
      )}
    </section>
  );
}