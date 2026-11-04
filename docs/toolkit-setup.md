# Adoção seletiva do Vibe Coding Toolkit

## Evidência da fonte

- Repositório: `soumatheusgomes/vibe-coding-toolkit`
- Revisão consultada: `21b71b68679c11184f49c23168852014bf6dde8b`
- Aplicação: setup seletivo compatível com o Portal NKL
- Data da verificação: 2026-11-04

## Matriz de cobertura

| Componente | Estado | Ação nesta aplicação | Validação |
|---|---|---|---|
| Contexto de produto | aplicado | `PRODUCT.md` | links e fluxos críticos documentados |
| Arquitetura | aplicado | `docs/architecture.md` | fronteiras e integrações registradas |
| Design | aplicado | `docs/design.md` | regras mobile, acessibilidade e modais |
| Onboarding | aplicado | `docs/onboarding.md` | comandos e rotina de mudança |
| Setup/recovery | aplicado | `docs/setup.md` | ambiente, recuperação e deploy controlado |
| Quality gates | aplicado | `docs/quality.md` + `typecheck`/`verify` | baseline executado |
| Agent instructions | aplicado | `AGENTS.md` preservado e complementado | mapa de contexto e restrições |
| Claude context | reutilizado | `CLAUDE.md` continua importando `AGENTS.md` | leitura compatível |
| README | aplicado | links operacionais adicionados | navegação para docs |
| Next runtime/performance | reutilizado | stack atual preservada | build passou |
| PostgreSQL/Supabase | reutilizado | sem troca de provider ou ORM | typecheck/build passaram |
| Playwright | reutilizado | teste existente executado | 2 falhas legadas registradas |
| CI | não alterado | workflow existente preservado | sem mudança de produção |
| Sentry | não aplicável agora | requer organização/projeto e autorização de integração | nenhum SDK instalado |
| Graphify | não aplicável agora | não necessário para o escopo do produto e exigiria ferramenta extra | nenhum arquivo gerado |
| shadcn | não aplicável | o projeto já possui sistema próprio em Tailwind | stack preservada |
| Context7/MCPs externos | não necessário | documentação oficial e versão local foram suficientes | sem segredos enviados |
| Hooks, Git gates e commits | não aplicados | proibidos pelo escopo seguro desta rodada | working tree preservado |
| Deploy e migrações | bloqueados por escopo | exigem aprovação específica | nenhuma operação executada |

## Resultado

O projeto agora tem um mapa de contexto e comandos reproduzíveis sem adicionar dependências, trocar arquitetura ou modificar produção. Instalações globais, serviços pagos, integrações externas e refactors amplos ficam deliberadamente fora desta rodada.
