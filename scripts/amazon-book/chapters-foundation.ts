import { escapeHtml, type BookChapterPayload } from './types';

type TableColumn = {
  header: string;
  align?: 'left' | 'right' | 'center';
};

function renderTable(columns: TableColumn[], rows: string[][]): string {
  const thead = columns
    .map((col) => {
      const alignAttr = col.align ? ` style="text-align: ${col.align};"` : '';
      return `<th${alignAttr}>${escapeHtml(col.header)}</th>`;
    })
    .join('');

  const tbody = rows
    .map((row) => {
      const cells = row
        .map((cell, index) => {
          const align = columns[index]?.align;
          const alignAttr = align ? ` style="text-align: ${align};"` : '';
          return `<td${alignAttr}>${escapeHtml(cell)}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>`;
}

function renderList(items: Array<{ lead?: string; text: string }>, ordered = false): string {
  const tag = ordered ? 'ol' : 'ul';
  const body = items
    .map((item) => {
      if (item.lead) {
        return `<li><strong>${escapeHtml(item.lead)}:</strong> ${escapeHtml(item.text)}</li>`;
      }
      return `<li>${escapeHtml(item.text)}</li>`;
    })
    .join('');
  return `<${tag}>${body}</${tag}>`;
}

function renderCallout(title: string, paragraphs: string[]): string {
  const body = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('');
  return `<div class="callout"><p class="callout-title"><strong>${escapeHtml(title)}</strong></p>${body}</div>`;
}

function renderWriteLines(count: number): string {
  return Array.from({ length: count }, () => '<div class="write-line"></div>').join('');
}

function buildFrontMatter(): BookChapterPayload {
  const sharedIntro = [
    `<p class="lead">Este livro nasceu de uma frustração prática: quase tudo o que circula gratuitamente sobre renda extra na internet se resume a listas rasas de links, promessas infladas e tutoriais incompletos que ignoram taxas, reprovações, bloqueios de conta e o valor real do seu tempo.</p>`,
    `<h2>Por que este livro vai muito além de listas gratuitas na internet</h2>`,
    `<p>Quem busca gerar caixa adicional hoje encontra dois extremos igualmente inúteis. De um lado, páginas genéricas com dezenas de nomes de aplicativos empilhados sem contexto, onde ninguém informa qual o valor mínimo para saque, quanto tempo leva uma qualificação não remunerada ou se a plataforma sequer aceita residentes no Brasil com estabilidade. De outro, discursos agressivos que vendem a ilusão de dinheiro automático em poucos cliques, escondendo o fato de que o único negócio lucrativo ali é a venda do próprio curso.</p>`,
    `<p>Uma lista gratuita entrega apenas o endereço de entrada; ela nunca ensina o que acontece depois do cadastro. Não mostra como calcular se US$ 15 por hora brutos se transformam em menos de um salário-mínimo por hora quando você soma o tempo ocioso esperando tarefas, o spread do câmbio e a taxa de transferência. Não alerta sobre o risco de ter uma conta bancária bloqueada por inconsistência cadastral ao receber do exterior. E, principalmente, não constrói uma ponte entre tarefas pontuais de entrada e fontes de receita mais sólidas.</p>`,
    `<p>Este manual foi estruturado como ferramenta técnica de execução sobre quatro pilares concretos:</p>`,
    renderList([
      {
        lead: 'Triagem financeira pela Hora Líquida Real',
        text: 'Antes de dedicar uma noite inteira ou um fim de semana a qualquer rota, você aprende a medir ganho líquido por hora real investida, considerando todas as perdas invisíveis.',
      },
      {
        lead: 'Proteção antifraude e higiene operacional',
        text: 'Você recebe critérios objetivos para identificar armadilhas em menos de dois minutos e um protocolo de isolamento digital para proteger dados bancários, identidade e contas principais.',
      },
      {
        lead: 'Playbooks de execução até o primeiro saque',
        text: 'O foco dos primeiros ciclos não é acumular saldo virtual na tela de um site, mas completar o trajeto inteiro até o dinheiro cair limpo na sua conta em reais, validando que o canal realmente paga.',
      },
      {
        lead: 'Transição progressiva de renda extra para negócio próprio',
        text: 'Microtarefas e serviços iniciais servem para formar caixa, disciplina e repertório. A partir daí, o livro mostra como empacotar habilidades, construir ativos digitais e estruturar uma operação independente.',
      },
    ]),
    `<p>Para quem este livro entrega maior retorno? Para quem já trabalha em período integral e precisa de uma segunda fonte de liquidez sem destruir a própria saúde; para estudantes com janelas curtas de horário entre aulas; para profissionais com leitura em inglês ou raciocínio analítico subaproveitados no mercado local; e para futuros empreendedores que precisam juntar capital inicial sem recorrer a empréstimos caros.</p>`,
    `<hr />`,
  ].join('');

  const kindleSection = [
    `<h2>Como ler e aplicar na edição Kindle</h2>`,
    `<p>Na leitura digital em e-reader ou aplicativo Kindle, o texto foi organizado para consulta rápida em blocos fechados, listas numeradas, quadros de fórmula e checklists acionáveis. Como o Kindle não permite escrita livre em linhas pautadas sobre a página, todas as fichas operacionais do livro aparecem aqui no formato de roteiros estruturados com caixas de marcação e perguntas-guia.</p>`,
    renderList([
      {
        lead: 'Caderno ou planilha de apoio',
        text: 'Mantenha um caderno físico simples ou uma planilha dedicada aberta ao lado do leitor durante o Capítulo 3. Copie os cabeçalhos dos blocos indicados nos checklists antes de iniciar seu ciclo de 14 dias.',
      },
      {
        lead: 'Destaques estratégicos',
        text: 'Use o recurso de grifo do Kindle apenas nas fórmulas, nos critérios de corte e nos sinais de alerta. Evite marcar parágrafos inteiros para não diluir os pontos de consulta rápida.',
      },
      {
        lead: 'Leitura em duas etapas',
        text: 'Leia o Prefácio e os Capítulos 1, 2 e 3 antes de criar qualquer conta em plataforma externa. Só avance para as rotas operacionais depois de definir seu teto semanal e preparar sua infraestrutura básica.',
      },
    ]),
  ].join('');

  const printSection = [
    `<h2>Como ler e aplicar na edição Física (Paperback)</h2>`,
    `<p>Se você está com o exemplar impresso nas mãos, este livro foi desenhado para funcionar como caderno de bancada e manual de campo ao mesmo tempo. Em vez de depender de aplicativos extras para pensar, você encontrará fichas pautadas com linhas próprias para preenchimento à caneta, tabelas de registro de 14 dias e caixas de seleção para checagem manual.</p>`,
    renderList([
      {
        lead: 'Preenchimento à caneta nas fichas',
        text: 'Escrever metas de horas, contas de recebimento e resultados diários no papel reduz a dispersão e impede que você se engane sobre quanto tempo realmente gastou.',
      },
      {
        lead: 'Consultas sem tela',
        text: 'Use as páginas iniciais como filtro de bancada antes de abrir o navegador. Se uma oportunidade falhar nos critérios impressos na Ficha 1, ela sequer merece um cadastro.',
      },
      {
        lead: 'Ciclo fechado de 14 dias',
        text: 'Preencha a tabela diária ao final de cada bloco de trabalho, ainda que tenha faturado zero naquele dia. O dado de hora sem retorno é exatamente o que protege você de insistir em rotas ruins.',
      },
    ]),
  ].join('');

  const responsibilityNote = [
    `<hr />`,
    `<h2>Nota editorial de responsabilidade</h2>`,
    renderCallout('Critérios reais, zero promessas milagrosas', [
      'Nenhuma estratégia descrita neste manual garante ganho fixo, aprovação automática em processos seletivos ou enriquecimento rápido. Os valores e faixas utilizados nos exemplos refletem cenários observados no mercado, sujeitos a variação cambial, disponibilidade regional de projetos, nível de fluência técnica ou linguística, qualidade das entregas e políticas de cada contratante.',
      'As plataformas, meios de recebimento e ferramentas citados podem alterar tarifas, regras de elegibilidade, prazos de saque e termos de serviço a qualquer momento. Confirme sempre as condições vigentes diretamente no site oficial antes de iniciar um ciclo de trabalho.',
      'No campo tributário e regulatório, este livro apresenta conceitos práticos de organização financeira, Carnê-Leão, MEI e guarda de comprovantes para orientar sua rotina inicial no Brasil. Ele não substitui assessoria contábil ou jurídica individualizada. Assim que os recebimentos ganharem regularidade ou volume expressivo, consulte um contador habilitado para adequar sua operação à legislação fiscal vigente.',
    ]),
  ].join('');

  return {
    id: 'front-matter',
    tocLabel: 'Prefácio e Como Usar Este Livro',
    title: 'Prefácio e Como Usar Este Livro',
    subtitle: 'Um manual técnico para transformar tempo disponível em caixa real, com critério financeiro e zero promessas fáceis',
    htmlKindle: `${sharedIntro}${kindleSection}${responsibilityNote}`,
    htmlPrint: `${sharedIntro}${printSection}${responsibilityNote}`,
  };
}

function buildChapter1(): BookChapterPayload {
  const quadrantTable = renderTable(
    [
      { header: 'Quadrante' },
      { header: 'Exemplos típicos' },
      { header: 'Barreira de entrada' },
      { header: 'Capital inicial' },
      { header: 'Tempo até primeiro caixa' },
      { header: 'Teto e risco principal' },
    ],
    [
      [
        '1. Microtarefas de Entrada',
        'Avaliação de buscas, rotulagem de dados para IA, testes de usabilidade, pesquisas qualificadas',
        'Baixa a média (exige leitura atenta e testes gratuitos de ingresso)',
        'Zero (computador e internet estável)',
        '7 a 30 dias após aprovação e mínimo de saque',
        'Teto limitado pelas horas disponíveis; risco de fila vazia ou reprovação rigorosa',
      ],
      [
        '2. Serviços Empacotados',
        'Edição de vídeos curtos, legendagem técnica, automações simples, páginas de captura, suporte remoto',
        'Média (exige portfólio enxuto e entrega previsível)',
        'Zero a baixo (ferramentas gratuitas ou assinatura básica)',
        '7 a 21 dias mediante fechamento direto com cliente ou plataforma',
        'Escopo bem definido eleva o ganho por hora; risco de retrabalho sem contrato claro',
      ],
      [
        '3. Curadoria e Afiliados',
        'Comparativos técnicos, newsletters nichadas, conteúdo utilitário com indicação transparente',
        'Média a alta (exige consistência editorial e distribuição)',
        'Baixo (domínio, hospedagem ou canal orgânico)',
        '60 a 180 dias para ganhar tração mensurável',
        'Descola ganho da hora trabalhada; risco de depender de algoritmo único ou mudar regra de comissão',
      ],
      [
        '4. Ativos e Negócios Escaláveis',
        'Templates profissionais, micro-SaaS, produtos digitais técnicos, operação enxuta com processos',
        'Alta (exige validação de problema real, produto e atendimento)',
        'Moderado (tempo acumulado + caixa de reserva)',
        '90 a 360 dias até estabilidade operacional',
        'Maior teto patrimonial e margem; risco de construir algo sem demanda pagante comprovada',
      ],
    ],
  );

  const html = [
    `<p class="lead">A maioria das pessoas abandona a renda extra nas três primeiras semanas não por falta de esforço, mas por erro de conta. Quando você avalia uma oportunidade apenas pelo valor anunciado por hora ou por tarefa, quase sempre superestima o retorno líquido e subestima o desgaste.</p>`,
    `<h2>A ilusão do valor bruto anunciado</h2>`,
    `<p>Imagine uma plataforma internacional que anuncia pagamento de US$ 18 por hora para avaliar respostas geradas por modelos de inteligência artificial. À primeira vista, convertendo pelo dólar comercial do dia, o número parece atraente para complementar o orçamento brasileiro. Só que o valor de vitrine raramente é o valor que entra na conta corrente ao fim do mês.</p>`,
    `<p>No mundo real, antes de faturar a primeira hora remunerada, você lê um manual de vinte páginas, faz três testes de qualificação não pagos, aguarda aprovação cadastral, espera disponibilidade de fila em determinados horários e, após concluir o trabalho, enfrenta o desconto de transferência da carteira digital e o spread cambial na conversão para reais. Se o pagamento de US$ 18 exigiu outras duas horas invisíveis de preparação e burocracia para cada hora faturada, o rendimento real despenca para um terço do número anunciado.</p>`,
    `<h2>A fórmula da Hora Líquida Real (HLR)</h2>`,
    `<p>Para tomar decisões com cabeça de operador e não de curioso, adote uma única métrica soberana antes de insistir em qualquer rota: a <strong>Hora Líquida Real (HLR)</strong>. Ela mede exatamente quanto dinheiro livre sobra no seu bolso por cada hora total de vida drenada pela atividade.</p>`,
    `<div class="formula-box"><p><strong>HLR = (Ganho Bruto - Taxas de Plataforma - Spread e Tarifa Cambial - Custos Operacionais) / (Horas Faturadas + Horas Não Faturadas)</strong></p></div>`,
    `<p>Cada componente dessa fórmula precisa ser preenchido com honestidade matemática:</p>`,
    renderList([
      {
        lead: 'Ganho Bruto',
        text: 'É o total efetivamente aprovado e liberado para saque no período medido, nunca a promessa máxima exibida no anúncio da vaga.',
      },
      {
        lead: 'Taxas de Plataforma',
        text: 'Comissões retidas pelo intermediário (comuns entre 10% e 20% em mercados de serviço) e tarifas fixas cobradas a cada solicitação de saque.',
      },
      {
        lead: 'Spread e Tarifa Cambial',
        text: 'Diferença entre o câmbio comercial de referência e o câmbio líquido entregue na sua conta em reais, somando tarifas fixas de recebimento ou conversão.',
      },
      {
        lead: 'Custos Operacionais Diretos',
        text: 'Assinaturas estritamente ligadas à operação (softwares pagos, plano extra de internet ou energia proporcional em jornadas intensas) e desgaste real do equipamento.',
      },
      {
        lead: 'Horas Não Faturadas',
        text: 'Todo minuto gasto lendo regras, fazendo testes de ingresso, atualizando a página em busca de tarefas, respondendo mensagens comerciais, emitindo faturas e corrigindo entregas sem pagamento adicional.',
      },
    ]),
    renderCallout('Exemplo numérico realista na prática', [
      'Suponha duas pessoas que trabalharam 10 horas totais na mesma semana. A Pessoa A fez microtarefas que renderam US$ 60 brutos em 4 horas de fila ativa, mas gastou outras 6 horas em qualificações gratuitas e atualização de painel. Dos US$ 60, perdeu US$ 3 em taxa de saque e recebeu câmbio efetivo de R$ 5,30 por dólar após spread: sobraram R$ 302,10 líquidos. Dividindo por 10 horas totais, a HLR foi de R$ 30,21.',
      'A Pessoa B entregou um pacote fechado de edição e legendagem de 6 vídeos curtos para um profissional autônomo por R$ 480 em Pix direto. Gastou 2 horas na prospecção e alinhamento inicial e 7 horas na execução e revisão final (9 horas totais), sem taxa cambial e com custo adicional irrelevante de software gratuito. Sua HLR na semana foi de R$ 53,33, além de gerar portfólio reutilizável para o cliente seguinte.',
      'O objetivo desse comparativo não é condenar o Quadrante 1, pois muitas vezes a Pessoa A precisava de dinheiro sem precisar vender nada a ninguém. O ponto é enxergar a conta verdadeira para saber quando usar cada rota.',
    ]),
    `<h2>Os 4 Quadrantes do Retorno Digital</h2>`,
    `<p>Quase toda atividade legítima de geração de renda via internet se encaixa em um de quatro quadrantes. O erro clássico é tentar pular diretamente para o quarto quadrante sem ter caixa nem validação, ou ficar preso para sempre no primeiro quadrante tratando bicos digitais como carreira definitiva.</p>`,
    `<p>No <strong>Quadrante 1 (Microtarefas de Entrada)</strong>, você troca atenção e precisão por pagamentos unitários ou por hora em plataformas estruturadas. A grande vantagem é a previsibilidade de processo: você não precisa convencer clientes, montar site nem negociar preços. A desvantagem é o teto rígido, pois se você parar de clicar ou avaliar, a receita zera imediatamente.</p>`,
    `<p>No <strong>Quadrante 2 (Serviços Empacotados)</strong>, você deixa de vender horas avulsas e passa a vender um resultado delimitado com escopo, prazo e preço fechados. Em vez de cobrar barato por hora de digitação ou edição genérica, você entrega um pacote específico com começo, meio e fim. Isso aumenta a HLR conforme você ganha velocidade e reduz o tempo de atendimento.</p>`,
    `<p>No <strong>Quadrante 3 (Curadoria e Afiliados)</strong>, o foco sai da execução manual repetitiva e passa para a construção de confiança em um nicho específico. Quando você resolve dúvidas reais de compra, compara softwares com honestidade técnica ou organiza ferramentas para um público claro, comissões recorrentes passam a trabalhar sobre conteúdo já publicado. O retorno inicial é lento e exige paciência editorial.</p>`,
    `<p>No <strong>Quadrante 4 (Ativos e Negócios Escaláveis)</strong>, você usa o caixa e os problemas observados nos quadrantes anteriores para criar um produto digital, um software enxuto, uma biblioteca de modelos profissionais ou uma operação própria com processos documentados. Aqui nasce patrimônio de negócio, mas o risco de errar a mão sem validação de mercado é alto para quem começa sem reserva financeira.</p>`,
    quadrantTable,
    `<h2>Como calcular seu teto semanal sem destruir sua rotina</h2>`,
    `<p>Uma semana tem exatamente 168 horas. Antes de prometer a si mesmo que vai trabalhar três horas por noite além do emprego principal, faça o fechamento aritmético da sua semana real. Subtraia 56 horas de sono (8 horas por noite, ou no mínimo 49 horas em fase intensa), o total de horas do seu trabalho ou estudo principal com deslocamento, cerca de 18 horas semanais para alimentação, higiene e tarefas domésticas inevitáveis, e pelo menos 8 horas intocáveis de descanso e convivência familiar.</p>`,
    `<p>O que sobra depois dessa conta é o seu saldo bruto de tempo livre. Nunca comprometa 100% desse saldo com renda extra. Reserve pelo menos 30% como colchão para imprevistos, consultas médicas, semanas pesadas no emprego principal e recuperação física. O número restante é o seu <strong>Teto Semanal Saudável</strong>.</p>`,
    renderList([
      {
        lead: 'Faixa recomendada para quem trabalha em período integral',
        text: 'Entre 6 e 12 horas semanais, divididas em 3 ou 4 blocos concentrados de 90 a 120 minutos. Acima disso, a fadiga reduz a atenção, derruba sua aprovação nas plataformas e ameaça sua fonte de renda principal.',
      },
      {
        lead: 'Qualidade de bloco acima de quantidade de horas',
        text: 'Duas horas descansadas no sábado de manhã rendem mais entregas aprovadas do que cinco madrugadas sonolentas tentando responder questionários entre notificações de celular.',
      },
      {
        lead: 'Gatilhos de corte obrigatório',
        text: 'Se sua produtividade no emprego principal cair, se erros simples começarem a se repetir ou se a irritabilidade aumentar na segunda semana, reduza o teto semanal em 30% imediatamente.',
      },
    ]),
  ].join('');

  return {
    id: 'cap-01',
    tocLabel: 'Capítulo 1: A Matemática Real da Renda Extra',
    title: 'Capítulo 1: A Matemática Real da Renda Extra',
    subtitle: 'Como calcular sua Hora Líquida Real, escolher o quadrante certo e proteger sua rotina semanal',
    htmlKindle: html,
    htmlPrint: html,
  };
}

function buildChapter2(): BookChapterPayload {
  const paymentTable = renderTable(
    [
      { header: 'Meio de recebimento' },
      { header: 'Onde costuma ser exigido' },
      { header: 'Ponto forte prático' },
      { header: 'Ponto de atenção no Brasil' },
    ],
    [
      [
        'Wise',
        'Pagamentos diretos de empresas, transferências locais em USD/EUR/GBP, saques via Deel',
        'Cotação comercial transparente e tarifa clara antes da conversão para Pix',
        'Exige titularidade rigorosamente idêntica e pode solicitar comprovação de origem em picos de valor',
      ],
      [
        'Payoneer',
        'Marketplaces globais, redes de treinamento de IA e plataformas de trabalho remoto',
        'Aceitação muito ampla em plataformas que não pagam direto em banco brasileiro',
        'Atenção à tarifa de conversão para BRL e à taxa anual caso a conta fique sem movimentação',
      ],
      [
        'PayPal',
        'Testes de usabilidade, pesquisas remuneradas e microprojetos internacionais',
        'Integração imediata em dezenas de sites de entrada com e-mail verificado',
        'Custo elevado na conversão cambial automática e risco de retenção se houver divergência de dados',
      ],
      [
        'Deel',
        'Contratos recorrentes de prestação de serviço para empresas no exterior',
        'Geração automática de invoice, histórico documental limpo e múltiplos caminhos de saque',
        'Verifique sempre no contrato quem arca com a tarifa do método de retirada escolhido',
      ],
      [
        'Contas globais locais',
        'Conversão rápida para reais ou manutenção de reserva em dólar no ecossistema nacional',
        'Praticidade na integração com conta corrente e Pix no mesmo aplicativo',
        'Confirme se a conta aceita recebimento comercial de terceiros e não apenas remessa de mesma titularidade',
      ],
    ],
  );

  const html = [
    `<p class="lead">Ganhar em dólar ou euro perde grande parte da graça quando você entrega 6% a 12% do esforço em tarifas bancárias mal escolhidas, tem uma conta travada por erro de cadastro ou descobre tarde demais que não guardou comprovantes para o imposto.</p>`,
    `<h2>Recebimento internacional prático no Brasil</h2>`,
    `<p>Se você recebe US$ 80 ou US$ 300 de uma plataforma estrangeira diretamente por transferência internacional tradicional (SWIFT) em um grande banco de varejo brasileiro, o custo fixo da operação e a margem embutida no câmbio podem devorar uma fatia pesada do saque. Por isso, quem opera com frequência no mercado global utiliza contas de pagamento e intermediários digitais adequados ao perfil de cada plataforma.</p>`,
    `<p>A regra de ouro é simples: primeiro confira quais métodos de pagamento a plataforma realmente oferece ao Brasil no painel oficial de saque; só depois defina a rota de menor atrito e menor custo total até o seu banco local.</p>`,
    paymentTable,
    `<p>Para reduzir spread cambial, tarifas de saque e o risco de bloqueios preventivos de compliance bancário, siga quatro práticas permanentes:</p>`,
    renderList([
      {
        lead: 'Padronização absoluta de titularidade',
        text: 'Seu nome completo, CPF, data de nascimento e endereço residencial precisam estar grafados exatamente da mesma forma na plataforma contratante, na carteira internacional e no banco brasileiro. Abreviações diferentes ou uso de apelido geram travas automáticas.',
      },
      {
        lead: 'Agrupamento inteligente de saques',
        text: 'Se uma plataforma cobra tarifa fixa por retirada (por exemplo, US$ 2 ou US$ 3 por operação), sacar valores minúsculos toda semana destrói sua margem. Faça o primeiro saque assim que atingir o mínimo para validar o pagamento e, depois da validação, consolide retiradas em ciclos quinzenais ou mensais.',
      },
      {
        lead: 'Nunca misturar conta de terceiros',
        text: 'Não receba pagamentos de plataformas em conta bancária de cônjuge, amigo ou parente. Além de violar termos de uso e provocar banimento, cria confusão patrimonial difícil de explicar à instituição financeira.',
      },
      {
        lead: 'Dossiê instantâneo de origem',
        text: 'Sempre que uma remessa internacional cair, salve em PDF a invoice, o extrato da plataforma mostrando o projeto concluído e o comprovante da transferência. Se o banco pedir justificativa de origem, você responde em cinco minutos sem risco de bloqueio prolongado.',
      },
    ]),
    `<h2>Segurança e higiene digital operacional</h2>`,
    `<p>Quem começa a se cadastrar em sites de testes, pesquisas, plataformas de dados e marketplaces entra em contato diário com formulários, extensões, links de projetos e ambientes em fase beta. Usar o mesmo navegador onde ficam abertos seu banco principal, seu e-mail pessoal de recuperação e suas redes privadas é pedir para ter dor de cabeça.</p>`,
    renderList([
      {
        lead: 'Perfil dedicado de navegador',
        text: 'Crie um perfil exclusivo no navegador (ou use um navegador separado) apenas para sua operação de renda extra. Esse perfil deve ter um e-mail operacional próprio, nenhum aplicativo bancário logado e apenas extensões estritamente necessárias e verificadas.',
      },
      {
        lead: 'Cofre de senhas e chaves únicas',
        text: 'Instale um gerenciador de senhas confiável e gere uma senha longa e exclusiva para cada plataforma. Se um site pequeno sofrer vazamento de base, sua conta de pagamento e seu e-mail principal continuam intactos.',
      },
      {
        lead: 'Autenticação em dois fatores (2FA) por aplicativo',
        text: 'Sempre que possível, ative 2FA via aplicativo autenticador (TOTP) ou chave física em vez de código por SMS, que fica vulnerável a fraude de troca de chip. Guarde os códigos de recuperação em local físico seguro fora do computador.',
      },
      {
        lead: 'Proteção estrita de dados bancários',
        text: 'Nenhuma plataforma legítima de trabalho remoto precisa do código de segurança (CVV) do seu cartão de crédito, da senha do aplicativo do banco ou de acesso remoto à sua tela para pagar você. Recebimento exige apenas dados de conta ou e-mail cadastrado na carteira compatível.',
      },
      {
        lead: 'Disciplina de privacidade e NDA',
        text: 'Projetos de avaliação de software inédito e treinamento de inteligência artificial quase sempre operam sob acordo de confidencialidade (NDA). É proibido tirar capturas de tela para postar em redes sociais, gravar vídeos explicando prompts internos ou colar material sigiloso da tarefa em ferramentas públicas de terceiros.',
      },
    ]),
    `<h2>Organização fiscal essencial no Brasil</h2>`,
    `<p>Ignorar impostos porque o valor inicial parece pequeno é um erro que cobra juros altos quando a operação cresce. Mesmo no primeiro mês, mantenha um controle enxuto que separe dinheiro da operação do restante das suas contas.</p>`,
    renderList([
      {
        lead: 'Planilha mensal simples de entradas',
        text: 'Registre cada valor efetivamente creditado com seis colunas básicas: data do recebimento, plataforma ou cliente pagador, moeda original, valor bruto, valor líquido em reais após taxas e documento de referência.',
      },
      {
        lead: 'Noções práticas de Carnê-Leão (Pessoa Física)',
        text: 'Rendimentos recebidos do exterior ou de pessoas físicas por trabalho autônomo submetem-se à apuração mensal pelo Carnê-Leão Web no portal da Receita Federal, observando a tabela progressiva vigente e o vencimento no último dia útil do mês seguinte ao do recebimento.',
      },
      {
        lead: 'MEI versus Pessoa Física e transição empresarial',
        text: 'Muita gente presume que basta abrir um MEI genérico para qualquer serviço digital internacional. Na prática, o MEI exige que a atividade exercida conste exatamente na lista permitida de CNAEs, possui teto anual de faturamento e veda diversas atividades intelectuais, de desenvolvimento ou consultoria especializada. Nunca escolha um CNAE incompatível apenas para pagar menos imposto.',
      },
      {
        lead: 'Guarda organizada de comprovantes',
        text: 'Mantenha pastas digitais organizadas por ano e mês (por exemplo, 2026-11) contendo invoices, relatórios de pagamento das plataformas, comprovantes de câmbio e eventuais DARFs pagos por pelo menos cinco anos.',
      },
    ]),
    renderCallout('Quando chamar um contador', [
      'Enquanto você ainda está na fase de validação de 14 dias com valores iniciais modestos, manter a planilha mensal e o arquivo de comprovantes já evita desordem. Assim que os recebimentos ganharem constância mensal relevante ou você passar a prestar serviços recorrentes como Quadrante 2 ou 4, consulte um contador para definir o regime correto (Pessoa Física, MEI quando elegível ou Microempresa no Simples Nacional) e evitar autuações.',
    ]),
  ].join('');

  return {
    id: 'cap-02',
    tocLabel: 'Capítulo 2: Infraestrutura Profissional no Brasil (Reais, Dólar e Euro)',
    title: 'Capítulo 2: Infraestrutura Profissional no Brasil (Reais, Dólar e Euro)',
    subtitle: 'Recebimento internacional sem sangria cambial, higiene digital operacional e organização fiscal sem sustos',
    htmlKindle: html,
    htmlPrint: html,
  };
}

function buildChapter3(): BookChapterPayload {
  const decisionTable = renderTable(
    [
      { header: 'Decisão após 14 dias' },
      { header: 'Sinais objetivos observados' },
      { header: 'Ação prática imediata' },
    ],
    [
      [
        'PARAR',
        'Bloqueio ou atraso injustificado no pagamento, HLR abaixo de 40% do seu piso após curva inicial, ausência crônica de tarefas no idioma ou impacto negativo no seu trabalho principal.',
        'Encerrar a rota sem apego emocional, registrar o motivo na ficha e redirecionar o bloco semanal para a segunda rota da fila.',
      ],
      [
        'AJUSTAR',
        'A plataforma paga de fato e possui demanda, mas sua HLR ficou baixa por lentidão de adaptação, excesso de tempo ocioso procurando tarefas ou taxa de saque desfavorável.',
        'Corrigir horário de entrada, reduzir tempo não faturado, consolidar saques ou trocar de categoria interna por mais 14 dias.',
      ],
      [
        'ESCALAR',
        'Primeiro saque concluído em conta, HLR igual ou superior ao piso definido, fluxo consistente de trabalho e clareza do processo.',
        'Padronizar rotina dentro do teto semanal, otimizar entregas e planejar a passagem gradual para o próximo quadrante de retorno.',
      ],
    ],
  );

  const sharedBody = [
    `<p class="lead">Antes de investir horas em qualquer site novo, você precisa de duas ferramentas de defesa: um radar rápido para eliminar golpes antes do cadastro e um ciclo fechado de 14 dias para decidir com números reais se uma oportunidade merece continuar na sua agenda.</p>`,
    `<h2>Os 12 Sinais Objetivos de Golpe Digital</h2>`,
    `<p>Fraudes voltadas a quem procura renda extra se renovam na embalagem, mas repetem sempre os mesmos mecanismos operacionais. Basta identificar <strong>um único</strong> dos doze sinais abaixo para encerrar a conversa e fechar a aba na mesma hora:</p>`,
    renderList(
      [
        {
          lead: '1. Depósito prévio para "desbloquear tarefas" ou liberar saque',
          text: 'Nenhuma empresa legítima exige que o trabalhador pague taxa de ativação, recarga de saldo ou compra de pacote para trabalhar ou retirar o próprio dinheiro.',
        },
        {
          lead: '2. Promessa de lucro fixo diário garantido',
          text: 'Anúncios prometendo ganhos fixos diários por clicar em anúncios, curtir publicações ou avaliar produtos aleatórios ignoram qualquer lógica econômica real.',
        },
        {
          lead: '3. Recrutamento fechado sem domínio oficial verificável',
          text: 'Abordagens que nascem em mensagens privadas e conduzem exclusivamente a grupos de mensageria sem site corporativo claro, termos de serviço públicos ou canal institucional.',
        },
        {
          lead: '4. Pedido de código SMS, token 2FA ou acesso remoto',
          text: 'Qualquer pedido de código de verificação recebido no celular ou solicitação para instalar programas de acesso remoto como AnyDesk ou TeamViewer significa tentativa direta de sequestro de conta.',
        },
        {
          lead: '5. Empréstimo de conta bancária ou chave Pix',
          text: 'Propostas para você receber valores de terceiros e repassar uma parte ficando com comissão transformam você em laranja financeiro de golpe ou lavagem de dinheiro.',
        },
        {
          lead: '6. Domínio recém-registrado imitando marca conhecida',
          text: 'Links quase idênticos aos de grandes varejistas, bancos ou plataformas famosas, mas com letras trocadas, hifens estranhos ou extensões incomuns.',
        },
        {
          lead: '7. Urgência artificial extrema',
          text: 'Pressão psicológica dizendo que a vaga expira em dez minutos caso você não pague uma taxa de crachá, cadastro ou certificado imediatamente.',
        },
        {
          lead: '8. Saldo virtual artificial que dispara nos primeiros minutos',
          text: 'Interfaces onde você ganha dezenas de dólares em tarefas triviais nos primeiros cinco minutos e descobre uma trava financeira na hora de sacar.',
        },
        {
          lead: '9. Indicação obrigatória de pagantes para liberar retirada',
          text: 'Modelos que exigem recrutar novos participantes que também depositam dinheiro configuram esquema piramidal disfarçado de tarefa digital.',
        },
        {
          lead: '10. Coleta informal de documentos sensíveis via chat',
          text: 'Pedidos de foto de RG ou CNH frente e verso acompanhados de selfie por WhatsApp ou Telegram, fora de fluxo oficial de verificação de identidade em plataforma consolidada.',
        },
        {
          lead: '11. Vaga secreta vinculada à compra de curso milagroso',
          text: 'Quando todo o esforço do anúncio gira em torno de vender um acesso fechado para "desbloquear plataformas ocultas" que, na realidade, são públicas e gratuitas para cadastro.',
        },
        {
          lead: '12. Ausência total de pagador econômico lógico',
          text: 'Se não dá para explicar em uma frase simples quem compra o produto final do seu trabalho e por que essa pessoa ou empresa pagaria por ele, não existe negócio real sustentando o pagamento.',
        },
      ],
      true,
    ),
    `<h2>O Protocolo de Triagem em 5 Passos</h2>`,
    `<p>Mesmo quando um site é legítimo, ele pode ser péssimo para o seu perfil ou inviável no Brasil. Antes de investir uma hora inteira em cadastros e testes, execute esta triagem de dez minutos:</p>`,
    renderList(
      [
        {
          lead: 'Passo 1 — Identificar quem paga a conta final',
          text: 'Entenda qual cliente real consome o serviço: empresas treinando modelos de IA, times de produto testando interfaces, marcas comprando pesquisa ou clientes contratando entrega técnica.',
        },
        {
          lead: 'Passo 2 — Verificar domínio, termos e política de saque',
          text: 'Confira o site oficial, o valor mínimo de retirada, os meios compatíveis com o Brasil e se existe prazo claro de liberação após aprovação.',
        },
        {
          lead: 'Passo 3 — Checar reputação independente recente',
          text: 'Pesquise relatos dos últimos seis meses sobre pagamento efetivo e volume de tarefas para residentes no Brasil, ignorando vídeos promocionais cujo único objetivo é empurrar link de indicação.',
        },
        {
          lead: 'Passo 4 — Estimar a Hora Líquida Real preliminar',
          text: 'Avalie quanto tempo o processo de qualificação consome sem remuneração e compare o retorno esperado com seu piso mínimo semanal.',
        },
        {
          lead: 'Passo 5 — Preparar o ambiente isolado',
          text: 'Use seu perfil dedicado de navegador, seu e-mail operacional, senha única gerada no cofre e certifique-se de que a conta de recebimento esteja ativa e com titularidade idêntica.',
        },
      ],
      true,
    ),
    `<h2>O Método de Validação em 14 Dias</h2>`,
    `<p>Pulando de plataforma em plataforma a cada dois dias você nunca constrói dados confiáveis. Durante 14 dias corridos, teste no máximo uma rota principal (e uma rota secundária apenas para cobrir eventuais filas vazias da primeira). Registre cada sessão de trabalho em minutos totais, não apenas os minutos remunerados.</p>`,
    `<p>No 14o dia, interrompa novos cadastros por trinta minutos, feche a soma de horas totais, calcule sua Hora Líquida Real observada e aplique friamente a matriz abaixo:</p>`,
    decisionTable,
  ].join('');

  const worksheetPrint = [
    `<hr />`,
    `<div class="worksheet">`,
    `<h2>Ficha 1 — Bússola Pessoal e Teto Semanal</h2>`,
    `<p><em>Edição física para preenchimento à caneta. Use esta ficha antes de iniciar qualquer novo ciclo de 14 dias.</em></p>`,
    `<h3>Bloco A: Orçamento Semanal de Tempo</h3>`,
    renderTable(
      [
        { header: 'Bloco semanal' },
        { header: 'Horas disponíveis (Manhã / Tarde / Noite)' },
        { header: 'Horário reservado para execução' },
      ],
      [
        ['Segunda a Sexta (dias úteis)', '____ h', 'Das ____:____ às ____:____'],
        ['Sábado', '____ h', 'Das ____:____ às ____:____'],
        ['Domingo', '____ h', 'Das ____:____ às ____:____'],
        ['Total bruto disponível na semana', '____ h', 'Reserva obrigatória de descanso (-30%): ____ h'],
        ['Teto Semanal Saudável definido', '____ h', 'Meta máxima de blocos por semana: ____ blocos'],
      ],
    ),
    `<h3>Bloco B: Piso Financeiro e Infraestrutura</h3>`,
    `<p>Piso mínimo aceitável da minha Hora Líquida Real (R$/h):</p>`,
    renderWriteLines(1),
    `<p>Equipamento principal, conexão disponível e limitações de ambiente (ex.: ruído, horário, idioma):</p>`,
    renderWriteLines(2),
    `<p>Rota escolhida de recebimento (ex.: Pix direto, Wise, Payoneer, Deel) e e-mail operacional dedicado:</p>`,
    renderWriteLines(2),
    `<h3>Bloco C: Checklist de Triagem Inicial antes da Primeira Hora</h3>`,
    renderList([
      { text: '[ ] Confirmei quem paga o resultado econômico final da plataforma ou serviço.' },
      { text: '[ ] Verifiquei domínio oficial, valor mínimo de saque e compatibilidade com o Brasil.' },
      { text: '[ ] Não há nenhum dos 12 sinais objetivos de golpe digital.' },
      { text: '[ ] Perfil dedicado do navegador criado, senha única salva e 2FA por aplicativo ativado.' },
      { text: '[ ] Titularidade e endereço idênticos conferidos entre plataforma e conta recebedora.' },
    ]),
    `<h3>Bloco D: Diário de Campo (Ciclo de 14 Dias)</h3>`,
    renderTable(
      [
        { header: 'Dia' },
        { header: 'Data' },
        { header: 'Plataforma / Rota' },
        { header: 'Minutos totais' },
        { header: 'Entregas' },
        { header: 'Bruto / Observação' },
      ],
      Array.from({ length: 14 }, (_, index) => [
        `Dia ${String(index + 1).padStart(2, '0')}`,
        '___/___',
        '________________',
        '____ min',
        '____',
        '________________',
      ]),
    ),
    `<h3>Bloco E: Fechamento e Veredito do Dia 14</h3>`,
    `<p>Total de horas totais investidas nos 14 dias: ________ h | Ganho líquido convertido: R$ ________ | HLR real apurada: R$ ________/h</p>`,
    `<p>Decisão objetiva após a matriz: [ ] PARAR &nbsp;&nbsp; [ ] AJUSTAR &nbsp;&nbsp; [ ] ESCALAR</p>`,
    `<p>Justificativa escrita e próximo passo exato para os próximos 14 dias:</p>`,
    renderWriteLines(4),
    `</div>`,
  ].join('');

  const worksheetKindle = [
    `<hr />`,
    `<div class="checklist-box">`,
    `<h2>Ficha 1 — Bússola Pessoal e Teto Semanal (Guia para Caderno ou Planilha)</h2>`,
    `<p><em>Versão estruturada para e-reader. Reproduza os cinco blocos abaixo no seu caderno físico ou planilha de acompanhamento antes de abrir qualquer conta nova.</em></p>`,
    `<h3>Bloco A: Orçamento Semanal de Tempo</h3>`,
    renderList([
      { lead: 'Segunda a Sexta', text: 'Anote quantas horas livres reais possui em blocos de 90 minutos sem sacrificar sono.' },
      { lead: 'Fim de semana', text: 'Defina horários fechados no sábado ou domingo com início e fim claros.' },
      { lead: 'Reserva de segurança', text: 'Desconte 30% do saldo bruto para descanso e imprevistos e trave o seu Teto Semanal Saudável.' },
    ]),
    `<h3>Bloco B: Piso Financeiro e Infraestrutura</h3>`,
    renderList([
      { text: '[ ] Definir piso mínimo aceitável da Hora Líquida Real em R$/h.' },
      { text: '[ ] Registrar equipamento disponível, velocidade de internet e nível prático de inglês/leitura.' },
      { text: '[ ] Definir e validar o canal principal de recebimento (Pix, Wise, Payoneer, Deel ou conta global).' },
    ]),
    `<h3>Bloco C: Checklist de Triagem Inicial antes da Primeira Hora</h3>`,
    renderList([
      { text: '[ ] Identificar quem paga o serviço ou produto final da plataforma.' },
      { text: '[ ] Confirmar domínio oficial, valor mínimo de saque e meio aceito no Brasil.' },
      { text: '[ ] Conferir ausência total dos 12 sinais objetivos de golpe digital.' },
      { text: '[ ] Configurar perfil dedicado do navegador, senha única e 2FA via aplicativo.' },
      { text: '[ ] Validar titularidade exata em todos os cadastros.' },
    ]),
    `<h3>Bloco D: Colunas do Diário de Campo (14 Dias)</h3>`,
    `<p>Crie uma tabela simples com 14 linhas numeradas (Dia 01 a Dia 14) e seis colunas: <strong>Dia</strong>, <strong>Data</strong>, <strong>Plataforma/Rota</strong>, <strong>Minutos Totais (incluindo fila e qualificação)</strong>, <strong>Entregas Aprovadas</strong> e <strong>Bruto Estimado / Observações</strong>.</p>`,
    `<h3>Bloco E: Fechamento do Dia 14</h3>`,
    renderList([
      { text: '[ ] Somar horas totais investidas nos 14 dias e valor líquido realmente creditado ou aprovado.' },
      { text: '[ ] Calcular a HLR real observada pela fórmula do Capítulo 1.' },
      { text: '[ ] Marcar uma única decisão na matriz: [ ] PARAR  |  [ ] AJUSTAR  |  [ ] ESCALAR.' },
      { text: '[ ] Escrever em três linhas o motivo da decisão e a primeira ação dos próximos 14 dias.' },
    ]),
    `</div>`,
  ].join('');

  return {
    id: 'cap-03',
    tocLabel: 'Capítulo 3: Método de Validação em 14 Dias e Escudo Anti-Golpe',
    title: 'Capítulo 3: Método de Validação em 14 Dias e Escudo Anti-Golpe',
    subtitle: 'Como filtrar armadilhas antes de perder tempo, testar uma rota por duas semanas e decidir com dados',
    htmlKindle: `${sharedBody}${worksheetKindle}`,
    htmlPrint: `${sharedBody}${worksheetPrint}`,
  };
}

export function buildFoundationChapters(): BookChapterPayload[] {
  return [
    buildFrontMatter(),
    buildChapter1(),
    buildChapter2(),
    buildChapter3(),
  ];
}
