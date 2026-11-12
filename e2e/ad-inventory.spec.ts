import { expect, test } from '@playwright/test';

test.describe('prévia do inventário publicitário', () => {
  test('renderiza a página de anúncios e o lote nativo', async ({ page }) => {
    await page.goto('/anuncie');

    await expect(page.getByRole('heading', { name: 'Anuncie no Portal NKL' })).toBeVisible();
    await expect(page.getByText('Sem checkout ativo nesta fase.', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Prévia de lote nativo')).toBeVisible();
    await expect(page.getByTestId('ad-preview-tile')).toHaveCount(10);
  });

  test('oferece apenas CTAs internos e nenhum checkout', async ({ page }) => {
    await page.goto('/anuncie');

    await expect(page.getByRole('link', { name: 'Quero anunciar' }).first()).toHaveAttribute('href', '/anuncie');
    await expect(page.locator('a[href^="http"]').filter({ hasText: /anunciar|mural/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /pagar|comprar|assinar/i })).toHaveCount(0);
  });

  test('mantém os tiles utilizáveis em viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/anuncie');

    const tiles = page.getByTestId('ad-preview-tile');
    await expect(tiles).toHaveCount(10);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
