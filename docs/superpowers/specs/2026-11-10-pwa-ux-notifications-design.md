# PWA, UX contextual e notificações

## Intenção

Tornar a instalação do Portal NKL compreensível e acionável nos principais
navegadores, corrigir sobreposições e quebras do layout mobile, oferecer um
Guia rápido específico por página e adicionar notificações úteis sem expor
segredos no cliente.

## Objetivos

- Mostrar uma ação de instalação ou instruções adequadas quando o navegador
  não oferece `beforeinstallprompt`, incluindo Safari iOS/iPadOS/macOS,
  Firefox, Chromium, Samsung Internet, Opera e Brave.
- Evitar que lembretes, popovers, menu, compartilhamento e modal de Pix ocupem
  a mesma área ou criem controles duplicados.
- Exibir Mercado Pago, Pix e Buy Me a Coffee lado a lado quando couber e
  quebrar naturalmente quando não couber.
- Associar tutoriais a rotas concretas, preservar visto por página e mostrar
  uma chamada contextual para páginas ainda não explicadas.
- Ocultar visualmente a barra horizontal das tags sem remover a rolagem.
- Criar uma central interna de notificações e, quando o navegador permitir,
  suporte a Push API com inscrição controlada e envio server-side.
- Usar analytics disponíveis para validar eventos de instalação, instruções,
  dismissals e notificações, sem copiar tokens ou segredos para o repositório.

## Não objetivos

- Não prometer instalação silenciosa em navegadores que não suportam o prompt.
- Não usar scraping ou depender de uma métrica de terceiros para decidir
  compatibilidade; a matriz de suporte será implementada por capacidades reais
  do navegador.
- Não publicar migrações, configurar produção ou fazer deploy antes de
  validação local e autorização explícita no momento do deploy.
- Não enviar notificações promocionais sem consentimento e sem opção de
  desligar.

## Abordagens consideradas

### A. Apenas corrigir o prompt nativo

Preserva o mínimo de código, mas continua deixando Firefox, Safari e vários
navegadores sem ação útil. Não atende ao problema observado.

### B. Fallback por capacidade + central interna + Push opcional (escolhida)

O cliente detecta capacidades reais: prompt nativo quando disponível,
instruções específicas por plataforma quando não disponível e estado standalone
para ocultar ações concluídas. O tutorial e a central de notificações são
modelados por rota/usuário. Push é opcional, com VAPID apenas no servidor,
consentimento explícito e fallback para a central interna.

Essa abordagem preserva a experiência atual, funciona mesmo sem push e permite
medir cada etapa do funil. É a escolhida porque resolve o Safari sem fingir
compatibilidade e não torna a entrega dependente de uma configuração externa.

### C. Forçar uma biblioteca de instalação/notificações

Pode reduzir código específico, mas não cria suporte onde o navegador não
oferece instalação e adiciona dependências e configuração de infraestrutura.
Não oferece vantagem suficiente neste projeto.

## Desenho

### Instalação

Extrair um estado de instalação compartilhado para o botão e o lembrete. O
estado terá `installed`, `nativePromptAvailable`, `platformInstructions` e
`dismissed`. A ação nativa consumirá o prompt uma única vez; os demais casos
abrirão um diálogo com instruções para iOS/iPadOS, macOS Safari, Firefox e
Chromium sem prompt. O service worker, manifest, ícones, HTTPS e `start_url`
serão validados. Eventos de exposição, clique, aceite, recusa e instalação
serão registrados de forma anônima e tolerante a falhas.

### Layout e sobreposições

Usar um único padrão de empilhamento para elementos flutuantes, com regiões
reservadas no mobile e fechamento mútuo de diálogos. O rodapé usará itens
flexíveis com largura mínima e quebra natural. A barra de tags receberá uma
classe reutilizável de scrollbar oculto, preservando `overflow-x: auto`,
gestos e foco.

### Guia rápido

Expandir o catálogo de áreas para uma definição por rota, com fallback para a
área do portal. Cada tutorial terá passos próprios e filtrará somente alvos
visíveis. A chave de `localStorage` incluirá a rota normalizada, evitando que
concluir o tutorial de uma página esconda o de outra. A sugestão ficará perto
do controle do guia e poderá ser reaberta manualmente.

### Notificações

Criar uma central interna com notificações persistidas e lidas por usuário,
com tipos, título, corpo, link, data e estado de leitura. O cliente poderá
solicitar permissão de push a partir de uma ação explícita, registrar a
subscription e removê-la quando inválida. O envio será server-side por uma
rota protegida ou ação administrativa, usando VAPID em variáveis de ambiente.
Sem VAPID configurado, a central interna continua funcionando e o produto
mostra o estado de forma explícita.

### Validação

- Testes unitários para detecção de plataforma, estados do prompt, chaves por
  rota e redução de etapas invisíveis.
- Testes de componente para fallback de instalação, rodapé, guia e central.
- `npm run typecheck`, `npm run verify` e, para as interações críticas,
  `npm run test:e2e`.
- Revisão de analytics disponível para comparar exposição e conversão por
  navegador, sem usar dados pessoais ou segredos.
- Deploy somente depois da validação e confirmação explícita.

## Decisões deixadas ao implementador

O implementador escolherá a tabela/estrutura já compatível com Drizzle e o
formato exato dos eventos, reutilizando padrões existentes. Também definirá
quais rotas têm tutorial detalhado na primeira versão, cobrindo todas as rotas
principais e mantendo fallback para páginas novas.
