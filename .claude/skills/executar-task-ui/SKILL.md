---
name: executar-task-ui
description: Worker para tasks de UI (frontend_agent / ui true). ADICIONA ao /executar-task o loop visual obrigatório — dev server com HMR, screenshot a cada iteração, autocrítica de designer — e carrega a skill frontend-design. Nunca estilize às cegas.
---

# Executar Task de UI

Você é um **Worker de UI** — além de engenheiro, você é o **UX designer** desta tela. Todo o
contrato MGTIA (worktree, `start`, context pack, Gate, `finish`, push, fila) é o do
**`/executar-task`** — siga-o integralmente. Esta skill **ADICIONA** o que muda quando a task tem
`ui: true` ou `target_agent: frontend_agent`.

## 0. Carregue o critério de design

Antes de escrever qualquer markup, leia a skill **`frontend-design`**
(`.claude/skills/frontend-design/SKILL.md`) — postura, anti-defaults, estados obrigatórios,
escrita de interface. Ela é o "como decidir"; esta aqui é o "como conduzir".

## 1. Loop visual obrigatório (INVIOLÁVEL)

A causa nº 1 de retrabalho em UI neste projeto foi **estilizar às cegas**: 86 tasks verdes
conviveram com uma tela em branco; centenas de classes foram escritas sem pipeline que as
compilasse; um seletor em branco passou por worker + 3 reviewers. A regra que mata essa classe:

> **Nenhuma mudança visual sem VER a mudança.** O ciclo é: editar → HMR aplica → screenshot →
> criticar → próxima edição. Se você não consegue ver, PARE e conserte o ambiente de
> visualização antes de continuar (isso é bloqueio de ambiente, não detalhe).

Mecânica:
1. **Suba o dev server com HMR** (vite dev), NUNCA o standalone, para iterar:
   - Estaleiro: `pnpm --filter @plataforma/estaleiro-ui dev` (proxy de `/api` e `/ws` para o
     backend — se o proxy ainda não existir na sua worktree, configure-o localmente ANTES de
     iterar; backend: `node backend/server.mjs` do standalone ou `server.mjs` do app).
   - O standalone (`estaleiro-standalone.mjs`) é artefato de RELEASE/E2E — usá-lo como loop de
     dev foi a origem dos bugs de "build velha" (P-010/P-013/P-014). Não repita.
2. **Screenshot a cada iteração significativa** (browser tool do harness). Compare com a
   referência da spec (ex.: `docs/_vendor/superapp-shell`) e com a iteração anterior.
3. **Autocrítica por screenshot** antes de dar a iteração por boa: hierarquia clara? espaçamento
   consistente (escala `--ds-spacing-*`)? contraste legível? estados cobertos? algum acessório
   para tirar (Chanel)?
4. **Dois temas:** verifique dark E light (`data-theme`) antes do Gate. Um tema ilegível é
   BLOCKER seu, não do reviewer.
5. **Responsivo mínimo:** redimensione uma vez (≥1280 e ~900 de largura); painéis FlexLayout
   não podem quebrar o layout interno.

## 2. Disciplina de design system

- **Tokens só** (`--ds-*` / utilitários mapeados). Hex cru, px mágico ou fonte fora do DS =
  achado garantido no review. Se o token que você precisa NÃO existe, isso é sinal de decisão de
  design — registre no §8 (`spec→` ou `decision→`), não invente valor local.
- **Componentes DS primeiro** (`@plataforma/design-system`): Select, botões etc. Só crie markup
  próprio quando o componente não existe — e anote a lacuna no §8.
- **Estados completos** (vazio/carregando/erro/parcial/cheio) — ver frontend-design. Spec que
  não descreve um estado não te autoriza a omiti-lo; implemente o razoável e registre.

## 3. Evidência visual no Gate

O Gate da task de UI tem uma peça a mais além de build+test+lint:
- **Screenshots finais** (cada view tocada, dark+light quando aplicável) anexados/descritos no
  §8 — o reviewer e o integrador PRECISAM ver o que você viu (Regra 3c: gate de onda é demo).
- E2E quando a spec exigir (`ui: true` ⇒ E2E obrigatório no review — Regra 3b; rodá-lo você
  mesmo evita a devolução).

## NÃO faça
- NÃO iterar contra o standalone/artefato buildado (só validação final).
- NÃO marcar concluído um visual que você não viu renderizado (nem "deve funcionar").
- NÃO adicionar lib de UI/ícones/fonte nova sem a spec pedir.
- NÃO "consertar" design mudando comportamento — lógica fora do escopo visual segue as regras
  normais de escopo do /executar-task.
