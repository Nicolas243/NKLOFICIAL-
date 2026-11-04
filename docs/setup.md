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
- Não executar migrações, seeds ou sincronizações contra produção sem autorização específica.

## Recuperação

1. pare apenas o processo local criado para a tarefa;
2. preserve o working tree e compare `git diff` antes de qualquer restauração;
3. consulte o backup da sessão se documentos de contexto precisarem ser recuperados;
4. reproduza o problema com o menor comando possível;
5. corrija a causa e repita o gate correspondente.

## Deploy

Deploy não faz parte do setup automático. Primeiro valide localmente, obtenha aprovação e só então execute o procedimento da plataforma com os segredos já configurados.

## Setup do toolkit

O escopo aplicado e as decisões de compatibilidade estão em [docs/toolkit-setup.md](./toolkit-setup.md). A revisão consultada foi registrada para evitar misturar instruções de versões diferentes.
