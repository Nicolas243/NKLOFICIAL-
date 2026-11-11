import { test, expect } from '@playwright/test';

test.describe('prévia do inventário publicitário', () => {
  test('renderiza o mural, as faixas e o aviso de prévia', async ({ page }) => {
    await page.goto('/anuncie');

    await expect(page.getByRole('heading', { name: 'Anuncie onde a comunidade pesquisa' })).toBeVisible();
    await expect(page.getByText('ainda não há cobrança, assinatura ou publicação automática')).toBeVisible();
    await expect(page.locator('[data-ad-inventory="mural"] [data-ad-slot]')).toHaveCount(40);
    await expect(page.locator('[data-ad-inventory="band"]')).toHaveCount(3);

    for (const band of await page.locator('[data-ad-inventory="band"]').all()) {
      await expect(band.locator('[data-ad-slot]')).toHaveCount(10);
    }
  });

  test('oferece apenas o CTA interno de anúncios', async ({ page }) => {
    await page.goto('/anuncie');

    await expect(page.getByRole('link', { name: 'Quero anunciar' })).toHaveAttribute('href', '/noticias/anunciar');
    await expect(page.locator('[data-ad-inventory] a[href^="http"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /pagar|comprar|assinar/i })).toHaveCount(0);
  });

  test('mantém as faixas roláveis em viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/anuncie');

    await expect(page.locator('[data-ad-inventory="band"].overflow-x-auto')).toHaveCount(3);
  });
});
