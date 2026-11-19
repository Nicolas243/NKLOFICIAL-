export type AiDiagnosticAxis = 'goal' | 'level' | 'time' | 'confidence';

export type AiDiagnosticQuestion = {
  id: string;
  axis: AiDiagnosticAxis;
  prompt: string;
  options: readonly { label: string; value: number }[];
};

export const AI_DIAGNOSTIC_QUESTIONS: readonly AiDiagnosticQuestion[] = [
  {
    id: 'goal-1',
    axis: 'goal',
    prompt: 'O que você quer fazer primeiro com IA?',
    options: [
      { label: 'Aprender mais rápido', value: 1 },
      { label: 'Trabalhar com mais produtividade', value: 2 },
      { label: 'Criar conteúdo ou vender', value: 3 },
      { label: 'Programar e automatizar', value: 4 },
    ],
  },
  {
    id: 'level-1',
    axis: 'level',
    prompt: 'Como você se sente ao escrever um prompt?',
    options: [
      { label: 'Ainda não sei por onde começar', value: 1 },
      { label: 'Faço perguntas simples', value: 2 },
      { label: 'Já uso contexto e formato', value: 3 },
      { label: 'Construo fluxos e revisões', value: 4 },
    ],
  },
  {
    id: 'time-1',
    axis: 'time',
    prompt: 'Quanto tempo você consegue praticar por semana?',
    options: [
      { label: 'Até 30 minutos', value: 1 },
      { label: 'De 30 minutos a 2 horas', value: 2 },
      { label: 'De 2 a 5 horas', value: 3 },
      { label: 'Mais de 5 horas', value: 4 },
    ],
  },
  {
    id: 'confidence-1',
    axis: 'confidence',
    prompt: 'O que mais preocupa você ao usar IA?',
    options: [
      { label: 'Não saber se a resposta está certa', value: 1 },
      { label: 'Não conseguir explicar o que quero', value: 2 },
      { label: 'Expor dados ou cometer um erro', value: 3 },
      { label: 'Não transformar resposta em ação', value: 4 },
    ],
  },
  {
    id: 'goal-2',
    axis: 'goal',
    prompt: 'Qual entrega seria mais útil nesta semana?',
    options: [
      { label: 'Um plano de estudo', value: 1 },
      { label: 'Uma rotina de trabalho', value: 2 },
      { label: 'Uma peça de conteúdo', value: 3 },
      { label: 'Uma especificação técnica', value: 4 },
    ],
  },
  {
    id: 'level-2',
    axis: 'level',
    prompt: 'Você costuma revisar a resposta da IA?',
    options: [
      { label: 'Quase nunca', value: 1 },
      { label: 'Às vezes, quando lembro', value: 2 },
      { label: 'Sim, comparo com meu objetivo', value: 3 },
      { label: 'Sim, uso critérios e fontes', value: 4 },
    ],
  },
  {
    id: 'time-2',
    axis: 'time',
    prompt: 'Como você prefere aprender?',
    options: [
      { label: 'Uma explicação bem curta', value: 1 },
      { label: 'Exemplos práticos', value: 2 },
      { label: 'Exercícios com feedback', value: 3 },
      { label: 'Projetos completos', value: 4 },
    ],
  },
  {
    id: 'confidence-2',
    axis: 'confidence',
    prompt: 'Qual resultado faria você continuar estudando?',
    options: [
      { label: 'Conseguir uma primeira resposta útil', value: 1 },
      { label: 'Economizar tempo em uma tarefa', value: 2 },
      { label: 'Publicar ou entregar algo melhor', value: 3 },
      { label: 'Construir um processo repetível', value: 4 },
    ],
  },
];
