import { expect, test } from '@playwright/test';

test.describe('pr?-visualiza??es de publicidade', () => {
  test('anuncie deixa claro que o invent?rio ainda ? uma pr?via', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/anuncie');

    await expect(page.getByRole('heading', { name: 'Anuncie no Portal NKL' })).toBeVisible();
    await expect(page.getByText('Pr?via de lan?amento', { exact: true })).toBeVisible();
    await expect(page.getByText('Sem checkout ativo nesta fase.', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Quero anunciar' }).first()).toHaveAttribute('href', '/anuncie');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test('mural mant?m tiles e CTA utiliz?veis no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/mural-de-parceiros');

    await expect(page.getByRole('heading', { name: 'Mural de parceiros' })).toBeVisible();
    await expect(page.getByText(/Pr?via ? nenhum an?ncio est? ativo/u)).toBeVisible();
    const tiles = page.getByTestId('ad-preview-tile');
    await expect(tiles).toHaveCount(20);
    for (let index = 0; index < await tiles.count(); index += 1) {
      const box = await tiles.nth(index).boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole('link', { name: 'Conhecer planos para anunciar' })).toHaveAttribute('href', '/anuncie');
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
