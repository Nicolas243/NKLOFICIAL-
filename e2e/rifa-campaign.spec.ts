import { test, expect } from '@playwright/test';

test.describe('campanha externa da rifa', () => {
  test('exibe o card público com link externo rastreável', async ({ page }) => {
    await page.goto('/programas');
    const card = page.getByRole('region', { name: /Uma forma de apoiar o Portal/i });
    await expect(card).toBeVisible();
    const link = card.getByRole('link', { name: 'Participar', exact: true });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noopener noreferrer/);
    await expect(link).toHaveAttribute('href', /123rifas\.com\/acao\/os-3-melhores-livros-de-financas-fisicos/);
    await expect(page.getByRole('complementary', { name: 'Ação de apoio ao Portal NKL' })).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: /Antes de você sair/i })).toHaveCount(0);
    await expect(card).toContainText('3 livros físicos');
  });

  test('não exibe a campanha nas áreas transacionais', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Apoie a curadoria do Portal NKL')).toHaveCount(0);
    await expect(page.getByText('Uma forma de apoiar o Portal')).toHaveCount(0);
  });
});
