export const metadata = {
  title: 'Diretório de Professores | Portal NKL',
  description: 'Encontre professores de música e instrumentos.',
};

export default function ProfessoresPage() {
  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Professores</h1>
        <p className="text-neutral-500 mt-2">
          Encontre professores de violino, viola, violoncelo e teoria musical perto de você.
        </p>
      </div>

      <div className="bg-surface/50 border border-dashed border-border rounded-xl p-12 text-center text-neutral-400">
        <p className="text-lg font-medium mb-2">Nenhum professor cadastrado ainda</p>
        <p>Plataforma em fase de expansão. Novas funcionalidades estarão disponíveis em breve.</p>
      </div>
    </main>
  );
}