# Design: catálogo de oportunidades e experimento de CTA

## Intenção

Deixar a primeira tela do catálogo de renda extra mais útil para descoberta e
usar as visualizações secundárias para testar, com segurança, qual mensagem
comercial leva mais pessoas ao Guia NKL. A ordenação deve destacar primeiro as
oportunidades marcadas editorialmente como **Melhor para Começar** e, dentro
desse grupo, usar a nota como desempate. O teste não deve transformar o
catálogo em uma página agressiva de venda nem esconder informação essencial.

O experimento foi escolhido porque os dados atuais ainda são pequenos:
Google Analytics registra 74 usuários, 182 visualizações e nenhum evento
principal; Clarity registra 16 sessões nos últimos três dias, 1,25 páginas por
sessão, 54,7% de scroll e 47 segundos de atenção ativa. Portanto, precisamos
medir o funil antes de tirar conclusões sobre uma mensagem vencedora.

## Objetivos

- Ordenar `Relevância` por selo editorial, depois por `finalRating`
  decrescente e, por fim, nome para desempate.
- Preservar os demais modos de ordenação e filtros existentes.
- Remover o controle textual “Ler mais” da lista de tags sem perder nenhuma tag
  nem impedir sua leitura.
- Exibir uma oferta editorial dentro da visualização completa de uma
  oportunidade, mantendo a oferta nativa já presente no grid inicial.
- Testar três mensagens de CTA somente na visualização secundária e na oferta
  exibida após a primeira abertura pelo botão “Ler mais”.
- Atribuir uma variante de forma persistente por navegador, registrar
  impressão, clique, início de checkout e compra, e usar apenas dados
  agregados para escolher a variante menos exposta até que todas tenham volume
  mínimo.
- Propagar a variante até a página do Guia e ao checkout para que compras
  possam ser atribuídas ao CTA de origem.

## Fora do escopo

- Não alterar orçamento, campanhas ou configuração de Google Ads/AdSense.
- Não criar personalização por perfil, origem, dispositivo ou dados sensíveis.
- Não mudar o conteúdo dos roteiros de primeiro saque, estratégias ou páginas
  individuais fora da oferta e dos eventos necessários.
- Não declarar uma variante vencedora com o volume atual; o painel deve mostrar
  contagens e taxas, não conclusões estatísticas indevidas.
- Não remover o botão principal “Ler mais” do card de oportunidade; a remoção
  se aplica ao expansor textual da lista de tags.

## Restrições e anti-objetivos

- Preservar Next.js 16, React, TypeScript strict, Drizzle, Supabase e Tailwind.
- Reutilizar `guideOfferEvents` e o fluxo de `offerVariant` já existente, sem
  migração se os valores continuarem em colunas `varchar`.
- Manter consentimento e não enviar dados pessoais aos provedores de analytics.
- Falhas de telemetria não podem impedir abrir uma oportunidade ou acessar o
  checkout; devem ser registradas no cliente/servidor conforme o padrão atual.
- O card comercial não deve deslocar o conteúdo principal de forma inesperada:
  no modal ele ficará depois do resumo e antes dos detalhes longos, com
  aparência editorial compatível com o catálogo.

## Abordagens consideradas

1. **Rotação somente no cliente:** alternar textos por sessão e enviar cliques
   ao analytics. É simples, mas não garante distribuição equilibrada, não
   preserva a variante entre páginas e não conecta a compra ao CTA.
2. **Experimento controlado persistente — escolhido:** o servidor escolhe a
   variante menos exposta, o navegador a persiste por experimento e a mesma
   variante acompanha a navegação até a página do Guia e o checkout. Mede
   impressão, clique, checkout e compra usando a infraestrutura existente,
   mantendo o escopo pequeno e adequado ao volume atual.
3. **Personalização comportamental:** variar a mensagem conforme origem,
   aparelho, página e interações. Pode ser útil com mais tráfego, mas agora
   fragmentaria uma amostra já pequena e dificultaria a interpretação.

## Design escolhido

### Ordenação e tags

`relevancia` tratará a presença exata do selo `Melhor para Começar` como o
primeiro critério. O segundo será `finalRating` decrescente e o terceiro será
`name` em `pt-BR`, para que a ordenação seja estável. A direção escolhida pelo
usuário continuará valendo para `nota`, `ganhos` e `nome`; a direção não
inverterá a relevância editorial padrão.

`SmartTagList` continuará priorizando o selo e registrando cliques locais, mas
renderizará todas as tags em fluxo, sem estado de expansão nem botão “Ler
mais”. O conteúdo não será truncado por altura fixa.

### Oferta e variantes

O card comercial reutilizará `NativeAdCard`, recebendo um posicionamento
explícito para não confundir a impressão do grid com a impressão do modal. A
oferta secundária terá três variantes de copy, mantendo o mesmo produto e o
mesmo destino:

- **0:** título “Melhor renda extra é saber economizar”; descrição “Compare
  custos, tempo e critérios antes de escolher uma plataforma e evite desperdiçar
  energia.”; botão “Quero começar com clareza”.
- **1:** título “Ganhe tempo escolhendo melhor”; descrição “Use um mapa prático
  para separar oportunidades compatíveis com sua rotina das que só parecem
  promissoras.”; botão “Ver o mapa prático”.
- **2:** título “Comece com um plano claro”; descrição “Siga um roteiro de
  primeiros passos, aprovação e organização para sair da pesquisa e agir.”;
  botão “Montar meu próximo passo”.

Cada variante terá título, descrição curta e rótulo de botão próprios. O preço,
as condições e o destino comercial serão idênticos entre variantes para que o
teste meça a mensagem, não uma mudança de oferta.

Na abertura do modal, o componente solicitará a variante do experimento
`program-secondary-cta`. O valor será salvo em
`localStorage` com uma chave versionada. Se a API estiver indisponível, haverá
fallback aleatório local; a experiência continuará funcional e a falha será
registrada. Uma impressão será enviada uma única vez por instância visível do
card. Clique no CTA será enviado antes da navegação quando possível.

### Eventos e atribuição

O endpoint de eventos aceitará o experimento novo e os tipos `impression`,
`click`, `checkout` e `conversion`; `conversion` continuará representando
compra confirmada pelos webhooks. O seletor de variante fará agrupamento por
impressões e distribuirá novas visitas para a variante menos exposta até todas
atingirem o mínimo existente. Depois disso, poderá escolher a maior taxa
observada, sem declarar significância estatística.

O link para `/guias/renda-extra` carregará um identificador validado da
variante. A página do Guia transformará esse identificador em `offerVariant`
para a assinatura e para a oferta avulsa, preservando o formato usado pelos
webhooks. O início de checkout será registrado nos componentes de checkout;
as conversões continuarão sendo gravadas no servidor após confirmação de
pagamento. Google Analytics e PostHog receberão eventos agregados equivalentes
quando já houver consentimento, enquanto a tabela local será a fonte de
atribuição de compra.

### Decisões operacionais

- O mínimo de exposição será de 40 impressões por variante, reaproveitando o
  limiar já usado pelo seletor de ofertas. Empates serão resolvidos pelo menor
  identificador numérico; taxas sem conversão permanecem em zero e não serão
  tratadas como prova de pior desempenho.
- Não será criado um painel administrativo nesta etapa. A tabela local e os
  relatórios já disponíveis no GA, PostHog e Clarity serão as fontes de análise;
  qualquer consulta administrativa existente continuará restrita ao servidor.
- Uma impressão da oferta secundária ocorre na primeira abertura do modal que
  renderiza o card e é deduplicada por instância do componente. Fechar e
  reabrir o mesmo modal não cria nova impressão; abrir outra oportunidade pode
  gerar uma nova impressão da mesma variante.
- O link usará `cta_variant=0|1|2`. A página do Guia aceitará apenas esses
  valores e os converterá internamente para
  `program-secondary-cta:<variant>`; valores ausentes ou inválidos cairão em
  `sales-page`, sem substituir atribuições válidas já produzidas pelo checkout.

### Validação

- Testes unitários ou de componente para a ordenação editorial, persistência de
  variante e validação de payloads.
- E2E do catálogo para confirmar selo primeiro, filtros, tags sem expansor,
  abertura do modal e oferta secundária.
- Verificação manual em viewport móvel e desktop, com teclado, Escape e
  navegação externa.
- `npm run lint`, `npm run typecheck`, `npm run build` e `npm run verify`.
- Confirmar que falha de telemetria não bloqueia o catálogo e que eventos de
  compra existentes continuam usando `conversion`.

## Decisões restantes para o implementador

- Reutilizar o endpoint e a tabela atuais, ampliando validação apenas onde
  necessário.
- Manter o card do grid inicial no experimento `native-card`; o novo
  `program-secondary-cta` será exclusivo da visualização secundária.
- Usar nomes de eventos consistentes entre a tabela local, GA e PostHog, sem
  enviar URL de afiliado ou dados pessoais como parâmetro analítico.
