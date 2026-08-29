import { test, expect } from '@playwright/test';

test.describe('Espinha dorsal crítica do Portal NKL', () => {
  test('Home Page renderiza o H1 principal', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Portal NKL');
  });

  test('Catálogo renderiza os filtros e o grid', async ({ page }) => {
    await page.goto('/catalogo');

    // Heading principal da página.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Catálogo');

    // Input de busca textual (filtro facetado).
    await expect(page.getByPlaceholder('Buscar modelo...')).toBeVisible();

    // Dropdown de material do núcleo (select/combobox).
    await expect(page.getByRole('combobox')).toBeVisible();
  });
});
