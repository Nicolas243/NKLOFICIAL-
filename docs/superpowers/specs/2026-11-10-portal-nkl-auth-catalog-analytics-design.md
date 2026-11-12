# Portal NKL: autenticação, catálogo e análise

## Intenção

Melhorar a entrada e a conversão do Portal NKL sem criar um segundo sistema de
identidade, sem expor dados pessoais desnecessários e sem bloquear as
ferramentas de análise. O trabalho atende as áreas de oportunidades/renda extra
e musical com uma experiência coerente.

## Objetivos

- Corrigir e observar o fluxo Google/Supabase e preservar uma sessão única para
  música e oportunidades.
- Ter tutorial separado por área, exibido uma vez por área, com abertura manual
  por uma sugestão discreta, sem overlay automático.
- Garantir que páginas individuais de programas tenham rodapé completo e que o
  disclosure de parceria fique no fim da página, minimizado.
- Melhorar o catálogo: uTest como opção editorial para começar, AttaPoll sem o
  selo, tags de prazo de primeiro saque e limite visual de três linhas com
  rolagem horizontal/vertical conforme o componente existente.
- Transformar “Como funciona” em um guia prático orientado ao primeiro saque.
- Corrigir ou explicar a aparência da rota `/programas/celular` sem alterar
  conteúdo se o problema for apenas a ferramenta de visualização.
- Manter as informações de indicação do uTest seguras: copiar nome, ID e link;
  não mostrar o e-mail pessoal publicamente.
- Adicionar alternativas de estratégia para canal dark que não dependam do
  NotebookLM.
- Auditar e instrumentar apenas eventos essenciais de PostHog, Clarity e
  GA4, respeitando consentimento e sem criar webhooks de recuperação antes de
  confirmar requisitos de produto e privacidade.

## Não objetivos

- Não criar dois logins ou duplicar usuários entre áreas.
- Não criar tabelas, migrações ou automações de recuperação de checkout nesta
  fase.
- Não enviar e-mail pessoal do proprietário ao navegador ou para analytics.
- Não alterar produção, dados ou infraestrutura antes da validação local e da
  autorização explícita de deploy.
- Não prometer renda, disponibilidade, pagamento ou aprovação de nenhuma
  plataforma.

## Antiobjetivos

- Tutorial obrigatório cobrindo heatmaps, gravações ou a primeira tela.
- Fallback silencioso quando OAuth, sincronização de perfil ou consentimento
  falhar.
- Selo editorial baseado apenas em popularidade ou em remuneração potencial.
- Tags que aumentem indefinidamente a altura dos cards.

## Abordagens consideradas

### 1. Incremental, escolhida

Corrigir autenticação e tutorial primeiro; depois aplicar as alterações
editoriais e de rodapé; por fim adicionar eventos analíticos básicos. Prazos,
estratégias e contador inicial serão metadados editoriais centralizados, sem
migração. É a opção de menor risco porque preserva o contrato atual do
Supabase, permite validar cada etapa e evita inventar dados persistidos.

### 2. Completa com banco

Persistir apoiadores, prazos, experimentos e webhooks em tabelas novas. Oferece
mais flexibilidade, mas aumenta o risco operacional, exige políticas/RLS,
migração e definição de fonte de verdade antes de os dados existirem.

### 3. Diagnóstico primeiro

Reproduzir login, auditar a rota e revisar PostHog/Clarity/GA4 antes de toda
mudança. Maximiza a confiança do diagnóstico, mas posterga correções que já
podem ser implementadas sem depender de produção.

A opção incremental foi escolhida porque atende o escopo visível com o menor
risco e mantém a opção de evoluir para a abordagem com banco quando houver
dados reais e requisitos fechados.

## Desenho funcional

### Autenticação compartilhada

- Manter um projeto e uma sessão Supabase Auth.
- Usar a mesma sessão nas áreas musical, oportunidades e renda extra.
- Preservar `user_profiles` como perfil compartilhado; permissões continuam
  sendo avaliadas por papel/rota, não por uma segunda conta.
- Adicionar logs de fronteira sem segredos para início OAuth, URL segura de
  retorno, callback, troca do código, leitura do usuário e sincronização do
  perfil.
- Validar `next` apenas como caminho interno e exibir erro explícito quando
  callback, cookie ou sincronização falhar.
- Verificar o formulário de registro multi-etapas para que campos ocultos não
  substituam os valores visíveis no `FormData`.
- Se a sincronização do perfil falhar depois de o Supabase autenticar o usuário,
  manter a sessão, registrar o erro sem dados sensíveis e mostrar uma
  recuperação clara para tentar a sincronização novamente.

### Tutorial por área

- Definir áreas estáveis, no mínimo `income` e `music`, com uma chave de
  visualização independente por área.
- Abrir automaticamente somente na primeira visita daquela área e manter o
  botão “Guia rápido” para reabrir manualmente.
- Ao clicar no elemento destacado, encerrar o tutorial e permitir a navegação
  normal.
- Preferir uma apresentação não bloqueante. Se o overlay permanecer, ele deve
  ter estado de análise desativado por detecção explícita de ambiente/configuração
  e nunca deve esconder o conteúdo para gravações por padrão.
- Emitir eventos próprios de abertura, avanço, encerramento e clique no alvo,
  sem enviar dados pessoais.

### Catálogo e páginas

- Remover `attapoll` da lista editorial de “Melhor para começar”.
- Adicionar `utest` à lista somente se a página atender os mesmos critérios
  editoriais das demais opções.
- Centralizar prazos de saque em metadados já usados pelo catálogo, com textos
  prudentes como “1º saque em 15 dias, conforme regras”.
- Renderizar a informação do primeiro saque no guia prático, nas tags e na
  página individual quando houver dado revisado.
- Transformar “Como funciona” em uma sequência: requisitos, primeiro passo,
  tarefa inicial, critério de validação, saque e cuidados.
- Limitar tags visualmente a três linhas; preservar acesso às demais por
  rolagem/expansão sem quebrar a largura do card.
- No uTest, o CTA de inscrição usa `https://www.utest.com/ref2535825`; o botão
  de cópia oferece nome + UTest ID + link. O e-mail pessoal não aparece.
- Manter o convite do Buy Me a Coffee somente no card correspondente.
- Mover “Sobre links de parceria” para o final da página individual em
  `<details>` fechado, com texto legível e acessível.
- Garantir que o rodapé global seja renderizado nas páginas individuais.
- Conferir a rota `/programas/celular` no navegador e no HTML/CSS. Se a folha
  estiver carregando, tratar a aparência textual como limitação da ferramenta
  de inspeção; se houver erro real, corrigir a causa mínima.

### Apoio e estratégias

- Exibir “0 pessoas” no bloco de apoio enquanto não houver fonte verificada.
- Não simular crescimento nem contar cliques como apoiadores.
- Acrescentar estratégias editoriais para canal dark: roteiro original com
  pesquisa manual, narração própria/sintética revisada, bancos de mídia
  licenciados, Shorts derivados, distribuição em comunidades e análise de
  retenção. Cada estratégia deve declarar esforço, risco e dependência.

### Tutoriais e compartilhamento

- Manter `nkl_tutorial_seen` exclusivamente para o tutorial já existente da
  tela inicial.
- Criar controles separados por área para a sugestão de tutorial. A sugestão
  será pequena, não bloqueará conteúdo nem heatmaps e aparecerá uma vez por
  área no navegador; o tutorial completo só abrirá quando a pessoa clicar.
- O botão “Guia rápido” continuará abrindo o tutorial sob demanda.
- Fechar ou ignorar a sugestão não impedirá a navegação; a área poderá ser
  revisitada pelo botão manual.
- Qualquer botão de compartilhar deverá montar a URL canônica da página atual,
  removendo link direto de afiliado e parâmetros de rastreamento que não sejam
  necessários para a página. O texto compartilhado deve identificar o Portal
  NKL e a página, não o proprietário.
- Adicionar um botão flutuante de compartilhar acima do botão flutuante do
  WhatsApp. Usar Web Share API quando disponível e fallback explícito para
  copiar a URL, com feedback acessível.

### Métricas

- Primeiro auditar os scripts e eventos existentes.
- Padronizar um conjunto mínimo: visualização de programa, clique de CTA,
  abertura de guia, conclusão de tutorial, cópia de indicação e erro de login.
- Só disparar PostHog, Clarity, GA4 e Vercel Analytics após consentimento
  compatível com a implementação atual.
- Usar feature flags para variações futuras de CTA/tutorial, sem afirmar
  significância estatística automaticamente.
- Registrar recomendações de Clarity Rage/Dead Clicks e cruzamentos GSC/GA4 em
  documentação operacional, não em automação invasiva.

## Ordem de execução

1. Criar testes de regressão para autenticação, tutorial, ordenação, uTest,
   tags e disclosure.
2. Corrigir a sessão/callback e o registro multi-etapas.
3. Implementar tutorial por área e modo não bloqueante.
4. Aplicar alterações editoriais, guia de saque, tags, rodapé, disclosure e
   compartilhamento canônico.
5. Validar `/programas/celular` e contar rotas públicas com critério explícito.
6. Auditar e completar eventos analíticos mínimos.
7. Rodar verificações focadas, `npm run verify` e, para interações críticas,
   `npm run test:e2e`, registrando falhas de baseline.
8. Somente após aprovação explícita, preparar o deploy; nenhuma migração será
   executada nesta fase.

## Questões para o implementador

- Confirmar quais seletores da área musical já existem antes de definir os
  passos visuais do tutorial.
- Confirmar o contrato atual de consentimento e os nomes de eventos para evitar
  duplicidade.
- Confirmar a fonte editorial existente para prazos de saque e não preencher
  lacunas com estimativas.

## Decisões de implementação deixadas ao construtor

- Descobrir os seletores e a ordem do tutorial musical a partir das telas e
  componentes existentes; não criar alvos artificiais.
- A recuperação de perfil será um botão/ação explícita de “Tentar novamente”,
  com erro visível e sem logout automático.
- Usar `program-first-withdrawal.ts` e os dados editoriais existentes como
  fonte de prazos. Onde não houver prazo revisado, não renderizar uma
  estimativa.
- Reutilizar o helper de consentimento e os nomes de eventos já presentes no
  portal; eventos de marketing antes do consentimento devem ser descartados,
  não enfileirados.
- Preferir `<link rel="canonical">`; na ausência dele, normalizar pathname e
  host públicos, removendo parâmetros de afiliado e tracking.
- Contar rotas públicas por família do App Router, excluindo `api`, auth,
  dashboard, admin e rotas internas; páginas dinâmicas contam como uma família,
  e o relatório exibirá o critério.
- Aplicar a uTest os mesmos critérios editoriais de “Melhor para começar”,
  documentando a justificativa e sem elevar a nota por comissão.
