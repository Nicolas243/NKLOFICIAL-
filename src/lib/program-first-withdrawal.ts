export type FirstWithdrawalGuide = {
  steps: string[];
  note: string;
};

const PROFILE_AND_BRIEF_GUIDE = (platform: string): FirstWithdrawalGuide => ({
  steps: [
    `Crie o perfil em ${platform}, confirme seu e-mail e complete apenas os dados solicitados pela plataforma.`,
    'Leia o briefing disponível e candidate-se somente a uma tarefa compatível com seu equipamento, região e prazo.',
    'Confirme antes de começar o formato da entrega, o uso de imagem, as revisões e o valor ou critério de pagamento.',
    'Envie o material pelo fluxo oficial e acompanhe o status até a aprovação; guarde o comprovante da entrega.',
    'Cadastre o método de recebimento aceito, aguarde a liberação do saldo e solicite o primeiro saque quando a plataforma permitir.',
  ],
  note: 'Campanhas, valores, prazos e métodos de pagamento variam por região e podem mudar. A aprovação da entrega é necessária.',
});

const STUDY_AND_TASK_GUIDE = (platform: string): FirstWithdrawalGuide => ({
  steps: [
    `Abra sua conta na ${platform}, confirme a identidade ou o perfil solicitado e preencha as informações de qualificação.`,
    'Responda às perguntas de triagem com dados verdadeiros para receber apenas tarefas compatíveis com você.',
    'Aceite uma tarefa antes do prazo, confira a remuneração exibida e conclua tudo dentro das instruções.',
    'Aguarde a revisão ou aprovação e confira se o valor entrou no saldo disponível.',
    'Adicione o método de recebimento e peça o saque quando o saldo mínimo e as regras da plataforma forem atendidos.',
  ],
  note: 'Não há garantia de convites ou de renda. Disponibilidade, revisão, saldo mínimo e prazo de retirada dependem da plataforma.',
});

const AFFILIATE_GUIDE = (platform: string): FirstWithdrawalGuide => ({
  steps: [
    `Cadastre-se no programa de afiliados da ${platform} e conclua a aprovação ou a validação do canal.`,
    'Crie um link de rastreamento para um produto, campanha ou página que realmente combine com seu público.',
    'Publique uma recomendação original, informe que existe comissão e evite prometer desconto, aprovação ou ganho.',
    'Acompanhe cliques, conversões e o período de validação no painel; vendas canceladas normalmente não são elegíveis.',
    'Cadastre o método de pagamento e solicite ou aguarde o repasse quando a conversão estiver aprovada e o mínimo for atingido.',
  ],
  note: 'Comissão só é liberada após a conversão elegível e o período de validação. Regras, aprovação e prazos são definidos pela plataforma.',
});

const FIRST_WITHDRAWAL_GUIDES: Record<string, FirstWithdrawalGuide> = {
  fluencify: PROFILE_AND_BRIEF_GUIDE('Fluencify'),
  prolific: STUDY_AND_TASK_GUIDE('Prolific'),
  'mercado-pago': {
    steps: [
      'Abra ou acesse sua conta do Mercado Pago e confira no próprio app se existe uma campanha de indicação vigente para você.',
      'Leia os critérios da campanha: quem pode ser indicado, qual ação precisa ser concluída e até quando.',
      'Compartilhe o link ou código oficial apenas com alguém que autorizou receber a indicação.',
      'Acompanhe no app se a indicação foi reconhecida e se a pessoa cumpriu todos os critérios dentro do prazo.',
      'Depois da validação, confira o crédito na carteira e transfira ou use o saldo conforme as opções disponíveis.',
    ],
    note: 'A recompensa não é automática para toda indicação. Campanhas, valores, limites e elegibilidade mudam e devem ser conferidos no app.',
  },
  honeygain: {
    steps: [
      'Instale o Honeygain pelos canais oficiais, crie a conta e confirme o e-mail.',
      'Revise permissões, política de privacidade e consumo de dados antes de ativar o compartilhamento.',
      'Deixe o aplicativo ativo apenas em uma conexão e dispositivo permitidos, acompanhando o saldo no painel.',
      'Confirme o saldo mínimo e o método de pagamento atualmente disponível para sua região.',
      'Solicite o pagamento pelo painel e acompanhe a verificação até o crédito ou a confirmação do provedor.',
    ],
    note: 'O retorno depende de país, demanda, dispositivo e regras vigentes. Não trate o compartilhamento de conexão como renda garantida.',
  },
  apphub: PROFILE_AND_BRIEF_GUIDE('AppHub'),
  'quintoandar-indica-ai': {
    steps: [
      'Acesse o Indica Aí e leia os critérios atuais para cidade, tipo de imóvel e autorização do proprietário.',
      'Peça consentimento explícito antes de enviar nome, telefone ou qualquer dado de outra pessoa.',
      'Envie a indicação pelo formulário oficial, com dados corretos e informações que você possa comprovar.',
      'Acompanhe o status no canal indicado pelo QuintoAndar e aguarde a publicação ou a conclusão do negócio.',
      'Depois da validação, confira o crédito e as instruções de recebimento no programa; não conte com prazo ou valor fora dos termos.',
    ],
    note: 'Valores, cidades, prazos e critérios podem mudar. Só indique imóveis e dados com autorização do proprietário.',
  },
  billo: PROFILE_AND_BRIEF_GUIDE('Billo'),
  'claru-ia': STUDY_AND_TASK_GUIDE('Claru IA'),
  crowdata: STUDY_AND_TASK_GUIDE('Crowddata'),
  oneforma: STUDY_AND_TASK_GUIDE('OneForma'),
  'outlier-ai': STUDY_AND_TASK_GUIDE('Outlier AI'),
  utest: {
    steps: [
      'Crie o perfil no uTest, confirme seus dados e registre dispositivos, sistemas e idiomas que você realmente domina.',
      'Complete os surveys de qualificação e candidate-se a um ciclo de testes compatível com seu perfil.',
      'Leia o escopo do ciclo, reproduza o caso com atenção e registre um bug válido com passos, evidência e ambiente.',
      'Acompanhe a triagem: o relatório precisa ser aceito e não duplicado para gerar pagamento.',
      'Confira o saldo e o método disponível no painel e solicite o saque quando as regras do uTest forem atendidas.',
    ],
    note: 'O pagamento depende da aceitação do bug ou da tarefa. Convites, valores, prazos e métodos podem variar.',
  },
  dataannotation: STUDY_AND_TASK_GUIDE('DataAnnotation'),
  aligner: STUDY_AND_TASK_GUIDE('Aligner'),
  'marketplaces-afiliados': AFFILIATE_GUIDE('marketplaces escolhido'),
  'tiktok-shop': AFFILIATE_GUIDE('TikTok Shop'),
  'ugc-roster': PROFILE_AND_BRIEF_GUIDE('UGC Roster'),
  'creator-space': PROFILE_AND_BRIEF_GUIDE('Creator Space'),
  'canal-dark-youtube-notebooklm': {
    steps: [
      'Escolha um tema original, abra o canal e configure identidade, descrição e contato profissional sem copiar outro criador.',
      'Publique uma série inicial com roteiro próprio, fontes verificáveis e materiais com licença ou autoria comprovada.',
      'Acompanhe retenção, cliques e comentários; ajuste o formato sem comprar visualizações ou usar conteúdo reutilizado sem transformação.',
      'Ative somente as formas de monetização para as quais o canal estiver elegível, como anúncios, afiliados ou produto próprio.',
      'Quando houver saldo elegível, conclua a verificação e aguarde o pagamento pelo método configurado no programa correspondente.',
    ],
    note: 'Audiência e monetização não são imediatas. Cada programa tem requisitos, revisão e prazos próprios; conteúdo original é indispensável.',
  },
  'pawns-app': {
    steps: [
      'Instale o Pawns.app pelo canal oficial, crie a conta e confirme o e-mail.',
      'Revise permissões, regras de uso e consumo de dados antes de ativar qualquer recurso.',
      'Use apenas os recursos permitidos para sua região e acompanhe o saldo sem instalar versões modificadas.',
      'Confira o mínimo de retirada e os métodos disponíveis para o seu país.',
      'Solicite o pagamento no app e acompanhe a aprovação ou verificação solicitada.',
    ],
    note: 'Saldo e disponibilidade dependem de país, demanda, dispositivo e regras vigentes.',
  },
  attapoll: STUDY_AND_TASK_GUIDE('AttaPoll'),
  'testes-ux-narrados': STUDY_AND_TASK_GUIDE('plataforma de testes UX'),
  'comunidades-pagas-skool-systeme': {
    steps: [
      'Escolha um tema que você consiga ensinar e configure a comunidade com uma oferta clara, regras e política de cancelamento.',
      'Publique uma amostra gratuita ou uma aula de demonstração para validar se o público entende o valor.',
      'Convide os primeiros membros por canais permitidos, sem spam, e entregue o conteúdo prometido dentro do prazo.',
      'Confirme uma assinatura ou venda aprovada no painel e acompanhe eventuais reembolsos.',
      'Configure o método de recebimento e aguarde o repasse conforme o calendário da plataforma de comunidade.',
    ],
    note: 'O primeiro recebimento depende de vender uma oferta real e cumprir as regras da comunidade e do processador de pagamentos.',
  },
  'montink-embaixador': AFFILIATE_GUIDE('Montink'),
  'serp-raters-welocalize-telus': STUDY_AND_TASK_GUIDE('programa de avaliação de busca'),
  'entrevistas-b2b-respondent-user-interviews': STUDY_AND_TASK_GUIDE('plataforma de entrevistas B2B'),
  'afiliados-b2b-tubebuddy-make': AFFILIATE_GUIDE('programa B2B escolhido'),
  'redes-cpa-affiliaxe': AFFILIATE_GUIDE('rede CPA'),
  'monetizacao-atencao-web': {
    steps: [
      'Cadastre-se no serviço oficial e confirme se seu país, navegador e dispositivo são elegíveis.',
      'Leia a política de privacidade e habilite somente o recurso de monetização que você entende e aceita.',
      'Use o serviço dentro das regras e acompanhe impressões, tarefas ou saldo no painel.',
      'Verifique se o saldo foi validado e se não há bloqueio, chargeback ou período de retenção.',
      'Configure o método de recebimento e solicite o primeiro saque quando o mínimo exigido estiver disponível.',
    ],
    note: 'Retorno, elegibilidade e disponibilidade variam. Nunca instale extensões fora do domínio oficial.',
  },
};

export function getFirstWithdrawalGuide(slug: string): FirstWithdrawalGuide {
  return FIRST_WITHDRAWAL_GUIDES[slug] ?? {
    steps: [
      'Crie a conta no site oficial, confirme o e-mail e confira se o programa aceita participantes da sua região.',
      'Complete o perfil e faça uma tarefa ou conversão elegível seguindo as instruções oficiais.',
      'Acompanhe a aprovação no painel e corrija pendências antes de repetir a atividade.',
      'Cadastre o método de recebimento aceito e confira o saldo mínimo vigente.',
      'Solicite o primeiro saque ou aguarde o repasse automático depois da validação.',
    ],
    note: 'Este roteiro é operacional e não promete renda. Confirme regras, saldo mínimo, prazos e impostos na plataforma.',
  };
}
