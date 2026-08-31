export const metadata = {
  title: 'Lojas | Portal NKL',
  description: 'Encontre lojas de instrumentos e acessórios.',
};

export default function LojasPage() {
  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Lojas</h1>
        <p className="text-neutral-500 mt-2">
          Descubra lojas de instrumentos, arcos, cordas e acessórios perto de você.
        </p>
      </div>

      <div className="bg-surface/50 border border-dashed border-border rounded-xl p-12 text-center text-neutral-400">
        <p className="text-lg font-medium mb-2">Nenhuma loja cadastrada ainda</p>
        <p>Plataforma em fase de expansão. Novas funcionalidades estarão disponíveis em breve.</p>
      </div>
    </main>
  );
}