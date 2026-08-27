import { login, signup } from '@/actions/auth';

export const metadata = {
  title: 'Entrar | Portal NKL',
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function LoginPage(props: { searchParams: SearchParams }) {
  // Next.js 16: searchParams é uma Promise — aguardamos antes de ler.
  const search = await props.searchParams;
  const error = typeof search.error === 'string' ? search.error : null;

  return (
    <div className="max-w-md w-full mx-auto px-4 pt-16 flex flex-col items-stretch">
      <h1 className="font-playfair text-3xl font-bold mb-2 text-center">Acessar o Portal NKL</h1>
      <p className="text-sm opacity-70 text-center mb-8">
        Entre com suas credenciais ou crie uma conta para acessar o ecossistema.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-sm"
        >
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4 bg-surface border border-border rounded-xl p-6 shadow-sm">
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          required
          autoComplete="email"
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <input
          type="password"
          name="password"
          placeholder="Senha"
          required
          autoComplete="current-password"
          className="p-3 bg-background border border-border rounded-md focus:border-neon outline-none"
        />
        <button
          type="submit"
          formAction={login}
          className="py-3 bg-text text-bg rounded-md font-bold transition-all hover:opacity-90"
        >
          Entrar
        </button>
        <button
          type="submit"
          formAction={signup}
          className="py-3 border border-neon text-neon rounded-md font-bold transition-all hover:bg-neon hover:text-black"
        >
          Criar conta
        </button>
      </form>
    </div>
  );
}