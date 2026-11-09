# Relatório final — correções do CTA do catálogo

Data: 2026-11-09

## Alterações entregues

1. **Hotmart avulso**
   - `HotmartCheckoutLink` agora registra `checkout` pelo helper existente e recebe somente uma atribuição validada.
   - Para `program-secondary-cta:0|1|2`, o link Hotmart leva o mesmo valor no parâmetro `sck`. Um `sck` preexistente é substituído pelo valor validado, evitando atribuição arbitrária.
   - O componente é reutilizado no seletor de provedor do checkout avulso e da assinatura, sem bloquear a navegação.

2. **Webhook Hotmart**
   - O webhook lê `purchase.origin.sck`/`subscription.origin.sck` e o fallback direto `sck`.
   - Apenas `program-secondary-cta:0|1|2` é aceito; valores desconhecidos não são persistidos nem geram conversão.
   - A atribuição validada é persistida em `guide_purchases.offer_variant` ou `guide_subscriptions.offer_variant` antes da inserção idempotente de `guide_offer_events` com `eventType=conversion`.
   - Não foi necessária alteração de schema: as colunas existentes suportam o contrato. A atribuição depende de a Hotmart devolver `sck` no payload; se a conta/produto não o ecoar, a conversão fica sem variante por segurança.

3. **Hierarquia de ofertas**
   - `/guias/renda-extra` voltou a apresentar o pagamento único como oferta principal e a assinatura como “Alternativa mensal”.
   - A atribuição CTA continua sendo propagada para ambos os caminhos sem alterar preço ou ênfase comercial.

4. **Fallback de variante**
   - `ProgramSecondaryOffer` usa `AbortController` com timeout de 5 segundos.
   - Timeout, erro HTTP ou payload inválido executam o fallback local e não deixam o modal aguardando indefinidamente.

5. **Validação de atribuição**
   - Os endpoints de criação de checkout avulso/assinatura agora rejeitam `offerVariant` fora do contrato validado.
   - Webhooks Mercado Pago também normalizam a atribuição antes de criar conversões.
   - O rate limit público permanece depois da validação do payload: requisições inválidas continuam retornando `400` sem consumir a cota; eventos válidos continuam protegidos pelo limite existente.

6. **Migração**
   - `docs/setup.md` e `docs/architecture.md` documentam a verificação remota, os seis slugs, a aplicação única pelo fluxo aprovado e a consulta posterior para `drizzle/0034_partner_affiliate_links.sql`.
   - Nenhuma migração, seed ou dado de produção foi aplicado.

## Evidências de teste

- `npx playwright test e2e/program-catalog.spec.ts --reporter=line`: **9 passaram, 1 ignorado**. O caso Hotmart foi ignorado porque `HOTMART_GUIDE_CHECKOUT_URL` não estava configurada no ambiente local; os testes de persistência, atribuição válida/inválida, checkout, fallback 503, deduplicação de impressão e validação de eventos passaram.
- `npm run lint`: **passou**, com 12 warnings preexistentes em `AntigoNKL/` e zero erros.
- `npm run typecheck`: **passou**.
- `npm run build`: **passou**. Permanecem os avisos conhecidos de acesso dinâmico ao filesystem em `/api/downloads/guide` e falhas de consulta de diretórios quando o banco local não está disponível.
- `npm run verify`: **passou** (lint, tipagem e build).
- `git diff --check`: **passou**.

## Limitações e preocupações

- Não foi possível executar um checkout Hotmart real nem confirmar um payload de produção sem credenciais/configuração; a cobertura local valida o contrato do link quando a URL está configurada e o código rejeita qualquer variante não validada.
- O teste e2e de Hotmart permanece preparado para rodar automaticamente quando `HOTMART_GUIDE_CHECKOUT_URL` estiver disponível.
- A atribuição de conversão Hotmart requer que `sck` seja preservado pelo produto e retornado nos caminhos documentados do webhook. Sem esse dado, o sistema deliberadamente não tenta inferir a variante.
