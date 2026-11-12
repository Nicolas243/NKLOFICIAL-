import { test, expect } from '@playwright/test';

test.describe('Espinha dorsal crítica do Portal NKL', () => {
  test('Home Page renderiza o H1 principal', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('O Cuidado Oculto');

    const loginLink = page.getByRole('link', { name: 'Entrar', exact: true });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login?area=music');
  });

  test('Catálogo renderiza os filtros e o grid', async ({ page }) => {
    await page.goto('/catalogo');

    // Heading principal da página.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Catálogo');

    // Input de busca textual (filtro facetado).
    await expect(page.getByPlaceholder('Buscar modelo...')).toBeVisible();

    // Dropdown de material do núcleo (select/combobox).
    await expect(page.getByLabel(/Material do Núcleo/)).toBeVisible();
  });

  test('cabeçalho musical exibe Entrar com contexto musical', async ({ page }) => {
    await page.goto('/catalogo');

    const loginLink = page.getByRole('link', { name: 'Entrar', exact: true });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/login?area=music');
  });

  test('cadastro musical mantém os campos de onboarding', async ({ page }) => {
    await page.goto('/login?area=music');
    await page.getByRole('button', { name: 'Criar conta gratuita' }).click();

    await expect(page.getByPlaceholder('Instrumento (opcional)')).toBeVisible();
    await expect(page.getByPlaceholder('Anos que toca (opcional)')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Perfil...' })).toBeVisible();
  });

  test('cadastro de renda extra não exibe campos musicais', async ({ page }) => {
    await page.goto('/login?area=income');
    await page.getByRole('button', { name: 'Criar conta gratuita' }).click();

    await expect(page.getByPlaceholder('Instrumento (opcional)')).toHaveCount(0);
    await expect(page.getByPlaceholder('Anos que toca (opcional)')).toHaveCount(0);
    await expect(page.getByRole('combobox', { name: 'Perfil...' })).toHaveCount(0);
  });
});
