import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildGraphIndex,
  getGraphStats,
  getNeighbors,
  isForbiddenPath,
  queryGraph,
  sanitizeText
} from './memory-graph.mjs';

function createTempRepo(t) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-memory-graph-test-'));
  t.after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(tmpDir, '.ai-memory'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
  return tmpDir;
}

test('build indexes frontmatter, headings, wikilinks, and markdown links deterministically', (t) => {
  const rootDir = createTempRepo(t);

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'alpha.md'),
    [
      '---',
      'id: alpha',
      'tags: [pagamentos, stripe]',
      'links: [beta]',
      'updated: 2026-11-19',
      '---',
      '',
      '# Alpha Pagamentos',
      '',
      'Veja tambem [[gamma]] e [Arquitetura](../docs/arch.md).'
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'beta.md'),
    [
      '---',
      'id: beta',
      'tags: [storage, guias]',
      'updated: 2026-11-19',
      '---',
      '',
      '# Beta Storage',
      '## Bucket Privado',
      '',
      'Conecta com [[gamma]].'
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'gamma.md'),
    [
      '---',
      'id: gamma',
      'tags: [lgpd]',
      '---',
      '',
      '# Gamma Compliance',
      '',
      'Nota folha conectada.'
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, 'docs', 'arch.md'),
    ['# Arquitetura Geral', '', 'Referencia [[beta]].'].join('\n'),
    'utf8'
  );

  const index1 = buildGraphIndex({ rootDir, write: true });
  const rawJson1 = fs.readFileSync(path.join(rootDir, '.ai-memory', 'graph-index.json'), 'utf8');
  buildGraphIndex({ rootDir, write: true });
  const rawJson2 = fs.readFileSync(path.join(rootDir, '.ai-memory', 'graph-index.json'), 'utf8');

  assert.equal(rawJson1, rawJson2, 'graph-index.json must be deterministic across builds');
  assert.equal(index1.stats.nodeCount, 4);
  assert.equal(index1.stats.brokenLinkCount, 0);
  assert.equal(index1.stats.orphanCount, 0);
  assert.deepEqual(index1.nodes.alpha.outgoing, ['beta', 'docs/arch', 'gamma']);
  assert.deepEqual(index1.nodes.beta.incoming, ['alpha', 'docs/arch']);
});

test('query performs weighted multi-hop BFS traversal across connected nodes', (t) => {
  const rootDir = createTempRepo(t);

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'seedNode.md'),
    [
      '---',
      'id: seedNode',
      'tags: [webhook-idempotencia]',
      'links: [hopOneNode]',
      '---',
      '',
      '# Seed Webhook Processing',
      '',
      'Valida assinatura do Stripe em tempo constante.'
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'hopOneNode.md'),
    [
      '---',
      'id: hopOneNode',
      'tags: [storage]',
      'links: [hopTwoNode]',
      '---',
      '',
      '# Hop One Asset Delivery',
      '',
      'Entrega via bucket privado com URL assinada.'
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'hopTwoNode.md'),
    [
      '---',
      'id: hopTwoNode',
      'tags: [watermark]',
      '---',
      '',
      '# Hop Two Watermark',
      '',
      'Marca dagua personalizada no PDF.'
    ].join('\n'),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, 'docs', 'unrelated.md'),
    ['# Unrelated Doc', '', 'Catalogo de cordas de violino.'].join('\n'),
    'utf8'
  );

  const indexData = buildGraphIndex({ rootDir, write: true });
  const result = queryGraph('webhook-idempotencia', { rootDir, depth: 2, limit: 6, indexData });

  assert.equal(result.results.length, 3);
  assert.equal(result.results[0].id, 'seedNode');
  assert.equal(result.results[0].hop, 0);

  const hop1 = result.results.find((r) => r.id === 'hopOneNode');
  const hop2 = result.results.find((r) => r.id === 'hopTwoNode');
  assert.ok(hop1, '1-hop neighbor must be retrieved');
  assert.equal(hop1.hop, 1);
  assert.equal(hop1.via, 'seedNode');

  assert.ok(hop2, '2-hop neighbor must be retrieved');
  assert.equal(hop2.hop, 2);
  assert.equal(hop2.via, 'hopOneNode');
  assert.ok(result.results[0].score > hop1.score && hop1.score > hop2.score);
});

test('neighbors and stats report graph topology, orphans, and broken links accurately', (t) => {
  const rootDir = createTempRepo(t);

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'hub.md'),
    ['---', 'id: hub', 'links: [spoke]', '---', '# Hub', 'Link quebrado [[inexistente]].'].join('\n'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'spoke.md'),
    ['---', 'id: spoke', '---', '# Spoke', 'Volta para [[hub]] e avanca para [[leaf]].'].join('\n'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'leaf.md'),
    ['---', 'id: leaf', '---', '# Leaf'].join('\n'),
    'utf8'
  );
  fs.writeFileSync(
    path.join(rootDir, 'docs', 'orphan.md'),
    ['# Orphan Note', 'Sem conexoes.'].join('\n'),
    'utf8'
  );

  const indexData = buildGraphIndex({ rootDir, write: true });
  const directNeighbors = getNeighbors('hub', { rootDir, depth: 1, indexData });
  assert.equal(directNeighbors.neighbors.length, 1);
  assert.equal(directNeighbors.neighbors[0].id, 'spoke');
  assert.equal(directNeighbors.neighbors[0].direction, 'both');

  const twoHopNeighbors = getNeighbors('hub', { rootDir, depth: 2, indexData });
  assert.equal(twoHopNeighbors.neighbors.length, 2);
  assert.equal(twoHopNeighbors.neighbors[1].id, 'leaf');
  assert.equal(twoHopNeighbors.neighbors[1].hop, 2);

  const stats = getGraphStats({ rootDir, indexData });
  assert.equal(stats.nodeCount, 4);
  assert.deepEqual(stats.orphanNodes, ['docs/orphan']);
  assert.equal(stats.brokenLinkCount, 1);
  assert.equal(stats.brokenLinks[0].target, 'inexistente');
});

test('excludes .env* and private-assets paths and sanitizes inline secrets/PII', (t) => {
  const rootDir = createTempRepo(t);

  assert.equal(isForbiddenPath('.env'), true);
  assert.equal(isForbiddenPath('.env.local'), true);
  assert.equal(isForbiddenPath('.ai-memory/.env.md'), true);
  assert.equal(isForbiddenPath('private-assets/guias/ebook.md'), true);
  assert.equal(isForbiddenPath('.ai-memory/techContext.md'), false);

  fs.writeFileSync(path.join(rootDir, '.env.local'), 'STRIPE_SECRET_KEY=sk_live_1234567890abcdef', 'utf8');
  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', '.env.secret.md'),
    '# Should never be indexed\nSTRIPE_SECRET_KEY=sk_live_1234567890abcdef',
    'utf8'
  );

  const fakeStripeKey = ['sk', 'live', 'ABCDEF1234567890xyz'].join('_');
  const fakeWebhookSecret = ['whsec', 'ABCDEF1234567890xyz'].join('_');
  const fakeCpf = ['123', '456', '789-00'].join('.');

  fs.writeFileSync(
    path.join(rootDir, '.ai-memory', 'safeNote.md'),
    [
      '---',
      'id: safeNote',
      'tags: [seguranca]',
      '---',
      '# Safe Note',
      `Chave acidental ${fakeStripeKey} e ${fakeWebhookSecret} e CPF ${fakeCpf} e SUPABASE_SERVICE_ROLE_KEY=super_secret_val`
    ].join('\n'),
    'utf8'
  );

  buildGraphIndex({ rootDir, write: true });
  const rawIndex = fs.readFileSync(path.join(rootDir, '.ai-memory', 'graph-index.json'), 'utf8');

  assert.equal(rawIndex.includes('.env'), false, '.env files must never be indexed');
  assert.equal(rawIndex.includes(fakeStripeKey), false, 'Stripe secret keys must be redacted');
  assert.equal(rawIndex.includes(fakeWebhookSecret), false, 'Webhook secrets must be redacted');
  assert.equal(rawIndex.includes(fakeCpf), false, 'CPF patterns must be redacted');
  assert.equal(rawIndex.includes('super_secret_val'), false, 'Key assignments must be redacted');
  assert.equal(sanitizeText(fakeStripeKey), '[REDACTED]');
});

test('repository .ai-memory graph index is valid, complete, and has zero broken links', () => {
  const repoRoot = process.cwd();
  const indexData = buildGraphIndex({ rootDir: repoRoot, write: true });
  const requiredMemoryNodes = [
    'activeContext',
    'decisionsLog',
    'progress',
    'projectBrief',
    'systemPatterns',
    'techContext'
  ];

  for (const id of requiredMemoryNodes) {
    assert.ok(indexData.nodes[id], `missing required .ai-memory node: ${id}`);
  }
  assert.equal(indexData.stats.brokenLinkCount, 0, 'repository memory graph must have 0 broken links');
});
