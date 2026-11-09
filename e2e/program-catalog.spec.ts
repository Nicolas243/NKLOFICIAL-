import { test, expect } from '@playwright/test';

test.describe('catálogo de oportunidades', () => {
  test('prioriza oportunidades para começar e mantém todas as tags visíveis', async ({ page }) => {
    await page.goto('/programas');

    const firstCard = page.locator('#programs-grid article').first();
    await expect(firstCard).toContainText('Melhor para Começar');
    await expect(firstCard.getByTestId('program-tags')).not.toContainText('Ler mais');
    await expect(page.locator('#programs-grid')).not.toContainText('Conteúdo Premium');
  });

  test('abre a oportunidade pelo botão principal Ler mais', async ({ page }) => {
    await page.goto('/programas');

    const firstCard = page.locator('#programs-grid article').first();
    await firstCard.locator('button').filter({ hasText: 'Ler mais' }).last().click();
    await expect(page.getByRole('dialog', { name: /Detalhes de/ })).toBeVisible();
  });

  test('mantém o disclosure de transparência editorial recolhido até o usuário ativar o resumo', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nkl_tutorial_seen', 'true');
    });
    await page.goto('/programas');

    const transparency = page.locator('details').filter({ hasText: 'Sobre links de parceria' });
    await expect(transparency).toBeVisible();
    await expect(transparency).not.toHaveAttribute('open', '');
    await expect(page.getByText('O Portal NKL pode receber comissão por alguns links de parceria.', { exact: false })).not.toBeVisible();
    await transparency.getByText('Sobre links de parceria', { exact: true }).click();
    await expect(page.getByText('O Portal NKL pode receber comissão por alguns links de parceria.', { exact: false })).toBeVisible();
  });

  test('limita o convite do Buy Me a Coffee à oportunidade correspondente', async ({ page }) => {
    const inviteLink = page.getByRole('link', { name: 'Convidar no Buy Me a Coffee' });

    await page.goto('/programas');
    await expect(page.locator('footer')).not.toContainText('Convidar no Buy Me a Coffee');

    await page.locator('#search-input').fill('Buy Me a Coffee');
    const buyMeACoffeeCard = page.locator('#programs-grid article').filter({ hasText: 'Buy Me a Coffee' });
    await expect(buyMeACoffeeCard).toHaveCount(1);
    await buyMeACoffeeCard.getByRole('button', { name: 'Ler mais' }).click();
    const opportunityDialog = page.getByRole('dialog', { name: /Detalhes de/ });
    await expect(opportunityDialog.getByRole('link', { name: 'Convidar no Buy Me a Coffee' }))
      .toHaveAttribute('href', 'https://www.buymeacoffee.com/invite/ni2co3san9c');

    await page.goto('/programas/monetizacao-atencao-web');
    await expect(inviteLink).toHaveAttribute('href', 'https://www.buymeacoffee.com/invite/ni2co3san9c');
    await expect(inviteLink).toHaveAttribute('rel', /noopener noreferrer sponsored/u);

    await page.goto('/programas/mercado-pago');
    await expect(page.locator('body')).not.toContainText('Convidar no Buy Me a Coffee');
  });

  test('encerra o tutorial ao clicar no elemento destacado e mantém a ação', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('nkl_tutorial_seen');
    });
    await page.goto('/programas');

    const tutorial = page.locator('[role="dialog"][aria-labelledby="spotlight-tutorial-title"]');
    await expect(tutorial).toBeVisible();
    await page.locator('#income-wizard-trigger').click();
    await expect(tutorial).not.toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Vamos encontrar um ponto de partida' })).toBeVisible();
  });

  test('exibe CTA secundário atribuído no modal da oportunidade', async ({ page }) => {
    await page.goto('/programas');
    await page.locator('#programs-grid article').first().locator('button').filter({ hasText: 'Ler mais' }).last().click();

    await expect(page.getByTestId('compact-secondary-offer')).toBeVisible();
    await expect(page.getByTestId('compact-secondary-offer')).not.toContainText('Conteúdo Premium');
    await expect(page.getByRole('heading', {
      name: /Melhor renda extra é saber economizar|Ganhe tempo escolhendo melhor|Comece com um plano claro/,
    })).toBeVisible();
    await expect(page.getByRole('link', { name: /Quero começar com clareza|Ver o mapa prático|Montar meu próximo passo/ }))
      .toHaveAttribute('href', /\/guias\/renda-extra\?cta_variant=[012]$/u);
  });

  test('exibe CTA secundário compacto na página individual', async ({ page }) => {
    await page.goto('/programas');
    await page.locator('#programs-grid article').first().locator('button').filter({ hasText: 'Ler mais' }).last().click();
    await page.getByRole('dialog', { name: /Detalhes de/ }).getByRole('link', { name: 'Abrir página completa' }).click();

    await expect(page).toHaveURL(/\/programas\/[^/]+$/u);
    await expect(page.getByTestId('compact-secondary-offer')).toBeVisible();
    await expect(page.getByRole('link', { name: /Quero começar com clareza|Ver o mapa prático|Montar meu próximo passo/ }))
      .toHaveAttribute('href', /\/guias\/renda-extra\?cta_variant=[012]$/u);
  });

  test('deduplica a impressão ao fechar e reabrir a mesma oportunidade', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nkl_tutorial_seen', 'true');
    });
    const impressions: Array<{ experiment?: string; eventType?: string; variant?: string }> = [];
    await page.route('/api/sales/offer-events', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = route.request().postDataJSON() as { experiment?: string; eventType?: string; variant?: string };
        if (payload.experiment === 'program-secondary-cta' && payload.eventType === 'impression') impressions.push(payload);
        await route.fulfill({ status: 201, body: JSON.stringify({ received: true }) });
        return;
      }
      await route.continue();
    });

    await page.goto('/programas');
    const openFirstProgram = async (): Promise<void> => {
      await page.locator('#programs-grid article').first().locator('button').filter({ hasText: 'Ler mais' }).last().click();
      await expect(page.getByRole('heading', {
        name: /Melhor renda extra é saber economizar|Ganhe tempo escolhendo melhor|Comece com um plano claro/,
      })).toBeVisible();
    };
    await openFirstProgram();
    await expect.poll(() => impressions.length).toBe(1);
    await page.getByRole('dialog', { name: /Detalhes de/ }).getByRole('button', { name: 'Fechar' }).click();
    await openFirstProgram();
    await expect.poll(() => impressions.length).toBe(1);
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
    await expect(page.locator('#discount-simulator-title')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guias para Liberdade Financeira' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();

    await page.goto('/guias/renda-extra?cta_variant=invalid');
    await expect(page.getByRole('heading', { name: 'Guias para Liberdade Financeira' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();
  });

  test('atribui o checkout Hotmart quando o link avulso está configurado', async ({ page }) => {
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
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Quero liberar meu acesso' })).toBeEnabled();
    await page.getByRole('button', { name: 'Quero liberar meu acesso' }).click();
    const simulatorHotmartLink = page.getByRole('link', { name: 'Pagar com Hotmart' });
    if (await simulatorHotmartLink.count() === 0) {
      test.skip(true, 'HOTMART_GUIDE_CHECKOUT_URL não está configurada neste ambiente.');
    }
    await expect(simulatorHotmartLink).toHaveAttribute('href', /sck=program-secondary-cta(%3A|:)1/u);
    await simulatorHotmartLink.click({ noWaitAfter: true });
    await expect.poll(() => events.some((event) => (
      event.experiment === 'program-secondary-cta'
      && event.variant === '1'
      && event.eventType === 'checkout'
    ))).toBeTruthy();
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
