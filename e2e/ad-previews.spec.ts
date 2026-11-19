import { expect, test } from '@playwright/test';

test.describe('pré-visualizações de publicidade', () => {
  test('anuncie deixa claro que o inventário ainda é uma prévia', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/programas/anuncie');

    await expect(page.getByRole('heading', { name: 'Anuncie no Portal NKL' })).toBeVisible();
    await expect(page.getByText('Renda Extra', { exact: true })).toBeVisible();
    await expect(page.getByText('Prévia de lançamento', { exact: true })).toBeVisible();
    await expect(page.getByText('Lançamento com revisão humana.', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Monte sua faixa' })).toBeVisible();
    await expect(page.getByText('Promoção de lançamento', { exact: true })).toBeVisible();
    await expect(page.getByText(/Assine com Stripe/u)).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('mural mantém estado vazio honesto ou parceiros ativos e CTAs utilizáveis no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mural-de-parceiros');

    await expect(page.getByRole('heading', { name: 'Mural de parceiros' })).toBeVisible();
    await expect(page.getByTestId('ad-preview-tile')).toHaveCount(0);

    const activePartnerLinks = page.locator('a[href^="/api/ads/click?slot="]');
    const activeCount = await activePartnerLinks.count();
    if (activeCount > 0) {
      for (let index = 0; index < activeCount; index += 1) {
        const box = await activePartnerLinks.nth(index).boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    } else {
      await expect(page.getByRole('heading', { name: 'Nenhum anúncio está ativo no momento' })).toBeVisible();
      const reserveLink = page.getByRole('link', { name: 'Reservar espaço publicitário' });
      await expect(reserveLink).toBeVisible();
      await expect(reserveLink).toHaveAttribute('href', '/programas/anuncie');
    }

    await expect(page.getByRole('link', { name: 'Conhecer planos para anunciar' })).toHaveAttribute('href', '/programas/anuncie');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
