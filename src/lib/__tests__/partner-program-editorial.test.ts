import assert from 'node:assert/strict';
import test from 'node:test';
import { comparePartnerProgramRelevance } from '@/lib/partner-program-sorting';
import {
  editorialProgramTags,
  getReviewedWithdrawalTag,
} from '@/lib/partner-program-editorial';

test('uTest is ranked for beginners and AttaPoll is not', () => {
  const utest = { name: 'uTest', tags: editorialProgramTags('utest', []), finalRating: 9 };
  const attapoll = { name: 'AttaPoll', tags: editorialProgramTags('attapoll', ['pesquisas']), finalRating: 9 };
  const other = { name: 'Outra opção', tags: [], finalRating: 8.5 };

  assert.equal(utest.tags.includes('Melhor para Começar'), true);
  assert.equal(attapoll.tags.includes('Melhor para Começar'), false);
  assert.equal(comparePartnerProgramRelevance(utest, other) < 0, true);
});

test('only reviewed withdrawal timing gets a deadline tag', () => {
  assert.equal(getReviewedWithdrawalTag('fluencify'), '1º saque em 15 dias');
  assert.equal(getReviewedWithdrawalTag('utest'), null);
});
