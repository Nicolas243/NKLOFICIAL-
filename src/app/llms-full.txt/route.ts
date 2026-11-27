import { getPartnerPrograms, type PartnerProgramCard } from '@/actions/partner-programs';
import { getAllStringsCatalog, type StringCatalogEntry } from '@/lib/seo/string-catalog-all';
import { absoluteSiteUrl } from '@/lib/site';

export const revalidate = 3600;

function formatPercent(part: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

function isDollarPayingProgram(program: PartnerProgramCard): boolean {
  const earning = program.averageEarning.toUpperCase();
  const payments = program.paymentMethods.join(' ').toUpperCase();
  return earning.includes('US$') || earning.includes('USD') || payments.includes('USD') || payments.includes('DÓLAR');
}

function supportsPortuguese(program: PartnerProgramCard): boolean {
  return program.languages.some((language) => language.toLowerCase().includes('português'));
}

function formatList(items: string[], fallback = 'Não informado'): string {
  return items.length > 0 ? items.join(', ') : fallback;
}

function formatPrice(value: string | null | undefined): string {
  if (!value || value.trim() === '') return 'Não informado';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `R$ ${numeric.toFixed(2)}` : value;
}

function formatProgramEntry(program: PartnerProgramCard): string {
  const zeroInvestment = program.zeroInvestmentRequired ? 'Sim' : 'Não';
  return [
    `### ${program.name}`,
    `- URL: ${absoluteSiteUrl(`/programas/${program.slug}`)}`,
    `- Categoria: ${program.category}`,
    `- Média de ganhos: ${program.averageEarning}`,
    `- Idiomas: ${formatList(program.languages)}`,
    `- Dificuldade: ${program.difficulty}`,
    `- Investimento inicial zero: ${zeroInvestment}`,
    `- Nota editorial: ${program.editorialRating}/10 (nota final ${program.finalRating.toFixed(1)}/10)`,
    `- Requisitos: ${formatList(program.requirements)}`,
    `- Meios de pagamento: ${formatList(program.paymentMethods)}`,
    `- Resumo: ${program.shortDescription}`,
  ].join('\n');
}

function formatStringEntry(item: StringCatalogEntry): string {
  return [
    `### ${item.name}`,
    `- URL: ${absoluteSiteUrl(`/catalogo/${item.id}`)}`,
    `- Material do núcleo: ${item.coreMaterial}`,
    `- Nível de qualidade: ${item.qualityLevel}`,
    `- Cor do som: ${item.soundColor}`,
    `- Projeção: ${item.projection}`,
    `- Velocidade de resposta: ${item.responseSpeed ?? 'Não informado'}`,
    `- Durabilidade: ${item.durability ?? 'Não informado'}`,
    `- Sensibilidade ao clima: ${item.climateSensitivity ?? 'Não informado'}`,
    `- Preço real de referência: ${formatPrice(item.realPrice)}`,
    `- Nota da comunidade: ${item.communityScore ?? '0.0'}/10`,
  ].join('\n');
}

export async function GET(): Promise<Response> {
  const [programs, strings] = await Promise.all([
    getPartnerPrograms().catch(() => []),
    getAllStringsCatalog().catch(() => []),
  ]);

  const totalPrograms = programs.length;
  const zeroInvestmentCount = programs.filter((program) => program.zeroInvestmentRequired).length;
  const dollarCount = programs.filter(isDollarPayingProgram).length;
  const portugueseCount = programs.filter(supportsPortuguese).length;

  const sections: string[] = [
    '# Portal NKL — Base Completa de Referência',
    '',
    'Portal NKL reúne catálogos verificados de renda extra e trabalho remoto, catálogo técnico de cordas de violino, guias de 6 idiomas e ferramentas práticas em português brasileiro.',
    `Metodologia editorial completa: ${absoluteSiteUrl('/metodologia')}`,
    '',
    '## Estatísticas ao Vivo do Catálogo',
    '',
    `- Programas publicados de renda extra: ${totalPrograms}`,
    `- Programas sem investimento inicial obrigatório: ${zeroInvestmentCount} (${formatPercent(zeroInvestmentCount, totalPrograms)})`,
    `- Programas com referência de pagamento em dólar (USD): ${dollarCount} (${formatPercent(dollarCount, totalPrograms)})`,
    `- Programas acessíveis em português: ${portugueseCount} (${formatPercent(portugueseCount, totalPrograms)})`,
    `- Modelos catalogados de cordas de violino: ${strings.length}`,
    '',
    '## Programas de Renda Extra Publicados',
    '',
    ...programs.map(formatProgramEntry),
    '',
    '## Catálogo Técnico de Cordas de Violino',
    '',
    ...strings.map(formatStringEntry),
    '',
    '## Guias de Referência Rápida (PT-BR)',
    '',
    '### MEI/CNPJ vs Pessoa Física e Carnê-Leão para Renda Online no Brasil',
    'Quem presta serviços digitais ou recebe por plataformas no Brasil deve separar pessoa física e pessoa jurídica conforme recorrência, teto anual e CNAE permitido. Como Pessoa Física, rendimentos recebidos de pessoas físicas ou do exterior sem retenção na fonte são apurados mensalmente no Carnê-Leão Web da Receita Federal e informados na declaração anual de IRPF. Ao formalizar como MEI (quando a atividade exercida consta na lista oficial de ocupações permitidas e respeita o limite legal de faturamento anual), o contribuinte passa a emitir nota fiscal e pagar a guia mensal DAS, mantendo atenção especial ao recebimento em moeda estrangeira via câmbio e às regras de exportação de serviços. Atividades não enquadradas no MEI exigem abertura de ME/Simples Nacional ou tributação na tabela progressiva da Pessoa Física.',
    '',
    '### Checklist Antifraude em 3 Minutos Antes de Entrar em Qualquer Plataforma',
    '1. Confirme se há cobrança prévia: plataformas legítimas de tarefas, pesquisas, testes ou treinamento de IA não cobram taxa para liberar cadastro, treinamento obrigatório pago ou desbloqueio de saque.',
    '2. Verifique domínio oficial, termos de uso e política de privacidade: desconfie de links encurtados, páginas sem razão social identificável ou contato exclusivo por mensageiro.',
    '3. Valide o fluxo de pagamento e requisitos reais: confirme país elegível (Brasil), moeda, valor mínimo de saque e métodos suportados (Pix, PayPal, Wise, Payoneer ou transferência) antes de enviar documentos.',
    '4. Proteja dados sensíveis: nunca envie senhas bancárias, códigos de autenticação ou fotos de documentos fora do ambiente oficial de verificação de identidade.',
    '',
    '### Cordas de Violino: Núcleo Sintético vs Aço vs Tripa',
    '- Núcleo sintético (náilon, perlon, fibras compostas): equilíbrio entre estabilidade de afinação, complexidade harmônica e resposta previsível; costuma ser a escolha padrão para estudo avançado, orquestra e câmara.',
    '- Núcleo de aço (sólido ou trançado): máxima estabilidade de afinação, ataque imediato, grande projeção e alta durabilidade; timbre mais direto e brilhante, comum em estudo inicial, música popular e ambientes ruidosos.',
    '- Núcleo de tripa (natural ou revestida): timbre quente, rico em harmônicos e resposta orgânica sob o arco, porém com maior sensibilidade à variação de umidade/temperatura e assentamento mais longo da afinação.',
    '',
    '### Impacto do Clima Úmido e Quente Brasileiro nas Cordas de Violino',
    'Regiões litorâneas e tropicais do Brasil combinam calor elevado e alta umidade relativa do ar, acelerando oxidação do enrolamento (especialmente alumínio e prata em cordas D/G) e ampliando variações de tensão em cordas de tripa e sintéticas mais sensíveis. Na prática, cordas com núcleo sintético de alta estabilidade ou núcleo metálico com revestimento anticorrosivo mantêm a afinação por mais tempo, exigem limpeza seca após cada estudo para remover suor e breu e se beneficiam de estojo vedado com controle básico de umidade.',
    '',
    '## Guias de Idiomas (90 Dias) e Ferramentas',
    '',
    `- Guias gratuitos de 6 idiomas com plano de 90 dias, 100 lições e exemplos práticos em ${absoluteSiteUrl('/idiomas')}: Inglês (/guias/ingles), Espanhol (/guias/espanhol), Italiano (/guias/italiano), Francês (/guias/frances), Alemão (/guias/alemao) e Mandarim (/guias/chines).`,
    `- Bússola de Negócios (${absoluteSiteUrl('/quiz-negocios')}): questionário interativo com 50 critérios sobre rotina, capital inicial, tempo disponível e perfil técnico para comparar modelos de negócio.`,
    `- IA na Prática (${absoluteSiteUrl('/ia')}), Estúdio IA na Prática (${absoluteSiteUrl('/ofertas/ferramenta-ia')}) e Curso IA na Prática (${absoluteSiteUrl('/ofertas/curso-ia-pratica')}): playbooks, prompts organizados e módulos passo a passo em português.`,
    `- Pacote Idiomas com IA (${absoluteSiteUrl('/ofertas/pacote-idiomas-ia')}), E-book de Inglês na Prática (${absoluteSiteUrl('/ofertas/ebook-ingles')}) e Pacote Guia Renda Extra (${absoluteSiteUrl('/ofertas/pacote-renda-extra')}).`,
    '',
  ];

  return new Response(sections.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
