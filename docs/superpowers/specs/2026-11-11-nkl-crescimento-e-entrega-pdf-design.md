# Portal NKL: crescimento, captura e entrega do PDF

## Intenção

Melhorar o funil de Renda Extra sem interromper a experiência principal:

- entregar o PDF automaticamente após uma solicitação válida;
- substituir o Formspree por um fluxo próprio, auditável e com limite muito maior;
- mostrar links de afiliado, resumo de funcionamento e passo a passo nos resultados do guia interativo;
- corrigir e proteger o formulário “Sugerir uma oportunidade”, incluindo contato autorizado;
- preparar uma oferta de anúncios próprios sem poluir o catálogo nem ativar cobrança antes de validar a procura;
- permitir validação local completa antes de qualquer migração ou deploy.

O foco desta fase é transformar ideias em superfícies testáveis. Não é objetivo ativar uma rede de anúncios paga em produção sem checkout, moderação e termos aprovados.

## Objetivos

1. **Entrega gratuita do PDF**
   - E-mail obrigatório para receber o material.
   - Telefone opcional, com validação e consentimento separado.
   - Link de download protegido, temporário e limitado.
   - O e-mail não será usado para marketing sem aceite explícito.
   - Em local, `EMAIL_DELIVERY_MODE=preview` permite testar sem enviar mensagens externas.

2. **Sugestão de oportunidade**
   - Validar nome, URL, justificativa, e-mail/telefone e consentimento.
   - Limitar tamanho dos campos e preservar rate limit existente.
   - Mostrar estado de envio, erro legível e confirmação.
   - Exibir contato somente para administradores autorizados.

3. **Resultado do guia interativo**
   - Cada resultado deve mostrar:
     - resumo editorial;
     - “Como funciona” em poucas linhas;
     - passos até o primeiro saque;
     - botão “Acessar plataforma” com o link afiliado cadastrado;
     - disclosure de parceria.
   - O link afiliado continuará visível e marcado como patrocinado; não haverá cloaking opaco.

4. **Oferta de anúncios próprios**
   - Criar `/anuncie` com uma proposta clara e uma prévia responsiva.
   - Criar `/mural-de-parceiros` como demonstração de inventário.
   - Usar preços iniciais de validação:
     - Mural: R$ 19,90/mês por bloco;
     - destaque nativo: R$ 49,90/mês por lote.
   - Mostrar projeção de visualizações somente como estimativa, com origem e período explícitos.
   - Nenhum espaço patrocinado real será publicado sem aprovação editorial.

## Fora do escopo desta fase

- Cobrança automática de anúncios.
- Upload público automático de logo e link.
- Contrato de leads ou cobrança por lead.
- Migração de produção aplicada automaticamente.
- Web Push completo com inscrição de navegador.
- Integração direta com a API do GA4 sem credenciais e propriedade confirmadas.
- Envio de e-mail marketing sem consentimento separado.

## Abordagens consideradas

### A. Construir a rede de anúncios completa agora

Criaria inventário, tabela, checkout recorrente, upload, painel, moderação e relatórios
simultaneamente. É completo, mas mistura monetização ainda não validada com mudanças de
produção, aumenta a superfície de falhas e dificulta saber qual parte gerou demanda.

### B. Funil próprio e pré-venda local primeiro — escolhida

Implementa o fluxo de PDF, a sugestão protegida, o resultado enriquecido do guia e as páginas
de pré-venda/demonstração de anúncios. A estrutura de anúncios fica pronta para receber dados
reais depois, sem criar cobrança ou migrar inventário antes de haver interesse.

Esta abordagem foi escolhida porque entrega valor imediato, permite observar a experiência localmente
e reduz o risco de armazenar imagens, links e contratos sem moderação.

### C. Manter Formspree e adicionar apenas uma página comercial

Seria rápido, mas preservaria o limite de 50 envios e deixaria a entrega do PDF sem rastreabilidade,
sem controle de consentimento e sem download protegido. Não atende ao problema principal.

## Desenho técnico escolhido

### Entrega do PDF

Adicionar uma tabela de solicitações de guia com:

- e-mail normalizado;
- telefone opcional normalizado;
- consentimento de entrega e consentimento de novidades separados;
- hash de token de download;
- expiração do token;
- contagem e limite de downloads;
- estado de entrega;
- timestamps de criação, envio e primeiro download.

O servidor cria o token apenas uma vez, armazena somente o hash e envia um link interno
temporário. A rota de download valida o hash, expiração, estado e cota antes de criar a URL
assinada do Storage privado. Em desenvolvimento, a mesma validação funciona sem o provedor de
e-mail e a interface mostra o link de teste.

O formulário será renderizado novamente no fim da página completa da plataforma, próximo ao
rodapé, como a superfície editorial que já existia. Ele entregará o asset
`guia-essencial-renda-extra-2027`, e não será adicionado à landing paga
`/guias/renda-extra`.

Solicitações repetidas do mesmo e-mail ficarão temporariamente bloqueadas enquanto houver um
token vigente. A mensagem orientará a pessoa a usar o link já recebido ou aguardar a expiração,
evitando duplicação e abuso.

O envio usará uma pequena integração HTTP com Resend, controlada por:

- `RESEND_API_KEY`;
- `EMAIL_FROM`;
- `EMAIL_REPLY_TO` opcional;
- `EMAIL_DELIVERY_MODE=preview|resend`.

Sem chave em modo `resend`, o fluxo falha de forma explícita; não haverá sucesso falso.

### Sugestões de oportunidades

Expandir `partnerSuggestions` com contato e consentimento. A action usará schema de validação
explícito, rejeitará campos acima dos limites, validará URL com protocolo permitido e exigirá
pelo menos um canal de contato. O formulário terá botão desabilitado durante o envio e campo
honeypot não anunciado para reduzir bots.

### Resultado do guia

Reutilizar `getFirstWithdrawalGuide()` e os dados editoriais existentes em vez de duplicar
roteiros. Um componente de resultado compacto renderizará o link afiliado apenas na tela de
resultado, junto da divulgação de parceria e do passo a passo resumido.

### Prévia de anúncios e projeção

Criar um módulo de projeção determinístico que aceite:

- visualizações acumuladas no período;
- média diária observada;
- data de referência;
- mês-alvo.

Quando não houver fonte analítica configurada, a página exibirá “estimativa de demonstração”
com valor configurável por ambiente, sem fingir que é dado do GA4. A integração GA4 fica
preparada como próxima etapa, condicionada às credenciais e à propriedade corretas.

O mural e o destaque nativo serão componentes de prévia sem anúncios reais. Ambos terão:

- identificação explícita de publicidade;
- layout mobile-first;
- blocos com tamanho mínimo de toque;
- CTA “Anuncie aqui”;
- link para `/anuncie`;
- nenhum impacto no ranking editorial do catálogo.

## Privacidade e segurança

- Não armazenar o PDF em `public/`.
- Não registrar e-mail, telefone, URL de afiliado ou dados livres em eventos analíticos.
- Não incluir telefone no link de download.
- Aplicar rate limit por IP e, quando possível, por hash do e-mail.
- Não exibir contato de sugestão na interface pública.
- Manter disclosure de comissão junto dos links afiliados.
- Não aplicar migração remota nem configurar segredo de produção nesta fase.

## Validação local

1. Testes unitários da projeção, normalização, validação e token.
2. E2E da sugestão com sucesso e erro.
3. E2E do formulário do PDF em modo preview, incluindo download protegido e expiração simulada.
4. E2E do resultado do guia com link afiliado e passos.
5. E2E responsivo de `/anuncie` e `/mural-de-parceiros`.
6. `npm run verify`.
7. Visualização manual em 390px e desktop antes de solicitar deploy.

## Decisões confirmadas

- O formulário gratuito fica no final da página completa da plataforma, perto do rodapé.
- O asset inicial é `guia-essencial-renda-extra-2027`.
- O modo local mostra o botão de download na tela de sucesso.
- Repetições com token vigente são bloqueadas temporariamente.
- A sugestão exige e-mail ou telefone, com consentimento para contato sobre a sugestão.
- O desenho foi aprovado para execução.

## Dependências externas e login

Não é necessário login para construir ou validar a primeira fase localmente. Para habilitar envio
real depois, será necessário criar/verificar um remetente no Resend e adicionar `RESEND_API_KEY`
e `EMAIL_FROM` na Vercel. A CLI do Supabase não está instalada, mas o MCP do Supabase está
configurado; qualquer aplicação de migração remota será uma etapa separada e autorizada.

Se o ambiente local ou a produção não tiverem a migração aplicada, a pessoa responsável deverá:

1. revisar o SQL gerado;
2. aplicar a migração no projeto Supabase correto;
3. configurar as variáveis de e-mail na Vercel;
4. verificar o domínio/remetente no Resend;
5. repetir os testes de solicitação e download.

## Decisões que ficam para a próxima fase

- escolha definitiva do provedor de checkout dos anúncios;
- termos de publicidade e política de cancelamento;
- critérios de aprovação e remoção de anunciantes;
- inventário real e tabela `sponsored_inventory`;
- Web Push, preferências e cooldown de lembretes;
- integração autenticada com GA4 e cálculo baseado em pageviews reais.
