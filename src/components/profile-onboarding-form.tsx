'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeProfileOnboarding, type OnboardingState } from '@/actions/profile-onboarding';
import { type OnboardingContext } from '@/lib/auth/onboarding';

const INITIAL_STATE: OnboardingState = {};
const INPUT_CLASS = 'w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-neon';

export function ProfileOnboardingForm({
  nextPath,
  resume,
}: {
  nextPath: string;
  resume: string;
}) {
  const router = useRouter();
  const [context, setContext] = useState<OnboardingContext | ''>('');
  const [roles, setRoles] = useState<string[]>([]);
  const [state, formAction, pending] = useActionState(completeProfileOnboarding, INITIAL_STATE);

  useEffect(() => {
    if (state.redirectTo) router.replace(state.redirectTo);
  }, [router, state.redirectTo]);

  const needsMusicDetails = context === 'music' || context === 'both';

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="resume" value={resume} />
      <input type="hidden" name="context" value={context} />

      <fieldset>
        <legend className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-neon">
          Como você quer usar o Portal NKL?
        </legend>
        <div className="grid gap-3">
          {([
            ['income', 'Blog e Renda Extra', 'Descobrir oportunidades, guias e conteúdos para aumentar sua renda.'],
            ['music', 'Área musical', 'Explorar cordas, luteria, aulas e recursos para músicos.'],
            ['both', 'Ambos', 'Usar os dois espaços com uma única conta.'],
          ] as const).map(([value, title, description]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                context === value ? 'border-neon bg-neon/10' : 'border-border hover:border-neon/60'
              }`}
            >
              <input
                type="radio"
                name="contextChoice"
                value={value}
                checked={context === value}
                onChange={() => setContext(value)}
                className="sr-only"
              />
              <span className="block font-bold">{title}</span>
              <span className="mt-1 block text-sm opacity-70">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {needsMusicDetails && (
        <div className="space-y-4 rounded-xl border border-border bg-surface/60 p-5">
          <div>
            <h2 className="font-playfair text-xl font-bold">Seu perfil musical</h2>
            <p className="mt-1 text-sm opacity-70">
              Estas respostas personalizam a área musical. Você poderá atualizá-las depois.
            </p>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Qual é o seu papel? <span className="opacity-60">(selecione um ou mais)</span></legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {[
                ['Musico', 'Músico'],
                ['Lojista', 'Lojista'],
                ['Luthier', 'Luthier'],
                ['Professor', 'Professor'],
                ['Aluno', 'Aluno'],
              ].map(([value, label]) => {
                const checked = roles.includes(value);
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      checked ? 'border-neon bg-neon/10' : 'border-border hover:border-neon/60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="papel"
                      value={value}
                      checked={checked}
                      onChange={(event) => {
                        setRoles((current) => event.target.checked
                          ? [...current, value]
                          : current.filter((role) => role !== value));
                      }}
                      className="h-4 w-4 accent-neon"
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="block text-sm font-medium">
            Instrumento principal
            <input name="instrumento" required={needsMusicDetails} className={`${INPUT_CLASS} mt-2`} placeholder="Ex.: Violino" />
          </label>
          <label className="block text-sm font-medium">
            Anos de experiência
            <input name="anosExperiencia" type="number" min="0" max="80" required={needsMusicDetails} className={`${INPUT_CLASS} mt-2`} placeholder="Ex.: 5" />
          </label>
        </div>
      )}

      {state.error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !context}
        className="w-full rounded-xl bg-neon px-5 py-3 font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Salvando...' : 'Continuar para o Portal NKL'}
      </button>
    </form>
  );
}
