import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';

import { mergeJsonTarget, syncIdeConfigs } from './sync-ide-configs.mjs';

const tempRoots = [];

async function makeTempRepo() {
  const root = path.join(
    os.tmpdir(),
    `portal-nkl-ide-sync-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  await mkdir(path.join(root, 'tools'), { recursive: true });
  await mkdir(path.join(root, '.vscode'), { recursive: true });
  const manifestSource = await readFile(
    path.join(process.cwd(), 'tools', 'ide-mcp-manifest.json'),
    'utf8',
  );
  await writeFile(path.join(root, 'tools', 'ide-mcp-manifest.json'), manifestSource, 'utf8');
  tempRoots.push(root);
  return root;
}

afterEach(async () => {
  while (tempRoots.length > 0) {
    const dir = tempRoots.pop();
    await rm(dir, { recursive: true, force: true });
  }
});

test('mergeJsonTarget preserves custom servers and converts workspaceFolder per target', () => {
  const manifest = {
    version: 1,
    inputs: [
      {
        id: 'clarity-api-token',
        type: 'promptString',
        description: 'Clarity token',
        password: true,
        targets: ['vscode'],
      },
    ],
    servers: {
      'portal-nkl-deepseek': {
        transport: 'stdio',
        command: 'node',
        args: ['${workspaceFolder}/node_modules/tsx/dist/cli.mjs', '${workspaceFolder}/tools/deepseek-mcp.ts'],
        targets: ['vscode', 'mcp-json', 'cursor', 'antigravity'],
      },
      supabase: {
        transport: 'http',
        url: 'https://mcp.supabase.com/mcp',
        targets: ['vscode', 'mcp-json', 'cursor', 'antigravity'],
      },
      'microsoft-clarity': {
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@microsoft/clarity-mcp-server@2.0.1', '--clarity_api_token=${input:clarity-api-token}'],
        targets: ['vscode'],
      },
    },
  };

  const repoRoot = path.resolve('C:\\repos\\portal-nkl');

  const vscodeMerged = mergeJsonTarget(
    'vscode',
    manifest,
    {
      inputs: [{ id: 'custom-input', type: 'promptString', description: 'Custom' }],
      servers: { 'custom-vscode': { type: 'http', url: 'https://example.com/mcp' } },
    },
    repoRoot,
  );
  assert.equal(vscodeMerged.preserved.includes('custom-vscode'), true);
  assert.equal(vscodeMerged.data.servers['custom-vscode'].url, 'https://example.com/mcp');
  assert.equal(
    vscodeMerged.data.servers['portal-nkl-deepseek'].args[0],
    '${workspaceFolder}/node_modules/tsx/dist/cli.mjs',
  );
  assert.equal(Boolean(vscodeMerged.data.servers['microsoft-clarity']), true);
  assert.equal(vscodeMerged.data.inputs.some((i) => i.id === 'clarity-api-token'), true);
  assert.equal(vscodeMerged.data.inputs.some((i) => i.id === 'custom-input'), true);

  const cursorMerged = mergeJsonTarget(
    'cursor',
    manifest,
    { mcpServers: { 'custom-cursor': { type: 'stdio', command: 'echo', args: ['hi'] } } },
    repoRoot,
  );
  assert.equal(cursorMerged.preserved.includes('custom-cursor'), true);
  assert.equal(
    cursorMerged.data.mcpServers['portal-nkl-deepseek'].args[0],
    './node_modules/tsx/dist/cli.mjs',
  );
  assert.equal(cursorMerged.data.mcpServers['microsoft-clarity'], undefined);

  const antigravityMerged = mergeJsonTarget(
    'antigravity',
    manifest,
    {
      mcpServers: {
        'custom-agy': { url: 'https://custom.local/mcp' },
        supabase: { serverUrl: 'https://mcp.supabase.com/mcp' },
      },
    },
    repoRoot,
  );
  assert.equal(antigravityMerged.preserved.includes('custom-agy'), true);
  assert.equal(antigravityMerged.data.mcpServers['custom-agy'].url, 'https://custom.local/mcp');
  assert.equal(
    antigravityMerged.data.mcpServers['portal-nkl-deepseek'].args[0],
    path.resolve(repoRoot, 'node_modules/tsx/dist/cli.mjs'),
  );
  assert.equal(antigravityMerged.data.mcpServers['portal-nkl-deepseek'].type, undefined);
  assert.equal(antigravityMerged.data.mcpServers.supabase.serverUrl, 'https://mcp.supabase.com/mcp');
  assert.equal(antigravityMerged.data.mcpServers['microsoft-clarity'], undefined);
});

test('syncIdeConfigs writes non-destructively and dryRun leaves disk untouched', async () => {
  const root = await makeTempRepo();
  const agyPath = path.join(root, 'antigravity-mcp.json');

  await writeFile(
    path.join(root, '.vscode', 'mcp.json'),
    JSON.stringify({
      inputs: [],
      servers: { 'legacy-vscode-server': { type: 'http', url: 'https://legacy.invalid/mcp' } },
    }),
    'utf8',
  );
  await writeFile(
    agyPath,
    JSON.stringify({
      mcpServers: {
        supabase: { serverUrl: 'https://mcp.supabase.com/mcp' },
        'custom-agy-only': { url: 'https://agy.invalid/mcp' },
      },
    }),
    'utf8',
  );

  const dryReports = await syncIdeConfigs({
    repoRoot: root,
    antigravityConfigPath: agyPath,
    dryRun: true,
  });
  assert.equal(dryReports.length, 4);
  assert.equal(dryReports.every((r) => r.dryRun === true), true);
  assert.equal(existsSync(path.join(root, '.mcp.json')), false);
  assert.equal(existsSync(path.join(root, '.cursor', 'mcp.json')), false);

  await syncIdeConfigs({
    repoRoot: root,
    antigravityConfigPath: agyPath,
    dryRun: false,
  });

  const vscodeJson = JSON.parse(await readFile(path.join(root, '.vscode', 'mcp.json'), 'utf8'));
  const mcpJson = JSON.parse(await readFile(path.join(root, '.mcp.json'), 'utf8'));
  const cursorJson = JSON.parse(await readFile(path.join(root, '.cursor', 'mcp.json'), 'utf8'));
  const agyJson = JSON.parse(await readFile(agyPath, 'utf8'));

  assert.equal(Boolean(vscodeJson.servers['legacy-vscode-server']), true);
  assert.equal(Boolean(vscodeJson.servers['microsoft-clarity']), true);
  assert.equal(Boolean(vscodeJson.servers['cloudflare-api']), true);
  assert.equal(vscodeJson.servers.stripe?.url, 'https://mcp.stripe.com');
  assert.equal(Boolean(vscodeJson.servers['portal-nkl-deepseek']), true);
  assert.equal(vscodeJson.inputs.some((i) => i.id === 'clarity-api-token'), true);

  assert.equal(mcpJson.mcpServers['portal-nkl-deepseek'].args[0], './node_modules/tsx/dist/cli.mjs');
  assert.equal(Boolean(mcpJson.mcpServers['cloudflare-api']), true);
  assert.equal(mcpJson.mcpServers.stripe?.url, 'https://mcp.stripe.com');
  assert.equal(mcpJson.mcpServers['microsoft-clarity'], undefined);

  assert.equal(cursorJson.mcpServers['portal-nkl-deepseek'].args[1], './tools/deepseek-mcp.ts');
  assert.equal(cursorJson.mcpServers.stripe?.url, 'https://mcp.stripe.com');
  assert.equal(cursorJson.mcpServers['microsoft-clarity'], undefined);

  assert.equal(agyJson.mcpServers['custom-agy-only'].url, 'https://agy.invalid/mcp');
  assert.equal(agyJson.mcpServers.supabase.serverUrl, 'https://mcp.supabase.com/mcp');
  assert.equal(agyJson.mcpServers['cloudflare-api'].serverUrl, 'https://mcp.cloudflare.com/mcp');
  assert.equal(agyJson.mcpServers.stripe?.serverUrl, 'https://mcp.stripe.com');
  assert.equal(
    agyJson.mcpServers['portal-nkl-deepseek'].args[0],
    path.resolve(root, 'node_modules/tsx/dist/cli.mjs'),
  );
  assert.equal(agyJson.mcpServers['microsoft-clarity'], undefined);
});
