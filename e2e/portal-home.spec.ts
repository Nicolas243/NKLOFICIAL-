import { expect, test, type Page } from '@playwright/test';

const REQUIRED_ACTIVE_CARDS = [
  { id: 'nkl-cordas', href: '/musica/naipe_cordas' },
  { id: 'renda-extra', href: '/programas' },
  { id: 'idiomas', href: '/blog/aprender/ingles' },
  { id: 'ia-na-pratica', href: '/ia' },
  { id: 'guia-renda-extra', href: '/ofertas/pacote-renda-extra' },
  {
    id: 'quiz-negocios',
    href: '/ofertas/bussola-negocios',
    title: 'Bússola de Negócios',
  },
  { id: 'ferramenta-ia', href: '/ofertas/ferramenta-ia' },
  { id: 'curso-ia', href: '/ofertas/curso-ia-pratica' },
  { id: 'ingles', href: '/ofertas/ebook-ingles' },
  { id: 'mural-parceiros', href: '/mural-de-parceiros' },
  { id: 'anuncie', href: '/programas/anuncie' },
] as const;

const UNLOCKED_LANGUAGE_IDS = [
  'italiano',
  'frances',
  'alemao',
  'espanhol',
  'mandarim',
] as const;

const TRACK_CASES = [
  { id: 'renda-extra', title: 'Ganhar Renda Extra', accent: 'income' },
  { id: 'musica', title: 'Evoluir na Música', accent: 'music' },
  { id: 'idiomas-ia', title: 'Aprender Idiomas com IA', accent: 'languages' },
  { id: 'ia-completa', title: 'Aprender Tudo sobre IA', accent: 'learning' },
] as const;

const VIEWPORTS = [
  { label: 'desktop 1440x900', width: 1440, height: 900 },
  { label: 'mobile 375x667', width: 375, height: 667 },
] as const;

async function readHomeCanvasTokens(page: Page) {
  return page.evaluate(() => {
    const shell = document.querySelector('.portal-home-shell');
    if (!shell) return null;
    const style = getComputedStyle(shell);
    return {
      canvasStart: style.getPropertyValue('--portal-canvas-start').trim(),
      backgroundImage: style.backgroundImage,
    };
  });
}

test.describe('Portal NKL — Home (/), Funil Portal NKL (/instalar, /ofertas) e Hub Musical', () => {
  test.describe.configure({ mode: 'default' });

  for (const viewport of VIEWPORTS) {
    test(`renderiza home, 16 capas sem 404, WhatsApp em espera e alternancia de tema (${viewport.label})`, async ({
      page,
    }) => {
      const failedImageResponses: string[] = [];
      page.on('response', (response) => {
        const request = response.request();
        const url = response.url();
        const isImage =
          request.resourceType() === 'image' ||
          /\.(png|jpe?g|webp|svg|avif)(\?|$)/i.test(url);
        if (isImage && response.status() >= 400) {
          failedImageResponses.push(`${response.status()} ${url}`);
        }
      });

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      await expect(page.locator('header')).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 1 })).toContainText(
        'Renda extra, música, idiomas e IA de um jeito simples',
      );
      const loginLink = page.getByRole('link', { name: 'Entrar', exact: true });
      await expect(loginLink).toHaveAttribute('href', '/login');
      const loginBox = await loginLink.boundingBox();
      expect(loginBox?.height).toBeGreaterThanOrEqual(44);
      // Somente um CTA de autenticacao na barra quando deslogado (sem duplicar "Minha conta").
      await expect(page.locator('.portal-utility .portal-utility-link')).toHaveCount(1);

      // Mensagem automatica do WhatsApp nao aparece no carregamento inicial (atraso de 2 min).
      await expect(page.locator('.whatsapp-guide-message')).toHaveCount(0);

      for (const expectedCard of REQUIRED_ACTIVE_CARDS) {
        const card = page.locator(`a.portal-card[data-card-id="${expectedCard.id}"]`);
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute('href', expectedCard.href);
        if ('title' in expectedCard) {
          await expect(card).toContainText(expectedCard.title);
        }
      }

      for (const id of UNLOCKED_LANGUAGE_IDS) {
        const card = page.locator(`a.portal-card[data-card-id="${id}"]`);
        await expect(card).toBeVisible();
        await expect(card).toHaveAttribute('data-card-status', 'active');
      }

      const images = page.locator('.portal-card-media-img');
      await expect(images).toHaveCount(16);
      for (let index = 0; index < 16; index += 1) {
        const img = images.nth(index);
        await img.scrollIntoViewIfNeeded();
        await expect
          .poll(
            () =>
              img.evaluate((node) => {
                const el = node as HTMLImageElement;
                return el.complete && el.naturalWidth > 0;
              }),
            { timeout: 15000 },
          )
          .toBe(true);
      }
      expect(failedImageResponses).toEqual([]);

      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);

      // Tema claro -> escuro -> reload -> claro com persistencia em localStorage.
      const themeToggle = page.locator('[data-testid="portal-theme-toggle"]');
      await expect(themeToggle).toBeEnabled();
      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/u);

      const initialTokens = await readHomeCanvasTokens(page);
      expect(initialTokens?.canvasStart).toBe('#c4d2e4');
      expect(initialTokens?.backgroundImage).toContain('rgb(196, 210, 228)');

      await themeToggle.click();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
      await expect
        .poll(() => page.evaluate(() => window.localStorage.getItem('theme')))
        .toBe('dark');

      const darkTokens = await readHomeCanvasTokens(page);
      expect(darkTokens?.canvasStart).toBe('#090b10');
      expect(darkTokens?.backgroundImage).toContain('rgb(9, 11, 16)');

      await page.reload();
      await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
      await expect
        .poll(() => page.evaluate(() => window.localStorage.getItem('theme')))
        .toBe('dark');
      const reloadedDarkTokens = await readHomeCanvasTokens(page);
      expect(reloadedDarkTokens?.canvasStart).toBe('#090b10');

      const reloadedToggle = page.locator('[data-testid="portal-theme-toggle"]');
      await expect(reloadedToggle).toBeEnabled();
      await reloadedToggle.click();
      await expect(page.locator('html')).not.toHaveClass(/\bdark\b/u);
      await expect
        .poll(() => page.evaluate(() => window.localStorage.getItem('theme')))
        .toBe('light');

      const restoredLightTokens = await readHomeCanvasTokens(page);
      expect(restoredLightTokens?.canvasStart).toBe('#c4d2e4');
      expect(restoredLightTokens?.backgroundImage).toContain('rgb(196, 210, 228)');
    });

    test(`executa funil completo de trilhas -> /instalar -> /ofertas/ferramenta-ia -> banner na home (${viewport.label})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      const selector = page.locator('[data-testid="portal-track-selector"]');
      const roadmap = page.locator('[data-testid="portal-track-roadmap"]');
      await expect(selector).toBeVisible();

      for (const track of TRACK_CASES) {
        const option = selector.locator(`[data-track-id="${track.id}"]`);
        await option.click();
        await expect(option).toHaveAttribute('aria-pressed', 'true');
        await expect(roadmap).toHaveAttribute('data-track-accent', track.accent);
        await expect(roadmap).toContainText(track.title);
        await expect(roadmap.locator('.portal-track-step')).toHaveCount(3);
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
          .toBe(true);
      }

      await page.locator('[data-testid="portal-track-install-cta"]').click();
      await expect(page).toHaveURL(/\/instalar\?trilha=ia-completa$/u);
      await expect
        .poll(() => page.evaluate(() => window.localStorage.getItem('nkl_selected_track_v1')))
        .toBe('ia-completa');
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);

      await page.locator('[data-testid="instalar-continue-cta"]').click();
      await expect(page).toHaveURL(/\/ofertas\/ferramenta-ia$/u);
      await expect(page.getByRole('heading', { name: 'O que está incluso' })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Bônus práticos que acompanham este acesso' }),
      ).toBeVisible();
      await expect(
        page.getByText('Playbooks editáveis em português para trabalho, estudo e criação'),
      ).toBeVisible();
      await expect(
        page.getByText('Instalação como aplicativo dedicado no celular e desktop'),
      ).toBeVisible();

      await page.goto('/');
      const priorityBanner = page.locator('[data-testid="portal-track-priority-banner"]');
      await expect(priorityBanner).toBeVisible();
      await expect(priorityBanner).toContainText('Aprender Tudo sobre IA');
      await priorityBanner.getByRole('button', { name: 'Ver tudo' }).click();
      await expect(priorityBanner).toHaveCount(0);
      await expect
        .poll(() => page.evaluate(() => window.localStorage.getItem('nkl_selected_track_v1')))
        .toBeNull();
    });
  }

  test('mantém apoio horizontal em 3 colunas no mobile (375x667) e contador sem zero', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);

    const supportBoxes = await page
      .locator('[data-testid="portal-support-grid"] > *')
      .evaluateAll((elements) =>
        elements.map((el) => {
          const rect = el.getBoundingClientRect();
          return { top: Math.round(rect.top), height: Math.round(rect.height) };
        }),
      );
    expect(supportBoxes).toHaveLength(3);
    const tops = supportBoxes.map((box) => box.top);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);
    for (const box of supportBoxes) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }

    const supportersCounter = page.locator('[data-testid="portal-supporters-count"]');
    await expect(supportersCounter).toBeVisible();
    await expect(supportersCounter).not.toContainText('0');
  });

  test('atualiza fluido WebGL/Canvas2D e variaveis de parallax no mouse e scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const fluidCanvas = page.locator('[data-testid="portal-fluid-canvas"]');
    const parallaxRoot = page.locator('[data-testid="portal-home-parallax"]');
    await expect(fluidCanvas).toBeVisible();
    await expect
      .poll(() => fluidCanvas.getAttribute('data-fluid-backend'))
      .toMatch(/^(webgl2|webgl1|canvas2d)$/u);

    await page.mouse.move(320, 260);
    await page.mouse.down();
    await page.mouse.move(760, 420, { steps: 10 });
    await page.mouse.up();

    await expect
      .poll(async () => Number((await fluidCanvas.getAttribute('data-fluid-splats')) ?? '0'))
      .toBeGreaterThan(2);

    await expect
      .poll(() =>
        parallaxRoot.evaluate((el) => {
          const style = (el as HTMLElement).style;
          const x = parseFloat(style.getPropertyValue('--parallax-x') || '0');
          const y = parseFloat(style.getPropertyValue('--parallax-y') || '0');
          return x !== 0 && y !== 0;
        }),
      )
      .toBe(true);

    const transforms = await page
      .locator('.portal-parallax-layer')
      .evaluateAll((elements) => elements.map((el) => getComputedStyle(el).transform));
    expect(transforms.some((value) => value !== 'none')).toBe(true);

    await page.evaluate(() => window.scrollTo(0, 560));
    await expect
      .poll(() =>
        parallaxRoot.evaluate((el) =>
          parseFloat((el as HTMLElement).style.getPropertyValue('--parallax-scroll') || '0'),
        ),
      )
      .not.toBe(0);
    await expect
      .poll(async () =>
        Number((await fluidCanvas.getAttribute('data-fluid-scroll-bodies')) ?? '0'),
      )
      .toBeGreaterThan(0);
  });

  test('mantem fluido vivo por padrao mesmo com reduced-motion e pausa ao clicar no controle', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 500));

    const parallaxRoot = page.locator('[data-testid="portal-home-parallax"]');
    const fluidToggle = page.locator('[data-testid="portal-fluid-toggle"]');
    await expect(parallaxRoot).toHaveAttribute('data-fluid-paused', 'false');

    await expect
      .poll(() =>
        page
          .locator('.portal-parallax-layer')
          .evaluateAll((elements) => elements.some((el) => getComputedStyle(el).transform !== 'none')),
      )
      .toBe(true);

    await fluidToggle.click();
    await expect(parallaxRoot).toHaveAttribute('data-fluid-paused', 'true');
    const pausedTransforms = await page
      .locator('.portal-parallax-layer')
      .evaluateAll((elements) => elements.map((el) => getComputedStyle(el).transform));
    for (const transform of pausedTransforms) {
      expect(transform).toBe('none');
    }
  });

  test('permite foco visível e navegação por teclado (Enter) nos cards ativos', async ({ page }) => {
    await page.goto('/');

    const musicCard = page.locator('a.portal-card[data-card-id="nkl-cordas"]');
    await musicCard.focus();
    await expect(musicCard).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/musica\/naipe_cordas$/u);
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

  test('bloqueia ferramentas pagas sem acesso individual e serve manifests isolados', async ({
    page,
    request,
  }) => {
    await page.goto('/app/bussola-negocios');
    await expect(page).toHaveURL(/\/ofertas\/bussola-negocios$/u);
    await expect(page.getByText('Bússola de Negócios · Ferramenta Interativa')).toHaveCount(0);

    await page.goto('/app/ferramenta-ia');
    await expect(page).toHaveURL(/\/ofertas\/ferramenta-ia$/u);
    await expect(page.getByText('Listas de conferência rápida antes de agir')).toHaveCount(0);

    await page.goto('/quiz-negocios');
    await expect(page).toHaveURL(/\/ofertas\/bussola-negocios$/u);
    await expect(page.getByText('Responda 50 perguntas rápidas')).toHaveCount(0);

    const portalManifestResponse = await request.get('/manifest.webmanifest');
    expect(portalManifestResponse.status()).toBe(200);
    const portalManifest = (await portalManifestResponse.json()) as {
      name: string;
      short_name: string;
      start_url: string;
    };
    expect(portalManifest.name).toBe('Portal NKL');
    expect(portalManifest.short_name).toBe('Portal NKL');
    expect(portalManifest.start_url).toBe('/');

    const subAppManifests = [
      { path: '/programas/manifest.webmanifest', name: 'Renda Extra', scope: '/programas' },
      { path: '/musica/manifest.webmanifest', name: 'Música', scope: '/musica' },
      { path: '/ia/manifest.webmanifest', name: 'IA na Prática', scope: '/ia' },
      { path: '/blog/aprender/manifest.webmanifest', name: 'Idiomas', scope: '/blog/aprender' },
    ] as const;

    for (const subApp of subAppManifests) {
      const response = await request.get(subApp.path);
      expect(response.status()).toBe(200);
      const manifest = (await response.json()) as {
        name: string;
        short_name: string;
        scope: string;
      };
      expect(manifest.name).toBe(subApp.name);
      expect(manifest.short_name).toBe(subApp.name);
      expect(manifest.scope).toBe(subApp.scope);
    }

    const bussolaManifestResponse = await request.get('/app/bussola-negocios/manifest.webmanifest');
    expect(bussolaManifestResponse.status()).toBe(200);
    const bussolaManifest = (await bussolaManifestResponse.json()) as {
      name: string;
      short_name: string;
      scope: string;
      start_url: string;
    };
    expect(bussolaManifest.name).toBe('Bússola de Negócios');
    expect(bussolaManifest.scope).toBe('/app/bussola-negocios');
    expect(bussolaManifest.start_url).toBe('/app/bussola-negocios');
    expect(bussolaManifest.name.startsWith('NKL')).toBe(false);
    expect(bussolaManifest.short_name.startsWith('NKL')).toBe(false);

    const iaManifestResponse = await request.get('/app/ferramenta-ia/manifest.webmanifest');
    expect(iaManifestResponse.status()).toBe(200);
    const iaManifest = (await iaManifestResponse.json()) as {
      name: string;
      short_name: string;
      scope: string;
      start_url: string;
    };
    expect(iaManifest.name).toBe('Estúdio IA');
    expect(iaManifest.scope).toBe('/app/ferramenta-ia');
    expect(iaManifest.start_url).toBe('/app/ferramenta-ia');
    expect(iaManifest.name.startsWith('NKL')).toBe(false);
    expect(iaManifest.short_name.startsWith('NKL')).toBe(false);

    const missingManifestResponse = await request.get('/app/pacote-idiomas-ia/manifest.webmanifest');
    expect(missingManifestResponse.status()).toBe(404);
  });
});
