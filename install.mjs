#!/usr/bin/env node
// Installs (or updates) the ai-kit for this user. Idempotent; safe to re-run after `git pull`.
//
//   node install.mjs
//
// 1. Copies kit/ to ~/.ai-kit/
// 2. Claude Code: imports ~/.ai-kit/AGENTS.global.md from ~/.claude/CLAUDE.md (managed block)
// 3. Codex: writes the protocol into ~/.codex/AGENTS.md (managed block; Codex has no imports)
// 4. Registers the hosted Mem0 MCP server (`mem0`) in both tools when missing
// Content outside the managed blocks is never touched.

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MEM0_URL = 'https://mcp.mem0.ai/mcp';
const START = '<!-- ai-kit:start -->';
const END = '<!-- ai-kit:end -->';
const home = homedir();
const kitSrc = join(dirname(fileURLToPath(import.meta.url)), 'kit');
const kitDst = join(home, '.ai-kit');
const codexHome = process.env.CODEX_HOME || join(home, '.codex');
const log = (status, msg) => console.log(`${status.padEnd(8)} ${msg}`);

function upsertBlock(file, body) {
  mkdirSync(dirname(file), { recursive: true });
  const block = `${START}\n${body.trim()}\n${END}\n`;
  const current = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const re = new RegExp(`${START}[\\s\\S]*?${END}\\n?`);
  const next = re.test(current) ? current.replace(re, block) : current + (current && !current.endsWith('\n\n') ? '\n' : '') + block;
  if (next === current) return log('ok', file);
  writeFileSync(file, next);
  log('updated', file);
}

const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', env: process.env });

function findCodex() {
  if (run('codex', ['--version']).status === 0) return 'codex';
  const base = join(process.env.LOCALAPPDATA ?? '', 'OpenAI', 'Codex', 'bin');
  if (!existsSync(base)) return null;
  const exes = readdirSync(base)
    .map((d) => join(base, d, process.platform === 'win32' ? 'codex.exe' : 'codex'))
    .filter(existsSync)
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return exes[0] ?? null;
}

// 1. Kit files
cpSync(kitSrc, kitDst, { recursive: true });
log('copied', `${kitSrc} -> ${kitDst}`);

// 2. Claude Code global instructions
upsertBlock(join(home, '.claude', 'CLAUDE.md'), '# ai-kit (Mem0 + contexto compartilhado)\n@~/.ai-kit/AGENTS.global.md');

// 3. Codex global instructions
upsertBlock(join(codexHome, 'AGENTS.md'), readFileSync(join(kitSrc, 'AGENTS.global.md'), 'utf8'));

// 4. Mem0 MCP server
if (run('claude', ['mcp', 'get', 'mem0']).stdout?.includes(MEM0_URL)) {
  log('ok', 'Claude Code MCP mem0 (user scope)');
} else {
  const r = run('claude', ['mcp', 'add', '--transport', 'http', '--scope', 'user', 'mem0', MEM0_URL, '--header', 'Authorization: Bearer ${MEM0_API_KEY}']);
  log(r.status === 0 ? 'added' : 'FAILED', `Claude Code MCP mem0 ${r.status === 0 ? '' : r.stderr}`);
}

const codex = findCodex();
if (!codex) {
  log('SKIPPED', `Codex CLI not found; add to ${join(codexHome, 'config.toml')}:\n[mcp_servers.mem0]\nurl = "${MEM0_URL}"\nbearer_token_env_var = "MEM0_API_KEY"`);
} else if (run(codex, ['mcp', 'get', 'mem0']).status === 0) {
  log('ok', 'Codex MCP mem0');
} else {
  const r = run(codex, ['mcp', 'add', 'mem0', '--url', MEM0_URL, '--bearer-token-env-var', 'MEM0_API_KEY']);
  log(r.status === 0 ? 'added' : 'FAILED', `Codex MCP mem0 ${r.status === 0 ? '' : r.stderr}`);
}

// API key presence (value never printed)
let hasKey = Boolean(process.env.MEM0_API_KEY);
if (!hasKey && process.platform === 'win32') hasKey = /MEM0_API_KEY/.test(run('reg', ['query', 'HKCU\\Environment', '/v', 'MEM0_API_KEY']).stdout ?? '');
log(hasKey ? 'ok' : 'MISSING', 'MEM0_API_KEY (create at app.mem0.ai > API Keys; store as a user environment variable)');
console.log('\nRestart Claude Code and Codex to load the changes. In each project: node "$HOME/.ai-kit/bin/ai-init.mjs"');
