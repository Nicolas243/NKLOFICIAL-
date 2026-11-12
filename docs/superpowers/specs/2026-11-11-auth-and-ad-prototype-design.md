# Design: autenticação de compra e protótipo de anúncios

## Intenção

Remover a fricção do acesso ao Guia: quando uma pessoa não autenticada tentar
comprar ou assinar, ela deve ir automaticamente para o login e retornar ao
fluxo de compra depois da autenticação. O cabeçalho deve oferecer “Entrar” de
forma consistente nas áreas musical, Renda Extra e na home.

Em paralelo, criar apenas um protótipo local navegável para validar a ideia de
monetização com um mural de blocos responsivos e três faixas de anúncios. Esta
fase não cobra, não publica anúncios reais e não altera o banco remoto.

## Objetivos

- Redirecionar respostas `401 authentication_required` dos dois botões do Guia
  para `/login?next=/guias/renda-extra`.
- Preservar o destino somente quando ele for uma rota interna segura.
- Fazer o callback OAuth retornar ao destino original depois de sincronizar o
  perfil.
- Exibir “Entrar” ou “Perfil” no cabeçalho musical e de Renda Extra em desktop e
  mobile; na home, exibir uma ação compacta sem reintroduzir o menu completo.
- Mapear a escolha de área no cadastro sem obrigar onboarding musical para quem
  só quer comprar o Guia. A conta geral continua sendo única.
- Melhorar a mensagem para falhas de configuração do Google OAuth.
- Criar uma página local `/anuncie` com um mural de blocos CSS responsivos,
  três faixas horizontais e dez espaços por faixa, além de uma explicação
  transparente de que é uma prévia.
- Usar blocos de referência de aproximadamente 80x80 CSS, mantendo áreas de
  toque de no mínimo 44px em telas pequenas.

## Não objetivos

- Não corrigir credenciais do Google no Supabase por código.
- Não coletar cartão, criar checkout, assinar contratos ou aplicar migração
  para anúncios nesta fase.
- Não ativar cobrança por clique ou por lead; isso fica para uma fase com
  definição de lead válido, antifraude, consentimento e relatórios.
- Não permitir upload, redirecionamento de anúncios ou publicação automática.
- Não criar contas separadas para música e Renda Extra.

## Abordagens consideradas

1. **Login inline/modal no checkout**: reduz a troca de página, mas duplica
   estados de autenticação e torna o OAuth mais frágil no mobile.
2. **Redirecionamento para a tela existente com `next` (escolhida)**:
   reutiliza o login e o callback atuais, mantém o servidor como autoridade e
   permite voltar ao Guia sem expor o checkout antes da sessão existir.
3. **Liberar checkout anônimo e pedir login depois**: não atende à exigência de
   vincular compra ao usuário e criaria pedidos sem identidade confiável.

Para anúncios:

1. **Protótipo local sem persistência (escolhido)**: permite validar densidade,
   leitura e comportamento mobile antes de decidir preço e cobrança.
2. **Implementação completa com assinatura**: seria prematura sem identidade
   visual aprovada, regras de moderação, Storage, webhook e política comercial.
3. **Pixel físico literal**: não é estável entre telas e torna o toque difícil;
   blocos responsivos representam melhor o inventário.

## Fluxos

### Compra autenticada

1. A pessoa clica em comprar ou assinar.
2. Se a API responder `401`, o botão navega para `/login?next=/guias/renda-extra`.
3. A tela de login permite entrar, criar conta ou usar Google.
4. O callback valida o código, sincroniza o perfil e redireciona para `next`.
5. De volta ao Guia, a intenção original será retomada automaticamente: o
   formulário correspondente de CPF/consentimento será aberto ou focado, sem
   iniciar uma cobrança antes da confirmação explícita da pessoa.

Os dois pontos de compra cobertos são `GuideCheckoutButton` e
`GuideSubscriptionButton`, que chamam respectivamente
`/api/payments/create-guide-checkout` e
`/api/payments/create-guide-subscription`. Outros `401` continuam usando o
tratamento próprio de cada fluxo.

O cadastro continua com uma conta única. Nesta fase, “Música” e “Renda
Extra/compra” serão contexto temporário da entrada, sem novo campo ou
migration: Música pode iniciar o onboarding musical já existente; Renda
Extra/compra termina no perfil geral e não pede instrumento. A escolha não
altera o papel de autorização.

### Google OAuth

O aplicativo tratará mensagens de provedor ausente ou mal configurado como
“O login com Google ainda não está configurado. Use e-mail e senha ou conclua
as credenciais no Supabase.” Sem uma chave secreta cadastrada no Supabase, o
Google não pode ser corrigido localmente.

Checklist manual posterior:

1. Criar/selecionar um OAuth Client no Google Cloud.
2. No Supabase Authentication > Providers > Google, ativar o provedor.
3. Informar Client ID e Client Secret sem expô-los no repositório.
4. Adicionar a callback do Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`)
   nos redirect URIs autorizados do Google.
5. Adicionar `http://localhost:3000/auth/callback` e o domínio de produção em
   Authentication > URL Configuration > Redirect URLs do Supabase.
6. Testar login local e produção, incluindo retorno ao Guia.

### Protótipo de anúncios

`/anuncie` exibirá:

- um cabeçalho explicando “Mural NKL” e que os blocos são uma prévia;
- um grid responsivo de blocos 1:1, com preço simbólico apenas como exemplo;
- três faixas horizontais, cada uma com dez slots identificados;
- CTA “Quero anunciar” sem checkout, levando a `/noticias/anunciar`;
- notas sobre futura assinatura mensal e futura medição de cliques, sem prometer
  visualizações ou leads.

## Restrições técnicas

- Preservar Next.js 16, React, TypeScript strict, Supabase, Drizzle e Tailwind.
- Reutilizar `safeNextPath` para impedir open redirect.
- Manter os assets e dados de anúncios estáticos nesta fase.
- Adicionar testes para o redirecionamento 401, visibilidade do botão e renderização
  responsiva sem depender de serviços externos.
- Validar localmente antes de qualquer deploy.
- Se a implementação identificar uma migration ou configuração remota útil, ela
  poderá ser preparada e documentada, mas só será aplicada após confirmação
  explícita.

## Resultado esperado

Uma pessoa que chega sem conta não vê mais “Entre na sua conta para comprar o
guia”; ela é conduzida ao login e retorna ao Guia. O botão de entrada é
encontrável em todas as áreas principais. A nova página de anúncios permite
avaliar a ideia visualmente, mas deixa explícito que ainda não é um produto
vendável.
