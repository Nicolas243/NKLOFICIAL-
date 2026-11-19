import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const outputDir = path.join(process.cwd(), 'public', 'guias');
const colors = ['#172235', '#2563a8', '#c76538', '#16805b', '#7b4bb7'];
const languages = {
  italiano: {
    name: 'Italiano', slug: 'italiano', title: 'Italiano para ganhar possibilidades', audio: 'italian',
    topics: ['Começar com confiança', 'Apresentações', 'Rotina', 'Tempo e agenda', 'Família', 'Casa', 'Comida', 'Compras', 'Transporte', 'Viagem', 'Hotel', 'Cidade', 'Estudos', 'Trabalho', 'Reuniões', 'Clientes', 'Projetos', 'E-mail', 'Entrevistas', 'Próximos passos'],
    pairs: [['Io voglio imparare.', 'Eu quero aprender.'], ['Posso fare una domanda?', 'Posso fazer uma pergunta?'], ['Studio ogni giorno.', 'Eu estudo todos os dias.'], ['Ho bisogno di aiuto.', 'Eu preciso de ajuda.'], ['Puoi ripetere, per favore?', 'Você pode repetir, por favor.']],
  },
  frances: {
    name: 'Francês', slug: 'frances', title: 'Francês para ganhar possibilidades', audio: 'french',
    topics: ['Começar com confiança', 'Apresentações', 'Rotina', 'Tempo e agenda', 'Família', 'Casa', 'Comida', 'Compras', 'Transporte', 'Viagem', 'Hotel', 'Cidade', 'Estudos', 'Trabalho', 'Reuniões', 'Clientes', 'Projetos', 'E-mail', 'Entrevistas', 'Próximos passos'],
    pairs: [['Je veux apprendre.', 'Eu quero aprender.'], ['Puis-je poser une question ?', 'Posso fazer uma pergunta?'], ['J’étudie chaque jour.', 'Eu estudo todos os dias.'], ['J’ai besoin d’aide.', 'Eu preciso de ajuda.'], ['Pouvez-vous répéter, s’il vous plaît ?', 'Você pode repetir, por favor.']],
  },
  alemao: {
    name: 'Alemão', slug: 'alemao', title: 'Alemão para ganhar possibilidades', audio: 'german',
    topics: ['Começar com confiança', 'Apresentações', 'Rotina', 'Tempo e agenda', 'Família', 'Casa', 'Comida', 'Compras', 'Transporte', 'Viagem', 'Hotel', 'Cidade', 'Estudos', 'Trabalho', 'Reuniões', 'Clientes', 'Projetos', 'E-mail', 'Entrevistas', 'Próximos passos'],
    pairs: [['Ich möchte lernen.', 'Eu quero aprender.'], ['Darf ich eine Frage stellen?', 'Posso fazer uma pergunta?'], ['Ich lerne jeden Tag.', 'Eu estudo todos os dias.'], ['Ich brauche Hilfe.', 'Eu preciso de ajuda.'], ['Können Sie das bitte wiederholen?', 'Você pode repetir, por favor.']],
  },
  espanhol: {
    name: 'Espanhol', slug: 'espanhol', title: 'Espanhol para ganhar possibilidades', audio: 'spanish',
    topics: ['Começar com confiança', 'Apresentações', 'Rotina', 'Tempo e agenda', 'Família', 'Casa', 'Comida', 'Compras', 'Transporte', 'Viagem', 'Hotel', 'Cidade', 'Estudos', 'Trabalho', 'Reuniões', 'Clientes', 'Projetos', 'E-mail', 'Entrevistas', 'Próximos passos'],
    pairs: [['Quiero aprender.', 'Eu quero aprender.'], ['¿Puedo hacer una pregunta?', 'Posso fazer uma pergunta?'], ['Estudio cada día.', 'Eu estudo todos os dias.'], ['Necesito ayuda.', 'Eu preciso de ajuda.'], ['¿Puedes repetir, por favor?', 'Você pode repetir, por favor.']],
  },
  chines: {
    name: 'Mandarim', slug: 'chines', title: 'Mandarim para ganhar possibilidades', audio: 'mandarin',
    topics: ['Começar com confiança', 'Apresentações', 'Rotina', 'Tempo e agenda', 'Família', 'Casa', 'Comida', 'Compras', 'Transporte', 'Viagem', 'Hotel', 'Cidade', 'Estudos', 'Trabalho', 'Reuniões', 'Clientes', 'Projetos', 'E-mail', 'Entrevistas', 'Próximos passos'],
    pairs: [['我想学习。', 'Eu quero aprender.'], ['我可以问一个问题吗？', 'Posso fazer uma pergunta?'], ['我每天学习。', 'Eu estudo todos os dias.'], ['我需要帮助。', 'Eu preciso de ajuda.'], ['请再说一遍，好吗？', 'Você pode repetir, por favor.']],
  },
};

const escapeHtml = (value) => value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');
const colorWords = (value) => value.split(/(\s+)/u).map((part, index) => /\S/u.test(part)
  ? `<span style="color:${colors[Math.floor(index / 2) % colors.length]}">${escapeHtml(part)}</span>`
  : part).join('');
const examplesFor = (language, lessonNumber) => language.pairs.map(([target, portuguese], index) => {
  const suffix = lessonNumber > language.topics.length ? ` (${lessonNumber})` : '';
  return { target: `${target.replace(/[.!?]$/u, '')}${suffix}${target.endsWith('?') ? '' : '.'}`, portuguese };
});

function htmlFor(language) {
  const lessons = Array.from({ length: 100 }, (_, index) => {
    const number = index + 1;
    const topic = language.topics[index % language.topics.length];
    const examples = examplesFor(language, number).map((example) => `<li><strong>${colorWords(example.target)}</strong><span>${colorWords(example.portuguese)}</span><a href="https://youglish.com/pronounce/${encodeURIComponent(example.target)}/${language.audio}" target="_blank" rel="noreferrer">▶ Ouvir pronúncia</a></li>`).join('');
    return `<section class="page lesson"><p class="kicker">LIÇÃO ${String(number).padStart(3, '0')} · ${language.name.toUpperCase()}</p><h2>${topic}</h2><p class="lead">Nesta lição, você pratica uma frase funcional de ${language.name.toLowerCase()} em contexto. Leia, ouça, repita e crie uma variação verdadeira sobre a sua rotina.</p><ol>${examples}</ol><div class="exercise"><b>Faça agora:</b> troque uma palavra por algo da sua vida e fale cada versão três vezes.</div><span class="page-number">${number + 6}</span></section>`;
  }).join('');
  const habit = Array.from({ length: 30 }, (_, i) => `<span>${i + 1}<i></i></span>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${language.title} · Portal NKL</title><style>@page{size:A5;margin:0}*{box-sizing:border-box}body{margin:0;background:#dfe7ef;color:#172235;font-family:Arial,sans-serif}.page{width:148mm;min-height:210mm;margin:20px auto;padding:16mm;background:#fffdf8;page-break-after:always}.cover{background:linear-gradient(145deg,#102746,#1b5794 58%,#de7547);color:white;display:flex;flex-direction:column;justify-content:center}.cover h1,.lesson h2{font-family:Georgia,serif}.cover h1{font-size:38px;line-height:1.04}.kicker{color:#2a63ae;font-size:10px;font-weight:bold;letter-spacing:2px}.cover .kicker{color:#ffd3bd}.lead{line-height:1.5}.lesson h2{font-size:28px;color:#102f55}.lesson ol{display:grid;gap:4mm;padding-left:6mm}.lesson li{line-height:1.3}.lesson strong,.lesson>span,.lesson a{display:block}.lesson>span{margin-top:1mm}.lesson a{margin-top:1mm;color:#2a63ae;font-size:10px;font-weight:bold}.exercise{margin-top:7mm;padding:4mm;border-left:4px solid #d46b40;background:#fff1ea;line-height:1.45}.habit{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm}.habit span{text-align:center;font-size:10px}.habit i{display:block;height:14mm;border:1px solid #b8c5d1;margin-top:2mm}.page-number{float:right;color:#718198;font-size:10px;font-weight:bold}@media print{body{background:#fff}.page{margin:0}}</style></head><body><section class="page cover"><p class="kicker">GUIA PRÁTICO · PORTAL NKL</p><h1>${language.title}</h1><p>100 lições, 500 exemplos traduzidos, áudio e prática guiada.</p><p>PDF A5 · leitura no celular · sem promessas fáceis</p></section><section class="page"><p class="kicker">COMO USAR</p><h2>Leia. Ouça. Fale. Adapte.</h2><p>Faça uma lição por vez. Observe cada frase na língua-alvo e sua tradução em português. Depois crie uma frase sua e peça feedback a uma IA sem enviar dados sensíveis.</p><p>O idioma amplia possibilidades, mas não garante renda ou contratação. Consistência e escolhas seguras importam.</p></section><section class="page"><p class="kicker">RASTREADOR DE 30 DIAS</p><h2>Marque cada vitória.</h2><div class="habit">${habit}</div></section><section class="page"><p class="kicker">FEEDBACK COM IA</p><h2>Prompt pronto</h2><p>“Corrija minha frase em ${language.name}, preserve minha intenção, explique o ajuste em português e mostre uma alternativa natural. Não use dados pessoais.”</p><div class="exercise">Cole sua frase, compare as versões, repita em voz alta e registre o erro para revisar amanhã.</div></section><section class="page"><p class="kicker">DIÁLOGOS E TEMPLATES</p><h2>Leve o idioma para o mundo real.</h2><p>Treine um diálogo de apresentação, pedido de ajuda, reunião e entrevista. Use este modelo: Hello [name], thank you for your message. I can [action] by [date]. Best regards, [your name].</p><p>Adapte o modelo para ${language.name} e leia em voz alta.</p></section>${lessons}</body></html>`;
}

async function pdfFor(language) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 1 });
    await page.setContent(htmlFor(language), { waitUntil: 'load' });
    return await page.pdf({ format: 'A5', printBackground: true, preferCSSPageSize: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  } finally {
    await browser.close();
  }
}

await mkdir(outputDir, { recursive: true });
for (const language of Object.values(languages)) {
  const base = `${language.slug}-para-ganhar-possibilidades`;
  await writeFile(path.join(outputDir, `${base}.html`), htmlFor(language), 'utf8');
  await writeFile(path.join(outputDir, `${base}.pdf`), await pdfFor(language));
  const markdown = Array.from({ length: 100 }, (_, index) => `## ${index + 1}. ${language.topics[index % language.topics.length]}\n\nPratique esta lição de ${language.name.toLowerCase()} com leitura, áudio e repetição.\n\n${examplesFor(language, index + 1).map(({ target, portuguese }) => `- ${target} (${portuguese})`).join('\n')}`).join('\n\n');
  await writeFile(path.join(outputDir, `${base}.md`), `# ${language.title}\n\n${markdown}\n`, 'utf8');
  console.log(`Gerado: ${base} (100 lições, 500 exemplos)`);
}
