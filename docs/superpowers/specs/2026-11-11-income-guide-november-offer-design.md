# Oferta de novembro e experimento de CTA do Guia

## Intenção

Melhorar `/guias/renda-extra` para vender com clareza o pacote de novembro e aprender qual mensagem gera mais checkouts e compras, sem criar cinco páginas diferentes.

## Entrega aprovada

As duas modalidades entregam o pacote de novembro com cinco materiais:

1. Guia Essencial Renda Extra 2027.
2. O Código de Novembro.
3. Dinheiro Para Ontem.
4. Escudo de Black Friday.
5. Raio-X Financeiro, com versões para computador e mobile contadas como um único material.

O pagamento único libera o pacote de novembro uma vez. A assinatura de R$ 19/mês libera o pacote atual e novos PDFs/guias a partir de 15 de dezembro, conforme a programação editorial.

## Objetivos

- Explicar em poucos segundos o que a pessoa recebe em novembro.
- Diferenciar claramente pagamento único e assinatura mensal.
- Testar cinco ângulos de mensagem no mesmo layout.
- Medir impressão, clique, checkout e conversão por variante.
- Distribuir visitantes sem variante de forma balanceada e manter a variante no navegador.

## Não objetivos

- Não criar cinco landing pages.
- Não alterar preços, gateways, webhooks ou regras de liberação.
- Não prometer renda, lucro ou resultado financeiro.
- Não misturar o experimento do Guia com o experimento de CTA dos cards de programas.

## Variantes aprovadas

Cada variante terá título, resumo curto e label de CTA próprios:

- `0` — **Pacote de novembro:** foco em “Receba os 5 materiais de novembro”.
- `1` — **Diagnóstico rápido:** foco em “Descubra onde seu dinheiro está escapando”.
- `2` — **Ação imediata:** foco em “Pare de adiar: comece com um plano prático”.
- `3` — **Oportunidades:** foco em “Organize suas escolhas de renda extra”.
- `4` — **Proteção:** foco em “Prepare-se melhor para a Black Friday”.

Os textos podem ser refinados para caber no layout, mas devem preservar o ângulo e não afirmar resultados garantidos.

## Abordagens consideradas

1. Ampliar o experimento `program-secondary-cta` de três para cinco variantes. Rejeitada porque altera também os cards do catálogo e mistura públicos e métricas diferentes.
2. Criar cinco páginas independentes. Rejeitada porque duplica SEO, manutenção e variáveis de checkout.
3. Criar um experimento específico do Guia com cinco variantes, seleção balanceada no endpoint existente de eventos e uma camada client para hidratar a variante na página. Escolhida porque isola métricas, preserva URLs `cta_variant=0..4` e compara apenas a mensagem.

## Decisões técnicas

- Novo experimento: `guide-page-cta`.
- Variantes válidas: `0`, `1`, `2`, `3`, `4`.
- `cta_variant` explícito tem prioridade e é validado contra as cinco variantes.
- Sem `cta_variant`, o cliente consulta o endpoint de seleção balanceada e salva a escolha em `localStorage` com uma chave própria do Guia.
- Se a seleção falhar, o cliente usa fallback aleatório entre as cinco variantes e registra o erro no console, sem bloquear o checkout.
- Eventos do Guia usam `guide-page-cta:<variant>` e continuam sujeitos ao consentimento aceito.
- O experimento atual `program-secondary-cta` permanece com as variantes `0`, `1` e `2`.
- A página mantém o mesmo layout visual e os mesmos componentes de pagamento; somente conteúdo e variante de oferta mudam.

## Critério de sucesso

Após volume suficiente, o painel de eventos deve permitir comparar por variante:

- impressões;
- cliques;
- checkouts iniciados;
- conversões confirmadas;
- taxa de checkout por impressão;
- taxa de conversão por impressão.

Nenhuma variante será declarada vencedora antes de cada variante atingir pelo menos 40 impressões; esse limite é operacional, não uma conclusão estatística.
