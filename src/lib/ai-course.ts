export const AI_COURSE_PRODUCT_KEY = 'ai-na-pratica' as const;

export type AiCourseLesson = {
  id: string;
  title: string;
  objective: string;
  explanation: string;
  exampleBad: string;
  exampleBetter: string;
  exercise: string;
  checklist: readonly string[];
};

export type AiCourseModule = {
  slug: string;
  title: string;
  summary: string;
  lessons: readonly AiCourseLesson[];
};

export type AiProgress = {
  completed: number;
  total: number;
  percentage: number;
};

export const AI_COURSE_MODULES: readonly AiCourseModule[] = [
  {
    slug: 'pensar-com-ia',
    title: 'Como pensar com IA',
    summary: 'Entenda capacidades, limites, contexto, incerteza e revisão humana.',
    lessons: [
      {
        id: 'pensar-com-ia-contexto',
        title: 'Contexto é parte da resposta',
        objective: 'Aprender a fornecer objetivo, público e restrições antes de pedir uma resposta.',
        explanation: 'Um modelo responde melhor quando sabe o que você quer fazer, para quem e em qual formato.',
        exampleBad: 'Escreva um texto sobre marketing.',
        exampleBetter: 'Escreva um roteiro de 60 segundos para músicos iniciantes, em português simples, com uma dica prática e uma chamada para ação.',
        exercise: 'Reescreva um pedido vago do seu dia usando objetivo, público e formato.',
        checklist: ['Defini o resultado?', 'Expliquei para quem é?', 'Pedi um formato verificável?'],
      },
      {
        id: 'pensar-com-ia-limites',
        title: 'Quando não confiar na primeira resposta',
        objective: 'Reconhecer sinais de incerteza e decidir quando validar com uma fonte ou pessoa especialista.',
        explanation: 'Fluência não é prova de verdade. Quanto maior o impacto da decisão, maior deve ser o nível de verificação.',
        exampleBad: 'A resposta parece segura, então vou seguir.',
        exampleBetter: 'Liste o que nesta resposta é fato, hipótese ou recomendação. Indique quais pontos precisam de fonte atual antes de eu decidir.',
        exercise: 'Escolha uma resposta de IA e marque três afirmações que você verificaria.',
        checklist: ['Avaliei o impacto do erro?', 'Separei tom de evidência?', 'Defini como verificar?'],
      },
    ],
  },
  {
    slug: 'prompting',
    title: 'Prompting que funciona',
    summary: 'Monte pedidos claros, reutilizáveis e fáceis de revisar.',
    lessons: [
      {
        id: 'prompting-estrutura',
        title: 'A estrutura de um bom prompt',
        objective: 'Transformar uma intenção em instrução executável.',
        explanation: 'Um prompt útil combina papel, tarefa, contexto, restrições, formato e critério de qualidade.',
        exampleBad: 'Faça melhor.',
        exampleBetter: 'Atue como editor. Revise o texto abaixo para clareza e tom acolhedor. Preserve os fatos, liste as três alterações principais e devolva a versão final em até 180 palavras.',
        exercise: 'Crie um prompt para uma tarefa repetitiva que você executa toda semana.',
        checklist: ['A tarefa está isolada?', 'O modelo sabe o que preservar?', 'Existe um critério de qualidade?'],
      },
      {
        id: 'prompting-iteracao',
        title: 'Iterar sem recomeçar do zero',
        objective: 'Melhorar uma resposta usando feedback específico em vez de pedidos vagos.',
        explanation: 'Uma boa conversa com IA funciona como um ciclo: resultado, diagnóstico, ajuste e nova revisão.',
        exampleBad: 'Não gostei. Faça melhor.',
        exampleBetter: 'Mantenha os fatos e reduza o texto em 30%. Troque o tom para acolhedor, preserve o exemplo e entregue duas alternativas de título.',
        exercise: 'Pegue uma resposta mediana e escreva três instruções de melhoria observáveis.',
        checklist: ['Apontei o que preservar?', 'Pedi uma alteração por vez?', 'Defini como avaliar a nova versão?'],
      },
    ],
  },
  {
    slug: 'pesquisa-verificacao',
    title: 'Pesquisa e verificação',
    summary: 'Use IA para explorar sem confundir hipótese com fato.',
    lessons: [
      {
        id: 'pesquisa-verificacao-fontes',
        title: 'Pergunte por fontes e incerteza',
        objective: 'Separar fato confirmado, hipótese e ponto que precisa de verificação.',
        explanation: 'IA pode ajudar a organizar uma pesquisa, mas informações atuais e decisões importantes exigem fontes primárias.',
        exampleBad: 'Qual é a melhor plataforma? Responda com certeza.',
        exampleBetter: 'Compare estas plataformas usando critérios explícitos, indique o que depende de dados atuais e liste as fontes primárias que devo conferir.',
        exercise: 'Pegue uma decisão real e escreva cinco critérios antes de pedir uma comparação.',
        checklist: ['Usei fonte primária?', 'Separei certeza de hipótese?', 'Verifiquei a data?'],
      },
      {
        id: 'pesquisa-verificacao-checklist',
        title: 'Checklist para informação atual',
        objective: 'Montar uma rotina curta para verificar datas, autoria, contexto e conflito entre fontes.',
        explanation: 'Uma resposta pode misturar dados antigos, fontes secundárias e inferências. A verificação precisa ser explícita.',
        exampleBad: 'A IA citou um link, então a pesquisa acabou.',
        exampleBetter: 'Confirme a data de publicação, a fonte original, o contexto do dado e se outra fonte independente chega à mesma conclusão.',
        exercise: 'Compare duas fontes sobre o mesmo assunto e registre onde elas concordam e divergem.',
        checklist: ['Identifiquei a fonte original?', 'Conferi a data?', 'Procurei uma confirmação independente?'],
      },
    ],
  },
  {
    slug: 'texto-imagem-voz',
    title: 'Texto, imagem e voz',
    summary: 'Crie briefs melhores e revise o resultado antes de publicar.',
    lessons: [
      {
        id: 'texto-imagem-voz-brief',
        title: 'Brief antes da geração',
        objective: 'Descrever intenção, público, formato e limites de uma criação.',
        explanation: 'Ferramentas generativas produzem resultados mais consistentes quando recebem referências e critérios concretos.',
        exampleBad: 'Faça uma imagem bonita.',
        exampleBetter: 'Crie um briefing para uma imagem vertical de divulgação de aula de violino, público iniciante, visual acolhedor, espaço livre para título e sem texto ilegível gerado na imagem.',
        exercise: 'Escreva um brief para uma peça que você realmente precisa criar.',
        checklist: ['Defini o formato?', 'Defini o público?', 'Planejei revisão de direitos e acessibilidade?'],
      },
      {
        id: 'texto-imagem-voz-revisao',
        title: 'Revisão humana antes de publicar',
        objective: 'Avaliar clareza, acessibilidade, direitos e coerência antes de usar um conteúdo gerado.',
        explanation: 'Gerar é só uma etapa. A publicação exige revisar texto, imagens, vozes, referências e expectativas do público.',
        exampleBad: 'Publiquei porque ficou bonito.',
        exampleBetter: 'Revise contraste, texto alternativo, pronúncia, direitos de uso, afirmações factuais e se o resultado representa a intenção original.',
        exercise: 'Use o checklist em uma peça criada por IA e registre pelo menos uma correção.',
        checklist: ['O conteúdo é compreensível?', 'Há risco de direito ou representação?', 'Uma pessoa revisou o resultado?'],
      },
    ],
  },
  {
    slug: 'produtividade',
    title: 'Produtividade pessoal',
    summary: 'Converta tarefas grandes em próximos passos pequenos.',
    lessons: [
      {
        id: 'produtividade-plano',
        title: 'Plano com próxima ação',
        objective: 'Usar IA para sair de uma intenção abstrata para uma sequência executável.',
        explanation: 'A resposta precisa terminar em ações observáveis, não em uma lista inspiracional.',
        exampleBad: 'Me ajude a organizar minha vida.',
        exampleBetter: 'Converta estes compromissos em um plano semanal com no máximo cinco prioridades, próxima ação e risco de atraso. Não invente horários ausentes.',
        exercise: 'Transforme uma pendência sua em três próximas ações de até 25 minutos.',
        checklist: ['Cada passo começa com um verbo?', 'Evitei inventar informação?', 'Defini a próxima ação?'],
      },
      {
        id: 'produtividade-reuniao',
        title: 'De reunião a próximos passos',
        objective: 'Transformar anotações em decisões, responsáveis, prazos e pendências sem inventar acordos.',
        explanation: 'A IA pode organizar informação, mas não deve preencher lacunas como se fossem decisões tomadas.',
        exampleBad: 'Resuma e decida o que cada pessoa fará.',
        exampleBetter: 'Organize estas notas em decisões confirmadas, dúvidas, responsáveis explicitamente citados e próximos passos. Marque o que não foi definido.',
        exercise: 'Converta uma anotação real, sem dados sensíveis, em uma lista de ações verificáveis.',
        checklist: ['Separei decisão de sugestão?', 'Marquei campos ausentes?', 'Cada ação tem responsável ou pendência explícita?'],
      },
    ],
  },
  {
    slug: 'conteudo-negocios',
    title: 'Conteúdo e negócios',
    summary: 'Use IA para testar ideias sem substituir estratégia ou responsabilidade.',
    lessons: [
      {
        id: 'conteudo-negocios-oferta',
        title: 'Oferta antes da copy',
        objective: 'Clarificar problema, público e proposta antes de escrever uma página de vendas.',
        explanation: 'Uma copy bonita não corrige uma oferta confusa. Use IA para explorar objeções e alternativas, não para inventar prova social.',
        exampleBad: 'Crie uma página que venda muito.',
        exampleBetter: 'Analise esta oferta para iniciantes. Liste promessa verificável, entrega, objeções, riscos de interpretação e três versões de CTA sem urgência falsa.',
        exercise: 'Descreva uma oferta real em uma frase e peça uma análise de clareza.',
        checklist: ['A promessa é verificável?', 'A entrega está explícita?', 'Não inventei prova social?'],
      },
      {
        id: 'conteudo-negocios-experimento',
        title: 'Experimento antes da escala',
        objective: 'Usar IA para criar uma hipótese pequena e um critério de aprendizado sem prometer conversão.',
        explanation: 'IA ajuda a gerar variações, mas só um experimento com público real mostra o que merece investimento.',
        exampleBad: 'Crie uma campanha viral que venda muito.',
        exampleBetter: 'Proponha três hipóteses de mensagem para este público, um teste pequeno para cada uma e as métricas que indicariam aprendizado. Não invente resultados.',
        exercise: 'Planeje um experimento de uma semana com uma hipótese e uma métrica observável.',
        checklist: ['Defini uma hipótese?', 'O teste é pequeno e reversível?', 'Escolhi métrica sem confundir atenção com venda?'],
      },
    ],
  },
  {
    slug: 'codigo-seguranca',
    title: 'Código, automações e segurança',
    summary: 'Trabalhe com agentes sem entregar segredos, autoridade excessiva ou confiança cega.',
    lessons: [
      {
        id: 'codigo-seguranca-limites',
        title: 'Agente precisa de limites',
        objective: 'Definir escopo, permissões e validação para uma tarefa técnica.',
        explanation: 'Um agente deve receber o mínimo de contexto necessário e nunca ter acesso maior que o indispensável.',
        exampleBad: 'Faça tudo e altere o banco se precisar.',
        exampleBetter: 'Analise apenas estes arquivos, não altere produção, não execute migrations e rode apenas estes testes. Pare se faltar configuração.',
        exercise: 'Escreva um contrato de execução para uma tarefa técnica sua.',
        checklist: ['Defini arquivos permitidos?', 'Proibi ações irreversíveis?', 'Defini teste e critério de aceite?'],
      },
      {
        id: 'codigo-seguranca-revisao',
        title: 'Revisão de código gerado',
        objective: 'Avaliar código de IA por comportamento, segurança, testes e manutenção antes de aceitar a mudança.',
        explanation: 'Código que compila pode ainda vazar dados, ignorar autorização ou quebrar um caso importante.',
        exampleBad: 'Funcionou no meu exemplo, pode ir para produção.',
        exampleBetter: 'Revise entradas inválidas, autorização, segredos, concorrência, testes de erro e impacto nos contratos públicos antes de aprovar.',
        exercise: 'Escolha um trecho gerado e faça uma revisão com cinco riscos e um teste para cada risco relevante.',
        checklist: ['Testei entradas ruins?', 'Verifiquei autorização e segredos?', 'Rodei o teste mais próximo do risco?'],
      },
    ],
  },
];

export function getAiCourseModules(): readonly AiCourseModule[] {
  return AI_COURSE_MODULES;
}

export function getAiCourseLessons(): readonly AiCourseLesson[] {
  return AI_COURSE_MODULES.flatMap((module) => module.lessons);
}

export function calculateAiProgress(
  completedLessonIds: readonly string[],
  lessonIds: readonly string[],
): AiProgress {
  const lessonSet = new Set(lessonIds);
  const completed = new Set(completedLessonIds.filter((id) => lessonSet.has(id))).size;
  const total = lessonSet.size;
  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}
