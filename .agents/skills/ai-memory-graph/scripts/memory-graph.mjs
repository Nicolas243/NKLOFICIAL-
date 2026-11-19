#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const INDEX_RELATIVE_PATH = '.ai-memory/graph-index.json';
const SCAN_DIRS = ['.ai-memory', 'docs'];

const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e',
  'em', 'entre', 'era', 'essa', 'esse', 'esta', 'este', 'foi', 'for', 'in',
  'is', 'mais', 'mas', 'na', 'nas', 'no', 'nos', 'nao', 'o', 'of', 'on', 'os',
  'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos', 'por', 'qual', 'quando',
  'que', 'se', 'sem', 'ser', 'seu', 'sua', 'suas', 'seus', 'so', 'sobre',
  'the', 'to', 'um', 'uma', 'umas', 'uns', 'with', 'and', 'or', 'from', 'by'
]);

const SECRET_FILE_PATTERN = /(?:^|[\\/])\.env(?:\.|$)|(?:^|[\\/])private-assets(?:[\\/]|$)|\.(?:pem|key|p12|pfx)$/i;

const SECRET_VALUE_PATTERNS = [
  /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}\b/g,
  /\bwhsec_[A-Za-z0-9]{10,}\b/g,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(?:postgres|postgresql|mysql|redis|rediss):\/\/[^\s"'`]+/gi,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/g,
  /\bre_[A-Za-z0-9_]{16,}\b/g,
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g
];

export function sanitizeText(input) {
  if (!input) return '';
  let result = String(input);
  for (const pattern of SECRET_VALUE_PATTERNS) {
    result = result.replace(pattern, '[REDACTED]');
  }
  result = result.replace(
    /\b([A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY|SERVICE_ROLE_KEY|ENCRYPTION_KEY)[A-Z0-9_]*)\s*=\s*([^\s"'`#]+)/g,
    '$1=[REDACTED]'
  );
  return result;
}

export function isForbiddenPath(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  return SECRET_FILE_PATTERN.test(normalized);
}

export function normalizeToken(raw) {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '')
    .replace(/^[-_/]+|[-_/]+$/g, '');
}

export function tokenize(text) {
  const cleaned = sanitizeText(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const rawTokens = cleaned.split(/[^a-z0-9_-]+/g);
  const tokens = [];
  for (const token of rawTokens) {
    const trimmed = token.replace(/^[-_]+|[-_]+$/g, '');
    if (trimmed.length < 2) continue;
    if (STOPWORDS.has(trimmed)) continue;
    if (/^\d+$/.test(trimmed) && trimmed.length < 4) continue;
    tokens.push(trimmed);
  }
  return tokens;
}

function parseListValue(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(',')
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  return [trimmed.replace(/^['"]|['"]$/g, '')].filter(Boolean);
}

export function parseFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { frontmatter: {}, body: normalized };
  }
  const endIdx = normalized.indexOf('\n---\n', 4);
  if (endIdx === -1) {
    return { frontmatter: {}, body: normalized };
  }
  const yamlBlock = normalized.slice(4, endIdx);
  const body = normalized.slice(endIdx + 5);
  const frontmatter = {};
  let activeListKey = null;

  for (const line of yamlBlock.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && activeListKey) {
      if (!Array.isArray(frontmatter[activeListKey])) {
        frontmatter[activeListKey] = [];
      }
      frontmatter[activeListKey].push(listMatch[1].trim().replace(/^['"]|['"]$/g, ''));
      continue;
    }
    const kvMatch = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      if (!value) {
        activeListKey = key;
        frontmatter[key] = [];
      } else if (key === 'tags' || key === 'links' || key === 'triggers') {
        activeListKey = null;
        frontmatter[key] = parseListValue(value);
      } else {
        activeListKey = null;
        frontmatter[key] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return { frontmatter, body };
}

function stripCodeBlocks(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '');
}

export function extractHeadings(body) {
  const withoutCode = stripCodeBlocks(body);
  const headings = [];
  for (const line of withoutCode.split('\n')) {
    const match = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (match) {
      headings.push(sanitizeText(match[2].replace(/`/g, '').trim()));
    }
  }
  return headings;
}

export function extractWikilinks(body) {
  const withoutCode = stripCodeBlocks(body);
  const results = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let match;
  while ((match = regex.exec(withoutCode)) !== null) {
    const rawInner = match[1].trim();
    const target = rawInner.split('|')[0].split('#')[0].trim();
    if (target) results.push(target);
  }
  return results;
}

export function extractMarkdownLinks(body) {
  const withoutCode = stripCodeBlocks(body);
  const results = [];
  const regex = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(withoutCode)) !== null) {
    const rawHref = match[1].trim().split(/\s+/)[0];
    if (!rawHref) continue;
    if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(rawHref)) continue;
    const cleanHref = rawHref.split('#')[0].split('?')[0].trim();
    if (cleanHref) results.push(cleanHref);
  }
  return results;
}

function buildExcerpt(body) {
  const withoutCode = stripCodeBlocks(body);
  const lines = [];
  for (const rawLine of withoutCode.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#')) continue;
    if (line.startsWith('|') || line.startsWith('---')) continue;
    lines.push(line);
    if (lines.join(' ').length >= 220) break;
  }
  const combined = sanitizeText(lines.join(' ').replace(/\s+/g, ' ').trim());
  return combined.length > 220 ? `${combined.slice(0, 217)}...` : combined;
}

function walkMarkdownFiles(rootDir, relDir) {
  const absDir = path.join(rootDir, relDir);
  if (!fs.existsSync(absDir)) return [];
  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relPath = path.posix.join(relDir.replace(/\\/g, '/'), entry.name);
    if (isForbiddenPath(relPath)) continue;
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') && entry.name !== '.ai-memory') continue;
      files.push(...walkMarkdownFiles(rootDir, relPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(relPath);
    }
  }
  return files.sort();
}

function computeCanonicalNodeId(relPath, frontmatter, usedIds) {
  const posixPath = relPath.replace(/\\/g, '/');
  const baseName = path.posix.basename(posixPath, '.md');
  if (posixPath.startsWith('.ai-memory/')) {
    const candidate = (frontmatter.id || baseName).trim();
    if (!usedIds.has(candidate)) {
      usedIds.add(candidate);
      return candidate;
    }
  }
  const noExt = posixPath.replace(/\.md$/i, '');
  const candidate = frontmatter.id && !usedIds.has(frontmatter.id) ? frontmatter.id : noExt;
  usedIds.add(candidate);
  return candidate;
}

export function buildGraphIndex({ rootDir = process.cwd(), write = true } = {}) {
  const mdFiles = [];
  for (const dir of SCAN_DIRS) {
    mdFiles.push(...walkMarkdownFiles(rootDir, dir));
  }
  mdFiles.sort();

  const rawNodes = [];
  const usedIds = new Set();
  const byId = new Map();
  const byRelPath = new Map();
  const byNoExtPath = new Map();
  const byBasename = new Map();

  for (const relPath of mdFiles) {
    const absPath = path.join(rootDir, relPath);
    const rawContent = fs.readFileSync(absPath, 'utf8');
    const { frontmatter, body } = parseFrontmatter(rawContent);
    const id = computeCanonicalNodeId(relPath, frontmatter, usedIds);
    const headings = extractHeadings(body);
    const title =
      (typeof frontmatter.title === 'string' && frontmatter.title.trim()) ||
      headings[0] ||
      path.posix.basename(relPath, '.md');
    const tags = Array.isArray(frontmatter.tags)
      ? [...new Set(frontmatter.tags.map((t) => normalizeToken(t)).filter(Boolean))].sort()
      : [];
    const fmLinks = Array.isArray(frontmatter.links)
      ? frontmatter.links.map((l) => String(l).trim()).filter(Boolean)
      : [];
    const wikilinks = extractWikilinks(body);
    const mdLinks = extractMarkdownLinks(body);
    const excerpt = buildExcerpt(body);

    const node = {
      id,
      path: relPath,
      title: sanitizeText(title),
      updated: typeof frontmatter.updated === 'string' ? frontmatter.updated : null,
      tags,
      headings,
      excerpt,
      rawFrontmatterLinks: fmLinks,
      rawWikilinks: wikilinks,
      rawMarkdownLinks: mdLinks,
      bodyText: sanitizeText(body)
    };

    rawNodes.push(node);
    byId.set(id, node);
    byId.set(id.toLowerCase(), node);
    byRelPath.set(relPath.toLowerCase(), node);
    const noExt = relPath.replace(/\.md$/i, '').toLowerCase();
    byNoExtPath.set(noExt, node);
    const base = path.posix.basename(relPath, '.md').toLowerCase();
    if (!byBasename.has(base) || relPath.startsWith('.ai-memory/')) {
      byBasename.set(base, node);
    }
  }

  function resolveReference(sourceNode, ref, kind) {
    const trimmed = String(ref || '').trim();
    if (!trimmed) return { targetId: null, broken: false };

    if (kind === 'wikilink' || kind === 'frontmatter') {
      const normalized = trimmed.replace(/\.md$/i, '');
      const lower = normalized.toLowerCase();
      const matched =
        byId.get(normalized) ||
        byId.get(lower) ||
        byNoExtPath.get(lower) ||
        byRelPath.get(`${lower}.md`) ||
        byBasename.get(path.posix.basename(lower));
      if (matched) return { targetId: matched.id, broken: false };
      return { targetId: null, broken: true, raw: trimmed, kind };
    }

    const sourceDir = path.posix.dirname(sourceNode.path);
    const resolvedPosix = trimmed.startsWith('/')
      ? trimmed.slice(1)
      : path.posix.normalize(path.posix.join(sourceDir, trimmed));

    if (resolvedPosix.startsWith('..')) {
      return { targetId: null, broken: true, raw: trimmed, kind };
    }

    const lowerResolved = resolvedPosix.toLowerCase();
    const matched =
      byRelPath.get(lowerResolved) ||
      byRelPath.get(`${lowerResolved}.md`) ||
      byNoExtPath.get(lowerResolved);
    if (matched) {
      return { targetId: matched.id, broken: false };
    }

    const absCandidate = path.join(rootDir, resolvedPosix);
    const absCandidateMd = path.join(rootDir, `${resolvedPosix}.md`);
    if (fs.existsSync(absCandidate) || fs.existsSync(absCandidateMd)) {
      return { targetId: null, broken: false };
    }

    return { targetId: null, broken: true, raw: trimmed, kind };
  }

  const outgoingMap = new Map();
  const incomingMap = new Map();
  const brokenLinks = [];

  for (const node of rawNodes) {
    outgoingMap.set(node.id, new Set());
    incomingMap.set(node.id, new Set());
  }

  for (const node of rawNodes) {
    const refs = [
      ...node.rawFrontmatterLinks.map((r) => ({ ref: r, kind: 'frontmatter' })),
      ...node.rawWikilinks.map((r) => ({ ref: r, kind: 'wikilink' })),
      ...node.rawMarkdownLinks.map((r) => ({ ref: r, kind: 'markdown' }))
    ];

    for (const { ref, kind } of refs) {
      const res = resolveReference(node, ref, kind);
      if (res.targetId && res.targetId !== node.id) {
        outgoingMap.get(node.id).add(res.targetId);
        incomingMap.get(res.targetId).add(node.id);
      } else if (res.broken) {
        brokenLinks.push({
          from: node.id,
          path: node.path,
          target: ref,
          kind
        });
      }
    }
  }

  const invertedMap = new Map();
  function addPosting(term, nodeId) {
    if (!term || term.length < 2) return;
    if (!invertedMap.has(term)) {
      invertedMap.set(term, new Set());
    }
    invertedMap.get(term).add(nodeId);
  }

  const finalNodes = {};
  const sortedNodes = [...rawNodes].sort((a, b) => a.id.localeCompare(b.id));

  for (const node of sortedNodes) {
    const outgoing = [...outgoingMap.get(node.id)].sort();
    const incoming = [...incomingMap.get(node.id)].sort();

    for (const tag of node.tags) {
      addPosting(tag, node.id);
      for (const sub of tokenize(tag)) addPosting(sub, node.id);
    }
    for (const tok of tokenize(node.id)) addPosting(tok, node.id);
    for (const tok of tokenize(node.title)) addPosting(tok, node.id);
    for (const h of node.headings) {
      for (const tok of tokenize(h)) addPosting(tok, node.id);
    }
    for (const tok of tokenize(node.bodyText)) {
      addPosting(tok, node.id);
    }

    finalNodes[node.id] = {
      id: node.id,
      path: node.path,
      title: node.title,
      updated: node.updated,
      tags: node.tags,
      headings: node.headings,
      excerpt: node.excerpt,
      outgoing,
      incoming
    };
  }

  const edges = [];
  for (const nodeId of Object.keys(finalNodes)) {
    for (const targetId of finalNodes[nodeId].outgoing) {
      edges.push({ from: nodeId, to: targetId });
    }
  }
  edges.sort((a, b) => (a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from)));

  const invertedIndex = {};
  for (const term of [...invertedMap.keys()].sort()) {
    invertedIndex[term] = [...invertedMap.get(term)].sort();
  }

  brokenLinks.sort((a, b) =>
    a.from === b.from ? a.target.localeCompare(b.target) : a.from.localeCompare(b.from)
  );

  const orphanNodes = Object.values(finalNodes)
    .filter((n) => n.outgoing.length === 0 && n.incoming.length === 0)
    .map((n) => n.id)
    .sort();

  const indexData = {
    schemaVersion: 1,
    stats: {
      nodeCount: Object.keys(finalNodes).length,
      edgeCount: edges.length,
      orphanCount: orphanNodes.length,
      brokenLinkCount: brokenLinks.length
    },
    nodes: finalNodes,
    edges,
    orphanNodes,
    brokenLinks,
    invertedIndex
  };

  if (write) {
    const outPath = path.join(rootDir, INDEX_RELATIVE_PATH);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(indexData, null, 2)}\n`, 'utf8');
  }

  return indexData;
}

export function loadOrBuildGraphIndex({ rootDir = process.cwd() } = {}) {
  const indexPath = path.join(rootDir, INDEX_RELATIVE_PATH);
  if (!fs.existsSync(indexPath)) {
    return buildGraphIndex({ rootDir, write: true });
  }
  return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
}

function buildTermMatches(queryTerms, invertedIndex) {
  const indexKeys = Object.keys(invertedIndex);
  const exactMap = new Map();
  const prefixMap = new Map();

  for (const term of queryTerms) {
    exactMap.set(term, new Set(invertedIndex[term] || []));
    const prefixSet = new Set();
    for (let i = 0; i < indexKeys.length; i++) {
      const indexedTerm = indexKeys[i];
      if (indexedTerm !== term && indexedTerm.startsWith(term)) {
        const postings = invertedIndex[indexedTerm];
        for (let j = 0; j < postings.length; j++) {
          prefixSet.add(postings[j]);
        }
      }
    }
    prefixMap.set(term, prefixSet);
  }

  return { exactMap, prefixMap };
}

function scoreNodeDirect(node, queryTerms, termMatches) {
  let score = 0;
  const matchedHeadings = [];
  const lowerId = node.id.toLowerCase();
  const lowerTitle = node.title.toLowerCase();
  const lowerPath = node.path.toLowerCase();
  const lowerExcerpt = node.excerpt.toLowerCase();
  const normalizedTags = node.tags.map((t) => t.toLowerCase());

  for (const term of queryTerms) {
    if (lowerId === term || lowerId.includes(term)) score += 12;
    if (lowerPath.includes(term)) score += 6;
    if (normalizedTags.some((t) => t === term || t.includes(term))) score += 10;
    if (lowerTitle.includes(term)) score += 8;

    for (const heading of node.headings) {
      const normalizedHeading = heading
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
      if (normalizedHeading.includes(term)) {
        score += 5;
        if (!matchedHeadings.includes(heading)) {
          matchedHeadings.push(heading);
        }
      }
    }

    if (lowerExcerpt.includes(term)) score += 3;
    if (termMatches.exactMap.get(term)?.has(node.id)) {
      score += 4;
    } else if (termMatches.prefixMap.get(term)?.has(node.id)) {
      score += 2;
    }
  }

  if (score > 0 && lowerPath.startsWith('.ai-memory/')) {
    score += 6;
  }

  return { score, matchedHeadings };
}

export function queryGraph(queryString, { rootDir = process.cwd(), depth = 2, limit = 6, indexData = null } = {}) {
  const graph = indexData || loadOrBuildGraphIndex({ rootDir });
  const startMs = performance.now();
  const queryTerms = [...new Set(tokenize(queryString))];
  const termMatches = buildTermMatches(queryTerms, graph.invertedIndex);

  const directScores = new Map();
  const matchedHeadingsMap = new Map();

  for (const node of Object.values(graph.nodes)) {
    const { score, matchedHeadings } = scoreNodeDirect(node, queryTerms, termMatches);
    directScores.set(node.id, score);
    matchedHeadingsMap.set(node.id, matchedHeadings);
  }

  const seedIds = [...directScores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);

  const hopMap = new Map();
  const totalScores = new Map();
  const viaMap = new Map();
  const queue = [];

  for (const seedId of seedIds) {
    hopMap.set(seedId, 0);
    totalScores.set(seedId, directScores.get(seedId));
    queue.push({ id: seedId, hop: 0, seedScore: directScores.get(seedId) });
  }

  const DECAY = 0.45;
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.hop >= depth) continue;
    const node = graph.nodes[current.id];
    if (!node) continue;

    const neighbors = [
      ...node.outgoing.map((n) => ({ id: n, weight: 1.0 })),
      ...node.incoming.map((n) => ({ id: n, weight: 0.85 }))
    ];

    for (const neighbor of neighbors) {
      if (!graph.nodes[neighbor.id]) continue;
      const nextHop = current.hop + 1;
      const propagated = Number((current.seedScore * Math.pow(DECAY, nextHop) * neighbor.weight).toFixed(2));
      const baseDirect = directScores.get(neighbor.id) || 0;

      if (!hopMap.has(neighbor.id)) {
        hopMap.set(neighbor.id, nextHop);
        totalScores.set(neighbor.id, Number((baseDirect + propagated).toFixed(2)));
        viaMap.set(neighbor.id, current.id);
        queue.push({ id: neighbor.id, hop: nextHop, seedScore: current.seedScore });
      } else {
        const prevScore = totalScores.get(neighbor.id) || 0;
        if (baseDirect + propagated > prevScore) {
          totalScores.set(neighbor.id, Number((baseDirect + propagated).toFixed(2)));
        }
        if (nextHop < hopMap.get(neighbor.id)) {
          hopMap.set(neighbor.id, nextHop);
          viaMap.set(neighbor.id, current.id);
        }
      }
    }
  }

  const ranked = [...totalScores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const hopA = hopMap.get(a[0]) ?? 99;
      const hopB = hopMap.get(b[0]) ?? 99;
      if (hopA !== hopB) return hopA - hopB;
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([id, score]) => {
      const node = graph.nodes[id];
      const connected = [...new Set([...node.outgoing, ...node.incoming])].sort();
      return {
        id: node.id,
        path: node.path,
        title: node.title,
        score,
        hop: hopMap.get(id) ?? 0,
        via: viaMap.get(id) || null,
        tags: node.tags,
        matchedHeadings: matchedHeadingsMap.get(id) || [],
        neighbors: connected,
        excerpt: node.excerpt
      };
    });

  const elapsedMs = Number((performance.now() - startMs).toFixed(2));
  return {
    query: queryString,
    terms: queryTerms,
    depth,
    limit,
    elapsedMs,
    results: ranked
  };
}

function findNodeInGraph(graph, target) {
  const trimmed = String(target || '').trim();
  if (!trimmed) return null;
  if (graph.nodes[trimmed]) return graph.nodes[trimmed];
  const lower = trimmed.toLowerCase().replace(/\.md$/i, '');
  for (const node of Object.values(graph.nodes)) {
    if (
      node.id.toLowerCase() === lower ||
      node.path.toLowerCase() === trimmed.toLowerCase() ||
      node.path.toLowerCase().replace(/\.md$/i, '') === lower ||
      path.posix.basename(node.path, '.md').toLowerCase() === lower
    ) {
      return node;
    }
  }
  return null;
}

export function getNeighbors(targetId, { rootDir = process.cwd(), depth = 1, indexData = null } = {}) {
  const graph = indexData || loadOrBuildGraphIndex({ rootDir });
  const startNode = findNodeInGraph(graph, targetId);
  if (!startNode) {
    return { node: null, depth, neighbors: [] };
  }

  const visited = new Map([[startNode.id, { hop: 0, direction: 'self', via: null }]]);
  const queue = [{ id: startNode.id, hop: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current.hop >= depth) continue;
    const node = graph.nodes[current.id];
    if (!node) continue;

    const outSet = new Set(node.outgoing);
    const inSet = new Set(node.incoming);
    const allIds = [...new Set([...outSet, ...inSet])].sort();

    for (const neighborId of allIds) {
      if (!graph.nodes[neighborId]) continue;
      const dir =
        outSet.has(neighborId) && inSet.has(neighborId)
          ? 'both'
          : outSet.has(neighborId)
            ? 'outgoing'
            : 'incoming';
      if (!visited.has(neighborId)) {
        visited.set(neighborId, { hop: current.hop + 1, direction: dir, via: current.id });
        queue.push({ id: neighborId, hop: current.hop + 1 });
      }
    }
  }

  const neighbors = [];
  for (const [id, info] of visited.entries()) {
    if (id === startNode.id) continue;
    const n = graph.nodes[id];
    neighbors.push({
      id: n.id,
      path: n.path,
      title: n.title,
      hop: info.hop,
      direction: info.direction,
      via: info.via
    });
  }

  neighbors.sort((a, b) => (a.hop === b.hop ? a.id.localeCompare(b.id) : a.hop - b.hop));
  return {
    node: { id: startNode.id, path: startNode.path, title: startNode.title },
    depth,
    neighbors
  };
}

export function getGraphStats({ rootDir = process.cwd(), indexData = null } = {}) {
  const graph = indexData || loadOrBuildGraphIndex({ rootDir });
  return {
    ...graph.stats,
    orphanNodes: graph.orphanNodes,
    brokenLinks: graph.brokenLinks
  };
}

function parseCliArgs(argv) {
  const positional = [];
  const flags = {
    depth: null,
    limit: null,
    root: process.cwd(),
    json: false
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--depth' && argv[i + 1]) {
      flags.depth = Number.parseInt(argv[++i], 10);
    } else if (arg === '--limit' && argv[i + 1]) {
      flags.limit = Number.parseInt(argv[++i], 10);
    } else if (arg === '--root' && argv[i + 1]) {
      flags.root = path.resolve(argv[++i]);
    } else if (arg === '--json') {
      flags.json = true;
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function runCli() {
  const { positional, flags } = parseCliArgs(process.argv.slice(2));
  const command = positional[0] || 'stats';

  if (command === 'build') {
    const startMs = performance.now();
    const index = buildGraphIndex({ rootDir: flags.root, write: true });
    const elapsedMs = Number((performance.now() - startMs).toFixed(2));
    if (flags.json) {
      console.log(JSON.stringify({ elapsedMs, ...index.stats }, null, 2));
    } else {
      console.log(
        `[memory-graph] build ok in ${elapsedMs}ms | nodes=${index.stats.nodeCount} edges=${index.stats.edgeCount} orphans=${index.stats.orphanCount} broken=${index.stats.brokenLinkCount}`
      );
    }
    return;
  }

  if (command === 'query') {
    const terms = positional.slice(1).join(' ').trim();
    if (!terms) {
      console.error('Usage: memory-graph.mjs query <terms> [--depth 2] [--limit 6] [--json]');
      process.exit(1);
    }
    const res = queryGraph(terms, {
      rootDir: flags.root,
      depth: Number.isFinite(flags.depth) ? flags.depth : 2,
      limit: Number.isFinite(flags.limit) ? flags.limit : 6
    });
    if (flags.json) {
      console.log(JSON.stringify(res, null, 2));
      return;
    }
    console.log(
      `[memory-graph] query="${res.query}" depth=${res.depth} hits=${res.results.length} elapsed=${res.elapsedMs}ms`
    );
    for (const item of res.results) {
      const viaLabel = item.via ? ` via=${item.via}` : '';
      const headingsLabel = item.matchedHeadings.length
        ? ` | headings: ${item.matchedHeadings.slice(0, 3).join('; ')}`
        : '';
      const neighborsLabel = item.neighbors.length
        ? ` | neighbors: ${item.neighbors.slice(0, 6).join(', ')}`
        : '';
      console.log(
        `- [${item.id}] (${item.path}) score=${item.score} hop=${item.hop}${viaLabel}${headingsLabel}${neighborsLabel}`
      );
      if (item.excerpt) {
        console.log(`  excerpt: ${item.excerpt}`);
      }
    }
    return;
  }

  if (command === 'neighbors') {
    const nodeId = positional[1];
    if (!nodeId) {
      console.error('Usage: memory-graph.mjs neighbors <nodeId> [--depth 1] [--json]');
      process.exit(1);
    }
    const res = getNeighbors(nodeId, {
      rootDir: flags.root,
      depth: Number.isFinite(flags.depth) ? flags.depth : 1
    });
    if (!res.node) {
      console.error(`[memory-graph] node not found: ${nodeId}`);
      process.exit(1);
    }
    if (flags.json) {
      console.log(JSON.stringify(res, null, 2));
      return;
    }
    console.log(
      `[memory-graph] neighbors of ${res.node.id} (${res.node.path}) depth=${res.depth} count=${res.neighbors.length}`
    );
    for (const n of res.neighbors) {
      console.log(`- [${n.id}] (${n.path}) hop=${n.hop} dir=${n.direction} via=${n.via}`);
    }
    return;
  }

  if (command === 'stats') {
    const stats = getGraphStats({ rootDir: flags.root });
    if (flags.json) {
      console.log(JSON.stringify(stats, null, 2));
      return;
    }
    console.log(
      `[memory-graph] nodes=${stats.nodeCount} edges=${stats.edgeCount} orphans=${stats.orphanCount} brokenLinks=${stats.brokenLinkCount}`
    );
    if (stats.orphanNodes.length > 0) {
      console.log(`orphans: ${stats.orphanNodes.join(', ')}`);
    }
    if (stats.brokenLinks.length > 0) {
      for (const b of stats.brokenLinks) {
        console.log(`broken: ${b.from} (${b.path}) -> ${b.target} [${b.kind}]`);
      }
    }
    return;
  }

  console.error(`Unknown command: ${command}. Use build | query | neighbors | stats.`);
  process.exit(1);
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  runCli();
}
