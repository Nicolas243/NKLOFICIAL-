export type QuizAxis = 'capital' | 'time' | 'risk' | 'tech' | 'social';

export type QuizOption = {
  label: string;
  weight: number;
};

export type Question = {
  id: string;
  axis: QuizAxis;
  text: string;
  options: QuizOption[];
};

function buildOptions(labels: [string, string, string, string, string]): QuizOption[] {
  return labels.map((label, index) => ({
    label,
    weight: index + 1,
  }));
}

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 'capital-01',
    axis: 'capital',
    text: 'Quanto você consegue separar para testar uma oportunidade sem comprometer despesas essenciais?',
    options: buildOptions([
      'Nenhum valor disponível no momento (R$ 0)',
      'Até R$ 100 para um teste pontual',
      'De R$ 101 a R$ 500 sem afetar o orçamento',
      'De R$ 501 a R$ 2.000 reservados para validação',
      'Acima de R$ 2.000 disponíveis para testes',
    ]),
  },
  {
    id: 'capital-02',
    axis: 'capital',
    text: 'Você consegue investir em ferramentas, anúncios ou equipamentos antes de receber o primeiro pagamento?',
    options: buildOptions([
      'Não consigo investir nada antes de receber',
      'Apenas valores simbólicos de até R$ 100',
      'Consigo investir entre R$ 101 e R$ 500 antes do retorno',
      'Consigo investir entre R$ 501 e R$ 2.000 em estrutura inicial',
      'Consigo financiar estrutura e tráfego acima de R$ 2.000',
    ]),
  },
  {
    id: 'capital-03',
    axis: 'capital',
    text: 'Qual valor mensal você aceitaria comprometer com software, internet ou serviços de apoio?',
    options: buildOptions([
      'Somente ferramentas e planos 100% gratuitos',
      'Até R$ 50 por mês em assinaturas essenciais',
      'De R$ 51 a R$ 150 por mês em ferramentas',
      'De R$ 151 a R$ 400 por mês em softwares e apoio',
      'Acima de R$ 400 por mês para operação profissional',
    ]),
  },
  {
    id: 'capital-04',
    axis: 'capital',
    text: 'Você possui reserva para suportar um período de validação sem retorno imediato?',
    options: buildOptions([
      'Não tenho reserva; preciso de retorno já nas primeiras semanas',
      'Consigo aguardar até 1 mês sem retorno financeiro',
      'Consigo sustentar de 1 a 2 meses de validação',
      'Consigo sustentar de 3 a 4 meses de validação',
      'Tenho reserva para mais de 4 meses de construção',
    ]),
  },
  {
    id: 'capital-05',
    axis: 'capital',
    text: 'Quanto poderia reinvestir dos primeiros ganhos para ampliar uma operação que funcionou?',
    options: buildOptions([
      'Nada, preciso usar 100% do ganho para despesas atuais',
      'Até 20% do que entrar nos primeiros meses',
      'Cerca de metade (50%) dos primeiros ganhos',
      'A maior parte (70% a 80%) dos primeiros ganhos',
      'Posso reinvestir 100% dos primeiros ganhos para escalar',
    ]),
  },
  {
    id: 'capital-06',
    axis: 'capital',
    text: 'Você tem acesso a computador, celular e conexão adequados sem precisar comprá-los agora?',
    options: buildOptions([
      'Tenho apenas celular básico e conexão móvel limitada',
      'Tenho bom celular com Wi-Fi estável, mas não tenho computador',
      'Tenho computador básico e internet estável para tarefas leves',
      'Tenho computador rápido, bom celular e internet banda larga',
      'Tenho setup completo (computador potente, áudio/vídeo e fibra)',
    ]),
  },
  {
    id: 'capital-07',
    axis: 'capital',
    text: 'Qual é sua margem para pagar taxas, ferramentas ou materiais específicos de uma plataforma?',
    options: buildOptions([
      'Nenhuma margem; só posso atuar onde o acesso é totalmente gratuito',
      'Consigo cobrir até R$ 100 em taxas ou materiais iniciais',
      'Consigo cobrir de R$ 101 a R$ 300 se a plataforma exigir',
      'Consigo cobrir de R$ 301 a R$ 1.000 para operar bem',
      'Tenho margem acima de R$ 1.000 para licenças e insumos',
    ]),
  },
  {
    id: 'capital-08',
    axis: 'capital',
    text: 'Você aceitaria começar com um orçamento pequeno para testar aquisição de clientes?',
    options: buildOptions([
      'Não, só quero caminhos com aquisição 100% orgânica e gratuita',
      'Aceito testar com até R$ 100 no total',
      'Aceito separar de R$ 101 a R$ 300 para campanhas de teste',
      'Aceito separar de R$ 301 a R$ 1.000 para validar aquisição',
      'Tenho orçamento dedicado acima de R$ 1.000 para tráfego pago',
    ]),
  },
  {
    id: 'capital-09',
    axis: 'capital',
    text: 'Quanto valor você consegue manter disponível para cobrir reembolsos, atrasos ou ajustes?',
    options: buildOptions([
      'Nenhum valor disponível para imprevistos financeiros',
      'Até R$ 100 de margem de segurança',
      'De R$ 101 a R$ 500 de margem de segurança',
      'De R$ 501 a R$ 1.500 reservados para capital de giro',
      'Acima de R$ 1.500 disponíveis para giro e contingência',
    ]),
  },
  {
    id: 'capital-10',
    axis: 'capital',
    text: 'Você prefere modelos que não exigem investimento inicial mesmo que cresçam mais lentamente?',
    options: buildOptions([
      'Exijo investimento zero; não posso arriscar dinheiro agora',
      'Prefiro começar sem custo e só investir depois do primeiro ganho',
      'Combino etapas gratuitas com pequenos gastos pontuais',
      'Prefiro investir um valor moderado para acelerar a validação',
      'Prefiro aportar capital desde o início para ganhar escala rápido',
    ]),
  },

  {
    id: 'time-01',
    axis: 'time',
    text: 'Quantas horas reais por semana você consegue reservar para executar e acompanhar uma oportunidade?',
    options: buildOptions([
      'Menos de 2 horas por semana',
      'De 2 a 5 horas por semana',
      'De 6 a 10 horas por semana',
      'De 11 a 20 horas por semana',
      'Mais de 20 horas por semana',
    ]),
  },
  {
    id: 'time-02',
    axis: 'time',
    text: 'Com que frequência você consegue responder a clientes, briefings ou convites dentro do prazo?',
    options: buildOptions([
      'Apenas nos fins de semana ou quando sobra tempo',
      'A cada 2 ou 3 dias',
      'Uma vez por dia, em horário fixo',
      'Duas a três vezes ao longo do dia',
      'Respostas rápidas várias vezes ao dia em horário comercial',
    ]),
  },
  {
    id: 'time-03',
    axis: 'time',
    text: 'Quanto tempo você tolera dedicar à configuração antes de realizar a primeira tarefa?',
    options: buildOptions([
      'Até 30 minutos; quero começar no mesmo dia',
      'De 1 a 2 horas de cadastro e leitura inicial',
      'Até 5 horas distribuídas na primeira semana',
      'Uma a duas semanas estruturando perfil e portfólio',
      'Várias semanas construindo uma operação completa antes de lançar',
    ]),
  },
  {
    id: 'time-04',
    axis: 'time',
    text: 'Você consegue manter uma rotina de produção ou publicação por várias semanas?',
    options: buildOptions([
      'Não consigo manter rotina fixa; só atuo em tarefas avulsas',
      'Consigo cumprir 1 entrega por semana com esforço',
      'Consigo manter 2 a 3 entregas por semana de forma estável',
      'Consigo manter entregas em quase todos os dias úteis',
      'Tenho disciplina para produzir e publicar diariamente por meses',
    ]),
  },
  {
    id: 'time-05',
    axis: 'time',
    text: 'Quanto tempo diário você teria para aprender uma ferramenta nova e praticar?',
    options: buildOptions([
      'Menos de 15 minutos por dia',
      'Cerca de 30 minutos por dia',
      'Cerca de 1 hora por dia',
      'De 1 a 2 horas por dia',
      'Mais de 2 horas diárias para estudo e prática',
    ]),
  },
  {
    id: 'time-06',
    axis: 'time',
    text: 'Você pode trabalhar em horários fixos quando uma oportunidade exige disponibilidade?',
    options: buildOptions([
      'Não, só posso atuar em horários totalmente livres e variáveis',
      'Consigo reservar um bloco fixo apenas no fim de semana',
      'Consigo reservar blocos fixos à noite durante a semana',
      'Consigo cumprir janelas fixas de meio período em dias úteis',
      'Tenho ampla disponibilidade para horários fixos e comerciais',
    ]),
  },
  {
    id: 'time-07',
    axis: 'time',
    text: 'Quanto tempo consegue esperar por aprovação, validação ou liberação de pagamento?',
    options: buildOptions([
      'Preciso de aprovação e pagamento em poucos dias',
      'Consigo aguardar até 2 semanas pelo ciclo da plataforma',
      'Consigo aguardar de 15 a 30 dias (ciclo mensal)',
      'Consigo aguardar de 30 a 60 dias se a operação for sólida',
      'Consigo aguardar mais de 60 dias enquanto construo o ativo',
    ]),
  },
  {
    id: 'time-08',
    axis: 'time',
    text: 'Você consegue dividir uma tarefa grande em entregas menores e acompanhar pendências?',
    options: buildOptions([
      'Prefiro microtarefas curtas que começam e terminam na mesma hora',
      'Consigo acompanhar tarefas simples de até 2 etapas',
      'Organizo listas semanais e cumpro etapas sem perder prazos',
      'Divido projetos em cronogramas claros e reviso pendências diariamente',
      'Gerencio múltiplos projetos, prazos e entregáveis com facilidade',
    ]),
  },
  {
    id: 'time-09',
    axis: 'time',
    text: 'Quanto espaço sua rotina tem para entrevistas, reuniões ou chamadas de onboarding?',
    options: buildOptions([
      'Nenhum espaço para chamadas ao vivo',
      'Apenas chamadas raras agendadas com bastante antecedência',
      'Consigo participar de 1 a 2 chamadas curtas por semana',
      'Consigo participar de chamadas em quase todos os dias úteis',
      'Tenho agenda flexível para reuniões, entrevistas e sessões ao vivo',
    ]),
  },
  {
    id: 'time-10',
    axis: 'time',
    text: 'Você consegue manter consistência mesmo quando o volume de tarefas oscila?',
    options: buildOptions([
      'Perco o ritmo se não houver tarefas disponíveis todo dia',
      'Mantenho alguma atenção, mas reduzo muito as checagens',
      'Conferiria a plataforma regularmente mesmo em semanas calmas',
      'Aproveito períodos de baixa para melhorar perfil e qualificação',
      'Opero múltiplas frentes e mantenho rotina constante o ano todo',
    ]),
  },

  {
    id: 'tech-01',
    axis: 'tech',
    text: 'Como você avalia sua familiaridade com planilhas, formulários e ferramentas online?',
    options: buildOptions([
      'Tenho dificuldade até com planilhas e formulários simples',
      'Preencho formulários e uso planilhas básicas no dia a dia',
      'Organizo dados, filtros e documentos online com facilidade',
      'Monto controles completos com fórmulas, relatórios e integrações',
      'Domino ferramentas avançadas de dados, gestão e produtividade',
    ]),
  },
  {
    id: 'tech-02',
    axis: 'tech',
    text: 'Você consegue instalar, configurar e testar aplicativos seguindo documentação?',
    options: buildOptions([
      'Não consigo instalar ou configurar sem ajuda passo a passo',
      'Instalo apenas aplicativos comuns de celular e computador',
      'Sigo tutoriais e documentação em português sem dificuldade',
      'Sigo documentação técnica (inclusive em inglês) e ajusto parâmetros',
      'Configuro ambientes técnicos, extensões e ferramentas complexas com autonomia',
    ]),
  },
  {
    id: 'tech-03',
    axis: 'tech',
    text: 'Como você lida com erros técnicos, integrações ou configurações que não funcionam de primeira?',
    options: buildOptions([
      'Travo e desisto quando algo apresenta erro técnico',
      'Peço ajuda imediatamente para outra pessoa resolver',
      'Pesquiso o erro em tutoriais e testo soluções básicas',
      'Isolo a causa do problema, testo hipóteses e resolvo sozinho',
      'Depuro integrações, configurações e falhas técnicas com facilidade',
    ]),
  },
  {
    id: 'tech-04',
    axis: 'tech',
    text: 'Você já usou automações, APIs, no-code ou ferramentas de inteligência artificial?',
    options: buildOptions([
      'Nunca usei nenhuma dessas ferramentas',
      'Uso apenas chat de IA para perguntas simples do cotidiano',
      'Uso IA com prompts estruturados e ferramentas visuais no trabalho',
      'Crio fluxos no-code, templates reutilizáveis e automações simples',
      'Integro APIs, agentes, scripts e automações avançadas',
    ]),
  },
  {
    id: 'tech-05',
    axis: 'tech',
    text: 'Você consegue analisar métricas para decidir quais tarefas ou canais merecem mais esforço?',
    options: buildOptions([
      'Não acompanho números nem métricas de desempenho',
      'Olho apenas o valor total recebido no fim do mês',
      'Comparo horas trabalhadas, cliques ou entregas básicas',
      'Analiso conversão, custo e retorno por hora para ajustar a rota',
      'Tomo decisões orientadas por dados, testes A/B e indicadores claros',
    ]),
  },
  {
    id: 'tech-06',
    axis: 'tech',
    text: 'Qual é sua capacidade de editar imagens, vídeos, áudio ou textos com ferramentas digitais?',
    options: buildOptions([
      'Não sei editar textos, imagens, áudio ou vídeos',
      'Faço revisões simples de texto e uso modelos prontos no celular',
      'Crio e edito peças limpas usando Canva, CapCut ou editores similares',
      'Produzo e edito conteúdo com boa qualidade visual, roteiro e áudio',
      'Domino edição profissional, roteirização e produção multimídia',
    ]),
  },
  {
    id: 'tech-07',
    axis: 'tech',
    text: 'Você consegue proteger senhas, revisar permissões e identificar sinais de golpe?',
    options: buildOptions([
      'Tenho dificuldade para identificar links ou propostas suspeitas',
      'Tomo cuidados básicos, mas às vezes repito senhas',
      'Uso autenticação em duas etapas e verifico remetentes antes de clicar',
      'Gerencio senhas com segurança, reviso permissões e valido plataformas',
      'Aplico práticas rigorosas de segurança digital, privacidade e isolamento',
    ]),
  },
  {
    id: 'tech-08',
    axis: 'tech',
    text: 'Você se sente capaz de aprender um software profissional com pouca orientação?',
    options: buildOptions([
      'Preciso de acompanhamento próximo para usar qualquer sistema novo',
      'Aprendo apenas ferramentas muito simples e intuitivas',
      'Aprendo sistemas novos assistindo a tutoriais curtos e praticando',
      'Exploro interfaces novas por conta própria e ganho fluência rápido',
      'Domino softwares complexos diretamente pela documentação e prática',
    ]),
  },
  {
    id: 'tech-09',
    axis: 'tech',
    text: 'Como você avalia sua habilidade para documentar um processo reproduzível?',
    options: buildOptions([
      'Faço tudo de cabeça, sem registrar etapas',
      'Faço anotações soltas apenas para não esquecer',
      'Organizo checklists simples para repetir tarefas sem erro',
      'Documento processos passo a passo com critérios claros de qualidade',
      'Construo playbooks, templates e procedimentos prontos para escalar',
    ]),
  },
  {
    id: 'tech-10',
    axis: 'tech',
    text: 'Você conseguiria resolver uma tarefa que exige pesquisa, validação de dados e atenção a detalhes?',
    options: buildOptions([
      'Prefiro tarefas rápidas que não exigem leitura ou verificação',
      'Consigo seguir instruções curtas com conferência simples',
      'Sigo diretrizes detalhadas e confiro as fontes solicitadas',
      'Realizo pesquisas comparativas, valido fatos e entrego com precisão',
      'Executo auditorias complexas, avaliação técnica de dados e revisão crítica',
    ]),
  },

  {
    id: 'risk-01',
    axis: 'risk',
    text: 'Como você reagiria se uma plataforma demorasse mais que o esperado para aprovar seu trabalho?',
    options: buildOptions([
      'Desistiria na mesma semana se a aprovação demorasse',
      'Ficaria inseguro e pausaria tudo até receber resposta',
      'Aguardaria o prazo padrão acompanhando o status com calma',
      'Aproveitaria a espera para preparar outras frentes em paralelo',
      'Trato filas e aprovações como parte normal de um portfólio de testes',
    ]),
  },
  {
    id: 'risk-02',
    axis: 'risk',
    text: 'Você aceitaria uma remuneração variável em troca de maior potencial de crescimento?',
    options: buildOptions([
      'Não; só aceito tarefas com valor fixo e previsível por entrega',
      'Prefiro valor fixo, aceitando apenas pequenos bônus pontuais',
      'Aceito combinar uma base previsível com ganhos variáveis',
      'Aceito remuneração majoritariamente variável ligada a desempenho',
      'Prefiro modelos escaláveis baseados em comissão, vendas ou resultado',
    ]),
  },
  {
    id: 'risk-03',
    axis: 'risk',
    text: 'Quanto desconforto você tolera ao testar um modelo ainda sem histórico no seu país?',
    options: buildOptions([
      'Nenhum; só entro em plataformas amplamente conhecidas em português',
      'Preciso ver relatos detalhados de brasileiros antes de tentar',
      'Testo plataformas globais desde que tenham boa reputação internacional',
      'Gosto de explorar plataformas internacionais pouco conhecidas no Brasil',
      'Busco ativamente oportunidades pioneiras para aproveitar baixa concorrência',
    ]),
  },
  {
    id: 'risk-04',
    axis: 'risk',
    text: 'Você consegue definir um limite de perda e interromper um teste quando ele é atingido?',
    options: buildOptions([
      'Não quero correr risco de perder nem tempo nem dinheiro',
      'Aceito arriscar apenas algumas horas em testes gratuitos',
      'Defino um limite pequeno de tempo e orçamento e paro se não houver sinal',
      'Planejo testes com teto claro de custo e métricas de corte objetivas',
      'Opero múltiplos experimentos com gestão disciplinada de risco e limite de perda',
    ]),
  },
  {
    id: 'risk-05',
    axis: 'risk',
    text: 'Você aceitaria depender de aprovação editorial, avaliação de cliente ou seleção por projeto?',
    options: buildOptions([
      'Não; quero atividades sem triagem ou risco de reprovação',
      'Aceito apenas cadastros simples com aprovação quase imediata',
      'Aceito fazer um teste prático inicial de qualificação',
      'Lido bem com envio de propostas, curadoria e avaliação de clientes',
      'Disputo projetos seletivos e processos competitivos de alto valor com naturalidade',
    ]),
  },
  {
    id: 'risk-06',
    axis: 'risk',
    text: 'Como você lida com mudanças frequentes nas regras, preços ou disponibilidade de uma plataforma?',
    options: buildOptions([
      'Preciso de regras fixas; mudanças frequentes me fazem parar',
      'Tenho dificuldade para me adaptar quando o funcionamento muda',
      'Acompanho os avisos e ajusto minha rotina quando necessário',
      'Adapto rapidamente meus processos e ofertas às novas regras',
      'Diversifico canais para que mudanças em uma plataforma não afetem minha renda',
    ]),
  },
  {
    id: 'risk-07',
    axis: 'risk',
    text: 'Você verificaria termos, privacidade e reputação antes de fornecer dados ou instalar software?',
    options: buildOptions([
      'Evito qualquer plataforma que exija leitura técnica de termos ou instalação',
      'Olho apenas comentários rápidos antes de decidir se continuo',
      'Leio as regras principais de pagamento e privacidade antes de aceitar',
      'Audito contrato, política de dados e histórico da empresa com critério',
      'Avalio risco jurídico, técnico e operacional com rigor antes de escalar',
    ]),
  },
  {
    id: 'risk-08',
    axis: 'risk',
    text: 'Você aceitaria testar uma campanha pequena antes de assumir uma operação maior?',
    options: buildOptions([
      'Não gosto de fazer testes sem garantia de resultado imediato',
      'Só faço testes se forem 100% gratuitos e sem exposição',
      'Rodo um teste pequeno e controlado antes de dedicar mais tempo',
      'Valido ofertas e campanhas em pequena escala para medir conversão real',
      'Estruturo ciclos contínuos de experimentação rápida antes de escalar',
    ]),
  },
  {
    id: 'risk-09',
    axis: 'risk',
    text: 'Quanto você tolera ter ganhos imprevisíveis durante os primeiros meses?',
    options: buildOptions([
      'Não tolero; preciso saber exatamente quanto vou receber no mês',
      'Tolero pouca variação e apenas nas primeiras semanas',
      'Aceito variação moderada durante os primeiros 2 meses',
      'Entendo que os primeiros meses são de construção e oscilação',
      'Aceito alta variabilidade inicial em troca de construir um ativo escalável',
    ]),
  },
  {
    id: 'risk-10',
    axis: 'risk',
    text: 'Você prefere validar uma hipótese com dados antes de tomar uma decisão financeira?',
    options: buildOptions([
      'Prefiro evitar qualquer decisão que envolva teste de hipóteses',
      'Sigo apenas roteiros prontos sem precisar testar variáveis',
      'Faço um teste simples e observo o resultado antes de avançar',
      'Coleto dados reais de demanda e custo antes de comprometer recursos',
      'Desenho experimentos com métricas claras para validar e escalar decisões',
    ]),
  },

  {
    id: 'social-01',
    axis: 'social',
    text: 'Quanto você gostaria de trabalhar nos bastidores, sem gravar vídeos ou expor sua imagem?',
    options: buildOptions([
      'Quero trabalhar 100% nos bastidores, sem jamais expor voz ou imagem',
      'Prefiro bastidores, interagindo apenas por mensagens escritas',
      'Posso gravar áudio ou vídeo pontualmente quando a tarefa exigir',
      'Fico confortável aparecendo em vídeos e chamadas com frequência',
      'Quero trabalhar aparecendo, gravando vídeos e construindo presença pública',
    ]),
  },
  {
    id: 'social-02',
    axis: 'social',
    text: 'Como você se sente ao conversar com clientes para entender necessidades e apresentar uma solução?',
    options: buildOptions([
      'Prefiro não ter contato direto com clientes',
      'Aceito apenas trocas curtas de mensagens por texto',
      'Converso bem quando o pedido já chega claro e estruturado',
      'Gosto de conduzir reuniões de diagnóstico e apresentar propostas',
      'Tenho alta energia para consultoria, vendas e negociação direta',
    ]),
  },
  {
    id: 'social-03',
    axis: 'social',
    text: 'Você teria disposição para publicar conteúdo com sua voz, rosto ou rotina?',
    options: buildOptions([
      'Nenhuma disposição; não quero gravar nem voz nem rosto',
      'Aceito apenas criar textos ou peças visuais sem minha voz ou imagem',
      'Aceito gravar a tela ou usar apenas minha voz em tutoriais',
      'Aceito aparecer em vídeos curtos e demonstrações de produtos (UGC)',
      'Gosto de gravar falando para a câmera e publicar conteúdo com frequência',
    ]),
  },
  {
    id: 'social-04',
    axis: 'social',
    text: 'Qual formato de comunicação combina mais com sua energia diária?',
    options: buildOptions([
      'Executar tarefas silenciosas em painel próprio, sem interação',
      'Mensagens escritas e assíncronas (e-mail ou formulário)',
      'Chat ativo e áudios pontuais com suporte ou clientes',
      'Chamadas de voz e vídeo agendadas com clientes ou equipes',
      'Comunicação intensa ao vivo, vídeos diários e interação aberta com público',
    ]),
  },
  {
    id: 'social-05',
    axis: 'social',
    text: 'Você consegue participar de entrevistas, testes moderados ou chamadas de pesquisa?',
    options: buildOptions([
      'Não; prefiro apenas tarefas escritas sem falar com ninguém',
      'Aceito apenas gravar minha tela falando sozinho, sem entrevistador',
      'Participo de chamadas curtas se houver roteiro claro',
      'Fico confortável em entrevistas ao vivo e testes moderados por vídeo',
      'Tenho total desenvoltura para conversar ao vivo e explicar minha experiência',
    ]),
  },
  {
    id: 'social-06',
    axis: 'social',
    text: 'Você prefere executar instruções individuais ou construir uma comunidade em torno de um tema?',
    options: buildOptions([
      'Quero apenas executar instruções individuais de forma independente',
      'Prefiro tarefas individuais com raro contato em fóruns',
      'Gosto de participar de grupos e trocar experiências, mas sem liderar',
      'Gosto de organizar grupos, responder dúvidas e apoiar membros',
      'Quero liderar uma comunidade ativa, ensinar e mobilizar pessoas',
    ]),
  },
  {
    id: 'social-07',
    axis: 'social',
    text: 'Quanto interesse você tem em negociar, fazer networking ou buscar parcerias?',
    options: buildOptions([
      'Nenhum interesse; prefiro plataformas onde as tarefas já estão disponíveis',
      'Faço contato apenas quando o cliente ou plataforma me procura',
      'Envio propostas estruturadas dentro de plataformas de trabalho',
      'Busco ativamente clientes, parceiros e oportunidades comerciais',
      'Gosto de prospectar, negociar parcerias e fechar negócios todos os dias',
    ]),
  },
  {
    id: 'social-08',
    axis: 'social',
    text: 'Você se sente confortável recebendo críticas públicas e ajustando sua oferta?',
    options: buildOptions([
      'Não quero nenhuma exposição a comentários ou críticas públicas',
      'Aceito apenas avaliações privadas e objetivas dentro de uma plataforma',
      'Lido de forma tranquila com feedbacks públicos ocasionais',
      'Uso comentários e críticas públicas para melhorar minha oferta sem desgaste',
      'Tenho alta resiliência pública e transformo objeções em engajamento',
    ]),
  },
  {
    id: 'social-09',
    axis: 'social',
    text: 'Você prefere produzir algo sozinho ou colaborar com clientes, marcas e equipes?',
    options: buildOptions([
      'Totalmente sozinho, sem depender de alinhamento com outras pessoas',
      'Sozinho na maior parte do tempo, com pontos de contato mínimos',
      'Equilíbrio entre execução individual e alinhamentos semanais',
      'Em colaboração frequente com clientes, marcas e briefings criativos',
      'Em contato diário com marcas, equipes, parceiros e audiência',
    ]),
  },
  {
    id: 'social-10',
    axis: 'social',
    text: 'Quanto você gostaria que sua renda dependesse de relacionamento e confiança com outras pessoas?',
    options: buildOptions([
      'Prefiro que dependa 100% de tarefas objetivas do sistema, sem relacionamento',
      'Prefiro que dependa quase tudo de critérios técnicos e pouco de contato',
      'Aceito um equilíbrio entre entrega técnica e bom relacionamento',
      'Quero construir carteira de clientes recorrentes baseada em confiança',
      'Quero que minha comunicação, rede e comunidade sejam meu principal ativo',
    ]),
  },
];
