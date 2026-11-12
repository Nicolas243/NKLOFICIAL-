# Qualidade

## Gates

| Gate | Comando | Critério |
|---|---|---|
| Lint | `npm run lint` | zero erros; warnings existentes devem ser acompanhados |
| Tipagem | `npm run typecheck` | TypeScript sem erros |
| Build | `npm run build` | build de produção concluído |
| E2E | `npm run test:e2e` | fluxos críticos passam ou falhas são atualizadas junto com o produto |
| Verificação combinada | `npm run verify` | lint, tipagem e build em sequência |

## Baseline registrado em 2026-11-04

- Release alvo: `0.2.0`.
- `npx tsc --noEmit`: passou.
- `npm run lint`: passou com 12 warnings preexistentes em `AntigoNKL/`; nenhum erro.
- `npm run build`: passou.
- `npm run test:e2e`: 2 testes passaram depois que os contratos foram alinhados à UI atual.
- `npm audit --omit=dev`: 0 vulnerabilidades.
- `manifest.webmanifest`: rota estática gerada e respondendo localmente com HTTP 200.
- Google Ads e Google Analytics: scripts presentes no layout global.
- `npm audit`: 20 vulnerabilidades moderadas transitivas apenas em dependências de desenvolvimento.
  - O reparo automático disponível exigiria downgrades incompatíveis de `drizzle-kit` e `eslint`.
  - `next` e `eslint-config-next` foram atualizados para `16.4.5`.
- Build local pode registrar falhas de consulta em diretórios sem banco configurado; as páginas mantêm o fallback e o build continua concluindo.

## Interface e acessibilidade

- O corpo base permanece em 16px CSS (com ampliação para 18px em viewports menores), sem depender de texto menor que 16px para conteúdo principal.
- Campos de formulário em telas pequenas usam 16px para evitar zoom automático no iOS e altura mínima de 44px para toque.
- A pizza radial mantém o texto recortado dentro da fatia, usa fundo opaco e move os símbolos musicais lentamente; ao ativar uma fatia, os símbolos podem ultrapassar visualmente a borda sem levar o texto junto.
- `prefers-reduced-motion` desativa a animação dos símbolos e reduz transições globais.
- Foco de teclado usa contorno visível com a cor de destaque.

## Prática de mudança

Para cada alteração, registre a reprodução, o arquivo afetado, a validação focada e o gate geral executado. Não silencie erros, não reduza cobertura para fazer o pipeline passar e não confunda warnings legados com validação completa.

## Autenticação e inventário publicitário — validação focada

- Testes unitários:
  `node --import tsx --test src/lib/auth/__tests__/return-intent.test.ts src/lib/auth/__tests__/errors.test.ts src/lib/__tests__/ad-inventory.test.ts`.
- E2E: `npm run test:e2e`, incluindo retorno do checkout ao login, contexto
  musical/Renda Extra, a rota `/anuncie`, sitemap e faixas roláveis em 390px.
- Gate completo: `npm run verify`.

## Checkout convidado e entrega personalizada — validação focada

- Testes unitários:
  `node --import tsx --test src/lib/__tests__/guest-guide-access.test.ts src/lib/__tests__/guest-guide-status.test.ts src/lib/email/resend.test.ts src/lib/stripe/guide.test.ts`.
- A rota de download deve aceitar somente token válido e pedido aprovado/assinatura ativa;
  cada material permite duas tentativas e a terceira deve retornar `403`.
- A recuperação por e-mail usa resposta genérica para e-mails existentes e inexistentes;
  em local o modo `preview` não faz chamadas externas.
- Nenhuma migration remota ou deploy foi executado nesta validação. Antes de produção,
  revisar `drizzle/0038_guest_checkout_access.sql` e `drizzle/0039_guest_download_attempts.sql`.
- A validação local pode emitir os avisos conhecidos de acesso dinâmico ao
  filesystem em `/api/downloads/guide` e de diretórios sem banco configurado.
  O lint global também mantém somente os 12 warnings legados em `AntigoNKL/`;
  nenhum desses avisos representa segredo, migration remota ou deploy.

## SEO de renda extra — validação focada

- `npx playwright test e2e/seo.spec.ts`: 3 testes passaram em 2026-11-09.
- A suíte verifica canonical, título, descrição, alias `/blog/renda-extra`, quatro hubs,
  URLs absolutas no sitemap e bloqueio das áreas privadas em `robots.txt`.
- O build continua emitindo apenas os avisos conhecidos de acesso dinâmico ao filesystem
  em `/api/downloads/guide` e de diretórios sem dados de lojas/professores.

## Campanha externa da rifa — validação focada

- Testes unitários: `npx tsx --test src/lib/rifa-campaign.test.ts` (5 testes).
- Lint focado: `npx eslint src/app/layout.tsx src/app/api/sales/offer-events/route.ts src/components/rifa-campaign src/lib/rifa-campaign.ts`.
- E2E: `npx playwright test e2e/rifa-campaign.spec.ts` cobre o card público, links externos seguros e exclusão da área de login.
- A campanha usa o experimento `rifa-livros` no endpoint existente de eventos e não aparece em rotas privadas/transacionais.

## Oportunidades — validação focada

- `npm run typecheck`: passou após a inclusão dos roteiros de primeiro saque e ações da página.
- `npx eslint src/lib/program-first-withdrawal.ts src/components/income/program-first-withdrawal.tsx src/components/income/program-actions.tsx src/lib/partner-strategies.ts src/components/income/program-strategies.tsx src/components/partner-programs-browser.tsx src/app/programas/[slug]/page.tsx src/components/video/social-embed.tsx src/components/pwa.tsx`: passou.
- `npm run build`: passou; permanecem os avisos conhecidos do endpoint de downloads e dos diretórios sem dados locais.
- `npx playwright test e2e/seo.spec.ts`: 3 testes passaram.
- Validação manual em desktop e viewport de 390px: a página individual mostra compartilhar,
  lembrete, instalação quando disponível e guia fechado; o catálogo inicial não mostra estratégias
  nem roteiro de saque.
- `.worktrees/**` é ignorado pelo ESLint porque contém cópias de trabalho e builds gerados, que não
  fazem parte do aplicativo publicado.
- O lint global mantém somente 12 warnings legados em `AntigoNKL/`, sem erros.
- Em 9 de novembro de 2026, `npm run verify` precisou ser repetido após essa correção; `npm run lint`,
  `npm run typecheck`, `npm run build` e `npx playwright test e2e/seo.spec.ts` passaram.

## Catálogo — densidade e contraste

- “Comece pela sua situação” usa `<details>` fechado por padrão para manter os cards próximos
  do cabeçalho sem esconder os hubs editoriais.
- O espaço reservado extra do cabeçalho foi removido; o catálogo começa mais cedo em desktop
  e mantém o espaçamento reduzido em mobile.
- O parallax do tema claro recebeu maior contraste em notas, linhas, partículas e pontos.
  O tema escuro mantém a intensidade anterior por meio de overrides específicos.
- A paleta foi dessaturada e aproximada de neutros em aproximadamente 25%, preservando
  contraste funcional para texto e controles.
- A instalação PWA é confirmada por `appinstalled`, modo standalone ou marcador local já existente;
  o botão e o lembrete deixam de aparecer após a confirmação, sem marcar instalação apenas por abrir o prompt.

## Catálogo — ordenação e CTAs

- `npx playwright test e2e/program-catalog.spec.ts`: cobre selo editorial antes da nota,
  tags sem expansor próprio, abertura do modal, persistência de variante, atribuição válida ou
  inválida, fallback quando a API responde 503 e checkout sem bloqueio.
- `npx playwright test e2e/program-catalog.spec.ts -g "experimento|evento"`: valida payloads
  inválidos, o evento `checkout` e a seleção limitada a `0|1|2`.
- O experimento `program-secondary-cta` não altera o card inicial nem declara vencedor com o
  volume atual; `conversion` só é escrito após confirmação de pagamento.
- O experimento `guide-page-cta` é isolado do CTA do catálogo, aceita somente as variantes `0..4`
  e mantém os preços e a semântica de pacote avulso/assinatura. A cobertura E2E em
  `e2e/guide-offer.spec.ts` valida as variantes explícitas `0` e `4`, fallback para atribuição
  inválida, os cinco materiais, os dois modos de acesso e a atribuição de checkout sem pagamento
  real. A comparação deve aguardar pelo menos 40 impressões por variante antes de interpretar
  impressão, clique, checkout e conversão.
- Os eventos de GA/PostHog dependem de consentimento aceito; falhas de telemetria são registradas
  no console e não impedem abrir o modal ou iniciar o checkout.
- A transparência de parceria na página `/programas` permanece recolhida por padrão e pode ser
  aberta por “Sobre links de parceria”.
- Durante o tutorial, clicar no elemento destacado encerra o tutorial sem impedir a ação original
  do elemento; o fluxo é coberto pelo teste E2E do catálogo.

## Catálogo — tutorial, compartilhamento e consentimento

- O tutorial sugere a abertura sem aplicar blur automaticamente; cada área usa estado local
  separado e o clique no alvo preserva a ação original.
- O compartilhamento usa a URL canônica da página e remove parâmetros de afiliado e rastreamento.
  O controle flutuante fica acima do botão do WhatsApp.
- O compartilhamento geral do catálogo aponta para a página editorial `/programas/[slug]`; os
  três projetos específicos do Alligner preservam seus URLs individuais de vaga.
- A página completa e o modal exibem “Como funciona e qual é o passo a passo?” com as etapas do
  guia prático abertas por padrão.
- Os eventos de funil só são enviados depois de `nkl_privacy_consent=accepted`; os layouts de
  renda extra não carregam um segundo Google Analytics.
- A árvore atual contém 33 famílias de páginas públicas, contando uma vez cada rota dinâmica e
  excluindo `admin`, `dashboard`, `perfil`, `checkout`, `api` e superfícies internas de autenticação.
- Após a migração do tutorial não bloqueante, `npm run test:e2e -- e2e/program-catalog.spec.ts`
  passou com 13 testes; 1 cenário Hotmart foi ignorado por credencial local ausente.

## Catálogo — onda de correções da atribuição (2026-11-09)

- `npx playwright test e2e/program-catalog.spec.ts --reporter=line`: 9 passaram e 1 foi ignorado porque `HOTMART_GUIDE_CHECKOUT_URL` não estava configurada no ambiente local; os testes existentes de atribuição, checkout, deduplicação de impressão, fallback 503 e eventos permaneceram ativos.
- `npx eslint` (`npm run lint`): passou com 12 warnings preexistentes em `AntigoNKL/`, sem erros.
- `npm run typecheck`: passou.
- `npm run build`: passou; permanecem os avisos conhecidos de acesso dinâmico ao filesystem em `/api/downloads/guide` e falhas de consulta de diretórios sem banco local.
- `npm run verify`: passou (lint, tipagem e build).
- A cobertura Hotmart valida `sck` somente para `program-secondary-cta:0|1|2`; a verificação de clique foi ignorada sem URL Hotmart local. O webhook lê `purchase.origin.sck`/`subscription.origin.sck` (com fallback direto `sck`) e não cria conversão para valores fora do contrato.

## Catálogo — oferta secundária e disclosure (2026-11-09)

- `npx playwright test e2e/program-catalog.spec.ts --reporter=line`: a execução inicial teve 13 testes passados e 1 ignorado porque `HOTMART_GUIDE_CHECKOUT_URL` não estava configurada no ambiente local. Duas repetições locais expuseram uma instabilidade preexistente: o tutorial e o aviso de privacidade ocasionalmente interceptam o clique do teste da página individual antes do timeout.
- `CI=1 npx playwright test e2e/program-catalog.spec.ts --reporter=line`: 13 testes passaram e 1 foi ignorado (o mesmo provedor Hotmart); as tentativas CI habilitadas concluíram a suíte.
- A suíte confirmou que a oferta secundária compacta aparece somente no modal e na página individual da oportunidade; os cards iniciais permanecem focados em descoberta.
- O disclosure de parceria usa `<details>` fechado por padrão e revela o texto legal somente após a ativação de “Sobre links de parceria”.
- O convite “Convidar no Buy Me a Coffee” aparece apenas na oportunidade correspondente, não no rodapé nem em uma oportunidade não relacionada.
- `npm run verify`: passou (lint, tipagem e build); permanecem os 12 warnings legados em `AntigoNKL/` e os avisos conhecidos de acesso dinâmico ao filesystem e diretórios sem dados locais.
- Deploy aprovado pelo usuário com `npx vercel --prod --yes`: `dpl_G8gynoBbqWQzx6PHD9PgNjzTwfNx`, estado `READY`, produção em `https://nkloficial.com.br`.
- Verificação HTTP pós-deploy: `/programas`, `/programas/monetizacao-atencao-web`, `/programas/mercado-pago` e `/guias/renda-extra` retornaram HTTP 200. O convite do Buy Me a Coffee apareceu somente na oportunidade correspondente e o resumo de parceria permaneceu disponível nas páginas de oportunidade.

## Guias personalizados — validação local

- `npx tsx --test` com variáveis locais fictícias: 41 testes passaram.
- `npm run lint`: passou com 12 warnings legados em `AntigoNKL/`.
- `npm run typecheck`: passou após regenerar os tipos `.next` que ainda apontavam para o handler Hotmart removido.
- `npm run build`: passou; permanecem apenas os avisos conhecidos de acesso ao filesystem local em `/api/downloads/guide`.
- A página local do guia exibiu CPF e consentimento após hidratação; o endpoint de download respondeu `401` sem sessão.
- A entrega agora é direta e personalizada: não retorna URL assinada, não usa Hotmart e não expõe CPF em URL, metadata Stripe ou analytics.

## Catálogo — compartilhamento e passo a passo (2026-11-10)

- `npx tsx --test src/lib/__tests__/share-url.test.ts`: 5 testes passaram, incluindo a
  preservação de URLs específicos dos projetos do Alligner.
- E2E focado: 2 testes passaram para o passo a passo da página completa e o compartilhamento
  canônico da oportunidade; o caminho específico do Alligner é coberto pelo teste unitário do
  destino.
- `npm run verify`: passou com os 12 warnings legados em `AntigoNKL/` e os avisos conhecidos
  de build.
- Deploy Vercel `dpl_DaZRjWAjHP2B4hzuat2tX7vHv9P5`: estado `READY`, produção em
  `https://nkloficial.com.br`.
- Smoke test pós-deploy: `/programas`, `/programas/aligner`, `/programas/mercado-pago` e
  `/api/health` retornaram HTTP 200. `/api/health/config` retornou 503 porque
  `SUPABASE_SERVICE_ROLE_KEY` está ausente no ambiente de produção; nenhum segredo foi alterado.
