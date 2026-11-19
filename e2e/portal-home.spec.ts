import { expect, test } from '@playwright/test';

const REQUIRED_ACTIVE_CARDS = [
  { id: 'nkl-cordas', href: '/musica/naipe_cordas' },
  { id: 'renda-extra', href: '/programas' },
  { id: 'idiomas', href: '/blog/aprender/ingles' },
  { id: 'ia-na-pratica', href: '/ia' },
  { id: 'guia-renda-extra', href: '/guias/renda-extra' },
  { id: 'quiz-negocios', href: '/quiz-negocios' },
  { id: 'curso-ia', href: '/ia/oferta' },
  { id: 'ingles', href: '/guias/ingles' },
  { id: 'mural-parceiros', href: '/mural-de-parceiros' },
  { id: 'anuncie', href: '/programas/anuncie' },
] as const;

const COMING_SOON_CARD_IDS = ['italiano', 'frances', 'alemao', 'espanhol', 'mandarim'] as const;

test.describe('Portal NKL — Página Base (/) e Hub Musical (/musica/naipe_cordas)', () => {
  test('renderiza a home base sem cabeçalho tradicional, com todos os cards obrigatórios e estados em breve', async ({
    page,
  }) => {
    await page.goto('/');

    // AC-002: nenhum <header> tradicional na pagina inicial.
    await expect(page.locator('header')).toHaveCount(0);

    // AC-001: identidade e H1 do Portal NKL.
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Música, inteligência artificial, idiomas e negócios digitais',
    );
    await expect(page.getByRole('link', { name: 'Entrar', exact: true })).toHaveAttribute(
      'href',
      '/login',
    );

    // AC-001 e AC-003: todas as areas obrigatorias ativas possuem link valido.
    for (const expectedCard of REQUIRED_ACTIVE_CARDS) {
      const card = page.locator(`a.portal-card[data-card-id="${expectedCard.id}"]`);
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('href', expectedCard.href);
    }

    // AC-007: os 5 idiomas em producao editorial aparecem como "Em breve" sem link quebrado.
    for (const id of COMING_SOON_CARD_IDS) {
      const card = page.locator(`article.portal-card-coming-soon[data-card-id="${id}"]`);
      await expect(card).toBeVisible();
      await expect(card).toHaveAttribute('data-card-status', 'coming-soon');
      await expect(card).toContainText('Em breve');
    }

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  });

  test('permite foco visível e navegação por teclado (Enter) nos cards ativos', async ({ page }) => {
    await page.goto('/');

    const musicCard = page.locator('a.portal-card[data-card-id="nkl-cordas"]');
    await musicCard.focus();
    await expect(musicCard).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/musica\/naipe_cordas$/u);
  });

  test('mantém layout mobile em 390px sem overflow horizontal e com alvos de toque >= 44px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('header')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);

    const loginBox = await page.getByRole('link', { name: 'Entrar', exact: true }).boundingBox();
    expect(loginBox?.height).toBeGreaterThanOrEqual(44);

    const firstCardBox = await page
      .locator('a.portal-card[data-card-id="nkl-cordas"]')
      .boundingBox();
    expect(firstCardBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('respeita prefers-reduced-motion no parallax da home', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 300));

    const transforms = await page
      .locator('.portal-parallax-layer')
      .evaluateAll((elements) => elements.map((el) => getComputedStyle(el).transform));
    for (const transform of transforms) {
      expect(transform).toBe('none');
    }
  });

  test('/musica redireciona para /musica/naipe_cordas e preserva a home musical completa', async ({
    page,
  }) => {
    await page.goto('/musica');
    await expect(page).toHaveURL(/\/musica\/naipe_cordas$/u);

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'O Cuidado Oculto por tras da Voz do Instrumento',
    );
    await expect(page.getByRole('link', { name: 'Explorar Catalogo' })).toHaveAttribute(
      'href',
      '/catalogo',
    );
    await expect(page.getByRole('link', { name: 'Encontrar Luthier' })).toHaveAttribute(
      'href',
      '/luthiers',
    );
  });
});
