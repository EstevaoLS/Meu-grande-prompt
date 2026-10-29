# AI_CONTEXT.md

Cache curto do estado atual (substituir por inteiro a cada atualização; ≤ 40 linhas).

**Atualizado:** 2026-10-28 por claude-code
**Tarefa ativa:** nenhuma (ai-kit v1 concluído e publicado)

## Estado
- ai-kit instalado nesta máquina (`~/.ai-kit`); MCP `mem0` ativo no Claude Code (user) e no Codex.
- Fonte do protocolo: `kit/AGENTS.global.md`. Após editar `kit/`, rodar `node install.mjs`.
- Mem0: 2 memórias reais (decisão do kit em `meu-grande-prompt`, preferência em `global`).

## Próximos passos
- Aplicar `node ~/.ai-kit/bin/ai-init.mjs` nos projetos existentes.
- Opcional: Codex Cloud (definir `MEM0_API_KEY` como Environment Variable do ambiente).
