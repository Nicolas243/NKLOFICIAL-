# Setup e recuperação

## Comandos canônicos

```powershell
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run verify
npm run test:e2e
npm run hooks:enable
```

O servidor local padrão usa `http://localhost:3000`. Verifique `/api/health` quando a alteração envolver banco ou configuração.

`npm run hooks:enable` configura o Git local para usar `.githooks/pre-commit`,
que executa lint sem warnings e typecheck antes de cada commit. O hook não instala
dependências, não roda contra produção e pode ser revisado antes de habilitar em
outro clone.

Para ativar o checkout do IA na Prática, crie os dois Price IDs no Stripe e
preencha `AI_ONE_TIME_STRIPE_PRICE_ID` e `AI_SUBSCRIPTION_STRIPE_PRICE_ID` no
ambiente apropriado. A página pública permanece em modo informativo enquanto
esses IDs e os handlers de pagamento ainda não estiverem configurados; não use
preços enviados pelo navegador.

## Login com Google (configuração manual)

O Google OAuth depende de configuração no Supabase e no Google Cloud; não há
segredo no código ou em arquivos versionados. Quando o provedor estiver
indisponível, use e-mail e senha enquanto conclui esta checklist:

1. No Supabase, abra **Authentication > Providers > Google** e ative o provedor.
2. Crie ou selecione um OAuth Client no Google Cloud e informe o **Client ID** e
   o **Client Secret** nos campos do provider Google do Supabase.
   Use um cliente OAuth do tipo **Web application** aqui; o JSON **Desktop app**
   é destinado ao `gcloud auth application-default login` e não substitui o
   segredo exigido pelo Supabase.
3. No Google Cloud, adicione
   `https://<project-ref>.supabase.co/auth/v1/callback` aos redirect URIs autorizados.
4. No Supabase, em **Authentication > URL Configuration > Redirect URLs**, adicione
   `http://localhost:3000/auth/callback` e a URL equivalente de produção.
5. Teste o login com e-mail/senha e Google, inclusive o retorno ao Guia quando a
   compra exigiu autenticação.
6. Mantenha os segredos somente no `.env.local` ou no gerenciador de variáveis
   do ambiente. Nunca cole Client Secret, chaves Supabase ou tokens em commits,
   documentação pública, logs ou screenshots.

## Ambiente

- `.env.local` é local e contém segredos; nunca o exibir ou versionar.
- `.env.example` documenta nomes de variáveis, não valores.
- O worker MCP e a rede auxiliar exigem Node.js 22 ou superior e são
  destinados ao uso local via transporte stdio.
- A aplicação local usa `DATABASE_URL`, Supabase e outras integrações conforme a funcionalidade.
- O checkout sem login exige `GUEST_CHECKOUT_ENCRYPTION_KEY`; essa chave nunca deve ser
  trocada sem um plano de migração, porque impede descriptografar CPFs já registrados.
- Para testar recuperação local sem enviar e-mails, use `EMAIL_DELIVERY_MODE=preview`.
  Em produção, use `EMAIL_DELIVERY_MODE=resend`, `RESEND_API_KEY` e `EMAIL_FROM`.
- Os formulários públicos de material usam a mesma configuração Resend e enviam
  automaticamente o PDF musical ou de Renda Extra como anexo. Configure também
  `MATERIAL_ADMIN_EMAIL` para receber alertas após falhas definitivas.
- Verifique o domínio/remetente no Resend antes do teste real; o modo local não
  envia mensagens externas.
- A rota `/api/health/config` informa apenas se as variáveis obrigatórias estão configuradas, sem retornar valores secretos. Use-a depois do deploy para detectar drift de ambiente.
- Não executar migrações, seeds ou sincronizações contra produção sem autorização específica.

### Verificação do domínio no Resend

O vídeo de configuração confirma o fluxo correto para `nkloficial.com.br`.
Os registros devem ser copiados pelo botão **Copy** no painel do Resend e
criados no provedor DNS (Registro.br), sem alterar os valores:

1. No Resend, abra **Domains > nkloficial.com.br** e escolha a região mais
   próxima dos seus destinatários. A região `sa-east-1` já foi escolhida para
   este projeto.
2. No Registro.br, abra a zona DNS e adicione o TXT DKIM exibido pelo Resend,
   normalmente com o host `resend._domainkey`.
3. Adicione o MX `send` apontando para
   `feedback-smtp.sa-east-1.amazonses.com`, com prioridade `10`.
4. Adicione o TXT `send` com `v=spf1 include:amazonses.com ~all`.
   Se já existir um SPF no domínio, mantenha **um único** TXT SPF e una os
   mecanismos; não crie dois SPF diferentes.
5. Adicione o CNAME `rsend` apontando para `send.forge.rmta.net`.
6. Confira se já existe um TXT `_dmarc`. Se não existir, crie uma política
   inicial de monitoramento, por exemplo
   `v=DMARC1; p=none; rua=mailto:admin@example.com`. Substitua pelo endereço
   administrativo configurado no seu ambiente. Se já existir,
   não substitua a política sem revisar os demais remetentes do domínio.
7. Volte ao Resend, clique em **I've added the records** e aguarde a verificação.
   A propagação pode levar até 72 horas. O DNS Checker (`dns.email`) ajuda a
   localizar host, tipo ou valor incorretos.

O Resend recomenda separar envios transacionais em um subdomínio para isolar a
reputação de entrega. Isso é uma melhoria futura (por exemplo,
`mail.nkloficial.com.br`); não troque o domínio atual até configurar e verificar
o novo conjunto de registros. O remetente continua sendo
`noreply@nkloficial.com.br` enquanto esse domínio permanecer verificado.

### Rastreamento de cliques

O rastreamento de cliques foi ativado no Resend usando `track` como subdomínio.
No Registro.br, adicione:

```text
Tipo: CNAME
Nome: track
Valor: links2.resend-dns.com
```

Depois aguarde a propagação e confirme no Resend que o domínio voltou para
**verified**. O rastreamento de abertura permanece desligado porque clientes
modernos de e-mail podem gerar leituras artificiais; ele só deve ser ativado se
essa métrica for realmente necessária.

## Recuperação

1. pare apenas o processo local criado para a tarefa;
2. preserve o working tree e compare `git diff` antes de qualquer restauração;
3. consulte o backup da sessão se documentos de contexto precisarem ser recuperados;
4. reproduza o problema com o menor comando possível;
5. corrija a causa e repita o gate correspondente.

## Deploy

Deploy não faz parte do setup automático. Primeiro valide localmente, obtenha aprovação e só então execute o procedimento da plataforma com os segredos já configurados.

Para produção na Vercel:

1. Configure as variáveis de `.env.example` no projeto e no ambiente `Production`, sem colar segredos em commits ou logs.
2. Verifique `/api/health/config` e `/api/health` após o deploy.
3. Configure no Stripe o endpoint `/api/payments/stripe-webhook` e copie o
   signing secret para `STRIPE_WEBHOOK_SECRET`. Use o Stripe CLI para
   encaminhar eventos em desenvolvimento.
4. Configure `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente local e na Vercel. Essa chave é usada exclusivamente no servidor para ler o bucket privado e personalizar os arquivos em memória.
5. Confirme no Supabase o schema remoto antes de aplicar `drizzle/0032_guide_sales_offers.sql`, `drizzle/0033_guide_download_quota.sql` e `drizzle/0037_personalized_guide_assets.sql`; não execute `push` ou `migrate` cegamente.
6. Revise e aplique, somente após aprovação explícita, `drizzle/0038_guest_checkout_access.sql` e
   `drizzle/0039_guest_download_attempts.sql`. A primeira adiciona identidade/token convidado
   e a segunda cria a cota atômica de duas tentativas por material. Esta sessão não aplicou
   nenhuma migration remota.
7. Para `drizzle/0034_partner_affiliate_links.sql`, confirme primeiro o histórico remoto e os slugs `montink-embaixador`, `pawns-app`, `fiverr`, `attapoll`, `afiliados-b2b-tubebuddy-make` e `flambra`. Aplique o arquivo revisado uma única vez pelo fluxo aprovado de migrações (ou pelo SQL Editor autorizado quando esse for o procedimento do ambiente), sem alterar o arquivo para “forçar” uma segunda execução. Verifique com `SELECT slug, affiliate_url, updated_at FROM partner_programs WHERE slug IN (...);` e registre o resultado; esta tarefa não aplica a migração.
8. Depois de confirmar o schema, envie os cinco ativos pagos para o Storage privado com `npm run guides:upload`. O script procura primeiro em `Conteudo de novembro/` e depois na raiz para também localizar `Guia Essencial Renda Extra 2027 _ Portal NKL.pdf`; nenhum ativo deve ser copiado para `public/`.
9. Após o deploy, valide a compra sandbox, a página de sucesso, um download personalizado de cada ativo e o bloqueio na terceira tentativa do mesmo material. O CPF fica restrito ao banco e à marca visual do arquivo; nunca o envie em URLs, logs ou analytics.
10. Quando o código consultar os campos completos de `user_profiles`, confirme que a migração aditiva `drizzle/0040_restore_user_profile_columns.sql` foi aplicada no Supabase. Ela restaura os campos de onboarding, pagamentos e suspensão sem remover dados.
11. Para ativar o inventário publicitário, revise e aplique `drizzle/0042_ad_inventory.sql` uma única vez após confirmar o schema remoto. Configure `AD_PROMOTIONAL_PRICE_CENTS`, `AD_STANDARD_PRICE_CENTS` e `AD_PROMOTION_END_DATE` (por padrão, R$ 19,90 até 01/12/2026 e depois R$ 69,90), confirme que o bucket público `public-assets` existe e teste o webhook com `ad_campaign:*`. O anunciante usa `/programas/anuncie`, assina no Stripe, envia o criativo em `/programas/anuncie/sucesso` e a aprovação continua sendo manual no painel `/admin`, em “Materiais de anúncios aguardando sua análise”. `/anuncie` permanece como redirecionamento legado.

Durante o desenvolvimento local, `STRIPE_API_KEY` (preferencial; `STRIPE_SECRET_KEY`
continua aceito como fallback) e `STRIPE_WEBHOOK_SECRET` podem ficar
ausentes: as páginas públicas continuam carregando, e as rotas Stripe respondem
`503 stripe_not_configured` até que o checkout seja configurado. Para testar pagamentos,
preencha as duas variáveis com chaves de teste e use o Stripe CLI conforme abaixo.

## Setup do toolkit

O escopo aplicado e as decisões de compatibilidade estão em [docs/toolkit-setup.md](./toolkit-setup.md). A revisão consultada foi registrada para evitar misturar instruções de versões diferentes.
O MCP `portal-nkl-local` em `.vscode/mcp.json` inicia o worker local por stdio;
ele não abre listener HTTP. O servidor opcional de Clarity exige token informado
interativamente pelo host do MCP e não deve receber valores versionados.

## Stripe CLI

No Windows, instale e configure a CLI com:

```powershell
winget install --id Stripe.StripeCli --source winget
stripe login
stripe agent setup
stripe listen --forward-to http://localhost:3000/api/payments/stripe-webhook
```

Use o `whsec_...` exibido pelo `stripe listen` apenas no `.env.local` durante o desenvolvimento. Em produção, use o signing secret do endpoint configurado no Dashboard da Stripe.

## Fábrica local de vídeos

A ferramenta `nkl-video-factory` cria jobs locais sem publicar em nenhuma rede.
Ela usa `tools/nkl-video-factory.example.json` como modelo e salva cada run em
`workspace/video-factory/runs/<run-id>/`. Esse diretório é ignorado pelo Git.

Comandos locais:

```powershell
npm run video-factory -- doctor
npm run test:video-factory
npm run video-factory -- create --manifest tools/nkl-video-factory.example.json
npm run video-factory -- status
npm run video-factory -- approve --run <run-id> --by "<nome>"
npm run video-factory -- publish --run <run-id> --channel youtube --clip main --dry-run
```

O `doctor` verifica Node.js, `nlm`, FFmpeg, Chrome/Chromium e o workspace local.
A aprovação exige confirmação separada do conteúdo, do recorte e dos metadados.
O modo `publish` desta primeira versão aceita somente `--dry-run`; nenhum upload
real é implementado até configurar e validar o adaptador oficial do canal.
Não crie o manifest com cookies, tokens, CPF ou dados pessoais; mantenha essas
informações fora do repositório e dos logs.

### NotebookLM

Use o pacote unificado mantido:

```powershell
uv tool install notebooklm-mcp-cli
nlm login
nlm doctor
```

O login interativo abre o Chrome e exige uma conta Google separada para produção.
No Windows, credenciais protegidas podem ser ativadas com
`nlm auth storage set protected`. APIs internas do NotebookLM podem mudar sem
aviso; trate falhas como erro observável e não como sucesso da geração.

Os uploads oficiais serão implementados separadamente por adaptadores: YouTube
Data API v3 primeiro, Graph API do Facebook depois e Bilibili assistido até haver
um fluxo confiável. Os primeiros testes externos devem usar canais sandbox,
vídeos privados ou rascunhos, nunca publicação pública automática.

## Worker MCP e rede NKL

O comando `npm run deepseek:mcp` inicia o worker local pelo transporte MCP
stdio. O processo não abre listener HTTP; o host MCP deve iniciá-lo com o
diretório raiz deste repositório. O worker mantém o workspace fixo e só expõe
os leitores seguros de listagem e leitura de arquivos.

Para habilitar o modo direto com o `9router` (sem dependência do Cline), configure
em `.env.local` as variáveis `NINE_ROUTER_*` documentadas em `.env.example` (com
`NINE_ROUTER_BASE_URL=http://127.0.0.1:20128/v1`; variáveis `CLINE_*` não são
obrigatórias quando `NINE_ROUTER_*` está presente). O servidor MCP carrega
`.env.local` automaticamente a partir da raiz do repositório sem poluir o
`stdout`, conecta direto em `/v1/chat/completions` e `/v1/models` com `fetch()`
nativo, e expõe `ask_nkl_worker` (chamada única econômica em `NKL-OPERARIOS` ou
qualquer combo `NKL*` via `model`), `list_nkl_models` (lista modelos/combos do
9router) e `delegate_to_deepseek` (orquestração ou chamada única). `Alll` é
literal e é resolvido pelo gateway. Configuração parcial falha explicitamente,
sem fallback silencioso.

O fluxo executa entre um e três operários em paralelo (padrão `3`), respeita
`NINE_ROUTER_RETRY_LIMIT` (`0` ou `1`, padrão `1`) e marca o trabalho restante
como fallback do coordenador. A revisão é obrigatória; se o revisor não estiver
disponível, a resposta fica `incomplete`. Não há cache automático na primeira
versão.

Nenhum agente pode editar arquivos, executar shell/testes, acessar a web,
usar MCP externo, fazer deploy ou criar subagentes/equipes. Nunca coloque
valores de chaves, conteúdo de `.env.local` ou respostas de provedor em
prompts, logs, commits ou documentação.

Exemplo de registro MCP local com `stdout` limpo (evite `npm run` sem
`--silent`), sem segredos:

```json
{
  "mcpServers": {
    "portal-nkl-deepseek": {
      "command": "node",
      "args": [
        "C:\\caminho\\para\\portal-nkl\\node_modules\\tsx\\dist\\cli.mjs",
        "C:\\caminho\\para\\portal-nkl\\tools\\deepseek-mcp.ts"
      ]
    }
  }
}
```

Valide alterações com:

```powershell
npm run test:deepseek-mcp
```

## Sincronização cross-IDE (MCP, CLIs e extensões)

O manifesto canônico sem segredos [tools/ide-mcp-manifest.json](../tools/ide-mcp-manifest.json)
define os servidores MCP compartilhados do Portal NKL e seus alvos por IDE
(`vscode`, `mcp-json`, `cursor`, `antigravity`). A sincronização preserva
integralmente servidores já existentes em cada IDE (incluindo entradas globais
do usuário e tokens interativos exclusivos do VS Code, como `${input:clarity-api-token}`).

Comandos operacionais:

```powershell
npm run ide:sync        # mescla .vscode/mcp.json, .mcp.json, .cursor/mcp.json e ~/.gemini/config/mcp_config.json
npm run ide:doctor      # diagnostica CLIs globais/locais, arquivos MCP e extensões instaladas
npm run ide:extensions  # instala extensões recomendadas ausentes de .vscode/extensions.json
npm run test:ide-sync   # executa testes unitários do sincronizador
```

A continuidade de contexto e regras entre VS Code (GitHub Copilot),
Antigravity, Cursor e Claude Code é mantida em paralelo por `.ai-memory/`,
`.agents/skills/ai-memory-graph/`, `AGENTS.md`, `CLAUDE.md` e
`.github/copilot-instructions.md`. Plugins nativos do marketplace do
Antigravity (como Vercel e Supabase) continuam gerenciados dentro do próprio
Antigravity.
