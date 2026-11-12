# Design: checkout convidado e estabilizacao da autenticacao

## Intencao

Permitir que qualquer visitante compre os guias sem criar ou acessar uma
conta, mantendo a autenticacao disponivel para perfil, musica e recursos
privados. A pagina `/login` deve continuar renderizando mesmo quando o banco
ou a configuracao de um provedor social estiver indisponivel.

## Diagnostico confirmado

- `/login` responde HTTP 200 localmente e no dominio publico.
- O fluxo atual bloqueia compras anonimas com `401 authentication_required`.
- O Next registrou uma falha de consulta no perfil e um `TypeError` do tutorial
  em `/perfil`; esses erros precisam deixar de contaminar a experiencia global.
- A branch `nkl-growth-pdf` possui commits de hoje que nao estao em `master`,
  enquanto o worktree de `master` tem alteracoes locais sobrepostas.

## Objetivos

- Remover a exigencia de login para compra unica e assinatura.
- Solicitar no checkout convidado somente nome, e-mail, CPF e consentimento.
- Vincular a compra a uma identidade de acesso segura sem confiar em dados
  enviados pelo navegador depois do pagamento.
- Liberar a pagina de sucesso e downloads por token de acesso curto, associado
  ao pedido aprovado, sem expor CPF em URL, logs ou metadata do Stripe.
- Manter o fluxo autenticado funcionando: perfis logados continuam usando nome
  e e-mail do perfil, com preenchimento assistido.
- Evitar que falhas de perfil, tutorial ou OAuth derrubem `/login`.
- Incorporar as alteracoes de crescimento de hoje sem apagar mudancas locais.

## Nao objetivos

- Nao aplicar migration remota, configurar OAuth no Supabase ou fazer deploy
  sem aprovacao explicita.
- Nao transformar compras anonimas em contas automaticamente nesta etapa.
- Nao remover a area autenticada de perfil e materiais para usuarios logados.
- Nao expor o CPF em query string, evento analitico, metadata publica ou log.

## Abordagens consideradas

1. **Checkout convidado completo (escolhida)**: visitantes informam nome,
   e-mail, CPF e consentimento; o servidor cria o pedido sem `userId`, gera um
   token de acesso derivado do pedido e entrega os materiais somente após
   pagamento aprovado. E a unica opcao que atende compra e entrega sem login.
2. **Login opcional com entrega por e-mail/link**: reduz a mudanca no banco,
   mas ainda exige projetar recuperacao de acesso e pode criar uma conta
   obrigatoria na etapa de entrega; fica como alternativa se o token convidado
   nao for aprovado.
3. **Remover login da compra e exigir conta para baixar**: menor alteracao,
   mas devolve a friccao ao cliente depois do pagamento e contradiz o objetivo.

## Decisoes tecnicas

- O formulario do checkout sera a fonte de nome/e-mail/CPF para visitantes;
  para usuarios autenticados, nome/e-mail do perfil permanecem a fonte
  confiavel e os campos podem vir preenchidos.
- O pedido guardara um segredo/token somente em forma hash. O token bruto sera
  entregue uma vez na URL de sucesso do checkout e convertido imediatamente
  em cookie HttpOnly seguro. Se expirar ou a pagina for fechada, o acesso sera
  recuperado por um novo link enviado ao mesmo e-mail da compra.
- Um visitante autenticado podera comprar como convidado com outro e-mail; o
  pedido permanecera separado e o acesso sera recuperado pelo e-mail informado.
- O CPF sera persistido criptografado, com acesso restrito, retenção mínima
  necessária e exclusão/anonimização documentada.
- A cota sera de duas tentativas por material, sem expiração temporal. Falhas
  antes da entrega não consumirão uma tentativa; atualizações concorrentes
  serão atômicas.
- Assinaturas liberarão materiais somente enquanto o status estiver ativo.
  Falhas, cancelamentos, reembolsos e disputas revogarão o acesso conforme os
  eventos Stripe recebidos.
- A página de sucesso exibirá pendência e fará polling por alguns segundos
  enquanto aguarda a confirmação do webhook; depois orientará recuperação por
  e-mail.
- A pagina de sucesso validara a sessao Stripe e o token de acesso antes de
  mostrar os downloads. O endpoint de download validara o mesmo acesso,
  status aprovado/ativo e cota.
- O webhook continuara sendo a autoridade para aprovar pedidos; nenhum link de
  retorno do navegador marcara compra como paga.
- O consentimento de uso do CPF será obrigatório e versionado junto ao pedido,
  com data/hora e finalidade restrita à personalização, rastreabilidade e
  prevenção de compartilhamento. Marketing permanecerá opcional e separado.
- A sincronizacao de perfil no login continuara tolerante a falha: a pessoa
  recebe uma mensagem acionavel, sem erro de renderizacao.
- O tutorial deve ignorar rotas sem area/steps validos e nunca acessar
  `event.detail.area` quando o evento nao possui `detail`.
- O merge da branch de crescimento sera seletivo e preservara o worktree:
  primeiro sera criado um inventario de commits/arquivos sobrepostos; depois
  serao incorporadas apenas mudancas de hoje que nao dupliquem ou revertam o
  fluxo atual. Nenhuma alteracao local sera descartada automaticamente.

## Validacao

- Testes unitarios para token, pedido convidado, expiracao, consumo e
  autorizacao de download.
- E2E para abrir `/login`, comprar anonimamente, retornar do Stripe simulado,
  baixar material com token e rejeitar token ausente/expirado.
- `npm run verify` e a suite E2E completa.
- Nenhuma migration remota ou deploy nesta etapa.
