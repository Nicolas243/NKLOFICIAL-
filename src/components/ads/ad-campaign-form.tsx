'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Props = {
  initialEmail: string;
  monthlyPriceCents: number;
  autoStart?: boolean;
  isAuthenticated: boolean;
  loginPath: string;
};

const PENDING_AD_STORAGE_KEY = 'portal-nkl:pending-ad-checkout';

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function AdCampaignForm({
  initialEmail,
  monthlyPriceCents,
  autoStart = false,
  isAuthenticated,
  loginPath,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [slotCount, setSlotCount] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeCheckout, setResumeCheckout] = useState(false);
  const [clientAuthenticated, setClientAuthenticated] = useState(false);
  const total = useMemo(() => monthlyPriceCents * slotCount, [monthlyPriceCents, slotCount]);
  const effectiveAuthenticated = isAuthenticated || clientAuthenticated;

  useEffect(() => {
    if (!autoStart || !formRef.current) return;
    formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    formRef.current.querySelector<HTMLInputElement>('input[name="businessName"]')?.focus();

    const stored = sessionStorage.getItem(PENDING_AD_STORAGE_KEY);
    if (!stored) return;
    try {
      const values = JSON.parse(stored) as Record<string, unknown>;
      const form = formRef.current;
      const setValue = (name: string) => {
        const value = values[name];
        if (typeof value !== 'string') return;
        const input = form.elements.namedItem(name);
        if (input instanceof HTMLInputElement
          || input instanceof HTMLSelectElement
          || input instanceof HTMLTextAreaElement) {
          input.value = value;
        }
      };
      setValue('businessName');
      setValue('responsibleName');
      setValue('whatsapp');
      setValue('businessCategory');
      setValue('offerDescription');
      setValue('campaignObjective');
      setValue('targetAudience');
      setValue('socialUrl');
      setValue('destinationUrl');
      setValue('assetAltText');
      const storedSlotCount = values.slotCount;
      if (typeof storedSlotCount === 'number' && storedSlotCount >= 1 && storedSlotCount <= 10) {
        setSlotCount(storedSlotCount);
      }
      if (values.contractAccepted === true) {
        setAccepted(true);
        setResumeCheckout(true);
      }
    } catch {
      sessionStorage.removeItem(PENDING_AD_STORAGE_KEY);
    }
  }, [autoStart]);

  useEffect(() => {
    if (!autoStart || isAuthenticated) return;
    let active = true;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active || authError || !data.user) return;
      setClientAuthenticated(true);
    });
    return () => {
      active = false;
    };
  }, [autoStart, isAuthenticated]);

  useEffect(() => {
    if (!resumeCheckout || !accepted || !effectiveAuthenticated || !formRef.current) return;
    const timer = window.setTimeout(() => {
      sessionStorage.removeItem(PENDING_AD_STORAGE_KEY);
      formRef.current?.requestSubmit();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [accepted, effectiveAuthenticated, resumeCheckout]);

  async function submit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!accepted) {
      setError('Marque a caixa de aceite do Contrato de Publicidade acima para continuar ao Stripe.');
      return;
    }
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const rawDest = String(formData.get('destinationUrl') ?? '').trim();
    if (rawDest && !/^[a-z][a-z0-9+.-]*:/iu.test(rawDest)) {
      formData.set('destinationUrl', `https://${rawDest.replace(/^\/+/u, '')}`);
    }
    const rawSocial = String(formData.get('socialUrl') ?? '').trim();
    if (rawSocial.startsWith('@') && /^@[a-z0-9._-]+$/iu.test(rawSocial)) {
      formData.set('socialUrl', `https://instagram.com/${rawSocial.slice(1)}`);
    } else if (rawSocial && !/^[a-z][a-z0-9+.-]*:/iu.test(rawSocial)) {
      formData.set('socialUrl', `https://${rawSocial.replace(/^\/+/u, '')}`);
    }
    formData.set('contractAccepted', 'true');

    if (!effectiveAuthenticated) {
      sessionStorage.setItem(PENDING_AD_STORAGE_KEY, JSON.stringify({
        businessName: formData.get('businessName'),
        responsibleName: formData.get('responsibleName'),
        whatsapp: formData.get('whatsapp'),
        businessCategory: formData.get('businessCategory'),
        offerDescription: formData.get('offerDescription'),
        campaignObjective: formData.get('campaignObjective'),
        targetAudience: formData.get('targetAudience'),
        socialUrl: formData.get('socialUrl'),
        destinationUrl: formData.get('destinationUrl'),
        assetAltText: formData.get('assetAltText'),
        slotCount,
        contractAccepted: accepted,
      }));
      window.location.assign(loginPath);
      return;
    }

    try {
      const response = await fetch('/api/payments/create-ad-subscription', {
        method: 'POST',
        body: formData,
      });
      const payload: unknown = await response.json();
      const checkoutUrl = typeof payload === 'object'
        && payload !== null
        && 'checkoutUrl' in payload
        && typeof payload.checkoutUrl === 'string'
        ? payload.checkoutUrl
        : null;
      if (!response.ok || !checkoutUrl) {
        const message = typeof payload === 'object'
          && payload !== null
          && 'message' in payload
          && typeof payload.message === 'string'
          ? payload.message
          : 'Não foi possível iniciar a assinatura.';
        throw new Error(message);
      }
      window.location.assign(checkoutUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível iniciar a assinatura.');
      setPending(false);
    }
  }

  return (
    <form ref={formRef} id="reserva" onSubmit={submit} className="space-y-5 rounded-2xl border border-neon/25 bg-surface/70 p-5 shadow-sm sm:p-7">
      <input type="hidden" name="slotCount" value={slotCount} />
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-neon">Reserva editorial</p>
        <h2 className="mt-2 font-playfair text-3xl font-bold">Monte sua faixa</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/70">
          Preencha o contexto da campanha e assine com Stripe. Depois da confirmação do pagamento, você envia o criativo em uma área própria para análise.
        </p>
      </div>

      <label className="block text-sm font-bold">
        Nome do negócio
        <input name="businessName" required maxLength={180} className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Pessoa responsável
          <input name="responsibleName" required maxLength={180} placeholder="Quem falará com o Portal?" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon" />
        </label>

        <label className="block text-sm font-bold">
          WhatsApp comercial
          <input name="whatsapp" required maxLength={30} inputMode="tel" placeholder="(11) 99999-9999" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon" />
        </label>
      </div>

      <label className="block text-sm font-bold">
        Link do anúncio
        <input name="destinationUrl" type="text" inputMode="url" required placeholder="https://seunegocio.com.br ou seunegocio.com.br" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon" />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Categoria do negócio
          <select name="businessCategory" required defaultValue="" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon">
            <option value="" disabled>Selecione uma categoria</option>
            <option value="Serviços profissionais">Serviços profissionais</option>
            <option value="Loja ou e-commerce">Loja ou e-commerce</option>
            <option value="Educação ou cursos">Educação ou cursos</option>
            <option value="Tecnologia ou software">Tecnologia ou software</option>
            <option value="Finanças">Finanças</option>
            <option value="Vagas ou trabalho">Vagas ou trabalho</option>
            <option value="Outro">Outro</option>
          </select>
        </label>

        <label className="block text-sm font-bold">
          Objetivo da campanha
          <select name="campaignObjective" required defaultValue="" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon">
            <option value="" disabled>O que você quer alcançar?</option>
            <option value="Atrair visitas">Atrair visitas</option>
            <option value="Gerar leads">Gerar leads</option>
            <option value="Vender">Vender</option>
            <option value="Divulgar a marca">Divulgar a marca</option>
            <option value="Lançar uma oferta">Lançar uma oferta</option>
          </select>
        </label>
      </div>

      <label className="block text-sm font-bold">
        O que está sendo anunciado?
        <textarea name="offerDescription" required minLength={10} maxLength={500} rows={3} placeholder="Explique em pelo menos 10 caracteres o produto, serviço ou oferta." className="mt-2 w-full rounded-md border border-border bg-background px-3 py-3 text-base font-normal outline-none focus:border-neon" />
      </label>

      <label className="block text-sm font-bold">
        Público principal <span className="font-normal text-foreground/55">(opcional)</span>
        <input name="targetAudience" maxLength={300} placeholder="Ex.: pessoas buscando renda extra no Brasil" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon" />
      </label>

      <label className="block text-sm font-bold">
        Perfil ou página institucional <span className="font-normal text-foreground/55">(opcional)</span>
        <input name="socialUrl" type="text" inputMode="url" placeholder="https://instagram.com/sua-marca ou @sua-marca" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon" />
      </label>

      <label className="block text-sm font-bold">
        Texto alternativo da imagem <span className="font-normal text-foreground/55">(opcional)</span>
        <input name="assetAltText" maxLength={180} placeholder="Descrição curta do anúncio (padrão automático se vazio)" className="mt-2 min-h-11 w-full rounded-md border border-border bg-background px-3 text-base font-normal outline-none focus:border-neon" />
      </label>

      <p className="rounded-md border border-border bg-background/50 px-3 py-3 text-xs leading-relaxed text-foreground/65">
        O criativo será enviado depois do pagamento, em uma etapa própria. Assim você pode concluir a reserva agora e preparar o material com calma.
      </p>

      <fieldset>
        <legend className="text-sm font-bold">Quantidade de cotas</legend>
        <p className="mt-2 text-xs leading-relaxed text-foreground/65">
          Cada cota corresponde a uma posição independente na faixa de anúncios. Você pode reservar de 1 a 10 posições:
          quanto mais cotas escolher, maior será a presença da sua marca na faixa e maior será o valor mensal.
          A mensalidade exibida abaixo já considera a quantidade selecionada.
        </p>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Array.from({ length: 10 }, (_, index) => {
            const value = index + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSlotCount(value)}
                className={`min-h-11 rounded-md border text-sm font-bold transition-colors ${slotCount === value ? 'border-neon bg-neon text-black' : 'border-border hover:border-neon'}`}
                aria-pressed={slotCount === value}
              >
                {value}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1 h-4 w-4 accent-neon" />
        <span>
          Li e aceito o <a href="/programas/anuncie/contrato" target="_blank" rel="noopener noreferrer" className="font-bold text-neon underline">Contrato de Publicidade NKL</a>.
          Entendo que pagar não garante publicação automática.
        </span>
      </label>

      {error && <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">{error}</p>}

      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-foreground/55">Total mensal</p>
          <p className="mt-1 font-playfair text-3xl font-bold text-neon">{formatPrice(total)}</p>
          <p className="text-xs text-foreground/55">{slotCount} {slotCount === 1 ? 'cota' : 'cotas'} · {formatPrice(monthlyPriceCents)} por cota</p>
        </div>
        <button type="submit" disabled={pending} className="inline-flex min-h-12 items-center justify-center rounded-md bg-neon px-5 py-3 font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45">
          {pending
            ? (effectiveAuthenticated ? 'Preparando Stripe…' : 'Abrindo login…')
            : effectiveAuthenticated
              ? `Assinar com Stripe · ${formatPrice(total)}/mês`
              : 'Entrar e continuar para o Stripe'}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-foreground/55">
        {effectiveAuthenticated
          ? <>O e-mail da sua conta ({initialEmail}) será usado para o recibo e para o gerenciamento da assinatura no Stripe.</>
          : 'Você entrará ou criará sua conta antes de iniciar a assinatura no Stripe.'}
      </p>
    </form>
  );
}
