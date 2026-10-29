# Protocolo global de memória e contexto (ai-kit)

Vale para Claude Code e Codex em todos os projetos. Regras do `AGENTS.md` do projeto prevalecem em caso de conflito.
O código e o Git são a referência oficial; memórias e arquivos de contexto são pistas a confirmar.
Os agentes não compartilham conversas: a troca acontece só pelo Mem0 e pelos arquivos do repositório.

## Identidade no Mem0 (MCP `mem0`)
- `user_id`: sempre `estevaols`, em toda gravação e busca.
- `app_id` do projeto: o valor declarado no `AGENTS.md` do projeto (linha `Mem0 app_id:`). Sem declaração: nome do repositório do remoto `origin` em minúsculas, com caracteres não alfanuméricos trocados por `-`; sem remoto: nome da pasta no mesmo formato.
- `app_id` `global`: aprendizados úteis em qualquer projeto (preferências, técnicas, soluções genéricas).
- `metadata`: `{"source": "claude-code" | "codex", "type": "decision" | "convention" | "preference" | "solution" | "pending"}`.
- Não use `agent_id` para identificar o agente (o Mem0 não combina `user_id` e `agent_id` num mesmo registro).

## Antes de trabalhar
1. Leia o `AGENTS.md` do projeto e `AI_CONTEXT.md`; leia `AI_PROGRESS.md` só se precisar de histórico.
2. Verifique `git status` e `git log --oneline -5`.
3. Se a tarefa depende de decisões anteriores, faça **uma** busca `search_memories` com consulta específica, `top_k` ≤ 5 e
   `filters: {"AND": [{"user_id": "estevaols"}, {"app_id": {"in": ["<app_id>", "global"]}}]}`.
   Tarefas triviais dispensam a busca. Não repita a mesma busca na tarefa.
4. Confirme no código, no diff e na documentação atual o que a memória sugerir.
5. Projeto do usuário sem `AI_CONTEXT.md`: rode `node ~/.ai-kit/bin/ai-init.mjs` na raiz (cria só o que falta, não sobrescreve). Em repositórios de terceiros, pergunte antes.

## Durante o trabalho
- Atualize `AI_CONTEXT.md` quando o contexto mudar de forma relevante.
- Preserve decisões e alterações de outros agentes; nunca reverta trabalho alheio.
- Não registre hipóteses como fatos; não interrompa tarefas simples para gravar memórias de baixo valor.

## Ao concluir uma tarefa relevante
1. **Mem0** — grave com `add_memory` só fatos duradouros: decisão arquitetural, convenção, preferência, solução de problema difícil, pendência importante.
   Uma ideia por memória, 1–3 frases autocontidas, em `text`, com `user_id`, `app_id`, `metadata` e `infer: false` (grava exatamente o texto curado).
   Decisão substituída: localize a antiga e use `update_memory` ou `delete_memory`; não grave uma contraditória.
2. **`AI_PROGRESS.md`** — acrescente uma entrada curta e datada (tarefa, resultado, testes, próximo passo).
3. **`AI_CONTEXT.md`** — substitua todo o conteúdo pelo estado atual (≤ 40 linhas).
4. **Documentação** — `docs/ai/tasks/<tarefa>.md` (objetivo, implementação, arquivos alterados, decisões, testes e resultados, limitações e pendências) e o PDF:
   `node ~/.ai-kit/bin/ai-report.mjs docs/ai/tasks/<tarefa>.md` → `docs/ai/reports/<tarefa>.pdf`. Confirme que o PDF foi gerado antes de citá-lo. Alterações triviais dispensam documentação.
5. **Git** — rode os testes, `git status`, `git fetch`, revise o diff, adicione só os arquivos da tarefa, commit curto e push pelo remoto SSH. Siga o fluxo do projeto se ele exigir branch ou PR.

## Nunca
- Gravar no Mem0: código, logs, diffs, conteúdo de arquivos, conversas completas, segredos (chaves, tokens, senhas, `.env`, chaves SSH), dados pessoais ou de clientes, fatos já evidentes no código. O Mem0 é um serviço externo: na dúvida, não grave.
- `force push` sem autorização explícita; commitar segredos ou configs locais; descartar ou sobrescrever trabalho de terceiros. Em conflito, falha de autenticação ou risco de perda de dados: pare e informe.
- Desativar proteções ou contornar autenticação.

## Mem0 indisponível
Continue só com os arquivos locais e anote a falha em `AI_CONTEXT.md`. Diagnóstico: `node ~/.ai-kit/bin/mem0-check.mjs tools`.

## Economia de tokens
Leia só o necessário, prefira resumos, não recarregue arquivos grandes, evite verificações redundantes e não crie arquivos com a mesma finalidade.
