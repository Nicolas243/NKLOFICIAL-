import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const publicHost = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nkloficial.com.br').replace(/\/+$/, '');

async function expectSeoPage(page: Page, path: string, canonicalPath: string) {
  await page.goto(path);
  await expect(page).toHaveTitle(/\S+/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S+/);
  const expectedCanonical = canonicalPath === '/' ? publicHost : `${publicHost}${canonicalPath}`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', expectedCanonical);
}

test.describe('SEO público de renda extra', () => {
  test('mantém metadata e canonical no domínio público', async ({ page }) => {
    await expectSeoPage(page, '/', '/');
    await expectSeoPage(page, '/programas', '/programas');
    await expectSeoPage(page, '/blog/renda-extra', '/programas');
    await expectSeoPage(page, '/programas/canal-dark-youtube-notebooklm', '/programas/canal-dark-youtube-notebooklm');
  });

  test('expõe hubs editoriais com conteúdo e links internos', async ({ page }) => {
    for (const slug of ['celular', 'sem-investimento', 'trabalho-remoto', 'pesquisas-remuneradas']) {
      await page.goto(`/programas/${slug}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${publicHost}/programas/${slug}`);
      await expect(page.getByRole('link', { name: /Ver catálogo completo/ })).toBeVisible();
    }
  });

  test('publica sitemap e robots sem expor rotas privadas', async ({ request }) => {
    const sitemapResponse = await request.get('/sitemap.xml');
    expect(sitemapResponse.ok()).toBeTruthy();
    const sitemap = await sitemapResponse.text();
    expect(sitemap).toContain(`${publicHost}/programas`);
    expect(sitemap).toContain(`${publicHost}/programas/celular`);
    expect(sitemap).toContain(`${publicHost}/anuncie`);
    expect(sitemap).not.toContain(`${publicHost}/admin`);

    const robotsResponse = await request.get('/robots.txt');
    expect(robotsResponse.ok()).toBeTruthy();
    const robots = await robotsResponse.text();
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Disallow: /perfil');
    expect(robots).toContain('Disallow: /dashboard');
    expect(robots).toContain(`Sitemap: ${publicHost}/sitemap.xml`);
  });
});
