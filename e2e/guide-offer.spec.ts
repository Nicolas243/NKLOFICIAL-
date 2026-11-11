import { test, expect } from '@playwright/test';

test.describe('oferta do Guia de novembro', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nkl_privacy_consent', 'accepted');
    });
  });

  test('renderiza a variante 0 com o pacote, preços e dois modos de acesso', async ({ page }) => {
    await page.goto('/guias/renda-extra?cta_variant=0');

    await expect(page.getByRole('heading', { name: 'Receba os 5 materiais de novembro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quero o pacote de novembro' })).toBeVisible();
    await expect(page.getByText('R$ 39,00', { exact: true })).toBeVisible();
    await expect(page.getByText('R$ 19/mês', { exact: true })).toBeVisible();
    await expect(page.getByText('A compra única entrega este pacote uma vez.', { exact: false })).toBeVisible();
    await expect(page.getByText('A assinatura mensal mantém acesso ao pacote atual', { exact: false })).toBeVisible();

    for (const material of [
      'Guia Essencial Renda Extra 2027',
      'O Código de Novembro',
      'Dinheiro Para Ontem',
      'Escudo de Black Friday',
      'Raio-X Financeiro (computador e mobile)',
    ]) {
      await expect(page.getByText(material, { exact: true })).toBeVisible();
    }
  });

  test('renderiza a variante 4 e mantém a página utilizável para variante inválida', async ({ page }) => {
    await page.goto('/guias/renda-extra?cta_variant=4');
    await expect(page.getByRole('heading', { name: 'Prepare-se melhor para a Black Friday' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quero me preparar' })).toBeVisible();

    await page.goto('/guias/renda-extra?cta_variant=5');
    await expect(page.getByRole('heading', { name: /Guia Essencial Renda Extra 2027/ })).toBeVisible();
    await expect(page.getByText('R$ 39,00', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guias para Liberdade Financeira' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();
  });

  test('registra a atribuição de checkout sem acionar um pagamento real', async ({ page }) => {
    const events: Array<{ experiment?: string; variant?: string; eventType?: string }> = [];
    await page.route('/api/sales/offer-events', async (route) => {
      if (route.request().method() === 'POST') {
        events.push(route.request().postDataJSON() as { experiment?: string; variant?: string; eventType?: string });
        await route.fulfill({ status: 201, body: JSON.stringify({ received: true }) });
        return;
      }
      await route.continue();
    });
    await page.route('/api/payments/create-guide-checkout', async (route) => {
      await route.fulfill({ status: 503, body: JSON.stringify({ message: 'Teste sem pagamento' }) });
    });
    await page.route('/api/payments/create-guide-subscription', async (route) => {
      await route.fulfill({ status: 503, body: JSON.stringify({ message: 'Teste sem pagamento' }) });
    });

    await page.goto('/guias/renda-extra?cta_variant=0');
    await expect(page.getByRole('button', { name: 'Quero o pacote de novembro' })).toBeEnabled();
    await page.getByRole('button', { name: 'Quero o pacote de novembro' }).click();
    await expect.poll(() => events.some((event) => (
      event.experiment === 'guide-page-cta'
      && event.variant === '0'
      && event.eventType === 'checkout'
    ))).toBeTruthy();

    await page.getByLabel('E-mail para a assinatura').fill('teste@example.com');
    await page.getByRole('button', { name: 'Começar por R$ 19/mês' }).click();
    const stripeSubscriptionButton = page.getByRole('button', { name: 'Assinar com Stripe' });
    if (await stripeSubscriptionButton.isVisible()) {
      await stripeSubscriptionButton.click();
    }
    await expect.poll(() => events.filter((event) => (
      event.experiment === 'guide-page-cta'
      && event.variant === '0'
      && event.eventType === 'checkout'
    ))).toHaveLength(2);
  });
});
