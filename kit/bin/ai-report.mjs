#!/usr/bin/env node
// Renders a task Markdown file into a styled PDF using a local Edge/Chrome in headless mode.
//
//   node "$HOME/.ai-kit/bin/ai-report.mjs" docs/ai/tasks/<tarefa>.md [out.pdf]
//
// Default output: docs/ai/reports/<tarefa>.pdf next to the tasks folder. Set AI_REPORT_BROWSER to force a browser path.

import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync, rmSync, mkdtempSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const [input, output] = process.argv.slice(2);
if (!input) {
  console.error('usage: ai-report.mjs <task.md> [out.pdf]');
  process.exit(2);
}
const src = resolve(input);
const name = basename(src, '.md');
const out = resolve(output ?? join(dirname(src), '..', 'reports', `${name}.pdf`));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

// Minimal Markdown: headings, paragraphs, lists, tables, fenced code, quotes, rules.
function render(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const html = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const code = [];
      while (++i < lines.length && !/^```/.test(lines[i])) code.push(esc(lines[i]));
      html.push(`<pre><code>${code.join('\n')}</code></pre>`);
      i++;
    } else if (/^#{1,4} /.test(line)) {
      const level = line.match(/^#+/)[0].length;
      html.push(`<h${level}>${inline(line.slice(level + 1))}</h${level}>`);
      i++;
    } else if (/^\s*\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
      const body = rows.slice(2).map((r) => `<tr>${cells(r).map((c) => `<td>${c}</td>`).join('')}</tr>`);
      html.push(`<table><thead><tr>${cells(rows[0]).map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${body.join('')}</tbody></table>`);
    } else if (/^\s*([-*]|\d+\.) /.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i])) {
        const nested = /^\s{2,}/.test(lines[i]);
        const text = inline(lines[i].replace(/^\s*([-*]|\d+\.) /, ''));
        items.push(nested ? `<li class="sub">${text}</li>` : `<li>${text}</li>`);
        i++;
      }
      html.push(ordered ? `<ol>${items.join('')}</ol>` : `<ul>${items.join('')}</ul>`);
    } else if (/^> /.test(line)) {
      const quote = [];
      while (i < lines.length && /^> /.test(lines[i])) quote.push(inline(lines[i++].slice(2)));
      html.push(`<blockquote>${quote.join('<br>')}</blockquote>`);
    } else if (/^---+\s*$/.test(line)) {
      html.push('<hr>');
      i++;
    } else if (line.trim() === '') {
      i++;
    } else {
      const para = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(#|```|\s*\||\s*([-*]|\d+\.) |> )/.test(lines[i])) para.push(inline(lines[i++]));
      html.push(`<p>${para.join(' ')}</p>`);
    }
  }
  return html.join('\n');
}

let project = basename(resolve(dirname(src), '..', '..', '..'));
try {
  project = basename(execFileSync('git', ['-C', dirname(src), 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
} catch {}
const date = new Date().toLocaleDateString('sv-SE');

const page = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(name)}</title><style>
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #1f2933; font-size: 10.5pt; line-height: 1.5; margin: 0; }
header { border-bottom: 3px solid #2f5d8a; padding-bottom: 8px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: baseline; }
header .proj { font-size: 9pt; color: #52606d; text-transform: uppercase; letter-spacing: .08em; }
header .date { font-size: 9pt; color: #52606d; }
h1 { font-size: 19pt; color: #1b3a57; margin: 0 0 12px; line-height: 1.25; }
h2 { font-size: 13pt; color: #2f5d8a; margin: 20px 0 8px; padding-bottom: 3px; border-bottom: 1px solid #d9e2ec; break-after: avoid; }
h3 { font-size: 11pt; color: #1b3a57; margin: 14px 0 6px; break-after: avoid; }
p { margin: 0 0 8px; }
ul, ol { margin: 0 0 10px; padding-left: 20px; }
li { margin: 2px 0; }
li.sub { margin-left: 18px; list-style-type: circle; }
code { font-family: Consolas, "Courier New", monospace; font-size: 9pt; background: #f0f4f8; padding: 1px 4px; border-radius: 3px; }
pre { background: #f0f4f8; border-left: 3px solid #2f5d8a; padding: 8px 10px; white-space: pre-wrap; word-break: break-word; break-inside: avoid; }
pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; font-size: 9.5pt; break-inside: avoid; }
th { background: #2f5d8a; color: #fff; text-align: left; padding: 5px 8px; }
td { border-bottom: 1px solid #d9e2ec; padding: 5px 8px; vertical-align: top; }
tr:nth-child(even) td { background: #f7f9fb; }
blockquote { margin: 8px 0; padding: 6px 12px; border-left: 3px solid #9fb3c8; color: #52606d; background: #f7f9fb; }
a { color: #2f5d8a; }
hr { border: none; border-top: 1px solid #d9e2ec; margin: 14px 0; }
</style></head><body>
<header><span class="proj">${esc(project)} · relatório de tarefa</span><span class="date">${date}</span></header>
${render(readFileSync(src, 'utf8'))}
</body></html>`;

const candidates = [
  process.env.AI_REPORT_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/microsoft-edge',
].filter(Boolean);
const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error('No Edge/Chrome found. Set AI_REPORT_BROWSER to a Chromium-based browser executable.');
  process.exit(1);
}

const work = mkdtempSync(join(tmpdir(), 'ai-report-'));
const htmlPath = join(work, `${name}.html`);
writeFileSync(htmlPath, page);
mkdirSync(dirname(out), { recursive: true });
try {
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-pdf-header-footer',
    `--user-data-dir=${join(work, 'profile')}`, `--print-to-pdf=${out}`, pathToFileURL(htmlPath).href,
  ], { stdio: 'ignore', timeout: 60000 });
} finally {
  rmSync(work, { recursive: true, force: true });
}

const ok = existsSync(out) && readFileSync(out).subarray(0, 5).toString() === '%PDF-';
if (!ok) {
  console.error(`PDF was not generated: ${out}`);
  process.exit(1);
}
console.log(`${out} (${Math.round(statSync(out).size / 1024)} KB)`);
