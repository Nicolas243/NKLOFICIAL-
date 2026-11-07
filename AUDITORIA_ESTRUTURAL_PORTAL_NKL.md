# Auditoria estrutural do Portal NKL

## Módulos Operacionais (100% Integrados)

- Catálogo de cordas: [src/app/catalogo/page.tsx](./src/app/catalogo/page.tsx) consome `getStringsCatalog` em `src/actions/strings.ts:44`; o detalhe usa `getStringDetails`, favoritos e avaliações em [src/app/catalogo/[id]/page.tsx](./src/app/catalogo/[id]/page.tsx).
- Comparação de cordas: [src/app/comparar/page.tsx](./src/app/comparar/page.tsx) consulta o catálogo persistido em `src/actions/strings.ts:44`, sem array de dados de domínio no frontend.
- Diretórios B2B: [src/app/luthiers/page.tsx](./src/app/luthiers/page.tsx), [src/app/lojas/page.tsx](./src/app/lojas/page.tsx) e [src/app/professores/page.tsx](./src/app/professores/page.tsx) usam as consultas de `src/actions/directory.ts:74`, `src/actions/directory.ts:85` e `src/actions/directory.ts:112`, com favoritos reais.
- Notícias e engajamento: [src/app/noticias/page.tsx](./src/app/noticias/page.tsx) usa `getNewsFeed`, comentários e likes de `src/actions/news.ts:67`, `src/actions/news.ts:115` e `src/actions/news.ts:161`.
- Perfil, avaliações, notificações e privacidade: [src/app/perfil/page.tsx](./src/app/perfil/page.tsx), [src/app/perfil/avaliacoes/page.tsx](./src/app/perfil/avaliacoes/page.tsx), [src/app/perfil/notificacoes/page.tsx](./src/app/perfil/notificacoes/page.tsx) e [src/app/perfil/privacidade/page.tsx](./src/app/perfil/privacidade/page.tsx) estão ligados às respectivas Server Actions.
- Identidade: `registerWithProfile` usa estritamente o UID retornado por `supabase.auth.signUp` em `src/actions/auth.ts:155-165` e persiste o perfil pelo mesmo identificador.
- LGPD: `deleteUserAccount` executa as remoções dependentes em `db.transaction` em `src/actions/compliance.ts:82-123`; a anonimização é apenas fallback explícito.
- Webhook: a rota [src/app/api/webhooks/gateway/route.ts](./src/app/api/webhooks/gateway/route.ts) calcula HMAC SHA-256 em `src/app/api/webhooks/gateway/route.ts:64-68` e compara com `timingSafeEqual` em `src/app/api/webhooks/gateway/route.ts:37-43`.
- Validação final: `npx tsc --noEmit`, `npx eslint src/ --max-warnings=0` e `npm run build` concluíram sem erros.

## Auditoria de nomenclatura e preparação da expansão

- `/programas` foi definido como catálogo canônico de Renda Extra.
- `/blog/renda-extra` permanece como alias compatível; sua canonical aponta para `/programas`.
- `/guias/renda-extra` é a superfície comercial do Guia Definitivo e tem canonical própria.
- `src/lib/income-portal.ts` centraliza rotas e reconhecimento de contexto para evitar divergência entre Header, PWA, analytics, tema, rodapé e tutorial.
- Componentes específicos de Renda Extra foram agrupados em `src/components/income/`; checkout e oferta ficam em `src/components/sales/`.
- O componente legado `income-wizard-banner.tsx`, o cliente duplicado do comparador, o backup `profile.ts.bak` e dumps de inspeção do navegador foram removidos por não possuírem referências de runtime.
- A árvore futura deve preservar nomes ASCII, uma rota canônica por produto e aliases somente no proxy ou em redirects explícitos.

## Correções e Conexões Executadas

- [.gitignore](./.gitignore:30): adicionados `equipe_nkl.py`, `nul`, arquivos `.txt` e atalhos `.lnk` soltos na raiz ao ignore. O arquivo Python continha uma chave literal exposta e não foi incluído no staging.
- [src/components/theme-provider.tsx](./src/components/theme-provider.tsx:46): substituída a atualização síncrona de estado dentro do efeito por `React.startTransition`, removendo a falha `react-hooks/set-state-in-effect` sem alterar a resolução de tema, persistência ou classes do documento.
- Alterações existentes em outros arquivos do worktree foram preservadas e não foram incorporadas a esta auditoria.

## Gargalos e Lacunas de Integração

- A rota legada `/comparador` agora redireciona permanentemente para `/comparar` via [next.config.ts](./next.config.ts:48); a navegação principal já aponta para `/comparar` em [src/components/header.tsx](./src/components/header.tsx:16) e [src/components/radial-menu.tsx](./src/components/radial-menu.tsx:35).
- [src/app/lojas/page.tsx](./src/app/lojas/page.tsx:43) e [src/app/professores/page.tsx](./src/app/professores/page.tsx:105) exibem estado vazio porque dependem de registros no diretório; seeds operacionais não foram inventados.
- [src/app/importacao/page.tsx](./src/app/importacao/page.tsx:1) e [src/app/clinica/page.tsx](./src/app/clinica/page.tsx:1) são superfícies predominantemente informativas, sem fluxo de persistência identificado.
- O webhook agora exige `WEBHOOK_SECRET` e assinatura HMAC em todos os ambientes em [src/app/api/webhooks/gateway/route.ts](./src/app/api/webhooks/gateway/route.ts:51-70); configuração ausente ou assinatura ausente retorna HTTP 401.

## Decisões Arquiteturais Pendentes (Ação Humana Exigida)

- A rota canônica é `/comparar`; `/comparador` deve ser mantida apenas como compatibilidade histórica enquanto métricas e links externos forem monitorados.
- Confirmar quais tabelas de diretório devem receber dados iniciais e por qual processo autorizado de seed, especialmente lojas e professores.
- Definir o gateway de pagamentos oficial e o contrato definitivo do payload; `startPremiumCheckout` ainda é explicitamente simulado em [src/actions/subscriptions.ts](./src/actions/subscriptions.ts:14).
- Definir o provedor de Storage e a política de retenção para imagens de notícias; o upload atual depende da configuração do bucket usada por `src/actions/news.ts:39-52`.
- A política atual exige confirmação quando `signUp` não retorna sessão; o estado explícito está em [src/actions/auth.ts](./src/actions/auth.ts:178-184).
