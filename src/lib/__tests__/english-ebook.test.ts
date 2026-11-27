import assert from 'node:assert/strict';
import test from 'node:test';
import { BILINGUAL_COLOR_CLASSES, tokenizeBilingualExample } from '@/lib/english-ebook';

function wordColors(tokens: ReturnType<typeof tokenizeBilingualExample>['english']): number[] {
  return tokens.filter((token) => token.isWord).map((token) => token.colorIndex);
}

test('aligns semantic colors between English and Portuguese phrases for tricky grammar examples', () => {
  const sendExample = tokenizeBilingualExample('I will send it today.', 'Eu vou enviar hoje.');
  const enWords = sendExample.english.filter((t) => t.isWord);
  const ptWords = sendExample.portuguese.filter((t) => t.isWord);

  assert.equal(enWords[0]?.colorIndex, ptWords[0]?.colorIndex); // I -> Eu
  assert.equal(enWords[1]?.colorIndex, ptWords[1]?.colorIndex); // will -> vou
  assert.equal(enWords[2]?.colorIndex, ptWords[2]?.colorIndex); // send -> enviar
  assert.equal(enWords[enWords.length - 1]?.colorIndex, ptWords[ptWords.length - 1]?.colorIndex); // today -> hoje

  const sorryExample = tokenizeBilingualExample('Sorry, I did not understand.', 'Desculpe, eu não entendi.');
  const enSorry = sorryExample.english.filter((t) => t.isWord);
  const ptSorry = sorryExample.portuguese.filter((t) => t.isWord);

  assert.equal(enSorry[0]?.colorIndex, ptSorry[0]?.colorIndex); // Sorry -> Desculpe
  assert.equal(enSorry[1]?.colorIndex, ptSorry[1]?.colorIndex); // I -> eu
  assert.equal(enSorry[enSorry.length - 1]?.colorIndex, ptSorry[ptSorry.length - 1]?.colorIndex); // understand -> entendi
  assert.equal(BILINGUAL_COLOR_CLASSES.length, 6);
});

test('treats multi-word expressions as single semantic color units ("I wake up early." / "Eu acordo cedo.")', () => {
  const wakeExample = tokenizeBilingualExample('I wake up early.', 'Eu acordo cedo.');
  const enColors = wordColors(wakeExample.english);
  const ptColors = wordColors(wakeExample.portuguese);

  assert.equal(enColors.length, 4); // I, wake, up, early
  assert.equal(ptColors.length, 3); // Eu, acordo, cedo
  assert.equal(enColors[0], ptColors[0]); // I == Eu
  assert.equal(enColors[1], enColors[2]); // wake == up
  assert.equal(enColors[1], ptColors[1]); // wake up == acordo
  assert.equal(enColors[3], ptColors[2]); // early == cedo
  assert.equal(new Set(enColors).size, 3);
  assert.equal(new Set(ptColors).size, 3);
});

test('aligns non-monotonic word order without skipping earlier Portuguese words ("Can you repeat?" / "Você pode repetir?")', () => {
  const repeatExample = tokenizeBilingualExample('Can you repeat?', 'Você pode repetir?');
  const enColors = wordColors(repeatExample.english);
  const ptColors = wordColors(repeatExample.portuguese);

  assert.equal(enColors.length, 3); // Can, you, repeat
  assert.equal(ptColors.length, 3); // Você, pode, repetir
  assert.equal(enColors[0], ptColors[1]); // Can == pode
  assert.equal(enColors[1], ptColors[0]); // you == Você
  assert.equal(enColors[2], ptColors[2]); // repeat == repetir
  assert.equal(new Set(enColors).size, 3);
  assert.equal(new Set(ptColors).size, 3);
});

test('produces multi-color semantic alignments across Italian, French, German, Spanish, and Chinese', () => {
  const samples: Array<[string, string, string]> = [
    ['italiano-blog', 'Vorrei un caffè, per favore.', 'Eu gostaria de um café, por favor.'],
    ['italiano-ebook', 'Io voglio studiare online.', 'Eu quero estudar on-line.'],
    ['frances-blog', 'Je travaille à la maison.', 'Eu trabalho em casa.'],
    ['frances-ebook', 'Pouvez-vous répéter, s’il vous plaît?', 'Você pode repetir, por favor?'],
    ['alemao-blog', 'Können Sie das langsam wiederholen?', 'Você pode repetir isso devagar?'],
    ['alemao-ebook', 'Ich möchte heute üben.', 'Eu quero praticar hoje.'],
    ['espanhol-blog', '¿Puedes repetir despacio?', 'Você pode repetir devagar?'],
    ['espanhol-ebook', 'Quiero practicar todos los días.', 'Eu quero praticar todos os dias.'],
    ['chines-blog-1', '我叫 Ana。', 'Meu nome é Ana.'],
    ['chines-blog-2', '请给我一杯咖啡。', 'Por favor, me dê um café.'],
    ['chines-blog-3', '请再说一遍。', 'Por favor, diga novamente.'],
    ['chines-blog-4', '我在家工作。', 'Eu trabalho em casa.'],
    ['chines-ebook-1', '我想每天学习。', 'Eu quero estudar todos os dias.'],
    ['chines-ebook-2', '请再说一遍，好吗？', 'Pode falar novamente, por favor?'],
  ];

  for (const [label, source, portuguese] of samples) {
    const aligned = tokenizeBilingualExample(source, portuguese);
    const srcColors = wordColors(aligned.english);
    const ptColors = wordColors(aligned.portuguese);

    assert.ok(srcColors.length >= 2, `${label} must segment into >= 2 word tokens`);
    assert.ok(new Set(srcColors).size >= 2, `${label} source must not fall back to single color`);
    assert.ok(new Set(ptColors).size >= 2, `${label} Portuguese must not fall back to single color`);
  }

  // Verify Chinese non-monotonic word-order semantic pairing: 我(0) 在家(1) 工作(2) <=> Eu(0) trabalho(2) em casa(1)
  const zhWork = tokenizeBilingualExample('我在家工作。', 'Eu trabalho em casa.');
  const zhColors = wordColors(zhWork.english);
  const ptWorkColors = wordColors(zhWork.portuguese);
  assert.equal(zhColors[0], ptWorkColors[0]); // 我 == Eu
  assert.equal(zhColors[1], ptWorkColors[2]); // 在家 == casa (and em)
  assert.equal(zhColors[1], ptWorkColors[3]); // 在家 == em casa
  assert.equal(zhColors[2], ptWorkColors[1]); // 工作 == trabalho

  // Verify German non-monotonic modal/verb alignment: Können(0) Sie(1) das(2) langsam(3) wiederholen(4)
  const deRepeat = tokenizeBilingualExample('Können Sie das langsam wiederholen?', 'Você pode repetir isso devagar?');
  const deColors = wordColors(deRepeat.english);
  const ptDeColors = wordColors(deRepeat.portuguese);
  assert.equal(deColors[0], ptDeColors[1]); // Können == pode
  assert.equal(deColors[1], ptDeColors[0]); // Sie == Você
  assert.equal(deColors[2], ptDeColors[3]); // das == isso
  assert.equal(deColors[3], ptDeColors[4]); // langsam == devagar
  assert.equal(deColors[4], ptDeColors[2]); // wiederholen == repetir
});
