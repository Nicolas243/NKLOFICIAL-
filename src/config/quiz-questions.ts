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

const OPTIONS = {
  lowToHigh: [
    { label: 'Nenhuma disponibilidade', weight: 1 },
    { label: 'Até R$ 100', weight: 2 },
    { label: 'De R$ 101 a R$ 500', weight: 3 },
    { label: 'De R$ 501 a R$ 2.000', weight: 4 },
    { label: 'Acima de R$ 2.000', weight: 5 },
  ],
  littleToMuch: [
    { label: 'Menos de 2 horas', weight: 1 },
    { label: 'De 2 a 5 horas', weight: 2 },
    { label: 'De 6 a 10 horas', weight: 3 },
    { label: 'De 11 a 20 horas', weight: 4 },
    { label: 'Mais de 20 horas', weight: 5 },
  ],
  beginnerToAdvanced: [
    { label: 'Estou começando agora', weight: 1 },
    { label: 'Conheço o básico', weight: 2 },
    { label: 'Tenho prática em ferramentas digitais', weight: 3 },
    { label: 'Consigo resolver problemas técnicos', weight: 4 },
    { label: 'Tenho domínio técnico avançado', weight: 5 },
  ],
  cautiousToBold: [
    { label: 'Prefiro evitar qualquer incerteza', weight: 1 },
    { label: 'Aceito apenas riscos muito pequenos', weight: 2 },
    { label: 'Avalio o risco caso a caso', weight: 3 },
    { label: 'Aceito testar com limites definidos', weight: 4 },
    { label: 'Aceito alta incerteza por maior potencial', weight: 5 },
  ],
  behindScenesToPublic: [
    { label: 'Quero trabalhar sem aparecer', weight: 1 },
    { label: 'Prefiro contato escrito e assíncrono', weight: 2 },
    { label: 'Tanto faz, dependendo da atividade', weight: 3 },
    { label: 'Aceito reuniões e gravações pontuais', weight: 4 },
    { label: 'Gosto de aparecer e interagir com público', weight: 5 },
  ],
} satisfies Record<string, QuizOption[]>;

export const QUIZ_QUESTIONS: Question[] = [
  { id: 'capital-01', axis: 'capital', text: 'Quanto você consegue separar para testar uma oportunidade sem comprometer despesas essenciais?', options: OPTIONS.lowToHigh },
  { id: 'capital-02', axis: 'capital', text: 'Você consegue investir em ferramentas, anúncios ou equipamentos antes de receber o primeiro pagamento?', options: OPTIONS.lowToHigh },
  { id: 'capital-03', axis: 'capital', text: 'Qual valor mensal você aceitaria comprometer com software, internet ou serviços de apoio?', options: OPTIONS.lowToHigh },
  { id: 'capital-04', axis: 'capital', text: 'Você possui reserva para suportar um período de validação sem retorno imediato?', options: OPTIONS.lowToHigh },
  { id: 'capital-05', axis: 'capital', text: 'Quanto poderia reinvestir dos primeiros ganhos para ampliar uma operação que funcionou?', options: OPTIONS.lowToHigh },
  { id: 'capital-06', axis: 'capital', text: 'Você tem acesso a computador, celular e conexão adequados sem precisar comprá-los agora?', options: OPTIONS.lowToHigh },
  { id: 'capital-07', axis: 'capital', text: 'Qual é sua margem para pagar taxas, ferramentas ou materiais específicos de uma plataforma?', options: OPTIONS.lowToHigh },
  { id: 'capital-08', axis: 'capital', text: 'Você aceitaria começar com um orçamento pequeno para testar aquisição de clientes?', options: OPTIONS.lowToHigh },
  { id: 'capital-09', axis: 'capital', text: 'Quanto valor você consegue manter disponível para cobrir reembolsos, atrasos ou ajustes?', options: OPTIONS.lowToHigh },
  { id: 'capital-10', axis: 'capital', text: 'Você prefere modelos que não exigem investimento inicial mesmo que cresçam mais lentamente?', options: OPTIONS.lowToHigh },

  { id: 'time-01', axis: 'time', text: 'Quantas horas reais por semana você consegue reservar para executar e acompanhar uma oportunidade?', options: OPTIONS.littleToMuch },
  { id: 'time-02', axis: 'time', text: 'Com que frequência você consegue responder a clientes, briefings ou convites dentro do prazo?', options: OPTIONS.littleToMuch },
  { id: 'time-03', axis: 'time', text: 'Quanto tempo você tolera dedicar à configuração antes de realizar a primeira tarefa?', options: OPTIONS.littleToMuch },
  { id: 'time-04', axis: 'time', text: 'Você consegue manter uma rotina de produção ou publicação por várias semanas?', options: OPTIONS.littleToMuch },
  { id: 'time-05', axis: 'time', text: 'Quanto tempo diário você teria para aprender uma ferramenta nova e praticar?', options: OPTIONS.littleToMuch },
  { id: 'time-06', axis: 'time', text: 'Você pode trabalhar em horários fixos quando uma oportunidade exige disponibilidade?', options: OPTIONS.littleToMuch },
  { id: 'time-07', axis: 'time', text: 'Quanto tempo consegue esperar por aprovação, validação ou liberação de pagamento?', options: OPTIONS.littleToMuch },
  { id: 'time-08', axis: 'time', text: 'Você consegue dividir uma tarefa grande em entregas menores e acompanhar pendências?', options: OPTIONS.littleToMuch },
  { id: 'time-09', axis: 'time', text: 'Quanto espaço sua rotina tem para entrevistas, reuniões ou chamadas de onboarding?', options: OPTIONS.littleToMuch },
  { id: 'time-10', axis: 'time', text: 'Você consegue manter consistência mesmo quando o volume de tarefas oscila?', options: OPTIONS.littleToMuch },

  { id: 'tech-01', axis: 'tech', text: 'Como você avalia sua familiaridade com planilhas, formulários e ferramentas online?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-02', axis: 'tech', text: 'Você consegue instalar, configurar e testar aplicativos seguindo documentação?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-03', axis: 'tech', text: 'Como você lida com erros técnicos, integrações ou configurações que não funcionam de primeira?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-04', axis: 'tech', text: 'Você já usou automações, APIs, no-code ou ferramentas de inteligência artificial?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-05', axis: 'tech', text: 'Você consegue analisar métricas para decidir quais tarefas ou canais merecem mais esforço?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-06', axis: 'tech', text: 'Qual é sua capacidade de editar imagens, vídeos, áudio ou textos com ferramentas digitais?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-07', axis: 'tech', text: 'Você consegue proteger senhas, revisar permissões e identificar sinais de golpe?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-08', axis: 'tech', text: 'Você se sente capaz de aprender um software profissional com pouca orientação?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-09', axis: 'tech', text: 'Como você avalia sua habilidade para documentar um processo reproduzível?', options: OPTIONS.beginnerToAdvanced },
  { id: 'tech-10', axis: 'tech', text: 'Você conseguiria resolver uma tarefa que exige pesquisa, validação de dados e atenção a detalhes?', options: OPTIONS.beginnerToAdvanced },

  { id: 'risk-01', axis: 'risk', text: 'Como você reagiria se uma plataforma demorasse mais que o esperado para aprovar seu trabalho?', options: OPTIONS.cautiousToBold },
  { id: 'risk-02', axis: 'risk', text: 'Você aceitaria uma remuneração variável em troca de maior potencial de crescimento?', options: OPTIONS.cautiousToBold },
  { id: 'risk-03', axis: 'risk', text: 'Quanto desconforto você tolera ao testar um modelo ainda sem histórico no seu país?', options: OPTIONS.cautiousToBold },
  { id: 'risk-04', axis: 'risk', text: 'Você consegue definir um limite de perda e interromper um teste quando ele é atingido?', options: OPTIONS.cautiousToBold },
  { id: 'risk-05', axis: 'risk', text: 'Você aceitaria depender de aprovação editorial, avaliação de cliente ou seleção por projeto?', options: OPTIONS.cautiousToBold },
  { id: 'risk-06', axis: 'risk', text: 'Como você lida com mudanças frequentes nas regras, preços ou disponibilidade de uma plataforma?', options: OPTIONS.cautiousToBold },
  { id: 'risk-07', axis: 'risk', text: 'Você verificaria termos, privacidade e reputação antes de fornecer dados ou instalar software?', options: OPTIONS.cautiousToBold },
  { id: 'risk-08', axis: 'risk', text: 'Você aceitaria testar uma campanha pequena antes de assumir uma operação maior?', options: OPTIONS.cautiousToBold },
  { id: 'risk-09', axis: 'risk', text: 'Quanto você tolera ter ganhos imprevisíveis durante os primeiros meses?', options: OPTIONS.cautiousToBold },
  { id: 'risk-10', axis: 'risk', text: 'Você prefere validar uma hipótese com dados antes de tomar uma decisão financeira?', options: OPTIONS.cautiousToBold },

  { id: 'social-01', axis: 'social', text: 'Quanto você gostaria de trabalhar nos bastidores, sem gravar vídeos ou expor sua imagem?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-02', axis: 'social', text: 'Como você se sente ao conversar com clientes para entender necessidades e apresentar uma solução?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-03', axis: 'social', text: 'Você teria disposição para publicar conteúdo com sua voz, rosto ou rotina?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-04', axis: 'social', text: 'Qual formato de comunicação combina mais com sua energia diária?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-05', axis: 'social', text: 'Você consegue participar de entrevistas, testes moderados ou chamadas de pesquisa?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-06', axis: 'social', text: 'Você prefere executar instruções individuais ou construir uma comunidade em torno de um tema?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-07', axis: 'social', text: 'Quanto interesse você tem em negociar, fazer networking ou buscar parcerias?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-08', axis: 'social', text: 'Você se sente confortável recebendo críticas públicas e ajustando sua oferta?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-09', axis: 'social', text: 'Você prefere produzir algo sozinho ou colaborar com clientes, marcas e equipes?', options: OPTIONS.behindScenesToPublic },
  { id: 'social-10', axis: 'social', text: 'Quanto você gostaria que sua renda dependesse de relacionamento e confiança com outras pessoas?', options: OPTIONS.behindScenesToPublic },
];
