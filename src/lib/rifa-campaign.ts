export const RIFA_CAMPAIGN_URL = 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos';

export const RIFA_CAMPAIGN_SURFACES = ['banner', 'card', 'exit_popup'] as const;
export type RifaCampaignSurface = (typeof RIFA_CAMPAIGN_SURFACES)[number];
export type RifaCampaignAction = 'impression' | 'dismiss' | 'participate' | 'rules';
export type RifaCampaignEvent = {
  surface: RifaCampaignSurface;
  action: RifaCampaignAction;
};

export const RIFA_CAMPAIGN_COPY = {
  banner: {
    title: 'O Portal NKL já te ajudou em alguma decisão?',
    description: 'Ajude a manter a curadoria independente participando de uma ação por R$ 3 e concorra a três livros físicos sobre finanças e empreendedorismo.',
  },
  card: {
    title: 'Uma forma de apoiar o Portal',
    description: 'A ação é realizada e processada pela 123Rifas. Consulte os prêmios, regras, data do sorteio e condições antes de participar.',
  },
  exitPopup: {
    title: 'Antes de você sair',
    description: 'Se o Portal NKL já foi útil para você, considere apoiar o projeto participando da ação de livros por R$ 3.',
  },
  disclosure: 'A participação é externa e processada pela 123Rifas. Consulte o regulamento antes de comprar.',
} as const;

const DISMISSAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const excludedPrefixes = ['/api', '/admin', '/auth', '/checkout', '/dashboard', '/login', '/perfil', '/registro', '/_not-found'];

export function isRifaCampaignRoute(pathname: string): boolean {
  const normalizedPathname = pathname === '/' ? '/' : pathname.replace(/\/+$/u, '');
  return !excludedPrefixes.some((prefix) => normalizedPathname === prefix || normalizedPathname.startsWith(`${prefix}/`));
}

export function getRifaCampaignUrl(surface: RifaCampaignSurface): string {
  const url = new URL(RIFA_CAMPAIGN_URL);
  url.searchParams.set('utm_source', 'portal-nkl');
  url.searchParams.set('utm_medium', 'referral');
  url.searchParams.set('utm_campaign', 'rifa-livros');
  url.searchParams.set('utm_content', surface);
  return url.toString();
}

export function getDismissalExpiry(now: number): number {
  return now + DISMISSAL_DURATION_MS;
}

export async function trackRifaCampaignEvent(input: RifaCampaignEvent): Promise<void> {
  try {
    const eventType = input.action === 'impression' ? 'impression' : 'click';
    const response = await fetch('/api/sales/offer-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment: 'rifa-livros',
        variant: input.surface,
        eventType,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    console.error('[RIFA_CAMPAIGN] Falha ao registrar evento:', error instanceof Error ? error.message : 'erro desconhecido');
  }
}
