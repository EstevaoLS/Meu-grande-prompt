#!/usr/bin/env node
// Prepares a project for the ai-kit protocol. Creates only what is missing; never overwrites.
//
//   node ~/.ai-kit/bin/ai-init.mjs [project-dir] [--app-id <id>]
//
// Existing AGENTS.md gets the ai-kit block appended (once); existing CLAUDE.md gets `@AGENTS.md` appended (once).

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const appIdFlag = args.indexOf('--app-id');
const explicitAppId = appIdFlag >= 0 ? args.splice(appIdFlag, 2)[1] : null;
const root = resolve(args[0] ?? '.');
const templates = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');

const slug = (s) => s.toLowerCase().replace(/\.git$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function detectAppId() {
  if (explicitAppId) return slug(explicitAppId);
  const agents = join(root, 'AGENTS.md');
  if (existsSync(agents)) {
    const m = readFileSync(agents, 'utf8').match(/Mem0 app_id:\s*`?([\w.-]+)`?/);
    if (m) return m[1];
  }
  try {
    const remote = execFileSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (remote) return slug(remote.split(/[/:]/).pop());
  } catch {}
  return slug(basename(root));
}

const appId = detectAppId();
const today = new Date().toLocaleDateString('sv-SE');
const fill = (name) =>
  readFileSync(join(templates, name), 'utf8')
    .replaceAll('{{APP_ID}}', appId)
    .replaceAll('{{PROJECT}}', basename(root))
    .replaceAll('{{DATE}}', today);
const log = (status, file) => console.log(`${status.padEnd(9)} ${file}`);

function createIfMissing(file, template) {
  const path = join(root, file);
  if (existsSync(path)) return log('exists', file);
  writeFileSync(path, fill(template));
  log('created', file);
}

// AGENTS.md: create, or append the ai-kit block to the user's existing file.
const agentsPath = join(root, 'AGENTS.md');
const block = fill('ai-kit-block.md');
if (!existsSync(agentsPath)) {
  writeFileSync(agentsPath, fill('AGENTS.md') + '\n' + block);
  log('created', 'AGENTS.md');
} else if (!readFileSync(agentsPath, 'utf8').includes('<!-- ai-kit:start -->')) {
  appendFileSync(agentsPath, '\n' + block);
  log('appended', 'AGENTS.md (ai-kit block)');
} else {
  log('exists', 'AGENTS.md');
}

// CLAUDE.md: Claude Code does not read AGENTS.md by itself, so import it.
const claudePath = join(root, 'CLAUDE.md');
if (!existsSync(claudePath)) {
  writeFileSync(claudePath, fill('CLAUDE.md'));
  log('created', 'CLAUDE.md');
} else if (!/^@AGENTS\.md\s*$/m.test(readFileSync(claudePath, 'utf8'))) {
  appendFileSync(claudePath, '\n@AGENTS.md\n');
  log('appended', 'CLAUDE.md (@AGENTS.md)');
} else {
  log('exists', 'CLAUDE.md');
}

createIfMissing('AI_PROGRESS.md', 'AI_PROGRESS.md');
createIfMissing('AI_CONTEXT.md', 'AI_CONTEXT.md');
for (const dir of ['docs/ai/tasks', 'docs/ai/reports']) {
  mkdirSync(join(root, dir), { recursive: true });
  const keep = join(root, dir, '.gitkeep');
  if (!existsSync(keep)) writeFileSync(keep, '');
}
log('ok', 'docs/ai/tasks, docs/ai/reports');
console.log(`\nMem0 app_id: ${appId}`);
