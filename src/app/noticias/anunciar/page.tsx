export const metadata = {
  title: 'Anunciar | Portal NKL',
  description: 'Publique seu anúncio no mural do Portal NKL.',
};

export default function AnunciarPage() {
  return (
    <main className="min-h-screen pt-[120px] pb-12 flex flex-col max-w-7xl mx-auto px-4">
      <div className="mb-10">
        <h1 className="font-playfair text-4xl font-bold text-foreground">Anunciar</h1>
        <p className="text-neutral-500 mt-2">
          Divulgue seu instrumento, serviços ou evento para a comunidade.
        </p>
      </div>

      <div className="bg-surface/50 border border-dashed border-border rounded-xl p-12 text-center text-neutral-400">
        <p className="text-lg font-medium mb-2">Central de anúncios em construção</p>
        <p>Plataforma em fase de expansão. Novas funcionalidades estarão disponíveis em breve.</p>
      </div>
    </main>
  );
}