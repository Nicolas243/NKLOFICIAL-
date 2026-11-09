export function AffiliateDisclaimer() {
  return (
    <details className="rounded-lg border border-neon/20 bg-neon/5 text-sm text-foreground/75">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 font-bold text-foreground transition-colors hover:bg-neon/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
        <span>Sobre links de parceria</span>
        <span aria-hidden="true" className="text-lg leading-none">+</span>
      </summary>
      <p className="border-t border-neon/20 px-4 py-3 leading-relaxed">
        O Portal NKL pode receber comissão por alguns links de parceria. Isso não aumenta seu custo e não compra uma avaliação positiva. Confirme regras, disponibilidade e pagamento diretamente na plataforma antes de começar.
      </p>
    </details>
  );
}
