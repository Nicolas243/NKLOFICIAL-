import ComparadorClient from './comparador-client';

export const metadata = {
  title: 'Comparador de Cordas | Portal NKL',
  description: 'Compare suas cordas lado a lado.',
};

export default function ComparadorPage() {
  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Comparador de Cordas</h1>
        <p className="text-neutral-500 mt-2">Selecione duas cordas para comparar lado a lado.</p>
      </div>
      <ComparadorClient />
    </main>
  );
}