import { readFile, writeFile } from 'node:fs/promises';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PDFName as CorePDFName, PDFString as CorePDFString } from 'pdf-lib/cjs/core/index.js';

const sourcePath = 'public/guias/ingles-para-ganhar-dinheiro.md';
const htmlPath = 'public/guias/ingles-para-ganhar-dinheiro.html';
const pdfPath = 'public/guias/ingles-para-ganhar-dinheiro.pdf';
const markdown = await readFile(sourcePath, 'utf8');

function parseLessons(source) {
  const lessons = [];
  let current = null;
  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();
    const heading = line.match(/^##\s+(\d+)\.\s+(.+)$/u);
    if (heading) {
      current = { number: Number(heading[1]), title: heading[2], paragraphs: [], bullets: [] };
      lessons.push(current);
    } else if (current && /^-\s+/u.test(line)) {
      current.bullets.push(line.replace(/^-\s+/u, ''));
    } else if (current && line && !line.startsWith('#')) {
      current.paragraphs.push(line);
    }
  }
  return lessons;
}

function escapeHtml(value) {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;');
}

function splitExample(value) {
  const match = value.match(/^(.*?)\s+\((.+)\)$/u);
  return match ? { english: match[1], portuguese: match[2] } : { english: value, portuguese: '' };
}

const exampleColors = ['#172235', '#2563a8', '#c76538', '#16805b', '#7b4bb7', '#9a5c14'];

const translationHints = {
  i: ['eu'], want: ['quero', 'quer'], study: ['estudar', 'estudo'], online: ['on-line', 'online'],
  learn: ['aprender', 'aprendo'], english: ['inglês'], find: ['encontrar', 'encontro'], better: ['melhor'],
  work: ['trabalho', 'trabalhar', 'trabalha'], speak: ['falar', 'fala'], clients: ['clientes'],
  to: [], am: ['sou', 'estou'], is: ['é', 'está'], are: ['são', 'estão'], my: ['meu', 'minha'],
  name: ['nome'], live: ['moro', 'vive'], in: ['em', 'no', 'na'], from: ['de'], with: ['com'],
  you: ['você', 'vocês'], need: ['preciso', 'precisa', 'precisamos'], help: ['ajuda', 'ajudar'],
  the: ['o', 'a', 'os', 'as'], a: ['um', 'uma'], an: ['um', 'uma'], this: ['este', 'esta', 'isso'],
  that: ['isso', 'aquilo'], have: ['tenho', 'temos', 'tem'], two: ['dois', 'duas'], three: ['três'],
  can: ['posso', 'pode', 'podemos', 'consegue'], could: ['poderia', 'poderíamos'], should: ['deveria', 'deveríamos'],
  she: ['ela'], he: ['ele'], they: ['eles', 'elas'], we: ['nós'], it: ['isso'], ready: ['pronto', 'pronta'],
  good: ['bom', 'boa'], morning: ['manhã'], afternoon: ['tarde'], evening: ['noite'], how: ['como'],
  what: ['o que', 'qual'], where: ['onde'], when: ['quando'], why: ['por que'], who: ['quem'],
  home: ['casa'], day: ['dia'], night: ['noite'], time: ['tempo', 'hora'], today: ['hoje'],
  tomorrow: ['amanhã'], safe: ['seguro', 'segurança'], safely: ['segurança'], travel: ['viajar'], use: ['usar', 'uso'],
};

function normalizeWord(value) {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{M}/gu, '');
}

function tokenize(value) {
  return value.split(/(\p{L}+(?:['’−-]\p{L}+)?|\d+|[^\p{L}\d\s]+|\s+)/gu).filter(Boolean).map((text) => ({
    text,
    isWord: /[\p{L}\d]/u.test(text),
  }));
}

function isLikelyMatch(english, portuguese) {
  const left = normalizeWord(english);
  const right = normalizeWord(portuguese);
  return left === right
    || translationHints[left]?.some((hint) => normalizeWord(hint) === right)
    || (left.length >= 4 && right.length >= 4 && (left.slice(0, 4) === right.slice(0, 4) || left.slice(0, 5) === right.slice(0, 5)));
}

function colorizePair(english, portuguese) {
  const englishTokens = tokenize(english);
  const portugueseTokens = tokenize(portuguese);
  const englishWords = englishTokens.filter((token) => token.isWord);
  const portugueseWords = portugueseTokens.filter((token) => token.isWord);
  const alignments = new Map();
  let portugueseIndex = 0;
  for (let englishIndex = 0; englishIndex < englishWords.length; englishIndex += 1) {
    const match = portugueseWords.findIndex((candidate, index) => index >= portugueseIndex && isLikelyMatch(englishWords[englishIndex].text, candidate.text));
    if (match >= 0) {
      alignments.set(englishIndex, match);
      portugueseIndex = match + 1;
    }
  }
  const englishColors = new Map();
  const portugueseColors = new Map();
  let colorGroup = 0;
  for (const [englishIndex, portugueseWordIndex] of alignments) {
    const color = colorGroup % exampleColors.length;
    englishColors.set(englishIndex, color);
    portugueseColors.set(portugueseWordIndex, color);
    colorGroup += 1;
  }
  for (let index = 0; index < englishWords.length; index += 1) {
    if (!englishColors.has(index)) {
      const next = [...alignments.keys()].find((candidate) => candidate > index);
      const previous = [...alignments.keys()].reverse().find((candidate) => candidate < index);
      englishColors.set(index, next !== undefined ? englishColors.get(next) : englishColors.get(previous ?? 0) ?? 0);
    }
  }
  for (let index = 0; index < portugueseWords.length; index += 1) {
    if (!portugueseColors.has(index)) portugueseColors.set(index, portugueseColors.get(index - 1) ?? 0);
  }
  const render = (tokens, colors) => {
    let index = 0;
    return tokens.map((token) => {
      if (!token.isWord) return escapeHtml(token.text);
      const html = `<span style="color:${exampleColors[colors.get(index) ?? 0]}">${escapeHtml(token.text)}</span>`;
      index += 1;
      return html;
    }).join('');
  };
  return {
    english: render(englishTokens, englishColors),
    portuguese: render(portugueseTokens, portugueseColors),
    englishTokens,
    portugueseTokens,
    englishColors,
    portugueseColors,
  };
}

const lessons = parseLessons(markdown);
if (lessons.length !== 100 || lessons.some((lesson, index) => lesson.number !== index + 1 || lesson.bullets.length < 5 || lesson.bullets.slice(0, 5).some((bullet) => !splitExample(bullet).portuguese))) {
  throw new Error('O e-book precisa ter exatamente 100 lições numeradas e cinco exemplos por lição.');
}

const htmlLessons = lessons.map((lesson) => {
  const examples = lesson.bullets.slice(0, 5).map((bullet) => {
    const example = splitExample(bullet);
    const colored = colorizePair(example.english, example.portuguese);
    return `<li><strong>${colored.english}</strong><span>${colored.portuguese}</span><a class="audio-link" href="https://youglish.com/pronounce/${encodeURIComponent(example.english)}/english" target="_blank" rel="noreferrer">▶ Ouvir</a></li>`;
  }).join('');
  return `<section class="page lesson"><p class="kicker">LIÇÃO ${String(lesson.number).padStart(3, '0')} · PORTAL NKL</p><h2>${escapeHtml(lesson.title)}</h2>${lesson.paragraphs.map((paragraph) => `<p class="lead">${escapeHtml(paragraph)}</p>`).join('')}<h3>5 exemplos para praticar</h3><ol class="examples">${examples}</ol><div class="exercise"><strong>Prática</strong><p>Escolha dois exemplos, troque uma palavra por algo da sua vida e fale as novas frases três vezes.</p><div class="lines"></div></div><span class="page-number">${lesson.number + 6}</span></section>`;
}).join('');

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Inglês para ganhar dinheiro · Portal NKL</title><style>@page{size:A5 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;background:#dfe7ef;color:#172235;font-family:Arial,sans-serif}.page{position:relative;width:148mm;min-height:210mm;margin:20px auto;padding:16mm;background:#fffdf8;page-break-after:always;box-shadow:0 8px 30px #9caabd}.cover{display:flex;flex-direction:column;justify-content:center;background:linear-gradient(145deg,#102746,#1b5794 58%,#de7547);color:#fff}.cover h1{font:700 40px/1.03 Georgia,serif}.cover em{color:#ffd2be;font-style:normal}.cover p{font-size:16px;line-height:1.45}.kicker{color:#2a63ae;font-size:10px;font-weight:800;letter-spacing:2px}.cover .kicker{color:#ffd3bd}.lesson h2{margin:7mm 0 4mm;color:#102f55;font:700 28px/1.08 Georgia,serif}.lead{line-height:1.45}.examples{display:grid;gap:3mm;padding-left:6mm}.examples li{font-size:14px;line-height:1.25}.examples strong,.examples span{display:block}.examples span{margin-top:1mm;font-size:12px}.audio-link{display:block;margin-top:1mm;color:#2a63ae;font-size:9px;font-weight:700}.exercise{margin-top:6mm;padding:4mm;border-left:4px solid #d46b40;background:#fff1ea;line-height:1.4}.tool-page{page-break-after:always}.habit-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4mm;margin-top:8mm}.habit-grid span{font-size:10px;text-align:center}.habit-grid i{display:block;height:14mm;margin-top:2mm;border:1px solid #b8c5d1;border-radius:2mm}.toolbox{margin:5mm 0;padding:4mm;border:1px solid #d7e0e8;background:#f7fafc;line-height:1.45}.page-number{position:absolute;right:14mm;bottom:8mm;color:#718198;font-size:10px;font-weight:700}@media print{body{background:#fff}.page{margin:0;box-shadow:none}} </style></head><body><section class="page cover"><p class="kicker">GUIA PRÁTICO · PORTAL NKL</p><h1>Inglês para<br><em>ganhar dinheiro</em></h1><p>100 lições para estudar inglês com frases traduzidas, prática guiada e mais confiança.</p><p>Leitura confortável no celular · PDF A5 · Sem promessas fáceis</p><span class="page-number">1</span></section><section class="page"><p class="kicker">COMO USAR</p><h2>Leia. Fale. Adapte. Repita.</h2><p>Faça uma lição por vez. Leia a explicação, fale os exemplos em voz alta, observe a tradução em português e crie uma frase sua.</p><p>O inglês pode ampliar suas opções, mas não garante renda, emprego ou contratação. Prática, qualidade, mercado e escolhas seguras continuam importantes.</p><span class="page-number">2</span></section><section class="page tool-page"><p class="kicker">RASTREADOR DE 30 DIAS</p><h2>Marque cada vitória.</h2><p>Faça uma lição por dia ou adapte o ritmo. O importante é voltar e deixar uma marca visível do caminho.</p><div class="habit-grid">${Array.from({ length: 30 }, (_, index) => `<span>${String(index + 1).padStart(2, '0')}<i></i></span>`).join('')}</div><span class="page-number">3</span></section><section class="page tool-page"><p class="kicker">FERRAMENTA DE FEEDBACK</p><h2>Use uma IA como professora particular.</h2><p>Copie uma frase sua e cole este prompt no Gemini, Copilot ou outra IA confiável. Nunca envie senhas, documentos ou dados pessoais.</p><div class="toolbox">“Corrija minha frase em inglês sem apagar minha intenção. Mostre: 1) minha frase, 2) a versão corrigida, 3) uma explicação curta em português, 4) uma alternativa natural. Frase: [cole aqui].”</div><p>Peça uma versão simples e outra natural. Compare, repita em voz alta e registre o erro.</p><span class="page-number">4</span></section><section class="page tool-page"><p class="kicker">DIÁLOGO PROFISSIONAL</p><h2>Frases ganham força em uma conversa.</h2><div class="toolbox"><p><b>Client:</b> Could you send the proposal today?</p><p><b>You:</b> Yes. I will review it and send it by five.</p><p><b>Client:</b> Can you add one point?</p><p><b>You:</b> Of course. I will include it in the next version.</p><p>Cliente: Você poderia enviar a proposta hoje? / Você: Sim. Vou revisá-la e enviar até as cinco. / Cliente: Você pode acrescentar um ponto? / Você: Claro. Vou incluí-lo na próxima versão.</p></div><p>Treine os dois papéis e substitua proposta, prazo e pedido por situações da sua vida.</p><span class="page-number">5</span></section><section class="page tool-page"><p class="kicker">TEMPLATES PROFISSIONAIS</p><h2>Copie, preencha e revise.</h2><div class="toolbox"><b>E-mail</b><br>Subject: Follow-up on [project]<br>Hello [name],<br>Thank you for your message. I can [action] by [date]. Please let me know if you have any questions.<br>Best regards,<br>[your name]</div><div class="toolbox"><b>Proposta curta</b><br>Goal: [what the client needs]<br>Deliverables: [what you will deliver]<br>Timeline: [dates]<br>Price: [amount]</div><span class="page-number">6</span></section>${htmlLessons}</body></html>`;
await writeFile(htmlPath, html, 'utf8');

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/u);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const document = await PDFDocument.create();
const regular = await document.embedFont(StandardFonts.Helvetica);
const bold = await document.embedFont(StandardFonts.HelveticaBold);
const pageWidth = 419.53;
const pageHeight = 595.28;
const margin = 45;
const contentWidth = pageWidth - margin * 2;

function addText(page, text, x, y, size, font, color, lineGap = 4) {
  for (const line of wrapText(text, font, size, contentWidth)) {
    page.drawText(line, { x, y, size, font, color });
    y -= size + lineGap;
  }

  return y;
}

function addExternalLink(page, x, y, width, height, url) {
  const link = page.doc.context.register(page.doc.context.obj({
    Type: CorePDFName.of('Annot'),
    Subtype: CorePDFName.of('Link'),
    Rect: page.doc.context.obj([x, y, x + width, y + height]),
    Border: page.doc.context.obj([0, 0, 0]),
    A: page.doc.context.obj({
      Type: CorePDFName.of('Action'),
      S: CorePDFName.of('URI'),
      URI: CorePDFString.of(url),
    }),
  }));
  page.node.addAnnot(link);
}

function addColoredPair(page, english, portuguese, x, y) {
  const colored = colorizePair(english, portuguese);
  const drawTokens = (tokens, colors, size, font, startY) => {
    let wordIndex = 0;
    let currentX = x;
    let currentY = startY;
    for (const token of tokens) {
      if (!token.isWord) {
        currentX += font.widthOfTextAtSize(token.text, size);
        continue;
      }
      const width = font.widthOfTextAtSize(token.text, size);
      if (currentX + width > pageWidth - margin && currentX > x) {
        currentY -= size + 2;
        currentX = x;
      }
      page.drawText(token.text, { x: currentX, y: currentY, size, font, color: rgb(...hexToRgb(exampleColors[colors.get(wordIndex) ?? 0])) });
      currentX += width + 2;
      wordIndex += 1;
    }
    return currentY - size - 2;
  };
  y = drawTokens(colored.englishTokens, colored.englishColors, 11, bold, y);
  y = drawTokens(colored.portugueseTokens, colored.portugueseColors, 10, regular, y + 1) - 7;
  return y;
}

function hexToRgb(hex) {
  return [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
}

const cover = document.addPage([pageWidth, pageHeight]);
cover.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(0.06, 0.15, 0.27) });
cover.drawText('GUIA PRÁTICO · PORTAL NKL', { x: margin, y: 470, size: 12, font: bold, color: rgb(1, 0.83, 0.74) });
cover.drawText('Inglês para', { x: margin, y: 350, size: 38, font: bold, color: rgb(1, 1, 1) });
cover.drawText('ganhar dinheiro', { x: margin, y: 305, size: 38, font: bold, color: rgb(1, 0.82, 0.74) });
cover.drawText('100 lições com exemplos traduzidos e prática guiada.', { x: margin, y: 240, size: 15, font: regular, color: rgb(0.88, 0.93, 0.98), maxWidth: contentWidth });

const intro = document.addPage([pageWidth, pageHeight]);
let introY = 510;
introY = addText(intro, 'COMO USAR', margin, introY, 12, bold, rgb(0.16, 0.39, 0.68));
introY -= 18;
introY = addText(intro, 'Leia. Fale. Adapte. Repita.', margin, introY, 28, bold, rgb(0.06, 0.18, 0.33), 7);
introY -= 12;
addText(intro, 'Faça uma lição por vez. Leia a explicação, fale os exemplos em voz alta, observe a tradução em português e crie uma frase sua.', margin, introY, 14, regular, rgb(0.1, 0.14, 0.2), 6);
introY -= 55;
addText(intro, 'O inglês pode ampliar suas opções, mas não garante renda, emprego ou contratação. Prática, qualidade, mercado e escolhas seguras continuam importantes.', margin, introY, 14, regular, rgb(0.1, 0.14, 0.2), 6);

const tracker = document.addPage([pageWidth, pageHeight]);
let trackerY = 500;
trackerY = addText(tracker, 'RASTREADOR DE 30 DIAS', margin, trackerY, 12, bold, rgb(0.84, 0.42, 0.25));
trackerY = addText(tracker, 'Marque cada vitória.', margin, trackerY - 18, 28, bold, rgb(0.06, 0.18, 0.33), 7);
addText(tracker, 'Faça uma lição por dia ou adapte o ritmo. O importante é voltar e deixar uma marca visível do caminho.', margin, trackerY - 12, 14, regular, rgb(0.1, 0.14, 0.2), 6);
for (let index = 0; index < 30; index += 1) {
  const column = index % 5;
  const row = Math.floor(index / 5);
  const x = margin + column * 66;
  const y = 360 - row * 52;
  tracker.drawText(String(index + 1).padStart(2, '0'), { x: x + 17, y: y + 22, size: 10, font: bold, color: rgb(0.45, 0.5, 0.58) });
  tracker.drawRectangle({ x, y, width: 42, height: 34, borderColor: rgb(0.72, 0.77, 0.82), borderWidth: 1 });
}

const feedback = document.addPage([pageWidth, pageHeight]);
let feedbackY = 510;
feedbackY = addText(feedback, 'FERRAMENTA DE FEEDBACK', margin, feedbackY, 12, bold, rgb(0.84, 0.42, 0.25));
feedbackY = addText(feedback, 'Use uma IA como professora particular.', margin, feedbackY - 18, 25, bold, rgb(0.06, 0.18, 0.33), 7);
feedbackY = addText(feedback, 'Copie uma frase sua e cole este prompt no Gemini, Copilot ou outra IA confiável. Nunca envie senhas, documentos ou dados pessoais.', margin, feedbackY - 12, 14, regular, rgb(0.1, 0.14, 0.2), 6);
feedbackY -= 18;
feedbackY = addText(feedback, '“Corrija minha frase em inglês sem apagar minha intenção. Mostre: 1) minha frase, 2) a versão corrigida, 3) uma explicação curta em português, 4) uma alternativa natural. Frase: [cole aqui].”', margin + 12, feedbackY, 13, regular, rgb(0.1, 0.14, 0.2), 5);
addText(feedback, 'Peça uma versão simples e outra natural. Compare, repita em voz alta e registre o erro que mais se repete.', margin, feedbackY - 20, 13, regular, rgb(0.1, 0.14, 0.2), 5);

const dialogue = document.addPage([pageWidth, pageHeight]);
let dialogueY = 510;
dialogueY = addText(dialogue, 'DIÁLOGO PROFISSIONAL', margin, dialogueY, 12, bold, rgb(0.84, 0.42, 0.25));
dialogueY = addText(dialogue, 'Frases ganham força em uma conversa.', margin, dialogueY - 18, 25, bold, rgb(0.06, 0.18, 0.33), 7);
dialogueY -= 18;
for (const line of ['Client: Could you send the proposal today?', 'You: Yes. I will review it and send it by five.', 'Interviewer: Tell me about your experience.', 'You: I worked with customers and solved daily problems.', 'Client: Can you add one point?', 'You: Of course. I will include it in the next version.']) {
  dialogueY = addText(dialogue, line, margin, dialogueY, 14, regular, rgb(0.1, 0.14, 0.2), 5);
}
addText(dialogue, 'Cliente: Você poderia enviar a proposta hoje? / Você: Sim. Vou revisá-la e enviar até as cinco. / Cliente: Você pode acrescentar um ponto? / Você: Claro. Vou incluí-lo na próxima versão.', margin, dialogueY - 18, 12, regular, rgb(0.35, 0.4, 0.47), 5);

const templates = document.addPage([pageWidth, pageHeight]);
let templatesY = 510;
templatesY = addText(templates, 'TEMPLATES PROFISSIONAIS', margin, templatesY, 12, bold, rgb(0.84, 0.42, 0.25));
templatesY = addText(templates, 'Copie, preencha e revise.', margin, templatesY - 18, 25, bold, rgb(0.06, 0.18, 0.33), 7);
templatesY -= 18;
templatesY = addText(templates, 'E-mail', margin, templatesY, 12, bold, rgb(0.84, 0.42, 0.25));
templatesY = addText(templates, 'Subject: Follow-up on [project]\\nHello [name],\\nThank you for your message. I can [action] by [date]. Please let me know if you have any questions.\\nBest regards,\\n[your name]', margin, templatesY - 12, 12, regular, rgb(0.1, 0.14, 0.2), 5);
templatesY -= 16;
templatesY = addText(templates, 'Proposta curta', margin, templatesY, 12, bold, rgb(0.84, 0.42, 0.25));
addText(templates, 'Goal: [what the client needs]\\nDeliverables: [what you will deliver]\\nTimeline: [dates]\\nPrice: [amount]', margin, templatesY - 12, 12, regular, rgb(0.1, 0.14, 0.2), 5);

for (const lesson of lessons) {
  const page = document.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  page.drawText(`LIÇÃO ${String(lesson.number).padStart(3, '0')} · PORTAL NKL`, { x: margin, y, size: 10, font: bold, color: rgb(0.16, 0.39, 0.68) });
  y -= 28;
  y = addText(page, lesson.title, margin, y, 23, bold, rgb(0.06, 0.18, 0.33), 5);
  y -= 6;
  for (const paragraph of lesson.paragraphs) y = addText(page, paragraph, margin, y, 11, regular, rgb(0.15, 0.2, 0.28), 3) - 4;
  y -= 4;
  page.drawText('5 EXEMPLOS PARA PRATICAR', { x: margin, y, size: 10, font: bold, color: rgb(0.84, 0.42, 0.25) });
  y -= 20;
  for (const bullet of lesson.bullets.slice(0, 5)) {
    const example = splitExample(bullet);
    page.drawText(`${lesson.bullets.indexOf(bullet) + 1}.`, { x: margin, y, size: 11, font: bold, color: rgb(0.84, 0.42, 0.25) });
    y = addColoredPair(page, example.english, example.portuguese, margin + 16, y);
    const audioUrl = `https://youglish.com/pronounce/${encodeURIComponent(example.english)}/english`;
    page.drawText('Ouvir pronúncia', { x: margin + 16, y: y + 3, size: 8, font: regular, color: rgb(0.16, 0.39, 0.68) });
    addExternalLink(page, margin + 16, y + 1, 58, 10, audioUrl);
    y -= 10;
  }
  page.drawRectangle({ x: margin, y: 58, width: contentWidth, height: 56, color: rgb(1, 0.95, 0.91) });
  page.drawText('PRÁTICA', { x: margin + 10, y: 98, size: 10, font: bold, color: rgb(0.78, 0.32, 0.18) });
  addText(page, 'Escolha dois exemplos, troque uma palavra por algo da sua vida e fale as novas frases três vezes.', margin + 10, 82, 10, regular, rgb(0.2, 0.2, 0.2), 3);
  page.drawText(String(lesson.number + 6), { x: pageWidth - margin, y: 30, size: 9, font: bold, color: rgb(0.45, 0.5, 0.58) });
}

await writeFile(pdfPath, await document.save());
console.log(`Generated ${lessons.length} lessons in ${htmlPath} and ${pdfPath}`);