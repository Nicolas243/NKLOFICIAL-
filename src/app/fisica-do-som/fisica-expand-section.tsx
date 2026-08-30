'use client';

import { useState } from 'react';

interface SectionData {
  id: string;
  title: string;
  paragraphs: string[];
  formula: string;
  image: string;
}

export default function FisicaExpandSection({ section }: { section: SectionData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="p-6 md:p-10 bg-surface border border-border rounded-xl hover:border-neon transition-colors">
      <h2 className="font-playfair text-2xl font-bold text-neon border-b border-white/5 pb-3 mb-5">
        {section.title}
      </h2>
      {section.paragraphs.map((p, i) => (
        <p key={i} className="leading-relaxed opacity-90 mb-4" dangerouslySetInnerHTML={{ __html: p }} />
      ))}

      {/* Botão expandir fórmulas */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="text-neon dark:text-neon-dark font-bold text-sm hover:underline transition-all"
      >
        {expanded ? '▲ Em física dizemos (recolher)' : '▼ Em física dizemos: ver mais...'}
      </button>

      {expanded && (
        <div className="mt-4 p-5 bg-background/60 border border-border rounded-lg font-mono text-sm leading-relaxed text-foreground/80">
          {section.formula}
        </div>
      )}

      {/* Placeholder de imagem */}
      {section.image && section.image !== '/NKL/' && (
        <div className="mt-6 rounded-lg overflow-hidden bg-background/50 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.image} alt={section.title} className="w-full h-auto object-cover" />
        </div>
      )}
    </section>
  );
}