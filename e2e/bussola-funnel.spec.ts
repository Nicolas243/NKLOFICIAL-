import { expect, test } from '@playwright/test';

test.describe('Funil Bussola de Negocios IA (/ofertas/bussola-negocios)', () => {
  test('oculta precos antes do mini-quiz, revela previa personalizada e desbloqueia os 3 planos ao concluir', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/ofertas/bussola-negocios');

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Imagine acordar sabendo exatamente qual negócio próprio construir',
    );
    await expect(page.getByText('Edição Essencial (Guia 2027)')).toHaveCount(0);
    await expect(page.getByText('R$ 39')).toHaveCount(0);
    await expect(page.getByTestId('offer-checkout-cta')).toHaveCount(0);

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);

    await expect(page.getByTestId('bussola-live-mirror')).toContainText('Pronto para iniciar');

    await page.getByRole('button', { name: /Inteligência Artificial e automações/i }).click();
    await expect(page.getByTestId('bussola-live-mirror')).toContainText('42% calibrado');
    await page.getByRole('button', { name: /R\$ 3\.000 a R\$ 7\.000\/mês/i }).click();
    await expect(page.getByTestId('bussola-live-mirror')).toContainText('74% calibrado');
    await page.getByRole('button', { name: /R\$ 0 — Prefiro começar sem investir/i }).click();
    await expect(page.getByTestId('bussola-live-mirror')).toContainText('89% calibrado');

    await expect(page.getByText('Perfil identificado na prévia')).toBeVisible();
    await expect(page.getByText('1ª direção compatível revelada')).toBeVisible();
    await expect(page.getByText('Edição Essencial (Guia 2027)')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bússola de Negócios IA Completa' })).toBeVisible();
    await expect(page.getByText('Acervo Total NKL (11 Materiais + Bússola)')).toBeVisible();

    const checkoutCta = page.getByTestId('offer-checkout-cta');
    await expect(checkoutCta).toBeVisible();
    await expect(checkoutCta).toHaveAttribute(
      'href',
      '/ofertas/bussola-negocios/checkout?tier=complete',
    );

    await page.getByRole('button', { name: 'Escolher Acervo Total (R$ 247)' }).click();
    await expect(checkoutCta).toHaveAttribute(
      'href',
      '/ofertas/bussola-negocios/checkout?tier=vip',
    );

    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  });
});
