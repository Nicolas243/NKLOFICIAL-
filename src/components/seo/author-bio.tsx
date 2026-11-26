import Link from 'next/link';

type AuthorBioProps = {
  updatedLabel?: string;
};

/**
 * Bloco factual de autoria editorial baseado exclusivamente nos perfis oficiais do Portal NKL.
 */
export function AuthorBio({ updatedLabel }: AuthorBioProps) {
  return (
    <aside
      aria-label="Sobre o autor"
      className="mt-8 rounded-2xl border border-border bg-income-surface/80 p-5 md:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon">
        Autoria e revisão editorial
      </p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-playfair text-xl font-bold text-foreground">NKL_oficial</p>
          <p className="mt-1 text-sm leading-relaxed opacity-75">
            Engenheiro e criador de conteúdo responsável pela pesquisa, curadoria editorial e materiais práticos do Portal NKL.
          </p>
          {updatedLabel && (
            <p className="mt-1 text-xs opacity-60">{updatedLabel}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <Link
            href="/contatos"
            className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-neon hover:text-neon"
          >
            Perfil oficial e contatos
          </Link>
          <a
            href="https://www.instagram.com/nkloficial/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-neon hover:text-neon"
          >
            Instagram
          </a>
          <a
            href="https://www.youtube.com/@nkloficial"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-neon hover:text-neon"
          >
            YouTube
          </a>
          <a
            href="https://www.tiktok.com/@nkloficial"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-3 py-1.5 transition-colors hover:border-neon hover:text-neon"
          >
            TikTok
          </a>
        </div>
      </div>
    </aside>
  );
}
