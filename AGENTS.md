# AGENTS.md — Meu-grande-prompt (ai-kit)

Regras compartilhadas deste projeto para Claude Code e Codex. `CLAUDE.md` importa este arquivo.

## Projeto
- Objetivo: kit global de memória compartilhada (Mem0) e contexto operacional para Claude Code e Codex, reutilizável em qualquer projeto.
- Stack: Node.js 18+ (scripts `.mjs` sem dependências), Markdown.
- Comandos: `node install.mjs` (instala/atualiza em `~/.ai-kit`), `node kit/bin/ai-init.mjs <projeto>`, `node kit/bin/ai-report.mjs <tarefa.md>`, `node kit/bin/mem0-check.mjs tools`.

## Convenções
- `kit/` é a fonte; `~/.ai-kit/` é cópia instalada. Edite só `kit/` e rode `node install.mjs`.
- `kit/AGENTS.global.md` é a fonte única do protocolo; mantenha-o curto (é carregado em toda sessão).
- Scripts não podem sobrescrever conteúdo do usuário: só criar o que falta ou trocar blocos `<!-- ai-kit:start/end -->`.
- Nunca versionar chaves: `MEM0_API_KEY` vive só em variável de ambiente.

<!-- ai-kit:start -->
## Memória e contexto compartilhados (ai-kit)
- Mem0 app_id: `meu-grande-prompt`
- Protocolo: global, em `~/.ai-kit/AGENTS.global.md` (carregado automaticamente pelo Claude Code e pelo Codex).
- `AI_CONTEXT.md`: estado atual, substituir por inteiro. `AI_PROGRESS.md`: histórico, somente acrescentar.
- `docs/ai/tasks/<tarefa>.md`: documentação técnica. `docs/ai/reports/<tarefa>.pdf`: relatório (`node ~/.ai-kit/bin/ai-report.mjs`).
<!-- ai-kit:end -->
