export const RIFA_CAMPAIGN_URL = 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos';

export const RIFA_CAMPAIGN_SURFACES = ['banner', 'card', 'exit_popup'] as const;
export type RifaCampaignSurface = (typeof RIFA_CAMPAIGN_SURFACES)[number];
export type RifaCampaignAction = 'impression' | 'dismiss' | 'participate' | 'rules';
export type RifaCampaignEvent = {
  surface: RifaCampaignSurface;
  action: RifaCampaignAction;
};

export const RIFA_CAMPAIGN_SURFACE_KEY = 'nkl_rifa_campaign_surface';
export const RIFA_CAMPAIGN_INTERACTED_KEY = 'nkl_rifa_campaign_interacted';

export const RIFA_CAMPAIGN_COPY = {
  banner: {
    title: 'O Portal NKL já te ajudou em alguma decisão?',
    description: 'Ajude a manter a curadoria independente participando de uma ação cujo prêmio são 3 livros físicos sobre finanças e empreendedorismo.',
  },
  card: {
    title: 'Uma forma de apoiar o Portal',
    description: 'Apoie o Portal NKL e concorra a 3 livros físicos sobre finanças e empreendedorismo. Consulte os prêmios, regras, data do sorteio e condições antes de participar.',
  },
  exitPopup: {
    title: 'Antes de você sair',
    description: 'Se o Portal NKL já foi útil para você, considere apoiar o projeto participando da ação que oferece 3 livros físicos como prêmio.',
  },
  disclosure: 'Consulte o regulamento antes de participar.',
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

function getCampaignSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch (error) {
    console.info('[RIFA_CAMPAIGN] SessionStorage indisponível:', error instanceof Error ? error.message : 'erro desconhecido');
    return null;
  }
}

export function getRifaCampaignSurface(): RifaCampaignSurface | null {
  const storage = getCampaignSessionStorage();
  if (!storage) return null;
  try {
    const surface = storage.getItem(RIFA_CAMPAIGN_SURFACE_KEY);
    return surface && RIFA_CAMPAIGN_SURFACES.includes(surface as RifaCampaignSurface)
      ? surface as RifaCampaignSurface
      : null;
  } catch (error) {
    console.info('[RIFA_CAMPAIGN] Não foi possível ler a superfície:', error instanceof Error ? error.message : 'erro desconhecido');
    return null;
  }
}

export function reserveRifaCampaignSurface(surface: RifaCampaignSurface): boolean {
  const storage = getCampaignSessionStorage();
  if (!storage) return true;
  const currentSurface = getRifaCampaignSurface();
  if (currentSurface) return currentSurface === surface;
  try {
    storage.setItem(RIFA_CAMPAIGN_SURFACE_KEY, surface);
    return true;
  } catch (error) {
    console.info('[RIFA_CAMPAIGN] Não foi possível reservar a superfície:', error instanceof Error ? error.message : 'erro desconhecido');
    return true;
  }
}

export function markRifaCampaignInteracted(): void {
  const storage = getCampaignSessionStorage();
  if (!storage) return;
  try {
    storage.setItem(RIFA_CAMPAIGN_INTERACTED_KEY, 'true');
  } catch (error) {
    console.info('[RIFA_CAMPAIGN] Não foi possível registrar a interação:', error instanceof Error ? error.message : 'erro desconhecido');
  }
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
