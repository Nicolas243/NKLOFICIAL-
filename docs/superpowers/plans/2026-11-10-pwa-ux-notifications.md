# PWA, UX contextual e notificações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar a instalação, navegação contextual e notificações do Portal NKL confiáveis em mobile e desktop, sem sobreposições e sem depender de um navegador específico.

**Architecture:** Extrair a detecção de instalação para helpers testáveis e compartilhar o estado entre botão e lembrete. Modelar tutoriais por rota e notificações com persistência server-side, deixando Push API como uma camada opcional sobre a central interna. Reutilizar os componentes e estilos existentes, sem introduzir uma biblioteca de PWA.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, Drizzle ORM, Supabase SSR, Vitest/Node test runner e Playwright.

**Spec:** `docs/superpowers/specs/2026-11-10-pwa-ux-notifications-design.md`

## Global Constraints

- “Não prometer instalação silenciosa em navegadores que não suportam o prompt.”
- “Não publicar migrações, configurar produção ou fazer deploy antes de validação local e autorização explícita no momento do deploy.”
- “Não enviar notificações promocionais sem consentimento e sem opção de desligar.”
- “Sem VAPID configurado, a central interna continua funcionando.”
- Preservar Next.js 16, React, Drizzle, Supabase e Tailwind existentes.
- Não registrar segredos, tokens, subscriptions ou dados pessoais em analytics.

## Review Focus

- Prompt nativo consumido ou recusado: o botão deve permanecer recuperável e não abrir prompts duplicados.
- Safari/iOS, Firefox e navegadores Chromium sem `beforeinstallprompt`: deve existir fallback específico e acionável.
- Rotas dinâmicas e páginas sem alvo visível: o tutorial deve usar a chave correta e pular apenas etapas indisponíveis.
- Dois overlays abertos simultaneamente: somente um deve bloquear foco e scroll do documento.
- Push sem VAPID, permissão negada ou subscription expirada: a central interna deve continuar funcionando e o erro deve ser visível.

---

### Task 1: Estado de instalação multiplataforma

**Files:**
- Create: `src/lib/pwa/install-state.ts`
- Create: `src/lib/pwa/__tests__/install-state.test.ts`
- Modify: `src/components/pwa.tsx`
- Test: `src/lib/pwa/__tests__/install-state.test.ts`

**Interfaces:**
- Produces `detectInstallPlatform(userAgent: string, isStandalone: boolean): InstallPlatform`
- Produces `getInstallInstructions(platform: InstallPlatform, appName: string): string[]`
- Produces `getInstallAction(state: InstallCapabilities): 'native-prompt' | 'instructions' | 'hidden'`

- [ ] **Step 1: Write failing tests** para iOS Safari/iPadOS, macOS Safari, Firefox, Chromium com prompt, standalone e navegador sem prompt.
- [ ] **Step 2: Run `npm test -- src/lib/pwa/__tests__/install-state.test.ts`** e confirmar falha pelas funções ausentes.
- [ ] **Step 3: Implementar os tipos e helpers em `src/lib/pwa/install-state.ts`**, sem acessar `window` dentro dos helpers.
- [ ] **Step 4: Refatorar `useInstallState` e `PwaInstallButton`** para usar os helpers, manter um único estado compartilhado por `kind`, mostrar fallback para todo navegador elegível e marcar instalação em `appinstalled`/standalone.
- [ ] **Step 5: Adicionar telemetria anônima e tolerante a falhas** para exposição, clique, aceite, recusa e instruções, reaproveitando o mecanismo analytics existente.
- [ ] **Step 6: Rodar os testes focados e `npm run typecheck`**; esperado: todos passam sem novos erros.
- [ ] **Step 7: Commitar** com `feat: improve cross-browser app installation`.

### Task 2: Overlays, rodapé de apoio e scrollbar

**Files:**
- Modify: `src/components/pwa.tsx`
- Modify: `src/components/footer.tsx`
- Modify: `src/components/header.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/ui/__tests__/support-layout.test.tsx`

**Interfaces:**
- Produces a single overlay ownership convention: opening an install, Pix, share or tutorial surface closes conflicting surfaces.
- Produces reusable CSS utility for hidden horizontal scrollbar while retaining `overflow-x: auto`.

- [ ] **Step 1: Write component/style tests** cobrindo três links de apoio com largura suficiente, quebra em largura estreita e classe de scrollbar sem `overflow-x: hidden`.
- [ ] **Step 2: Implementar o layout de apoio** com itens flexíveis, `flex-wrap`, `min-width: 0` e largura natural; não alterar URLs nem o fluxo do Pix.
- [ ] **Step 3: Centralizar a regra de overlay ativo** no nível global apropriado, garantindo Escape, clique fora, foco e scroll lock sem dois modais concorrentes.
- [ ] **Step 4: Aplicar a classe de scrollbar oculto** aos contêineres de tags encontrados, incluindo Firefox, WebKit e Edge legado.
- [ ] **Step 5: Validar com teste focado, `npm run typecheck` e snapshot/checagem visual local**; esperado: nenhum controle sobreposto nos breakpoints mobile e desktop.
- [ ] **Step 6: Commitar** com `fix: stabilize responsive support and overlay layouts`.

### Task 3: Guia rápido por rota

**Files:**
- Modify: `src/lib/tutorial-areas.ts`
- Modify: `src/components/ui/spotlight-tutorial.tsx`
- Modify: `src/components/header.tsx`
- Create: `src/lib/__tests__/tutorial-areas.test.ts`

**Interfaces:**
- Produces `TutorialRoute = { key: string; area: TutorialArea; steps: TutorialStep[] }`.
- `getTutorialRoute(pathname: string): TutorialRoute | null` normalizes route parameters and falls back to the portal area.
- `getTutorialSuggestionKey(routeKey: string): string` returns a per-route storage key.

- [ ] **Step 1: Write failing tests** para home, catálogo, notícia dinâmica, páginas de renda extra, rota desconhecida e sugestões independentes por rota.
- [ ] **Step 2: Run `npm test -- src/lib/__tests__/tutorial-areas.test.ts`** e confirmar falha.
- [ ] **Step 3: Expandir o catálogo de rotas e tutoriais**, preservando fallback para música/renda e incluindo passos somente para seletores existentes.
- [ ] **Step 4: Atualizar `SpotlightTutorial`** para salvar e consultar a rota normalizada, mostrar a sugestão junto ao controle do guia e permitir reabertura manual.
- [ ] **Step 5: Corrigir o controle do header** para manter o texto “Guia rápido” disponível quando houver espaço e acessível por aria-label quando colapsado.
- [ ] **Step 6: Rodar testes focados e `npm run typecheck`**; esperado: concluir uma página não oculta o tutorial das demais.
- [ ] **Step 7: Commitar** com `feat: add route-aware quick guides`.

### Task 4: Central interna de notificações

**Files:**
- Modify: `src/db/schema.ts`
- Create: `drizzle/XXXX_notifications.sql`
- Create: `src/actions/notifications.ts`
- Create: `src/app/api/notifications/route.ts`
- Create: `src/components/notifications/notification-center.tsx`
- Create: `src/lib/notifications/types.ts`
- Create: `src/lib/notifications/__tests__/notifications.test.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- `NotificationRecord = { id: string; userId: string; title: string; body: string; href: string | null; readAt: Date | null; createdAt: Date }`.
- `listNotifications(userId: string): Promise<NotificationRecord[]>`.
- `markNotificationRead(userId: string, notificationId: string): Promise<void>`.
- `createNotification(input: CreateNotificationInput): Promise<NotificationRecord>`.

- [ ] **Step 1: Escrever testes falhando** para listar somente notificações do usuário, marcar leitura idempotentemente e rejeitar usuário ausente.
- [ ] **Step 2: Implementar tabela/migração Drizzle** com índices para `(user_id, created_at)` e `(user_id, read_at)`, sem executar migração remota.
- [ ] **Step 3: Implementar ações server-side** com autenticação Supabase e validação de payload; erros devem ser explícitos e não retornar sucesso falso.
- [ ] **Step 4: Implementar API e `NotificationCenter`** com estado vazio, contador de não lidas, marcação de leitura, links internos e opção de desligar push.
- [ ] **Step 5: Montar a central no layout sem sobrepor os demais menus** e registrar eventos anônimos de abertura e leitura.
- [ ] **Step 6: Rodar testes focados, typecheck e migração em banco local/teste quando disponível**; esperado: central funciona sem push.
- [ ] **Step 7: Commitar** com `feat: add in-app notification center`.

### Task 5: Push API opcional e service worker

**Files:**
- Create: `src/lib/notifications/push.ts`
- Create: `src/app/api/notifications/push/subscribe/route.ts`
- Create: `src/app/api/notifications/push/unsubscribe/route.ts`
- Modify: `public/sw.js`
- Modify: `src/components/notifications/notification-center.tsx`
- Create: `src/lib/notifications/__tests__/push.test.ts`

**Interfaces:**
- `getPushConfiguration(): { enabled: boolean; publicKey: string | null }`.
- `savePushSubscription(userId: string, subscription: PushSubscriptionJSON): Promise<void>`.
- `removePushSubscription(userId: string, endpoint: string): Promise<void>`.

- [ ] **Step 1: Escrever testes falhando** para VAPID ausente, payload inválido, permissão negada e endpoint idempotente.
- [ ] **Step 2: Implementar configuração somente server/client-public**; chave privada jamais deve ser importada em componente client.
- [ ] **Step 3: Adicionar rotas autenticadas de inscrição/remoção** com validação de endpoint e chaves.
- [ ] **Step 4: Atualizar `sw.js`** para exibir payloads de push e abrir links permitidos no mesmo domínio; ignorar payload inválido com log controlado.
- [ ] **Step 5: Integrar consentimento explícito na central** e manter a central interna quando Push não estiver habilitado.
- [ ] **Step 6: Rodar testes focados, typecheck e `npm run verify`**; esperado: build funciona mesmo sem variáveis VAPID.
- [ ] **Step 7: Commitar** com `feat: add optional web push notifications`.

### Task 6: Verificação integrada e deploy autorizado

**Files:**
- Modify: `docs/quality.md` only if a new baseline limitation is discovered.
- Test: existing E2E suite and production smoke checks.

- [ ] **Step 1: Rodar testes focados de PWA, tutorial, layout e notificações** em um único comando compatível com o runner do projeto.
- [ ] **Step 2: Rodar `npm run typecheck` e `npm run verify`**; corrigir somente regressões causadas por esta entrega.
- [ ] **Step 3: Rodar `npm run test:e2e`** para login, instalação/fallback, menus, tutorial e central.
- [ ] **Step 4: Conferir analytics por navegador e eventos**, sem imprimir ou salvar credenciais.
- [ ] **Step 5: Solicitar confirmação explícita do deploy** se qualquer variável VAPID ou migração remota for necessária.
- [ ] **Step 6: Fazer deploy somente após confirmação**, acompanhar build e validar `/`, `/login`, `/api/health`, instalação e notificações em produção.
- [ ] **Step 7: Registrar o resultado do deploy e qualquer passo manual restante** para o usuário.

