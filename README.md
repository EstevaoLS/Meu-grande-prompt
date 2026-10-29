# Meu-grande-prompt — ai-kit

Memória compartilhada entre **Claude Code** e **OpenAI Codex** usando **Mem0**, com contexto operacional em arquivos do repositório e GitHub como fonte oficial. Instala uma vez e vale para todos os projetos.

| Camada | O que guarda | Onde |
|---|---|---|
| Mem0 (MCP hospedado) | Decisões, convenções, preferências, soluções reutilizáveis | Nuvem Mem0, isolado por `app_id` |
| Arquivos locais | Estado atual e histórico do trabalho | `AI_CONTEXT.md`, `AI_PROGRESS.md`, `docs/ai/` |
| Git/GitHub | Código e histórico oficial | Repositório |

## Instalação (uma vez por máquina)

1. Crie uma chave em [app.mem0.ai](https://app.mem0.ai) → **API Keys** e salve-a como variável de ambiente do usuário `MEM0_API_KEY` (Windows: "Editar as variáveis de ambiente para sua conta"). Nunca a coloque em arquivos.
2. Clone este repositório e rode:
   ```bash
   node install.mjs
   ```
3. Reinicie o Claude Code e o Codex.

O instalador é idempotente (rode de novo após `git pull`) e só altera blocos `<!-- ai-kit:start/end -->`:

| Destino | Conteúdo |
|---|---|
| `~/.ai-kit/` | Protocolo (`AGENTS.global.md`), scripts e templates |
| `~/.claude/CLAUDE.md` | `@~/.ai-kit/AGENTS.global.md` |
| `~/.codex/AGENTS.md` | Cópia do protocolo (o Codex não tem imports) |
| Claude Code (escopo user) | MCP `mem0` → `https://mcp.mem0.ai/mcp`, header `Authorization: Bearer ${MEM0_API_KEY}` |
| Codex (`~/.codex/config.toml`) | MCP `mem0`, `bearer_token_env_var = "MEM0_API_KEY"` |

## Em cada projeto (novo ou existente)

```bash
node ~/.ai-kit/bin/ai-init.mjs
```

Cria só o que falta: `AGENTS.md` (ou anexa o bloco ai-kit ao existente), `CLAUDE.md` (ou anexa `@AGENTS.md`), `AI_PROGRESS.md`, `AI_CONTEXT.md`, `docs/ai/tasks/`, `docs/ai/reports/`. O `app_id` do Mem0 vem do nome do repositório `origin` (ou da pasta) e fica gravado no `AGENTS.md`; use `--app-id <nome>` para escolher outro.

## Ferramentas

| Comando | Uso |
|---|---|
| `node ~/.ai-kit/bin/ai-report.mjs docs/ai/tasks/<t>.md` | Gera `docs/ai/reports/<t>.pdf` (Edge/Chrome headless) |
| `node ~/.ai-kit/bin/mem0-check.mjs tools` | Testa a conexão com o Mem0 e lista as ferramentas |
| `node ~/.ai-kit/bin/mem0-check.mjs call <tool> '<json>'` | Chama uma ferramenta (ex.: `delete_memory`) |

## Escopo das memórias

- `user_id = estevaols` em tudo; `app_id = <projeto>` ou `global`; `metadata.source = claude-code | codex`.
- Busca padrão: `{"AND": [{"user_id": "estevaols"}, {"app_id": {"in": ["<projeto>", "global"]}}]}`.
- O isolamento entre projetos é **lógico (filtros)**: a mesma chave lê todas as memórias da conta. Para isolamento forte (ex.: projeto de cliente), use um projeto Mem0 separado com outra chave.

## Por que MCP e não os plugins oficiais

Os plugins Mem0 para Claude Code e Codex capturam a conversa automaticamente por hooks (mensagens, respostas, arquivos alterados). Este kit exige gravação curada, então usa só o MCP hospedado, com o mesmo servidor e a mesma chave nas duas ferramentas. Não instale o plugin junto: ele registra outro servidor `mem0` e duplica a função.
