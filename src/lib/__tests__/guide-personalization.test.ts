import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPersonalizationLabel,
  isValidCpf,
  normalizeCpf,
} from '../guide-personalization';

test('normalizes a formatted CPF', () => {
  assert.equal(normalizeCpf('529.982.247-25'), '52998224725');
});

test('accepts a valid CPF and rejects invalid or repeated digits', () => {
  assert.equal(isValidCpf('529.982.247-25'), true);
  assert.equal(isValidCpf('529.982.247-24'), false);
  assert.equal(isValidCpf('111.111.111-11'), false);
});

test('builds the visible identity label without exposing a full internal id', () => {
  assert.equal(
    buildPersonalizationLabel({
      fullName: '  Nicolas da Costa Santos ',
      cpf: '529.982.247-25',
      email: 'Nicolas@Example.com',
      shortId: 'ab12cd34',
    }),
    'Nicolas da Costa Santos · 52998224725 · nicolas@example.com · NKL-ab12cd34',
  );
});
