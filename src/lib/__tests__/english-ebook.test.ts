import assert from 'node:assert/strict';
import test from 'node:test';
import { BILINGUAL_COLOR_CLASSES, tokenizeBilingualExample } from '@/lib/english-ebook';

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
