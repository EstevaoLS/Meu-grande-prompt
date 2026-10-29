#!/usr/bin/env node
// Smoke test for the hosted Mem0 MCP server (no dependencies, Node 18+).
// Reads the key from MEM0_API_KEY and never prints it.
//
//   node ~/.ai-kit/bin/mem0-check.mjs tools                 # list tools and their fields (* = required)
//   node ~/.ai-kit/bin/mem0-check.mjs schema <tool>         # full input schema of one tool
//   node ~/.ai-kit/bin/mem0-check.mjs call <tool> '<json>'  # call one tool
//
// MEM0_MCP_URL overrides the endpoint (default https://mcp.mem0.ai/mcp).

const url = process.env.MEM0_MCP_URL || 'https://mcp.mem0.ai/mcp';
const key = process.env.MEM0_API_KEY;
if (!key) {
  console.error('MEM0_API_KEY is not set in this process.');
  process.exit(2);
}

let sessionId;
let nextId = 1;

async function rpc(method, params, isNotification = false) {
  const body = { jsonrpc: '2.0', method, params };
  if (!isNotification) body.id = nextId++;
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${key}`,
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  sessionId = res.headers.get('mcp-session-id') || sessionId;
  if (isNotification) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  // Streamable HTTP may answer with plain JSON or an SSE stream.
  const payloads = res.headers.get('content-type')?.includes('text/event-stream')
    ? text.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim())
    : [text];
  for (const p of payloads) {
    const msg = JSON.parse(p);
    if (msg.id === body.id) {
      if (msg.error) throw new Error(JSON.stringify(msg.error));
      return msg.result;
    }
  }
  throw new Error('No JSON-RPC response found');
}

const [cmd = 'tools', tool, args = '{}'] = process.argv.slice(2);

try {
  const init = await rpc('initialize', {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: { name: 'mem0-mcp-check', version: '1.0.0' },
  });
  await rpc('notifications/initialized', {}, true);
  console.log(`connected: ${init.serverInfo?.name} ${init.serverInfo?.version ?? ''}`.trim());

  if (cmd === 'tools') {
    const { tools } = await rpc('tools/list', {});
    for (const t of tools) {
      const props = t.inputSchema?.properties ?? {};
      const req = new Set(t.inputSchema?.required ?? []);
      const fields = Object.keys(props).map((k) => (req.has(k) ? `${k}*` : k)).join(', ');
      console.log(`- ${t.name}(${fields})`);
    }
  } else if (cmd === 'schema') {
    const { tools } = await rpc('tools/list', {});
    console.log(JSON.stringify(tools.find((t) => t.name === tool), null, 2));
  } else if (cmd === 'call') {
    const result = await rpc('tools/call', { name: tool, arguments: JSON.parse(args) });
    for (const c of result.content ?? []) console.log(c.type === 'text' ? c.text : JSON.stringify(c));
    if (result.isError) process.exitCode = 1;
  } else {
    console.error(`unknown command: ${cmd}`);
    process.exitCode = 2;
  }
} catch (err) {
  console.error(`FAILED: ${err.message}`);
  // exitCode instead of exit(): avoids a libuv assertion on Windows with open sockets.
  process.exitCode = 1;
}
