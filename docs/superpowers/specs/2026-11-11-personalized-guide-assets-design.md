# Design: personalização antifraude dos materiais pagos

## Intenção

Personalizar os materiais entregues após uma compra ou assinatura aprovada,
reduzindo o incentivo ao compartilhamento. Cada cópia terá uma marca d'água
repetida em todas as páginas/abas com nome completo, CPF completo, e-mail e
identificador da compra.

## Decisões confirmadas

- Hotmart será removida; Stripe será o único gateway.
- O cliente precisará estar autenticado no Portal NKL.
- Nome e e-mail virão do perfil autenticado.
- CPF será solicitado somente no momento da compra, não no cadastro geral.
- Pix será oferecido somente para a compra única de R$ 39.
- O consentimento específico será obrigatório antes do Checkout.
- Os materiais ficarão disponíveis no perfil após a confirmação.
- O CPF será mantido apenas enquanto necessário para acesso, personalização,
  rastreabilidade e prevenção de compartilhamento indevido; depois poderá ser
  anonimizado conforme solicitação e política LGPD.

## Objetivos

- Coletar o CPF e o consentimento no fluxo do Guia antes do Checkout; obter nome
  e e-mail da conta autenticada.
- Associar os dados à compra ou assinatura Stripe sem confiar em valores
  enviados pelo cliente depois do pagamento.
- Gerar cópias personalizadas sob demanda após a confirmação do webhook.
- Personalizar o PDF e as duas planilhas Excel sem alterar os arquivos originais.
- Exibir na política de privacidade o uso restrito desses dados para
  personalização, rastreabilidade e prevenção de compartilhamento indevido.
- Garantir que o Pix seja habilitado e testável no mesmo sandbox Stripe usado
  pela aplicação, mantendo métodos de pagamento dinâmicos no Checkout.

## Não objetivos

- Não enviar os arquivos por e-mail nesta etapa.
- Não alterar os arquivos originais no Supabase Storage.
- Não coletar dados de cartão no Portal NKL.
- Não usar o CPF para marketing ou compartilhamento com terceiros.

## Abordagens consideradas

1. **Personalizar no servidor sob demanda (escolhida)**: armazenar os dados no
   pedido e gerar a cópia quando o cliente clicar para baixar. Evita gerar
   arquivos abandonados e preserva os originais.
2. Gerar todos os arquivos no webhook: entrega imediata, mas aumenta o tempo e
   o risco de falha do webhook, além de criar arquivos que podem nunca ser
   baixados.
3. Personalizar no navegador: menor custo de servidor, mas expõe os originais
   e permite remover a marca d'água antes do download.

## Fluxo proposto

1. O usuário entra ou cria sua conta no Portal NKL.
2. No checkout da compra, o formulário solicita apenas o CPF e o consentimento;
   nome e e-mail vêm do perfil autenticado.
3. O servidor valida o CPF, grava os dados no registro pendente, cria o Checkout
   e propaga somente a referência interna nos metadados Stripe.
4. O webhook confirma a compra/assinatura, vincula o registro ao usuário e
   libera o material no perfil.
5. Ao solicitar um material no perfil, o servidor valida a sessão autenticada,
   gera a cópia personalizada e entrega um download protegido ou URL temporária.
5. A marca d'água usa texto diagonal repetido, com contraste baixo, mas legível,
   contendo `Nome · CPF · e-mail · NKL-<id curto>`.
6. O limite de downloads continua sendo aplicado por acesso.

## Privacidade e segurança

O CPF será exibido completo porque essa foi a decisão de produto, mas será
armazenado e processado somente para personalização, rastreabilidade e
prevenção de compartilhamento indevido. O CPF não aparecerá em logs, URLs,
analytics ou metadados públicos. O formulário terá consentimento específico e
o texto legal será atualizado para explicar a finalidade e o período de
retenção aplicável.

## Arquivos

- PDF: gerar uma cópia com marca d'água em todas as páginas.
- Excel: gerar uma cópia com marca d'água visual nas abas e uma identificação
  visível no cabeçalho; preservar fórmulas e estrutura do modelo.
- O Storage continuará contendo somente os modelos originais; cópias
  personalizadas serão temporárias ou entregues diretamente na resposta.

## Pix

O código continuará omitindo `payment_method_types`, permitindo métodos
dinâmicos. A validação inclui conferir a ativação do Pix no mesmo sandbox,
moeda BRL, país elegível e eventos assíncronos do webhook. Nenhuma lista fixa
de cartões será adicionada.

## Pendências para implementação

- Escolher bibliotecas compatíveis para edição de PDF e XLSX.
- Adicionar campos e validações ao formulário e ao schema.
- Remover Hotmart das rotas, ambiente, UI e documentação ativas.
- Criar a área autenticada de materiais comprados no perfil.
- Gerar os arquivos personalizados no endpoint protegido de download.
- Atualizar política de privacidade, testes e documentação de configuração.
