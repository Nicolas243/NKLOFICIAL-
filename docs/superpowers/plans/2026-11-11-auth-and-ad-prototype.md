# Autenticação de compra e protótipo de anúncios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conduzir visitantes não autenticados ao login, retomar com segurança a intenção de compra, separar o contexto musical do contexto de Renda Extra no cadastro e entregar uma prévia local do inventário publicitário.

**Architecture:** Os botões de compra tratarão apenas `401 authentication_required`, construindo um retorno interno com `next` e `resume`; o login por senha e OAuth reutilizarão esse retorno validado. O protótipo de anúncios será estático, responsivo e sem persistência ou cobrança, apontando o CTA para o fluxo existente de `/noticias/anunciar`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Supabase Auth/SSR, Drizzle existente, Tailwind CSS v4, Node `node:test` e Playwright.

**Spec:** `docs/superpowers/specs/2026-11-11-auth-and-ad-prototype-design.md`

## Global Constraints

- Preservar Next.js 16, React, TypeScript strict, Supabase, Drizzle e Tailwind.
- Reutilizar `safeNextPath` para impedir open redirect.
- Não aplicar migration, alterar banco remoto ou fazer deploy sem confirmação explícita.
- Não iniciar cobrança automaticamente após login; apenas restaurar a intenção e focar o formulário correspondente.
- O protótipo de anúncios não pode publicar, cobrar, medir leads ou prometer visualizações.
- Os blocos de anúncio devem manter área de toque mínima de 44px em telas pequenas.
- Não expor segredos OAuth em código, logs, `.env.example` ou commits.

## Review Focus

- `401` de um endpoint que não seja `authentication_required` deve continuar sendo exibido como erro, não virar redirecionamento: coberto no teste unitário do helper de retorno e nos testes dos botões.
- `next` malformado, externo ou com barras invertidas deve cair em `/`: coberto por `src/lib/auth/__tests__/oauth.test.ts`.
- Login por senha e Google devem preservar `next` e `resume` sem transformar parâmetros em open redirect: coberto pelo teste do callback e pelo E2E de retorno ao Guia.
- Cadastro em contexto Renda Extra não deve exibir nem exigir campos musicais; cadastro em contexto Música deve preservá-los: coberto pelo E2E da tela de login.
- A página de anúncios deve continuar útil em viewport mobile, com slots tocáveis e CTA para `/noticias/anunciar`: coberto pelo E2E da página `/anuncie`.

---

### Task 1: Modelar retorno seguro e mensagens de OAuth

**Files:**
- Create: `src/lib/auth/return-intent.ts`
- Create: `src/lib/auth/__tests__/return-intent.test.ts`
- Modify: `src/lib/auth/oauth.ts`
- Modify: `src/lib/auth/errors.ts`
- Test: `src/lib/auth/__tests__/return-intent.test.ts`

**Interfaces:**
- Consumes: `safeNextPath(value: string | null)` de `src/lib/auth/oauth.ts`.
- Produces: `GuideResumeIntent = 'purchase' | 'subscription' | null`, `buildLoginPath(nextPath: string, intent: GuideResumeIntent): string`, `buildReturnPath(nextPath: string, intent: GuideResumeIntent): string` e `parseGuideResumeIntent(value: string | null): GuideResumeIntent`.

- [ ] **Step 1: Write the failing tests**

  Em `src/lib/auth/__tests__/return-intent.test.ts`, cobrir:
  - `buildLoginPath('/guias/renda-extra', 'purchase')` retorna `/login?next=%2Fguias%2Frenda-extra&resume=purchase`.
  - `buildReturnPath('/guias/renda-extra', 'subscription')` retorna `/guias/renda-extra?resume=subscription`.
  - destinos externos, `//evil.example` e caminhos com `\` são normalizados para `/`.
  - valores de `resume` diferentes de `purchase` e `subscription` retornam `null`.

- [ ] **Step 2: Run the focused test to verify it fails**

  Run: `node --import tsx --test src/lib/auth/__tests__/return-intent.test.ts`

  Expected: FAIL porque `src/lib/auth/return-intent.ts` ainda não existe.

- [ ] **Step 3: Implement the return-intent helpers**

  Criar os tipos e funções com `URLSearchParams`, sempre passando o destino por
  `safeNextPath`. Não aceitar nenhum valor de intenção fora dos dois valores
  declarados.

- [ ] **Step 4: Add provider-specific error mapping**

  Em `src/lib/auth/errors.ts`, mapear mensagens que contenham
  `unsupported provider`, `missing oauth secret` ou `provider is not enabled`
  para uma mensagem acionável: `O login com Google ainda não está configurado. Use e-mail e senha ou conclua a configuração do Google no Supabase.` Sem incluir detalhes secretos.

- [ ] **Step 5: Run the focused tests**

  Run: `node --import tsx --test src/lib/auth/__tests__/return-intent.test.ts src/lib/auth/__tests__/errors.test.ts`

  Expected: PASS.

- [ ] **Step 6: Commit**

  ```powershell
  git add src/lib/auth/return-intent.ts src/lib/auth/__tests__/return-intent.test.ts src/lib/auth/oauth.ts src/lib/auth/errors.ts
  git commit -m "feat: modelar retorno seguro do login"
  ```

### Task 2: Redirecionar checkout não autenticado e retomar a intenção

**Files:**
- Modify: `src/components/sales/guide-checkout-button.tsx`
- Modify: `src/components/sales/guide-subscription-button.tsx`
- Modify: `src/components/sales/guide-page-offer.tsx`
- Modify: `src/app/guias/renda-extra/page.tsx`
- Test: `e2e/guide-offer.spec.ts`

**Interfaces:**
- Consumes: `buildLoginPath()` e `GuideResumeIntent` da Task 1.
- Produces: `GuidePageOffer` aceita `resumeIntent?: GuideResumeIntent`; cada botão aceita `resumeIntent?: 'purchase' | 'subscription'` e usa foco/scroll apenas quando sua intenção corresponde.

- [ ] **Step 1: Write the failing E2E assertions**

  Em `e2e/guide-offer.spec.ts`, adicionar cenários que interceptem:
  - `/api/payments/create-guide-checkout` com `401` e `{ error: 'authentication_required' }`; clicar no CTA deve navegar para `/login?next=%2Fguias%2Frenda-extra&resume=purchase`.
  - `/api/payments/create-guide-subscription` com o mesmo `401`; clicar no CTA deve navegar para `/login?next=%2Fguias%2Frenda-extra&resume=subscription`.
  - abrir `/guias/renda-extra?resume=subscription` deve focar o input `#guide-subscription-cpf`.
  - uma resposta `401` com `error: 'other_error'` deve continuar mostrando a mensagem da API e não navegar.

- [ ] **Step 2: Run the focused E2E test to verify it fails**

  Run: `npx playwright test e2e/guide-offer.spec.ts -g "autenticação|retoma|401"`

  Expected: FAIL porque os botões atualmente mostram `Entre na sua conta...` e não criam o retorno com `resume`.

- [ ] **Step 3: Implement authentication redirects in both buttons**

  Em `GuideCheckoutButton` e `GuideSubscriptionButton`, após ler o payload:
  - se `response.status === 401` e `payload.error === 'authentication_required'`, usar `window.location.assign(buildLoginPath('/guias/renda-extra', 'purchase'|'subscription'))`;
  - retornar imediatamente depois da navegação;
  - manter a mensagem existente para todo outro erro.

- [ ] **Step 4: Thread the resume intent through the Guide page**

  Em `src/app/guias/renda-extra/page.tsx`, aceitar `resume` nos `searchParams`,
  validar com `parseGuideResumeIntent`, e passar o valor para
  `GuidePageOffer`. Em `GuidePageOffer`, repassar a intenção para o botão
  correspondente sem ativar o botão nem iniciar pagamento.

- [ ] **Step 5: Focus the corresponding CPF field**

  Adicionar refs e `useEffect` nos componentes de compra/assinatura para, quando
  `resumeIntent` corresponder, chamar `scrollIntoView({ block: 'center' })` e
  `focus()` no campo CPF. O foco deve ocorrer depois da hidratação e não deve
  acontecer no fluxo normal.

- [ ] **Step 6: Run the focused E2E test**

  Run: `npx playwright test e2e/guide-offer.spec.ts -g "autenticação|retoma|401"`

  Expected: PASS; nenhum texto `Entre na sua conta para comprar o guia.` deve
  aparecer como erro de checkout.

- [ ] **Step 7: Commit**

  ```powershell
  git add src/components/sales/guide-checkout-button.tsx src/components/sales/guide-subscription-button.tsx src/components/sales/guide-page-offer.tsx src/app/guias/renda-extra/page.tsx e2e/guide-offer.spec.ts
  git commit -m "fix: redirecionar compra para login"
  ```

### Task 3: Preservar `next` e `resume` em senha e Google OAuth

**Files:**
- Modify: `src/actions/auth.ts`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/login/login-form.tsx`
- Modify: `src/components/auth/google-signin-button.tsx`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/lib/auth/oauth.ts`
- Test: `src/app/auth/callback/route.test.ts`
- Test: `src/lib/auth/__tests__/return-intent.test.ts`

**Interfaces:**
- Consumes: `buildReturnPath()`, `parseGuideResumeIntent()` e `safeNextPath()` da Task 1.
- Produces: `LoginForm` recebe `nextPath`, `resumeIntent` e `area`; a Server Action `login(formData)` redireciona para `buildReturnPath(next, resume)`; `GoogleSignInButton` recebe os mesmos valores e inclui ambos na callback interna.

- [ ] **Step 1: Extend failing callback tests**

  Em `src/app/auth/callback/route.test.ts`, cobrir que:
  - o callback lê `next=/guias/renda-extra` e `resume=subscription`;
  - em sucesso, o redirect final é `/guias/renda-extra?resume=subscription`;
  - em falha de sincronização, o redirect para login preserva `next` e `resume`;
  - um `next` externo continua resultando em `/`.

- [ ] **Step 2: Run callback tests to verify the new assertions fail**

  Run: `node --import tsx --test src/app/auth/callback/route.test.ts`

  Expected: FAIL nas asserções de `resume`, pois o callback atualmente só preserva `next`.

- [ ] **Step 3: Implement callback preservation**

  Alterar `profileSyncFailurePath` para aceitar a intenção validada e usar
  `buildLoginPath`/`buildReturnPath`. O callback deve validar o valor antes de
  montar qualquer URL.

- [ ] **Step 4: Preserve return data in password login**

  Adicionar campos hidden `next` e `resume` ao formulário. Em `login`, ler,
  validar e redirecionar com `buildReturnPath`, em vez de sempre usar `/`.
  Mensagens de erro devem continuar retornando à tela de login sem expor o
  destino como conteúdo livre.

- [ ] **Step 5: Preserve return data in Google login**

  Passar `nextPath` e `resumeIntent` ao `GoogleSignInButton`; construir o
  `redirectTo` como `/auth/callback` com query parameters codificados. Mapear o
  erro `Unsupported provider: missing OAuth secret` pela função de mensagens
  criada na Task 1.

- [ ] **Step 6: Run focused auth tests**

  Run: `node --import tsx --test src/app/auth/callback/route.test.ts src/lib/auth/__tests__/return-intent.test.ts src/lib/auth/__tests__/errors.test.ts`

  Expected: PASS.

- [ ] **Step 7: Commit**

  ```powershell
  git add src/actions/auth.ts src/app/login/page.tsx src/app/login/login-form.tsx src/components/auth/google-signin-button.tsx src/app/auth/callback/route.ts src/lib/auth/oauth.ts src/app/auth/callback/route.test.ts src/lib/auth/__tests__/return-intent.test.ts
  git commit -m "fix: preservar destino após autenticacao"
  ```

### Task 4: Separar contexto musical e Renda Extra no cadastro e cabeçalho

**Files:**
- Modify: `src/components/header.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/login/login-form.tsx`
- Modify: `src/actions/auth.ts`
- Test: `e2e/critical-path.spec.ts`
- Test: `e2e/guide-offer.spec.ts`

**Interfaces:**
- Consumes: `area=music|income` e os campos de retorno da Task 3.
- Produces: links do cabeçalho musical apontam para `/login?area=music`; links do cabeçalho Renda Extra apontam para `/login?area=income`; `LoginForm` recebe `area: 'music' | 'income'` e só renderiza campos musicais no contexto `music`.

- [ ] **Step 1: Write failing E2E assertions**

  Cobrir:
  - o cabeçalho musical exibe `Entrar` no desktop e mobile e aponta para
    `/login?area=music`;
  - o cabeçalho Renda Extra exibe `Entrar` também no desktop, não somente
    dentro do menu mobile;
  - `/login?area=income` não renderiza `Instrumento`, `Anos que toca` nem o
    seletor de papel musical;
  - `/login?area=music` mantém esses campos.

- [ ] **Step 2: Run the focused E2E tests to verify failure**

  Run: `npx playwright test e2e/critical-path.spec.ts e2e/guide-offer.spec.ts -g "Entrar|cadastro|área|contexto"`

  Expected: FAIL porque a área Renda Extra oculta o botão no desktop e o
  cadastro atual sempre renderiza os campos musicais.

- [ ] **Step 3: Implement area-aware login**

  Ler `area` em `LoginPage`, normalizar para `music` ou `income`, e passar ao
  formulário. Em modo `income`, ocultar os campos musicais e enviar contexto
  `income` no `FormData`; em modo `music`, preservar o onboarding atual.
  `registerWithProfile` deve usar valores musicais somente quando o contexto
  for `music`, sem criar migration ou novo campo.

- [ ] **Step 4: Expose the header action consistently**

  Remover o wrapper que esconde `authBtn` na área Renda Extra e usar links com
  `area` apropriado. Na home, manter o menu radial intacto; qualquer ação
  explícita de entrada adicionada ao fallback deve apontar para
  `/login?area=music`.

- [ ] **Step 5: Run focused E2E tests**

  Run: `npx playwright test e2e/critical-path.spec.ts e2e/guide-offer.spec.ts -g "Entrar|cadastro|área|contexto"`

  Expected: PASS.

- [ ] **Step 6: Commit**

  ```powershell
  git add src/components/header.tsx src/app/login/page.tsx src/app/login/login-form.tsx src/actions/auth.ts e2e/critical-path.spec.ts e2e/guide-offer.spec.ts
  git commit -m "feat: separar contexto musical e renda extra no login"
  ```

### Task 5: Criar protótipo local do mural e das faixas de anúncios

**Files:**
- Create: `src/lib/ad-inventory.ts`
- Create: `src/lib/__tests__/ad-inventory.test.ts`
- Create: `src/components/ads/ad-inventory-preview.tsx`
- Create: `src/app/anuncie/page.tsx`
- Modify: `src/app/sitemap.ts`
- Test: `e2e/seo.spec.ts`
- Test: `e2e/ad-inventory.spec.ts`

**Interfaces:**
- Consumes: rota existente `/noticias/anunciar`.
- Produces: `AD_MURAL_TILE_COUNT = 40`, `AD_BAND_COUNT = 3`, `AD_SLOTS_PER_BAND = 10`, `getAdSlotLabel(index: number): string`, e componente `AdInventoryPreview` que renderiza mural e faixas com links sem checkout.

- [ ] **Step 1: Write failing unit tests for inventory constants**

  Em `src/lib/__tests__/ad-inventory.test.ts`, verificar:
  - o mural possui 40 slots;
  - existem 3 faixas com 10 slots cada;
  - rótulos são determinísticos (`Mural 01`, `Faixa 1 · espaço 01`);
  - nenhum slot possui URL externa ou preço tratado como cobrança real.

- [ ] **Step 2: Run unit tests to verify failure**

  Run: `node --import tsx --test src/lib/__tests__/ad-inventory.test.ts`

  Expected: FAIL porque o módulo de inventário ainda não existe.

- [ ] **Step 3: Implement the static inventory model**

  Criar constantes e helpers somente com dados estáticos. O preço exibido deve
  ser identificado como “prévia”/“valor simbólico”, sem representar produto
  cobrável.

- [ ] **Step 4: Run unit tests**

  Run: `node --import tsx --test src/lib/__tests__/ad-inventory.test.ts`

  Expected: PASS.

- [ ] **Step 5: Implement the responsive preview component**

  Criar `AdInventoryPreview` com:
  - grid 1:1 de aproximadamente 80px CSS por slot, mas com `min-h-11` e
    `min-w-11`;
  - três contêineres horizontais com overflow/scroll no mobile;
  - estado visual neutro para slots vazios;
  - texto explícito de prévia e futura assinatura mensal;
  - CTA Link para `/noticias/anunciar`;
  - nenhuma chamada a API, Storage, Stripe ou banco.

- [ ] **Step 6: Create `/anuncie` and public route metadata**

  Criar a página com título, proposta do Mural NKL, explicação de que não há
  cobrança ativa nesta prévia e o componente. Incluir `/anuncie` no sitemap
  público somente se a rota estiver pronta para indexação.

- [ ] **Step 7: Write failing E2E assertions**

  Criar `e2e/ad-inventory.spec.ts` cobrindo:
  - título da página e aviso de prévia;
  - 40 slots do mural e 30 slots das faixas;
  - CTA com href `/noticias/anunciar`;
  - presença de `overflow-x-auto`/comportamento rolável em viewport de 390px;
  - ausência de links externos e de botão de pagamento.

- [ ] **Step 8: Run E2E tests to verify failure, then fix**

  Run: `npx playwright test e2e/ad-inventory.spec.ts`

  Expected before implementation: FAIL por rota ausente; depois da implementação:
  PASS.

- [ ] **Step 9: Commit**

  ```powershell
  git add src/lib/ad-inventory.ts src/lib/__tests__/ad-inventory.test.ts src/components/ads/ad-inventory-preview.tsx src/app/anuncie/page.tsx src/app/sitemap.ts e2e/seo.spec.ts e2e/ad-inventory.spec.ts
  git commit -m "feat: adicionar prototipo de inventario publicitario"
  ```

### Task 6: Documentar configuração OAuth e validar a entrega completa

**Files:**
- Modify: `docs/setup.md`
- Modify: `docs/architecture.md`
- Modify: `docs/quality.md`

**Interfaces:**
- Consumes: os fluxos implementados nas Tasks 1–5.
- Produces: checklist manual para Google OAuth e registro dos gates executados; nenhuma alteração remota automática.

- [ ] **Step 1: Document the Supabase/Google checklist**

  Registrar em `docs/setup.md`:
  - ativação do Google em Supabase;
  - Client ID/Secret no provider;
  - callback `https://<project-ref>.supabase.co/auth/v1/callback` no Google;
  - URLs `http://localhost:3000/auth/callback` e produção no Supabase;
  - teste com e-mail/senha quando Google estiver indisponível;
  - proibição de salvar segredos em arquivos versionados.

- [ ] **Step 2: Document the single-account area rule**

  Registrar em `docs/architecture.md` que Música e Renda Extra usam uma conta
  única e que a área do cadastro é apenas contexto temporário nesta fase.

- [ ] **Step 3: Record validation commands**

  Atualizar `docs/quality.md` com:
  - `node --import tsx --test src/lib/auth/__tests__/return-intent.test.ts src/lib/auth/__tests__/errors.test.ts src/lib/__tests__/ad-inventory.test.ts`;
  - `npm run test:e2e`;
  - `npm run verify`;
  - warnings legados conhecidos, se permanecerem iguais.

- [ ] **Step 4: Run the complete validation**

  Run:

  ```powershell
  node --import tsx --test src/lib/auth/__tests__/return-intent.test.ts src/lib/auth/__tests__/errors.test.ts src/lib/__tests__/ad-inventory.test.ts
  npm run test:e2e
  npm run verify
  ```

  Expected: todos os testes passam; lint pode manter somente os 12 warnings
  preexistentes em `AntigoNKL/`; typecheck e build concluem sem erros.

- [ ] **Step 5: Review diff and stop before remote actions**

  Run: `git --no-pager diff --check` e `git status --short`.

  Confirmar que não houve migration aplicada, deploy, alteração remota ou
  segredo adicionado. Aguardar confirmação separada antes de qualquer ação
  externa.

