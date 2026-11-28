import assert from 'node:assert/strict';
import test from 'node:test';
import { DISCOVERY_TAGS, PARTNER_PROGRAM_SLUGS } from '../partner-program-catalog';

test('DISCOVERY_TAGS covers 100% of all catalog partner program slugs with zero stale slugs', () => {
  const catalogSet = new Set<string>(PARTNER_PROGRAM_SLUGS);
  assert.equal(catalogSet.size, PARTNER_PROGRAM_SLUGS.length, 'Expected unique catalog slugs');
  assert.ok(catalogSet.size >= 57, `Expected at least 57 catalog slugs, got ${catalogSet.size}`);

  const requiredLabels = [
    'Ganhar sem fazer nada',
    'Ganhar com vídeos sem aparecer',
    'Gravar vídeos para empresas',
    'Sou bom com idiomas',
  ];
  for (const label of requiredLabels) {
    assert.ok(
      DISCOVERY_TAGS.some((tag) => tag.label === label),
      `Missing expected discovery tag "${label}"`,
    );
  }

  const covered = new Set<string>();
  for (const tag of DISCOVERY_TAGS) {
    assert.ok(tag.slugs.length > 0, `Tag "${tag.label}" must not be empty`);
    for (const slug of tag.slugs) {
      assert.ok(catalogSet.has(slug), `Unknown slug "${slug}" inside DISCOVERY_TAGS["${tag.label}"]`);
      covered.add(slug);
    }
  }

  const missing = PARTNER_PROGRAM_SLUGS.filter((slug) => !covered.has(slug));
  assert.deepEqual(missing, [], `All 57 catalog slugs must appear in DISCOVERY_TAGS; missing: ${missing.join(', ')}`);
});

test('every catalog slug is classified as either zero-investment or initial-investment without overlap', () => {
  const free = DISCOVERY_TAGS.find((tag) => tag.label === 'Renda extra sem investimento');
  const paid = DISCOVERY_TAGS.find((tag) => tag.label === 'Com investimento inicial');
  assert.ok(free && paid);

  const freeSet = new Set(free.slugs);
  const paidSet = new Set(paid.slugs);
  for (const slug of PARTNER_PROGRAM_SLUGS) {
    assert.notEqual(
      freeSet.has(slug),
      paidSet.has(slug),
      `Slug "${slug}" must belong to exactly one investment category`,
    );
  }
});
