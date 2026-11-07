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
```

O servidor local padrão usa `http://localhost:3000`. Verifique `/api/health` quando a alteração envolver banco ou configuração.

## Ambiente

- `.env.local` é local e contém segredos; nunca o exibir ou versionar.
- `.env.example` documenta nomes de variáveis, não valores.
- A aplicação local usa `DATABASE_URL`, Supabase e outras integrações conforme a funcionalidade.
- A rota `/api/health/config` informa apenas se as variáveis obrigatórias estão configuradas, sem retornar valores secretos. Use-a depois do deploy para detectar drift de ambiente.
- Não executar migrações, seeds ou sincronizações contra produção sem autorização específica.

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
3. Configure no Mercado Pago o webhook de pagamento único em `/api/payments/webhook` e o webhook de assinaturas em `/api/payments/subscription-webhook`.
4. Confirme no Supabase o schema remoto antes de aplicar `drizzle/0032_guide_sales_offers.sql`; não execute `push` ou `migrate` cegamente.

## Setup do toolkit

O escopo aplicado e as decisões de compatibilidade estão em [docs/toolkit-setup.md](./toolkit-setup.md). A revisão consultada foi registrada para evitar misturar instruções de versões diferentes.
