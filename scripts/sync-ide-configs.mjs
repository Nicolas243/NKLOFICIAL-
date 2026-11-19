import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_MANIFEST_REL = path.join('tools', 'ide-mcp-manifest.json');
const GLOBAL_CLIS = ['node', 'npm', 'git', 'gh', 'vercel', 'stripe', '9router', 'uvx', 'code'];
const LOCAL_BINS = ['supabase', 'playwright'];
const EXTENSION_ID_PATTERN = /^[a-z0-9-]+\.[a-z0-9.-]+$/i;

export function resolveArgForTarget(arg, target, repoRoot) {
  if (typeof arg !== 'string') {
    return String(arg);
  }
  if (target === 'vscode') {
    return arg;
  }
  if (target === 'mcp-json' || target === 'cursor') {
    if (arg === '${workspaceFolder}') {
      return '.';
    }
    return arg.replaceAll('${workspaceFolder}/', './').replaceAll('${workspaceFolder}', '.');
  }
  if (target === 'antigravity') {
    const exactMatch = arg.match(/^\$\{workspaceFolder\}(?:\/(.*))?$/);
    if (exactMatch) {
      return path.resolve(repoRoot, exactMatch[1] || '.');
    }
    return arg.replaceAll('${workspaceFolder}', repoRoot);
  }
  return arg;
}

export function buildTargetEntry(spec, target, repoRoot, existingEntry) {
  if (spec.transport === 'http') {
    if (target === 'antigravity') {
      const useUrlKey =
        existingEntry &&
        typeof existingEntry === 'object' &&
        'url' in existingEntry &&
        !('serverUrl' in existingEntry);
      return useUrlKey ? { url: spec.url } : { serverUrl: spec.url };
    }
    return {
      type: 'http',
      url: spec.url,
    };
  }

  const resolvedArgs = Array.isArray(spec.args)
    ? spec.args.map((arg) => resolveArgForTarget(arg, target, repoRoot))
    : [];

  if (target === 'antigravity') {
    return {
      command: spec.command,
      args: resolvedArgs,
    };
  }

  return {
    type: 'stdio',
    command: spec.command,
    args: resolvedArgs,
  };
}

export function mergeJsonTarget(target, manifest, existingData, repoRoot) {
  const base =
    existingData && typeof existingData === 'object' && !Array.isArray(existingData)
      ? { ...existingData }
      : {};
  const serversSpec = manifest.servers ?? {};
  const targetServerNames = Object.keys(serversSpec).filter((name) =>
    Array.isArray(serversSpec[name]?.targets) && serversSpec[name].targets.includes(target),
  );

  const serverKey = target === 'vscode' ? 'servers' : 'mcpServers';
  const existingServers =
    base[serverKey] && typeof base[serverKey] === 'object' && !Array.isArray(base[serverKey])
      ? { ...base[serverKey] }
      : {};

  const added = [];
  const updated = [];
  const nextServers = { ...existingServers };

  for (const name of targetServerNames) {
    const hadServer = Object.prototype.hasOwnProperty.call(existingServers, name);
    const nextEntry = buildTargetEntry(serversSpec[name], target, repoRoot, existingServers[name]);
    nextServers[name] = nextEntry;
    if (!hadServer) {
      added.push(name);
    } else if (JSON.stringify(existingServers[name]) !== JSON.stringify(nextEntry)) {
      updated.push(name);
    }
  }

  const preserved = Object.keys(existingServers).filter(
    (name) => !targetServerNames.includes(name),
  );

  const result = { ...base, [serverKey]: nextServers };

  if (target === 'vscode') {
    const manifestInputs = (manifest.inputs ?? []).filter(
      (item) => Array.isArray(item?.targets) && item.targets.includes('vscode'),
    );
    const existingInputs = Array.isArray(base.inputs) ? [...base.inputs] : [];
    const mergedInputs = [...existingInputs];

    for (const inputItem of manifestInputs) {
      const cleanInput = { ...inputItem };
      delete cleanInput.targets;
      const existingIdx = mergedInputs.findIndex(
        (entry) => entry && typeof entry === 'object' && entry.id === cleanInput.id,
      );
      if (existingIdx >= 0) {
        mergedInputs[existingIdx] = cleanInput;
      } else {
        mergedInputs.push(cleanInput);
      }
    }
    result.inputs = mergedInputs;
  }

  return {
    data: result,
    added,
    updated,
    preserved,
  };
}

function defaultAntigravityPath() {
  return path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json');
}

function defaultVsCodeUserMcpPath() {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Code', 'User', 'mcp.json');
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'mcp.json');
  }
  return path.join(os.homedir(), '.config', 'Code', 'User', 'mcp.json');
}

async function readJsonSafe(filePath) {
  if (!existsSync(filePath)) {
    return { exists: false, valid: true, data: null };
  }
  try {
    const raw = await readFile(filePath, 'utf8');
    return { exists: true, valid: true, data: JSON.parse(raw), raw };
  } catch (error) {
    return {
      exists: true,
      valid: false,
      data: null,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

export async function syncIdeConfigs(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const dryRun = Boolean(options.dryRun);
  const includeGlobal = options.includeGlobal !== false;
  const manifestPath = options.manifestPath ?? path.join(repoRoot, DEFAULT_MANIFEST_REL);
  const antigravityPath = options.antigravityConfigPath ?? defaultAntigravityPath();

  const manifestRaw = await readFile(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestRaw);

  const targets = [
    { target: 'vscode', filePath: path.join(repoRoot, '.vscode', 'mcp.json') },
    { target: 'mcp-json', filePath: path.join(repoRoot, '.mcp.json') },
    { target: 'cursor', filePath: path.join(repoRoot, '.cursor', 'mcp.json') },
  ];
  if (includeGlobal) {
    targets.push({ target: 'antigravity', filePath: antigravityPath });
  }

  const reports = [];
  for (const item of targets) {
    const existing = await readJsonSafe(item.filePath);
    if (existing.exists && !existing.valid) {
      throw new Error(`Invalid JSON in ${item.filePath}: ${existing.error}`);
    }

    const merged = mergeJsonTarget(item.target, manifest, existing.data, repoRoot);
    const nextText = `${JSON.stringify(merged.data, null, 2)}\n`;
    const changed = !existing.exists || existing.raw !== nextText;

    if (changed && !dryRun) {
      await mkdir(path.dirname(item.filePath), { recursive: true });
      await writeFile(item.filePath, nextText, 'utf8');
    }

    reports.push({
      target: item.target,
      filePath: item.filePath,
      changed,
      dryRun,
      added: merged.added,
      updated: merged.updated,
      preserved: merged.preserved,
    });
  }

  return reports;
}

function findExecutable(cmd, execFileSyncFn) {
  const finder = process.platform === 'win32' ? 'where.exe' : 'which';
  try {
    const output = execFileSyncFn(finder, [cmd], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const firstLine = output.split(/\r?\n/u).find((line) => line.trim());
    return firstLine ? firstLine.trim() : null;
  } catch {
    return null;
  }
}

function listInstalledVsCodeExtensions(execFileSyncFn) {
  try {
    const output =
      process.platform === 'win32'
        ? execFileSyncFn('cmd.exe', ['/d', '/s', '/c', 'code', '--list-extensions'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
          })
        : execFileSyncFn('code', ['--list-extensions'], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
          });
    return output
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

export async function runDoctor(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const antigravityPath = options.antigravityConfigPath ?? defaultAntigravityPath();
  const vsCodeUserMcpPath = options.vsCodeUserMcpPath ?? defaultVsCodeUserMcpPath();
  const execFileSyncFn = options.execFileSyncFn ?? execFileSync;

  const clis = GLOBAL_CLIS.map((name) => {
    const resolved = findExecutable(name, execFileSyncFn);
    return { name, scope: 'global', found: Boolean(resolved), path: resolved };
  });

  for (const bin of LOCAL_BINS) {
    const binName = process.platform === 'win32' ? `${bin}.cmd` : bin;
    const localPath = path.join(repoRoot, 'node_modules', '.bin', binName);
    const exists = existsSync(localPath);
    clis.push({
      name: bin,
      scope: 'local',
      found: exists,
      path: exists ? localPath : null,
    });
  }

  const mcpFiles = [
    { label: 'vscode-workspace', filePath: path.join(repoRoot, '.vscode', 'mcp.json'), key: 'servers' },
    { label: 'mcp-json', filePath: path.join(repoRoot, '.mcp.json'), key: 'mcpServers' },
    { label: 'cursor-workspace', filePath: path.join(repoRoot, '.cursor', 'mcp.json'), key: 'mcpServers' },
    { label: 'antigravity-global', filePath: antigravityPath, key: 'mcpServers' },
    { label: 'vscode-user-global', filePath: vsCodeUserMcpPath, key: 'servers' },
  ];

  const mcpReports = [];
  for (const entry of mcpFiles) {
    const parsed = await readJsonSafe(entry.filePath);
    if (!parsed.exists) {
      mcpReports.push({ ...entry, status: 'missing', servers: [] });
      continue;
    }
    if (!parsed.valid) {
      mcpReports.push({ ...entry, status: 'invalid', error: parsed.error, servers: [] });
      continue;
    }
    const map = parsed.data?.[entry.key];
    const servers =
      map && typeof map === 'object' && !Array.isArray(map) ? Object.keys(map) : [];
    mcpReports.push({ ...entry, status: 'ok', servers });
  }

  const extFile = await readJsonSafe(path.join(repoRoot, '.vscode', 'extensions.json'));
  const recommended =
    extFile.valid && Array.isArray(extFile.data?.recommendations)
      ? extFile.data.recommendations
      : [];
  const installedList = listInstalledVsCodeExtensions(execFileSyncFn);
  const installedSet = new Set((installedList ?? []).map((id) => id.toLowerCase()));
  const installed = installedList
    ? recommended.filter((id) => installedSet.has(id.toLowerCase()))
    : [];
  const missing = installedList
    ? recommended.filter((id) => !installedSet.has(id.toLowerCase()))
    : [];

  return {
    clis,
    mcpFiles: mcpReports,
    extensions: {
      codeAvailable: installedList !== null,
      recommended,
      installed,
      missing,
    },
  };
}

export async function installExtensions(options = {}) {
  const repoRoot = path.resolve(options.repoRoot ?? process.cwd());
  const dryRun = Boolean(options.dryRun);
  const execFileSyncFn = options.execFileSyncFn ?? execFileSync;

  const doctorReport = await runDoctor({ repoRoot, execFileSyncFn });
  if (!doctorReport.extensions.codeAvailable) {
    throw new Error('VS Code CLI (`code`) not found in PATH.');
  }

  const installed = [];
  const failed = [];
  for (const extId of doctorReport.extensions.missing) {
    if (!EXTENSION_ID_PATTERN.test(extId)) {
      failed.push({ id: extId, error: 'Invalid extension identifier' });
      continue;
    }
    if (dryRun) {
      installed.push(extId);
      continue;
    }
    try {
      if (process.platform === 'win32') {
        execFileSyncFn('cmd.exe', ['/d', '/s', '/c', 'code', '--install-extension', extId], {
          stdio: 'inherit',
        });
      } else {
        execFileSyncFn('code', ['--install-extension', extId], { stdio: 'inherit' });
      }
      installed.push(extId);
    } catch (error) {
      failed.push({
        id: extId,
        error: error instanceof Error ? error.message : 'Install failed',
      });
    }
  }

  return {
    dryRun,
    alreadyInstalled: doctorReport.extensions.installed,
    installed,
    failed,
  };
}

function formatSyncReport(reports) {
  for (const item of reports) {
    const mode = item.dryRun ? 'dry-run' : item.changed ? 'updated' : 'unchanged';
    console.log(
      `[${item.target}] ${mode} -> ${item.filePath} (added=[${item.added.join(', ')}] updated=[${item.updated.join(', ')}] preserved=[${item.preserved.join(', ')}])`,
    );
  }
}

function formatDoctorReport(report) {
  console.log('=== CLIs ===');
  for (const cli of report.clis) {
    const status = cli.found ? `OK (${cli.path})` : 'MISSING';
    console.log(`- ${cli.name} [${cli.scope}]: ${status}`);
  }
  console.log('=== MCP Configs ===');
  for (const mcp of report.mcpFiles) {
    if (mcp.status === 'ok') {
      console.log(`- ${mcp.label}: OK (${mcp.servers.length} servers: ${mcp.servers.join(', ')})`);
    } else if (mcp.status === 'missing') {
      console.log(`- ${mcp.label}: MISSING (${mcp.filePath})`);
    } else {
      console.log(`- ${mcp.label}: INVALID JSON (${mcp.error})`);
    }
  }
  console.log('=== VS Code Extensions ===');
  if (!report.extensions.codeAvailable) {
    console.log('- code CLI unavailable; cannot compare installed extensions.');
    return;
  }
  console.log(`- Installed (${report.extensions.installed.length}/${report.extensions.recommended.length}): ${report.extensions.installed.join(', ')}`);
  console.log(`- Missing (${report.extensions.missing.length}): ${report.extensions.missing.length > 0 ? report.extensions.missing.join(', ') : 'none'}`);
}

async function main() {
  const args = process.argv.slice(2);
  const subcommand = args[0] ?? 'doctor';
  const dryRun = args.includes('--dry-run');
  const includeGlobal = !args.includes('--no-global');

  if (subcommand === 'sync') {
    const reports = await syncIdeConfigs({ dryRun, includeGlobal });
    formatSyncReport(reports);
    return;
  }
  if (subcommand === 'doctor') {
    const report = await runDoctor();
    formatDoctorReport(report);
    return;
  }
  if (subcommand === 'install-extensions') {
    const result = await installExtensions({ dryRun });
    const verb = dryRun ? 'Would install' : 'Installed';
    console.log(`${verb} (${result.installed.length}): ${result.installed.join(', ') || 'none'}`);
    if (result.failed.length > 0) {
      console.error(`Failed (${result.failed.length}): ${result.failed.map((f) => f.id).join(', ')}`);
      process.exitCode = 1;
    }
    return;
  }

  console.error('Usage: node scripts/sync-ide-configs.mjs <sync|doctor|install-extensions> [--dry-run] [--no-global]');
  process.exitCode = 1;
}

function isEntrypoint() {
  const entrypoint = process.argv[1];
  if (!entrypoint) {
    return false;
  }
  const selfPath = path.resolve(fileURLToPath(import.meta.url));
  const entryPath = path.resolve(entrypoint);
  return process.platform === 'win32'
    ? selfPath.toLowerCase() === entryPath.toLowerCase()
    : selfPath === entryPath;
}

if (isEntrypoint()) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
