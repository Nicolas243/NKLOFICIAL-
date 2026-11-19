import { test, expect } from '@playwright/test';

test.describe('campanha externa da rifa', () => {
  test('exibe o card público com link externo rastreável', async ({ page }) => {
    await page.goto('/programas');
    const card = page.locator('article').filter({ hasText: 'Os 3 melhores livros de finanças' });
    await expect(card).toBeVisible();
    await expect(card).toHaveClass(/bg-income-card\/95/);
    await expect(card).toHaveClass(/p-4/);
    await expect(card).toContainText('Abrir sorteio');
    await expect(card.getByRole('link', { name: 'Abrir sorteio', exact: true })).toHaveAttribute('href', 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos');
    await expect(card.getByRole('link', { name: 'Ler mais', exact: true })).toHaveAttribute('href', 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos');
    await expect(card.getByRole('button', { name: 'Compartilhar Os 3 melhores livros de finanças', exact: true })).toBeVisible();
    await expect(card.getByRole('link', { name: 'Criar lembrete para Os 3 melhores livros de finanças', exact: true })).toHaveAttribute('href', 'https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos');
    await expect(page.getByRole('dialog', { name: /Antes de você sair/i })).toHaveCount(0);
    await expect(card).toContainText('seleção física');
  });

  test('não exibe a campanha nas áreas transacionais', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Apoie a curadoria do Portal NKL')).toHaveCount(0);
    await expect(page.getByText('Uma forma de apoiar o Portal')).toHaveCount(0);
  });
});
