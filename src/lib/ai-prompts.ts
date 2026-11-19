export type AiPromptCategory =
  | 'aprender'
  | 'pesquisar'
  | 'escrever'
  | 'criar-conteudo'
  | 'vender'
  | 'organizar'
  | 'programar'
  | 'revisar-seguranca';

export type AiPrompt = {
  id: string;
  category: AiPromptCategory;
  title: string;
  level: 'iniciante' | 'intermediario' | 'avancado';
  fields: readonly string[];
  template: string;
  qualityCriteria: readonly string[];
  safetyNote?: string;
};

export const AI_PROMPTS: readonly AiPrompt[] = [
  {
    id: 'aprender-plano',
    category: 'aprender',
    title: 'Plano de estudo com prática',
    level: 'iniciante',
    fields: ['tema', 'nivel', 'tempo_disponivel', 'objetivo'],
    template: 'Crie um plano de estudo de {{tema}} para nível {{nivel}}, com {{tempo_disponivel}} por semana e objetivo {{objetivo}}. Divida em sessões curtas, inclua prática e indique como verificar meu progresso. Não invente fontes.',
    qualityCriteria: ['Inclui prática observável', 'Respeita o tempo disponível', 'Tem critério de progresso'],
  },
  {
    id: 'pesquisar-comparacao',
    category: 'pesquisar',
    title: 'Comparação com critérios e fontes',
    level: 'intermediario',
    fields: ['opcoes', 'objetivo', 'restricoes'],
    template: 'Compare {{opcoes}} para o objetivo {{objetivo}}, considerando {{restricoes}}. Explicite critérios, incertezas, dados que podem estar desatualizados e fontes primárias que devo conferir. Não escolha um vencedor sem justificar.',
    qualityCriteria: ['Explicita critérios', 'Separa fato de hipótese', 'Indica necessidade de verificação'],
    safetyNote: 'Não cole dados confidenciais, credenciais ou informações pessoais.',
  },
  {
    id: 'escrever-revisao',
    category: 'escrever',
    title: 'Revisão com preservação de fatos',
    level: 'iniciante',
    fields: ['texto', 'publico', 'tom', 'limite'],
    template: 'Atue como editor. Revise o texto abaixo para {{publico}}, com tom {{tom}} e limite de {{limite}}. Preserve os fatos, marque afirmações que precisam de fonte e liste as principais alterações antes da versão final.\n\nTexto:\n{{texto}}',
    qualityCriteria: ['Preserva fatos', 'Sinaliza incertezas', 'Entrega versão dentro do limite'],
    safetyNote: 'Remova nomes, documentos, contatos e dados de clientes antes de enviar.',
  },
  {
    id: 'programar-especificacao',
    category: 'programar',
    title: 'Especificação técnica testável',
    level: 'avancado',
    fields: ['problema', 'arquivos_permitidos', 'fora_escopo', 'comando_validacao'],
    template: 'Atue como engenheiro principal. Transforme este problema em uma especificação mínima: {{problema}}. Arquivos permitidos: {{arquivos_permitidos}}. Fora do escopo: {{fora_escopo}}. Critério de aceite e comando de validação: {{comando_validacao}}. Não execute ações irreversíveis nem invente contratos.',
    qualityCriteria: ['Define escopo', 'Define aceite mensurável', 'Inclui validação'],
    safetyNote: 'Nunca inclua segredos, tokens ou autorização de produção.',
  },
  {
    id: 'criar-conteudo-brief',
    category: 'criar-conteudo',
    title: 'Brief de conteúdo com revisão',
    level: 'intermediario',
    fields: ['formato', 'publico', 'objetivo', 'referencias', 'limites'],
    template: 'Crie um brief de conteúdo no formato {{formato}} para {{publico}}, com objetivo {{objetivo}}. Use estas referências: {{referencias}}. Respeite estes limites: {{limites}}. Entregue ângulo, estrutura, chamada para ação e checklist de acessibilidade. Não invente dados ou depoimentos.',
    qualityCriteria: ['Define público e objetivo', 'Inclui limites verificáveis', 'Prevê revisão antes da publicação'],
  },
  {
    id: 'vender-analisar-oferta',
    category: 'vender',
    title: 'Análise de oferta sem promessa falsa',
    level: 'intermediario',
    fields: ['oferta', 'publico', 'provas_reais', 'restricoes'],
    template: 'Analise esta oferta: {{oferta}} para o público {{publico}}. Considere apenas estas provas reais: {{provas_reais}} e estas restrições: {{restricoes}}. Liste promessa verificável, objeções, riscos de interpretação, melhorias de clareza e três CTAs honestos. Não invente urgência, escassez ou resultado.',
    qualityCriteria: ['Separa promessa de prova', 'Expõe objeções', 'Evita manipulação e garantia indevida'],
  },
  {
    id: 'organizar-proxima-acao',
    category: 'organizar',
    title: 'Próximas ações sem inventar',
    level: 'iniciante',
    fields: ['pendencias', 'tempo', 'restricoes'],
    template: 'Organize estas pendências: {{pendencias}} em um plano para {{tempo}}. Respeite estas restrições: {{restricoes}}. Para cada item, indique próxima ação, dependência, risco e o que ainda precisa ser decidido. Não invente horários, responsáveis ou informações ausentes.',
    qualityCriteria: ['Gera ações observáveis', 'Marca lacunas', 'Respeita tempo e restrições'],
  },
  {
    id: 'revisar-seguranca-dados',
    category: 'revisar-seguranca',
    title: 'Triagem de privacidade antes de enviar',
    level: 'avancado',
    fields: ['conteudo', 'objetivo', 'ferramenta'],
    template: 'Faça uma triagem de privacidade deste conteúdo antes de eu enviar para {{ferramenta}}: {{conteudo}}. Meu objetivo é {{objetivo}}. Identifique dados pessoais, segredos, informações de terceiros, riscos de retenção e uma versão minimizada do pedido. Não reproduza os dados sensíveis na resposta.',
    qualityCriteria: ['Identifica categorias de risco', 'Propõe minimização', 'Não replica segredos ou dados pessoais'],
    safetyNote: 'Faça a triagem localmente sempre que o conteúdo já contiver credenciais ou documentos sensíveis.',
  },
];

export function getAiPromptCategories(): readonly AiPromptCategory[] {
  return [...new Set(AI_PROMPTS.map((prompt) => prompt.category))];
}

export function getAiPromptById(id: string): AiPrompt | null {
  return AI_PROMPTS.find((prompt) => prompt.id === id) ?? null;
}
