# Auditoria estrutural do Portal NKL

## Módulos Operacionais (100% Integrados)

- Catálogo de cordas: [src/app/catalogo/page.tsx](./src/app/catalogo/page.tsx) consome `getStringsCatalog` em `src/actions/strings.ts:44`; o detalhe usa `getStringDetails`, favoritos e avaliações em [src/app/catalogo/[id]/page.tsx](./src/app/catalogo/[id]/page.tsx).
- Comparação de cordas: [src/app/comparar/page.tsx](./src/app/comparar/page.tsx) consulta o catálogo persistido em `src/actions/strings.ts:44`, sem array de dados de domínio no frontend.
- Diretórios B2B: [src/app/luthiers/page.tsx](./src/app/luthiers/page.tsx), [src/app/lojas/page.tsx](./src/app/lojas/page.tsx) e [src/app/professores/page.tsx](./src/app/professores/page.tsx) usam as consultas de `src/actions/directory.ts:74`, `src/actions/directory.ts:85` e `src/actions/directory.ts:112`, com favoritos reais.
- Notícias e engajamento: [src/app/noticias/page.tsx](./src/app/noticias/page.tsx) usa `getNewsFeed`, comentários e likes de `src/actions/news.ts:67`, `src/actions/news.ts:115` e `src/actions/news.ts:161`.
- Perfil, avaliações, notificações e privacidade: [src/app/perfil/page.tsx](./src/app/perfil/page.tsx), [src/app/perfil/avaliacoes/page.tsx](./src/app/perfil/avaliacoes/page.tsx), [src/app/perfil/notificacoes/page.tsx](./src/app/perfil/notificacoes/page.tsx) e [src/app/perfil/privacidade/page.tsx](./src/app/perfil/privacidade/page.tsx) estão ligados às respectivas Server Actions.
- Identidade: `registerWithProfile` usa estritamente o UID retornado por `supabase.auth.signUp` em `src/actions/auth.ts:155-165` e persiste o perfil pelo mesmo identificador.
- LGPD: `deleteUserAccount` executa as remoções dependentes em `db.transaction` em `src/actions/compliance.ts:82-123`; a anonimização é apenas fallback explícito.
- Webhook: a rota [src/app/api/webhooks/gateway/route.ts](./src/app/api/webhooks/gateway/route.ts) calcula HMAC SHA-256 em `src/app/api/webhooks/gateway/route.ts:55-61` e compara com `timingSafeEqual` em `src/app/api/webhooks/gateway/route.ts:37-42`.
- Validação final: `npx tsc --noEmit`, `npx eslint src/ --max-warnings=0` e `npm run build` concluíram sem erros.

## Correções e Conexões Executadas

- [.gitignore](./.gitignore:30): adicionados `equipe_nkl.py`, `nul`, arquivos `.txt` e atalhos `.lnk` soltos na raiz ao ignore. O arquivo Python continha uma chave literal exposta e não foi incluído no staging.
- [src/components/theme-provider.tsx](./src/components/theme-provider.tsx:46): substituída a atualização síncrona de estado dentro do efeito por `React.startTransition`, removendo a falha `react-hooks/set-state-in-effect` sem alterar a resolução de tema, persistência ou classes do documento.
- Alterações existentes em outros arquivos do worktree foram preservadas e não foram incorporadas a esta auditoria.

## Gargalos e Lacunas de Integração

- [src/app/comparador/page.tsx](./src/app/comparador/page.tsx:1) e [src/app/comparar/page.tsx](./src/app/comparar/page.tsx:68) representam duas implementações de comparação. A navegação principal aponta para `/comparar` em [src/components/header.tsx](./src/components/header.tsx:16) e [src/components/radial-menu.tsx](./src/components/radial-menu.tsx:35); a rota `/comparador` continua acessível, mas sua política de compatibilidade não está definida.
- [src/app/lojas/page.tsx](./src/app/lojas/page.tsx:43) e [src/app/professores/page.tsx](./src/app/professores/page.tsx:105) exibem estado vazio porque dependem de registros no diretório; seeds operacionais não foram inventados.
- [src/app/importacao/page.tsx](./src/app/importacao/page.tsx:1) e [src/app/clinica/page.tsx](./src/app/clinica/page.tsx:1) são superfícies predominantemente informativas, sem fluxo de persistência identificado.
- A variável `WEBHOOK_SECRET` está documentada em [.env.example](./.env.example:8), mas o fallback `GATEWAY_WEBHOOK_SECRET` também é aceito em [src/app/api/webhooks/gateway/route.ts](./src/app/api/webhooks/gateway/route.ts:9); a duplicidade deve ser reduzida quando o gateway canônico for escolhido.
- O webhook aceita payload sem assinatura apenas fora de produção em [src/app/api/webhooks/gateway/route.ts](./src/app/api/webhooks/gateway/route.ts:70-76); ambientes de homologação precisam definir se devem ter a mesma exigência de assinatura.

## Decisões Arquiteturais Pendentes (Ação Humana Exigida)

- Escolher `/comparar` ou `/comparador` como rota canônica e definir redirecionamento ou remoção da outra implementação.
- Confirmar quais tabelas de diretório devem receber dados iniciais e por qual processo autorizado de seed, especialmente lojas e professores.
- Definir o gateway de pagamentos oficial e manter apenas um nome de segredo (`WEBHOOK_SECRET` ou `GATEWAY_WEBHOOK_SECRET`), além do contrato definitivo do payload.
- Definir o provedor de Storage e a política de retenção para imagens de notícias; o upload atual depende da configuração do bucket usada por `src/actions/news.ts:39-52`.
- Confirmar a política de confirmação de e-mail e auto-login do cadastro em `src/actions/auth.ts:170-183`.
