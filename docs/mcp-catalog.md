# Catálogo de MCPs do Portal NKL

Este catálogo registra integrações disponíveis sem ativá-las automaticamente.
Toda ativação deve ser específica da tarefa e aprovada antes de consultas remotas,
mudanças de dados, deploy, migração ou ações administrativas.

## Servidores locais do workspace

| MCP | Uso permitido | Estado padrão | Ativação |
|---|---|---|---|
| `portal-nkl-local` | análise read-only limitada ao workspace | desativado | reativar explicitamente em `.vscode/mcp.json` e iniciar apenas para delegação focada |
| `microsoft-clarity` | consulta da API do Clarity com dados de analytics | desativado | reativar apenas em tarefa que exija métricas, com consentimento e token local |

Os servidores locais não ficam registrados em `.vscode/mcp.json` por padrão.
Não adicione tokens ou variáveis secretas aos arquivos versionados.

## Integrações externas sob demanda

Ative somente a integração necessária:

- **GitHub:** issues, PRs, commits e arquivos remotos;
- **Supabase:** leitura de projeto, tabelas ou logs; migrações somente após aprovação;
- **Stripe/Resend:** somente em tarefas sobre pagamentos ou email, com verificação em sandbox/local;
- **Vercel:** leitura ou operação de deploy somente após aprovação explícita;
- **Figma:** contexto visual ou assets somente em tarefas de UI;
- **Playwright/Chrome DevTools:** validação visual, navegação ou E2E;
- **PostHog/Google Analytics:** métricas somente após definir pergunta e período;
- **BigQuery/Cloud:** consultas específicas em tarefas de dados;
- **Pylance:** análise Python quando o arquivo alvo usar Python;
- **Computer Use:** UI desktop somente quando ferramentas de arquivo, terminal ou
  navegador não forem suficientes.

## Procedimento

1. Identifique o menor MCP necessário.
2. Confirme que a ferramenta nativa não resolve a tarefa.
3. Informe ao usuário a integração que será usada e o motivo.
4. Solicite autorização para operações com acesso remoto ou escrita.
5. Desative o servidor imediatamente depois de concluir a tarefa.
6. Registre somente o resultado necessário, sem secretos ou dados pessoais.
