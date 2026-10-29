# AI_PROGRESS.md

Histórico acumulado (somente acrescentar). Formato por entrada:
`## AAAA-MM-DD — agente — tarefa` seguido de resultado, testes, decisões e próximo passo em poucas linhas.

## 2026-10-28 — ai-kit — inicialização
- Arquivos de contexto criados por `ai-init.mjs`. Mem0 app_id: `meu-grande-prompt`.

## 2026-10-28 — claude-code — ai-kit: memória compartilhada Mem0 (Claude Code + Codex)
- Kit global: `install.mjs` → `~/.ai-kit`, instruções globais (`~/.claude/CLAUDE.md` import, `~/.codex/AGENTS.md` bloco), MCP `mem0` hospedado nas duas ferramentas com `MEM0_API_KEY`.
- Por projeto: `ai-init.mjs` (não sobrescreve); PDF: `ai-report.mjs`; diagnóstico: `mem0-check.mjs`.
- Decisões: MCP em vez de plugins (captura automática); `user_id=estevaols`, `app_id` por projeto ou `global`, `metadata.source`; `infer:false`.
- Testes: Claude Code (`claude -p`) gravou; Codex (`codex exec`) leu; isca de outro projeto excluída; memórias de teste removidas. Detalhes: `docs/ai/tasks/mem0-shared-memory-setup.md`.
- Próximo: rodar `ai-init.mjs` nos projetos existentes; reiniciar Claude Code e Codex.
