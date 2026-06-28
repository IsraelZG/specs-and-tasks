---
id: T-DS-05
title: "Identidade visual: paleta + accent por módulo + escalas (raio/borda/elevação) + claro/escuro"
status: draft
complexity: 5
target_agent: frontend_agent
reviewer_agent: agile_reviewer
execution_mode: sequential
ui: true
dependencies: ["T-011"]
blocks: ["T-DS-01", "T-DS-03"]
---

# T-DS-05 · Identidade visual: paleta + accent por módulo + escalas + claro/escuro

> **Tipo: spike de design** (entregável = ADR + tokens + tabela de opções). Tem decisões em aberto
> por natureza — o objetivo é **gerar opções e fechá-las**, não implementar contra uma decisão pronta.
> Precede T-DS-01/03 (os tokens importados/portados devem já conter este sistema).

## 0. Ambiente de Execução Obrigatório
- **Runtime:** Node.js v20+ / browser
- **Package Manager:** `pnpm`
- **Build de tokens:** Style Dictionary (já no protótipo do design-system)
- **Capacidade-alvo:** opus-spike

## 1. Objetivo
Definir o **sistema de identidade visual** do produto, estendendo os tokens do design-system, e
entregá-lo como ADR + tokens versionados. Decisões a fechar:
1. **Accent por módulo** — cada módulo (social, marketplace, fintech, office/ERP, mensageria, …) tem
   um **accent próprio** (matiz distinta), aplicado via a customização hierárquica já existente
   (`data-ds-module`, caderno-3-sdk/09). O accent é **um token semântico** (`--ds-accent-*`), não cor literal.
2. **Claro/escuro preservando o accent** — o mesmo accent percebido nos dois modos (mesma matiz/croma
   percebidos), com passos de contraste seguros (AA) derivados, não escolhidos à mão.
3. **Escalas** — raio de borda (ex.: 0/4/8/12/16), espessura de borda (0.5/1/2), e **elevação**
   (a proposta do design-system marcou "contraste como gate de runtime" como falha — definir elevação
   por token, sem gate de runtime).
4. **Neutros** — rampa de cinzas para superfícies/texto, claro/escuro.

## 2. Contexto RAG
- [design-system-proposal.md](../docs/rfcs/design-system-proposal.md) — 4 camadas de token, override escopado por atributo, falhas a evitar (refs achatadas, contraste como gate de runtime, repo errado)
- [caderno-3-sdk/10-design-system.md](../docs/caderno-3-sdk/10-design-system.md) — design system canônico (RFC-006)
- [caderno-3-sdk/09-hierarchical-theme-customization.md](../docs/caderno-3-sdk/09-hierarchical-theme-customization.md) — customização app→módulo→página→componente
- [caderno-3-sdk/04-theme-and-i18n-data-structures.md](../docs/caderno-3-sdk/04-theme-and-i18n-data-structures.md) — tema como dado; usuário força contraste/a11y localmente
- [diretrizes-ux.md](../docs/diretrizes-ux.md) §8/§9 (a11y AA, só tokens)

## 3. Escopo de Arquivos (entregáveis)
- **[CREATE]** `docs/adrs/adr-00X-identidade-visual.md` — decisões + opções comparadas + tooling escolhido
- **[CREATE/UPDATE]** `packages/design-system/tokens/` — `--ds-accent-*` por módulo, neutros, escalas de raio/borda/elevação, claro+escuro
- **[CREATE]** amostra/preview (Storybook/showcase ou página estática) provando accent+modo por módulo
- **[UPDATE]** `caderno-3-sdk/10-design-system.md` — nota do sistema de accent por módulo (se normativo)

## 4. Estratégia (gerar OPÇÕES, depois fechar)
Produza, para o arquiteto escolher, **2–3 opções** de cada eixo, com preview lado a lado:
- **Paleta/accents:** rampas perceptualmente uniformes — recomenda-se gerar em **OKLCH/HCT** para que
  o accent mantenha matiz/croma entre claro/escuro e os passos sejam contraste-seguros por construção.
  Ferramentas a avaliar: **Radix Colors**, **Leonardo (Adobe)**, **Huetone**, **Material HCT**,
  Tailwind v4 (oklch), `oklch.com`. (Não inventar hex à mão — derivar.)
- **Mapa módulo→accent:** proposta inicial (ajustável): social=índigo, marketplace=âmbar/verde,
  fintech=teal, office=azul, mensageria=violeta, mapa=verde, streaming=coral. Validar distinção e a11y.
- **Raio/borda/elevação:** 2–3 conjuntos (ex.: "suave 12px" vs "neutro 8px" vs "rígido 4px"), com
  exemplos em card/modal/botão.
- **Verificação:** contraste AA de texto/UI em todos os accents, claro e escuro (ferramenta automatizada).

## 5. Instruções de Execução
1. Levante o que o protótipo já entrega (não reimplementar — ver design-system-proposal §1).
2. Gere as rampas em OKLCH/HCT por ferramenta; exporte via Style Dictionary.
3. Monte o preview comparativo (accent × modo × módulo) e a verificação de contraste.
4. Escreva o ADR com a recomendação e as alternativas; deixe a escolha final marcada como decisão do arquiteto.

## 6. Feedback de Especificação
> **DECISÕES EM ABERTO (a fechar neste spike, com opções):** paleta/accents exatos; mapa módulo→accent;
> escala de raio; espessuras de borda; modelo de elevação/sombra; rampa de neutros. NÃO fixar sem
> preview comparativo e verificação de contraste. Nome/identidade da marca (logo, wordmark) é correlato
> mas pode ser task separada — ver decisão de **nome da rede** em aberto.

## 7. DoD & Reviewer Checklist
### Gate de Evidência
```bash
pnpm --filter @plataforma/design-system build   # Style Dictionary gera os tokens sem erro
```
### Checklist
- [ ] ADR com ≥2 opções por eixo + recomendação?
- [ ] `--ds-accent-*` por módulo, claro+escuro, accent preservado?
- [ ] Escalas de raio/borda/elevação tokenizadas (sem literal)?
- [ ] Contraste AA verificado (automatizado) em todos os accents/modos?
- [ ] Preview comparativo presente?

## 8. Log de Handover e Revisão Agile
### Handover do Executor:
-
### Parecer do Agente Revisor:
- [ ] **Aprovado**
- [ ] **Requer Refatoração**
- **Evidência:**
```
(saída do build de tokens + link/print do preview)
```

## 9. Log de Execução
> **Agentes de IA:** Registrem aqui cada sessão usando `node tools/scripts/manage-task.mjs`.
