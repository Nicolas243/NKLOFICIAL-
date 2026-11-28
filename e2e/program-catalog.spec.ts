import { test, expect } from '@playwright/test';

test.describe('catálogo de oportunidades', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('nkl_privacy_consent', 'accepted');
      window.localStorage.setItem('nkl_area_tutorial_suggestion_seen:income', 'true');
      window.localStorage.setItem('nkl_area_tutorial_suggestion_seen:music', 'true');
    });
  });

  test('prioriza oportunidades para começar e mantém todas as tags visíveis', async ({ page }) => {
    await page.goto('/programas');

    const firstCard = page.locator('#programs-grid article').first();
    await expect(firstCard).toContainText('Melhor para Começar');
    await expect(firstCard.getByTestId('program-tags')).not.toContainText('Ler mais');
    await expect(page.locator('#programs-grid')).not.toContainText('Conteúdo Premium');
  });

  test('exibe todas as oportunidades na primeira pagina, botoes alinhados, link de idiomas e projetos Micro1 em PT-BR', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/programas');

    const totalCards = await page.locator('#programs-grid article[role="button"]').count();
    expect(totalCards).toBeGreaterThanOrEqual(50);

    const tagsBar = page.getByTestId('discovery-tags-bar');
    await expect(tagsBar).toBeVisible();
    await expect(tagsBar.getByRole('button', { name: 'Ganhar sem fazer nada' })).toBeVisible();
    await expect(tagsBar.getByRole('button', { name: 'Ganhar com vídeos sem aparecer' })).toBeVisible();
    await expect(tagsBar.getByRole('button', { name: 'Gravar vídeos para empresas' })).toBeVisible();
    await expect(tagsBar.getByRole('button', { name: 'Sou bom com idiomas' })).toBeVisible();

    const floatingGuide = page.getByTestId('floating-como-funciona');
    await expect(floatingGuide).toBeVisible();
    await floatingGuide.getByRole('link', { name: /Como funciona/i }).click();
    await expect(page.locator('#como-funciona')).toBeVisible();

    const helperIdiomasLink = page.getByRole('link', { name: 'Tem dificuldade com idioma?' }).first();
    await expect(helperIdiomasLink).toBeVisible();
    await expect(helperIdiomasLink).toHaveAttribute('href', '/idiomas');

    const micro1Card = page.locator('#programs-grid article').filter({ hasText: 'Micro1' }).first();
    if (await micro1Card.count() === 0) {
      test.skip(true, 'Micro1 requires drizzle/0044_new_income_programs.sql in the test database.');
    }
    await expect(micro1Card.getByTestId('micro1-card-hint')).toBeVisible();
    await expect(micro1Card.getByText('Projeto em destaque')).toHaveCount(0);

    await micro1Card.locator('button').filter({ hasText: 'Ler mais' }).last().click();

    const modalActions = page.getByTestId('program-modal-actions');
    await expect(modalActions).toBeVisible();
    const actionBoxes = await modalActions
      .locator('a, button')
      .evaluateAll((elements) =>
        elements.map((el) => {
          const rect = el.getBoundingClientRect();
          return { top: Math.round(rect.top), height: Math.round(rect.height) };
        }),
      );
    expect(actionBoxes.length).toBeGreaterThanOrEqual(4);
    for (const box of actionBoxes) {
      expect(box.height).toBeGreaterThanOrEqual(42);
      expect(box.height).toBeLessThanOrEqual(48);
    }
    const heights = actionBoxes.map((box) => box.height);
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2);
    const tops = actionBoxes.map((box) => box.top);
    expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(2);

    const fullOpportunities = page.getByTestId('micro1-full-opportunities');
    await expect(fullOpportunities).toBeVisible();
    await expect(fullOpportunities.getByTestId('micro1-draggable-list')).toBeVisible();
    await fullOpportunities.getByRole('button', { name: /Tipo:/u }).click();

    const dialog = page.getByRole('dialog', { name: 'Filtrar projetos' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Português/u })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Fácil/u })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Médio/u })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Outras especialidades/u })).toBeVisible();
  });

  test('mostra o catálogo completo da Micro1 na página da oportunidade', async ({ page }) => {
    await page.goto('/programas/micro1');

    if (await page.getByTestId('micro1-full-opportunities').count() === 0) {
      test.skip(true, 'Micro1 requires drizzle/0044_new_income_programs.sql in the test database.');
    }
    await expect(page.getByTestId('micro1-full-opportunities')).toBeVisible();
    await expect(page.getByPlaceholder('Pesquisar projeto ou área...')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tipo:/u })).toBeVisible();

    const list = page.getByTestId('micro1-draggable-list');
    await expect(list).toBeVisible();
    await expect(list.getByRole('link', { name: /Quero entrar/i }).first()).toBeVisible();
    await expect(list.getByRole('button', { name: /Compartilhar/i }).first()).toBeVisible();
  });

  test('abre a oportunidade pelo botão principal Ler mais', async ({ page }) => {
    await page.goto('/programas');

    const firstCard = page.locator('#programs-grid article').first();
    await firstCard.locator('button').filter({ hasText: 'Ler mais' }).last().click();
    await expect(page.getByRole('dialog', { name: /Detalhes de/ })).toBeVisible();
  });

  test('salva uma oportunidade no dispositivo sem exigir login', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('nkl-income-wizard-saved');
    });
    await page.goto('/programas');

    const firstCard = page.locator('#programs-grid article').first();
    await firstCard.getByRole('button', { name: /^Salvar /u }).click();
    await expect(firstCard.getByRole('button', { name: /^Remover /u })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => window.localStorage.getItem('nkl-income-wizard-saved'))).toMatch(/.+/u);
  });

  test('mostra como a plataforma funciona e o passo a passo na página completa', async ({ page }) => {
    await page.goto('/programas/mercado-pago');

    await expect(page.getByRole('heading', { name: 'Como funciona e qual é o passo a passo?' })).toBeVisible();
    await expect(page.getByText('Guia prático', { exact: true })).toBeVisible();
    await expect(page.getByText('Abra ou acesse sua conta do Mercado Pago', { exact: false })).toBeVisible();
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

  test('oferece compartilhamento da página canônica acima do WhatsApp', async ({ page }) => {
    await page.goto('/programas/mercado-pago?utm_source=threads&ref=example');

    await expect(page.getByRole('button', { name: 'Compartilhar Portal NKL' })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/programas\/mercado-pago$/u);
    await expect(page.locator('.whatsapp-float')).toBeVisible();
  });

  test('limita o convite do Buy Me a Coffee à oportunidade correspondente', async ({ page }) => {
    const inviteLink = page.getByRole('link', { name: 'Convidar no Pague um Café' });

    await page.goto('/programas');
    await expect(page.locator('footer')).not.toContainText('Convidar no Pague um Café');

    await page.locator('#search-input').fill('Buy Me a Coffee');
    const buyMeACoffeeCard = page.locator('#programs-grid article').filter({ hasText: 'Buy Me a Coffee' });
    await expect(buyMeACoffeeCard).toHaveCount(1);
    await buyMeACoffeeCard.getByRole('button', { name: 'Ler mais' }).click();
    const opportunityDialog = page.getByRole('dialog', { name: /Detalhes de/ });
    await expect(opportunityDialog.getByRole('link', { name: 'Convidar no Pague um Café' }))
      .toHaveAttribute('href', 'https://www.buymeacoffee.com/invite/ni2co3san9c');

    await page.goto('/programas/monetizacao-atencao-web');
    await expect(inviteLink).toHaveAttribute('href', 'https://www.buymeacoffee.com/invite/ni2co3san9c');
    await expect(inviteLink).toHaveAttribute('rel', /noopener noreferrer sponsored/u);

    await page.goto('/programas/mercado-pago');
    await expect(page.locator('body')).not.toContainText('Convidar no Pague um Café');
  });

  test('encerra o tutorial ao clicar no elemento destacado e mantém a ação', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('nkl_tutorial_seen');
      window.localStorage.removeItem('nkl_area_tutorial_suggestion_seen:income');
    });
    await page.goto('/programas');

    await page.getByRole('button', { name: 'Ver guia' }).click();
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
    await expect(page.locator('#guide-unified-checkout')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Guias para Liberdade Financeira' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();

    await page.goto('/guias/renda-extra?cta_variant=invalid');
    await expect(page.getByRole('heading', { name: 'Guias para Liberdade Financeira' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Começar por R$ 19/mês' })).toBeVisible();
  });

  test('mantém o checkout no Stripe e não expõe Hotmart', async ({ page }) => {
    await page.goto('/guias/renda-extra?cta_variant=1');
    await expect(page.getByText('O pagamento é processado pelo Stripe e o acesso é liberado após a confirmação.', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pagar com Hotmart' })).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText('Hotmart');
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
    await page.locator('#guide-checkout-name').fill('Nicolas Santos');
    await page.locator('#guide-checkout-email').fill('buyer@example.com');
    await page.locator('#guide-checkout-cpf').fill('529.982.247-25');
    await page.locator('#guide-unified-checkout input[type="checkbox"]').click();
    await page.getByRole('button', { name: 'Começar por R$ 19/mês' }).click();

    await expect.poll(() => events.some((event) => (
      event.experiment === 'guide-page-cta'
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
