import type { Metadata } from 'next';
import { AnunciarForm } from '@/components/anunciar-form';

export const metadata: Metadata = {
  title: 'Anunciar | Portal NKL',
  description: 'Publique seu anúncio no mural do Portal NKL.',
};

export default function AnunciarPage() {
  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-3xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Anunciar</h1>
        <p className="text-neutral-500 mt-2">
          Divulgue seu instrumento, serviços ou evento para a comunidade. Seu anúncio
          passa por aprovação da equipe antes de ir ao ar.
        </p>
      </div>

      {/* Tarefa 9 — form de anúncio (fila de aprovação status=pending) */}
      <AnunciarForm />
    </main>
  );
}