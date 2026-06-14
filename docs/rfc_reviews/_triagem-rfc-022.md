# Triagem — rfc-022 (Workflow e Orquestração de Processos)

> Fonte: `docs/rfcs/rfc-022-workflow.md` + `docs/rfc_reviews/review_rfc-022.md`
> Manifesto de triagem — não edita a RFC. Cada achado tem exatamente um veredito.

## Contagens por veredito

| Veredito | Qtd |
| :--- | :---: |
| INCORPORAR | 2 |
| JA-COBERTO | 4 |
| UI->INVENTARIO | 6 |
| REJEITAR | 0 |
| REVISAR-HUMANO | 2 |
| **Total de achados** | **14** |

## ⚠️ REVISAR-HUMANO (destaque — decisão arquitetural pendente)

- **022-01 — Recuperação durável/distribuída de deadlines HLC em P2P (review §2; audit L-01, HIGH).**
  A RFC §A.2 lista "Deadline HLC" como primitiva de timers e §A.4 dispara transições por
  deadline, mas **não especifica** como um timer é ressuscitado se o peer orquestrador despencar.
  Tensão: para liveness, o `deadline` precisaria ser fato/projeção durável e distribuída (recuperável
  por outro peer); mas §A.1.3 afirma "orquestrador = liveness, nunca safety / sem super-peer". Definir
  o mecanismo de recuperação (publicação global do deadline como fato vs. projeção replicada vs.
  re-derivação no fold) é arquitetural e cruza a disciplina de event sourcing — não redigir norma aqui.

- **022-13 — Colisão de numeração: slot `caderno-3-sdk/22-*` (audit O-02).**
  §A.1 cria `caderno-3-sdk/22-workflow-reference-spec.md`, mas o slot 22 do caderno-3 já é reivindicado
  pela rfc-021. Conflito de numeração entre RFCs — decisão de renumeração/realocação de slot é humana;
  não escolher número novo unilateralmente na triagem.

## Tabela de achados

| id | achado (review §) | veredito | destino (A.N / arquivo) | texto-proposto ou nota | status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 022-01 | Recuperação de deadlines HLC se um peer cai (§2; L-01 HIGH) | REVISAR-HUMANO | A.2 / A.9 (tensão) | Ver destaque acima — recuperação durável/distribuída de timer vs. "sem super-peer / orquestrador só liveness". Arquitetural. | [x] |
| 022-02 | Versionamento de instâncias in-flight quando SPEC:WORKFLOW sofre supersede (§2; L-05 médio) | INCORPORAR | A.1 (acrescentar item 4) | "**Pin de versão por instância.** Uma instância de workflow executa até o fim sob a versão de `SPEC:WORKFLOW` sob a qual nasceu; um supersede da SPEC **não** migra instâncias in-flight nem re-funde eventos passados sobre a nova máquina. Novas instâncias usam a versão vigente. A versão de origem é parte da linhagem da instância e é resolvida no fold." | [x] |
| 022-03 | Escalonamento de tarefa humana presa (aprovador ausente/demitido) (§2; L-06 baixo) | INCORPORAR | A.4 (acrescentar bullet) | "**Escalonamento de tarefa humana.** Um estado que aguarda `APPROVED_BY` declara um deadline HLC de escalonamento; ao expirar sem aprovação, a transição de timeout encaminha a tarefa ao alvo de fallback declarado na SPEC (ex.: `root`/supervisor) ou a um estado de exceção. Assim um aprovador inexistente nunca tranca a saga indefinidamente — herda a mecânica de timer do Nível 1." | [x] |
| 022-04 | Construir workflow sobre event sourcing do grafo dispensa Temporal/Cadence (§1 validação) | JA-COBERTO | — | RFC já é a tese central (§A.1.2, A.2, decisão de entrada). Validação, sem norma nova. | [x] |
| 022-05 | Rampa Nível 1 (~90%) → Nível 2 (Harel/SCXML) sem sobrecarga prematura (§1 validação) | JA-COBERTO | — | Coberto por A.4–A.7 (níveis, subconjunto estrito, orçamento de migração). | [x] |
| 022-06 | Estado da máquina NÃO vai ao grafo; reconstruído por fold dos eventos (§4) | JA-COBERTO | — | Coberto literalmente por A.1.2 e A.9.1 (projeção, nunca nó mutável replicado). Apenas descreve a RFC. | [x] |
| 022-07 | Ciclo de vida: nascimento por intent raiz, mutação por evento na ponta, fim em Final/Terminated com log arquivado (§5) | JA-COBERTO | — | Coberto por A.1.2/A.1.3 (orquestrador dispara, estado é projeção) e A.9.1 (disciplina da saga). Descritivo. | [x] |
| 022-08 | Editor visual de workflow (arrastar setas → DSL/JSON da spec) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Organismo · `VisualWorkflowEditor` (ReactFlow/Flow; arrasto → DSL `SPEC:WORKFLOW`) · módulo Workflow. Nota: A.8.2 já remete edição visual rica a componente de página RFC-008 — inventariar como organismo do módulo. | [x] |
| 022-09 | Trilha de auditoria "Metrô/Caminho" das etapas percorridas pela instância (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Organismo · `WorkflowInstanceAuditLog` (lista cronológica de transições + outputs Zen; vista "metrô") · módulo Workflow. | [x] |
| 022-10 | Atoms de workflow: StatusStepIndicator, TimerCountdownBadge, TransitionArrow (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Átomos · `StatusStepIndicator`, `TimerCountdownBadge`, `TransitionArrow` · módulo Workflow. | [x] |
| 022-11 | Molecule WorkflowNodeBox (caixa de estado no diagrama) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Molécula · `WorkflowNodeBox` (nó de estado com destaque do estado ativo) · módulo Workflow. | [x] |
| 022-12 | Molecule ApprovalRequestBanner (tarefa humana pausando a saga) (§3) | UI->INVENTARIO | inventario-componentes-layouts.md | Molécula · `ApprovalRequestBanner` (solicitação `APPROVED_BY` pausando a instância) · módulo Workflow. | [x] |
| 022-13 | Colisão de slot caderno-3-sdk/22-* com rfc-021 (audit O-02) | REVISAR-HUMANO | A.1 (numeração) | Ver destaque acima — conflito de numeração entre RFCs. Decisão humana de renumeração. | [x] |
| 022-14 | Visualização Mermaid pura para processos gerais (§3) | JA-COBERTO | — | Coberto por A.8 (geração Mermaid determinística, `stateDiagram-v2`; Mermaid é vista, não modelo). | [x] |
