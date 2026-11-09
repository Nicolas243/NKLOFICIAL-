import { test, expect } from '@playwright/test';

test.describe('catálogo de oportunidades', () => {
  test('prioriza oportunidades para começar e mantém todas as tags visíveis', async ({ page }) => {
    await page.goto('/programas');

    const firstCard = page.locator('#programs-grid article').first();
    await expect(firstCard).toContainText('Melhor para Começar');
    await expect(firstCard.getByTestId('program-tags')).not.toContainText('Ler mais');
  });

  test('abre a oportunidade pelo botão principal Ler mais', async ({ page }) => {
    await page.goto('/programas');

    const firstCard = page.locator('#programs-grid article').first();
    await firstCard.locator('button').filter({ hasText: 'Ler mais' }).last().click();
    await expect(page.getByRole('dialog', { name: /Detalhes de/ })).toBeVisible();
  });

  test('exibe CTA secundário atribuído no modal da oportunidade', async ({ page }) => {
    await page.goto('/programas');
    await page.locator('#programs-grid article').first().locator('button').filter({ hasText: 'Ler mais' }).last().click();

    await expect(page.getByRole('heading', {
      name: /Melhor renda extra é saber economizar|Ganhe tempo escolhendo melhor|Comece com um plano claro/,
    })).toBeVisible();
    await expect(page.getByRole('link', { name: /Quero começar com clareza|Ver o mapa prático|Montar meu próximo passo/ }))
      .toHaveAttribute('href', /\/guias\/renda-extra\?cta_variant=[012]$/u);
  });

  test('mantém a variante secundária salva no navegador', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nkl_program_secondary_cta_variant_v1', '1');
    });
    await page.goto('/programas');
    await page.locator('#programs-grid article').first().locator('button').filter({ hasText: 'Ler mais' }).last().click();
    await expect(page.getByRole('heading', { name: 'Ganhe tempo escolhendo melhor' })).toBeVisible();

    await page.reload();
    await page.locator('#programs-grid article').first().locator('button').filter({ hasText: 'Ler mais' }).last().click();
    await expect(page.getByRole('heading', { name: 'Ganhe tempo escolhendo melhor' })).toBeVisible();
  });

  test('preserva a oferta com atribuição válida ou inválida', async ({ page }) => {
    await page.goto('/guias/renda-extra?cta_variant=1');
    await expect(page.getByRole('heading', { name: 'Guias para Liberdade Financeira' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();

    await page.goto('/guias/renda-extra?cta_variant=invalid');
    await expect(page.getByRole('heading', { name: 'Guias para Liberdade Financeira' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();
  });

  test('registra checkout antes da escolha do provedor', async ({ page }) => {
    const events: Array<{ experiment?: string; variant?: string; eventType?: string }> = [];
    await page.route('/api/sales/offer-events', async (route) => {
      if (route.request().method() === 'POST') {
        events.push(route.request().postDataJSON() as { experiment?: string; variant?: string; eventType?: string });
        await route.fulfill({ status: 201, body: JSON.stringify({ received: true }) });
        return;
      }
      await route.continue();
    });

    await page.goto('/guias/renda-extra?cta_variant=1');
    await page.getByLabel('E-mail para a assinatura').fill('teste@example.com');
    await page.getByRole('button', { name: 'Começar por R$ 19/mês' }).click();
    const mercadoPagoButton = page.getByRole('button', { name: 'Assinar com Mercado Pago' });
    if (await mercadoPagoButton.count() > 0) {
      await mercadoPagoButton.click();
    }

    await expect.poll(() => events.some((event) => (
      event.experiment === 'program-secondary-cta'
      && event.variant === '1'
      && event.eventType === 'checkout'
    ))).toBeTruthy();
  });

  test('mantém a oferta funcional quando a telemetria de variante falha', async ({ page }) => {
    await page.route('/api/sales/offer-events?experiment=program-secondary-cta', async (route) => {
      await route.fulfill({ status: 503, body: JSON.stringify({ error: 'offer_variant_unavailable' }) });
    });
    await page.goto('/programas');
    await page.locator('#programs-grid article').first().locator('button').filter({ hasText: 'Ler mais' }).last().click();

    await expect(page.getByRole('heading', {
      name: /Melhor renda extra é saber economizar|Ganhe tempo escolhendo melhor|Comece com um plano claro/,
    })).toBeVisible();
  });

  test('valida eventos do experimento secundário', async ({ request }) => {
    const unknownExperiment = await request.post('/api/sales/offer-events', {
      data: { experiment: 'unknown', variant: '0', eventType: 'impression' },
    });
    expect(unknownExperiment.status()).toBe(400);

    const unknownVariant = await request.post('/api/sales/offer-events', {
      data: { experiment: 'program-secondary-cta', variant: '9', eventType: 'impression' },
    });
    expect(unknownVariant.status()).toBe(400);

    const validEvent = await request.post('/api/sales/offer-events', {
      data: { experiment: 'program-secondary-cta', variant: '0', eventType: 'checkout' },
    });
    expect([201, 503]).toContain(validEvent.status());
    if (validEvent.status() === 503) {
      await expect(validEvent.json()).resolves.toMatchObject({ error: 'offer_event_unavailable' });
    }

    const variantResponse = await request.get('/api/sales/offer-events?experiment=program-secondary-cta');
    expect([200, 503]).toContain(variantResponse.status());
    if (variantResponse.status() === 200) {
      const payload = await variantResponse.json() as { variant?: string };
      expect(['0', '1', '2']).toContain(payload.variant);
    } else {
      await expect(variantResponse.json()).resolves.toMatchObject({ error: 'offer_variant_unavailable' });
    }
  });
});
