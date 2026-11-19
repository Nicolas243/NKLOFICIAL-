import { expect, test } from '@playwright/test';

test.describe('prévia do inventário publicitário', () => {
  test('mantém apenas o letreiro clicável na home musical', async ({ page }) => {
    await page.goto('/musica/naipe_cordas');

    const banner = page.getByRole('region', { name: 'Anúncio do Portal NKL' });
    await expect(banner).toContainText('ANUNCIE AQUI');
    await expect(banner).not.toContainText('4.000 VIZU');
    await expect(banner).not.toContainText('R$ 19,90');
    await expect(banner.getByRole('link', { name: 'Anuncie no Portal NKL' })).toHaveAttribute('href', '/programas/anuncie');
  });

  test('renderiza a página de anúncios e o lote nativo', async ({ page }) => {
    await page.goto('/programas/anuncie');

    await expect(page.getByRole('heading', { name: 'Anuncie no Portal NKL' })).toBeVisible();
    const banner = page.getByRole('region', { name: 'Anúncio do Portal NKL' });
    await expect(banner).toContainText('ANUNCIE AQUI PARA 4000 VIZ AINDA EM NOVEMBRO');
    await expect(banner).not.toContainText('Espaço disponível');
    await expect(banner).not.toContainText('R$ 19,90');
    const bannerMetrics = await banner.evaluate((element) => ({
      width: element.clientWidth,
      scrollWidth: element.scrollWidth,
      height: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(bannerMetrics.scrollWidth).toBe(bannerMetrics.width);
    expect(bannerMetrics.scrollHeight).toBe(bannerMetrics.height);
    await expect(banner).not.toContainText('Parceiros NKL');
    await expect(banner).not.toContainText('Sua marca aqui');
    await expect(banner.locator('[aria-label^="Anuncie na cota"]')).toHaveCount(0);
    await expect(page.getByText('Lançamento com revisão humana.', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Monte sua faixa' })).toBeVisible();
    await expect(page.getByText('Promoção de lançamento', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Assinar com Stripe/u })).toHaveCount(0);
  });

  test('oferece apenas CTAs internos e nenhum checkout', async ({ page }) => {
    await page.goto('/programas/anuncie');

    await expect(page.getByRole('link', { name: 'Anuncie no Portal NKL' }).first()).toHaveAttribute('href', '/programas/anuncie');
    await expect(page.locator('a[href^="http"]').filter({ hasText: /anunciar|mural/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /pagar|comprar|assinar/i })).toHaveCount(0);
  });

  test('mantém os tiles utilizáveis em viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/programas/anuncie');

    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
